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
                as: "comments"
            }
        },
        {
            $addFields : {
                commentsCount : {
                    $size : "$comments"
                }
            }
        },
        {
            $project : {
                comments : 0
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
                            as: "owner",
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
                                $in:[req.user?._id, "$likes.likedBy"]
                            }
                        },
                    },
                    {
                        $addFields: {
                            user : {
                                $first : "$user"
                            }
                        }
                    },
                    {
                        $project: {
                            likesCount:1,
                            repliesCount: 1,
                            user: 1,
                            content: 1,
                            LikedByUser: 1,
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
                    $in:[req.user?._id, "$likes.likedBy"]
                },
                user : {
                    $first : "$user"
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
    ])

    if(!video) {
        throw new ApiError(404, "requested video does not exists or has been deleted")
    }

    let next = -1
    if(video.commentsCount > 10) {
        next = 10
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {
            video,
            next
        },
        "video fetched successfully"
    ))
}

const getVideos = async(req, res) => {
    const {username} = req.params;
    const {start} = req.query;
    if(!username) {
        throw new ApiError(400, "channel username required");
    }

    const channelUser = await User.find({username})
    if(!channelUser) {
        throw new ApiError(404, "username does not exists");
    }

    let startIdx = parseInt(start) 

    let videos = await Video.aggregate([
        {
            $match : {
                owner : channelUser._id,
                ...(!channelUser._id.equals(req.user?._id) && {public : 1})
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
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
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
                    $in:[req.user?._id, "$likes.likedBy"]
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
    if(videos.length == 11) {
        videos = videos.slice(0, 10)
        next = 10
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {
            videos,
            next
        },
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

const makeVideoPrivate = async(req, res) => {
    const {videoId} = req.params
    const user = req.user
    
    if(!videoId) {
        throw new ApiError(400, "Video id cannot be empty")
    }

    const video = await Video.findById(videoId);

    if(!video) {
        throw new ApiError(404, "Requested video for updation does not exists or has been deleted")
    }
    else if(video.owner != user._id) {
        throw new ApiError(403, "Video does not belong to the requested user")
    }
    else if(!video.ispublic) {
        throw new ApiError(400, "Requested video is already private")
    }

    video.ispublic = 0
    await video.save()

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Video made private successfully"
    ))
}

const makeVideoPublic = async(req, res) => {
    const {videoId} = req.params
    const user = req.user
    
    if(!videoId) {
        throw new ApiError(400, "Video id cannot be empty")
    }

    const video = await Video.findById(videoId);

    if(!video) {
        throw new ApiError(404, "Requested video for updation does not exists or has been deleted")
    }
    else if(video.owner != user._id) {
        throw new ApiError(403, "Video does not belong to the requested user")
    }
    else if(video.ispublic) {
        throw new ApiError(400, "Requested video is already public")
    }

    video.ispublic = 1
    await video.save()

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Video made public successfully"
    ))
}

export {
    getVideo,
    getVideos,
    likeVideo,
    unlikeVideo,
    updateTitle,
    updateDescription,
    makeVideoPrivate,
    makeVideoPublic
}