import mongoose from "mongoose"
import { ApiError } from "../utils/ApiError"

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
    
    if(!fields.length) next(new ApiError("atleast one of the feilds required"));
    if(fields.length>1) next(new ApiError("only one of the feilds allowed"));
})

export const Comment = mongoose.model('Comment', commentSchema)
