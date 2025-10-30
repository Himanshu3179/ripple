import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import StoryverseStory, { type IStoryverseStoryDocument } from '../models/StoryverseStory';
import StoryverseScene, { type IStoryverseSceneDocument } from '../models/StoryverseScene';
import { checkSpamSubmission } from '../services/spamService';

const serializeStorySummary = (story: {
  _id: Types.ObjectId;
  title: string;
  summary?: string;
  tags: string[];
  visibility: string;
  createdBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}) => ({
  id: story._id.toString(),
  title: story.title,
  summary: story.summary ?? '',
  tags: story.tags,
  visibility: story.visibility,
  createdBy: story.createdBy.toString(),
  createdAt: story.createdAt ?? null,
  updatedAt: story.updatedAt ?? null,
});

const serializeScene = (scene: {
  _id: Types.ObjectId;
  story: Types.ObjectId;
  author: Types.ObjectId;
  parentScene?: Types.ObjectId | null;
  choiceLabel?: string | null;
  content: string;
  depth: number;
  createdAt?: Date;
}) => ({
  id: scene._id.toString(),
  storyId: scene.story.toString(),
  authorId: scene.author.toString(),
  parentSceneId: scene.parentScene ? scene.parentScene.toString() : null,
  choiceLabel: scene.choiceLabel ?? null,
  content: scene.content,
  depth: scene.depth,
  createdAt: scene.createdAt ?? null,
});

export const listStories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search = '', visibility = 'public' } = req.query as { search?: string; visibility?: string };
    const filter: Record<string, unknown> = {};

    if (visibility && ['public', 'community', 'private'].includes(visibility)) {
      filter.visibility = visibility;
    } else {
      filter.visibility = 'public';
    }

    if (search && search.trim().length > 0) {
      const query = search.trim();
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ];
    }

    const stories = await StoryverseStory.find(filter)
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();

    res.status(200).json({ stories: stories.map(serializeStorySummary) });
  } catch (error) {
    next(error as Error);
  }
};

type SceneBase = ReturnType<typeof serializeScene>;

interface SceneNode extends SceneBase {
  children: SceneNode[];
}

const buildSceneTree = (scenes: SceneBase[]): SceneNode[] => {
  const byId = new Map<string, SceneNode>();
  const roots: SceneNode[] = [];

  scenes.forEach((scene) => {
    byId.set(scene.id, { ...scene, children: [] });
  });

  byId.forEach((scene) => {
    if (scene.parentSceneId) {
      const parent = byId.get(scene.parentSceneId);
      if (parent) {
        parent.children.push(scene);
      }
    } else {
      roots.push(scene);
    }
  });

  return roots;
};

export const getStory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storyId } = req.params;

    if (!Types.ObjectId.isValid(storyId)) {
      res.status(400).json({ message: 'Invalid story id' });
      return;
    }

    const story = await StoryverseStory.findById(storyId).lean();
    if (!story) {
      res.status(404).json({ message: 'Story not found' });
      return;
    }

    // TODO: enforce visibility rules when community/private visibility is implemented

    const scenes = await StoryverseScene.find({ story: story._id }).sort({ depth: 1, createdAt: 1 }).lean();
    const serializedScenes = scenes.map(serializeScene);
    const tree = buildSceneTree(serializedScenes);

    res.status(200).json({
      story: serializeStorySummary(story),
      scenes: tree,
    });
  } catch (error) {
    next(error as Error);
  }
};

export const createStory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { title, summary, openingScene, tags = [], visibility = 'public' } = req.body as {
      title?: string;
      summary?: string;
      openingScene?: string;
      tags?: string[];
      visibility?: 'public' | 'community' | 'private';
    };

    if (!title || !openingScene) {
      res.status(400).json({ message: 'Title and opening scene are required' });
      return;
    }

    if (openingScene.trim().length < 40) {
      res.status(400).json({ message: 'Opening scene should be at least 40 characters' });
      return;
    }

    const spamCheck = checkSpamSubmission({
      type: 'post',
      userId: req.user._id.toString(),
      content: `${title} ${openingScene}`,
    });

    if (!spamCheck.allowed) {
      res.status(429).json({ message: spamCheck.message });
      return;
    }

    const story = await StoryverseStory.create({
      title: title.trim(),
      summary: summary?.trim() ?? '',
      tags: tags.slice(0, 8).map((tag) => tag.trim().toLowerCase()).filter(Boolean),
      visibility: ['public', 'community', 'private'].includes(visibility) ? visibility : 'public',
      createdBy: req.user._id,
    });

    const rootScene = await StoryverseScene.create({
      story: story._id,
      author: req.user._id,
      content: openingScene.trim(),
      parentScene: null,
      choiceLabel: null,
      depth: 0,
    });

    story.rootScene = rootScene._id;
    await story.save();

    res.status(201).json({
      story: serializeStorySummary(story.toObject()),
      rootScene: serializeScene(rootScene.toObject()),
    });
  } catch (error) {
    next(error as Error);
  }
};

export const addScene = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { storyId } = req.params;
    const { parentSceneId, choiceLabel, content } = req.body as {
      parentSceneId?: string | null;
      choiceLabel?: string;
      content?: string;
    };

    if (!Types.ObjectId.isValid(storyId)) {
      res.status(400).json({ message: 'Invalid story id' });
      return;
    }

    if (!content || content.trim().length < 1) {
      res.status(400).json({ message: 'Scene content is required' });
      return;
    }

    const story = await StoryverseStory.findById(storyId);
    if (!story) {
      res.status(404).json({ message: 'Story not found' });
      return;
    }

    let parentScene: IStoryverseSceneDocument | null = null;
    if (parentSceneId) {
      if (!Types.ObjectId.isValid(parentSceneId)) {
        res.status(400).json({ message: 'Invalid parent scene id' });
        return;
      }
      parentScene = await StoryverseScene.findById(parentSceneId);
      if (!parentScene || !parentScene.story.equals(story._id)) {
        res.status(404).json({ message: 'Parent scene not found in this story' });
        return;
      }
    }

    const spamCheck = checkSpamSubmission({
      type: 'comment',
      userId: req.user._id.toString(),
      content,
    });

    if (!spamCheck.allowed) {
      res.status(429).json({ message: spamCheck.message });
      return;
    }

    const parentRef = parentScene ? parentScene._id : story.rootScene;
    if (!parentRef) {
      res.status(400).json({ message: 'Story does not have a root scene yet' });
      return;
    }

    const scene = await StoryverseScene.create({
      story: story._id,
      author: req.user._id,
      content: content.trim(),
      parentScene: parentRef,
      choiceLabel: choiceLabel?.trim()?.slice(0, 80) ?? null,
      depth: parentScene ? parentScene.depth + 1 : 1,
    });

    story.updatedAt = new Date();
    await story.save();

    res.status(201).json({ scene: serializeScene(scene.toObject()) });
  } catch (error) {
    next(error as Error);
  }
};
