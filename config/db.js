const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MO_URI, {});
        console.log("MongoDB connected");NGO
    } catch (err) {
        console.error("Error connecting to MongoDB", err);
        process.exit(1);
    }
};

module.exports = connectDB;