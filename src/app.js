import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import 'express-async-errors';

const app = express()

//middlwares
app.use(cors({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  }));

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static('public'))
app.use(cookieParser())

// routes import
import userRouter from "./routes/user.routes.js";
import verifyRouter from "./routes/verification.routes.js";
import errorHandeler from "./middlewares/errorHandeller.middleware.js"
import feedRouter from "./routes/feed.routes.js"

// routes declaration
app.use("/api/v1/users", userRouter)

app.use("/api/v1/verify", verifyRouter)

app.use("/api/v1/feed", feedRouter)

// handelerrors
app.use(errorHandeler)
export { app }