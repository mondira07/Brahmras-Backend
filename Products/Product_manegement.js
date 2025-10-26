const express = require("express");
const router = express.Router();
const Product = require("../models/productModel");
const { isVendor } = require("../middlewares/roleSpecificAuth");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const cloudinaryUpload = require("../utils/CloudinaryUpload");
// Vendor requests to add a new product (sets status to 'pending')

const calculateDiscountedPrice = (price, discountPercentage) => {
  return price - price * (discountPercentage / 100);
};

router.post("/add", auth, isVendor, upload, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      subcategory,
      stock,
      rating,
      numReviews,
      discountPercentage,
    } = req.body;

    if (!name || !description || !price) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, description, and price.',
      });
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map((file) => cloudinaryUpload(file.buffer))
      );
    }

    const priceAfterDiscount = discountPercentage
      ? calculateDiscountedPrice(price, discountPercentage)
      : price;

    const newProduct = new Product({
      name,
      description,
      price,
      priceAfterDiscount,
      subcategory,
      stock,
      images: imageUrls,
      rating,
      numReviews,
      discountPercentage,
      status: 'pending',
    });
    await newProduct.save();
    // Check if the status is 'approved' and update the SubCategory
    res.status(201).json({
      message: 'Product addition request submitted successfully and is pending admin approval.',
      product: newProduct,
    });
  } catch (error) {
    console.error('Error submitting product addition request:', error.message);
    res.status(500).json({
      message: 'Server error: Unable to submit product addition request.',
    });
  }
});


router.put("/update", auth, isVendor, upload, async (req, res) => {
  const {
    productId,
    name,
    description,
    price,
    subcategory,
    stock,
    rating,
    numReviews,
    discountPercentage,
  } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "Product ID is required." });
  }

  try {
    // Fetch the product to be updated and ensure it belongs to the vendor
    const product = await Product.findOne({
      _id: productId,
      vendor: req.user._id,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found for this vendor." });
    }

    if (product.status !== "approved") {
      return res.status(403).json({
        message: "Access denied. Only approved products can be updated.",
      });
    }

    // Prepare updates
    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (price) updates.price = price;
    if (subcategory) updates.subcategory = subcategory;
    if (stock) updates.stock = stock;
    if (rating) updates.rating = rating;
    if (numReviews) updates.numReviews = numReviews;
    if (discountPercentage) {
      updates.discountPercentage = discountPercentage;
      updates.priceAfterDiscount = calculateDiscountedPrice(price, discountPercentage);
    }
    if (req.files && req.files.length > 0) {
      const imageUrls = await Promise.all(
        req.files.map((file) => cloudinaryUpload(file.buffer))
      );
      updates.images = imageUrls;
    }

    if (Object.keys(updates).length > 0) {
      updates.status = "pending";

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: productId, vendor: req.user._id },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!updatedProduct) {
        return res.status(400).json({
          message: "Unable to update the product. It may no longer be in an approved state.",
        });
      }

      res.json({
        message: "Product update request submitted successfully and is pending admin approval.",
        product: updatedProduct,
      });
    } else {
      res.status(400).json({ message: "No updates provided." });
    }
  } catch (error) {
    console.error("Error submitting product update request:", error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid product ID format." });
    }
    res.status(500).json({ message: "Server error: Unable to submit product update request." });
  }
});


// Vendor requests to delete a product (sets status to 'pending')
router.delete("/delete", auth, isVendor, async (req, res) => {
  try {
    // Fetch the product owned by the logged-in vendor
    const product = await Product.findOne({ vendor: req.user._id });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found for this vendor." });
    }

    // Update status to 'pending_deletion'
    product.status = "pending";

    await product.save();

    res.json({
      message:
        "Product deletion request submitted successfully and is pending admin approval.",
      product,
    });
  } catch (error) {
    console.error("Error submitting product deletion request:", error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid product ID format." });
    }
    res
      .status(500)
      .json({
        message: "Server error: Unable to submit product deletion request.",
      });
  }
});

module.exports = router;
