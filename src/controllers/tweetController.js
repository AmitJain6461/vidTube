import { Like } from "../models/likeModel.js";
import { Tweet } from "../models/tweetModel.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponses } from "../utils/ApiResponses";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
const isUserOwner = async (tweetId, req) => {
  const tweet = await Tweet.findById(tweetId);
  if (tweet?.owner != req.user?._id) return false;
  return true;
};
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) throw new ApiErrors(404, "Content is required");

  const userId = req.user?._id;
  if (!userId) throw new ApiErrors(404, "Session gone please login");

  const tweet = await Tweet.create({
    owner: userId,
    content: content,
  });

  if (!tweet) throw new ApiErrors(404, "Error while creating tweet");

  res
    .status(200)
    .json(new ApiResponses(200, tweet, "Tweet created successfully"));
});
const getUserTweets = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1, query, userId } = req.query;
  limit = parseInt(limit);
  page = parseInt(page);
  page = min(1, page);
  limit = max(20, min(10, limit));

  if (!userId && !mongoose.Types.ObjectId(userId))
    throw new ApiErrors(404, "Invalid userid");
  const pipeline = [];
  // match based on user
  pipeline.push({
    $match: {
      owner: new mongoose.Types.ObjectId(userId),
    },
  });

  //query based results
  pipeline.push({
    $match: {
      $text: {
        $search: query,
      },
    },
  });

  // pagination
  pipeline.push({
    $skip: (page - 1) * limit,
  });
  pipeline.push({
    $limit: limit,
  });
  pipeline.push({
    $project: {
      _id: 0,
      content: 1,
    },
  });
  const Tweets = Tweet.aggregate(pipeline);
  if (!Tweets) throw new ApiErrors(404, "Error while fetching tweets");

  res
    .status(200)
    .json(new ApiResponses(200, Tweets, "Tweets fetched successfully"));
});
const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  if (!tweetId) throw new ApiErrors(404, "Tweetid is required");
  const oldTweet = await Tweet.findById(tweetId);
  if (oldTweet) throw new ApiErrors(404, "Tweet does not exists");
  const isAuthorised = isUserOwner(tweetId, req);
  if (!isAuthorised) throw new ApiErrors(404, "Unauthorised access");

  if (!content) throw new ApiErrors(404, "Content is required");

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { $set: { content } },
    { new: true }
  );
  if (!updateTweet) throw new ApiErrors(404, "Error while updating content");

  res
    .status(200)
    .json(new ApiResponses(200, updatedTweet, "Tweet updated successfully"));
});
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) throw new ApiErrors(404, "Tweetid is required");

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new ApiErrors(404, "Tweet does not exists");

  const isAuthorised = isUserOwner(tweetId, req);
  if (!isAuthorised) throw new ApiErrors(404, "Unauthorised access");

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  await Like.deleteMany(tweetId);

  if (!deletedTweet) throw new ApiErrors(404, "Error while deleting the tweet");

  res.status(200).json(new ApiResponses(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
