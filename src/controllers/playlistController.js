import mongoose from "mongoose";
import { Playlist } from "../models/playlistModel.js";
import { Video } from "../models/videoModel.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponses } from "../utils/ApiResponses.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiErrors(404, "Please login");

  const { listName, description } = req.body;
  if (!(listName && description))
    throw new ApiErrors(404, "Listname and description is required");

  const playlist = await Playlist.create({
    listName,
    description,
    owner: userId,
  });
  if (!playlist) throw new ApiErrors(404, "Error while creating playlist");
  res
    .status(200)
    .json(new ApiResponses(200, playlist, "Playlist created successfully"));
});
const getUserPlaylist = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) throw new ApiErrors(404, "Userid is required");

  if (userId.toString() !== req.user?._id.toString())
    throw new ApiErrors(404, "Can not access");

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 0,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $lookup: {
        from: "videos",
        let: { pid: "$videos" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$pid"] } } },
          {
            $match: {
              isPublished: true,
            },
          },
          {
            $project: {
              _id: 0,
              thumbnail: 1,
              videoFile: 1,
              titile: 1,
              description: 1,
            },
          },
        ],
        as: "videos",
      },
    },
    {
      $project: {
        _id: 0,
        videos: 1,
        owner: 1,
      },
    },
  ]);
  if (!playlists || !playlists.length)
    throw new ApiErrors(404, "User have no playlist");
  res
    .status(200)
    .json(new ApiResponses(200, playlists, "Playlists fetched successfully"));
});
const getUserPlaylistById = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiErrors(404, "Please login");

  const { playlistId } = req.params;
  if (!playlistId) throw new ApiErrors(404, "Playlistid is required");

  const playlists = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 0,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $lookup: {
        from: "videos",
        let: { pid: "$videos" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$pid"] } } },
          {
            $match: {
              isPublished: true,
            },
          },
          {
            $project: {
              _id: 0,
              thumbnail: 1,
              videoFile: 1,
              titile: 1,
              description: 1,
            },
          },
        ],
        as: "videos",
      },
    },
    {
      $project: {
        _id: 0,
        videos: 1,
        owner: 1,
      },
    },
  ]);
  if (!playlists || !playlists.length)
    throw new ApiErrors(404, "No playlist exists");
  res
    .status(200)
    .json(new ApiResponses(200, playlists, "Playlist fetched successfully"));
});
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiErrors(404, "Please Login");

  const { videoId, playlistId } = req.params;
  if (!videoId) throw new ApiErrors(404, "Videoid is required");
  const video = await Video.findById(videoId);
  if (!video || !video.isPublished)
    throw new ApiErrors(404, "No such video exists");
  if (!playlistId) throw new ApiErrors(404, "Playlistid is required");
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiErrors(404, "No such playlist exists");
  if (userId.toString() !== playlist.owner.toString())
    throw new ApiErrors(404, "Unauthorised access");
  if (playlist.videos.includes(videoId))
    return res
      .status(200)
      .json(new ApiResponses(200, {}, "Video already exists in playlist"));
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: { videos: videoId },
    },
    {
      new: true,
    }
  );
  if (!updatePlaylist)
    throw new ApiErrors(404, "Unable to add video to playlist");
  res
    .status(200)
    .json(new ApiResponses(200, updatedPlaylist, "Video added successfully"));
});
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiErrors(404, "Please Login");

  const { videoId, playlistId } = req.params;
  if (!videoId) throw new ApiErrors(404, "Videoid is required");
  const video = await Video.findById(videoId);
  if (!video || !video.isPublished)
    throw new ApiErrors(404, "No such video exists");
  if (!playlistId) throw new ApiErrors(404, "Playlistid is required");
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiErrors(404, "No such playlist exists");
  if (userId.toString() !== playlist.owner.toString())
    throw new ApiErrors(404, "Unauthorised access");
  if (!playlist.videos.includes(videoId))
    return res
      .status(200)
      .json(new ApiResponses(200, {}, "Video does not exists in playlist"));
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    {
      new: true,
    }
  );
  if (!updatePlaylist)
    throw new ApiErrors(404, "Unable to remove video to playlist");
  res
    .status(200)
    .json(new ApiResponses(200, updatedPlaylist, "Video removed successfully"));
});
const deletePlaylist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiErrors(404, "Please Login");

  const { playlistId } = req.params;
  if (!playlistId) throw new ApiErrors(404, "Playlistid is required");
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiErrors(404, "No such playlist exists");
  if (userId.toString() !== playlist.owner.toString())
    throw new ApiErrors(404, "Unauthorised access");

  await Playlist.deleteOne({ _id: playlistId });
  res
    .status(200)
    .json(new ApiResponses(200, {}, "Playlist deleted successfully"));
});
const updatePlaylist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiErrors(404, "Please Login");
  const { playlistId } = req.params;
  if (!playlistId) throw new ApiErrors(404, "Playlistid is required");
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiErrors(404, "No such playlist exists");

  if (playlist.owner.toString() !== userId.toString())
    throw new ApiErrors(404, "Unauthorised access");
  const { listName, description } = req.body;
  if (!listName && !description)
    throw new ApiErrors(404, "ListName or description is required");
  let updatedPlaylist;
  if (listName && description) {
    updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $set: {
          listName,
          description,
        },
      },
      { new: true }
    );
    if (!updatedPlaylist)
      throw new ApiResponses(404, "Unable to update playlist");
  } else if (listName) {
    updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $set: {
          listName,
        },
      },
      { new: true }
    );
    if (!updatedPlaylist)
      throw new ApiResponses(404, "Unable to update playlist");
  } else {
    updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $set: {
          description,
        },
      },
      { new: true }
    );
    if (!updatedPlaylist)
      throw new ApiResponses(404, "Unable to update playlist");
  }

  res
    .status(200)
    .json(
      new ApiResponses(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylist,
  getUserPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
