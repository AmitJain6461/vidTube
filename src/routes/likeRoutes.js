import { Router } from "mongoose";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  getAllLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
} from "../controllers/likeController.js";

const router = Router();

router.use(verifyJWT);
router.route("/liked-videos").get(getAllLikedVideos);
router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);

export default router;
