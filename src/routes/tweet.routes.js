import { Router } from "express";
import { 
    createTweet, 
    deleteTweet, 
    getTweets, 
    getTweet, 
    likeTweet, 
    unlikeTweet, 
    updateTweet,
    makeTweetPrivate,
    makeTweetPublic
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkUser } from "../middlewares/userCheck.middleware.js";

const router = Router();

router.route("/get-tweet").get(checkUser, getTweet)

router.route("/get-all-tweets/:username").get(checkUser, getTweets)

router.route("/create-tweet").post(verifyJWT, createTweet)

router.route("/update-tweet/:tweetId").patch(verifyJWT, updateTweet)

router.route("/delete-tweet/:tweetId").delete(verifyJWT, deleteTweet)

router.route("/like-tweet/:tweetId").post(verifyJWT, likeTweet)

router.route("/unlike-tweet/:tweetId").delete(verifyJWT, unlikeTweet)

router.route("/private-tweet/:tweetId").patch(verifyJWT, makeTweetPrivate)

router.route("/public-tweet/:tweetId").patch(verifyJWT, makeTweetPublic)

export default router