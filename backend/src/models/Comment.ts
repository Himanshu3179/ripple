import { Document, Schema, Types, model } from 'mongoose';

export interface IComment {
  post: Types.ObjectId;
  author: Types.ObjectId;
  body: string;
  parentComment?: Types.ObjectId | null;
  ancestors: Types.ObjectId[];
  isDeleted: boolean;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICommentDocument extends IComment, Document<Types.ObjectId> {
  score: number;
  applyVote: (userId: Types.ObjectId | string, value: 1 | 0 | -1) => number;
}

const voteHandler = (
  doc: ICommentDocument,
  userId: Types.ObjectId | string,
  value: 1 | 0 | -1,
) => {
  const userObjectId =
    typeof userId === 'string' ? new Types.ObjectId(userId) : new Types.ObjectId(userId);
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
  } else {
    if (upvoteIndex !== -1) {
      doc.upvotes.splice(upvoteIndex, 1);
    }
    if (downvoteIndex !== -1) {
      doc.downvotes.splice(downvoteIndex, 1);
    }
  }
};

const commentSchema = new Schema<ICommentDocument>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    ancestors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    upvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    downvotes: [
      {
        type: Schema.Types.ObjectId,
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

commentSchema.virtual('score').get(function score(this: ICommentDocument) {
  return this.upvotes.length - this.downvotes.length;
});

commentSchema.methods.applyVote = function applyVote(
  this: ICommentDocument,
  userId: Types.ObjectId | string,
  value: 1 | 0 | -1,
) {
  voteHandler(this, userId, value);
  return this.score;
};

const Comment = model<ICommentDocument>('Comment', commentSchema);

export default Comment;
