import mongoose from "mongoose"
import { ApiError } from "../utils/ApiError"

const likeSchema = new mongoose.Schema({
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    tweet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "liked user required"]
    }
},{
    timestamps: true
})

likeSchema.pre('validate', function(next) {
    
    const fields = [this.comment, this.tweet, this.video].filter(feild=> feild != null)

    if(!fields.length) next(new ApiError("atleast one of the feilds required"));
    if(fields.length>1) next(new ApiError("only one of the feilds allowed"));
})

export const Like = mongoose.model('Like', likeSchema)