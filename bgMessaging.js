import firebase, {Notification} from 'react-native-firebase';

// Optional flow type
import type { RemoteMessage } from 'react-native-firebase';

this.notificationListener = firebase.notifications().onNotification((message: Notification) => {

    const newNotification = new firebase.notifications.Notification()
        .setNotificationId(message.data.id)
        .setTitle("test title")
        .setBody(message.body)
        .setSound("default")
        .android.setVibrate(500)
        .android.setChannelId("Integ")
        .android.setSmallIcon("ic_v_notification")
        .android.setBigText(message.body);


    firebase.notifications().displayNotification(newNotification).then(() => {
        return Promise.resolve();
    }).catch(() => {
        return Promise.reject(err);
    });
});