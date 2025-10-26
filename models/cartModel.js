const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
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
      default: 1,
    },
  }],
  totalAmount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Pre-save middleware to calculate totalAmount
cartSchema.pre('save', async function(next) {
  try {
    const cart = this;

    // Fetch product details
    const products = await mongoose.model('Product').find({ _id: { $in: cart.items.map(item => item.product) } });

    // Calculate total amount
    cart.totalAmount = cart.items.reduce((total, item) => {
      const product = products.find(p => p._id.toString() === item.product.toString());
      return total + (item.quantity * (product ? product.price : 0));
    }, 0);

    next();
  } catch (error) {
    next(error);
  }
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
