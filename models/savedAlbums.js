const sequelize = require("../config/db")
const {DataTypes} = require("sequelize")
const savedAlbum = sequelize.define('SavedAlbum', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:       { type: DataTypes.UUID, allowNull: false },
  album_id:      { type: DataTypes.UUID, allowNull: false },
  collection_id: { type: DataTypes.UUID, defaultValue: false }, // null = not in any collection
});

module.exports = savedAlbum