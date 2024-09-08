import mongoose from "mongoose"
import { ApiError } from "../utils/ApiError.js"

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        trim: true,
        required: [true, "comment required"]
    },
    tweet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet",
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
    },
    replyComment : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "commented user required"]
    }
},{
    timestamps: true
})

commentSchema.pre('validate', function(next) {
    const fields = [this.replyComment, this.tweet, this.video].filter(feild=> feild != null)
    
    if(!fields.length) {
        return next(new ApiError(400, "atleast one of the feilds required"));
    } 
    if(fields.length>1) {
        return next(new ApiError(400, "only one of the feilds allowed"));
    } 
    next()
})

export const Comment = mongoose.model('Comment', commentSchema)
