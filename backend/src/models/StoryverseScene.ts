import { Schema, model, Document, Types } from 'mongoose';

export interface IStoryverseScene {
  story: Types.ObjectId;
  author: Types.ObjectId;
  parentScene?: Types.ObjectId | null;
  choiceLabel?: string | null;
  content: string;
  depth: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStoryverseSceneDocument extends IStoryverseScene, Document<Types.ObjectId> {}

const storyverseSceneSchema = new Schema<IStoryverseSceneDocument>(
  {
    story: {
      type: Schema.Types.ObjectId,
      ref: 'StoryverseStory',
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentScene: {
      type: Schema.Types.ObjectId,
      ref: 'StoryverseScene',
      default: null,
    },
    choiceLabel: {
      type: String,
      maxlength: 120,
      default: null,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    depth: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

storyverseSceneSchema.index({ story: 1, depth: 1 });
storyverseSceneSchema.index({ parentScene: 1 });

const StoryverseScene = model<IStoryverseSceneDocument>('StoryverseScene', storyverseSceneSchema);

export default StoryverseScene;
