import mongoose from "mongoose";

const TweetSchema = new mongoose.Schema({
    owner : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    ispublic: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export const Tweet = mongoose.model('Tweet', TweetSchema);