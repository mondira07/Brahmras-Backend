const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const auth = require("../middlewares/auth");

// Route for authenticated users to add addresses
router.post("/add-address", auth, async (req, res) => {
  try {
    const { city, state, homeNumber, pincode, landmark } = req.body;
    console.log("oooooo>", req.user);
    // Find the authenticated user
    const user = await User.findById(req.user._id).exec();
    console.log("*********>>", user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // if (!user) {
    //   return res.status(404).json({ error: 'User not found' });
    // }

    // Add the new address to the user's addresses
    const newAddress = { city, state, homeNumber, pincode, landmark };
    user.addresses.push(newAddress);

    // Save the updated user document
    await user.save();

    res.status(201).json(user.addresses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/update-address", auth, async (req, res) => {
  try {
    const { addressId, city, state, homeNumber, pincode, landmark } = req.body;

    // Find the authenticated user
    const user = await User.findById(req.user._id).exec();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the address to update
    const addressIndex = user.addresses.findIndex(
      (address) => address._id.toString() === addressId
    );
    if (addressIndex === -1) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Update the address
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex].toObject(),
      city,
      state,
      homeNumber,
      pincode,
      landmark,
    };

    // Save the updated user document
    await user.save();

    // Return the updated address
    res.status(200).json(user.addresses[addressIndex]);
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(400).json({ error: error.message });
  }
});


module.exports = router;