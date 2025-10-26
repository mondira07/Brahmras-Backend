const jsonwebtoken = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/userModel");
const mongoose = require("mongoose");

const auth = async (req, res, next) => {
  try {
    console.log('Authentication middleware hit');
    
    let token = req.cookies.token;
    console.log('---> Token from cookies:', token);

    if (!token && req.header('Authorization')) {
      token = req.header('Authorization').replace('Bearer ', '');
      console.log('---> Token from Authorization header:', token);
    }

    if (!token) {
      return res.status(401).json({ error: "No token provided." });
    }

    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    if (!decoded.id) {
      console.log('Token payload:', decoded);
      return res.status(401).json({ error: "Invalid token structure. Missing user ID." });
    }

    console.log('User ID from token:', decoded.id);
    console.log('Is valid ObjectId:', mongoose.Types.ObjectId.isValid(decoded.id));

    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({ error: "Invalid user ID in token." });
    }

    const user = await User.findById(decoded.id);
    console.log('User found:', user);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    req.user = user;
    req.token = token;

    next();
  } catch (e) {
    console.error("Authentication error:", e.message);
    return res.status(401).json({ error: "Please authenticate." });
  }
};

module.exports = auth;