const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wishlistSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
  }],
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;
