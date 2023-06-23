import mongoose from "mongoose";

const EmailSchemaModel = new mongoose.Schema(
    {
        email: { type: String, required: true },
        blockList: { type: Boolean, required: true },
        userName: {type: String, required: false}
    },
    {
        timestamps: true,
    },
)

export default mongoose.model('Email', EmailSchemaModel)