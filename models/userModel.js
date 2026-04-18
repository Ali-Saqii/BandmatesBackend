const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const user =  sequelize.define('User', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    username:       { type: DataTypes.STRING, unique: true, allowNull: false },
    email:          { type: DataTypes.STRING, unique: true, allowNull: false },
    password:       { type: DataTypes.STRING, allowNull: false }, 
    displayName:    {type: DataTypes.STRING, allowNull: true},
    description:    {type: DataTypes.STRING ,allowNull: true},      
    avatar:         { type: DataTypes.TEXT, defaultValue: null },
    membership:     { type: DataTypes.ENUM('club','arena','stadium'), defaultValue: 'club' },
    savedAlbumsVisibility: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
},
  subscription_plan:   { type: DataTypes.ENUM('monthly', 'annual'), allowNull: true, defaultValue: null },
  trial_ends_at:       { type: DataTypes.DATE, defaultValue: null },
  subscription_ends_at:{ type: DataTypes.DATE, defaultValue: null },
  is_on_trial:         { type: DataTypes.BOOLEAN, defaultValue: false },
  is_active:      { type: DataTypes.BOOLEAN, defaultValue: true },
  });

  module.exports = user;