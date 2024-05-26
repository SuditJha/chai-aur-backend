import { Router } from "express";
import { customPlayList } from "../controllers/playlist.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"


const router = Router()

router.route("/custom-playlist").post(verifyJWT, upload.single("thumbnail"), customPlayList)


export default router