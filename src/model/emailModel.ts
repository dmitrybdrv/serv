import mongoose from "mongoose";

const EmailSchemaModel = new mongoose.Schema(
    {
        email: { type: String, required: true },
        name: {type: String},
        blockList: { type: Boolean, required: true }
    },
    {
        timestamps: true,
    },
)

export default mongoose.model('Email', EmailSchemaModel)