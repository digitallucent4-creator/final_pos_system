const express = require('express');
const router = express.Router();
const db = require('../db');

// 🔐 Middleware
const verifyToken = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// ===============================
// APPLY AUTH TO ALL ROUTES
// ===============================
router.use(verifyToken);

// ===============================
// GET ALL MENU ITEMS (Admin + Cashier)
// ===============================
router.get('/', checkRole(['admin', 'cashier']), (req, res) => {
  const { search = '', category = '' } = req.query;

  let sql = "SELECT * FROM menu_items WHERE 1=1";
  let values = [];

  if (search) {
    sql += " AND (name LIKE ? OR category LIKE ?)";
    values.push(`%${search}%`, `%${search}%`);
  }

  if (category && category !== 'all') {
    sql += " AND category = ?";
    values.push(category);
  }

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Error fetching menu items"
      });
    }

    res.json({
      success: true,
      data: {
        items: result
      }
    });
  });
});


// ===============================
// GET CATEGORIES (Admin + Cashier)
// ===============================
router.get('/categories', checkRole(['admin', 'cashier']), (req, res) => {
  const sql = "SELECT DISTINCT category FROM menu_items";

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Error fetching categories"
      });
    }

    res.json({
      success: true,
      data: result
    });
  });
});


// ===============================
// UPDATE STOCK (Admin ONLY)
// ===============================
router.put('/:id/stock', checkRole(['admin']), (req, res) => {
  const { id } = req.params;
  const { quantity, operation } = req.body;

  // ✅ Validation
  if (!quantity || quantity < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid quantity required"
    });
  }

  db.query("SELECT stock FROM menu_items WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Error fetching stock"
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    let currentStock = result[0].stock;
    let newStock = currentStock;

    if (operation === 'decrease') {
      if (currentStock < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
      newStock -= quantity;
    } 
    else if (operation === 'increase') {
      newStock += quantity;
    } 
    else {
      newStock = quantity;
    }

    db.query(
      "UPDATE menu_items SET stock = ? WHERE id = ?",
      [newStock, id],
      (err2) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({
            success: false,
            message: "Error updating stock"
          });
        }

        res.json({
          success: true,
          message: "Stock updated successfully",
          data: { id, stock: newStock }
        });
      }
    );
  });
});

module.exports = router;