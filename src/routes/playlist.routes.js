import { Router } from "express";
import {
    createPlaylist,
    getPlaylist,
    getAllPlaylists,
    updatePlaylist,
    deletePlaylist,
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

router.route('/update-playlist/:playlistId').patch(verifyJWT, updatePlaylist)

router.route('/delete-playlist/:playlistId').delete(verifyJWT, deletePlaylist)

router.route('/add-videos/:playlistId').patch(verifyJWT, addVideos)

router.route('/remove-video/:playlistId').delete(verifyJWT, removeVideo)

router.route('/private-playlist/:playlistId').patch(verifyJWT, makePlaylistPrivate)

router.route('/public-playlist/:playlistId').patch(verifyJWT, makePlaylistPublic)

export default router;