import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import dotenv from "dotenv"
dotenv.config({
    path: "./.env"
})

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadonCloudinary = async (localPath, folder) => {
    if (!localPath) return null;
    const uploadResult = await cloudinary.uploader.upload(localPath, { resource_type: "image", folder })
    fs.unlinkSync(localPath);
    return uploadResult
}

const removeFromCloudinary = async (remotePath, folder) => {
    if (!remotePath) return null;
    const publicId = remotePath.split('/').pop().split('.')[0]
    const uploadResult = await cloudinary.uploader.destroy(folder + '/' + publicId, { resource_type: "image" })
    return uploadResult
}

export {
    uploadonCloudinary,
    removeFromCloudinary
}