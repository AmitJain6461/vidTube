import Router from "express";
import { healthCheck } from "../controllers/healthcheckControllers.js";

const router = Router();

router.route("/").get(healthCheck);
export default router;
