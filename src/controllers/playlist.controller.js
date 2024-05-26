import { Playlist } from "../models/playlist.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.service.js"
import mongoose from "mongoose"

const customPlayList = asyncHandler(async (req, res) => {

    const { name, description } = req.body
    if (!name || !description) {
        throw new ApiError(400, "All fields are required")
    }

    const thumbnailFilePath = req.file?.path
    let thumbnail = ""
    if (thumbnailFilePath) {
        thumbnail = await uploadOnCloudinary(thumbnailFilePath)
        if (!thumbnail?.url) {
            throw new ApiError("500", "Error while uploading the thumbnail on cloudinary")
        }
    }

    const playlist = await Playlist.create({
        name,
        description,
        customPlayList: true,
        thumbnail: thumbnail?.url || "",
        owner: new mongoose.Types.ObjectId(req.user?._id),
    })

    if (!playlist) {
        throw new ApiError(500, "Something went wrong while creating the playlist.")
    }

    return res.status(200)
        .json(
            new ApiResponse(200, playlist, "Custom playlist was created.")
        )

})


export { customPlayList }