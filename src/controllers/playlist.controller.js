import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const createPlaylist = async(req, res) => {
    const user = req.user
    const {name, description, ispublic} = req.body

    if(!name.trim()) {
        throw new ApiError(400, "playlist title cannot be empty")
    }
    else if(!name.trim()) {
        throw new ApiError(400, "playlist title cannot be empty")
    }
    
    const newPlaylist = await Playlist.create({
        name, 
        description, 
        ispublic, 
        owner : user
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
    const playlistId = req.query

    if(!playlistId.trim()) {
        throw new ApiError(400, "playlist id cannot be empty")
    }
    
    const playlist = await Playlist.findById(playlistId)
    
    if(!playlist) {
        throw new ApiError(404, "No playlist found")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "Playlist fetched successfully"
    ))
}

const getAllPlaylists = async(req, res) => {

}

const updatePlaylistTitle = async(req, res) => {

}

const deletePlaylist = async(req, res) => {

}

const updatePlaylistDescription = async(req, res) => {

}

const addVideos = async(req, res) => {
    
}

const removeVideos = async(req, res) => {

}

const makePlaylistPrivate = async(req, res) => {

}

const makePlaylistPublic = async(req, res) => {

}

