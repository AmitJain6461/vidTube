import { Subscriber } from "../models/subscriptionModel.js";
import { User } from "../models/userModel.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponses } from "../utils/ApiResponses.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongoose, isValidObjectId } from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiErrors(404, "Please login");

  const { channelId } = req.params;
  if (!channelId) throw new ApiErrors(404, "Channelid is required");
  if (channelId == userId) throw new ApiErrors(404, "Can't subscribe itself");
  const channel = await User.findById(channelId);
  if (!channel) {
    await Subscriber.deleteMany(channelId);
    throw new ApiErrors(404, "No channel exists");
  }

  const isExists = await Subscriber.findOne({
    channel: channelId,
    subscriber: userId,
  });
  console.log(isExists);
  if (isExists) {
    await Subscriber.deleteOne({
      channel: channelId,
      subscriber: userId,
    });
    res
      .status(200)
      .json(new ApiResponses(200, {}, "Unsubscribed successfully"));
  } else {
    const newSubscriber = await Subscriber.create({
      channel: channelId,
      subscriber: userId,
    });
    console.log(newSubscriber);
    if (!newSubscriber) throw new ApiErrors(404, "Error while subscribing");

    res
      .status(200)
      .json(new ApiResponses(200, newSubscriber, "Subscribed successfully"));
  }
});
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  if (!userId) throw new ApiErrors(404, "Please login");

  const pipeline = [];

  // 1. Match channel having userId as login person userId
  const matchChannel = {
    $match: {
      channel: userId,
    },
  };
  pipeline.push(matchChannel);

  // 2. Lookup for the subscriber

  const lookupSubscriber = {
    $lookup: {
      from: "users",
      localField: "subscriber",
      foreignField: "_id",
      as: "subscriberInfo",
    },
  };
  const unwindSubscriber = {
    $unwind: "$subscriberInfo",
  };
  pipeline.push(lookupSubscriber);
  pipeline.push(unwindSubscriber);

  // 3. Projection
  const project = {
    $project: {
      _id: 0,
      subscriber: {
        username: "$subscriberInfo.username",
        fullName: "$subscriberInfo.fullName",
        avatar: "$subscriberInfo.avatar",
      },
    },
  };
  pipeline.push(project);

  const subscribers = await Subscriber.aggregate(pipeline);
  subscribers.push({ countOfSubscribers: subscribers.length });
  if (!subscribers || !subscribers.length)
    res.status(200).json(new ApiResponses(200, {}, "No Subscribers"));

  res
    .status(200)
    .json(
      new ApiResponses(200, subscribers, "Subscribers fetched successfully")
    );
});
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  console.log(channelId);
  if (!channelId || !isValidObjectId(channelId))
    throw new ApiErrors(404, "Invalid channelid");
  const c = await Subscriber.find({ subscriber: channelId });
  console.log(c);
  const pipeline = [];
  // 1. Match with channelId
  const matchChannel = {
    $match: {
      subscriber: new mongoose.Types.ObjectId(channelId),
    },
  };
  pipeline.push(matchChannel);
  // 2. Lookup for the subscriber

  const lookupChannels = {
    $lookup: {
      from: "users",
      localField: "channel",
      foreignField: "_id",
      as: "channelInfo",
    },
  };
  const unwindChannel = {
    $unwind: "$channelInfo",
  };
  pipeline.push(lookupChannels);
  pipeline.push(unwindChannel);

  // 3. Projection
  const project = {
    $project: {
      _id: 0,
      channel: {
        username: "$channelInfo.username",
        fullName: "$channelInfo.fullName",
        avatar: "$channelInfo.avatar",
      },
    },
  };
  pipeline.push(project);

  const channels = await Subscriber.aggregate(pipeline);
  if (!channels || !channels.length)
    res.status(200).json(new ApiResponses(200, {}, "No channels subscribed"));
  res
    .status(200)
    .json(new ApiResponses(200, channels, "Channels fetched successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
