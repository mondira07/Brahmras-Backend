const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { isAdmin } = require("../middlewares/roleSpecificAuth");
const auth = require("../middlewares/auth"); // Assuming you have these middleware

const Category = require("../models/categoryModel");
const Orders = require("../models/ordersModel");
const User = require("../models/userModel");

// 2. Get total revenue from completed orders
router.get("/revenue", auth, async (req, res) => {
  try {
    const totalRevenue = await Orders.aggregate([
      { $match: { orderStatus: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    res.json({ totalRevenue: totalRevenue[0]?.total || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Get total number of orders placed
router.get("/total-orders", auth, async (req, res) => {
  try {
    const totalOrders = await Orders.countDocuments();
    res.json({ totalOrders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Get active users (users with most orders)
router.get("/active-users", auth,  async (req, res) => {
  try {
    const activeUsers = await User.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "orders",
          foreignField: "_id",
          as: "orderDetails",
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          phoneNumber: 1,
          orderCount: { $size: "$orderDetails" },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
    ]);
    res.json(activeUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//////////////////////////////////////////// 2nd option no need to remove it for  get active user  ///////////////////////////////////////////////////

// router.get('/active-users', auth, isAdmin, async (req, res) => {
//     try {
//       const thirtyDaysAgo = new Date();
//       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//       const activeUsers = await Orders.aggregate([
//         // Match orders from the last 30 days
//         { $match: { orderDate: { $gte: thirtyDaysAgo } } },

//         // Group by user and count orders
//         { $group: {
//           _id: '$deliveryAddress',
//           orderCount: { $sum: 1 },
//           totalSpent: { $sum: '$totalAmount' }
//         }},

//         // Sort by order count descending
//         { $sort: { orderCount: -1 } },

//         // Limit to top 10 users
//         { $limit: 10 },

//         // Lookup user details
//         { $lookup: {
//           from: 'users',
//           localField: '_id',
//           foreignField: '_id',
//           as: 'userDetails'
//         }},

//         // Unwind the user details array
//         { $unwind: '$userDetails' },

//         // Project the final result
//         { $project: {
//           _id: 0,
//           userId: '$_id',
//           firstName: '$userDetails.firstName',
//           lastName: '$userDetails.lastName',
//           email: '$userDetails.email',
//           phoneNumber: '$userDetails.phoneNumber',
//           orderCount: 1,
//           totalSpent: 1
//         }}
//       ]);

//       res.json(activeUsers);
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   });

//////////////////////====================///////////////////////=====================////////////////////===========//////////

// 5. Get today's orders

router.get("/today-orders", auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await Orders.find({
      orderDate: { $gte: today, $lt: tomorrow },
    }).populate("deliveryAddress", "firstName lastName email phoneNumber");

    res.json(todayOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
