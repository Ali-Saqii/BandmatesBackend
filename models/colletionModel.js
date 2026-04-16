
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Collection = sequelize.define('Collection', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:     { type: DataTypes.UUID, allowNull: false },
  name:        { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  is_public:   { type: DataTypes.BOOLEAN, defaultValue: true },
  cover:       { type: DataTypes.TEXT },
});

module.exports = Collection;