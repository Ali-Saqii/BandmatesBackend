const { Op } = require("sequelize");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel")

const paginate = (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(50, parseInt(query.limit) || 20);
  return { limit, offset: (page - 1) * limit };
};


/**

 *
 * @param {string[]} userIds  
 * @param {string}   title    
 * @param {string}   body     
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
  try { // ← try/catch nahi tha pehle
    console.log('📨 Creating notification:', { receiverId, senderId, senderName });
    
    const result = await Notification.create({
      user_id:   receiverId,
      type:      "bandmate_activity",
      title:     "New Bandmate Request",
      body:      `${senderName} has sent you a bandmate request.`,
      sender_id: senderId,
    });
    
    console.log('✅ Notification saved:', result.id);
    return result;
  } catch (err) {
    console.error('🔥 Notification create failed:', err.message); // ← exact error dikhega
    throw err;
  }
};

/**
 
 * @param {string} receiverId    
 * @param {string} acceptorId    
 * @param {string} acceptorName  
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

 *
 * @param {string} receiverId   
 * @param {string} declinerId   
 * @param {string} declinerName  
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

 *
 * @param {string[]} savedByUserIds 
 * @param {string}   commenterId    
 * @param {string}   commenterName  
 * @param {string}   albumName      
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
 * @param {string[]} savedByUserIds 
 * @param {string}   collectionName    
 * @param {string}   updateDetail   
 */
const createCollectionUpdateNotification = async (savedByUserIds, collectionName, updateDetail) => {
  if (!savedByUserIds.length) return [];

  const records = savedByUserIds.map((user_id) => ({
    user_id,
    type:      "collection_update",
    title:     "Collection Update",
    body:      `"${collectionName}" ${updateDetail}.`,
    sender_id: null,
  }));
  return Notification.bulkCreate(records);
};


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


const markAsRead = async (req, res) => {
  try {
    console.log("ControllerHit")
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


const broadcastAnnouncement = async (req, res) => {
  try {
    const { title, body, user_ids } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: "title and body are required." });
    }

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


// GET — notification settings fetch karo
const getNotificationSettings = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        'notif_system_announcement',
        'notif_bandmate_activity',
        'notif_comment',
        'notif_collection_update'
      ]
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.status(200).json({
      success: true,
      data: {
        systemAnnouncements: user.notif_system_announcement,
        bandmateActivity:    user.notif_bandmate_activity,
        commentsNotification: user.notif_comment,
        collectionUpdates:   user.notif_collection_update
      }
    });

  } catch (error) {
    console.error('🔥 getNotificationSettings:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PUT — notification settings update karo
const updateNotificationSettings = async (req, res) => {
  try {
    const {
      systemAnnouncements,
      bandmateActivity,
      commentsNotification,
      collectionUpdates
    } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Sirf jo bheja gaya hai woh update karo
    if (typeof systemAnnouncements  === 'boolean') user.notif_system_announcement = systemAnnouncements;
    if (typeof bandmateActivity      === 'boolean') user.notif_bandmate_activity   = bandmateActivity;
    if (typeof commentsNotification  === 'boolean') user.notif_comment             = commentsNotification;
    if (typeof collectionUpdates     === 'boolean') user.notif_collection_update   = collectionUpdates;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Notification settings updated',
      data: {
        systemAnnouncements: user.notif_system_announcement,
        bandmateActivity:    user.notif_bandmate_activity,
        commentsNotification: user.notif_comment,
        collectionUpdates:   user.notif_collection_update
      }
    });

  } catch (error) {
    console.error('🔥 updateNotificationSettings:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
module.exports = {

  createSystemAnnouncement,
  createBandmateRequestNotification,
  createBandmateAcceptedNotification,
  createBandmateDeclinedNotification,
  createCommentNotification,
  createCollectionUpdateNotification,
  updateNotificationSettings,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  broadcastAnnouncement,
  getNotificationSettings
};