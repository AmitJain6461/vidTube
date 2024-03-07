import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { Video } from "../models/videoModel.js";
import { ApiResponses } from "../utils/ApiResponses.js";
import { User } from "./../models/userModel.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId || !isValidObjectId(userId))
    throw new ApiErrors(404, "Please login");
  const channelStats = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "totalVideos",
      },
    },
    {
      $unwind: "$totalVideos",
    },
    {
      $group: {
        _id: "$_id",
        totalVideos: {
          $sum: 1,
        },
        totalViews: {
          $sum: "$totalVideos.views",
        },
      },
    },
    {
      $lookup: {
        from: "subscribers",
        localField: "_id",
        foreignField: "channel",
        as: "userSubscribers",
      },
    },
    {
      $lookup: {
        from: "subscribers",
        localField: "_id",
        foreignField: "subscriber",
        as: "channelSubscription",
      },
    },
    {
      $project: {
        _id: 0,
        totalVideos: 1,
        totalViews: 1,
        totalSubscribers: {
          $size: "$userSubscribers",
        },
        totalSubscribed: {
          $size: "$channelSubscription",
        },
      },
    },
  ]);
  res
    .status(200)
    .json(new ApiResponses(200, channelStats, "Stats fetched successfully"));
});
const getChannelVideos = asyncHandler(async (req, res) => {
  const userID = req.user?._id;
  if (!userID || !isValidObjectId(userID))
    throw new ApiErrors(404, "Please login");

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userID),
      },
    },
    {
      $project: {
        _id: 0,
        thumbnail: 1,
        videoFile: 1,
        title: 1,
        description: 1,
      },
    },
  ]);

  if (!videos || !videos.length)
    throw new ApiErrors(404, "User have no videos");
  res
    .status(200)
    .json(new ApiResponses(200, videos, "Videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
