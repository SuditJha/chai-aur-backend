import { Router } from "express";
import { customPlayList, youtubePlaylist } from "../controllers/playlist.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"


const router = Router()
// Default 
router.route("/youtube-playList").post(youtubePlaylist)

// Secured
router.route("/custom-playlist").post(verifyJWT, upload.single("thumbnail"), customPlayList)


export default router