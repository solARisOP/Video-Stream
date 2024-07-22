import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const subscribe = async(req, res) => {
    const user = req.user;
    const {channelUserId} = req.params;

    if(!channelUserId) {
        throw new ApiError(400, "Channel user id cannot be empty")
    }
    
    const subscriber = await Subscription.findOne({channel : channelUserId, subscriber: user._id});
    
    if(subscriber) {
        throw new ApiError(400, "User has already subscribed to this channel")
    }
    
    const channel = await User.findById(channelUserId);

    if(!channel) {
        throw new ApiError(404, " No user channel exists with this channel user id")
    }

    await Subscription.create({channel : channelUserId, subscriber: user._id});

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "User subscribed to the channel successfully"
    ))
}

const unSubscribe = async(req, res) => {
    const user = req.user;
    const {channelUserId} = req.params;

    if(!channelUserId) {
        throw new ApiError(400, "Channel user id cannot be empty")
    }

    const channel = await User.findById(channelUserId);

    if(!channel) {
        throw new ApiError(404, "No user channel exists with this channel user id")
    }

    const subscriber = await Subscription.findOneAndDelete({channel : channelUserId, subscriber: user._id});
    
    if(!subscriber) {
        throw new ApiError(400, "User has not subscribed or already unsubscribed to this channel")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "User unsubscribed to the channel successfully"
    ))
}

const getAllSubscribers = async(req, res) => {
    const user = req.user
    const subscribers = await Subscription.aggregate([
        {
            $match : {
                channel : user._id
            }
        },
        {
            $lookup : {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberUser",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                subscriberUser : 1
            }
        }
    ]).toArray()

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        subscribers,
        "all subscribers fetched successfully"
    ))

}