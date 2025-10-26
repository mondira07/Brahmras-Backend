const mongoose = require('mongoose');
const { Schema } = mongoose;
const ordersSchema = new Schema({
  user:{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  orderDate: {
    type: Date,
    required: true,
  },
  deliveryAddress: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    required: true,
  },
  items: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discountApplied: {
      type: Number,
      default: 0,
    },
  }],
  payments: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
  },
  couponCode: {  // New field for coupon code
    type: String,
    trim: true,
  },
  discountAmount: {  // New field for total discount amount
    type: Number,
    default: 0,
  },
});


const Orders = mongoose.model('Orders', ordersSchema);

module.exports = Orders;
