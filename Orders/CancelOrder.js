const express = require('express');
const router = express.Router();
const Orders = require('../models/ordersModel');
const Products = require('../models/productModel');
const User = require('../models/userModel');
const auth = require('../middlewares/auth');

router.post('/cancel-order', auth, async (req, res) => {
    try {
      const userId = req.user[0]._id;
      const { orderId } = req.body;
  
      // Find the order
      const order = await Orders.findOne({ orderId });
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      // Check order status and handle accordingly
      switch(order.orderStatus) {
        case 'pending':
        case 'processing':
          // Proceed with cancellation
          order.orderStatus = 'cancelled';
          await order.save();
  
          // Restore product stock
          for (const item of order.items) {
            await Products.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity }
            });
          }
  
          // Remove order from user's orders array
          await User.findByIdAndUpdate(userId, {
            $pull: { orders: order._id }
          });
  
          return res.status(200).json({ message: 'Order cancelled successfully', order });
  
        case 'shipped':
          return res.status(400).json({ message: 'Cannot cancel a shipped order' });
  
        case 'delivered':
          return res.status(400).json({ message: 'Cannot cancel a delivered order' });
  
        case 'cancelled':
          return res.status(400).json({ message: 'Order is already cancelled' });
  
        default:
          return res.status(400).json({ message: 'Order cannot be cancelled due to its current status' });
      }
  
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ message: 'Error cancelling order', error: error.message });
    }
  });
  
  module.exports = router;
  

module.exports = router;