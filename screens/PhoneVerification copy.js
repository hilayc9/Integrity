import React, {Component} from 'react';
import {Dimensions, View} from 'react-native';
import {Button, Input} from "react-native-elements";
import firebase from 'react-native-firebase';

export default class PhoneVerification extends Component {

    constructor(props) {
        super(props);

        this.state = {
            code: '',
            loading: false
        };

        this.unsubscribe = null;
    }

    static navigationOptions = {
        header: null
    };

    componentDidMount() {
        this.unsubscribe = firebase.auth().onAuthStateChanged(user => {
            if (user) {
                this.login();
            }
        });
    };

    componentWillUnmount() {
        if (this.unsubscribe)
            this.unsubscribe();
    }

    login = async () => {

    }

    authenticate() {
        let code = this.state.code;
        if (code.length === 6) {
            this.setState({loading: true});
            this.props.navigation.getParam('verificationData').confirm(code).then(() => {
                return Promise.resolve();
            }).catch((err) => {
                this.setState({loading: false});
                alert(err.message);
                return Promise.resolve();
            })
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.inputContainerStyle}>
                    <Input inputStyle={styles.inputStyle}
                           placeholder='Code'
                           keyboardType='phone-pad'
                           returnKeyType='done'
                           onSubmitEditing={() => {
                               this.authenticate();
                           }}
                           onChangeText={text => this.setState({code: text})}/>
                </View>
                <View style={{flexDirection: 'row'}}>
                    <Button buttonStyle={styles.buttonStyle}
                            title='Verify'
                            loading={this.state.loading}
                            titleStyle={styles.buttonLabelStyle}
                            onPress={() => {
                                this.authenticate();
                            }}/>
                </View>
            </View>
        )
    }
};

const styles = {
    container: {
        alignItems: 'center',
        flexDirection: 'column',
        backgroundColor: '#eee',
        justifyContent: 'center',
        flex: 1
    },
    inputContainerStyle: {
        borderBottomWidth: 2,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        marginBottom: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 50,
        marginLeft: 50
    },
    inputStyle: {
        textAlign: 'center',
        fontSize: 28,
        height: 70
    },
    buttonStyle: {
        width: Dimensions.get('window').width - 200,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#3eaa1c'
    },
    buttonLabelStyle: {
        fontSize: 25,
        color: '#eee'
    }
};