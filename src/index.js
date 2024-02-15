import dotenv from "dotenv";
import express from "express";
import connection from "./db/connection.js";
dotenv.config({ path: "./.env" });

const app = express();

try {
  connection().then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT} `);
    });
  });
} catch (error) {
  console.log("Error occured in index.js ", error);
}
