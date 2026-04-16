const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("bandmates", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: false
});

module.exports = sequelize;