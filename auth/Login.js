const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const payload = {
      id: user._id.toString(),  // Make sure you're using 'id' as the key
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set token in cookies
    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Cookie expires in 3 days
      httpOnly: true, // Cookie is not accessible via client-side script
    };

    res.cookie('token', token, options);

    // Respond with the user information and token
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        token: token,
        phoneNumber: user.phoneNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountType: user.accountType,
        registrationDate: user.registrationDate,
        addresses: user.addresses,
        orders: user.orders,
        cart: user.cart,
        wishlist: user.wishlist,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Logout route
router.get("/logout", async (req, res) => {
  res.clearCookie("token"); // Clear the 'token' cookie
  res.status(200).json({ msg: "Logged out" });
});

module.exports = router;