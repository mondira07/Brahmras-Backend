const express = require("express");
const Category = require("../models/categoryModel");
const {isAdmin} = require("../middlewares/roleSpecificAuth");
const auth = require('../middlewares/auth')
const router = express.Router();
const mongoose = require("mongoose");
const SubCategory = require('../models/subCategoryModel')
const upload = require('../middlewares/upload')
const cloudinaryUpload = require('../utils/CloudinaryUpload')

router.post('/add/categories', auth, isAdmin, upload, async (req, res) => {
  try {
    const { name, description, subCategories } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map((file) => cloudinaryUpload(file.buffer))
      );
    }

    const category = new Category({
      name,
      images: imageUrls,  // Note: changed from 'image' to 'images' to match your schema
      description,
      subCategories:subCategories ? [subCategories] : [], // Assuming subCategories is a comma-separated string
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT route to update an existing category by name
router.put('/update/categories', auth, isAdmin, upload, async (req, res) => {
  try {
    const { id, name, description, subCategories } = req.body;
    let { images } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Category ID is required.' });
    }

    // Find the category to be updated
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    // Prepare updates
    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    // if (link) updates.link = link;
    if (subCategories) updates.subCategories = subCategories;

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const imageUrls = await Promise.all(
        req.files.map((file) => cloudinaryUpload(file.buffer))
      );
      updates.images = imageUrls;
    } else if (images) {
      updates.images = images.split(','); // Assuming images are sent as a comma-separated string
    }

    // Apply updates if there are any
    if (Object.keys(updates).length > 0) {
      const updatedCategory = await Category.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      if (!updatedCategory) {
        return res.status(400).json({
          message: 'Unable to update the category.',
        });
      }

      // Update subcategory documents to reference this category
      if (subCategories && subCategories.length > 0) {
        await SubCategory.updateMany(
          { _id: { $in: subCategories } },
          { $set: { category: updatedCategory._id } }
        );
      }

      res.json({
        message: 'Category updated successfully.',
        category: updatedCategory,
      });
    } else {
      res.status(400).json({ message: 'No updates provided.' });
    }
  } catch (error) {
    console.error('Error updating category:', error.message);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid category ID format.' });
    }
    res.status(500).json({ message: 'Server error: Unable to update category.' });
  }
});
// DELETE route to delete an existing category by name
router.delete('/delete/categories/:categoryId', auth, isAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Validate the ID format
    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    // Find the category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Update related documents by pulling the category reference
    await SubCategory.updateMany(
      { category: categoryId },
      { $unset: { category: "" } } // This will remove the 'category' field from the SubCategory documents
    );

    // Delete the category
    await Category.findByIdAndDelete(categoryId);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().populate("subCategories", "name");
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Adjust the path as necessary

// Route to fetch a category with its subcategories and subcategory count
router.get("/categories/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    console.log(`Fetching category with ID: ${categoryId}`);

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      console.error("Invalid category ID format:", categoryId);
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(categoryId)
      .populate("subCategories")
      .exec();

    if (!category) {
      console.error(`Category not found for ID: ${categoryId}`);
      return res.status(404).json({ message: "Category not found" });
    }

    console.log(`Found category: ${category.name}`);
    console.log(`Subcategories count: ${category.subCategories.length}`);

    res.json({ category });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});






module.exports = router;