import Router from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscriptionController.js";
const router = Router();

router.use(verifyJWT);
router
  .route("/c/:channelId")
  .post(toggleSubscription)
  .get(getSubscribedChannels);
router.route("/c").get(getUserChannelSubscribers);

export default router;
