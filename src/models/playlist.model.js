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
        trim: true,
        default: ""
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "playlist owner required"]
    },
    thumbnail : {
        type: String,
    },
    isPublic: {
        type: Boolean,
        required: true,
        default: true
    }

},{
    timestamps: true
})

export const Playlist = mongoose.model('Playlist', playlistSchema)