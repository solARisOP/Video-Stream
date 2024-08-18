import {
    homeVideos,
    searchQuery
} from "../controllers/feed.controller.js"
import { Router } from "express"

const router = Router()

router.route('/home-page').get(homeVideos);
router.route('/search-query').get(searchQuery);

export default router