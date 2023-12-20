const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL_USER, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to UserDB");

    await mongoose.createConnection(process.env.MONGODB_URL_BLOG, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to BlogDB");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
