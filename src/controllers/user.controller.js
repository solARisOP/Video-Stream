import mongoose from "mongoose";
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadonCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})
    
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = async(req, res) => {
    const {fullname, email, username, password} = req.body;

    if([fullname, email, username, password].some((value)=>value?.trim()==="")){
        throw new ApiError(400, "All fields are required");
    } 

    const duplicateUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(duplicateUser) {
        throw new ApiError(400, "User Already exists with this email or username")
    }

    const avatarImageLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath;
    
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }

    if(!avatarImageLocalPath) {
        throw new ApiError(400, "Avatar Image is required")
    }

    const avatar = await uploadonCloudinary(avatarImageLocalPath);
    const coverImage = await uploadonCloudinary(coverImageLocalPath);

    if(!avatar) {
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

    if(!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }

    res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
}

const loginUser = async(req, res) => {
    const {email, username, password} = req.body
    if(!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(404, "user doesnot exit")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
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

const logoutUser = async(req, res) => {
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

const refreshAccessToken = async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if(!user) {
        throw new ApiError(401, "Invalid refresh token")
    }

    if(user.refreshToken != incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is expired or used")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user_id);

    return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", newRefreshToken)
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

const changeCurrentPassword = async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "password changed successfully")
    )
}

const getCurrentUser = async(req, res) => {
    return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")
}

const updateAccountDetails = async(req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            }
        },
        {new : true}
    )
    .select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
}

const updateUserAvatar = async(req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar image file is missing")
    }

    const avatar = await uploadonCloudinary(avatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    )
    .select("-password -refreshToken")

    return res
    .status(200)
    .json(200, user, "avatar image uploaded successfully")
}

const updateUserCoverImage = async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadonCloudinary(coverImageLocalPath)

    if(!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    )
    .select("-password -refreshToken")

    return res
    .status(200)
    .json(200, user, "cover image uploaded successfully")
}

const getUserChannelProfile = async(req, res) => {
    const {username} = req.params
    if(!username?.trim()) {
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
                    $size: "$subcribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
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

    if(!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "user channel fetched successfully")
    )

}

const getWatchHistory = async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(req.user_id)
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
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}