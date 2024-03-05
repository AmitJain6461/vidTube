import { Router } from "express";
import {
  addComment,
  deleteComment,
  getAllVideoComment,
  updateComment,
} from "../controllers/commentController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router = Router();
router.use(verifyJWT);
router.route("/add-comment/:videoId").post(addComment);
router.route("/update/:commentId").patch(updateComment);
router.route("/delete/:commentId").patch(deleteComment);
router.route("/:videoId").get(getAllVideoComment);

export default router;
