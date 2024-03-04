import { verifyJWT } from "../middlewares/authMiddleware.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishButton,
  updateVideo,
} from "../controllers/videoController.js";

const router = Router();
router.use(verifyJWT);
router.route("/").get(getAllVideos);
router.route("/uploadVideo").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/:videoId").patch(togglePublishButton);

export default router;
