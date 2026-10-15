import mongoose from 'mongoose';
import ForumPost, { MAX_REPLIES } from '../models/ForumPost.js';
import { createNotification } from '../utils/notify.js';

const escapeRegex = (s) => String(s).slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Error ko central errorHandler ke hawale karta hai (Express 5 async errors pakadta hai).
const serverError = (_res, error) => {
  throw error;
};
const AUTHOR = 'name username';

// @desc    Posts ki list (search + pagination)
// @route   GET /api/forum?page=1&search=diet
export const getPosts = async (req, res) => {
  try {
    const page = Math.min(Math.max(parseInt(req.query.page) || 1, 1), 1000);
    const limit = 10;
    const filter = {};
    const search = String(req.query.search || '').trim();
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ title: rx }, { body: rx }];
    }

    const [posts, total] = await Promise.all([
      ForumPost.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', AUTHOR),
      ForumPost.countDocuments(filter),
    ]);

    res.json({
      posts: posts.map((p) => ({
        _id: p._id,
        title: p.title,
        body: p.body.slice(0, 200),
        author: p.author,
        repliesCount: p.replies.length,
        createdAt: p.createdAt,
      })),
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    serverError(res, error);
  }
};

// @desc    Naya post
// @route   POST /api/forum
export const createPost = async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const body = String(req.body?.body || '').trim();
    if (!title || !body) return res.status(400).json({ message: 'Title aur body zaroori hain' });
    if (title.length > 120) return res.status(400).json({ message: 'Title 120 characters se zyada nahi ho sakta' });
    if (body.length > 2000) return res.status(400).json({ message: 'Post 2000 characters se zyada nahi ho sakti' });

    const post = await ForumPost.create({ author: req.user._id, title, body });
    res.status(201).json(post);
  } catch (error) {
    serverError(res, error);
  }
};

// @desc    Ek post replies ke saath
// @route   GET /api/forum/:id
export const getPost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const post = await ForumPost.findById(req.params.id)
      .populate('author', AUTHOR)
      .populate('replies.author', AUTHOR);
    if (!post) return res.status(404).json({ message: 'Post nahi mili' });
    res.json(post);
  } catch (error) {
    serverError(res, error);
  }
};

// @desc    Reply add karo (post ke author ko notification jati hai)
// @route   POST /api/forum/:id/replies
export const addReply = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const body = String(req.body?.body || '').trim();
    if (!body) return res.status(400).json({ message: 'Reply khali nahi ho sakti' });
    if (body.length > 1000) return res.status(400).json({ message: 'Reply 1000 characters se zyada nahi ho sakti' });

    const post = await ForumPost.findById(req.params.id).populate('author');
    if (!post) return res.status(404).json({ message: 'Post nahi mili' });

    // MAX_REPLIES check post milne ke BAAD hona chahiye
    if (post.replies.length >= MAX_REPLIES) {
      return res.status(400).json({ message: `Is post par ${MAX_REPLIES} replies ho chuki hain` });
    }

    post.replies.push({ author: req.user._id, body });
    await post.save();
    const reply = post.replies[post.replies.length - 1];

    // post.author null ho sakta hai (agar author ka account delete ho chuka ho)
    if (post.author && String(post.author._id) !== String(req.user._id)) {
      await createNotification(post.author, {
        type: 'forum_reply',
        message: `${req.user.name} ne aap ki post "${post.title.slice(0, 40)}" par reply kiya`,
        key: `reply-${reply._id}`,
        link: `/forum/${post._id}`,
      });
    }

    res.status(201).json(reply);
  } catch (error) {
    serverError(res, error);
  }
};
// @desc    Apni post delete karo
// @route   DELETE /api/forum/:id
export const deletePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const deleted = await ForumPost.findOneAndDelete({ _id: req.params.id, author: req.user._id });
    if (!deleted) return res.status(404).json({ message: 'Post nahi mili ya aap ki nahi hai' });
    res.json({ message: 'Post delete ho gayi' });
  } catch (error) {
    serverError(res, error);
  }
};

// @desc    Apna reply delete karo
// @route   DELETE /api/forum/:id/replies/:replyId
export const deleteReply = async (req, res) => {
  try {
    const { id, replyId } = req.params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(replyId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const result = await ForumPost.updateOne(
      { _id: id },
      { $pull: { replies: { _id: replyId, author: req.user._id } } }
    );
    if (!result.modifiedCount) return res.status(404).json({ message: 'Reply nahi mila ya aap ka nahi hai' });
    res.json({ message: 'Reply delete ho gaya' });
  } catch (error) {
    serverError(res, error);
  }
};