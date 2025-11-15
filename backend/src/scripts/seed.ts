/* eslint-disable no-console */
import mongoose, { Types } from 'mongoose';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import connectDB from '../config/db'; // Adjust path if needed

// --- Import All Models ---
import User from '../models/User';
import Community from '../models/Community';
import Post from '../models/Post';
import Comment from '../models/Comment';
import CommunityMember from '../models/CommunityMember';
import Report, { IReportDocument } from '../models/Report';
import MissionTemplate, { IMissionTemplate, IMissionTemplateDocument } from '../models/MissionTemplate';
import UserMission, { IUserMissionDocument } from '../models/UserMission';
import PaymentTransaction from '../models/PaymentTransaction';
import AuditLog from '../models/AuditLog';
import CommunityInvite from '../models/CommunityInvite';
import CommunitySettings from '../models/CommunitySettings';
import LeaderboardEntry from '../models/LeaderboardEntry';
import Notification from '../models/Notification';
import ReferralLedger from '../models/ReferralLedger';
import ScheduledPost from '../models/ScheduledPost';
import StarLedger from '../models/StarLedger';
import StoryverseScene, { IStoryverseScene, IStoryverseSceneDocument } from '../models/StoryverseScene';
import StoryverseStory from '../models/StoryverseStory';
import UserStreak from '../models/UserStreak';

import { ICommunityDocument } from '../models/Community';
import { IUserDocument } from '../models/User';
import { IPostDocument } from '../models/Post';
import { ICommentDocument } from '../models/Comment';
import { IStoryverseStoryDocument } from '../models/StoryverseStory';

dotenv.config();

// --- 💎 CONFIGURATION "KNOBS" ---
const USER_COUNT = 1000;
const COMMUNITIES_PER_USER = 0.5;
const POPULAR_COMMUNITY_COUNT = 3;
const POSTS_PER_USER = 10;
const COMMENTS_PER_POST = 15;
const REPLIES_PER_COMMENT_MAX = 5;
const REPORT_COUNT = 500;
const STORY_COUNT = 50;
const STORY_SCENES_PER_STORY = 20;
const BATCH_SIZE = 1000; // For bulk operations

// --- Variety Percentages ---
const PERCENT_USERS_WITH_MEMBERSHIP = 0.1;
const PERCENT_USERS_ARE_LURKERS = 0.4;
const PERCENT_POSTS_ARE_IMAGE_POSTS = 0.3;
const PERCENT_POSTS_IN_POPULAR_COMMUNITIES = 0.8;
const VOTE_DENSITY = 0.2;

// --- Utility ---
const DEFAULT_PASSWORD = 'test123'; // This will be hashed now
const getRandomItem = <T>(arr: T[]): T => {
  if (!arr.length) {
    throw new Error('Cannot get random item from an empty array');
  }
  return arr[Math.floor(Math.random() * arr.length)];
};
const getRandomSubset = <T>(arr: T[], count: number): T[] => {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
};

/**
 * 📊 Displays a progress bar in the console.
 */
const showProgress = (current: number, total: number, taskName: string) => {
  const percentage = Math.floor((current / total) * 100);
  const barLength = 40;
  const completedLength = Math.round((barLength * current) / total);
  const remainingLength = barLength - completedLength;
  const bar = `[${'='.repeat(completedLength)}${' '.repeat(remainingLength)}]`;
  process.stdout.write(`  ${taskName}: ${bar} ${percentage}% (${current}/${total})\r`);
};

// --- WIPE ---
const clearDatabase = async () => {
  console.log('--- 🧹 Clearing Database ---');
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  console.log('Database cleared.');
};

// --- SEEDERS ---

/**
 * ✅ FIXED: Uses User.create() to trigger pre('save') password hashing.
 */
const seedUsers = async (): Promise<IUserDocument[]> => {
  console.log(`--- 🌱 Seeding ${USER_COUNT} Users ---`);
  const userPromises: Promise<IUserDocument>[] = [];

  // 1. Create a specific Admin user
  userPromises.push(User.create({
    username: 'admin',
    displayName: 'Admin User',
    email: 'admin@ripple.com',
    password: DEFAULT_PASSWORD,
    role: 'admin',
    membershipTier: 'star-unlimited',
    starsBalance: 1000000,
  }));

  // 2. Create standard users
  for (let i = 0; i < USER_COUNT - 1; i++) {
    const isPremium = Math.random() < PERCENT_USERS_WITH_MEMBERSHIP;
    userPromises.push(User.create({
      username: faker.internet.displayName().toLowerCase().replace(/[^a-z0-9_.]/g, '') + `_${i}`,
      displayName: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: DEFAULT_PASSWORD,
      bio: faker.person.bio(),
      membershipTier: isPremium ? getRandomItem(['star-pass', 'star-unlimited']) : 'free',
      membershipExpiresAt: isPremium ? faker.date.future({ years: 1 }) : null,
      starsBalance: isPremium ? faker.number.int({ min: 500, max: 5000 }) : faker.number.int({ min: 0, max: 200 }),
    }));
  }

  const createdUsers = await Promise.all(userPromises);
  console.log(`${createdUsers.length} users seeded (with hashed passwords).`);
  return createdUsers;
};

const seedCommunities = async (users: IUserDocument[]): Promise<ICommunityDocument[]> => {
  const communityCount = Math.floor(USER_COUNT * COMMUNITIES_PER_USER);
  console.log(`--- 🌱 Seeding ${communityCount} Communities ---`);

  const communities: ICommunityDocument[] = [];
  const memberships: any[] = [];
  const allUserIds = users.map(u => u._id);

  // 1. Create Popular Communities
  for (let i = 0; i < POPULAR_COMMUNITY_COUNT; i++) {
    const creator = getRandomItem(users);
    const name = `Popular Hub ${i + 1}: ${faker.commerce.department()}`;
    const community = new Community({
      name,
      slug: faker.helpers.slugify(name).toLowerCase(),
      description: faker.lorem.sentences(2),
      creator: creator._id,
      visibility: 'public',
    });

    const memberCount = Math.floor(allUserIds.length * (Math.random() * 0.4 + 0.4));
    const memberIds = getRandomSubset(allUserIds, memberCount);
    for (const userId of memberIds) {
      memberships.push({
        community: community._id,
        user: userId,
        role: userId.equals(creator._id) ? 'owner' : 'member',
        status: 'active',
      });
    }
    community.memberCount = memberIds.length;
    communities.push(community);
  }

  // 2. Create Niche Communities
  for (let i = 0; i < communityCount - POPULAR_COMMUNITY_COUNT; i++) {
    const creator = getRandomItem(users);
    const name = `${faker.word.adjective()} ${faker.word.noun()} Hub ${i}`;
    const community = new Community({
      name,
      slug: faker.helpers.slugify(name).toLowerCase(),
      description: faker.lorem.sentence(),
      creator: creator._id,
      visibility: getRandomItem(['public', 'restricted', 'private']),
    });

    const memberCount = faker.number.int({ min: 1, max: 50 });
    const memberIds = getRandomSubset(allUserIds, memberCount);
    if (!memberIds.some(id => id.equals(creator._id))) {
      memberIds.push(creator._id);
    }
    for (const userId of memberIds) {
      memberships.push({
        community: community._id,
        user: userId,
        role: userId.equals(creator._id) ? 'owner' : 'member',
        status: 'active',
      });
    }
    community.memberCount = memberIds.length;
    communities.push(community);
  }

  const createdCommunities = await Community.insertMany(communities);
  await CommunityMember.insertMany(memberships);
  console.log(`${createdCommunities.length} communities and ${memberships.length} memberships seeded.`);
  return createdCommunities;
};

const seedPosts = async (users: IUserDocument[], communities: ICommunityDocument[]): Promise<IPostDocument[]> => {
  const postCount = USER_COUNT * POSTS_PER_USER;
  console.log(`--- 🌱 Seeding ${postCount} Posts ---`);

  const posts: IPostDocument[] = [];
  const popularCommunityIds = communities.slice(0, POPULAR_COMMUNITY_COUNT).map(c => c._id);
  const nicheCommunityIds = communities.slice(POPULAR_COMMUNITY_COUNT).map(c => c._id);

  const lurkerCount = Math.floor(users.length * PERCENT_USERS_ARE_LURKERS);
  const posters = users.slice(lurkerCount);

  for (let i = 0; i < postCount; i++) {
    const author = getRandomItem(posters);
    let communityId: Types.ObjectId | null = null;

    if (Math.random() < PERCENT_POSTS_IN_POPULAR_COMMUNITIES) {
      communityId = getRandomItem(popularCommunityIds);
    } else if (nicheCommunityIds.length > 0) {
      communityId = getRandomItem(nicheCommunityIds);
    }

    const isImagePost = Math.random() < PERCENT_POSTS_ARE_IMAGE_POSTS;
    const isBoosted = Math.random() < 0.01;

    const post = new Post({
      title: faker.lorem.sentence(Math.floor(Math.random() * 5) + 4),
      body: faker.lorem.paragraphs(Math.floor(Math.random() * 4) + 1),
      topic: faker.lorem.word({ length: { min: 3, max: 10 } }),
      author: author._id,
      community: communityId,
      imageUrl: isImagePost ? faker.image.urlLoremFlickr({ category: 'abstract' }) : undefined,
      boostedUntil: isBoosted ? faker.date.soon({ days: 3 }) : null,
      boostScore: isBoosted ? faker.number.int({ min: 100, max: 1000 }) : 0,
    });
    posts.push(post);
  }

  const createdPosts = await Post.insertMany(posts);
  console.log(`${createdPosts.length} posts seeded.`);
  return createdPosts;
};

/**
 * ✅ OPTIMIZED: Uses bulkWrite to update post.commentCount
 */
const seedComments = async (users: IUserDocument[], posts: IPostDocument[]): Promise<ICommentDocument[]> => {
  console.log('--- 🌱 Seeding Comments & Replies ---');

  let allComments: ICommentDocument[] = [];
  const lurkerCount = Math.floor(users.length * PERCENT_USERS_ARE_LURKERS);
  const commenters = users.slice(lurkerCount);
  const postUpdateOperations: any[] = [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const postComments: ICommentDocument[] = [];
    const commentCount = faker.number.int({ min: 0, max: COMMENTS_PER_POST });
    let repliesForThisPost: ICommentDocument[] = [];

    // 1. Create Top-Level Comments
    for (let j = 0; j < commentCount; j++) {
      const author = getRandomItem(commenters);
      const isDeleted = Math.random() < 0.05;
      const comment = new Comment({
        post: post._id,
        author: author._id,
        body: isDeleted ? '[deleted]' : faker.lorem.sentences(Math.floor(Math.random() * 3) + 1),
        parentComment: null,
        ancestors: [],
        isDeleted: isDeleted,
      });
      postComments.push(comment);
    }
    const createdTopLevel = (await Comment.insertMany(postComments)) as ICommentDocument[];
    allComments = allComments.concat(createdTopLevel);

    // 2. Create Nested Replies
    for (const parentComment of createdTopLevel) {
      if (parentComment.isDeleted) continue;
      const replyCount = faker.number.int({ min: 0, max: REPLIES_PER_COMMENT_MAX });
      const replies: ICommentDocument[] = [];
      for (let j = 0; j < replyCount; j++) {
        const author = getRandomItem(commenters);
        const reply = new Comment({
          post: post._id,
          author: author._id,
          body: faker.lorem.sentence(),
          parentComment: parentComment._id,
          ancestors: [parentComment._id],
        });
        replies.push(reply);
      }
      const createdReplies = (await Comment.insertMany(replies)) as ICommentDocument[];
      repliesForThisPost = repliesForThisPost.concat(createdReplies);
    }

    const totalNonDeleted =
      createdTopLevel.filter(c => !c.isDeleted).length +
      repliesForThisPost.filter(c => !c.isDeleted).length;

    postUpdateOperations.push({
      updateOne: {
        filter: { _id: post._id },
        update: { $set: { commentCount: totalNonDeleted } },
      },
    });

    allComments = allComments.concat(repliesForThisPost);
    showProgress(i + 1, posts.length, 'Processing posts for comments');
  }

  process.stdout.write('\n');
  console.log('  Updating post comment counts...');
  if (postUpdateOperations.length > 0) {
    await Post.bulkWrite(postUpdateOperations, { ordered: false });
  }

  console.log(`\n${allComments.length} comments and replies seeded.`);
  return allComments;
};

/**
 * ✅ OPTIMIZED: Uses bulkWrite for massive speed and memory gains.
 */
const seedInteractions = async (users: IUserDocument[], posts: IPostDocument[], comments: ICommentDocument[]) => {
  console.log('--- 🌱 Simulating User Interactions (Votes) ---');
  let postVoteCount = 0;
  let commentVoteCount = 0;

  // 1. Vote on Posts (Optimized)
  console.log('  Calculating post votes...');
  let postOperations = [];
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const usersToVote = getRandomSubset(users, Math.floor(users.length * VOTE_DENSITY));
    for (const user of usersToVote) {
      const voteType = Math.random();
      if (voteType < 0.75) post.applyVote(user._id, 1);
      else if (voteType < 0.95) post.applyVote(user._id, -1);
      else {
        post.upvotes.push(user._id);
        post.downvotes.push(new Types.ObjectId());
      }
      postVoteCount++;
    }
    postOperations.push({
      updateOne: {
        filter: { _id: post._id },
        update: { $set: { upvotes: post.upvotes, downvotes: post.downvotes } },
      },
    });
    if (postOperations.length >= BATCH_SIZE) {
      await Post.bulkWrite(postOperations, { ordered: false });
      postOperations = [];
    }
    showProgress(i + 1, posts.length, 'Simulating post votes      ');
  }
  if (postOperations.length > 0) await Post.bulkWrite(postOperations, { ordered: false });

  process.stdout.write('\n');
  console.log(`  ${postVoteCount} post votes simulated.`);

  // 2. Vote on Comments (Optimized)
  console.log('  Calculating comment votes...');
  let commentOperations = [];
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    if (comment.isDeleted) continue;
    const usersToVote = getRandomSubset(users, Math.floor(users.length * VOTE_DENSITY * 0.5));
    for (const user of usersToVote) {
      const value = Math.random() < 0.8 ? 1 : -1;
      comment.applyVote(user._id, value as 1 | -1);
      commentVoteCount++;
    }
    commentOperations.push({
      updateOne: {
        filter: { _id: comment._id },
        update: { $set: { upvotes: comment.upvotes, downvotes: comment.downvotes } },
      },
    });
    if (commentOperations.length >= BATCH_SIZE) {
      await Comment.bulkWrite(commentOperations, { ordered: false });
      commentOperations = [];
      showProgress(i + 1, comments.length, 'Simulating comment votes  ');
    }
  }
  if (commentOperations.length > 0) await Comment.bulkWrite(commentOperations, { ordered: false });

  process.stdout.write('\n');
  console.log(`  ${commentVoteCount} comment votes simulated.`);
};

const seedReports = async (users: IUserDocument[], posts: IPostDocument[], comments: ICommentDocument[]) => {
  console.log(`--- 🌱 Seeding ${REPORT_COUNT} Reports ---`);
  const reports: any[] = [];
  const targets = [...posts, ...comments.filter(c => !c.isDeleted)];
  if (targets.length === 0) {
    console.log('  No targets to report. Skipping.');
    return;
  }
  for (let i = 0; i < REPORT_COUNT; i++) {
    const reporter = getRandomItem(users);
    const target = getRandomItem(targets);
    const isAdmin = Math.random() < 0.5;
    const status = isAdmin ? getRandomItem(['resolved', 'dismissed']) : 'open';
    reports.push({
      reporter: reporter._id,
      targetType: (target as IPostDocument).title ? 'post' : 'comment',
      targetId: target._id,
      community: (target as IPostDocument).community || null,
      reason: faker.lorem.sentence(),
      status: status,
      moderator: isAdmin ? getRandomItem(users)._id : null,
      resolutionNote: isAdmin ? faker.lorem.sentence() : undefined,
    });
  }
  await Report.insertMany(reports);
  console.log(`${reports.length} reports seeded.`);
};

const seedMissions = async (users: IUserDocument[]): Promise<{ templates: IMissionTemplateDocument[], userMissions: IUserMissionDocument[] }> => {
  console.log('--- 🌱 Seeding Missions ---');

  const templatesData: IMissionTemplate[] = [
    { key: 'daily-post', title: 'Daily Post', description: 'Make one post', type: 'post', target: 1, rewardStars: 10, active: true, streakType: 'daily' },
    { key: 'weekly-comments', title: 'Weekly Chatter', description: 'Make 10 comments', type: 'comment', target: 10, rewardStars: 50, active: true },
    { key: 'monthly-invites', title: 'Recruiter', description: 'Invite 3 users', type: 'invite', target: 3, rewardStars: 200, active: true },
  ];
  await MissionTemplate.deleteMany({});
  const templates = await MissionTemplate.insertMany(templatesData);
  console.log(`  ${templates.length} mission templates seeded.`);

  const userMissions: any[] = [];
  const dateKey = new Date().toISOString().split('T')[0];
  for (const user of users) {
    for (const template of templates) {
      const status = getRandomItem(['active', 'completed', 'claimed', 'expired']);
      const progress = status === 'completed' || status === 'claimed' ? template.target : faker.number.int({ min: 0, max: template.target - 1 });
      userMissions.push({
        user: user._id,
        template: template._id,
        dateKey: dateKey,
        progress: progress,
        target: template.target,
        status: status,
        rewardStars: template.rewardStars,
      });
    }
  }
  const createdUserMissions = await UserMission.insertMany(userMissions);
  console.log(`  ${createdUserMissions.length} user missions seeded.`);
  return { templates, userMissions: createdUserMissions as IUserMissionDocument[] };
};

/**
 * 🆕 NEW: Seeds all economy, notification, and gamification models
 */
const seedLedgersAndEconomy = async (users: IUserDocument[], userMissions: IUserMissionDocument[]) => {
  console.log('--- 🌱 Seeding Economy & Notifications ---');
  const notifications: any[] = [];
  const starLedgerEntries: any[] = [];
  const referralLedgerEntries: any[] = [];
  const leaderboardEntries: any[] = [];
  const userStreaks: any[] = [];
  const premiumUsers = users.filter(u => u.membershipTier !== 'free');

  const periodKey = new Date().toISOString().slice(0, 7); // e.g., "2025-11"

  // 1. Payment Transactions (for premium users)
  const paymentTransactions: any[] = [];
  for (const user of premiumUsers) {
    paymentTransactions.push({
      user: user._id,
      kind: 'membership-monthly',
      reference: `seed_${faker.string.alphanumeric(10)}`,
      amountINR: 29900,
      membershipTier: user.membershipTier,
      razorpayPaymentId: `pay_${faker.string.alphanumeric(14)}`,
      status: 'paid',
    });
  }
  await PaymentTransaction.insertMany(paymentTransactions);
  console.log(`  ${paymentTransactions.length} payment transactions seeded.`);

  // 2. Streaks, Ledgers, Notifications, and Leaderboards
  for (const user of users) {
    // 2a. User Streaks
    if (Math.random() < 0.3) {
      userStreaks.push({
        user: user._id,
        type: 'daily-post',
        count: faker.number.int({ min: 1, max: 50 }),
        lastCompleted: faker.date.recent({ days: 1 }),
      });
    }

    // 2b. Star Ledger & Notifications (from tips)
    if (Math.random() < 0.1) {
      const tipper = getRandomItem(users);
      const amount = getRandomItem([10, 50, 100]);
      if (tipper._id.equals(user._id)) continue; // Can't tip self

      starLedgerEntries.push({
        user: user._id,
        type: 'tip-received',
        stars: amount,
        balanceAfter: (user.starsBalance || 0) + amount,
        metadata: { fromUser: tipper._id },
      });
      starLedgerEntries.push({
        user: tipper._id,
        type: 'tip-sent',
        stars: -amount,
        balanceAfter: (tipper.starsBalance || 0) - amount,
        metadata: { toUser: user._id },
      });
      notifications.push({
        user: user._id,
        type: 'tip-received',
        title: `${tipper.displayName} sent you ${amount} stars!`,
        metadata: { amount, fromUser: tipper.username },
      });
    }

    // 2c. Referral Ledger
    if (Math.random() < 0.05) {
      referralLedgerEntries.push({
        referrer: user._id,
        inviteeEmail: faker.internet.email().toLowerCase(),
        rewardStars: 50,
        rewardType: 'signup',
        claimed: Math.random() < 0.5,
      });
    }

    // 2d. Leaderboard
    leaderboardEntries.push({
      type: 'stars-earned',
      user: user._id,
      periodKey: periodKey,
      value: user.starsBalance,
    });
  }

  // 3. Data from Missions
  for (const mission of userMissions) {
    if (mission.status === 'claimed') {
      starLedgerEntries.push({
        user: mission.user,
        type: 'mission-reward',
        stars: mission.rewardStars,
        balanceAfter: (getRandomItem(users).starsBalance || 0) + mission.rewardStars, // Approximation for seed
        reference: mission._id,
      });
      notifications.push({
        user: mission.user,
        type: 'mission-completed',
        title: `Mission Complete! You earned ${mission.rewardStars} stars.`,
        metadata: { missionId: mission._id, reward: mission.rewardStars },
      });
    }
  }

  await StarLedger.insertMany(starLedgerEntries);
  await Notification.insertMany(notifications);
  await ReferralLedger.insertMany(referralLedgerEntries);
  await LeaderboardEntry.insertMany(leaderboardEntries);
  await UserStreak.insertMany(userStreaks);

  console.log(`  ${starLedgerEntries.length} star ledger entries seeded.`);
  console.log(`  ${notifications.length} notifications seeded.`);
  console.log(`  ${referralLedgerEntries.length} referral entries seeded.`);
  console.log(`  ${leaderboardEntries.length} leaderboard entries seeded.`);
  console.log(`  ${userStreaks.length} user streaks seeded.`);
};

/**
 * 🆕 NEW: Seeds Storyverse models
 */
const seedStoryverse = async (users: IUserDocument[]): Promise<void> => {
  console.log(`--- 🌱 Seeding ${STORY_COUNT} Storyverse Stories ---`);

  const stories: IStoryverseStoryDocument[] = [];
  for (let i = 0; i < STORY_COUNT; i++) {
    stories.push(new StoryverseStory({
      title: faker.lorem.sentence(5),
      summary: faker.lorem.paragraph(),
      tags: [faker.lorem.word(), faker.lorem.word()],
      visibility: getRandomItem(['public', 'private']),
      createdBy: getRandomItem(users)._id,
    }));
  }
  const createdStories = await StoryverseStory.insertMany(stories);

  let allScenes: any[] = [];
  for (const story of createdStories) {
    const scenes: any[] = [];
    let parentSceneId: Types.ObjectId | null = null;
    let rootSceneId: Types.ObjectId | null = null;

    for (let i = 0; i < STORY_SCENES_PER_STORY; i++) {
      const scene: IStoryverseScene = {
        story: story._id,
        author: getRandomItem(users)._id,
        parentScene: parentSceneId,
        choiceLabel: parentSceneId ? faker.lorem.sentence(4) : null,
        content: faker.lorem.paragraphs(2),
        depth: parentSceneId ? 1 : 0, // Simplified for seeding
      };

      const createdScene: IStoryverseSceneDocument = await StoryverseScene.create(scene);

      if (!rootSceneId) {
        rootSceneId = createdScene._id;
        story.rootScene = rootSceneId;
        await story.save();
      }

      // 30% chance to branch, otherwise continue linearly
      if (Math.random() > 0.3) {
        parentSceneId = createdScene._id;
      }
      scenes.push(createdScene);
    }
    allScenes = allScenes.concat(scenes);
  }

  console.log(`  ${createdStories.length} stories seeded.`);
  console.log(`  ${allScenes.length} story scenes seeded.`);
};

/**
 * 🆕 NEW: Seeds remaining Community sub-models
 */
const seedCommunityExtras = async (communities: ICommunityDocument[], users: IUserDocument[]) => {
  console.log('--- 🌱 Seeding Community Extras ---');
  const settings: any[] = [];
  const invites: any[] = [];

  for (const community of communities) {
    // 1. Community Settings
    settings.push({
      community: community._id,
      bannedKeywords: [faker.lorem.word(), faker.lorem.word()],
      allowExternalLinks: Math.random() < 0.8,
      slowModeSeconds: getRandomItem([0, 5, 30, 60]),
    });

    // 2. Community Invites
    if (Math.random() < 0.5) { // 50% of communities have an invite
      invites.push({
        community: community._id,
        code: faker.string.alphanumeric(8),
        createdBy: community.creator,
        maxUses: getRandomItem([null, 10, 100]),
        expiresAt: Math.random() < 0.2 ? faker.date.future() : null,
      });
    }
  }

  await CommunitySettings.insertMany(settings);
  await CommunityInvite.insertMany(invites);
  console.log(`  ${settings.length} community settings seeded.`);
  console.log(`  ${invites.length} community invites seeded.`);
};

/**
 * 🆕 NEW: Seeds Scheduled Posts
 */
const seedScheduledPosts = async (users: IUserDocument[], communities: ICommunityDocument[]) => {
  console.log('--- 🌱 Seeding Scheduled Posts ---');
  const scheduledPosts: any[] = [];
  const lurkerCount = Math.floor(users.length * PERCENT_USERS_ARE_LURKERS);
  const posters = users.slice(lurkerCount);

  for (let i = 0; i < 50; i++) { // Create 50 scheduled posts
    scheduledPosts.push({
      author: getRandomItem(posters)._id,
      community: getRandomItem(communities)._id,
      title: `Scheduled: ${faker.lorem.sentence(5)}`,
      body: faker.lorem.paragraphs(2),
      topic: faker.lorem.word({ length: { min: 3, max: 10 } }),
      scheduledFor: faker.date.soon({ days: 10 }),
      status: 'scheduled',
    });
  }

  await ScheduledPost.insertMany(scheduledPosts);
  console.log(`  ${scheduledPosts.length} scheduled posts seeded.`);
};

/**
 * 🆕 NEW: Seeds Audit Logs for admin actions
 */
const seedAuditLogs = async (users: IUserDocument[], reports: IReportDocument[]) => {
  console.log('--- 🌱 Seeding Audit Logs ---');
  const logs: any[] = [];
  const adminUser = users.find(u => u.role === 'admin');
  if (!adminUser) return;

  const resolvedReports = reports.filter(r => r.status === 'resolved');
  for (const report of resolvedReports) {
    logs.push({
      actor: adminUser._id,
      action: 'report.resolve',
      targetType: report.targetType,
      targetId: report.targetId,
      metadata: { resolutionNote: report.resolutionNote },
    });
  }

  await AuditLog.insertMany(logs);
  console.log(`  ${logs.length} audit logs seeded.`);
};


// --- 🚀 MAIN EXECUTION ---
const main = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Aborting seed. Seeding is disabled in production environments.');
    process.exit(1);
  }

  await connectDB();
  const startTime = Date.now();

  try {
    await clearDatabase();

    // --- Tier 1: Core Data ---
    const users = await seedUsers();
    const communities = await seedCommunities(users);
    const posts = await seedPosts(users, communities);
    const comments = await seedComments(users, posts);

    // --- Tier 2: Interactions & Gamification ---
    await seedInteractions(users, posts, comments);
    const { userMissions } = await seedMissions(users);
    await seedLedgersAndEconomy(users, userMissions); // Now seeds all ledgers, notifications, etc.

    // --- Tier 3: Features ---
    await seedStoryverse(users);
    await seedScheduledPosts(users, communities);

    // --- Tier 4: Moderation & Settings ---
    const reports = await Report.find().lean<IReportDocument[]>();
    await seedReports(users, posts, comments);
    await seedCommunityExtras(communities, users);
    await seedAuditLogs(users, reports);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`\n✅✅✅ Database seeding completed successfully in ${duration} seconds! ✅✅✅`);

  } catch (error) {
    console.error('\n❌ An error occurred during database seeding:');
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('--- 🛑 Disconnected from database ---');
  }
};

main();