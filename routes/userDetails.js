const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const auth = require("../middlewares/auth");

router.get("/user", auth, async (req, res) => {
  try {
    // Ensure req.user is set by the auth middleware
    if (!req.user || !req.user._id) {
      console.log("Unauthorized access: req.user or req.user._id is missing");
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const userId = req.user._id;
    console.log("Fetching details for userId:", userId);

    // Fetch user details using the userId from req.user
    const user = await User.findById(userId).select('-password'); // Exclude sensitive fields like password

    // Check if user exists
    if (!user) {
      console.log("User not found for userId:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Send user details in response
    res.json(user);
  } catch (error) {
    console.error("Error fetching user details:", error); // Log the error for debugging
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
