import ScheduledPost from '../models/ScheduledPost';
import Post from '../models/Post';
import { ensureActiveMembership } from './communityAccess';
import { recordMissionProgress } from './missionService';

export const publishDueScheduledPosts = async () => {
  const now = new Date();
  const duePosts = await ScheduledPost.find({
    status: 'scheduled',
    scheduledFor: { $lte: now },
  })
    .sort({ scheduledFor: 1 })
    .limit(20);

  // eslint-disable-next-line no-restricted-syntax
  for (const scheduled of duePosts) {
    try {
      scheduled.attempts += 1;

      if (scheduled.community) {
        const membership = await ensureActiveMembership(scheduled.community, scheduled.author);
        if (!membership) {
          scheduled.status = 'failed';
          scheduled.lastError = 'Author is no longer a member of the community';
          await scheduled.save();
          continue;
        }
      }

      const post = await Post.create({
        title: scheduled.title,
        body: scheduled.body,
        topic: scheduled.topic,
        imageUrl: scheduled.imageUrl,
        author: scheduled.author,
        community: scheduled.community,
      });

      scheduled.status = 'published';
      await scheduled.save();
      await post.populate('author', 'username displayName avatarColor');
      await recordMissionProgress(scheduled.author.toString(), 'post');
    } catch (error) {
      scheduled.status = scheduled.attempts >= 3 ? 'failed' : 'scheduled';
      scheduled.lastError = (error as Error).message;
      await scheduled.save();
    }
  }
};
