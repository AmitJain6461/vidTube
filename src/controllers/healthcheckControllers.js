import { ApiResponses } from "../utils/ApiResponses.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthCheck = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponses(200, {}, "Server is healthy"));
});
export { healthCheck };
