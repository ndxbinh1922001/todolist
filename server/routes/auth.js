require("dotenv").config();
const express = require("express");
const router = express.Router();
const argon2 = require("argon2"); // thu vien de hash password
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const verifyToken = require("../middleware/auth");

// @route GET api/auth
// @desc check if user is logged in
// @access Public
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    return res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
// @route POST api/auth/register
// @desc Register user
// @access Public
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  //simple validation
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Missing username and/or password",
    });
  }
  try {
    const user = await User.findOne({ username });
    if (user)
      return res.status(400).json({
        success: false,
        message: "Username already taken",
      });
    const hashedPassword = await argon2.hash(password);
    const newUser = new User({
      username,
      password: hashedPassword,
    });
    await newUser.save();
    // return token
    const accessToken = jwt.sign(
      { userId: newUser._id },
      process.env.ACCESS_TOKEN_SECRET
    );
    res.json({
      success: true,
      message: "User created successfully",
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @route POST api/auth/login
// @desc Login user
// @access Public
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  //simple validation
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Missing username and/or password",
    });
  }
  try {
    //check for existing user
    const user = await User.findOne({ username });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Incorrect username or password" });
    const passwordValid = await argon2.verify(user.password, password);
    if (!passwordValid)
      return res
        .status(400)
        .json({ success: false, message: "Incorrect username or password" });

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET
    );
    res.json({
      success: true,
      message: "User logged in successfully",
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
module.exports = router;
