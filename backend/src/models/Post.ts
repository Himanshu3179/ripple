import { Document, Schema, Types, model } from 'mongoose';

export interface IPost {
  title: string;
  body?: string;
  topic: string;
  imageUrl?: string;
  author: Types.ObjectId;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  commentCount: number;
  boostedUntil?: Date | null;
  boostScore?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPostDocument extends IPost, Document<Types.ObjectId> {
  score: number;
  applyVote: (userId: Types.ObjectId | string, value: 1 | 0 | -1) => number;
}

const voteHandler = (doc: IPostDocument, userId: Types.ObjectId | string, value: 1 | 0 | -1) => {
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

const postSchema = new Schema<IPostDocument>(
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
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    commentCount: {
      type: Number,
      default: 0,
    },
    boostedUntil: {
      type: Date,
      default: null,
    },
    boostScore: {
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

postSchema.virtual('score').get(function score(this: IPostDocument) {
  return this.upvotes.length - this.downvotes.length;
});

postSchema.methods.applyVote = function applyVote(
  this: IPostDocument,
  userId: Types.ObjectId | string,
  value: 1 | 0 | -1,
) {
  voteHandler(this, userId, value);
  return this.score;
};

const Post = model<IPostDocument>('Post', postSchema);

export default Post;
