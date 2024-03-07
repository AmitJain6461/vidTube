import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/userRoutes.js";
import videoRouter from "./routes/videoRoutes.js";
import tweetRouter from "./routes/tweetRoutes.js";
import likeRouter from "./routes/likeRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import subscriptionRouter from "./routes/subscriptionRoutes.js";
import playlistRouter from "./routes/playlistRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
const app = express();

// CORS is a security feature that prevents web pages from making requests to a different domain than the one that served the original page, unless explicitly allowed by the server.
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/dashboards", dashboardRouter);
export { app };
