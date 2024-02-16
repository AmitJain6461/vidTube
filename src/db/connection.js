import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connection = async () => {
  try {
    const connectOutput = await mongoose.connect(
      `${process.env.MONGO_URL}/${DB_NAME}`
    );

    console.log(
      `\n MongoDB Connected !! DBHost : ${connectOutput.connection.host}`
    );
  } catch (error) {
    console.error("Error occured in File", error);
    process.exit(1);
  }
};

export default connection;
