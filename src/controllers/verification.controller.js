import { getTransporter } from "../utils/EmailTransporter.js";
import fs from "fs"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from "path";

const EmailVerification = async(req, res) => {
    const {email} = req.body
    const user = await User.findOne({email})
    
    if(user) {
        throw new ApiError(400, "Email already in use")
    }
    
    const transporter = await getTransporter()
    
    const OTP = Math.floor(100000 + Math.random() * 900000)
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const emailTemplate = req.method == 'POST' ? fs.readFileSync(path.join(__dirname, "../verfificationTemplates/newUserTemplate.html"), "utf-8") : fs.readFileSync(path.join(__dirname, "../verfificationTemplates/updateEmailTemplate.html"), "utf-8")
    
    const mailOptions = {
        to: email,
        subject: req.method == 'POST' ? "OTP for user registration" : "OTP for email updation",
        html : emailTemplate.replace("{OTP_HOLDER}", OTP)
    };
    
    await transporter.sendMail(mailOptions);
    
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {otp:OTP},
        "OTP sent successfully"
    ))
}

export {
    EmailVerification
}