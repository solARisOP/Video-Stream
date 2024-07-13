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

const registerUser = async(req, res)=>{
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

const loginUser = async(req, res)=>{
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

    const user = User.findById(decodedToken?._id)

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

export {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken
}