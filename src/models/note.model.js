import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

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

noteSchema.plugin(mongooseAggregatePaginate)

export const Note = mongoose.model("Note", noteSchema)