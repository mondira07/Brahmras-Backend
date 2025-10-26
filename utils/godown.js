// utils/updateInventory.js
async function updateInventory(subcategoryId) {
  try {
    console.log("updateInventory called with subcategoryId:", subcategoryId);
    const Inventory = require("../models/inventoryModel");
    const SubCategory = require("../models/subCategoryModel");
    const Product = require("../models/productModel");

    const subcategory = await SubCategory.findById(subcategoryId).populate(
      "product"
    );
    console.log("Subcategory with products:", subcategory);

    if (!subcategory) {
      console.error("SubCategory not found for ID:", subcategoryId);
      throw new Error("SubCategory not found");
    }

    let productStock = [];

    for (const productId of subcategory.product) {
      const product = await Product.findById(productId);
      if (product) {
        productStock.push({
          product: productId,
          quantity: product.stock,
        });
      }
    }

    // Find the existing inventory or create a new one if it doesn't exist
    let inventory = await Inventory.findOneAndUpdate(
      { subcategory: subcategoryId },
      {
        $set: {
          productStock: productStock,
          lastUpdated: Date.now(),
        },
        $setOnInsert: {
          lowStockThreshold: 10, // Set a default threshold for new inventories
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("Inventory updated for subcategory:", subcategoryId);

    return inventory;
  } catch (error) {
    console.error("Error in updateInventory function:", error);
    throw error;
  }
}

module.exports = updateInventory;
