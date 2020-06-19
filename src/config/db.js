import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// mongoose.set("debug", true); // To Log DB actions on the console
mongoose.Promise = global.Promise; // To Use Promises With Mongoose

try {
  // Connect to DB
  mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }); // { useNewUrlParser: true, useUnifiedTopology: true }: To remove depreciation Warnings
} catch (err) {
  throw err;
}

// Message if Successfully Connected to DB
mongoose.connection.on("connected", () => {
  //console.log(`Connected to database ${process.env.DB_URL}`);
  console.log(`🚀 . . Connected to: ${mongoose.connection.host}`.blue.bold);
});

// Message if There is an error in database Connection
mongoose.connection.on("error", (err) => {
  throw err;
});

// To Remove moongoose depreciation warnings
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
