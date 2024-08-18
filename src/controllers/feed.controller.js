import { Video } from "../models/video.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const homeVideos = async(req, res) => {

    const videos = await Video.find({ispublic:1});
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        videos,
        "all videos fetched successfully"
    ))
}

const searchQuery = async(req, res) => {
    const {query} = req.query 
}

export {
    homeVideos,
    searchQuery
}