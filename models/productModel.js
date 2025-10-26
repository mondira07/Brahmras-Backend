// models/productModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const updateInventory = require('../utils/UpdateInventory');

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  subcategory: {
    type: Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: true,
  },
  stock: {
    type: Number,
    default: 0,
  },
  images: [{
    type: String,
  }],
  rating: {
    type: Number,
    default: 0,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  priceAfterDiscount: {
    type: Number,
    required: true,
  },
  discountPercentage: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'removed'],
    default: 'pending',
  },
});


const Product = mongoose.model('Product', productSchema);
module.exports = Product;
