const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vote: {
    type: Number,
    required: true,
    enum: [-1, 1] // -1 for downvote, 1 for upvote
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  votes: [voteSchema],
  viewCount: {
    type: Number,
    default: 0
  },
  answerCount: {
    type: Number,
    default: 0
  },
  isClosed: {
    type: Boolean,
    default: false
  },
  acceptedAnswerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
    default: null
  },
  bounty: {
    type: Number,
    default: 0
  },
  bountyExpiry: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
questionSchema.index({ title: 'text', content: 'text' });
questionSchema.index({ tags: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ 'votes.length': -1 }); // For sorting by vote count
questionSchema.index({ answerCount: -1 });
questionSchema.index({ viewCount: -1 });

// Virtual for vote count
questionSchema.virtual('voteCount').get(function() {
  return this.votes.reduce((sum, vote) => sum + vote.vote, 0);
});

// Virtual for user's vote on this question
questionSchema.virtual('userVote').get(function() {
  return function(userId) {
    const vote = this.votes.find(v => v.userId.toString() === userId.toString());
    return vote ? vote.vote : 0;
  };
});

// Method to add/update vote
questionSchema.methods.addVote = async function(userId, voteValue) {
  const existingVoteIndex = this.votes.findIndex(v => v.userId.toString() === userId.toString());
  
  if (existingVoteIndex !== -1) {
    // Update existing vote
    if (this.votes[existingVoteIndex].vote === voteValue) {
      // Remove vote if same value
      this.votes.splice(existingVoteIndex, 1);
    } else {
      // Change vote
      this.votes[existingVoteIndex].vote = voteValue;
    }
  } else {
    // Add new vote
    this.votes.push({ userId, vote: voteValue });
  }
  
  return this.save();
};

// Method to increment view count
questionSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to update answer count
questionSchema.methods.updateAnswerCount = async function() {
  const Answer = mongoose.model('Answer');
  this.answerCount = await Answer.countDocuments({ questionId: this._id });
  return this.save();
};

// Static method to get questions with filters
questionSchema.statics.getQuestions = async function(filters = {}) {
  const {
    page = 1,
    limit = 10,
    filter = 'newest',
    search = '',
    tag = '',
    userId = null
  } = filters;

  const skip = (page - 1) * limit;
  let query = {};

  // Search filter
  if (search) {
    query.$text = { $search: search };
  }

  // Tag filter
  if (tag) {
    query.tags = tag.toLowerCase();
  }

  // User filter
  if (userId) {
    query.userId = userId;
  }

  // Sort based on filter
  let sort = {};
  switch (filter) {
    case 'newest':
      sort = { createdAt: -1 };
      break;
    case 'most_voted':
      sort = { voteCount: -1, createdAt: -1 };
      break;
    case 'unanswered':
      query.answerCount = 0;
      sort = { createdAt: -1 };
      break;
    case 'most_viewed':
      sort = { viewCount: -1, createdAt: -1 };
      break;
    default:
      sort = { createdAt: -1 };
  }

  const questions = await this.find(query)
    .populate('userId', 'displayName avatarUrl')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  // Add vote count to each question
  questions.forEach(question => {
    question.voteCount = question.votes.reduce((sum, vote) => sum + vote.vote, 0);
  });

  return questions;
};

// Pre-save middleware to ensure tags are unique and lowercase
questionSchema.pre('save', function(next) {
  if (this.tags) {
    this.tags = [...new Set(this.tags.map(tag => tag.toLowerCase().trim()))];
  }
  next();
});

module.exports = mongoose.model('Question', questionSchema); 