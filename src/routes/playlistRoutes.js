import Router from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getUserPlaylist,
  getUserPlaylistById,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlistController.js";
const router = Router();

router.use(verifyJWT);

router.route("/").post(createPlaylist);
router
  .route("/:playlistId")
  .patch(updatePlaylist)
  .get(getUserPlaylistById)
  .delete(deletePlaylist);
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
router.route("/user/:userId").get(getUserPlaylist);
export default router;
