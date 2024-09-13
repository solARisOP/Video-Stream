import { Router } from "express"
import {
    subscribe,
    unSubscribe,
    getSubscribers
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route('/subscribe/:channelUserId').post(verifyJWT, subscribe)

router.route('/unsubscribe/:channelUserId').delete(verifyJWT, unSubscribe)

router.route('/get-all-subscribers').get(verifyJWT, getSubscribers)

export default router