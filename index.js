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
  user: String,
});

const user = mongoose.model("user", userSchema);
const log = mongoose.model("log", logSchema);

const userCleanup = async () => {
  await user.deleteMany({});
};
const logCleanup = async () => {
  await log.deleteMany({});
};
// userCleanup();
// logCleanup();
app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async (req, res) => {
  try {
    let users = await user.find({});
    res.json(users);
  } catch (error) {
    res.json({ error: error });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    let id = req.params._id;
    console.log(req.query.from);
    let from = req.query.from
      ? new Date(req.query.from)
      : new Date("1970-01-01");
    let to = req.query.to ? new Date(req.query.to) : new Date();
    let limit = req.query.limit ? Number(req.query.limit) : 0;
    let searchedUser = await user.findOne({ _id: id });
    // console.log(searchedUser);
    let searchedLogs = await log
      .find({ user: searchedUser.username })
      .limit(limit)
      .select("-_id -__v -user");
    let count = searchedLogs.length;
    // console.log(searchedLogs);
    let fixedLogs = [];
    searchedLogs.forEach((log) => {
      // console.log(new Date(log.date));
      // console.log(from <= new Date(log.date) && to >= new Date(log.date));
      // console.log(from <= new Date(log.date) <= to);
      if (from <= new Date(log.date) && to >= new Date(log.date)) {
        fixedLogs.push(log);
      }
    });
    res.json({
      username: searchedUser.username,
      count: count,
      _id: searchedUser._id,
      log: fixedLogs,
    });
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
});

app.post("/api/users", textParser, async (req, res) => {
  // console.log(req.body.username);
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

app.post("/api/users/:_id/exercises", textParser, async (req, res) => {
  try {
    let exercise = req.body;
    let creator = await user.findOne({ _id: req.params._id });
    let date = new Date(exercise.date ? exercise.date : Date.now());

    // res.json({ body: exercise, creator: creator });
    let newLog = await log.create({
      description: exercise.description,
      duration: exercise.duration,
      date: date.toDateString(),
      user: creator.username,
    });
    res.json({
      username: creator.username,
      description: exercise.description,
      duration: Number(exercise.duration),
      date: date.toDateString(),
      _id: req.params._id,
    });
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
