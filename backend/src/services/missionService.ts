import MissionTemplate, { MissionType } from '../models/MissionTemplate';
import UserMission from '../models/UserMission';
import UserStreak from '../models/UserStreak';
import LeaderboardEntry from '../models/LeaderboardEntry';
import { adjustStars } from './starService';
import { createNotification } from './notificationService';

const DEFAULT_TEMPLATES = [
  {
    key: 'daily_post',
    title: 'Share something new',
    description: 'Publish 1 post today to keep the feed fresh.',
    type: 'post' as MissionType,
    target: 1,
    rewardStars: 10,
    streakType: 'daily_activity',
  },
  {
    key: 'daily_comment',
    title: 'Join the conversation',
    description: 'Leave 3 thoughtful comments.',
    type: 'comment' as MissionType,
    target: 3,
    rewardStars: 8,
    streakType: 'daily_activity',
  },
  {
    key: 'daily_starforge',
    title: 'Forge a stellar idea',
    description: 'Generate a post draft with Starforge AI.',
    type: 'starforge' as MissionType,
    target: 1,
    rewardStars: 12,
  },
  {
    key: 'invite_friend',
    title: 'Bring a friend aboard',
    description: 'Invite a friend who signs up.',
    type: 'invite' as MissionType,
    target: 1,
    rewardStars: 25,
  },
];

const dateKey = (date = new Date()) => date.toISOString().slice(0, 10);
const weekKey = (date = new Date()) => {
  const week = new Date(date);
  week.setUTCHours(0, 0, 0, 0);
  const day = week.getUTCDay();
  const diff = week.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday start
  week.setUTCDate(diff);
  return week.toISOString().slice(0, 10);
};

const ensureTemplates = async () => {
  await Promise.all(
    DEFAULT_TEMPLATES.map((tpl) =>
      MissionTemplate.findOneAndUpdate(
        { key: tpl.key },
        { $setOnInsert: { ...tpl, active: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ),
    ),
  );
};

const ensureUserMissions = async (userId: string) => {
  await ensureTemplates();
  const templates = await MissionTemplate.find({ active: true }).lean();
  const today = dateKey();
  await Promise.all(
    templates.map((tpl) =>
      UserMission.findOneAndUpdate(
        { user: userId, template: tpl._id, dateKey: today },
        {
          $setOnInsert: {
            progress: 0,
            target: tpl.target,
            status: 'active',
            rewardStars: tpl.rewardStars,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ),
    ),
  );
};

const updateStreak = async (userId: string, streakType: string) => {
  const now = new Date();
  const todayKey = dateKey(now);
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = dateKey(yesterday);

  const streak = await UserStreak.findOne({ user: userId, type: streakType });
  if (!streak) {
    await UserStreak.create({
      user: userId,
      type: streakType,
      count: 1,
      lastCompleted: now,
    });
    return;
  }

  const lastKey = dateKey(streak.lastCompleted);
  if (lastKey === todayKey) {
    return; // already counted today
  }
  if (lastKey === yesterdayKey) {
    streak.count += 1;
  } else {
    streak.count = 1;
  }
  streak.lastCompleted = now;
  await streak.save();
};

const updateLeaderboard = async (userId: string, type: 'missions' | 'referrals' | 'stars-earned', delta: number) => {
  const key = weekKey();
  await LeaderboardEntry.findOneAndUpdate(
    { user: userId, type, periodKey: key },
    { $inc: { value: delta } },
    { upsert: true },
  );
};

export const listUserMissions = async (userId: string) => {
  await ensureUserMissions(userId);
  const today = dateKey();
  const missions = await UserMission.find({ user: userId, dateKey: today })
    .populate('template')
    .sort({ createdAt: 1 })
    .lean();
  return missions;
};

type MissionTemplateDoc = {
  type: MissionType;
  streakType?: string;
  title?: string;
  key?: string;
  rewardStars?: number;
};

export const recordMissionProgress = async (userId: string, type: MissionType, amount = 1) => {
  await ensureUserMissions(userId);
  const today = dateKey();
  const missions = await UserMission.find({
    user: userId,
    dateKey: today,
  }).populate('template');

  await Promise.all(
    missions
      .filter((mission) => {
        const template = mission.template as unknown as MissionTemplateDoc | null;
        return mission.status === 'active' && template && template.type === type;
      })
      .map(async (mission) => {
        const template = mission.template as unknown as MissionTemplateDoc & { title?: string } | null;
        if (!template) return;

        const wasCompleted = mission.status === 'completed' || mission.status === 'claimed';
        mission.progress = Math.min(mission.progress + amount, mission.target);

        let justCompleted = false;
        if (mission.progress >= mission.target && !wasCompleted) {
          mission.progress = mission.target;
          mission.status = 'completed';
          justCompleted = true;
          if (template.streakType) {
            await updateStreak(userId, template.streakType);
          }
        }

        await mission.save();

        if (justCompleted) {
          await createNotification({
            userId,
            type: 'mission-completed',
            title: 'Mission completed!',
            body: template?.title
              ? `You finished "${template.title}". Claim your reward when you’re ready.`
              : 'You completed a mission. Claim your reward when you’re ready.',
            metadata: {
              missionId: mission._id,
              templateKey: (mission.template as { key?: string } | null)?.key,
              rewardStars: template?.rewardStars,
            },
          });
        }
      }),
  );
};

export const claimMission = async (userId: string, missionId: string) => {
  const mission = await UserMission.findById(missionId).populate('template');
  if (!mission || !mission.user.equals(userId)) {
    throw new Error('Mission not found');
  }
  if (mission.status !== 'completed') {
    throw new Error('Mission not ready to claim');
  }

  const updatedUser = await adjustStars(
    userId,
    mission.rewardStars,
    'reward',
    `mission:${mission._id.toString()}`,
  );
  mission.status = 'claimed';
  await mission.save();
  await updateLeaderboard(userId, 'missions', mission.rewardStars);
  return { mission, starsBalance: updatedUser.starsBalance };
};

export const recordReferralMission = async (userId: string) => {
  await recordMissionProgress(userId, 'invite', 1);
  await updateLeaderboard(userId, 'referrals', 1);
};

export const getLeaderboard = async (type: 'missions' | 'referrals' | 'stars-earned') => {
  const key = weekKey();
  const entries = await LeaderboardEntry.find({ type, periodKey: key })
    .sort({ value: -1 })
    .limit(10)
    .populate('user', 'username displayName avatarColor')
    .lean();
  return entries;
};
