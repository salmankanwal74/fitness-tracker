import mongoose from 'mongoose';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import { createNotification } from '../utils/notify.js';

const escapeRegex = (s) => String(s).slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const serverError = (res, error) => {
  console.error('[500]', error);
  res.status(500).json({ message: 'Server error, dobara try karein' });
};

// profileImage list mein nahi bhejte (base64 bohat bari hoti hai)
const PUBLIC_FIELDS = 'name username';

// Users ki list ko isFollowing + followersCount ke saath taiyar karta hai
const decorate = async (users, meId) => {
  const ids = users.map((u) => u._id);
  const [mine, counts] = await Promise.all([
    Follow.find({ follower: meId, following: { $in: ids } }).select('following'),
    Follow.aggregate([
      { $match: { following: { $in: ids } } },
      { $group: { _id: '$following', count: { $sum: 1 } } },
    ]),
  ]);
  const followingSet = new Set(mine.map((f) => String(f.following)));
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return users.map((u) => ({
    _id: u._id,
    name: u.name,
    username: u.username || '',
    isFollowing: followingSet.has(String(u._id)),
    followersCount: countMap.get(String(u._id)) || 0,
  }));
};

// @desc    Users search (name ya username se) — pagination ke saath
// @route   GET /api/users/search?q=ali&page=1
export const searchUsers = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.status(400).json({ message: 'Kam az kam 2 characters likhein' });

       const page = Math.min(Math.max(parseInt(req.query.page) || 1, 1), 1000);
    const limit = 10;
    const rx = new RegExp(escapeRegex(q), 'i');
    const filter = { _id: { $ne: req.user._id }, $or: [{ name: rx }, { username: rx }] };

    const [users, total] = await Promise.all([
      User.find(filter).select(PUBLIC_FIELDS).sort({ username: 1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ users: await decorate(users, req.user._id), page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    serverError(res, error);
  }
};

// @desc    Follow
// @route   POST /api/users/:id/follow
export const followUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
    if (String(id) === String(req.user._id)) {
      return res.status(400).json({ message: 'Aap khud ko follow nahi kar sakte' });
    }
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: 'User nahi mila' });

    try {
      await Follow.create({ follower: req.user._id, following: id });
    } catch (e) {
      if (e.code !== 11000) throw e; // pehle se follow kar rakha hai
      return res.json({ following: true });
    }

        await createNotification(target, {
      type: 'follower',
      message: `${req.user.name} (@${req.user.username || 'user'}) ne aap ko follow kiya`,
      key: `follow-${req.user._id}`,
      link: '/community',
    });

    res.status(201).json({ following: true });
  } catch (error) {
    serverError(res, error);
  }
};

// @desc    Unfollow
// @route   DELETE /api/users/:id/follow
export const unfollowUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    await Follow.deleteOne({ follower: req.user._id, following: req.params.id });
    res.json({ following: false });
  } catch (error) {
    serverError(res, error);
  }
};

// @desc    Mere followers
// @route   GET /api/users/me/followers
export const getMyFollowers = async (req, res) => {
  try {
    const rows = await Follow.find({ following: req.user._id }).sort({ createdAt: -1 }).limit(100).populate('follower', PUBLIC_FIELDS);
    const users = rows.map((r) => r.follower).filter(Boolean);
    res.json(await decorate(users, req.user._id));
  } catch (error) {
    serverError(res, error);
  }
};

// @desc    Jin ko main follow karta hoon
// @route   GET /api/users/me/following
export const getMyFollowing = async (req, res) => {
  try {
    const rows = await Follow.find({ follower: req.user._id }).sort({ createdAt: -1 }).limit(100).populate('following', PUBLIC_FIELDS);
    const users = rows.map((r) => r.following).filter(Boolean);
    res.json(await decorate(users, req.user._id));
  } catch (error) {
    serverError(res, error);
  }
};
// @desc    Suggested users (jinhein main abhi follow nahi karta, naye pehle)
// @route   GET /api/users/suggestions
export const getSuggestions = async (req, res) => {
  try {
    const followed = await Follow.find({ follower: req.user._id }).select('following');
    const exclude = [req.user._id, ...followed.map((f) => f.following)];

    const users = await User.find({ _id: { $nin: exclude } })
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(await decorate(users, req.user._id));
  } catch (error) {
    serverError(res, error);
  }
};