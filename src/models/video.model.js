import mongoose, { Schema } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
const videoSchema = new Schema(
    {
        videoID: {
            type: String, // youtube video ID
            required: [true, "VideoID is required"],

        },
        thumbnail: {},
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: String, // cloudinary info
            required: true,
        },
        channelName: {
            type: String,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        playList: {
            type: Schema.Types.ObjectId,
            ref: "Playlist"
        },
        notes: {
            type: Schema.Types.ObjectId,
            ref: "Note"
        }
    },
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema) 