import Support from '../models/Support.js';
import User from '../models/User.js';
import { createNotification } from '../utils/notify.js';
import { paginatedFind } from '../utils/paginate.js';

const CATEGORIES = ['bug', 'feedback', 'question', 'other'];
const STATUSES = ['open', 'resolved'];
const ADMIN_PAGE_SIZE = 10;
const MAX_TEXT = 2000;

const escapeRegex = (s) => String(s).slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Saare admins ko ek notification bhejta hai (sender khud admin ho to usay chhod kar)
const notifyAdmins = async (message, key, exceptUserId) => {
  const admins = await User.find({ role: 'admin', _id: { $ne: exceptUserId } }).select('_id preferences');
  await Promise.all(
    admins.map((admin) => createNotification(admin, { type: 'support_ticket', message, key, link: '/admin/support' }))
  );
};

const cleanText = (value) => String(value ?? '').trim();

// ---------------------------------------------------------------------------
// USER side
// ---------------------------------------------------------------------------

// @desc    Submit a support request
// @route   POST /api/support
export const submitSupport = async (req, res) => {
  const subject = cleanText(req.body?.subject);
  const message = cleanText(req.body?.message);
  const category = req.body?.category;

  if (!subject || !message) {
    return res.status(400).json({ message: 'Subject aur message zaroori hain' });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Category sahi nahi hai' });
  }

  const ticket = await Support.create({ user: req.user._id, subject, category, message });

  await notifyAdmins(`Naya support ticket: ${subject}`, `support-new-${ticket._id}`, req.user._id);

  res.status(201).json(ticket);
};

// @desc    Get logged-in user's support tickets (replies ke saath)
// @route   GET /api/support
export const getMySupportTickets = async (req, res) => {
   const tickets = await paginatedFind(Support, { user: req.user._id }, req, res, { sortField: 'updatedAt' });
  res.status(200).json(tickets);
};

// @desc    User apne ticket par dobara likhe (resolved ticket dobara open ho jata hai)
// @route   POST /api/support/:id/reply
export const addUserReply = async (req, res) => {
  const message = cleanText(req.body?.message);
  if (!message) return res.status(400).json({ message: 'Message likhein' });
  if (message.length > MAX_TEXT) {
    return res.status(400).json({ message: `Message ${MAX_TEXT} characters se zyada nahi ho sakta` });
  }

  const ticket = await Support.findOne({ _id: req.params.id, user: req.user._id });
  if (!ticket) return res.status(404).json({ message: 'Ticket nahi mila' });

  ticket.replies.push({ from: 'user', author: req.user._id, message });
  ticket.status = 'open';
  await ticket.save();

  await notifyAdmins(
    `Ticket par naya jawab: ${ticket.subject}`,
    `support-userreply-${ticket._id}-${ticket.replies.length}`,
    req.user._id
  );

  res.status(201).json(ticket);
};

// ---------------------------------------------------------------------------
// ADMIN side (routes par protect + adminOnly lagay hue hain)
// ---------------------------------------------------------------------------

// @desc    Saari tickets (filter + search + pagination)
// @route   GET /api/support/admin/all?status=open&category=bug&search=login&page=1
export const adminListTickets = async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const filter = {};

  if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (CATEGORIES.includes(req.query.category)) filter.category = req.query.category;

  const search = cleanText(req.query.search);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    const matchingUsers = await User.find({ $or: [{ name: rx }, { username: rx }, { email: rx }] })
      .select('_id')
      .limit(100);
    filter.$or = [{ subject: rx }, { message: rx }, { user: { $in: matchingUsers.map((u) => u._id) } }];
  }

  const [tickets, total, open, resolved] = await Promise.all([
    Support.find(filter)
      .populate('user', 'name username email profileImage')
      .sort({ status: 1, updatedAt: -1 }) // 'open' alphabetically pehle aata hai
      .skip((page - 1) * ADMIN_PAGE_SIZE)
      .limit(ADMIN_PAGE_SIZE),
    Support.countDocuments(filter),
    Support.countDocuments({ status: 'open' }),
    Support.countDocuments({ status: 'resolved' }),
  ]);

  res.status(200).json({
    tickets,
    page,
    pages: Math.max(Math.ceil(total / ADMIN_PAGE_SIZE), 1),
    total,
    counts: { open, resolved },
  });
};

// @desc    Admin ka jawab (optionally saath hi resolved mark)
// @route   POST /api/support/admin/:id/reply   body: { message, resolve? }
export const adminReply = async (req, res) => {
  const message = cleanText(req.body?.message);
  if (!message) return res.status(400).json({ message: 'Jawab likhein' });
  if (message.length > MAX_TEXT) {
    return res.status(400).json({ message: `Jawab ${MAX_TEXT} characters se zyada nahi ho sakta` });
  }

  const ticket = await Support.findById(req.params.id).populate('user', 'name username email profileImage preferences');
  if (!ticket) return res.status(404).json({ message: 'Ticket nahi mila' });

  ticket.replies.push({ from: 'admin', author: req.user._id, message });
  if (req.body?.resolve === true) ticket.status = 'resolved';
  await ticket.save();

   // User ka account delete ho chuka ho to (ticket.user null) notification chhor do
  if (ticket.user) {
    await createNotification(ticket.user, {
      type: 'support_reply',
      message: `Support team ne aap ke ticket "${ticket.subject}" par jawab diya`,
      key: `support-reply-${ticket._id}-${ticket.replies.length}`,
      link: '/support',
    });
  }

  res.status(201).json(ticket);
};

// @desc    Ticket open / resolved karna
// @route   PATCH /api/support/admin/:id/status   body: { status }
export const adminSetStatus = async (req, res) => {
  const status = req.body?.status;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Status sirf open ya resolved ho sakta hai' });
  }

  const ticket = await Support.findById(req.params.id).populate('user', 'name username email profileImage preferences');
  if (!ticket) return res.status(404).json({ message: 'Ticket nahi mila' });

  if (ticket.status !== status) {
    ticket.status = status;
    await ticket.save();

       if (status === 'resolved' && ticket.user) {
      await createNotification(ticket.user, {
        type: 'support_reply',
        message: `Aap ka ticket "${ticket.subject}" resolved mark ho gaya hai`,
        key: `support-resolved-${ticket._id}-${ticket.updatedAt.getTime()}`,
        link: '/support',
      });
    }
  }

  res.status(200).json(ticket);
};