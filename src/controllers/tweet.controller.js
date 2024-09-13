import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getTweet = async(req, res) => {
    const {tweetId} = req.query;
    if(!tweetId) {
        throw new ApiError(400, "tweet id is required");
    }

    const tweet = await Tweet.aggregate([
        {
            $match: {
                _id :  new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                pipeline : [
                    {
                        $project : {
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ],
                as: "user",
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "tweet",
                as: "comments",
            }
        },
        {
            $addFields: {
                commentsCount : {
                    $size : "$comments"
                }
            }
        },
        {
            $project: {
                comments : 0
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "tweet",
                as: "comments",
                pipeline: [
                    {
                        $limit: 10
                    },
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "comment",
                            as: "likes",
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "user",
                            pipeline: [
                                {
                                    $project : {
                                        fullname: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "comments",
                            localField: "_id",
                            foreignField: "replyComment",
                            as: "replyComments",
                        }
                    },
                    {
                        $addFields: {
                            likesCount: {
                                $size: "$likes"
                            },
                            repliesCount: {
                                $size: "$replyComments"
                            },
                            LikedByUser: {
                                $cond: {
                                    if: {
                                        $in:[req.user?._id, "$likes.likedBy"]
                                    },
                                    then: true,
                                    else: false
                                }
                            },
                            user : {
                                $first : "$user"
                            }
                        },
                    },
                    {
                        $project: {
                            likesCount:1,
                            repliesCount: 1,
                            user: 1,
                            content: 1,
                            LikedByUser: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                commentsCount: {
                    $size: "$comments"
                },
                LikedByUser: {
                    $cond: {
                        if: {
                            $in:[req.user?._id, "$likes.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                },
                user : {
                    $first : "$user"
                }
            }
        },
        {
            $project: {
                likesCount:1,
                commentsCount: 1,
                user: 1,
                content: 1,
                LikedByUser: 1,
                comments: 1
            }
        }
    ])

    
    if(!tweet) {
        throw new ApiError(404, "requested tweet does not exists or has been deleted")
    }
    
    let next = -1
    if(tweet.commentsCount > 10) {
        next = 10
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {
            tweet,
            next
        },
        "tweet fetched successfully"
    ))
}

const getTweets = async(req, res) => {
    const {username} = req.params;
    const {start} = req.query;
    if(!username) {
        throw new ApiError(400, "channel username required");
    }

    const channelUser = await User.findOne({username})
    if(!channelUser) {
        throw new ApiError(404, "username does not exists");
    }
    
    let startIdx = parseInt(start) 

    let tweets = await Tweet.aggregate([
        {
            $match : {
                owner : channelUser._id,
                ...(!channelUser._id.equals(req.user?._id) && {isPublic : true})
            }
        },
        {
            $skip: startIdx
        },
        {
            $limit: 11
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "tweet",
                as: "comments"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size : "$likes"
                },
                commentsCount:  {
                    $size : "$comments"
                },
                likedByUser: {
                    $cond: {
                        if:{$in:[req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                likesCount: 1,
                likedByUser: 1,
                content: 1,
                commentsCount: 1
            }
        }

    ]);

    let next = -1
    if(tweets.length == 11) {
        tweets = tweets.slice(0, 10);
        next = startIdx + 10;
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {
            tweets,
            next
        },
        "all tweets fetched successfully"
    ))
}

const createTweet = async(req, res) => {
    const user = req.user
    const {content} = req.body

    if(!content) {
        throw new ApiError(400, "content is required for creation of tweet")
    }

    const newTweet = await Tweet.create({owner: user._id, content})
    
    return res
    .status(201)
    .json(new ApiResponse(
        201,
        newTweet,
        "tweet successfully created"
    ))
}

const updateTweet = async(req, res) => {
    const user = req.user
    const {tweetId} = req.params
    const {content} = req.body

    
    if(!tweetId) {
        throw new ApiError(400, "tweet id is required");
    }
    
    if(!content || content.trim == "") {
        throw new ApiError(400, "content is missing");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet) {
        throw new ApiError(404, "requested tweet does not exists or has been deleted")
    }

    if(!user._id.equals(tweet.owner)) {
        throw new ApiError(403, "tweet does not belong to the requested user")
    }

    tweet.content = content
    const updatedTweet = await tweet.save()

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        updatedTweet,
        "tweet updated successfully"
    ))
}

const deleteTweet = async(req, res) => {
    const user = req.user
    const {tweetId} = req.params
    
    if(!tweetId) {
        throw new ApiError(400, "tweet id is required");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet) {
        throw new ApiError(404, "requested tweet does not exists or has been deleted")
    }

    if(!user._id.equals(tweet.owner)) {
        throw new ApiError(403, "tweet does not belong to the requested user")
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "tweet deleted successfully"
    ))
}

const likeTweet = async(req, res) => {
    const {tweetId} = req.params
    const user = req.user

    if(!tweetId) {
        throw new ApiError(400, "tweetId is required")
    }

    const like = await Like.findOne({tweet: tweetId, likedBy: user._id})
    
    if(like) {
        throw new ApiError(400, "user has already liked the tweet")
    }

    await Like.create({tweet: tweetId, likedBy: user._id})

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        {},
        "user liked the tweet successfully"
    ))
}

const unlikeTweet = async(req, res) => {
    const {tweetId} = req.params
    const user = req.user

    if(!tweetId) {
        throw new ApiError(400, "tweetId is required")
    }

    const like = await Like.findOne({tweet: tweetId, likedBy: user._id})
    
    if(!like) {
        throw new ApiError(404, "user has not liked the tweet or has already unliked the tweet")
    }

    await Like.findByIdAndDelete(like._id)

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "user unliked the tweet successfully"
    ))
}

const makeTweetPrivate = async(req, res) => {
    const {tweetId} = req.params
    const user = req.user
    
    if(!tweetId) {
        throw new ApiError(400, "Tweet id cannot be empty")
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet) {
        throw new ApiError(404, "Requested tweet for updation does not exists or has been deleted")
    }
    else if(!tweet.owner.equals(user._id))  {
        throw new ApiError(403, "Tweet does not belong to the requested user")
    }
    else if(!tweet.isPublic) {
        throw new ApiError(400, "Requested tweet is already private")
    }

    tweet.isPublic = 0
    await tweet.save()

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Tweet made private successfully"
    ))
}

const makeTweetPublic = async(req, res) => {
    const {tweetId} = req.params
    const user = req.user
    
    if(!tweetId) {
        throw new ApiError(400, "Tweet id cannot be empty")
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet) {
        throw new ApiError(404, "Requested tweet for updation does not exists or has been deleted")
    }
    else if(!tweet.owner.equals(user._id)) {
        throw new ApiError(403, "Tweet does not belong to the requested user")
    }
    else if(tweet.isPublic) {
        throw new ApiError(400, "Requested tweet is already public")
    }

    tweet.isPublic = 1
    await tweet.save()

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Tweet made public successfully"
    ))
}

export {
    getTweet,
    getTweets,
    createTweet,
    updateTweet,
    deleteTweet,
    likeTweet,
    unlikeTweet,
    makeTweetPrivate,
    makeTweetPublic
}