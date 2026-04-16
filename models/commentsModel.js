
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Comment = sequelize.define('Comment', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:   { type: DataTypes.UUID, allowNull: false },
  album_id:  { type: DataTypes.UUID, allowNull: false },
  text:      { type: DataTypes.TEXT, allowNull: false },
  parent_id: { type: DataTypes.UUID, defaultValue: null },
});

module.exports = Comment;