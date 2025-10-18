const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const formatUser = (userDoc) => {
  const user = userDoc.toJSON();
  return {
    id: user._id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarColor: user.avatarColor,
    bio: user.bio || '',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const register = async (req, res, next) => {
  try {
    const { username, displayName, email, password, bio } = req.body;

    if (!username || !displayName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with the same email or username already exists' });
    }

    const user = await User.create({
      username: normalizedUsername,
      displayName: displayName.trim(),
      email: normalizedEmail,
      password,
      bio,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();
    const query = normalizedIdentifier.includes('@')
      ? { email: normalizedIdentifier }
      : { username: normalizedIdentifier };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      token,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (_req, res) => {
  return res.status(200).json({ message: 'Logged out' });
};

const getCurrentUser = async (req, res) => {
  return res.status(200).json({ user: formatUser(req.user) });
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
};
