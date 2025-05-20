// controllers/notificationController.js
const User = require('../models/userModal');
const notificationService = require('../service/NotificationService');

exports.enableSleepReminders = async (req, res) => {
  try {
    const { userId } = req.params;
    const success = await notificationService.updateNotificationSettings(userId, {
      sleepReminders: true,
      reminder1HourBefore: true,
      reminder2HoursBefore: true,
      reminder15MinBefore: true
    });
    
    if (success) {
      res.status(200).json({ success: true, message: 'Sleep reminders enabled' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to enable reminders' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateNotificationPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;
    
    const success = await notificationService.updateNotificationSettings(userId, preferences);
    
    if (success) {
      res.status(200).json({ success: true, message: 'Preferences updated' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to update preferences' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.testNotification = async (req, res) => {
    try {
      // Create a test user or use an existing one
      const testUser = await User.findOneAndUpdate(
        { email: 'sahanrandika@gmail.com' },
        {
          expoPushToken: 'ExponentPushToken[TEST_TOKEN]', // Mock token
          predictedBedtimeHours: 8,
          wakeup_time: [
            { day: 'Monday', time: '07:00' },
            { day: 'Tuesday', time: '07:00' }
          ],
          timezone: 'Asia/Colombo'
        },
        { upsert: true, new: true }
      );
  
      // Test immediate notification
      await notificationService.sendPushNotification(
        testUser.expoPushToken,
        'Test Notification',
        'This is a backend test notification'
      );
  
  
      res.status(200).json({
        success: true,
        message: 'Test notification sent ',
        user: testUser._id
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };