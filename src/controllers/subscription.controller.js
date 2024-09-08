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
    const {start} = req.query
    const user = req.user

    let startIdx = parseInt(start);
    let subscribers = await Subscription.aggregate([
        {
            $match : {
                channel : user._id
            }
        },
        {
            $skip : startIdx
        },
        {
            $limit : 21
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
                    },
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers",
                        }
                    },
                    {
                        $addFields : {
                            isUserSubscribed : {
                                $in : [req.user._id, "$subscribers.subscriber"]
                            }
                        }
                    },
                    {
                        $project: {
                            subscribers: 0,
                        }
                    },
                ]
            }
        },
        {
            $project: {
                subscriberUser : 1
            }
        }
    ])

    let next = -1;
    if(subscribers.length == 21) {
        subscribers = subscribers.slice(0, 20)
        next = startIdx + 20
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {
            subscribers,
            next
        },
        "all subscribers fetched successfully"
    ))

}

export {
    subscribe,
    unSubscribe,
    getAllSubscribers
}