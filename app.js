
require('dotenv').config(); 
const express = require("express");
const app = express();
console.log('Last.fm API Key:', process.env.LASTFM_API_KEY);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

const subscriptionRoutes = require("./routes/subscriptionRoutes");
app.use("/api/subscription", subscriptionRoutes);

const sequelize = require("./config/db");
const models = require("./models");
app.set("models", models);

const authRoutes = require("./routes/userRoutes")
const albumRoutes = require("./routes/albumRoutes")
const collerctionRoutes = require("./routes/collectionRoutes")
const savedAlbumsRoutes = require("./routes/savedAlbumRoutes")
const friendRoutes = require("./routes/friendsRoutes")
const commentRoutes = require("./routes/commentRoute")
const reviewRoute = require("./routes/reviewRoute")
const subsCriptionRoutes = require("./routes/subscriptionRoutes")

app.use("/user",authRoutes)
app.use("/user",subsCriptionRoutes)
app.use("/user",albumRoutes)
app.use("/user",collerctionRoutes)
app.use("/user",savedAlbumsRoutes)
app.use("/user",friendRoutes)
app.use("/user",commentRoutes)
app.use("/user",reviewRoute)


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