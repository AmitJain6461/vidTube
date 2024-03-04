import mongoose, { Schema } from "mongoose";

const subscriptionModel = new mongoose.Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscriber = mongoose.model("Subscriber", subscriptionModel);
