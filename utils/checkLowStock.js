// utils/checkLowStock.js
const sendLowStockAlert = require('./SendLowStockAlert');

async function checkLowStock(inventory) {
  const lowStockProducts = inventory.productStock.filter(item => item.quantity < inventory.lowStockThreshold);
  
  if (lowStockProducts.length > 0) {
    console.log('Some products are below threshold in subcategory:', inventory.subcategory);
    await sendLowStockAlert(inventory.subcategory);
  }
}

module.exports = checkLowStock;