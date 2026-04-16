const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const album = sequelize.define('Album', {
    id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    mbid:     { type: DataTypes.STRING, unique: true },    
    name:     { type: DataTypes.STRING, allowNull: false },
    artist:   { type: DataTypes.STRING, allowNull: false },
    cover:    { type: DataTypes.TEXT },
    isSaved:  { type: DataTypes.VIRTUAL, defaultValue: false }  
  });

  module.exports = album;