import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import {
  getUser,
  getUserChannelProfile,
  loginUser,
  logoutUser,
  refershAccessToken,
  registerUser,
  updateAvatar,
  updateCoverImage,
  updateDetails,
  updatePassword,
} from "../controllers/userController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refreshToken").post(refershAccessToken);
router.route("/change-password").post(verifyJWT, updatePassword);
router.route("/current-user").get(verifyJWT, getUser);
router.route("/update-account").patch(verifyJWT, updateDetails);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
router
  .route("/coverImage")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
export default router;
