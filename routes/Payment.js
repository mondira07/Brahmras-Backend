const express = require("express");
const router = express.Router();
const Payment = require("../models/paymentModel");
const Orders = require("../models/ordersModel");
const auth = require("../middlewares/auth");

// Fake payment route
router.post("/fake-payment", auth, async (req, res) => {
  try {
    const { orderId, paymentMethod, amount } = req.body;

    // Validate input
    if (!orderId || !paymentMethod || !amount) {
      return res
        .status(400)
        .json({ message: "Order ID, payment method, and amount are required" });
    }

    // Fetch the order to validate
    const order = await Orders.findOne({ orderId: orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Simulate payment processing
    const fakeTransactionId = `FAKE-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create payment record
    const payment = new Payment({
      order: order,
      paymentMethod: paymentMethod,
      amount: amount,
      status: "Success", // Simulate a successful payment
      transactionId: fakeTransactionId,
    });

    await payment.save();

    // Update order status to "Confirmed"
    order.orderStatus = "confirmed";
    order.payments = payment._id; // Link payment to order
    await order.save();

    res
      .status(201)
      .json({
        message: "Payment simulated and order confirmed successfully",
        payment,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error processing fake payment", error: error.message });
  }
});

module.exports = router;
