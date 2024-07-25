import { Router } from "express";
import { 
    createTweet, 
    deleteTweet, 
    getAllTweets, 
    getTweet, 
    likeTweet, 
    unlikeTweet, 
    updateTweet 
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/get-tweet").get(getTweet)

router.route("/get-all-tweets/:username").get(getAllTweets)

router.route("/create-tweet").post(verifyJWT, createTweet)

router.route("/update-tweet/:tweetId").patch(verifyJWT, updateTweet)

router.route("/delete-tweet/:tweetId").delete(verifyJWT, deleteTweet)

router.route("/like-tweet/:tweetId").delete(verifyJWT, likeTweet)

router.route("/unlike-tweet/:tweetId").delete(verifyJWT, unlikeTweet)