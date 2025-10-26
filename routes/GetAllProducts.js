const express = require("express");
const router = express.Router();
const Product = require("../models/productModel");
const SubCategory = require("../models/subCategoryModel");
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({ status: "approved" });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res
      .status(500)
      .json({ message: "Server error: Unable to fetch products." });
  }
});
router.get("/product/:id", async (req, res) => {
  const { id } = req.params; // Extract the ID from URL parameters

  if (!id) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:subcategoryId/products", async (req, res) => {
  const { subcategoryId } = req.params;

  try {
    // Find the subcategory by ID
    const subCategory = await SubCategory.findById(subcategoryId).populate(
      "product"
    );

    if (!subCategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    // Fetch the products associated with the subcategory
    const products = subCategory.product;

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;