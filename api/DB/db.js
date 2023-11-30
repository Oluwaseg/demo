const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB Connected:");
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

module.exports = connectDB;
