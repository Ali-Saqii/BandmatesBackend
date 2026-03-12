const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("bandmates", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: console.log
});

module.exports = sequelize;