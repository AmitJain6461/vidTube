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
    throw new ApiErrors(400, "All Fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiErrors(409, "User already exists");
  }
  const avatorLocation = req.files?.avatar[0].path;
  console.log(avatorLocation);
  if (!avatorLocation) {
    throw new ApiErrors(400, "Avator File is required");
  }
  let coverImagePath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagePath = req.files.coverImage[0].path;
  }

  console.log(coverImagePath);
  const avator = await uploadOnCloudinary(avatorLocation);
  const coverImage = await uploadOnCloudinary(coverImagePath);
  console.log(avator.url);
  console.log(coverImage);
  const user = await User.create({
    fullName,
    avatar: avator.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id);

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

  const isPasswordValid = await user.isPasswordCorrect(password);
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
  await User.findByIdAndUpdate(
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

const refershAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) throw new ApiErrors(401, "Unauthorized request");
    const decoded_token = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = jwt.findById(decoded_token._id);
    if (!user) throw new ApiErrors(401, "Invalid refresh token");

    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiErrors(401, "Refresh token is expired");

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
      user.username
    );
    return res
      .status(201)
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(new ApiResponses(200, "Refresh token successfully"));
  } catch (error) {
    throw new ApiErrors(401, error?.message || "Invalid token");
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = User.findById(req.user._id);
  const check = await user.isPasswordCorrect(oldPassword);
  if (!check) throw new ApiErrors(404, "Invalid Password");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponses(200, [], "Password Change Successfully"));
});
const getUser = asyncHandler(async (req, res) => {
  const user = req?.user;
  if (!user) throw new ApiErrors(404, "Please Login");
  res
    .status(200)
    .json(new ApiResponses(200, user, "Fetched User Successfully"));
});
const updateDetails = asyncHandler(async (req, res) => {
  const { firstName, email } = req.body;
  if (!firstName || !email) throw new ApiErrors(404, "Enter All Fields");

  const user = User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        firstName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponses(200, user, "Profile update successfully"));
});
const updateAvatar = asyncHandler(async (req, res) => {
  const localPath = req.file?.path;

  if (!localPath) throw new ApiErrors(404, "Please upload image");

  const avatar = await uploadOnCloudinary(localPath);
  if (!avatar) throw new ApiErrors(400, "Unable to upload File");

  const user = User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  res.status(200).json(200, user, "Avatar update successfully");
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const localPath = req.file?.path;
  if (!localPath) throw new ApiErrors(404, "Please upload Image");

  const coverImage = uploadOnCloudinary(localPath);

  if (!coverImage)
    throw new ApiErrors(404, "Error while uploading on cloudinary");

  const user = User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponses(200, user, "Image Updated Successfully"));
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refershAccessToken,
  updatePassword,
  updateDetails,
  getUser,
};
