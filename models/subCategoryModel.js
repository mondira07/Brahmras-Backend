// models/subCategoryModel.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const updateInventory = require("../utils/godown");

const subCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  images: [
    {
      type: String,
    },
  ],
  product: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
});

// Trigger on subcategory creation
subCategorySchema.post("save", async function (doc, next) {
  try {
    console.log("New subcategory created. Initializing inventory...");
    await updateInventory(doc._id);
    next();
  } catch (error) {
    console.error("Error in subcategory post-save hook:", error);
    next(error);
  }
});

// Trigger on subcategory update (including product additions)
subCategorySchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    if (this._update.$push && this._update.$push.product) {
      console.log("Product added to subcategory. Updating inventory...");
      await updateInventory(doc._id);
    }
    next();
  } catch (error) {
    console.error("Error in subcategory post-update hook:", error);
    next(error);
  }
});
const SubCategory = mongoose.model("SubCategory", subCategorySchema);
module.exports = SubCategory;
