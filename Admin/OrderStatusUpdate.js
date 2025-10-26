const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth')
const {isAdmin} = require('../middlewares/roleSpecificAuth')
const Orders = require('../models/ordersModel')

router.put('/admin/update-order-status', auth, isAdmin, async (req, res) => {
    const { orderId, status } = req.body;
  
    if (!orderId || !status) {
      return res.status(400).json({
        message: 'Order ID and status are required.'
      });
    }
  
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Status must be one of the following: pending, processing, shipped, delivered, cancelled.'
      });
    }
  
    try {
      const order = await Orders.findOne({ orderId });
  
      if (!order) {
        return res.status(404).json({
          message: 'Order not found.'
        });
      }
  
      order.orderStatus = status;
      await order.save();
  
      res.status(200).json({
        message: `Order status updated to ${status} successfully.`,
        order
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({
        message: 'Server error: Unable to update order status.',
        error: error.message
      });
    }
  });
  
  
  module.exports = router;