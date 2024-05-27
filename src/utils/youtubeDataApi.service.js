import { google } from "googleapis"

const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_DATA_API_KEY
})

const getPlaylistInfo = async (playlistID) => {
    try {
        const response = await youtube.playlists.list({
            part: "snippet, contentDetails",
            id: playlistID
        })

        const { title, description, thumbnails } = response.data.items[0].snippet
        return { title, description, thumbnails }
    } catch (error) {
        console.log("Something went wrong while fetching the playlist title, description or thumbnail\n", error)
        return { Error: "Something went wrong while fetching the playlist title, description or thumbnail" }
    }
}

const getAllVideoInPlaylist = async (playlistID) => {
    try {
        let nextPageToken = null
        const videoIDList = []
        let count = 0

        while (true) {
            const response = await youtube.playlistItems.list({
                part: "snippet",
                playlistId: playlistID,
                maxResults: 50,
                pageToken: nextPageToken
            })
            nextPageToken = response.data.nextPageToken
            // console.log(nextPageToken);

            const videos = response.data.items
            videos.forEach((video) => {
                videoIDList.push(video.snippet.resourceId.videoId)
            });

            if (!nextPageToken) {
                break
            }
            // console.log(response.data.items[0], " ", nextPageToken)
        }
        console.log(count);
        return videoIDList

    } catch (error) {
        console.log("Something went worng while retriving all videos ID's\n", error);
        return { error: "Something went worng while retriving all videos ID's" }
    }
}

const getVideoDetails = async (videoId) => {
    try {
        // let nextPageToken = null
        const response = await youtube.videos.list(
            {
                part: "snippet, contentDetails, statistics",
                id: videoId,
            }
        )

        const videoData = []
        response.data.items.forEach(item => {
            videoData.push({
                videoId: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnails: item.snippet.thumbnails,
                duration: item.contentDetails.duration
            })
        });
        // console.log(videoData);
        return videoData
    } catch (error) {
        console.log("Video detail retrieve error \n", error);
        return ({ error: "Something went wrong while retrieving video details" })
    }
}

export {
    getPlaylistInfo,
    getAllVideoInPlaylist,
    getVideoDetails,

}