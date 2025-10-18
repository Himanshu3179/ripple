import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

const colorPalette = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
];

export interface IUser {
  username: string;
  displayName: string;
  email: string;
  password: string;
  avatarColor?: string;
  bio?: string;
  starsBalance?: number;
  membershipTier?: 'free' | 'star-pass' | 'star-unlimited';
  membershipExpiresAt?: Date | null;
  aiPostQuota?: {
    limit: number;
    used: number;
    renewsAt: Date;
  };
  referral?: {
    code: string;
    invitedCount: number;
    rewardsClaimed: number;
  };
  settings?: {
    hideAds: boolean;
    theme: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document<Types.ObjectId> {
  matchPassword: (enteredPassword: string) => Promise<boolean>;
  toJSON: () => Omit<IUser, 'password'> & { _id: string; id?: string };
}

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatarColor: {
      type: String,
      default: () => colorPalette[Math.floor(Math.random() * colorPalette.length)],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 180,
    },
    starsBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    membershipTier: {
      type: String,
      enum: ['free', 'star-pass', 'star-unlimited'],
      default: 'free',
    },
    membershipExpiresAt: {
      type: Date,
      default: null,
    },
    aiPostQuota: {
      limit: {
        type: Number,
        default: 3,
      },
      used: {
        type: Number,
        default: 0,
      },
      renewsAt: {
        type: Date,
        default: () => {
          const date = new Date();
          date.setUTCDate(date.getUTCDate() + 30);
          return date;
        },
      },
    },
    referral: {
      code: {
        type: String,
        unique: true,
        sparse: true,
      },
      invitedCount: {
        type: Number,
        default: 0,
      },
      rewardsClaimed: {
        type: Number,
        default: 0,
      },
    },
    settings: {
      hideAds: {
        type: Boolean,
        default: false,
      },
      theme: {
        type: String,
        default: 'light',
      },
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre('save', async function hashPassword(this: IUserDocument, next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.matchPassword = function matchPassword(
  this: IUserDocument,
  enteredPassword: string,
) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function toJSON(this: IUserDocument) {
  const userObject = this.toObject();
  const { password, __v, ...rest } = userObject as typeof userObject & {
    password?: string;
    __v?: number;
  };
  return {
    ...rest,
    id: rest._id?.toString?.() ?? this._id.toString(),
  };
};

const User = model<IUserDocument>('User', userSchema);

export default User;
