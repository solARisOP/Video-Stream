import { Router } from "express"
import {
    likeComment,
    unLikeComment,
    updateComment,
    deleteComment,
    replyComment,
    commentOnVideo,
    commentOnTweet
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route('/like-comment/:commentId').post(verifyJWT, likeComment)

router.route('/unlike-comment/:commentId').delete(verifyJWT, unLikeComment)

router.route('/update-comment/:commentId').patch(verifyJWT, updateComment)

router.route('/like-comment/:commentId').delete(verifyJWT, deleteComment)

router.route('/reply-comment/:commentId').post(verifyJWT, replyComment)

router.route('/comment-video/:videoId').post(verifyJWT, commentOnVideo)

router.route('/comment-tweet/:tweetId').post(verifyJWT, commentOnTweet)