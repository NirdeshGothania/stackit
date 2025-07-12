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

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  votes: [voteSchema],
  isAccepted: {
    type: Boolean,
    default: false
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
answerSchema.index({ questionId: 1, createdAt: -1 });
answerSchema.index({ userId: 1 });
answerSchema.index({ isAccepted: 1 });

// Virtual for vote count
answerSchema.virtual('voteCount').get(function() {
  return this.votes.reduce((sum, vote) => sum + vote.vote, 0);
});

// Virtual for user's vote on this answer
answerSchema.virtual('userVote').get(function() {
  return function(userId) {
    const vote = this.votes.find(v => v.userId.toString() === userId.toString());
    return vote ? vote.vote : 0;
  };
});

// Method to add/update vote
answerSchema.methods.addVote = async function(userId, voteValue) {
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

// Method to accept answer
answerSchema.methods.accept = async function(acceptedByUserId) {
  this.isAccepted = true;
  this.acceptedAt = new Date();
  this.acceptedBy = acceptedByUserId;
  
  // Update the question's accepted answer
  const Question = mongoose.model('Question');
  await Question.findByIdAndUpdate(this.questionId, {
    acceptedAnswerId: this._id
  });
  
  return this.save();
};

// Method to unaccept answer
answerSchema.methods.unaccept = async function() {
  this.isAccepted = false;
  this.acceptedAt = null;
  this.acceptedBy = null;
  
  // Remove the question's accepted answer
  const Question = mongoose.model('Question');
  await Question.findByIdAndUpdate(this.questionId, {
    $unset: { acceptedAnswerId: 1 }
  });
  
  return this.save();
};

// Static method to get answers for a question
answerSchema.statics.getAnswersForQuestion = async function(questionId, userId = null) {
  const answers = await this.find({ questionId })
    .populate('userId', 'displayName avatarUrl reputation')
    .populate('acceptedBy', 'displayName')
    .sort({ isAccepted: -1, voteCount: -1, createdAt: -1 })
    .lean();

  // Add vote count and user vote to each answer
  answers.forEach(answer => {
    answer.voteCount = answer.votes.reduce((sum, vote) => sum + vote.vote, 0);
    if (userId) {
      const userVote = answer.votes.find(v => v.userId.toString() === userId.toString());
      answer.userVote = userVote ? userVote.vote : 0;
    }
  });

  return answers;
};

// Pre-save middleware to update question's answer count
answerSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Question = mongoose.model('Question');
    await Question.findByIdAndUpdate(this.questionId, {
      $inc: { answerCount: 1 }
    });
  }
  next();
});

// Pre-remove middleware to update question's answer count
answerSchema.pre('remove', async function(next) {
  const Question = mongoose.model('Question');
  await Question.findByIdAndUpdate(this.questionId, {
    $inc: { answerCount: -1 }
  });
  next();
});

module.exports = mongoose.model('Answer', answerSchema); 