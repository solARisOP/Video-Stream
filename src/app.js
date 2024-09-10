import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import 'express-async-errors';

const app = express()

//middlwares
app.use(cors({
	origin: process.env.ORIGIN,
	methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
	credentials: true
}));

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static('public'))
app.use(cookieParser())

// routes import
import userRouter from "./routes/user.routes.js";
import commentRouter from './routes/comment.routes.js'
import errorHandeler from "./middlewares/errorHandeller.middleware.js"
import feedRouter from "./routes/feed.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import videoRouter from "./routes/video.routes.js"

// routes declaration
app.use("/api/v1/user", userRouter)

app.use("/api/v1/feed", feedRouter)

app.use("/api/v1/comment", commentRouter)

app.use("/api/v1/tweet", tweetRouter)

app.use("/api/v1/video", videoRouter)

// handelerrors
app.use(errorHandeler)


export { app }