import React, {Component} from 'react';
import {Text, View, Keyboard, ActivityIndicator, FlatList, Alert, Dimensions, SafeAreaView} from 'react-native';
import firebase from 'react-native-firebase';
import {ListItem, Divider, Icon} from 'react-native-elements';
import Toast, {DURATION} from 'react-native-easy-toast';
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from 'moment';
import Modal from 'react-native-modal';
import Autocomplete from 'react-native-autocomplete-input';
import TextInput from 'react-native-material-textinput';
import {Toolbar} from "react-native-material-ui";

export default class Subscribe extends Component {
    COL_PHONES = 'phones';
    COL_QUERIES = 'sites';

    state = {
        loading: true,
        sites: [],
        selectedSite: '',
        selectedQuery: '',
        phone: '',
        isSaving: false,
        isLoading: true,
        subscriptions: [],
        startTime: '0',
        endTime: '0',
        isStartTimeVisible: false,
        isEndTimeVisible: false,
        showAddNewDialog: false,
        autocompleteText: '',
        data: [],
        queryText: '',
        siteText: '',
        hideList: true,
        fetchingSubscriptions: false,
        loadingState: '',
        listRefresh: false,
        hasNotificationPermission: false
    };

    queriesCollection = firebase.firestore().collection(this.COL_QUERIES);
    phonesCollection = firebase.firestore().collection(this.COL_PHONES);
    phones = '';
    sitesArr = [];
    allPhonesArr = [];
    subscriptionsArr = [];
    userPhone = firebase.auth().currentUser.phoneNumber;
    userName = firebase.auth().currentUser.displayName;

    componentDidMount() {
        this.setState({loadingState: 'Loading data...'});
        this.checkForNotifications();
        this.fetchTimes();
        this.fetchSubscriptions();
    }

    async checkForNotifications() {
        const hasPermission = await firebase.messaging().hasPermission();
        this.setState({hasNotificationPermission: hasPermission});
    }

    fetchTimes() {
        this.phonesCollection.doc(this.userPhone).get().then((snapshot) => {
            this.setState({
                startTime: moment.utc(snapshot.get('startTime'), "YYYYMMDDHHmm").local().format("YYYYMMDDHHmm"),
                endTime: moment.utc(snapshot.get('endTime'), "YYYYMMDDHHmm").local().format("YYYYMMDDHHmm")
            });
            return Promise.resolve();
        }).catch(err => {
            console.log(err);
            return Promise.reject(err);
        });
    }

    fetchSubscriptions() {
        this.setState({fetchingSubscriptions: true});

        this.subscriptionsArr = [];
        this.sitesArr = [];
        this.queriesCollection.get().then((snapshot) => {
            snapshot.docs.forEach((doc) => {
                this.sitesArr.push(doc.id);
                Object.keys(doc._data).forEach((key) => {
                        this.allPhonesArr = doc._data[key].split('|');
                        this.allPhonesArr.forEach((phone) => {
                            if (phone === this.userPhone) {
                                this.subscriptionsArr.push({
                                    'site': doc._ref._documentPath._parts[1],
                                    'query': key
                                });
                            }
                        });
                    }
                );
            });
            this.setState({
                subscriptions: this.subscriptionsArr,
                isLoading: false,
                sites: this.sitesArr,
                phone: this.userPhone,
                isSaving: false,
                fetchingSubscriptions: false,
                listRefresh: false
            });
            return Promise.resolve();
        }).catch((err) => {
            console.log(err);
            return Promise.reject(err);
        });
    }

    save() {
        Keyboard.dismiss();
        if (!this.state.selectedQuery) {
            this.setState({queryErr: 'This cannot be empty', showAddNewDialog: true})
        } else if (!this.state.selectedSite) {
            this.setState({siteErr: 'You must choose a site', showAddNewDialog: true});
        } else {
            this.setState({
                queryErr: '',
                siteErr: '',
                isSaving: true
            });
            this.phones = '';
            this.queriesCollection.doc(this.state.selectedSite).get().then((result) => {
                Object.keys(result._data).forEach((key) => {
                        if (key === this.state.selectedQuery) {
                            this.phones = result._data[key];
                        }
                    }
                );
                const phonesArr = this.phones.split('|');
                let exist = false;
                phonesArr.forEach(phone => {
                    if (this.state.phone === phone) {
                        exist = true;
                        this.refs.toast.show('You have already subscribed for this query', 3000);
                        this.setState({selectedQuery: '', selectedSite: ''});
                    } else {
                        exist = false;
                    }
                });

                if (!exist) {
                    this.queriesCollection.doc(this.state.selectedSite).update({
                        [this.state.selectedQuery]: this.phones + '|' + this.state.phone
                    }).then(() => {
                        this.setState({isSaving: false, selectedSite: '', selectedQuery: ''});
                        this.fetchSubscriptions();
                        return Promise.resolve();
                    })
                        .catch(err => {
                            console.log(err);
                            return Promise.reject();
                        });
                }
                return Promise.resolve();
            }).catch((err) => {
                console.log(err);
                return Promise.reject(err);
            });
        }
    }

    delete(index, site, query) {
        let formattedPhones = '';
        this.queriesCollection.doc(site).get().then(doc => {
            Object.keys(doc._data).map(key => {
                if (key === query) {
                    let phones = doc.get(key).toString();
                    phones.split('|').map(phone => {
                        if (phone !== this.state.phone) {
                            formattedPhones = formattedPhones + '|' + phone;
                        }
                    });
                }
            });
            this.queriesCollection.doc(site).update({
                [query]: formattedPhones
            }).then(() => {
                this.fetchSubscriptions();
            });
            return Promise.resolve();
        }).catch(err => {
            console.log(err);
            return Promise.reject(err);
        });
    }

    onTimeConfirm(prop, time) {
        let startTime = this.state.startTime;
        let endTime = this.state.endTime;

        if (startTime != '0') {
            startTime = moment(moment().format("YYYYMMDD") + '' + (startTime).toString().substr(8), "YYYYMMDDHHmm").format("YYYYMMDDHHmm");
        }

        if (endTime != '0') {
            endTime = moment(moment().format("YYYYMMDD") + '' + (endTime).toString().substr(8), "YYYYMMDDHHmm").format("YYYYMMDDHHmm");
        }

        if (prop === 'start') {
            startTime = moment(time).format('YYYYMMDDHHmm');
            if (endTime == '0' || Number(startTime) < Number(endTime)) {
                startTime = moment(time).utc().format("YYYYMMDDHHmm");
                if (endTime != '0') {
                    endTime = moment(endTime, "YYYYMMDDHHmm").utc().format("YYYYMMDDHHmm");
                }
                this.phonesCollection.doc(this.userPhone).update({
                    startTime: Number(startTime),
                    endTime: Number(endTime)
                }).then(() => {
                    this.fetchTimes();
                    this.toggleTimeChoose(prop);
                    return Promise.resolve();
                }).catch(err => alert(err));
            } else {
                Alert.alert("Error",
                "Start time must be earlier than end time",
                [{text: 'OK', onPress: () => {this.toggleTimeChoose(prop)}}],
                {cancelable: false});
            }
        }
        if (prop === 'end') {
            endTime = moment(time).format('YYYYMMDDHHmm');
            if (startTime == '0' || Number(endTime) > Number(startTime)) {
                endTime = moment(time).utc().format("YYYYMMDDHHmm");
                if (startTime != '0') {
                    startTime = moment(startTime, "YYYYMMDDHHmm").utc().format("YYYYMMDDHHmm");
                }
                this.phonesCollection.doc(this.userPhone).update({
                    startTime: Number(startTime),
                    endTime: Number(endTime)
                }).then(() => {
                    this.fetchTimes();
                    this.toggleTimeChoose(prop);
                    return Promise.resolve();
                }).catch(err => alert(err))
            } else {
                Alert.alert("Error",
                "End time must be later than start time",
                [{text: 'OK', onPress: () => {this.toggleTimeChoose(prop)}}],
                {cancelable: false});
            }
        }

        
    }

    toggleTimeChoose(prop) {
        if (prop === 'start')
            this.setState({isStartTimeVisible: !this.state.isStartTimeVisible});
        if (prop === 'end')
            this.setState({isEndTimeVisible: !this.state.isEndTimeVisible});
    }

    shouldDelete(index, site, query) {
        Alert.alert(
            'Unsubscribe',
            'You are about to remove the subscription on query ' + query + ' from ' + site,
            [
                {text: 'Remove', onPress: () => this.delete(index, site, query)},
                {
                    text: 'Cancel',
                    onPress: () => {
                    },
                    style: 'cancel',
                },
            ]
        );
    }

    searchFilterFunction = text => {
        this.setState({selectedSite: text, hideList: false});
        if (text) {
            const newData = this.sitesArr.filter(item => {
                const itemData = `${item.toUpperCase()}`;
                const textData = text.toUpperCase();

                return itemData.indexOf(textData) > -1;
            });
            this.setState({sites: newData});
        } else {
            this.setState({
                sites: this.sitesArr,
                hideList: true
            });
        }
    };

    toggleModal() {
        this.setState({showAddNewDialog: !this.state.showAddNewDialog})
    }

    renderAddNewDialog() {
        return (
            <Modal
                isVisible={this.state.showAddNewDialog}
                onBackdropPress={() => {
                    this.toggleModal();
                }}>
                <View style={{flex: 0, height: 270, backgroundColor: '#fdfdfe', padding: 20, borderRadius: 10}}>
                    <View style={{
                        flexDirection: 'column',
                        flex: 1,
                        justifyContent: 'space-around',
                        marginTop: 40
                    }}>
                        <View style={styles.autoCompleteContainer}>
                            <Autocomplete
                                data={this.state.sites}
                                inputContainerStyle={{borderWidth: 0}}
                                listContainerStyle={{marginTop: -5, flex: 1, marginLeft: -10, marginRight: -10}}
                                hideResults={this.state.hideList}
                                renderTextInput={() =>
                                    <TextInput
                                        label="Site"
                                        error={this.state.siteErr}
                                        labelActiveColor='#349218'
                                        underlineActiveColor='#349218'
                                        value={this.state.selectedSite}
                                        onChangeText={text => this.searchFilterFunction(text)}/>
                                }
                                renderItem={(item) =>
                                    <View style={{
                                        justifyContent: 'center',
                                        marginTop: 5,
                                        marginBottom: 5,
                                        marginLeft: 5
                                    }}>
                                        <Text onPress={() => {
                                            this.setState({
                                                selectedSite: item,
                                                hideList: true
                                            });
                                        }}>
                                            {item}
                                        </Text>
                                    </View>}
                            />
                        </View>
                        <Text style={{marginTop: 5}}>
                            type * for all sites
                        </Text>

                        <TextInput
                            label="Query"
                            error={this.state.queryErr}
                            labelActiveColor='#349218'
                            underlineActiveColor='#349218'
                            keyboardType='phone-pad'
                            value={this.state.selectedQuery}
                            onFocus={() => this.setState({hideList: true})}
                            onChangeText={text => this.setState({selectedQuery: text})}/>


                        <View style={{flexDirection: 'row', alignSelf: 'flex-end'}}>
                            <Text style={{fontSize: 18, fontWeight: 'bold', marginRight: 20}}
                                  onPress={() => {
                                      this.setState({selectedSite: '', selectedQuery: '', hideList: true});
                                      this.toggleModal();
                                  }}>
                                Cancel
                            </Text>
                            <Text style={{color: '#349218', fontSize: 18, fontWeight: 'bold'}}
                                  onPress={() => {
                                      this.save();
                                      this.toggleModal();
                                  }}>
                                Save
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    render() {
        if (this.state.isLoading)
            return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size='large'/>
                <Text>
                    {this.state.loadingState}
                </Text>
            </View>;
        else
            return (
                <SafeAreaView>
                    <Toolbar
                        style={{container: {backgroundColor: "#349218"}, titleText: {fontWeight: 'normal'}}}
                        centerElement="Alerts"
                        leftElement="menu"
                        onLeftElementPress={() => this.props.navigation.toggleDrawer()}
                    />
                    {this.renderAddNewDialog()}
                    <View style={[styles.containerStyle, {}]}>
                    {this.state.hasNotificationPermission ? null : <Text style={{color: '#A00', marginBottom: 10}}>*Notifications permission is missing</Text>}
                            <Text style={[styles.textStyle, {marginBottom: 10}]}>Set alert time range</Text>
                            <View style={{flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 30}}>
                                <View>
                                    <Text style={{fontSize: 18}}>Start</Text>
                                    <Text style={{fontSize: 32, color: '#349218'}}
                                          onPress={() => this.toggleTimeChoose('start')}>
                                        {this.state.startTime == '0' ? "Set" :
                                        moment(this.state.startTime, 'YYYYMMDDHHmm').format("H:mm")}
                                    </Text>
                                </View>
                                <View style={{marginLeft: 80}}>
                                    <Text style={{fontSize: 18}}>End</Text>
                                    <Text style={{fontSize: 32, color: '#349218'}}
                                          onPress={() => this.toggleTimeChoose('end')}>
                                        {this.state.endTime == '0' ? "Set" :
                                            moment(this.state.endTime, 'YYYYMMDDHHmm').format("H:mm")}
                                    </Text>
                                </View>
                            </View>

                            <DateTimePicker isVisible={this.state.isStartTimeVisible}
                                            onConfirm={(time) => this.onTimeConfirm('start', time)}
                                            onCancel={() => {this.setState({isStartTimeVisible: !this.state.isStartTimeVisible})}} mode='time'/>
                            <DateTimePicker isVisible={this.state.isEndTimeVisible}
                                            onConfirm={(time) => this.onTimeConfirm('end', time)}
                                            onCancel={() => {this.setState({isEndTimeVisible: !this.state.isEndTimeVisible})}} mode='time'/>
                        <Divider/>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 30}}>
                                <Text style={[styles.textStyle, {marginBottom: 10}]}>
                                    Current subscriptions
                                </Text>
                                <Text
                                    style={{color: "#349218", fontSize: 20}}
                                    onPress={() => {
                                        this.setState({showAddNewDialog: true});
                                    }}>
                                    + New
                                </Text>
                            </View>
                            <FlatList
                                data={this.state.subscriptions}
                                style={{height: Dimensions.get('window').height - 320}}
                                keyExtractor={(item, index) => index.toString()}
                                extraData={this.state}
                                refreshing={this.state.listRefresh}
                                onRefresh={() => {
                                    this.setState({listRefresh: true});
                                    this.fetchSubscriptions();
                                }}
                                renderItem={({item}, index) => (
                                    <ListItem
                                        rightIcon={<Icon name='close' type='material' color="#666666" size={16}
                                                         onPress={() => this.shouldDelete(index, item.site, item.query)}/>}
                                        title={
                                            <View style={{alignSelf: 'flex-start'}}>
                                                <Text style={{
                                                    fontWeight: 'bold',
                                                    color: "#666666"
                                                }}>{item.site} - {item.query}</Text>
                                            </View>
                                        }
                                        containerStyle={{
                                            borderBottomWidth: 0,
                                            alignItems: 'center',
                                            backgroundColor: 'transparent'
                                        }}
                                    />)}
                                ListHeaderComponent={
                                    this.state.subscriptions.length > 0 ? null :
                                    <Text style={{fontSize: 14, textAlign: 'left', marginTop: 10}}>
                                        No subscriptions
                                    </Text>
                                }/>
                    </View>
                    <Toast style={styles.toast}
                           ref="toast"
                           position='bottom'
                           positionValue={200}
                           opacity={0.8}
                           textStyle={{fontSize: 16, color: '#fff'}}/>
                </SafeAreaView>
            )
    }
};

styles = {
    toast: {
        backgroundColor: '#555',
        borderRadius: 20,
        padding: 10
    },
    containerStyle: {
        flexDirection: 'column',
        margin: 20
    },
    rowStyle: {
        flexDirection: 'row',
        marginBottom: 20
    },
    textStyle: {
        fontWeight: 'normal',
        fontSize: 20
    },
    buttonStyle: {
        borderRadius: 8,
        backgroundColor: '#3eaa1c'
    },
    buttonLabelStyle: {
        fontSize: 25,
        color: '#eee'
    },
    autoCompleteContainer: {
        left: 0,
        position: 'absolute',
        right: 0,
        top: -35,
        zIndex: 1
    }
};