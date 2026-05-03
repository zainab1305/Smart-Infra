const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    const mongoUri = process.env.MONGO_URI || "";
    const mongoHost = mongoUri ? new URL(mongoUri).hostname : "local";
    console.log("Connection URI (host only):", mongoHost);
    
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB Connection Error:");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("\nTroubleshooting steps:");
    console.error("1. Check if Windows Firewall/Antivirus is blocking MongoDB");
    console.error("2. Verify MongoDB Atlas cluster is active");
    console.error("3. Test DNS resolution for:", process.env.MONGO_URI ? new URL(process.env.MONGO_URI).hostname : "your MongoDB host");
    console.error("Backend will keep running, but database-backed routes will remain unavailable until the connection is fixed.");
  }
};

module.exports = connectDB;
