const { Op } = require("sequelize");
const Notification = require("../models/Notification");

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

const paginate = (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(50, parseInt(query.limit) || 20);
  return { limit, offset: (page - 1) * limit };
};

// ─────────────────────────────────────────────
//  CREATE HELPERS  (call these from other controllers/services)
// ─────────────────────────────────────────────

/**
 * System Announcement
 * Triggered by: admin action / deployment script
 *
 * @param {string[]} userIds  - array of receiver UUIDs (broadcast to all users)
 * @param {string}   title    - e.g. "🚀 New Feature Released!"
 * @param {string}   body     - e.g. "We've added dark mode. Check it out!"
 */
const createSystemAnnouncement = async (userIds, title, body) => {
  const records = userIds.map((user_id) => ({
    user_id,
    type:      "system_announcement",
    title,
    body,
    sender_id: null, // system – no sender
  }));
  return Notification.bulkCreate(records);
};

/**
 * Bandmate Activity — New Request
 * Triggered by: BandmateRequest.create() in your request controller
 *
 * @param {string} receiverId  - user who RECEIVES the request
 * @param {string} senderId    - user who SENT the request
 * @param {string} senderName  - display name of sender
 */
const createBandmateRequestNotification = async (receiverId, senderId, senderName) => {
  return Notification.create({
    user_id:   receiverId,
    type:      "bandmate_activity",
    title:     "New Bandmate Request",
    body:      `${senderName} has sent you a bandmate request.`,
    sender_id: senderId,
  });
};

/**
 * Bandmate Activity — Request Accepted
 * Triggered by: when receiver approves the request
 *
 * @param {string} receiverId    - original requester (now gets notified)
 * @param {string} acceptorId    - user who accepted
 * @param {string} acceptorName  - display name of acceptor
 */
const createBandmateAcceptedNotification = async (receiverId, acceptorId, acceptorName) => {
  return Notification.create({
    user_id:   receiverId,
    type:      "bandmate_activity",
    title:     "Request Accepted",
    body:      `${acceptorName} accepted your bandmate request.`,
    sender_id: acceptorId,
  });
};

/**
 * Bandmate Activity — Request Declined
 * Triggered by: when receiver declines the request
 *
 * @param {string} receiverId    - original requester (now gets notified)
 * @param {string} declinerId    - user who declined
 * @param {string} declinerName  - display name of decliner
 */
const createBandmateDeclinedNotification = async (receiverId, declinerId, declinerName) => {
  return Notification.create({
    user_id:   receiverId,
    type:      "bandmate_activity",
    title:     "Request Declined",
    body:      `${declinerName} declined your bandmate request.`,
    sender_id: declinerId,
  });
};

/**
 * Comment Notification
 * Triggered by: when a user comments on an album that others have saved
 *
 * @param {string[]} savedByUserIds - UUIDs of users who saved the album
 * @param {string}   commenterId    - UUID of the commenter
 * @param {string}   commenterName  - display name of commenter
 * @param {string}   albumName      - name of the album
 */
const createCommentNotification = async (savedByUserIds, commenterId, commenterName, albumName) => {
  // Don't notify the commenter themselves
  const receivers = savedByUserIds.filter((id) => id !== commenterId);
  if (!receivers.length) return [];

  const records = receivers.map((user_id) => ({
    user_id,
    type:      "comment",
    title:     "New Comment",
    body:      `${commenterName} commented on "${albumName}", an album in your collection.`,
    sender_id: commenterId,
  }));
  return Notification.bulkCreate(records);
};

/**
 * Collection Update Notification
 * Triggered by: when an album in user's saved collection gets an update
 *
 * @param {string[]} savedByUserIds - UUIDs of users who saved the album
 * @param {string}   albumName      - name of the album
 * @param {string}   updateDetail   - e.g. "New track added", "Album artwork updated"
 */
const createCollectionUpdateNotification = async (savedByUserIds, albumName, updateDetail) => {
  if (!savedByUserIds.length) return [];

  const records = savedByUserIds.map((user_id) => ({
    user_id,
    type:      "collection_update",
    title:     "Collection Update",
    body:      `"${albumName}" has been updated: ${updateDetail}.`,
    sender_id: null,
  }));
  return Notification.bulkCreate(records);
};

// ─────────────────────────────────────────────
//  READ / MANAGE  (HTTP route handlers)
// ─────────────────────────────────────────────

/**
 * GET /notifications
 * Returns paginated notifications for the logged-in user.
 * Optional query: ?type=comment&read=false&page=1&limit=20
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, read } = req.query;
    const { limit, offset } = paginate(req.query);

    const where = { user_id: userId };
    if (type)             where.type    = type;
    if (read !== undefined) where.is_read = read === "true";

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order:  [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      total:   count,
      page:    Math.floor(offset / limit) + 1,
      data:    rows,
    });
  } catch (err) {
    console.error("getNotifications:", err);
    res.status(500).json({ success: false, message: "Failed to fetch notifications." });
  }
};

/**
 * GET /notifications/unread-count
 * Returns the count of unread notifications for the badge indicator.
 */
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { user_id: req.user.id, is_read: false },
    });
    res.json({ success: true, unread_count: count });
  } catch (err) {
    console.error("getUnreadCount:", err);
    res.status(500).json({ success: false, message: "Failed to fetch unread count." });
  }
};

/**
 * PATCH /notifications/:id/read
 * Marks a single notification as read.
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    await notification.update({ is_read: true });
    res.json({ success: true, data: notification });
  } catch (err) {
    console.error("markAsRead:", err);
    res.status(500).json({ success: false, message: "Failed to mark as read." });
  }
};

/**
 * PATCH /notifications/read-all
 * Marks ALL unread notifications of the logged-in user as read.
 */
const markAllAsRead = async (req, res) => {
  try {
    const [updated] = await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    res.json({ success: true, message: `${updated} notification(s) marked as read.` });
  } catch (err) {
    console.error("markAllAsRead:", err);
    res.status(500).json({ success: false, message: "Failed to mark all as read." });
  }
};

/**
 * DELETE /notifications/:id
 * Deletes a single notification (only owner can delete).
 */
const deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.destroy({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    res.json({ success: true, message: "Notification deleted." });
  } catch (err) {
    console.error("deleteNotification:", err);
    res.status(500).json({ success: false, message: "Failed to delete notification." });
  }
};

/**
 * DELETE /notifications/clear-all
 * Deletes ALL notifications for the logged-in user.
 */
const clearAllNotifications = async (req, res) => {
  try {
    const deleted = await Notification.destroy({
      where: { user_id: req.user.id },
    });
    res.json({ success: true, message: `${deleted} notification(s) cleared.` });
  } catch (err) {
    console.error("clearAllNotifications:", err);
    res.status(500).json({ success: false, message: "Failed to clear notifications." });
  }
};

// ─────────────────────────────────────────────
//  ADMIN
// ─────────────────────────────────────────────

/**
 * POST /admin/notifications/announce
 * Admin broadcasts a system announcement to all (or selected) users.
 *
 * Body: { title, body, user_ids? }
 * If user_ids is omitted, fetch all user IDs from your User model and broadcast.
 */
const broadcastAnnouncement = async (req, res) => {
  try {
    const { title, body, user_ids } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: "title and body are required." });
    }

    // If no specific user_ids, you'd pull all users here:
    // const User = require('../models/User');
    // const users = await User.findAll({ attributes: ['id'] });
    // const ids = users.map(u => u.id);
    const ids = user_ids || [];

    if (!ids.length) {
      return res.status(400).json({ success: false, message: "No target users provided." });
    }

    const notifications = await createSystemAnnouncement(ids, title, body);
    res.status(201).json({
      success: true,
      message: `Announcement sent to ${notifications.length} user(s).`,
    });
  } catch (err) {
    console.error("broadcastAnnouncement:", err);
    res.status(500).json({ success: false, message: "Failed to send announcement." });
  }
};

// ─────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────

module.exports = {
  // Service helpers — call these from other controllers
  createSystemAnnouncement,
  createBandmateRequestNotification,
  createBandmateAcceptedNotification,
  createBandmateDeclinedNotification,
  createCommentNotification,
  createCollectionUpdateNotification,

  // Route handlers
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  broadcastAnnouncement,
};