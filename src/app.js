import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.listen(() => {
    console.log(`Server is listerning at port 8000`);
})

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({
    limit: "16kb"
}))

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

app.use(express.static("public"))

app.use(cookieParser())

export default app