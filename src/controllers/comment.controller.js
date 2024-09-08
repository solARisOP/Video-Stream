import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const likeComment = async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, "comment id is missing");
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(400, "no comment exists for this comment id");
    }

    const like = await Like.findOne({ comment: commentId, likedBy: req.user._id })

    if (like) {
        throw new ApiError(400, "user has already liked the comment");
    }

    await Like.create({ comment: commentId, likedBy: req.user._id });

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            {},
            "user successfully liked the comment"
        ))
}

const unLikeComment = async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, "comment id is missing");
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(400, "no comment exists for this comment id");
    }

    const like = await Like.findOneAndDelete({ comment: commentId, likedBy: req.user._id })

    if (!like) {
        throw new ApiError(400, "user has not liked or already unliked the comment");
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "user successfully unliked the comment"
        ))
}

const updateComment = async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body

    if (!commentId) {
        throw new ApiError(400, "comment id is missing");
    }
    else if (!content) {
        throw new ApiError(400, "received comment cannot be empty");
    }

    const updatedComment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: req.user._id },
        { content },
        { runValidators: true, new: true }
    ).select("content")

    if (!updatedComment) {
        throw new ApiError(400, "no comment exists for the provided id")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            updatedComment,
            "comment successfully updated"
        ))
}

const deleteComment = async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, "comment id is missing");
    }

    const delComment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id
    })

    if (!delComment) {
        throw new ApiError(400, "no comment exists for specific comment id")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            "comment successfully deleted"
        ))
}

const replyComment = async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!commentId) {
        throw new ApiError(400, "comment id is missing");
    }
    else if (!content) {
        throw new ApiError(400, "received comment cannot be empty");
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(400, "no comment exists for specific comment id or it has been deleted")
    }

    const replyComment = await Comment.create({
        owner: req.user._id,
        content,
        replyComment: commentId
    })

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            replyComment,
            "reply comment successfully created"
        ))
}

const commentOnVideo = async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    if (!videoId) {
        throw new ApiError(400, "video id cannot be empty");
    }
    else if (!content) {
        throw new ApiError(400, "received comment content cannot be empty");
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "video doesnot exists or has been deleted");
    }

    const newComment = await Comment.create({
        owner: req.user._id,
        content,
        video: video._id
    })

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            newComment,
            "user successfully commented on the Video"
        ))
}

const commentOnTweet = async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if (!tweetId) {
        throw new ApiError(400, "tweet id cannot be empty");
    }
    else if (!content) {
        throw new ApiError(400, "received comment content cannot be empty");
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(400, "tweet doesnot exists or has been deleted");
    }

    const newComment = await Comment.create({
        owner: req.user._id,
        content,
        tweet: tweet._id
    })

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            newComment,
            "user successfully commented on the Tweet"
        ))
}

const getComments = async (req, res) => {
    const { key, start, type } = req.query
    
    if(!type || !type.trim() || (type != 'video' && type != 'tweet')) {
        throw new ApiError(400, "query object should contain a appropriate type variable")
    }
    
    const startIdx = parseInt(start)
    
    let comments = await Comment.aggregate([
        {
            $match: {
                [type] : new mongoose.Types.ObjectId(key)
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
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "replyComment",
                as: "replyComments"
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
                    $in: [req.user?._id, "$likes.likedBy"]
                },
                user : {
                    $first : "$user"
                }
            },
        },
        {
            $project: {
                likesCount: 1,
                repliesCount: 1,
                content: 1,
                LikedByUser: 1,
                user: 1
            }
        }
    ])

    let next = -1;
    if(comments.length == 11)
    {
        comments = comments.slice(0, 10)
        next = startIdx + 10;
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {
            comments,
            next
        },
        "comments fetched sucessfully"
    ))
}

const getReplies = async (req, res) => {
    const { key, start } = req.query;

    const startIdx = parseInt(start)

    let replies = await Comment.aggregate([
        {
            $match: {
                replyComment : new mongoose.Types.ObjectId(key)
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
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                LikedByUser: {
                    $in: [req.user?._id, "$likes.likedBy"]
                },
                user : {
                    $first : "$user"
                }
            },
        },
        {
            $project: {
                likesCount: 1,
                content: 1,
                LikedByUser: 1,
                user: 1
            }
        }
    ])

    let next = -1;
    if (replies.length == 11) {
        replies = replies.slice(0, 10);
        next = startIdx + 10;
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {
            replies,
            next
        },
        "replies fetched sucessfully"
    ))
}

export {
    likeComment,
    unLikeComment,
    updateComment,
    deleteComment,
    replyComment,
    commentOnVideo,
    commentOnTweet,
    getComments,
    getReplies
}