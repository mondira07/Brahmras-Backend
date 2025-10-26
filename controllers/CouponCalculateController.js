const Product = require('../models/productModel');
const Coupon = require('../models/couponModel');

const applyCouponToProduct = async (req, res) => {
  try {
    const { productId, couponCode } = req.body;

    if (!productId || !couponCode) {
      return res.status(400).json({ message: 'Product ID and coupon code are required.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found.' });
    }

    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({ message: 'Coupon has expired.' });
    }

    const discountAmount = (product.price * coupon.discountPercentage) / 100;
    const priceAfterCouponApplied = product.price - discountAmount;

    product.priceAfterCouponApplied = priceAfterCouponApplied;
    product.dicountAvailable = coupon._id;

    await product.save();

    res.status(200).json({
      message: 'Coupon applied successfully.',
      product: {
        ...product.toObject(),
        priceAfterCouponApplied,
      },
    });
  } catch (error) {
    console.error('Error applying coupon:', error.message);
    res.status(500).json({ message: 'Server error: Unable to apply coupon.' });
  }
};

module.exports = { applyCouponToProduct };
