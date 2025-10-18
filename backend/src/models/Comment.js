const mongoose = require('mongoose');

const voteHandler = (doc, userId, value) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const upvoteIndex = doc.upvotes.findIndex((id) => id.equals(userObjectId));
  const downvoteIndex = doc.downvotes.findIndex((id) => id.equals(userObjectId));

  if (value === 1) {
    if (upvoteIndex !== -1) {
      doc.upvotes.splice(upvoteIndex, 1);
    } else {
      if (downvoteIndex !== -1) {
        doc.downvotes.splice(downvoteIndex, 1);
      }
      doc.upvotes.push(userObjectId);
    }
  } else if (value === -1) {
    if (downvoteIndex !== -1) {
      doc.downvotes.splice(downvoteIndex, 1);
    } else {
      if (upvoteIndex !== -1) {
        doc.upvotes.splice(upvoteIndex, 1);
      }
      doc.downvotes.push(userObjectId);
    }
  } else if (value === 0) {
    if (upvoteIndex !== -1) {
      doc.upvotes.splice(upvoteIndex, 1);
    }
    if (downvoteIndex !== -1) {
      doc.downvotes.splice(downvoteIndex, 1);
    }
  }
};

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    ancestors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

commentSchema.virtual('score').get(function score() {
  return this.upvotes.length - this.downvotes.length;
});

commentSchema.methods.applyVote = function applyVote(userId, value) {
  voteHandler(this, userId, value);
  return this.score;
};

module.exports = mongoose.model('Comment', commentSchema);
