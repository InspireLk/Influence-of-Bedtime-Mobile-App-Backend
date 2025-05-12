// services/notificationScheduler.js
const cron = require('node-cron');
const User = require('../models/userModal');
const moment = require('moment-timezone');
const { sendPushNotification } = require('./NotificationService');

// Initialize scheduler
let scheduledJobs = {};

// Calculate sleep time with timezone support
const calculateSleepTime = (wakeupTime, predictedBedtimeHours, timezone) => {
  const [hours, minutes] = wakeupTime.split(':').map(Number);
  
  // Validate inputs
  if (isNaN(hours) || isNaN(minutes) || isNaN(predictedBedtimeHours)) {
    throw new Error('Invalid time or predicted bedtime hours');
  }

  const now = moment().tz(timezone);
  let wakeupToday = now.clone().set({ hours, minutes, seconds: 0 });
  
  // If wakeup time is earlier than now, it's for tomorrow
  if (wakeupToday.isBefore(now)) {
    wakeupToday.add(1, 'day');
  }
  
  const bedtime = wakeupToday.clone().subtract(predictedBedtimeHours, 'hours');
  
  // Ensure valid hour (0-23)
  const validHour = bedtime.hours() % 24;
  bedtime.hours(validHour);
  
  return bedtime;
};

const scheduleUserNotifications = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.expoPushToken || !user.predictedBedtimeHours || !user.wakeup_time) {
      return;
    }

    // Cancel existing jobs
    if (scheduledJobs[userId]) {
      scheduledJobs[userId].forEach(job => job.stop());
      delete scheduledJobs[userId];
    }

    const jobs = [];
    const timezone = user.timezone || 'UTC';

    user.wakeup_time.forEach(daySchedule => {
      try {
        // const bedtime = calculateSleepTime(daySchedule.time, user.predictedBedtimeHours, timezone);
        // DEMO MODE: Schedule 10 seconds from now
        const bedtime = moment().tz(timezone).add(10, 'seconds');


        
        const dayOfWeek = bedtime.day(); // 0-6 (Sun-Sat)
        
        // Validate hour is between 0-23
        const hour = bedtime.hours();
        if (hour < 0 || hour > 23) {
          throw new Error(`Invalid calculated hour: ${hour}`);
        }

        const cronPattern = `${bedtime.minutes()} ${hour} * * ${dayOfWeek}`;
        
        const job = cron.schedule(
          cronPattern,
          async () => {
            try {
              await sendPushNotification(
                user.expoPushToken,{
                titel:"⏰ Bedtime Reminder",
                body:`It's almost time to sleep. Let’s reduce screen time and prepare for bed.`
                }
              );
              console.log(`✅ Notification sent to user ${user._id} at ${new Date().toLocaleString()}`);
              console.log(`Token : ${user.expoPushToken}`);
            } catch (err) {
              console.error(`❌ Failed to send notification:`, err);
            }
          }, 
          {
            scheduled: true,
            timezone: timezone
          }
        );
        

        jobs.push(job);
      } catch (error) {
        console.error(`Error scheduling for day ${daySchedule.day}:`, error);
      }
    });

    scheduledJobs[userId] = jobs;
  } catch (error) {
    console.error(`Error scheduling notifications for user ${userId}:`, error);
  }
};


// const scheduleUserNotifications = async (userId) => {
//   try {
//     const user = await User.findById(userId);
//     if (!user || !user.expoPushToken) return;

//     // Cancel existing jobs
//     if (scheduledJobs[userId]) {
//       scheduledJobs[userId].forEach(job => job.stop());
//       delete scheduledJobs[userId];
//     }

//     // 💡 DEMO: Send a notification after 10 seconds
//     const timeoutId = setTimeout(async () => {
//       try {
//         await sendPushNotification(user.expoPushToken, {
//           title: "⏰ Bedtime Reminder",
//           body: `Demo: Time to sleep now!`,
//         });
//         console.log(`✅ Demo notification sent to user ${user._id}`);
//       } catch (err) {
//         console.error(`❌ Failed to send notification:`, err);
//       }
//     }, 10 * 1000); // 10 seconds

//     // Track scheduled demo job
//     scheduledJobs[userId] = [timeoutId]; // optional

//   } catch (err) {
//     console.error(`Error scheduling user ${userId}:`, err);
//   }
// };


const initializeAllUserSchedules = async () => {
  try {
    await cleanupJobs()
    const users = await User.find({
      predictedBedtimeHours: { $exists: true, $ne: null },
      'wakeup_time.0': { $exists: true }
    });

    for (const user of users) {
      await scheduleUserNotifications(user._id);
    }
    console.log(`Initialized notifications for ${users.length} users`);
  } catch (error) {
    console.error('Error initializing user schedules:', error);
  }
};

// Clean up jobs when server shuts down
const cleanupJobs = async() => {
  Object.values(scheduledJobs).forEach(jobs => jobs.forEach(job => job.stop()));
};

function logScheduledJobs() {
  console.log('\n=== Currently Scheduled Jobs ===');
  Object.entries(scheduledJobs).forEach(([userId, jobs]) => {
    console.log(`\nUser ID: ${userId}`);
    jobs.forEach((job, index) => {
      console.log(`Job ${index + 1}:`);
      
      // Get the underlying cron task
      const task = job.task || job;
      
      // Get cron pattern from private properties if available
      let pattern = 'unknown';
      if (task.expression) {
        pattern = task.expression.source;
      } else if (task.options?.rule) {
        pattern = task.options.rule;
      }
      console.log(`- Cron Pattern: ${pattern}`);
      
      // Get timezone
      const tz = task.options?.timezone || 'unknown';
      console.log(`- Timezone: ${tz}`);
      
      // Calculate next execution
      try {
        if (typeof task.nextDate === 'function') {
          console.log(`- Next Execution: ${task.nextDate().toString()}`);
        } else {
          // Manual calculation if nextDate isn't available
          const now = new Date();
          const nextRun = calculateNextRun(pattern, tz);
          console.log(`- Next Execution: ${nextRun}`);
        }
      } catch (e) {
        console.log(`- Next Execution: could not calculate (${e.message})`);
      }
    });
  });
  console.log('=============================\n');
}

// Helper function to calculate next run time
function calculateNextRun(pattern, timezone) {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = pattern.split(' ');
  const now = moment().tz(timezone);
  
  // Create a date for the next possible execution
  let next = now.clone()
    .set({
      minute: minute === '*' ? now.minute() : parseInt(minute),
      hour: hour === '*' ? now.hour() : parseInt(hour),
      second: 0,
      millisecond: 0
    });
    
  // If the time has already passed today, move to next day
  if (next.isBefore(now)) {
    next.add(1, 'day');
  }
  
  return next.toString();
}

module.exports = {
  scheduleUserNotifications,
  initializeAllUserSchedules,
  cleanupJobs,
  logScheduledJobs
};