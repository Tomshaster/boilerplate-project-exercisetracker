const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const textParser = bodyParser.urlencoded({ extended: true });
require("dotenv").config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
});

const logSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: String,
});

const user = mongoose.model("user", userSchema);

const userCleanup = async () => {
  await user.deleteMany({});
};
userCleanup();
app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", textParser, async (req, res) => {
  console.log(req.body.username);
  try {
    const newUser = await user.create({ username: req.body.username });
    res.json(newUser);
  } catch (error) {
    if (req.body.username) {
      const oldUser = await user.find({ username: req.body.username });
      res.json(oldUser);
    } else {
      res.json({ error: "invalid user" });
    }
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
