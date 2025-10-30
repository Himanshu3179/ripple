import { Schema, model, Document, Types } from 'mongoose';

export type StoryVisibility = 'public' | 'community' | 'private';

export interface IStoryverseStory {
  title: string;
  summary?: string;
  tags: string[];
  visibility: StoryVisibility;
  createdBy: Types.ObjectId;
  rootScene?: Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStoryverseStoryDocument extends IStoryverseStory, Document<Types.ObjectId> {}

const storyverseStorySchema = new Schema<IStoryverseStoryDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    summary: {
      type: String,
      maxlength: 600,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: ['public', 'community', 'private'],
      default: 'public',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rootScene: {
      type: Schema.Types.ObjectId,
      ref: 'StoryverseScene',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

storyverseStorySchema.index({ createdBy: 1, createdAt: -1 });
storyverseStorySchema.index({ visibility: 1, createdAt: -1 });
storyverseStorySchema.index({ tags: 1 });

const StoryverseStory = model<IStoryverseStoryDocument>('StoryverseStory', storyverseStorySchema);

export default StoryverseStory;
