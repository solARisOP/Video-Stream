import { Router } from "express";
import { 
    changeCurrentPassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    updateUser
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import verifyEmail from "../routes/verification.routes.js";
import { checkUser } from "../middlewares/userCheck.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.use("/verify", verifyEmail)

router.route("/login").post(loginUser)

router.route("/google-auth").post()

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-user/:field").patch(verifyJWT, upload.single("image"), updateUser) 

router.route("/channel/:username").get(checkUser, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)

export default router