import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path: '../.env'
})
connectDB()
    .then(() => {
        const PORT = process.env.PORT || 8800
        app.listen(PORT, () => {
            console.log(`Server is running on the port: ${PORT}`);
        })
    }).catch((err) => {
        console.log("Mongo connection failed", err);
    });