const express = require("express");
const router = express.Router();
const Product = require("../models/productModel");
const auth = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/roleSpecificAuth");
const upload = require("../middlewares/upload");
const cloudinaryUpload = require("../utils/CloudinaryUpload");
const SubCategory = require("../models/subCategoryModel");
// Route for admin to update the status of a product to 'approved' or 'rejected'
router.put("/update-status", auth, isAdmin, async (req, res) => {
  const { productId, status } = req.body;

  if (!productId || !status) {
    return res
      .status(400)
      .json({ message: "Product ID and status are required." });
  }

  if (!["approved", "rejected", "remove"].includes(status)) {
    return res.status(400).json({
      message:
        'Invalid status. Status must be either "approved", "rejected", or "remove".',
    });
  }

  try {
    if (status === "remove") {
      // If status is 'remove', delete the product and update the subcategory
      const deletedProduct = await Product.findByIdAndDelete(productId);

      if (!deletedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Remove the product from the subcategory
      await SubCategory.findByIdAndUpdate(deletedProduct.subcategory, {
        $pull: { products: productId },
      });

      return res.status(200).json({
        message: "Product has been removed successfully.",
        product: deletedProduct,
      });
    } else {
      // For 'approved' or 'rejected' status
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      product.status = status;
      await product.save();

      if (status === "approved") {
        // Add the product to the subcategory's products array
        await SubCategory.findByIdAndUpdate(product.subcategory, {
          $addToSet: { product: productId },
        });
      } else if (status === "rejected") {
        // Handle rejected status if needed (e.g., log or notify)
        // No need to update the subcategory for rejected status
      }

      return res.status(200).json({
        message: `Product status updated to ${status} successfully.`,
        product,
      });
    }
  } catch (error) {
    console.error("Error updating product status:", error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid product ID format." });
    }
    res
      .status(500)
      .json({ message: "Server error: Unable to update product status." });
  }
});

////////////////Admin Can add update or delete products///////////////////////////////

const calculateDiscountedPrice = (price, discountPercentage) => {
  return price - price * (discountPercentage / 100);
};

router.post("/admin/add-product", auth, isAdmin, upload, async (req, res) => {
  try {
    console.log("hiiii");
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

    // console.log("Received request body:", req.body);

    if (!name || !description || !price || !subcategory) {
      console.log("Missing required fields:", {
        name,
        description,
        price,
        subcategory,
      });
      return res.status(400).json({
        message:
          "Please provide all required fields: name, description, price, and subcategory.",
      });
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      console.log("Received files:", req.files);
      imageUrls = await Promise.all(
        req.files.map((file) => {
          console.log("Uploading file:", file);
          return cloudinaryUpload(file.buffer);
        })
      );
      console.log("Uploaded image URLs:", imageUrls);
    }

    const priceAfterDiscount = discountPercentage
      ? calculateDiscountedPrice(price, discountPercentage)
      : price;
    console.log("price", price);
    console.log("Calculated price after discount:", priceAfterDiscount);

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
      status: "approved",
    });
    console.log("Created new product object:", newProduct);

    const savedProduct = await newProduct.save();
    console.log("Saved new product:", savedProduct);
    console.log("----------->", savedProduct._id);
    // Update the subcategory with the new product ID
    const updatedSubcategory = await SubCategory.findByIdAndUpdate(
      subcategory,
      { $push: { product: savedProduct._id } },
      { new: true }
    );
    console.log("Updated subcategory:", updatedSubcategory);

    if (!updatedSubcategory) {
      console.log(
        "Subcategory update failed, deleting product:",
        savedProduct._id
      );
      // If subcategory update fails, delete the product and return an error
      await Product.findByIdAndDelete(savedProduct._id);
      return res
        .status(404)
        .json({ message: "Subcategory not found or update failed" });
    }

    res.status(201).json({
      message: "Product added successfully and mapped to subcategory.",
      product: savedProduct,
      updatedSubcategory: updatedSubcategory,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({
      message: "Server error: Unable to add product.",
      error: error.message,
    });
  }
});

router.put("/admin/update-product", auth, isAdmin, upload, async (req, res) => {
  let {
    productId,
    name,
    description,
    price,
    subcategory,
    stock,
    images,
    rating,
    numReviews,
    discountPercentage,
    isFeatured,
  } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "Product ID is required." });
  }

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    const priceAfterDiscount = discountPercentage
      ? calculateDiscountedPrice(price, discountPercentage)
      : price;

    // Update fields if provided
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (subcategory) product.subcategory = subcategory;
    if (stock) product.stock = stock;
    if (rating) product.rating = rating;
    if (numReviews) product.numReviews = numReviews;
    if (priceAfterDiscount) product.priceAfterDiscount = priceAfterDiscount;
    if (discountPercentage) product.discountPercentage = discountPercentage;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;
    if (req.files && req.files.length > 0) {
      const imageUrls = await Promise.all(
        req.files.map((file) => cloudinaryUpload(file.buffer))
      );
      product.images = imageUrls;
    }

    await product.save();
    res.json({ message: "Product updated successfully.", product });
  } catch (error) {
    console.error("Error updating product:", error.message);
    res
      .status(500)
      .json({ message: "Server error: Unable to update product." });
  }
});

router.delete("/admin/delete-product", auth, isAdmin, async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "Product ID is required." });
  }

  try {
    // Find the product to get its subcategory
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete the product
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Remove the product from the subcategory
    await SubCategory.findByIdAndUpdate(product.subcategory, {
      $pull: { products: productId },
    });

    return res.status(200).json({
      message: "Product has been removed successfully.",
      product: deletedProduct,
    });
  } catch (error) {
    console.error("Error deleting product:", error.message);
    res
      .status(500)
      .json({ message: "Server error: Unable to delete product." });
  }
});

module.exports = router;

module.exports = router;
