import mongoose, { Schema } from "mongoose";

const noteSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    },
    { timestamps: true }

)

export const Note = mongoose.model("Note", noteSchema)