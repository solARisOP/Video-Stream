import { Router } from "express";
import { createTweet, deleteTweet, getAllTweets, getTweet, likeTweet, unlikeTweet, updateTweet } from "../controllers/tweet.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.route("/get-tweet").get(getTweet)

router.route("/get-all-tweets").get(getAllTweets)

router.route("/create-tweet").post(verifyJWT, createTweet)

router.route("/update-tweet").patch(verifyJWT, updateTweet)

router.route("/delete-tweet").delete(verifyJWT, deleteTweet)

router.route("/like-tweet").delete(verifyJWT, likeTweet)

router.route("/unlike-tweet").delete(verifyJWT, unlikeTweet)