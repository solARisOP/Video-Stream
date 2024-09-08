import { Router } from "express"
import {
    getVideo,
    getVideos,
    likeVideo,
    unlikeVideo,
    updateTitle,
    updateDescription,
    makeVideoPrivate,
    makeVideoPublic
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { checkUser } from "../middlewares/userCheck.middleware.js"

const router = Router()

router.route('/get-video').get(checkUser, getVideo)

router.route('/get-all-videos/:username').get(checkUser, getVideos)

router.route('/like-Video/:videoId').post(verifyJWT, likeVideo)

router.route('/unlike-Video/:videoId').delete(verifyJWT, unlikeVideo)

router.route('/update-video-title/:videoId').patch(verifyJWT, updateTitle)

router.route('/update-video-description/:videoId').patch(verifyJWT, updateDescription)

router.route('/private-Video/:videoId').patch(verifyJWT, makeVideoPrivate)

router.route('/public-Video/:videoId').patch(verifyJWT, makeVideoPublic)