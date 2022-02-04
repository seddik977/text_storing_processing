const express = require("express");
const cors = require("cors");
require("dotenv/config");
require("./DB");



const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;


app.get("/", (req, res) => res.json({ message: "Welcome to the App!" }));
const textRouter = require("./routes/Texts");
app.use("/text", textRouter);


app.listen(PORT, (err) => {
  if (err) console.error(err);
  console.log(`Server is running on port ${PORT}`);
});
