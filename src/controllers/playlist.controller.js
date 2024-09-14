import mongoose from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Video } from "../models/video.model.js"

const createPlaylist = async(req, res) => {
    const user = req.user
    const {name, description, isPublic} = req.body

    if(!name.trim()) {
        throw new ApiError(400, "playlist title cannot be empty")
    }
    
    const newPlaylist = await Playlist.create({
        name, 
        description, 
        isPublic, 
        owner : user._id
    })

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        newPlaylist,
        "Playlist created successfully"
    ))
}

const getPlaylist = async(req, res) => {
    const {playlistId} = req.query
    const userId = req.user?._id || null;

    if(!playlistId.trim()) {
        throw new ApiError(400, "playlist id cannot be empty")
    }
    
    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(playlistId),
                $or : [
                    {owner : userId},
                    {isPublic : true}
                ]
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1
                                    }
                                }
                            ],
                            as: "user"
                        },
                    },
                    {
                        $project : {
                            user : {
                                $first: "$user"
                            },
                            isPublic : 1,
                            thumbnail : 1,
                            title : 1,
                            views : 1,
                            duration : 1
                        }
                    }
                ],
                as: "videosInfo"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            fullname: 1
                        }
                    }
                ],
                as: "user"
            }
        },
        {
            $project : {
                user : {
                    $first: "$user"
                },
                name : 1,
                description: 1,
                videosInfo : {
                    $filter: {
                        input: "$videosInfo",
                        as: "video",
                        cond: {
                            $or:[
                                { $eq : ["$$video.isPublic", true] },
                                { $eq: [ "$$video.user._id", userId ] },
                            ]
                        }
                    }
                },
                totalVideos : {
                    $size : "$videos"
                }
            }
        }
    ])
    
    if(!playlist[0]) {
        throw new ApiError(404, "No playlist found")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlist[0],
        "Playlist fetched successfully"
    ))
}

const getAllPlaylists = async(req, res) => {
    const {channelId} = req.params
    const user = req.user

    const playlists = await Playlist.find({
        owner : channelId,
        $or: [
            {isPublic: true}, 
            {owner: user?._id}
        ]
    })
    
    if(!playlists.length) {
        throw new ApiError(404, "No playlists avaliable for this channelId")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlists,
        "All playlists fetched sucessfully"
    ))
}

const updatePlaylist = async(req, res) => {
    const { playlistId, field } = req.params
    const { content } = req.body

    if(field != 'name' && field != 'description') {
        throw new ApiError(400, "invalid field name")
    }

    if(!playlistId.trim()) {
        throw new ApiError(400, "playlist id cannot be empty")
    }

    const playlist = await Playlist.findById(playlistId)
    
    if(!playlist) {
        throw new ApiError(404, "No playlist exists for give id or has been deleted")
    }
    else if(!playlist.owner.equals(req.user._id)) {
        throw new ApiError(404, "Requested playlist for updation doesnot belong to the user")
    }

    playlist[field] = content

    await playlist.save({new : true})

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlist,
        `Playlist ${field} updated sucessfully`
    ))
}

const deletePlaylist = async(req, res) => {
    let {playlistId} = req.params;

    playlistId = playlistId.trim()

    if(!playlistId) {
        throw new ApiError(400, "Playlist id cannot be empty")
    }

    const delPlaylist = await Playlist.findById(playlistId);

    if(!delPlaylist){
        throw new ApiError(404, "Requested playlist doesnot exist or has already been deleted")
    }
    else if(!delPlaylist.owner.equals(req.user._id)) {
        throw new ApiError(403, "The requested playlist for deletion doesn't belong to the requested user")
    }

    await Playlist.findByIdAndDelete(delPlaylist._id)

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Playlist deleted successfully"
    ))

}

const addVideos = async(req, res) => {
    const {playlistId} = req.params;
    let {videos} = req.body;

    const playlist = await Playlist.findById(playlistId)

    if(!playlist) {
        throw new ApiError(404, "requested playlist for updation does not exists")
    }
    else if(!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "Requested playlist for updation does not belong to user")
    }

    videos = [...new Set(videos)]

    if(!playlistId) {
        throw new ApiError(400, "Playlist id cannot be empty")
    }
    else if(!videos.length) {
        throw new ApiError(400, "videos list cannot be empty")
    }
    
    let fetchedVideos = await Video.find({
        _id: {$in:videos},
        $or:[
            {isPublic : 1},
            {owner: req.user._id}
        ]
    }).select("_id");
    
    if(videos.length != fetchedVideos.length) {
        throw new ApiError(403, "user does not have access to some videos or the videos does not exists")
    }
    
    playlist.videos = [...playlist.videos, ...fetchedVideos];

    await playlist.save()

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "Videos added to the playlist successfully"
    ))
}

const removeVideo = async(req, res) => {
    let {playlistId} = req.params;
    let {idx, videoId} = req.body;

    if(idx === undefined) {
        throw new ApiError(400, "idx parameter cannot be empty");
    }

    playlistId = playlistId.trim()
    videoId = videoId.trim()

    if(!playlistId) {
        throw new ApiError(400, "Playlist id cannot be empty")
    }
    else if(!videoId) {
        throw new ApiError(400, "video id cannot be empty")
    }
    
    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Requested playlist for updation does not exist or has already been deleted")
    }
    else if(!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "The requested playlist for updation does not belong to the requested user")
    }

    if(idx<playlist.videos.length && playlist.videos[idx] == videoId) {
        playlist.videos.splice(idx, 1)
        await playlist.save({validateBeforeSave : true});
    }
    else {
        throw new ApiError(400, "invalid idx parameter")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "video removed sucessfully"
    ))
}

const makePlaylistPrivate = async(req, res) => {
    let {playlistId} = req.params;

    playlistId = playlistId.trim()

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Requested playlist for updation does not exist or has already been deleted")
    }
    else if(!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "The requested playlist for updation does not belong to the requested user")
    }
    
    if(!playlist.isPublic) {
        throw new ApiError(400, "The requested playlist for updation is already private")
    }

    playlist.isPublic = 0;
    await playlist.save({validateBeforeSave : true}); 

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "Playlist made private successfully"
    ))
}

const makePlaylistPublic = async(req, res) => {
    let {playlistId} = req.params;

    playlistId = playlistId.trim()

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Requested playlist for updation does not exist or has already been deleted")
    }
    else if(!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "The requested playlist for updation does not belong to the requested user")
    }
    
    if(playlist.isPublic) {
        throw new ApiError(400, "The requested playlist for updation is already public")
    }

    playlist.isPublic = 1;
    await playlist.save({validateBeforeSave : true}); 

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "Playlist made public successfully"
    ))
}

export {
    createPlaylist,
    getPlaylist,
    getAllPlaylists,
    updatePlaylist,
    deletePlaylist,
    addVideos,
    removeVideo,
    makePlaylistPrivate,
    makePlaylistPublic
}
