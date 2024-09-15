import mongoose from "mongoose";
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { removeFromCloudinary, uploadonCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import {
    getgoogleOAuthTokens, 
    getGoogleUser
} from "../utils/getGoogleAccess&RefreshTokens.js"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        console.log(error);
        
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = async (req, res) => {
    const { fullname, email, username, password } = req.body;

    if (!fullname || !email || !username || !password || [fullname, email, username, password].some((value) => value.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const duplicateUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (duplicateUser) {
        throw new ApiError(400, "User Already exists with this email or username")
    }

    const avatarImageLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }

    if (!avatarImageLocalPath) {
        throw new ApiError(400, "Avatar Image is required")
    }

    const avatar = await uploadonCloudinary(avatarImageLocalPath, "users/avatar");
    const coverImage = await uploadonCloudinary(coverImageLocalPath, "users/coverImage");

    if (!avatar) {
        throw new ApiError(400, "Avatar Image is required")
    }

    const newUser = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }

    res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
}

const googleUser = async (req, res) => {
    const {code} = req.query

    const {id_token, access_token} = await getgoogleOAuthTokens(code)
    const { name, email, picture } = await getGoogleUser(id_token, access_token)

    var user = await User.findOne({email : email})
    if(!user) {
        const username = name.trim().replace(' ', '_') + '_' + Math.random().toString(36).substring(2, 10);
        const password = (+new Date * Math.random()).toString(36).substring(0,12)  
        user = await User.create({username, email : email, fullname : name, avatar : picture, password})
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
    }

    res
    .cookie("accessToken", accessToken, {...options, maxAge: 24 * 60 * 60 * 1000})
    .cookie("refreshToken", refreshToken, {...options, maxAge: 10 * 24 * 60 * 60 * 1000})

    return res
    .redirect('http://localhost:5173/user')
}

const loginUser = async (req, res) => {
    const { email, username, password } = req.body
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user doesnot exit")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, {...options, maxAge: 24 * 60 * 60 * 1000})
        .cookie("refreshToken", refreshToken, {...options, maxAge: 10 * 24 * 60 * 60 * 1000})
        .json(new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "user logged in successfully"
        ))
}

const logoutUser = async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user logged out successfully"))
}

const refreshAccessToken = async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if (!user) {
        throw new ApiError(401, "Invalid refresh token")
    }

    if (user.refreshToken != incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is expired or used")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Access token refreshed successfully"
            )
        )

}

const changeCurrentPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "password changed successfully")
        )
}

const getCurrentUser = async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "current user fetched successfully"
        ))
}

const updateUser = async (req, res) => {
    const { field } = req.params
    const { content } = req.body

    if (!['email', 'fullname', 'coverImage', 'avatar'].some(x => x == field)) {
        throw new ApiError(400, "Invalid field type")
    }

    if (field == 'email' || field == 'fullname') {
        if (field == 'email') {
            const dupEmail = await User.findOne({ email: content.trim() })
            if (dupEmail) {
                throw new ApiError(400, "Email Already Exists")
            }
        }
        var user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    [field]: content
                }
            },
            { new: true }
        )
        .select("-password -refreshToken")        
    }
    else {
        var user = await User.findById(req.user._id)
        if (user[field]) {
            const x = await removeFromCloudinary(user[field], `users/${field}`)
            console.log(x);
        }
        var image = await uploadonCloudinary(req.file.path, `users/${field}`)
        user[field] = image.url
        await user.save({ new: true })
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            `${field} updated successfully`
        ))
}

const getUserChannelProfile = async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: { "$ifNull": ["$subscribers", []] }
                },
                subscribedToCount: {
                    $size: { "$ifNull": ["$subscribedTo", []] }
                },
                isSubscribed: {
                    $in: [req.user?._id, "$subscribers.subscriber"]
                }

            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                isSubscribed: 1,
                subscriberCount: 1,
                subscribedToCount: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "user channel fetched successfully")
        )

}

const getWatchHistory = async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        avatar: 1
                                    }
                                },
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "watch history fetched successfully"
            )
        )
}

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUser,
    getUserChannelProfile,
    getWatchHistory,
    googleUser
}