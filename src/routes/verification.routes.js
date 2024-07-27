import { Router } from "express"
import { EmailVerification } from "../controllers/verification.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route('/email-verification').post(EmailVerification).patch(verifyJWT, EmailVerification)

export default router