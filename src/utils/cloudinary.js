import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET
})

const uploadonCloudinary = async (localPath) => {
    try{
        if(!localPath) return null;
        const uploadResult = await cloudinary.uploader.upload(localPath, {resource_type: "auto"})
        fs.unlinkSync(localPath);
        return uploadResult
    }catch (error){
        fs.unlinkSync(localPath); //remove file(delete file) from server
        return null;
    }
}

export {uploadonCloudinary}