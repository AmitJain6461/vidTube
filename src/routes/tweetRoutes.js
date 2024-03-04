import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweetController.js";

const router = Router();
router.use(verifyJWT);
router.route("/").get(getUserTweets);
router.route("/create-tweet").post(createTweet);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
