const express = require("express");
const router = express.Router();
const Cart = require("../models/cartModel"); // Adjust the path as necessary
const Products = require("../models/productModel"); // Adjust the path as necessary
const auth = require("../middlewares/auth"); // Adjust the path as necessary

// Route to add a product to the cart
router.post("/add-to-cart", auth, async (req, res) => {
  try {
    const userId = req.user[0]._id;
    const { productId, quantity } = req.body;

    // Validate input
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        message:
          "Product ID and quantity are required and quantity must be greater than 0",
      });
    }

    // Fetch the product to ensure it exists
    const product = await Products.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find or create the cart for the user
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
      });
    }

    // Check if the product is already in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (itemIndex > -1) {
      // Product already in cart, update quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Product not in cart, add new item
      cart.items.push({
        product: productId,
        quantity: quantity,
      });
    }

    // Save the cart and calculate total amount
    await cart.save();

    // Calculate totalAmount
    const cartItems = await Cart.findOne({ user: userId }).populate(
      "items.product"
    );
    cart.totalAmount = cartItems.items.reduce((total, item) => {
      return total + item.quantity * item.product.price;
    }, 0);
    await cart.save();

    res
      .status(200)
      .json({ message: "Product added to cart successfully", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding product to cart", error: error.message });
  }
});

router.put("/update-cart", auth, async (req, res) => {
  try {
    const userId = req.user[0]._id;
    const { productId, quantity } = req.body;

    if (!productId || quantity < 0) {
      return res
        .status(400)
        .json({ message: "Product ID and valid quantity are required" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (itemIndex > -1) {
      if (quantity === 0) {
        cart.items.splice(itemIndex, 1); // Remove item if quantity is zero
      } else {
        cart.items[itemIndex].quantity = quantity; // Update quantity
      }
    } else {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Save the updated cart and calculate total amount
    await cart.save();

    // Calculate totalAmount
    const cartItems = await Cart.findOne({ user: userId }).populate(
      "items.product"
    );
    cart.totalAmount = cartItems.items.reduce((total, item) => {
      return total + item.quantity * item.product.price;
    }, 0);
    await cart.save();

    res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating cart", error: error.message });
  }
});

router.delete("/remove-from-cart", auth, async (req, res) => {
  try {
    const userId = req.user[0]._id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Find the cart for the user
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Check if the product exists in the cart
    const productInCart = cart.items.some(
      (item) => item.product.toString() === productId.toString()
    );

    if (!productInCart) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Delete the cart
    await Cart.deleteOne({ user: userId });

    res.status(200).json({ message: "Cart deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error removing product from cart",
      error: error.message,
    });
  }
});
module.exports = router;
