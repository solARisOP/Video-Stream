import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideo = async(req, res) => {
    const {videoId} = req.query;

    if(!videoId) {
        throw new ApiError(400, "video id is required");
    }

    const video = Video.aggregate([
        {
            $match: {
                _id :  mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "user",
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
                pipeline: [
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
                            pipeline: [
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
                                    $addFields: {
                                        likesCount: {
                                            $size: "$likes"
                                        },
                                        LikedByUser: {
                                            $cond: {
                                                if: {
                                                    $in:[req.user?._id, "$likes.likedBy"]
                                                },
                                                then: true,
                                                else: false
                                            }
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        likesCount:1,
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
                            }
                        },
                    },
                    {
                        $project: {
                            likesCount:1,
                            repliesCount: 1,
                            user: 1,
                            content: 1,
                            LikedByUser: 1,
                            replyComments: 1
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
                }
            }
        },
        {
            $project: {
                views: 1,
                likesCount: 1,
                commentsCount: 1,
                description: 1,
                user: 1,
                videoFile: 1,
                LikedByUser: 1,
                comments: 1
            }
        }
    ]).toArray()

    if(!video) {
        throw new ApiError(404, "requested video does not exists or has been deleted")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        video,
        "video fetched successfully"
    ))
}

const getAllVideos = async(req, res) => {
    const username = req.query.username;
    if(!username) {
        throw new ApiError(400, "channel username required");
    }

    const channelUser = await User.find({username})
    if(!channelUser) {
        throw new ApiError(404, "username does not exists");
    }

    const videos = await Video.find({
        owner : channelUser._id
    })
    .select("views thumbnail title duration");

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        videos,
        "all videos fetched successfully"
    ))
}

const deleteVideo = async(req, res) => {
    // delete video logic
}

const likeVideo = async(req, res) => {
    const {videoId} = req.params
    const user = req.user

    if(!videoId) {
        throw new ApiError(400, "video id is required")
    }

    const like = await Like.find({video: videoId, likedBy: user._id})
    
    if(like) {
        throw new ApiError(400, "user has already liked the video")
    }

    await Like.create({video: videoId, likedBy: user._id})

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        {},
        "user liked the video successfully"
    ))
}

const unlikeVideo = async(req, res) => {
    const {videoId} = req.params
    const user = req.user

    if(!videoId) {
        throw new ApiError(400, "video id is required")
    }

    const like = await Like.findOneAndDelete({video: videoId, likedBy: user._id})

    if(!like) {
        throw new ApiError(404, "like does not exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "user unliked the video successfully"
    ))
}

const updateTitle = async(req, res) => {
    const {videoId} = req.params
    const {title} = req.body
    const user = req.user

    if(!videoId) {
        throw new ApiError(400, "video id is required")
    }
    else if(!title) {
        throw new ApiError(400, "video title cannot be empty")
    }

    const video = await Video.findOneAndUpdate(
        {
            _id: videoId, 
            owner: user._id
        }, 
        {title},
        {new: true}
    )

    if(!video) {
        throw new ApiError(404, "no video exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        video,
        "video title changed successfully"
    ))
}

const updateDescription = async(req, res) => {
    const {videoId} = req.params
    const {description} = req.body
    const user = req.user

    if(!videoId) {
        throw new ApiError(400, "video id is required")
    }
    else if(!description) {
        throw new ApiError(400, "video description cannot be empty")
    }

    const video = await Video.findOneAndUpdate(
        {
            _id: videoId, 
            owner: user._id
        }, 
        {description},
        {new: true}
    )

    if(!video) {
        throw new ApiError(404, "no video exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        video,
        "video description changed successfully"
    ))
}

const deleteDescription = async(req, res) => {
    const {videoId} = req.params
    const user = req.user

    if(!videoId) {
        throw new ApiError(400, "video id is required")
    }

    const video = await Video.findOneAndUpdate(
        {
            _id: videoId, 
            owner: user._id
        }, 
        {description: ""},
        {new: true}
    )

    if(!video) {
        throw new ApiError(404, "no video exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        video,
        "video description deleted successfully"
    ))
}