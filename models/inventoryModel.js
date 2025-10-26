// models/inventoryModel.js
const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  subcategory: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SubCategory', 
    required: true 
  },
  productStock: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 0
    }
  }],
  lowStockThreshold: { 
    type: Number, 
    required: true, 
    default: 10 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
});

// Virtual for total quantity
InventorySchema.virtual('totalQuantity').get(function() {
  return this.productStock.reduce((total, item) => total + item.quantity, 0);
});

module.exports = mongoose.model('Inventory', InventorySchema);