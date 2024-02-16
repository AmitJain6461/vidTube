import { User } from "../models/userModel.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler((req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");
    if (!token) throw new ApiErrors(401, "Unauthorized Request");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) throw new error(401, "Invalid Token");

    req.user = user;
    next();
  } catch (error) {
    throw new ApiErrors(401, error?.message || "Invalid access Token");
  }
});
