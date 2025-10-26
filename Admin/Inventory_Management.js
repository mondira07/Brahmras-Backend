const express = require("express");
const router = express.Router();
const Inventory = require("../models/inventoryModel");
const Product = require("../models/productModel");
const { isAdmin } = require("../middlewares/roleSpecificAuth");
const auth = require("../middlewares/auth");

// Get stock level for a product in a subcategory
router.post("/get-stock", auth, isAdmin, async (req, res) => {
  try {
    const { subcategoryId, productId } = req.body;
    const inventory = await Inventory.findOne({ subcategory: subcategoryId })
      .populate("subcategory", "name")
      .populate("productStock.product", "name");
    if (!inventory) {
      return res
        .status(404)
        .json({ message: "Inventory not found for this subcategory" });
    }

    const productStock = inventory.productStock.find(
      (item) => item.product._id.toString() === productId
    );
    if (!productStock) {
      return res
        .status(404)
        .json({ message: "Product not found in this subcategory inventory" });
    }

    res.json(productStock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update stock level for a product in a subcategory
// router.post('/update-stock', auth, isAdmin, async (req, res) => {
//   try {
//     const { subcategoryId, productId, quantity } = req.body;
//     const inventory = await Inventory.findOne({ subcategory: subcategoryId });

//     if (!inventory) {
//       return res.status(404).json({ message: 'Inventory not found for this subcategory' });
//     }

//     const productStock = inventory.productStock.find(item => item.product.toString() === productId);
//     if (!productStock) {
//       return res.status(404).json({ message: 'Product not found in this subcategory inventory' });
//     }

//     productStock.quantity = quantity;
//     inventory.lastUpdated = Date.now();
//     await inventory.save();

//     // Update the stock in the Product model as well
//     await Product.findByIdAndUpdate(productId, { stock: quantity });

//     res.json(inventory);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// Get all low stock items
router.get("/get-all-low-stock-product", auth, isAdmin, async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: {
        $lte: [{ $max: "$productStock.quantity" }, "$lowStockThreshold"],
      },
    })
      .populate("subcategory", "name")
      .populate("productStock.product", "name");
    res.json(lowStockItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add or update inventory details
router.post("/add-inventory-details", auth, isAdmin, async (req, res) => {
  try {
    const { subcategoryId, productId, quantity, lowStockThreshold } = req.body;

    let inventory = await Inventory.findOne({ subcategory: subcategoryId });

    if (!inventory) {
      inventory = new Inventory({
        subcategory: subcategoryId,
        productStock: [{ product: productId, quantity }],
        lowStockThreshold,
      });
    } else {
      const productStock = inventory.productStock.find(
        (item) => item.product.toString() === productId
      );

      if (productStock) {
        // Update existing product stock
        productStock.quantity = quantity;
      } else {
        // Add new product stock
        inventory.productStock.push({ product: productId, quantity });
      }

      // Update low stock threshold if provided
      if (lowStockThreshold !== undefined) {
        inventory.lowStockThreshold = lowStockThreshold;
      }
    }

    inventory.lastUpdated = Date.now();
    const savedInventory = await inventory.save();

    // Update the stock in the Product model
    await Product.findByIdAndUpdate(productId, { stock: quantity });

    res.status(201).json(savedInventory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
