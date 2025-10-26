async function sendLowStockAlert(subcategoryId) {
  try {
    const nodemailer = require("nodemailer");
    const SubCategory = require("../models/subCategoryModel");
    const Inventory = require("../models/inventoryModel");
    const User = require("../models/userModel");

   // Fetch subcategory details
    const subcategory = await SubCategory.findById(subcategoryId).populate("product");
    if (!subcategory) {
      console.error("Subcategory not found");
      return;
    }

    // Fetch inventory
    const inventory = await Inventory.findOne({ subcategory: subcategoryId });
    if (!inventory) {
      console.error("Inventory not found for this subcategory");
      return;
    }

    // Check if any product is below threshold
    const lowStockProducts = subcategory.product.filter(
      (product) => product.stock < inventory.lowStockThreshold
    );

    if (lowStockProducts.length === 0) {
      console.log("No products are below threshold. No alert needed.");
      return;
    }

    // Fetch all admins
    const admins = await User.find({ accountType: "Admin" });
    if (!admins || admins.length === 0) {
      console.error("No admins found in the system");
      return;
    }

    // Create a transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      service: "Gmail", // Use your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Prepare product details
    const productDetails = lowStockProducts
  .map((product) => `
- Name: ${product.name}
  Description: ${product.description}
  Current stock: ${product.stock} units`)
  .join("\n");

    // Loop through all admins and send email
    const emailPromises = admins.map((admin) => {
      // Set email options
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: admin.email,
        subject: `Urgent: Low Stock Alert for ${subcategory.name}`,
        text: `
      Dear ${admin.name},
      
      I hope this correspondence finds you in good health and spirits.
      
      This email serves as an urgent notification regarding critically low stock levels in the "${subcategory.name}" subcategory. Our inventory management system has detected that several products within this category have fallen below the predetermined threshold, necessitating immediate action.
      
      Subcategory Details:
      - Name: ${subcategory.name}
      - Description: ${subcategory.description}
      - Low Stock Threshold: ${inventory.lowStockThreshold} units
      
      Products Requiring Immediate Attention:
      ${productDetails}
      
      We kindly request your prompt attention to this matter. It is imperative that the necessary steps are taken to replenish the inventory as soon as possible to avoid potential disruptions in our supply chain and to maintain our high standards of customer satisfaction.
      
      Action Items:
      1. Review the list of affected products.
      2. Initiate contact with relevant suppliers.
      3. Place replenishment orders as appropriate.
      4. Update the inventory management system once new stock is received.
      
      Should you require any additional information or assistance in addressing this situation, please do not hesitate to contact the Inventory Management team.
      
      We appreciate your swift action in resolving this matter and thank you for your continued dedication to maintaining optimal inventory levels.
      
      Best regards,
      
      Inventory Management System
      ${process.env.COMPANY_NAME}
      
      This is an automated message. Please do not reply directly to this email.
      `,
      };
      

      // Send the email
      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);
    console.log("Low stock alerts sent successfully to all admins.");
  } catch (error) {
    console.error("Error sending low stock alert:", error);
  }
}

module.exports = sendLowStockAlert;
