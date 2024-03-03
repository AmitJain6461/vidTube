import { Mongoose, isValidObjectId } from "mongoose";
import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "./../models/videoModel.js";
import { ApiResponses } from "../utils/ApiResponses.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const isUserOwner = async (videoId, req) => {
  const video = await Video.findById(videoId);

  if (video?.owner.toString() !== req.user?._id.toString()) return false;
  return true;
};

const getAllVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

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
      owner: Mongoose.Types.ObjectId(userId),
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

  const videos = Video.aggregate(pipeline);
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

  const videoURL = await uploadOnCloudinary(localVideo)?.url;
  const thumbnailURL = await uploadOnCloudinary(localThumbnail)?.url;

  if (!(videoURL && thumbnailURL))
    throw new ApiErrors(404, "Error while uploading files on cloudinary");

  const video = await Video.create({
    title,
    description,
    videoFile: videoURL,
    duration: videoURL.duration,
    thumbnail: thumbnailURL,
    isPublished,
    owner: userId,
  });

  res
    .status(200)
    .json(new ApiResponses(200, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const videoId = req.params;
  if (!videoId) throw new ApiErrors(404, "Invalid videoid");
  const video = await Video.findById(videoId);
  if (!video) throw new ApiErrors(404, "Video does not exists");
  const isauthorized = isUserOwner(videoId, req);
  if (!isauthorized) throw new ApiErrors(404, "Unauthorized access");
  res
    .status(200)
    .json(new ApiResponses(200, video, "Video fetched successfully"));
});
export { getAllVideos, publishAVideo, getVideoById };
