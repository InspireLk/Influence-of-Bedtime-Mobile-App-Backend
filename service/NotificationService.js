// services/notificationService.js
const { Expo } = require('expo-server-sdk');
const User = require('../models/userModal');

const expo = new Expo();

// const sendPushNotification = async (pushToken, title, body) => {
//   if (!Expo.isExpoPushToken(pushToken)) {
//     console.error(`Push token ${pushToken} is not a valid Expo push token`);
//     return;
//   }

//   const messages = [{
//     to: pushToken,
//     sound: 'default',
//     title,
//     body,
//     data: { withSome: 'data' },
//   }];

//   try {
//     const ticketChunk = await expo.sendPushNotificationsAsync(messages);
//     console.log('Notification sent:', ticketChunk);
//     return ticketChunk;
//   } catch (error) {
//     console.error('Error sending notification:', error);
//   }
// };

async function sendPushNotification(expoPushToken, message) {
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error("Invalid Expo push token");
    return;
  }

  const messages = [{
    to: expoPushToken,
    sound: "default",
    ...message,
  }];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(" Notification sent:", ticketChunk);
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}


// Update user's notification settings and reschedule

const updateNotificationSettings = async (userId, settings) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $set: { 'notificationPreferences': settings }
    });
    await NotificationScheduler.scheduleUserNotifications(userId);
    return true;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return false;
  }
};

module.exports = {
  sendPushNotification,
  updateNotificationSettings,
};