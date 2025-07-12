const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['answer', 'mention', 'comment', 'vote', 'accept', 'bounty']
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  answerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
    default: null
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ toUserId: 1, createdAt: -1 });
notificationSchema.index({ toUserId: 1, isRead: 1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get notifications for a user
notificationSchema.statics.getUserNotifications = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const notifications = await this.find({ toUserId: userId })
    .populate('fromUserId', 'displayName avatarUrl')
    .populate('questionId', 'title')
    .populate('answerId', 'content')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return notifications;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ toUserId: userId, isRead: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { toUserId: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // Emit socket event for real-time notification
  const io = require('../server').io;
  if (io) {
    io.to(`user-${data.toUserId}`).emit('new-notification', {
      id: notification._id,
      type: notification.type,
      content: notification.content,
      createdAt: notification.createdAt
    });
  }

  // Send FCM notification
  try {
    const User = require('./User');
    const user = await User.findById(data.toUserId);
    if (user && user.fcmToken) {
      const { sendPushNotification } = require('../config/firebase');
      await sendPushNotification(user.fcmToken, {
        title: 'New Notification',
        body: data.content,
        data: {
          type: data.type,
          questionId: data.questionId.toString(),
          answerId: data.answerId?.toString() || '',
        }
      });
    }
  } catch (error) {
    console.error('Error sending FCM notification:', error);
  }
  
  return notification;
};

module.exports = mongoose.model('Notification', notificationSchema); 