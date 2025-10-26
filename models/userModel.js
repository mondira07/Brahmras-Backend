const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  accountType: { type: String, enum: ['Admin','Vendor', 'User'], default: 'User' },
  token: { type: String },
  registrationDate: { type: Date, default: Date.now },
  addresses: [{
    city: { type: String, },
    state: { type: String,},
    homeNumber: { type: String,},
    pincode: { type: String,},
    landmark: { type: String },
  }],
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Orders' }],
  cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
  wishlist: { type: mongoose.Schema.Types.ObjectId, ref: 'Wishlist' },
});

module.exports = mongoose.model('User', UserSchema);
