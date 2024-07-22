import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoute from "./route/user.route.js";

const app = express();

app.use(express.json())

app.use(cors())

app.use(express.json({
    limit: "16kb"
}))

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

app.use(express.static("public"))

app.use(cookieParser())

app.use("/api/user", userRoute);

export default app