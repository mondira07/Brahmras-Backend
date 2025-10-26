const express = require("express");
const SubCategory = require("../models/subCategoryModel");
const Category = require("../models/categoryModel");
const { isAdmin } = require("../middlewares/roleSpecificAuth");
const auth = require("../middlewares/auth");
const Product = require("../models/productModel");
const router = express.Router();
const upload = require('../middlewares/upload')
const cloudinaryUpload= require('../utils/CloudinaryUpload')


router.post("/add/subcategories", auth, isAdmin,upload, async (req, res) => {
  try {
    const { name,images, description, category, product } = req.body;

    // Check if the category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found" });
    }
    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map((file) => cloudinaryUpload(file.buffer))
      );
    }

    const subCategory = new SubCategory({
      name,
      description,
      images:imageUrls,
      category,
      products: product ? [product] : [],
    });
    await subCategory.save();

    // Add the subcategory to the category's subCategories array
    categoryExists.subCategories.push(subCategory._id);
    await categoryExists.save();

    res.status(201).json(subCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/update/subcategories", auth, isAdmin, upload, async (req, res) => {
  try {
    const { id, Name, description, category, product } = req.body;
    let { images } = req.body;

    if (!id) {
      return res.status(400).json({ message: "SubCategory ID is required." });
    }

    // Validate category existence if provided
    if (category) {
      const existingCategory = await Category.findById(category);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      return res.status(404).json({ message: "SubCategory not found" });
    }

    // Prepare updates
    const updates = {};
    if (Name) updates.name = Name;
    if (description) updates.description = description;
    if (category) updates.category = category;

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const imageUrls = await Promise.all(
        req.files.map((file) => cloudinaryUpload(file.buffer))
      );
      updates.images = imageUrls;
    } else if (images) {
      updates.images = images.split(','); // Assuming images are sent as a comma-separated string
    }

    // Add product to subcategory's products array if provided
    if (product) {
      if (!subCategory.product) {
        subCategory.product = [];
      }
      subCategory.product.push(product);
    }

    // Apply updates to the subcategory
    if (Object.keys(updates).length > 0) {
      await SubCategory.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    }

    await subCategory.save();

    res.json(subCategory);
  } catch (error) {
    console.error('Error updating subcategory:', error.message);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subcategory ID format.' });
    }
    res.status(500).json({ message: 'Server error: Unable to update subcategory.' });
  }
});

// DELETE route to delete an existing subcategory by name
router.delete("/delete/subcategories", auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.body;

    // Validate the ID format
    if (!id) {
      return res.status(400).json({ message: "SubCategory ID is required" });
    }

    // Find and delete the subcategory
    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      return res.status(404).json({ message: "SubCategory not found" });
    }

    // Remove the subcategory reference from related products
    await Product.updateMany(
      { subcategory: id },
      { $set: { subcategory: null } } // Clear the subcategory field
    );
    await Category.updateMany(
      { subCategories: id },
      { $pull: { subCategories: id } } // Remove the subcategory ID from the array
    );

    // Delete the subcategory
    await SubCategory.findByIdAndDelete(id);

    res.json({ message: "SubCategory deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting subcategory", error: error.message });
  }
});

router.get("/subcategories", async (req, res) => {
  try {
    const subcategories = await SubCategory.find()
      .populate("category", "name")
      .populate("product", "name");
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;