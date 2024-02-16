import dotenv from "dotenv";
import connection from "./db/connection.js";
dotenv.config({ path: "./.env" });
import { app } from "./app.js";

try {
  connection().then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT} `);
    });
  });
} catch (error) {
  console.log("Error occured in index.js ", error);
}
