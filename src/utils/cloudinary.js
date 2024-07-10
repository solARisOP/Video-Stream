import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({ 
    secure: true
})

const uploadonCloudinary = async (localPath) => {
    try{
        if(!localPath) return null;
        const uploadResult = await cloudinary.uploader.upload(localPath, {resource_type: "auto"})
        console.log("file uploaded at: ",uploadResult.url)
        return uploadResult
    }catch (error){
        fs.unlinkSync(localPath); //remove file(delete file) from server
        return null;
    }
}

export {uploadonCloudinary}