const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Notification = sequelize.define('Notification', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:    { type: DataTypes.UUID, allowNull: false },          // receiver
  type:       {
    type: DataTypes.ENUM(
      'system_announcement',   // Latest Update!
      'bandmate_activity',     // New Request, Request Approved, Request Declined
      'comment',               // New Comment
      'collection_update'      // Collection Updates
    ),
    allowNull: false
  },
  title:      { type: DataTypes.STRING, allowNull: false },        // "New Request"
  body:       { type: DataTypes.TEXT,   allowNull: false },        // "Alex Harper has requested..."
  is_read:    { type: DataTypes.BOOLEAN, defaultValue: false },    // for Unread/Read tabs
  sender_id:  { type: DataTypes.UUID,   defaultValue: null },      // who triggered it (nullable for system)
});

module.exports = Notification;