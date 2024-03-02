import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: "dnafby2hx",
  api_key: "384111126596881",
  api_secret: "6nH8wnKXNO1SGodr1PVSJR_VUh0",
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);
    return res;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFileFromCloudinary = async (imagePath) => {
  if (!localFilePath) return null;
  await cloudinary.uploader.destroy(imagePath);
};

export { uploadOnCloudinary, deleteFileFromCloudinary };
