const mongoose = require('mongoose');
const { Schema } = mongoose;


const shippingAddressSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  postalCode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

const ShippingAddress = mongoose.model('ShippingAddress', shippingAddressSchema);
module.exports = ShippingAddress;
