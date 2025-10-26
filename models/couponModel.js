const mongoose = require('mongoose');
const { Schema } = mongoose;

// Coupon Schema
const couponSchema = new Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  couponDescription: {
    type: String,
    required: true,
    trim: true,
  },
  startCouponDate: {
    type: Date,
    required: true,
  },
  endCouponDate: {
    type: Date,
    required: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  maxDiscountAmount: {
    type: Number,
    required: true,
  },
  minPurchaseAmount: {
    type: Number,
    required: true,
  },
  usageLimit: {
    type: Number,
    default: 1,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
