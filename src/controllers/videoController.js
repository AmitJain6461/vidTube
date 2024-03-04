import { Mongoose, isValidObjectId } from "mongoose";
import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "./../models/videoModel.js";
import { ApiResponses } from "../utils/ApiResponses.js";
import {
  deleteFileFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Comment } from "../models/commentModel.js";
import { Like } from "../models/likeModel.js";
import { Playlist } from "../models/playlistModel.js";

const isUserOwner = async (videoId, req) => {
  const video = await Video.findById(videoId);

  if (video?.owner.toString() !== req.user?._id.toString()) return false;
  return true;
};

const getAllVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, query, sortBy, sortType } = req.query;
  const userId = req.user?._id;
  //   first match with userID then search result based on query then sort results and then perform pagination
  page = parseInt(page);
  limit = parseInt(limit);

  page = Math.max(1, page);
  limit = Math.min(20, Math.max(1, limit));

  const pipeline = [];
  if (!userId || !isValidObjectId(userId))
    throw new ApiErrors(404, "Invalid user");
  const resultMatch = {
    $match: {
      owner: userId,
    },
  };
  pipeline.push(resultMatch);

  if (query) {
    pipeline.push({
      $match: {
        $text: {
          $search: query,
        },
      },
    });
  }
  if (sortBy && sortType) {
    if (sortType == "asc") sortType = 1;
    else sortType = -1;

    pipeline.push({
      $sort: {
        sortBy: sortType,
      },
    });
  } else {
    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });
  }

  const skip = {
    $skip: (page - 1) * limit,
  };
  const lim = {
    $limit: limit,
  };

  pipeline.push(skip);
  pipeline.push(lim);

  const videos = await Video.aggregate(pipeline);
  if (!videos | (videos.length == 0))
    throw new ApiErrors(404, "No videos found");

  res
    .status(200)
    .json(new ApiResponses(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiErrors(404, "Please Login");

  const { title, description, isPublished = true } = req.body;
  if (!(title && description))
    throw new ApiErrors(404, "Title and description is mandatory");

  const localVideo = req.files?.videoFile[0].path;
  const localThumbnail = req.files?.thumbnail[0].path;

  if (!(localVideo && localThumbnail))
    throw new ApiErrors(404, "Video and thumbnail is required");

  const videoFile = await uploadOnCloudinary(localVideo);
  const thumbnail = await uploadOnCloudinary(localThumbnail);

  if (!(videoFile && thumbnail))
    throw new ApiErrors(404, "Error while uploading files on cloudinary");

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile?.url,
    duration: videoFile.duration,
    thumbnail: thumbnail?.url,
    isPublished,
    owner: userId,
  });

  res
    .status(200)
    .json(new ApiResponses(200, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log(videoId);
  if (!isValidObjectId(videoId)) throw new ApiErrors(404, "Id is invalid");
  const isauthorized = isUserOwner(videoId, req);
  if (!isauthorized) throw new ApiErrors(404, "Unauthorized access");
  if (!videoId) throw new ApiErrors(404, "Invalid videoid");
  const video = await Video.findById(videoId);
  if (!video) throw new ApiErrors(404, "Video does not exists");

  res
    .status(200)
    .json(new ApiResponses(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const localPathThumbnail = req.file?.path;
  const { videoId } = req.params;
  if (!videoId) throw new ApiErrors(404, "Videoid is required");
  const isauthorized = isUserOwner(videoId, req);
  if (!isauthorized) throw new ApiErrors(404, "Unauthorised access");

  if (!(title && description && localPathThumbnail))
    throw new ApiErrors(404, "Title, description and thumbnail is required");

  const thumbnail = await uploadOnCloudinary(localPathThumbnail);
  if (!thumbnail?.url)
    throw new ApiErrors(404, "Error while uploading on cloudinary");

  const prevVideo = await Video.findById(videoId);
  const prevVideoPath = prevVideo.thumbnail
    ?.split("/")
    .slice(-1)[0]
    .split(".")[0];
  await deleteFileFromCloudinary(prevVideoPath);
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url,
      },
    },
    {
      new: true,
    }
  );

  if (!video) throw new ApiErrors(404, "Error while updadating the video");

  res
    .status(200)
    .json(new ApiResponses(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiErrors(404, "Videoid is required");

  const isauthorized = isUserOwner(videoId, req);
  if (!isauthorized) throw new ApiErrors(404, "Unauthorised access");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiErrors(404, "No video exists");
  const prevVideoPath = video.videoFile?.split("/").slice(-1)[0].split(".")[0];
  const prevThumbnailPath = video.thumbnail
    ?.split("/")
    .slice(-1)[0]
    .split(".")[0];
  const deletedVideo = await Video.findByIdAndDelete(videoId);
  await Comment.deleteMany({ video: videoId });
  await Like.deleteMany({ video: videoId });

  const playlists = Playlist.find({ video: videoId });

  if (playlists.length) {
    for (const playlist of playlists) {
      await Playlist.findByIdAndUpdate(
        playlist._id,
        { $pull: { video: videoId } },
        { new: true }
      );
    }
  }

  if (!deleteVideo) throw new ApiErrors(404, "Error while deleting video");
  await deleteFileFromCloudinary(prevVideoPath);
  await deleteFileFromCloudinary(prevThumbnailPath);

  res.status(200).json(new ApiResponses(200, {}, "Video deleted successfully"));
});

const togglePublishButton = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiErrors(404, "Videoid is required");
  const isauthorized = isUserOwner(videoId, req);

  if (!isauthorized) throw new ApiErrors(404, "Unauthorised access");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiErrors(404, "Video does not exists");
  const togglePublished = !video?.isPublished;

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: togglePublished,
      },
    },
    { new: true }
  );

  if (!updateVideo)
    throw new ApiErrors(404, "Error while toggling isPublished Button");

  res
    .status(200)
    .json(new ApiResponses(200, updatedVideo, "Toggled Successfully"));
});
export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishButton,
};
