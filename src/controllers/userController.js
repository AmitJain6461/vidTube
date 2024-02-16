import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponses } from "../utils/ApiResponses.js";
import { app } from "../app.js";

const generateAccessAndRefreshToken = async (username) => {
  const user = await User.findOne(username);
  if (!user) return null;

  const refreshToken = user.generateRefreshToken();
  const accessToken = user.generateAccessToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { refreshToken, accessToken };
};
const registerUser = asyncHandler(async (req, res) => {
  // get user details from the frontend
  // validation
  // check if user already exists
  // check for image,avatar
  // upload them on cloudinary
  // create user object - create entry in db
  // remove passwrod and refresh token fiel dfrom response
  // check if user is created
  // return res
  console.log(req.body);
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    return new ApiErrors(400, "All Fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  console.log(existedUser);
  if (existedUser) {
    return new ApiErrors(409, "User already exists");
  }

  const avatorLocation = req.files?.avator[0].path;
  console.log(avatorLocation);
  if (!avatorLocation) {
    return new ApiErrors(400, "Avator File is required");
  }
  console.log(avatorLocation);
  let coverImagePath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagePath = req.files.coverImage[0].path;
  }
  const avator = await uploadOnCloudinary(avatorLocation);
  const coverImage = await uploadOnCloudinary(coverImagePath);
  const user = await User.create({
    fullName,
    avator: avator.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = User.findByIf(user._id).select(
    "-password - refreshToken"
  );

  if (!createdUser) {
    throw new ApiErrors(500, "Something went wrong");
  }

  return res
    .status(201)
    .json(new ApiResponses(200, createdUser, "User Registered Succesfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body ->data
  // usernameor email
  //find the user
  // password check
  //access or refresh token
  //send cookie

  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new ApiErrors(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiErrors(401, "Invalid user credentials");
  }

  const isPasswordValid = await user.isPasswordValid(password);
  if (!isPasswordValid) {
    throw new error(400, "Invalid user credentials");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    username
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponses(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User loggedIn successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await user.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponses(200, {}, "User logged out successfully"));
});
export { registerUser, loginUser, logoutUser };
