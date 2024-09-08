import { Router } from "express";
import {
    createPlaylist,
    getPlaylist,
    getAllPlaylists,
    updatePlaylistTitle,
    deletePlaylist,
    updatePlaylistDescription,
    addVideos,
    removeVideo,
    makePlaylistPrivate,
    makePlaylistPublic
} from "../controllers/playlist.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkUser } from "../middlewares/userCheck.middleware.js";

const router = Router()

router.route('/create-playlist').post(verifyJWT, createPlaylist)

router.route('/get-playlist').get(checkUser, getPlaylist)

router.route('/get-all-playlists/:channelId').get(checkUser, getAllPlaylists)

router.route('/update-playlist-title/:playlistId').patch(verifyJWT, updatePlaylistTitle)

router.route('/delete-playlist/:playlistId').delete(verifyJWT, deletePlaylist)

router.route('/update-playlist-description/:playlistId').patch(verifyJWT, updatePlaylistDescription)

router.route('/add-videos/:playlistId').patch(verifyJWT, addVideos)

router.route('/remove-video/:playlistId').delete(verifyJWT, removeVideo)

router.route('/playlist-private/:playlistId').patch(verifyJWT, makePlaylistPrivate)

router.route('/playlist-public/:playlistId').patch(verifyJWT, makePlaylistPublic)