const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SearchHistory = sequelize.define('SearchHistory', {
  id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  query:   { type: DataTypes.STRING, allowNull: false },
});

module.exports = SearchHistory;