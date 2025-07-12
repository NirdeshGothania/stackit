const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  avatarUrl: {
    type: String,
    default: null
  },
  fcmToken: {
    type: String,
    default: null
  },
  reputation: {
    type: Number,
    default: 1
  },
  badges: [{
    type: String,
    enum: ['bronze', 'silver', 'gold', 'diamond']
  }],
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ displayName: 'text', email: 'text' });

// Virtual for user's question count
userSchema.virtual('questionCount', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'userId',
  count: true
});

// Virtual for user's answer count
userSchema.virtual('answerCount', {
  ref: 'Answer',
  localField: '_id',
  foreignField: 'userId',
  count: true
});

// Method to update last seen
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

// Static method to find or create user from Firebase
userSchema.statics.findOrCreateFromFirebase = async function(firebaseUser) {
  let user = await this.findOne({ uid: firebaseUser.uid });
  
  if (!user) {
    user = new this({
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || 'Anonymous',
      email: firebaseUser.email,
      avatarUrl: firebaseUser.photoURL
    });
    await user.save();
  } else {
    // Update user info if it has changed
    if (user.displayName !== firebaseUser.displayName || 
        user.email !== firebaseUser.email ||
        user.avatarUrl !== firebaseUser.photoURL) {
      user.displayName = firebaseUser.displayName || user.displayName;
      user.email = firebaseUser.email || user.email;
      user.avatarUrl = firebaseUser.photoURL || user.avatarUrl;
      await user.save();
    }
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema); 