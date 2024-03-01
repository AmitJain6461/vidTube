import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/userRoutes.js";
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
export { app };
