import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.service.js"
import { getPlaylistInfo, getAllVideoInPlaylist, getVideoDetails } from "../utils/youtubeDataApi.service.js"
import { playtime } from "../utils/videosPlaytime.js"
import mongoose from "mongoose"


function getPlaylistId(url) {
    const match = url.match(/[&?]list=([^&]+)/);
    return match ? match[1] : null;
}

function generateVideoIdString(videoIDList, startIndex, endIndex) {
    let videoIdString = ""
    for (let i = startIndex; i < endIndex; i++) {
        videoIdString += videoIDList[i] + ","
    }
    videoIdString = videoIdString.substring(0, videoIdString.length - 1)
    return videoIdString
}

const customPlayList = asyncHandler(async (req, res) => {

    const { name, description } = req.body
    if (!name || !description) {
        throw new ApiError(400, "All fields are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        customPlayList: true,
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

const youtubePlaylist = asyncHandler(async (req, res) => {
    try {
        const url = req.body?.url
        if (!url) {
            throw new ApiError(400, "Url is required!")
        }
        const playlistID = getPlaylistId(url)
        if (!playlistID) {
            throw ApiError(401, "Invalid playList ID!")
        }

        const playListDetails = await getPlaylistInfo(playlistID)
        console.log(playListDetails);
        const playlist = await Playlist.create(
            {
                name: playListDetails.title,
                description: playListDetails.description,
                thumbnail: playListDetails.thumbnails,
                owner: new mongoose.Types.ObjectId(req.user?._id),
            }
        )

        if (!playlist) {
            throw new ApiError(500, "Error while creating playlist")
        }

        // returns an array containing the id of the video uploaded on youtube
        const videoIDList = await getAllVideoInPlaylist(playlistID)
        // console.log(videoIDList);
        if (!videoIDList) {
            throw new ApiError(500, "Couldn't get the videos from playlist")
        }


        const videoIdListStringArray = []

        // Generating comma seperated ids
        const videoIdListLength = videoIDList.length
        let start = 0;
        while ((start + 50) < videoIdListLength) {
            videoIdListStringArray.push(generateVideoIdString(videoIDList, start, start + 50))
            start += 50
        }
        videoIdListStringArray.push(generateVideoIdString(videoIDList, start, videoIdListLength))

        // For each does not wait for await --> creates empty array 

        // videoIdListStringArray.forEach(async (videoIdString) => {
        //     const details = await getVideoDetails(videoIdString)
        //     details.forEach(detail => {
        //         // console.log("details", detail);
        //         videoDetailsArray.unshift(detail)
        //     });
        // })

        let videoDetailsArray = [];
        const detailsPromises = videoIdListStringArray.map(videoIdString => getVideoDetails(videoIdString));

        const detailsArray = await Promise.all(detailsPromises);

        detailsArray.forEach(details => {
            videoDetailsArray = videoDetailsArray.concat(details);
        });

        const finalVideoDetails = videoDetailsArray.map((video) => {
            video.playlist = playlist._id
            return video
        })

        const videos = await Video.insertMany(finalVideoDetails)
        if (!videos) {
            throw new ApiError(500, "Error While creating video documents ")
        }

        res.status(200)
            .json(
                new ApiResponse(200, { playlist }, "Playlist created successfully")
            )
    } catch (error) {
        console.log(error);
        throw new ApiError(400, error.message)
    }

})

const getPlaylistVideos = asyncHandler(async (req, res) => {
    const playlistID = req.query?.listId
    if (!playlistID) {
        throw new ApiError(400, "PlayList ID is required / not sent")
    }
    const videos = await Video.find(
        {
            playlist: new mongoose.Types.ObjectId(playlistID)
        }
    )
    if (!videos) {
        throw new ApiError(400, "Could not retrieve the videos")
    }
    const totalPlayTime = playtime(videos)
    console.log(totalPlayTime);
    res.status(200)
        .json(
            new ApiResponse(200, { videos, playtime: totalPlayTime }, "Videos Successfull sent")
        )
})

export {
    customPlayList,
    youtubePlaylist,
    getPlaylistVideos
}