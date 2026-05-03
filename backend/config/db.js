const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let inMemoryMongoServer;

const connectDB = async () => {
  const configuredUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (configuredUri) {
    try {
      await mongoose.connect(configuredUri);
      console.log("MongoDB connected");
      return;
    } catch (error) {
      console.warn(`MongoDB connection failed for configured URI: ${error.message}`);
    }
  } else {
    console.warn("No MongoDB URI configured; starting in-memory MongoDB.");
  }

  try {
    inMemoryMongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: "smart-infra",
        launchTimeout: 120000,
      },
    });

    await mongoose.connect(inMemoryMongoServer.getUri());
    console.log("MongoDB connected using in-memory server");
  } catch (error) {
    console.error(`Failed to start in-memory MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
