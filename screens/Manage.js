import React, {Component} from 'react';
import {View, FlatList, ActivityIndicator, Text, Alert, SafeAreaView} from 'react-native';
import firebase from 'react-native-firebase';
import {Toolbar} from "react-native-material-ui";
import {ListItem, Icon} from 'react-native-elements';
import MyCheckBox from '../src/MyCheckBox';
import Modal from "react-native-modal";
import TextInput from 'react-native-material-textinput';
import {MenuProvider, Menu, MenuTrigger, MenuOptions, MenuOption} from 'react-native-popup-menu';


class Manage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            users: [],
            showAddNewDialog: false,
            showEditModal: false,
            newName: '',
            newPhone: '',
            newEnabled: false,
            newAdmin: false,
            nameErr: '',
            phoneErr: '',
            showDisabled: true,
            loading: false,
            editCurrentUser: null,
            listRefresh: false
        };

        this.users = [];
    }

    componentDidMount() {
        this.setState({loading: true});
        this.fetchUsers();
    }

    async fetchUsers() {
        this.users = [];
        const res = await firebase.firestore().collection('allowed').get();
        res.docs.forEach(doc => {
            if (doc.id !== firebase.auth().currentUser.phoneNumber) {
                if (this.state.showDisabled) {
                    this.users.push({
                        "phone": doc.id,
                        "name": doc.data().name,
                        "enabled": doc.data().allowed,
                        "admin": doc.data().admin
                    });
                } else {
                    if (doc.data().allowed) {
                        this.users.push({
                            "phone": doc.id,
                            "name": doc.data().name,
                            "enabled": doc.data().allowed,
                            "admin": doc.data().admin
                        });
                    }
                }
            }
        });
        this.setState({
            users: this.users,
            loading: false,
            listRefresh: false
        });   
    }

    searchFilterFunction = text => {
        this.setState({text: text});
        if (text) {
            
            const newData = this.users.filter(item => {
                const itemData = `${item.name.toUpperCase()} ${item.phone}}`;
                const textData = text.toUpperCase();

                return itemData.indexOf(textData) > -1;
            });
            this.setState({users: newData, isLoading: false});
        
        } else {
            this.setState({users: this.users, isLoading: false});
        }
    };

    filterActiveUsers = () => {
        if (this.state.showDisabled) {
            const newData = this.users.filter(item => {
                const itemData = item.enabled;
                const textData = true;

                return itemData === textData;
            });
            this.setState({users: newData, isLoading: false});
        } else {
            this.setState({users: this.users, isLoading: false});
        }
    }

    async updateUser() {
        const {newName, newPhone, newAdmin, nameErr, phoneErr, newEnabled} = this.state;
        let isNameValid = true;

        if (newName.length < 2) {
            this.setState({nameErr: 'Not a valid name', showEditModal: true});
            isNameValid = false;
        }

        if (isNameValid) {
            await firebase.firestore().collection('allowed').doc(newPhone).update({
                name: newName,
                allowed: newEnabled,
                admin: newAdmin
            });
            try {
                await firebase.firestore().collection('phones').doc(newPhone).update({
                    name: newName
                });
            } catch {

            }

            this.setState({
                showEditModal: false,
                editCurrentUser: null
            });
            this.fetchUsers();
        }
    }

    createUser() {
        const {newName, newPhone, newAdmin, nameErr, phoneErr, newEnabled} = this.state;
        let isNameValid = true;
        let isPhoneValid = true;

        if (newName.length < 2) {
            this.setState({nameErr: 'Not a valid name', showAddNewDialog: true});
            isNameValid = false;
        } else {
            this.setState({showAddNewDialog: true});
            isNameValid = true;
        }

            if (newPhone.length < 8 || !newPhone.startsWith('+')) {
                this.setState({phoneErr: 'Not a valid phone number', showAddNewDialog: true, newEnabled: true});
                isPhoneValid = false;
            } else {
                this.setState({showAddNewDialog: true});
                isPhoneValid = true;
            }   

        if (isNameValid && isPhoneValid) {
            firebase.firestore().collection('allowed').doc(newPhone).get().then(doc => {
                if (doc.exists) {
                    alert("Phone number already exists")
                    return Promise.resolve();
                } else {
                    return Promise.resolve(firebase.firestore().collection('allowed').doc(newPhone).set({
                        name: newName,
                        allowed: true,
                        admin: newAdmin
                    }).then(() => {
                        this.toggleModal("add");
                        this.fetchUsers();
                        return Promise.resolve();
                    }));
                }
            })
        }
    }

    shouldDelete(index, name, phone) {
        Alert.alert(
            'Delete user',
            'You are about to delete the following user:\n ' + name + '\n ' + phone,
            [
                {text: 'Delete', onPress: () => this.delete(index, name, phone)},
                {
                    text: 'Cancel',
                    onPress: () => {
                    },
                    style: 'cancel',
                },
            ]
        );
    }

    delete(index, name, userPhone) {
        this.setState({loading: true});
        firebase.firestore().collection('phones').doc(userPhone).delete().then(() => {
            return Promise.resolve(
                firebase.firestore().collection('allowed').doc(userPhone).delete()
            )
        }).then(() => {
            return Promise.resolve(firebase.firestore().collection('sites').get()).then(sites => {
                return {sites}
            });
        }).then(promise => {
            let formattedPhones = '';
            let promises = [];

            promise.sites.forEach(site => {
                Object.keys(site._data).forEach(query => {
                    formattedPhones = '';
                    let phones = site.get(query).toString();
                    if (phones.length > 1) {
                        phones.split('|').forEach(phone => {
                            if (phone !== userPhone) {
                                formattedPhones = formattedPhones + '|' + phone;
                            }
                        });
                        promises.push(
                            firebase.firestore().collection('sites').doc(site.id).update({
                                    [query]: formattedPhones
                                    })
                            );
                    }
                });
            });
            return Promise.all(promises);
    }).then(() => {
        this.fetchUsers();
        return Promise.resolve();
    }).catch(err => {
            console.log(err);
            return Promise.resolve(err);
        });
    }

    toggleModal(which) {
        if (which === 'add') {
            this.setState({
                showAddNewDialog: !this.state.showAddNewDialog,
                newName: '',
                newPhone: '',
                newAdmin: false,
                phoneErr: '',
                newErr: ''
            });
        }
        if (which === 'edit') {
            this.setState({
                showEditModal: !this.state.showEditModal,
                editCurrentUser: null,
            });
        }
    }

    renderEditDialog() {
        if (this.state.editCurrentUser) {
            let user = this.state.editCurrentUser;
        return (
            <Modal
                isVisible={this.state.showEditModal}
                onBackdropPress={() => {
                    this.toggleModal("edit");
                }}>
                <View style={{flex: 0, height: 250, backgroundColor: '#fdfdfe', borderRadius: 10, padding: 20}}>
                <View style={{flex: 1,
                        justifyContent: 'space-between'}}>
                    <TextInput
                        label="Display name"
                        containerStyle={{flex: 1}}
                        error={this.state.nameErr}
                        labelActiveColor='#349218'
                        underlineActiveColor='#349218'
                        value={this.state.newName}
                        onChangeText={text => this.setState({newName: text, nameErr: ''})} />
                <Text style={{fontWeight: 'bold', fontSize: 16}}>
                    {user.phone}
                </Text>
                <View style={{flexDirection: 'row'}}>
                    <MyCheckBox containerStyle={{marginLeft: 15}}
                                        checked={this.state.newAdmin} textStyle={{fontWeight: 'normal'}}
                                        onPress={() => {
                                            this.setState({newAdmin: !this.state.newAdmin});
                                        }}
                                        checkedColor="#349218"/>
                    <Text style={{marginLeft: 10, alignSelf: 'center'}}>Admin</Text>
                </View>
                <View style={{flexDirection: 'row'}}>
                    <MyCheckBox containerStyle={{marginLeft: 15}}
                                        checked={this.state.newEnabled} textStyle={{fontWeight: 'normal'}}
                                        onPress={() => {
                                            this.setState({newEnabled: !this.state.newEnabled});
                                        }}
                                        checkedColor="#349218"/>
                    <Text style={{marginLeft: 10, alignSelf: 'center'}}>Active</Text>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
                <Text style={{fontSize: 18, fontWeight: 'bold', marginRight: 20}}
                                  onPress={() => {
                                      this.toggleModal('edit');
                                  }}>
                                Cancel
                            </Text>
                            <Text style={{color: '#349218', fontSize: 18, fontWeight: 'bold'}}
                                  onPress={() => {
                                      this.updateUser();
                                      this.toggleModal('edit');
                                  }}>
                                Save
                            </Text>
                </View>
                </View>
                </View>
            </Modal>
        )
                                }
    }

    renderAddNewDialog() {
        return (
            <Modal
                isVisible={this.state.showAddNewDialog}
                onBackdropPress={() => {
                    this.toggleModal("add");
                }}>
                <View style={{flex: 0, height: 270, backgroundColor: '#fdfdfe', padding: 20, borderRadius: 10}}>
                    <View style={{
                        flexDirection: 'column',
                        flex: 1,
                        justifyContent: 'space-between'
                    }}>
                        <TextInput
                            label="Name"
                            error={this.state.nameErr}
                            labelActiveColor='#349218'
                            underlineActiveColor='#349218'
                            value={this.state.newName}
                            onChangeText={text => this.setState({newName: text, nameErr: ''})}/>

                        <TextInput
                            label="Phone number"
                            error={this.state.phoneErr}
                            labelActiveColor='#349218'
                            underlineActiveColor='#349218'
                            keyboardType='phone-pad'
                            value={this.state.newPhone}
                            onChangeText={text => this.setState({newPhone: text, phoneErr: ''})}/>

                        <View style={{flexDirection: 'row', alignSelf: 'flex-start'}}>
                        <MyCheckBox containerStyle={{marginRight: 15}}
                                        checked={this.state.newAdmin} textStyle={{fontWeight: 'normal'}}
                                        onPress={() => {
                                            this.setState({newAdmin: !this.state.newAdmin});
                                        }}
                                        checkedColor="#349218"/>
                            <Text>
                                Admin
                            </Text>
                        </View>
                        <View style={{flexDirection: 'row', alignSelf: 'flex-end'}}>
                            <Text style={{fontSize: 18, fontWeight: 'bold', marginRight: 20}}
                                  onPress={() => {
                                      this.toggleModal("add");
                                  }}>
                                Cancel
                            </Text>
                            <Text style={{color: '#349218', fontSize: 18, fontWeight: 'bold'}}
                                  onPress={() => {
                                      this.createUser();
                                  }}>
                                Create
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    render() {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: '#FFF'}}>
            <MenuProvider>
                <Toolbar
                    style={{container: {backgroundColor: "#349218"}, titleText: {fontWeight: 'normal'}}}
                    centerElement="User management"
                    leftElement="menu"
                    onLeftElementPress={() => this.props.navigation.toggleDrawer()}
                    rightElement="add"
                    onRightElementPress={() => this.toggleModal("add")}
                    searchable={{
                        autoFocus: true,
                        placeholder: 'Search name or phone number',
                        onChangeText: text => this.searchFilterFunction(text),
                        onSearchClosed: () => this.searchFilterFunction('')
                    }}
                />
                <View style={{flexDirection: 'row', paddingLeft: 20, paddingTop: 10, backgroundColor: '#FFF'}}>
                            <MyCheckBox 
                                        checked={this.state.showDisabled} textStyle={{fontWeight: 'normal'}}
                                        size={18}
                                        onPress={() => {
                                            this.setState({showDisabled: !this.state.showDisabled});
                                            this.filterActiveUsers();
                                        }}
                                        checkedColor="#349218"/>
                            <Text style={{color: '#000', alignSelf: 'center', marginLeft: 5}}>
                                Display inactive users
                            </Text>
                        </View>
                {this.renderAddNewDialog()}
                {this.renderEditDialog()}
                {this.state.loading ? <ActivityIndicator style={{marginTop: 50}} size='large'/> : (
                    <FlatList
                        data={this.state.users}
                        keyExtractor={(item, index) => index.toString()}
                        extraData={this.state}
                        refreshing={this.state.listRefresh}
                        onRefresh={() => {
                            this.setState({listRefresh: true});
                            this.fetchUsers();
                        }}
                        renderItem={({item}, index) => (
                            <ListItem
                                title={item.name}
                                titleStyle={item.enabled ? {color: '#000'} : {color: '#cdcdcd'}}
                                subtitle={item.phone}
                                subtitleStyle={item.enabled ? {color: '#000'} : {color: '#cdcdcd'}}
                                rightIcon={<Menu>
                                    <MenuTrigger>
                                    <Icon color="#666666"
                                                 name="dots-vertical"
                                                 type="material-community"/>
                                    </MenuTrigger>
                                    <MenuOptions style={{}}>
                                        <MenuOption onSelect={() => {
                                                    this.toggleModal("edit");
                                                    this.setState({
                                                        editCurrentUser: item,
                                                        newPhone: item.phone,
                                                        newName: item.name,
                                                        newAdmin: item.admin,
                                                        newEnabled: item.enabled
                                                        })
                                                    }}>
                                            <Text style={{fontSize: 16, marginLeft: 10, marginTop: 5, marginBottom: 5}}>Edit</Text>
                                        </MenuOption>
                                        <MenuOption onSelect={() => {
                                            this.shouldDelete(index, item.name, item.phone)
                                        }}>
                                        <Text style={{fontSize: 16, marginLeft: 10, marginTop: 5, marginBottom: 5}}>Delete</Text>
                                        </MenuOption>
                                    </MenuOptions>
                                    </Menu>
}
                                leftIcon={
                                    <Icon color={item.admin ? "#666666" : "#cdcdcd"}
                                                 name="account-key"
                                                 type="material-community"/>
                                }
                            />
                        )}
                    />
                    )}
                    </MenuProvider>
            </SafeAreaView>
        )
    }
}

export default Manage;