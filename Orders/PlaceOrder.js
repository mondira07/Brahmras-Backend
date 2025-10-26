const express = require('express');
const router = express.Router();
const Orders = require('../models/ordersModel');
const Products = require('../models/productModel');
const User = require('../models/userModel');
const Inventory = require('../models/inventoryModel');
const SubCategory = require('../models/subCategoryModel');
const Coupon = require('../models/couponModel'); // Add your coupon model
const Payment = require('../models/paymentModel'); // Add your payment model
const auth = require('../middlewares/auth');
const crypto = require('crypto');
const updateInventory = require('../utils/updateInventory');
const checkLowStock = require('../utils/checkLowStock');

function generateOrderId() {
  const timestamp = Date.now().toString();
  const randomString = crypto.randomBytes(4).toString('hex');
  return `ORD-${timestamp}-${randomString}`;
}

// Helper function to apply coupon discount
async function applyCoupon(couponCode, totalAmount) {
  const coupon = await Coupon.findOne({ couponCode });

  if (!coupon || !coupon.isActive) {
    throw new Error('Invalid or inactive coupon');
  }

  const currentDate = new Date();
  if (currentDate < coupon.startCouponDate || currentDate > coupon.endCouponDate) {
    throw new Error('Coupon is not valid for the current date');
  }

  if (totalAmount < coupon.minPurchaseAmount) {
    throw new Error('Purchase amount does not meet the minimum requirement for the coupon');
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw new Error('Coupon usage limit exceeded');
  }

  const discount = Math.min(
    (totalAmount * coupon.discountPercentage) / 100,
    coupon.maxDiscountAmount
  );

  coupon.usedCount += 1;
  await coupon.save();

  return discount;
}

router.post('/place-order/:productId', auth, async (req, res) => {
  try {
    const userId = req.user._id; // Accessing user ID from auth middleware
    const { quantity, paymentMethod, amount: paymentAmount, couponCode } = req.body;
    const { productId } = req.params;

    // Convert paymentAmount to number
    const paymentAmountNumber = parseFloat(paymentAmount);

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch the product
    const product = await Products.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check product stock
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Calculate total amount
    const price = product.price;
    const discountApplied = product.priceAfterDiscount ? price - product.priceAfterDiscount : 0;
    const subtotal = product.priceAfterDiscount * quantity;

    // Apply coupon discount
    let totalAmount = subtotal;
    let discountAmount = 0;
    if (couponCode) {
      discountAmount = await applyCoupon(couponCode, subtotal);
      totalAmount -= discountAmount;
    }

    // Validate payment amount
    if (paymentAmountNumber !== totalAmount) {
      return res.status(400).json({ message: 'Payment amount does not match total amount' });
    }

    // Create order item
    const orderItem = {
      product: product._id,
      quantity: quantity,
      price: price,
      discountApplied: discountApplied
    };

    // Get user's delivery address if available
    const deliveryAddress = user.addresses.length > 0 ? user.addresses[0] : null; // Assuming you want to use the first address

    if (!deliveryAddress) {
      return res.status(400).json({ message: 'No delivery address available for the user' });
    }

    // Create new order
    const newOrder = new Orders({
      orderId: generateOrderId(),
      user: userId,
      totalAmount: totalAmount,
      orderDate: new Date(),
      deliveryAddress: deliveryAddress, // Automatically use the existing address
      items: [orderItem],
      status: 'confirmed', // Order status is confirmed upon creation
      couponCode: couponCode || null,
      discountAmount: discountAmount || 0
    });

    await newOrder.save();

    // Determine payment status based on payment method
    let paymentStatus;
    if (paymentMethod.toLowerCase() === 'cod') {
      paymentStatus = 'Pending'; // COD payments remain pending
    } else {
      paymentStatus = 'Success'; // Assume other methods are successful for simulation
    }

    // Simulate payment processing
    const fakeTransactionId = `FAKE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create payment record
    const payment = new Payment({
      order: newOrder._id,
      paymentMethod: paymentMethod,
      amount: paymentAmountNumber,
      status: paymentStatus,
      transactionId: fakeTransactionId,
    });

    await payment.save();

    // Update order with payment details
    newOrder.payments = payment._id; // Link payment to order
    await newOrder.save();

    // Update user's orders array
    if (!user.orders) {
      user.orders = [];
    }
    user.orders.push(newOrder._id);
    await user.save();

    // Update product stock
    product.stock -= quantity;
    await product.save();

    // Find the subcategory for this product
    const subcategory = await SubCategory.findOne({ products: productId }); // Updated query to use correct field

    if (subcategory) {
      // Update inventory
      const updatedInventory = await updateInventory(subcategory._id);

      // Check for low stock
      await checkLowStock(updatedInventory);
    }

    res.status(201).json({ message: 'Order placed successfully', order: newOrder, payment });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Error placing order', error: error.message });
  }
});

module.exports = router;