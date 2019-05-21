import React, {Component} from 'react';
import {
    ActivityIndicator,
    View,
    StyleSheet,
    FlatList,
    BackHandler,
    Text,
    SafeAreaView
} from 'react-native';
import {ListItem} from "react-native-elements";
import type {Notification} from 'react-native-firebase';
import firebase from 'react-native-firebase';
import {Toolbar} from 'react-native-material-ui';
import moment from 'moment';

export default class Integ extends Component {

    constructor(props) {
        super(props);
        this.state = {
            loggedIn: false,
            isLoading: true,
            data: null,
            userPhone: '',
            notificationAllowed: false,
            text: '',
            loadingState: '',
            listRefresh: false
        };

        this.data = [];

        this.exit = this.exit.bind(this);
    }

    //Handle notifications when app on front
    listenToMessages() {
        this.notificationListener = firebase.notifications().onNotification((message: Notification) => {
            const channel = new firebase.notifications.Android.Channel('Integ', 'Integ', firebase.notifications.Android.Importance.Max)
                .setDescription('Integrity notifications');

// Create the channel
            firebase.notifications().android.createChannel(channel);

            const notification = new firebase.notifications.Notification()
                .setNotificationId(message.data.id)
                .setTitle(message.title)
                .setBody(message.body)
                .setSound("default")
                .android.setVibrate(500)
                .android.setChannelId("Integ")
                .android.setSmallIcon("ic_v_notification")
                .android.setBigText(message.body);

            firebase.notifications().displayNotification(notification).then(() => {
                return Promise.resolve();
            }).catch(err => {
                console.warn(err.toString());
                return Promise.resolve();
            });
        });
    }

    async componentDidMount() {
        firebase.auth().onAuthStateChanged(user => {
            if (!user || user.disabled) {
                this.setState({loggedIn: false});
                this.props.navigation.navigate("AuthStack");
            } else {
                this.setState({loggedIn: true, loadingState: 'Initializing...'});
                this.checkForNotificationsPermission();
            }
        });
    }

    async checkForNotificationsPermission() {   
        const enabled = await firebase.messaging().hasPermission();
        if (enabled) {
            this.getToken();
        } else {
            this.requestPermission();
        }
    }

    async requestPermission() {
        try {
            await firebase.messaging().requestPermission();
            this.getToken();
        } catch (err) {
            this.getToken(); //User refused
        }
    }

    async getToken() {
            let token = await firebase.messaging().getToken();
            if (token) {
                await firebase.firestore().collection('phones').doc(firebase.auth().currentUser.phoneNumber).update({
                    token: token
                });
                this.listenToMessages();
                this.setState({notificationAllowed: true});
                this.loadJsonFile();

                //getAPNSToken();
                //registerForRemoteNotifications();
            }
    }

    searchFilterFunction = text => {
        this.setState({text: text});
        if (text) {
            const newData = this.data.filter(item => {
            const itemData = `${item.site.toUpperCase()} ${item.query} ${item.queryname.toUpperCase()}`;
            const textData = text.toUpperCase();

            return itemData.indexOf(textData) > -1;
        });
            this.setState({data: newData, isLoading: false});
        } else {
            this.setState({data: this.data, isLoading: false});
        }
    };

    refactorSiteName(text) {
        if (text.includes('emnt24p@clalit.org.il')) {
            return 'HaEmek';
        }
        if (text.includes('MKSQLP230@softov.co.il')) {
            return 'Nesher';
        }
        if (text.includes('shapp_IDF@sheba.health.gov.il')) {
            return 'Sheba IDF';
        }
        if (text.includes('crntp24@clalit.org.il')) {
            return 'Carmel';
        }
        if (text.includes('lbnt14@clalit.org.il')) {
            return 'MegaLab';
        }
        if (text.includes('rambam.health.gov.il')) {
            return 'Rambam';
        }
        if (text.includes('blntp24@clalit.org.il')) {
            return 'Beilinson';
        }
        if (text.includes('sont24p@softov.co.il')) {
            return 'Soroka';
        }
        if (text.includes('softovashdodadm@assuta.co.il')) {
            return 'Asuta Ashdod';
        }
        if (text.includes('softovadm@assuta.co.il')) {
            return 'Asuta';
        }
        if (text.includes('mentp24@softov.co.il')) {
            return 'Meir';
        }
        if (text.includes('tasmc.health.gov.il')) {
            return 'Ichilov';
        }
        if (text.includes('kpntp24@softov.co.il')) {
            return 'Kaplan';
        }
        if (text.includes('barzi.health.gov.il')) {
            return 'Barzilai';
        }
        if (text.includes('bzapp@b-zion.org.il')) {
            return 'Bnei Zion';
        }
        if (text.includes('poria.health.gov.il')) {
            return 'Poria';
        }
        if (text.includes('asaf.health.gov.il')) {
            return 'Asaf Harofe';
        }
        if (text.includes('shapp@sheba.health.gov.il')) {
            return 'Sheba';
        }
        if (text.includes('mksqlp231@clalit.org.il')) {
            return 'Projnin';
        }
        if (text.includes('ziv.health.gov.il')) {
            return 'Ziv';
        }
        if (text.includes('naharia.health.gov.il')) {
            return 'Naharia';
        }
        if (text.includes('wolfson.health.gov.il')) {
            return 'Wolfson';
        }
        if (text.includes('hy.health.gov.il')) {
            return 'Hillel Yaffe';
        }
        if (text.includes('cmnt24p@softov.co.il')) {
            return 'Schneider';
        }

        return text;
    }

    exit() {
        BackHandler.exitApp();
    }

    loadJsonFile(){
            this.setState({loadingState: 'Getting queries...'});
            firebase.storage().ref('/').child('integ.json').getMetadata().then(metadata => {
                let datetime = moment.utc(metadata.updated).local().format("DD/MM/YY H:mm");

                this.setState({
                    updateDate: datetime
                });
                return Promise.resolve(firebase.storage().ref('/').child('integ.json').getDownloadURL().then(url => {
                    return {url}
                }));
            }).then(promise => {
                    this.setState({loadingState: 'Parsing data...'});
                return fetch(promise.url)
                    .then(res => res.json())
                    .then((resJson) => {
                        this.setState({loadingState: 'Creating view...'});
                        if (this.data.length > 0) {
                            this.data = [];
                        }
                        let val;
                        let newSite;
                        let lastVal;
                        for (let key in resJson) {
                            if (resJson.hasOwnProperty(key)) {
                                val = resJson[key];
                                lastVal = val.value.split(',')[0];
                                if (lastVal > 0) {
                                    newSite = this.refactorSiteName(val.site);

                                    this.data.push({
                                        "site": newSite,
                                        "query": val.query,
                                        "queryname": val.queryname,
                                        "value": lastVal
                                    });
                            
                                }
                            }
                        }

                        this.setState({
                            isLoading: false,
                            data: this.data.sort((a, b) => a.site.localeCompare(b.site)),
                            listRefresh: false
                        })

                    }).catch((error) => {
                        console.log(error);
                        this.setState({
                            isLoading: false,
                            data: error.toString()
                        });
                    });
            }).catch(err => console.warn(err.toString()));
    }

    render() {
        if (!this.state.loggedIn)
            return <View/>;
        if (this.state.isLoading) {
            return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size='large'/>
                <Text>
                    {this.state.loadingState}
                </Text>
            </View>;
        } else {
            return (
                <SafeAreaView style={{flex: 1}}>
                    <Toolbar
                        style={{container: {backgroundColor: "#349218"}, titleText: {fontWeight: 'normal'}}}
                        leftElement="menu"
                        onLeftElementPress={() => this.props.navigation.toggleDrawer()}
                        centerElement="Home"
                        searchable={{
                            autoFocus: true,
                            placeholder: 'Search',
                            onChangeText: text => this.searchFilterFunction(text),
                            onSearchClosed: () => this.searchFilterFunction('')
                        }}
                    />
                    <View style={{flexDirection: 'row', padding: 10, backgroundColor: '#FFF'}}>
                    <Text style={{flex: 4, alignItems: 'flex-start'}}>
                            {this.state.updateDate !== '' ? "Last update: " + this.state.updateDate : ""}
                            </Text>
                            <Text style={{flex: 1, alignItems:'flex-end', marginLeft: 15}}>
                            {this.state.data.length > 0 ? "Total: " + this.state.data.length : ""}
                            </Text>
                        </View>
                        {this.state.data.length < 1 || this.state.data[0].site === undefined ? <Text style={{alignSelf: 'center'}}>No queries to show</Text> :
                    <FlatList
                        data={this.state.data}
                        refreshing={this.state.listRefresh}
                        onRefresh={() => {
                            this.setState({listRefresh: true});
                            this.loadJsonFile();
                        }}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({item}) => (
                            <ListItem
                                title={`${item.site}  -  ${item.query}`}
                                subtitle={`${item.queryname} (${item.value})`}
                                containerStyle={{borderBottomWidth: 0.2}}
                                titleStyle={{fontWeight: 'bold', marginTop: 5}}
                                subtitleStyle={{marginBottom: 5}}
                                onPress={() => {

                                }}/>
                        )}
                    /> }
                </SafeAreaView>
            )
        }
    }
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: null,
        height: null,
        resizeMode: 'cover'
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        margin: 5,
        borderBottomColor: '#999',
        borderBottomWidth: 1,
    },
    item: {
        alignSelf: 'stretch',
        margin: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 20
    },
    site: {
        alignSelf: 'flex-start'
    },
    query: {
        alignSelf: 'flex-start'
    },
    value: {
        alignSelf: 'flex-start'
    }
});