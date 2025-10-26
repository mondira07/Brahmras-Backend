// routes/couponRoutes.js
const express = require('express');
const router = express.Router();
const Coupon = require('../models/couponModel');
const {isAdmin} = require('../middlewares/roleSpecificAuth'); // Assuming you have these middleware functions
const auth = require("../middlewares/auth")
// Route to create a new coupon
router.post('/create-coupon',auth, isAdmin, async (req, res) => {
  try {
    const {
      couponCode,
      couponDescription,
      startCouponDate,
      endCouponDate,
      discountPercentage,
      maxDiscountAmount,
      minPurchaseAmount,
      usageLimit
    } = req.body;

    // Validate required fields
    if (!couponCode || !couponDescription || !startCouponDate || !endCouponDate || !discountPercentage || !maxDiscountAmount || !minPurchaseAmount) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    // Create a new coupon
    const newCoupon = new Coupon({
      couponCode,
      couponDescription,
      startCouponDate,
      endCouponDate,
      discountPercentage,
      maxDiscountAmount,
      minPurchaseAmount,
      usageLimit
    });

    await newCoupon.save();
    res.status(201).json({ message: 'Coupon created successfully.', coupon: newCoupon });
  } catch (error) {
    console.error('Error creating coupon:', error.message);
    res.status(500).json({ message: 'Server error: Unable to create coupon.' });
  }
});
module.exports = router;
