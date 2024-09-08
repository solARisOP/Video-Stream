import { Router } from "express"
import {
    likeComment,
    unLikeComment,
    updateComment,
    deleteComment,
    replyComment,
    commentOnVideo,
    commentOnTweet,
    getComments,
    getReplies
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { checkUser } from "../middlewares/userCheck.middleware.js"

const router = Router()

router.route('/like-comment/:commentId').post(verifyJWT, likeComment)

router.route('/unlike-comment/:commentId').delete(verifyJWT, unLikeComment)

router.route('/update-comment/:commentId').patch(verifyJWT, updateComment)

router.route('/delete-comment/:commentId').delete(verifyJWT, deleteComment)

router.route('/reply-comment/:commentId').post(verifyJWT, replyComment)

router.route('/comment-video/:videoId').post(verifyJWT, commentOnVideo)

router.route('/comment-tweet/:tweetId').post(verifyJWT, commentOnTweet)

router.route('/comments').get(checkUser, getComments)

router.route('/replies').get(checkUser, getReplies)

export default router