import { isValidObjectId } from "mongoose";
import { Comment } from "../models/commentModel";
import { Like } from "../models/likeModel.js";
import { Tweet } from "../models/tweetModel.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponses } from "../utils/ApiResponses";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "./../models/videoModel.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiErrors(404, "Videoid is required");

  const video = await Video.findById(videoId);
  if (!video || !video.isPublished)
    throw new ApiErrors(404, "Video does not exists");
  if (video?.owner != req.user?._id)
    throw new ApiErrors(404, "Unauthorised access");
  const isExist = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (isExist) {
    await Like.deleteOne({ video: videoId, likedBy: req.user?._id });
    res.status(200).json(new ApiResponses(200, {}, "Toggled successfully"));
  } else {
    const newLike = await Like.create({
      video: videoId,
      likedBy: res.user?._id,
    });

    if (!newLike) throw new ApiErrors(404, "Error while liking the video");
    res
      .status(200)
      .json(new ApiResponses(200, newLike, "Toggled successfully"));
  }
});
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) throw new ApiErrors(404, "Videoid is required");
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiErrors(404, "Comment does not exists");
  if (comment?.owner != req.user?._id)
    throw new ApiErrors(404, "Unauthorised access");
  const isExist = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (isExist) {
    await Like.deleteOne({ comment: commentId, likedBy: req.user?._id });
    res.status(200).json(new ApiResponses(200, {}, "Toggled successfully"));
  } else {
    const newLike = await Like.create({
      comment: commentId,
      likedBy: res.user?._id,
    });

    if (!newLike) throw new ApiErrors(404, "Error while liking the comment");
    res
      .status(200)
      .json(new ApiResponses(200, newLike, "Toggled successfully"));
  }
});
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) throw new ApiErrors(404, "Videoid is required");

  const tweet = await Tweet.findById(videoId);
  if (!tweet) throw new ApiErrors(404, "Tweet does not exists");
  if (tweet?.owner != req.user?._id)
    throw new ApiErrors(404, "Unauthorised access");
  const isExist = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (isExist) {
    await Like.deleteOne({ tweet: tweetId, likedBy: req.user?._id });
    res.status(200).json(new ApiResponses(200, {}, "Toggled successfully"));
  } else {
    const newLike = await Like.create({
      tweet: tweetId,
      likedBy: res.user?._id,
    });

    if (!newLike) throw new ApiErrors(404, "Error while liking the video");
    res
      .status(200)
      .json(new ApiResponses(200, newLike, "Toggled successfully"));
  }
});
const getAllLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId || !isValidObjectId(userId))
    throw new ApiErrors(404, "Invalid userid");
  const pipeline = [];
  // 1. First Match Likes of UserId but this contains tweets,comment and video as well
  const match = {
    $match: {
      likedBy: userId,
    },
  };
  pipeline.push(match);
  // 2. Now extract videos by taking left join with video schema
  const extractLikedVideos = {
    $lookup: {
      from: "videos",
      localField: "video",
      foreignField: "_id",
      as: "likedVideos",
    },
  };
  pipeline.push(extractLikedVideos);
  // 3. Now unwind these for flatteening array
  const unwindPrev = {
    $unwind: "$likedVideos",
  };
  pipeline.push(unwindPrev);
  // 4. Match for those videos which are published
  const matchPublishedVideos = {
    $match: {
      "likedVideos.isPublished": true,
    },
  };
  pipeline.push(matchPublishedVideos);
  // 5. owner info who liked videos
  const ownerInfo = {
    $lookup: {
      from: "users",
      let: { ownerId: "likedVideos.owner" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ["$id", "$$owner_id"] },
          },
        },
        {
          $project: {
            _id: 0,
            username: 1,
            avatar: 1,
            fullName: 1,
          },
        },
      ],
      as: "owner",
    },
  };
  pipeline.push(ownerInfo);
  // 6. unwind
  const unwindOwner = {
    $unwind: { path: "$owner", preserveNullAndEmptyArrays: true },
  };
  pipeline.push(unwindOwner);
  //7. project necessary information
  const necessaryInfo = {
    $project: {
      _id: "$likedVideos._id",
      title: "$likedVideos.title",
      description: "$likedVideos.description",
      thumbnail: "$likedVideos.thumbnail",
      owner: {
        username: "$likedVideos.owner.username",
        fullName: "$likedVideos.owner.fullName",
        avatar: "$likedVideos.owner.avatar",
      },
    },
  };
  pipeline.push(necessaryInfo);

  const likes = await Like.aggregate(pipeline);
  if (!likes) throw new ApiErrors(404, "Error while fetching all liked videos");

  res
    .status(200)
    .json(new ApiResponses(200, likes, "All Likes Fetched Successfully"));
});

export {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getAllLikedVideos,
};
