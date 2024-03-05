import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/commentModel.js";
import { Video } from "../models/videoModel.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponses } from "../utils/ApiResponses.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addComment = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiErrors(404, "Please Login");

  const { videoId } = req.params;
  if (!videoId) throw new ApiErrors(404, "Videoid is required");
  const video = await Video.findById(videoId);
  if (!video || !video.isPublished)
    throw new ApiErrors(404, "No such video exists");
  const { content } = req.body;
  if (!content) throw new ApiErrors(404, "Content is required");

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: userId,
  });

  if (!comment) throw new ApiErrors(404, "Error while creating comment");

  res
    .status(200)
    .json(new ApiResponses(200, comment, "Comment added successfully"));
});
const updateComment = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiErrors(404, "Please login");

  const { commentId } = req.params;
  if (!commentId) throw new ApiErrors(404, "Commentid is required");

  const { content } = req.body;
  if (!content) throw new ApiErrors(404, "Content is required");

  const isExists = await Comment.findOne({
    owner: userId,
    _id: commentId,
  });

  if (!isExists) throw new ApiErrors(404, "Comment does not exists");
  const videoId = isExists?.video;
  const video = await Video.findById(videoId);
  if (!video) {
    await Comment.deleteMany({ video: videoId });
    throw new ApiErrors(404, "Comment does not exists");
  }
  if (!video.isPublished) throw new ApiErrors(404, "No video exists");

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );
  if (!updatedComment) throw new ApiErrors(404, "Error while updating comment");

  res
    .status(200)
    .json(
      new ApiResponses(200, updatedComment, "Comment updated successfully")
    );
});
const deleteComment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  if (!userId) throw new ApiErrors(404, "Please Login");

  const { commentId } = req.params;
  if (!commentId) throw new ApiErrors(404, "Commentid is required");
  const isExists = await Comment.findOne({
    _id: commentId,
    owner: userId,
  });
  if (!isExists) throw new ApiErrors(404, "Comment does not exists");
  const videoId = isExists.video;
  const video = await Video.findById(videoId);
  if (!video) {
    await Comment.deleteMany({ video: videoId });
    throw new ApiErrors(404, "Comment does not exists");
  }
  if (!video.isPublished) throw new ApiErrors(404, "No video exists");
  const deletedComment = await Comment.deleteOne({
    _id: commentId,
    owner: userId,
  });
  console.log(deletedComment);
  if (!deletedComment) throw new ApiErrors(404, "Error while deleting comment");

  res
    .status(200)
    .json(new ApiResponses(200, {}, "Comment deleted successfully"));
});
const getAllVideoComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId) || !videoId.isPublished)
    throw new ApiErrors(404, "Invalid videoid");
  const video = await Video.findById(videoId);
  if (!video) {
    await Comment.deleteMany({ video: videoId });
    throw new ApiErrors(404, "No video exists");
  }
  const userId = req.user?._id;
  if (!userId) throw new ApiErrors(404, "Please login");

  const pipeline = [];

  // 1. first match all comments based on userid and videoid
  const firstMatch = {
    $match: {
      owner: userId,
      video: new mongoose.Types.ObjectId(videoId),
    },
  };
  pipeline.push(firstMatch);

  // 2. Find some owner info
  const ownerInfo = {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "ownedBy",
    },
  };
  pipeline.push(ownerInfo);

  //3. unwind the previous result
  const unwindOwner = {
    $unwind: "$ownedBy",
  };
  pipeline.push(unwindOwner);

  // 4. now find video details
  const videoInfo = {
    $lookup: {
      from: "videos",
      localField: "video",
      foreignField: "_id",
      as: "videoInfo",
    },
  };
  pipeline.push(videoInfo);

  // 5. now unwind results
  const unwindVideo = {
    $unwind: "$videoInfo",
  };
  pipeline.push(unwindVideo);

  // 6. Project important fields only
  const project = {
    $project: {
      content: 1,
      _id: 0,
      owner: {
        username: "$ownedBy.username",
        fullName: "$ownedBy.fullName",
        avatar: "$ownedBy.avatar",
      },
      videoInfo: {
        owner: "$videoInfo.owner",
        title: "$videoInfo.title",
        videoFile: "$videoInfo.videoFile",
      },
    },
  };
  pipeline.push(project);

  // 7. group by
  const groups = {
    $group: {
      _id: "$owner",
      comments: { $addToSet: "$content" },
      videoInfo: { $addToSet: "$videoInfo" },
    },
  };
  pipeline.push(groups);

  // 8. renaming
  const projection = {
    $project: {
      _id: 0,
      owner: "$_id",
      videoInfo: 1,
      comments: 1,
    },
  };
  pipeline.push(projection);

  //9. unwind video

  const unwindVideoInfo = {
    $unwind: "$videoInfo",
  };
  pipeline.push(unwindVideoInfo);
  const comments = await Comment.aggregate(pipeline);

  if (!comments) throw new ApiErrors(404, "No comments exists");
  res
    .status(200)
    .json(new ApiResponses(200, comments, "Comment fetched successfully"));
});

export { addComment, updateComment, deleteComment, getAllVideoComment };
