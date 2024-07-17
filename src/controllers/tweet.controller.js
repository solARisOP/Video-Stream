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

    const tweet = await Tweet.findById(tweetId);

    if(!tweet) {
        throw new ApiError(404, "requested tweet does not exists or has been deleted")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        tweet,
        "tweet fetched successfully"
    ))
}

const getAllTweets = async(req, res) => {
    const username = req.query.username;
    if(!username) {
        throw new ApiError(400, "channel username required");
    }

    const channelUser = await User.find({username})
    if(!channelUser) {
        throw new ApiError(404, "username does not exists");
    }

    const tweets = await Tweet.find({owner : channelUser._id});

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        tweets,
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
    const {tweetId} = req.query
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

    if(user._id != tweet.owner) {
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
    const {tweetId} = req.query
    
    if(!tweetId) {
        throw new ApiError(400, "tweet id is required");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet) {
        throw new ApiError(404, "requested tweet does not exists or has been deleted")
    }

    if(user._id != tweet.owner) {
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
    const {tweetId} = req.query
    const user = req.user

    if(!tweetId) {
        throw new ApiError(400, "tweetId is required")
    }

    const like = await Like.find({tweet: tweetId, likedBy: user._id})
    
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
    const {tweetId} = req.query
    const user = req.user

    if(!tweetId) {
        throw new ApiError(400, "tweetId is required")
    }

    const like = await Like.find({tweet: tweetId, likedBy: user._id})
    
    if(!like) {
        throw new ApiError(404, "like does not exits")
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

export {
    getTweet,
    getAllTweets,
    createTweet,
    updateTweet,
    deleteTweet,
    likeTweet,
    unlikeTweet
}