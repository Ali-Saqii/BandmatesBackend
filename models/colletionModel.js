
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Collection = sequelize.define('Collection', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:     { type: DataTypes.UUID, allowNull: false },
  name:        { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  cover:       { type: DataTypes.TEXT },
});

module.exports = Collection;