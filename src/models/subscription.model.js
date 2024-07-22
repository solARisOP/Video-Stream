import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

subscriptionSchema.index({ channel: 1, subscriber: 1}, { unique: true });

export const Subscription = mongoose.model("Subscription", subscriptionSchema)