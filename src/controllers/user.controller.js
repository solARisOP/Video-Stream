import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadonCloudinary } from "../utils/cloudinary.js";

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
    const coverImageLocalPath = req.files?.coverImage[0]?.pat
    
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

    const createdUser = await newUser.findById(newUser._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }

    res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
}

export {registerUser}