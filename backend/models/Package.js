import mongoose from "mongoose";

const PackageSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    recipientName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    deliveryPrice: {
        type: Number,
        required: true,
    },
    isDelivered: {
        type: Boolean,
        required: true,
    },
}, { collection: "packages" });

export default mongoose.model('Package', PackageSchema);