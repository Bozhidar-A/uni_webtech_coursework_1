import mongoose from "mongoose";

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            authSource: "admin",
        });

        console.log("MongoDB connected");
    } catch (error) {
        console.log("MongoDB connection failed: ", error);
    }
}

export default connectDB;