import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const likeComment = async(req, res) => {
    const {commentId} = req.params;
    
    if(!commentId) {
        throw new ApiError(400, "comment id is missing");
    }

    const comment = await Comment.findById(commentId)

    if(!comment) {
        throw new ApiError(400, "no comment exists for this comment id");
    }

    const like = await Like.findOne({comment: commentId})

    if(like) {
        throw new ApiError(400, "user has already liked the comment");
    }

    await Like.create({comment: commentId, likedBy: req.user._id});

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        {},
        "user successfully liked the comment"
    ))
}

const unLikeComment = async(req, res) => {
    const {commentId} = req.params;
    
    if(!commentId) {
        throw new ApiError(400, "comment id is missing");
    }

    const comment = await Comment.findById(commentId)

    if(!comment) {
        throw new ApiError(400, "no comment exists for this comment id");
    }

    const like = await Like.findOneAndDelete({comment: commentId, likedBy: req.user._id})

    if(!like) {
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

const updateComment = async(req, res) => {
    const {commentId} = req.params;
    const {content} = req.body
    
    if(!commentId) {
        throw new ApiError(400, "comment id is missing");
    }
    else if(!content) {
        throw new ApiError(400, "received comment cannot be empty");
    }

    const newComment = await Comment.findOneAndUpdate(
        {_id:commentId, owner: req.user._id}, 
        {content}, 
        {new : true}
    ).select("content")

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        newComment,
        "comment successfully updated"
    ))
}

const deleteComment = async(req, res) => {
    const {commentId} = req.params;
    
    if(!commentId) {
        throw new ApiError(400, "comment id is missing");
    }

    const delComment = await Comment.findOneAndDelete(
        {_id:commentId, owner: req.user._id}, 
        {content}
    )

    if(!delComment) {
        throw new ApiError(400, "no comment exists for specific comment id")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        "comment successfully deleted"
    ))
}

const replyComment = async(req, res) => {
    const {commentId} = req.params
    const {content} = req.body
    
    if(!commentId) {
        throw new ApiError(400, "comment id is missing");
    }
    else if(!content) {
        throw new ApiError(400, "received comment cannot be empty");
    }

    const newComment = await Comment.create({
        owner: req.user._id,
        content, 
        replyComment: commentId
    }).select("content")

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        newComment,
        "reply comment successfully created"
    ))
}

const commentOnVideo = async(req, res) => {
    const {videoId} = req.params
    const {content} = req.body
    
    if(!videoId) {
        throw new ApiError(400, "video id cannot be empty");
    }
    else if(!content) {
        throw new ApiError(400, "received comment content cannot be empty");
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(400, "video doesnot exists or has been deleted");
    }

    const newComment = await Comment.create({
        owner: req.user._id,
        content, 
        video: video._id
    }).select("content")

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        newComment,
        "user successfully commented on the Video"
    ))
}

const commentOnTweet = async(req, res) => {
    const {tweetId} = req.params
    const {content} = req.body
    
    if(!tweetId) {
        throw new ApiError(400, "tweet id cannot be empty");
    }
    else if(!content) {
        throw new ApiError(400, "received comment content cannot be empty");
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet) {
        throw new ApiError(400, "tweet doesnot exists or has been deleted");
    }

    const newComment = await Comment.create({
        owner: req.user._id,
        content, 
        tweet: tweet._id
    }).select("content")

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        newComment,
        "user successfully commented on the Tweet"
    ))
}

export {
    likeComment,
    unLikeComment,
    updateComment,
    deleteComment,
    replyComment,
    commentOnVideo,
    commentOnTweet
}