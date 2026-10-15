import Notification from '../models/Notification.js';

// @desc    Latest notifications + unread count
// @route   GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);
    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Ek notification ko read mark karo
// @route   PUT /api/notifications/:id/read
export const markRead = async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Notification not found' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sab ko read mark karo
// @route   PUT /api/notifications/read-all
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.status(200).json({ message: 'Sab notifications read ho gayin' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Ek notification delete karo
// @route   DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) return res.status(404).json({ message: 'Notification not found' });
    res.status(200).json({ message: 'Notification delete ho gayi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Saari notifications delete karo
// @route   DELETE /api/notifications
export const clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.status(200).json({ message: 'Saari notifications delete ho gayin' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};