import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { loginUser, registerUser } from "../controllers/userController.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avator",
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
export default router;
