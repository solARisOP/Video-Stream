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
        required: true
    }
},{
    timestamps: true
})

// likeSchema.pre('save', function(next){
//     //some code
//     try{

//         if(!this.hasOwnProperty('') && !this.tweet && !this.video) {
//             throw new ApiError("Atleast one of the feilds required")
//         }
//         else if()
//     }
//     catch(err){
//         next(err)
//     }

// })

export const Like = mongoose.model('Like', likeSchema)