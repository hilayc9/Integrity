import React, {Component} from 'react';
import {View, Dimensions} from 'react-native';
import firebase from 'react-native-firebase';
import {Button, Input} from "react-native-elements";

export default class Login extends Component {

    constructor(props) {
        super(props);

        this.state = {
            txtPhone: '',
            prefix: '',
            tap: 0,
            error: '',
            loading: false,
            found: false
        };

        this.COL_ALLOWED = 'allowed';

    }

    static navigationOptions = {
        header: null
    };

    checkAuthorization() {
        this.setState({loading: true});

        let phone = this.state.txtPhone;
        if (phone.length > 0 && phone.startsWith('+')) {
            firebase.firestore().collection(this.COL_ALLOWED).doc(phone).get().then(doc => {
                if (doc.exists) {
                    if (doc.data().allowed) {
                        return Promise.resolve(
                            firebase.auth().signInWithPhoneNumber(phone).then(data => {
                                return {data, userName: doc.data().name}
                            })
                        );
                    } else {
                        this.setState({loading: false});
                        return Promise.reject(new Error("Your account has been disabled.\nPlease contact system administrator."));
                    }
                } else {
                    this.setState({loading: false});
                    return Promise.reject(new Error("You are not authorized to use this system.\nPlease contact system administrator."));
                }
            }).then(promise => {
                this.setState({loading: false});
                this.props.navigation.navigate('Verify', {
                    verificationData: promise.data,
                    userName: promise.userName
                })
            }).catch(err => {
                this.setState({loading: false});
                alert(err.message);
            });
        } else {
            alert("Phone number must start with prefix (+)");
            this.setState({loading: false});
        }
    }

    login(phone, userName) {
        firebase.auth().signInWithPhoneNumber(phone).then(data => {
            this.setState({loading: false});
            this.props.navigation.navigate('Verify', {
                verificationData: data,
                userName: userName
            });
            return Promise.resolve();
        }).catch(err => {
            this.setState({loading: false});
            alert(err.message);
            return Promise.resolve();
        });
    }

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.inputContainerStyle}>
                    <Input inputStyle={styles.inputStyle}
                           placeholder='Phone number'
                           keyboardType='phone-pad'
                           errorMessage={this.state.error}
                           returnKeyType='done'
                           onSubmitEditing={() => {
                               this.checkAuthorization();
                           }}
                           onChangeText={text => this.setState({txtPhone: text})}/>
                </View>
                <View style={{flexDirection: 'row'}}>
                    <Button buttonStyle={styles.buttonStyle}
                            title='Continue'
                            loading={this.state.loading}
                            titleStyle={styles.buttonLabelStyle}
                            onPress={() => {
                                this.checkAuthorization();
                            }}/>
                </View>
            </View>
        )
    }
}
;

const styles = {
    container: {
        alignItems: 'center',
        flexDirection: 'column',
        backgroundColor: '#eee',
        justifyContent: 'center',
        flex: 1
    },
    inputStyle: {
        textAlign: 'center',
        fontSize: 28,
        height: 70
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
