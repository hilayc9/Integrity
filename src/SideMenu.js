import React, {Component} from 'react';
import {ScrollView, View, Text, Image, Dimensions, SafeAreaView, TouchableWithoutFeedback} from 'react-native';
import {NavigationActions} from 'react-navigation';
import {Icon} from 'react-native-elements';
import firebase from 'react-native-firebase';
import {version as app_version} from '../package.json'

export default class SideMenu extends Component {

    constructor(props) {
        super(props);

        this.state = {
            loggedIn: false,
            admin: false
        };

        this.unsubscribe = null;
    }

    componentDidMount() {
        this.unsubscribe = firebase.auth().onAuthStateChanged(user => {
            if (user) {
                this.setState({loggedIn: true});
                firebase.firestore().collection("allowed").doc(user.phoneNumber).get().then(res => {
                    if (res.data().admin) {
                        this.setState({admin: true})
                    }
                });
            } else {
                this.setState({loggedIn: false});
                this.props.navigation.navigate("AuthStack");
            }
        });
    }

    componentWillUnmount() {
        if (this.unsubscribe)
            this.unsubscribe();
    }

    navigateToScreen = (route) => () => {
        const navigateAction = NavigationActions.navigate({
            routeName: route
        });
        this.props.navigation.dispatch(navigateAction);
    };

    signOut() {
        firebase.firestore().collection('phones').doc(firebase.auth().currentUser.phoneNumber).update({
            token: ''
        }).then(() => {
            firebase.auth().signOut();
            return Promise.resolve();
        })
    }

    render() {
        return (
            <SafeAreaView style={{height: Dimensions.get('window').height}}>
                <View>
                    <View style={styles.topContainer}>
                        <View style={styles.alignToBottom}>
                            <Image style={styles.image} source={require("../src/profile.png")}/>
                            <Text
                                style={styles.header}>{this.state.loggedIn ? firebase.auth().currentUser.displayName : ''}</Text>
                        </View>
                    </View>
                    <View style={styles.bottomContainer}>
                        <TouchableWithoutFeedback onPress={this.navigateToScreen("Home")}>
                        <View style={[styles.row, this.props.activeItemKey === "Home" ? styles.activeRow : {}]}>
                            <Icon
                                iconStyle={[styles.icon, this.props.activeItemKey === "Home" ? styles.activeIcon : {}]}
                                color="#666666" name="home" type="material"/>
                            <Text style={[styles.text, this.props.activeItemKey === "Home" ? styles.activeText : {}]}>
                                Home
                            </Text>
                            </View>
                        </TouchableWithoutFeedback>
                        <TouchableWithoutFeedback
                        onPress={this.navigateToScreen("Alerts")}>
                        <View  style={[styles.row, this.props.activeItemKey === "Alerts" ? styles.activeRow : {}]}>
                            <Icon
                                iconStyle={[styles.icon, this.props.activeItemKey === "Alerts" ? styles.activeIcon : {}]}
                                color="#666666" name="notifications" type="material"/>
                            <Text
                                style={[styles.text, this.props.activeItemKey === "Alerts" ? styles.activeText : {}]} >
                                Alerts
                            </Text>
                            </View>
                        </TouchableWithoutFeedback>
                        {this.state.admin ?
                            <TouchableWithoutFeedback
                            onPress={this.navigateToScreen("Manage")}>
                            <View  style={[styles.row, this.props.activeItemKey === "Manage" ? styles.activeRow : {}]}>
                                <Icon iconStyle={[styles.icon, this.props.activeItemKey === "Manage" ? styles.activeIcon : {}]}
                                color="#666666" name="account-key"
                                      type="material-community"/>
                                <Text style={[styles.text, this.props.activeItemKey === "Manage" ? styles.activeText : {}]}>
                                    Manage
                                </Text>
                                </View>
                            </TouchableWithoutFeedback>
                            :
                            null}
                        <TouchableWithoutFeedback
                         onPress={() => this.signOut()}>
                         <View  style={styles.row}>
                            <Icon iconStyle={styles.icon} color="#666666" name="power"
                                  type="material-community"/>
                            <Text style={styles.text}>
                                Sign out
                            </Text>
                            </View>
                        </TouchableWithoutFeedback>
                        
                    </View>
                </View>
                <View style={{flex: 1, marginBottom: 5, justifyContent: 'flex-end'}}>
                    <Text style={{alignSelf: 'center', fontSize: 12}}>
                        v
                        {app_version}
                    </Text>
                </View>
            </SafeAreaView>
        )
    }
}

const styles = {
    topContainer: {
        flexDirection: 'row',
        backgroundColor: "#346126",
        height: 120
    },
    alignToBottom: {
        bottom: 0,
        position: 'absolute',
        flexDirection: 'row',
        marginBottom: 15,
        marginLeft: 20,
    },
    image: {
        width: 40,
        height: 40
    },
    header: {
        color: "#ffffff",
        fontWeight: 'bold',
        fontSize: 20,
        marginTop: 7,
        marginLeft: 15
    },
    row: {
        flexDirection: 'row',
        height: 60,
        alignItems: 'center'
    },
    icon: {
        marginLeft: 20
    },
    activeRow: {
        backgroundColor: "#E1EFDD",
    },
    activeText: {
        color: "#346126"
    },
    activeIcon: {
        color: "#346126"
    },
    text: {
        fontSize: 18,
        marginLeft: 15,
        color: "#666666"
    },
    bottomContainer: {}
};