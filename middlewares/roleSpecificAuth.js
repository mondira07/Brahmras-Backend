const jsonwebtoken = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/userModel");

const isNormal = (req, res, next) => {
  try {
    if (req.user && req.user.accountType === "Normal") {
      return next(); // Proceed to the next middleware
    }
    return res.status(403).json({
      success: false,
      message: "Access denied. This is a protected route for Normal users only.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role verification failed. Please try again.",
    });
  }
};

const isVendor = (req, res, next) => {
  try {
    console.log('req.user',req.user)
    if (req.user && req.user.accountType === "Vendor") {
      return next(); // Proceed to the next middleware
    }
    return res.status(403).json({
      success: false,
      message: "Access denied. This is a protected route for Vendors only.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role verification failed. Please try again.",
    });
  }
};

const isAdmin = (req, res, next) => {
  try {
    if (req.user && req.user.accountType === "Admin") {
      return next(); // Proceed to the next middleware
    }
    return res.status(403).json({
      success: false,
      message: "Access denied. This is a protected route for Admins only.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role verification failed. Please try again.",
    });
  }
};

module.exports = { isNormal, isVendor, isAdmin };
