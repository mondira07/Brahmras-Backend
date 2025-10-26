const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Orders = require("../models/ordersModel");

// Route to get confirmed orders for the authenticated user
router.get("/my-orders", auth, async (req, res) => {
  try {
    // Get the user ID from the authenticated user
    const userId = req.user._id;

    // Find orders for this user that are confirmed or in later stages
    const confirmedOrders = await Orders.find({
      deliveryAddress: userId,
      orderStatus: { $in: ["confirmed", "shipped", "delivered"] },
    })
      .sort({ orderDate: -1 }) // Sort by order date, most recent first
      .populate("items.product", "name images price") // Populate product details
      .select("-__v"); // Exclude the version key

    if (confirmedOrders.length === 0) {
      return res.status(404).json({ message: "No confirmed orders found" });
    }

    // Format the response
    const formattedOrders = confirmedOrders.map((order) => ({
      orderId: order.orderId,
      totalAmount: order.totalAmount,
      orderDate: order.orderDate,
      orderStatus: order.orderStatus,
      items: order.items.map((item) => ({
        productName: item.product.name,
        productImage: item.product.images[0], // Assuming you want the first image
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.price * item.quantity,
      })),
      discountAmount: order.discountAmount,
      couponCode: order.couponCode,
    }));

    res.json(formattedOrders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
});

module.exports = router;

module.exports = router;
