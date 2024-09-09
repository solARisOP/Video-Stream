import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const checkUser = async (req, _, next) => {

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
        req.user = null;
        return next()
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if (!user) {
        req.user = null;
    }

    req.user = user;
    return next()
}