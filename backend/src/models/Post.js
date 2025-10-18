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

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 140,
    },
    body: {
      type: String,
      default: '',
    },
    topic: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    commentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

postSchema.virtual('score').get(function score() {
  return this.upvotes.length - this.downvotes.length;
});

postSchema.methods.applyVote = function applyVote(userId, value) {
  voteHandler(this, userId, value);
  return this.score;
};

module.exports = mongoose.model('Post', postSchema);
