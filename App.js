import React, {Component} from 'react';
import ReactNative, {View} from 'react-native';
import firebase from 'react-native-firebase';
import {createStackNavigator, createAppContainer, createDrawerNavigator, createSwitchNavigator} from "react-navigation";
import Integ from './screens/Integ';
import Login from './screens/Login';
import PhoneVerification from './screens/PhoneVerification';
import Subscribe from './screens/Subscribe';
import Manage from './screens/Manage';
import SideMenu from './src/SideMenu';

class App extends Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        application.registerForRemoteNotifications();
    }

    render() {
        ReactNative.I18nManager.allowRTL(false);

        if (firebase.app.name === null) {
            firebase.initializeApp({
                apiKey: 'AIzaSyAwskoP3Yys059OkDSOelsa37SDCqnQ7aQ',
                authDomain: 'integ-stms.firebaseapp.com',
                databaseURL: 'https://integ-stms.firebaseio.com',
                projectId: 'integ-stms',
                storageBucket: 'integ-stms.appspot.com',
                messagingSenderId: '552155050105'
            });
        }
        return (
                <View style={{flex: 1}}>
                    <AppContainer/>
                </View>
        );
    }
}


const AppNavigator = createStackNavigator({
        Home: {
            screen: Integ,
            navigationOptions: ({navigation}) => {
                return {
                    drawerLabel: "Home",
                    header: null
                }
            }
        },
        Alerts: {
            screen: Subscribe
        },
        Login: {
            screen: Login
        },
        PhoneVerification: {
            screen: PhoneVerification
        }
    }
);

const DrawerNavigator = createDrawerNavigator(
    {
        Home: {
            screen: Integ
        },
        Alerts: {
            screen: Subscribe,
            headerText: "Alerts"
        },
        Login: {
            screen: Login,
            navigationOptions: ({navigation}) => ({
                swipeEnabled: false
            })
        },
        PhoneVerification: {
            screen: PhoneVerification,
            navigationOptions: ({navigation}) => ({
                swipeEnabled: false
            })
        }
    },
    {
        contentComponent: SideMenu
    });


const AuthStackNavigation = createStackNavigator({
    Login: Login,
    Verify: PhoneVerification,
}, {
    initialRouteName: 'Login',
});

const DrawerNav = createDrawerNavigator({
    Home: Integ,
    Alerts: Subscribe,
    Manage: Manage
}, {
    contentComponent: SideMenu,
    initialRouteName: "Home"
});

const MainNavigation = createSwitchNavigator({
    HomeStack: DrawerNav,
    AuthStack: AuthStackNavigation, 
}, {
    initialRouteName: "HomeStack"
});

const AppContainer = createAppContainer(MainNavigation);

export default createAppContainer(MainNavigation);
