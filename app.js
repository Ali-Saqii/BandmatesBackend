
require('dotenv').config(); 
const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

const sequelize = require("./config/db");
require("./models")

const authRoutes = require("./routes/userRoutes")

app.use("/user",authRoutes)




async function init() {
  try {
    await sequelize.authenticate();
    console.log( "Database connected");

    await sequelize.sync(); // ❗ no force:true
    console.log(" Tables synced");
  } catch (error) {
    console.error(" Startup failed:", error.message);
    process.exit(1);
  }
}

init();

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});