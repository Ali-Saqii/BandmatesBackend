const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Notification = sequelize.define('Notification', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:    { type: DataTypes.UUID, allowNull: false },       
  type:       {
    type: DataTypes.ENUM(
      'system_announcement',   
      'bandmate_activity',     
      'comment',               
      'collection_update'      
    ),
    allowNull: false
  },
  title:      { type: DataTypes.STRING, allowNull: false },        
  body:       { type: DataTypes.TEXT,   allowNull: false },        
  is_read:    { type: DataTypes.BOOLEAN, defaultValue: false },    
  sender_id:  { type: DataTypes.UUID,   defaultValue: null },      
});

module.exports = Notification;