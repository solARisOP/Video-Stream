import mongoose from "mongoose"

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "name required for playlist"]
    },
    videos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
    }],
    description: {
        type: String,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "playlist owner required"]
    },
    public: {
        type: Boolean,
        required: true,
        default: false
    }

},{
    timestamps: true
})

export const Playlist = mongoose.model('Comment', playlistSchema)