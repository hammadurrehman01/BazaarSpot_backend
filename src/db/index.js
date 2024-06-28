import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const databaseInstance = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Database connected! DB Host: ${databaseInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection failed:", error);
    }
}