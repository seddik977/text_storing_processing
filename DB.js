require("dotenv/config");
const mongoose = require("mongoose");

mongoose.connect(
  process.env.DB_URL,

  (err) => {
    if (err) throw err;
    console.log("Connected to DB");
  }
);
