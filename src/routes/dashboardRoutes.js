import Router from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  getChannelStats,
  getChannelVideos,
} from "../controllers/dashboardController.js";
const router = Router();

router.use(verifyJWT);

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router;
