const express = require('express');
const router = express.Router();
const db = require('../db');

// ✅ MIDDLEWARES
const verifyToken = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// ===============================
// APPLY AUTH TO ALL ROUTES
// ===============================
router.use(verifyToken);

// ===============================
// GET ALL PRODUCTS (Admin + Cashier)
// ===============================
router.get('/', checkRole(['admin', 'cashier']), (req, res) => {
  const { search = '', category = '' } = req.query;

  let sql = "SELECT * FROM products WHERE 1=1";
  let params = [];

  if (search) {
    sql += " AND (name LIKE ? OR sku LIKE ? OR category LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });

    res.json({
      success: true,
      data: result
    });
  });
});

// ===============================
// GET SINGLE PRODUCT (Admin + Cashier)
// ===============================
router.get('/:id', checkRole(['admin', 'cashier']), (req, res) => {
  const sql = "SELECT * FROM products WHERE id=?";

  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({
      success: true,
      data: result[0]
    });
  });
});

// ===============================
// CREATE PRODUCT (Admin ONLY)
// ===============================
router.post('/', checkRole(['admin']), (req, res) => {
  const {
    name,
    category,
    sku,
    barcode,
    description,
    selling_price,
    cost_price,
    stock,
    threshold,
    unit_type
  } = req.body;

  const sql = `
    INSERT INTO products 
    (name, category, sku, barcode, description, selling_price, cost_price, stock, threshold, unit_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  db.query(
    sql,
    [name, category, sku, barcode, description, selling_price, cost_price, stock, threshold, unit_type],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });

      res.json({
        success: true,
        message: "Product created",
        id: result.insertId
      });
    }
  );
});

// ===============================
// UPDATE PRODUCT (Admin ONLY)
// ===============================
router.put('/:id', checkRole(['admin']), (req, res) => {
  const {
    name,
    category,
    sku,
    barcode,
    description,
    selling_price,
    cost_price,
    stock,
    threshold,
    unit_type
  } = req.body;

  const sql = `
    UPDATE products 
    SET name=?, category=?, sku=?, barcode=?, description=?, selling_price=?, cost_price=?, stock=?, threshold=?, unit_type=?
    WHERE id=?
  `;

  db.query(
    sql,
    [name, category, sku, barcode, description, selling_price, cost_price, stock, threshold, unit_type, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err });

      res.json({
        success: true,
        message: "Product updated"
      });
    }
  );
});

// ===============================
// DELETE PRODUCT (Admin ONLY)
// ===============================
router.delete('/:id', checkRole(['admin']), (req, res) => {
  const sql = "DELETE FROM products WHERE id=?";

  db.query(sql, [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err });

    res.json({
      success: true,
      message: "Product deleted"
    });
  });
});

// ===============================
// GET CATEGORIES (Admin + Cashier)
// ===============================
router.get('/categories/list', checkRole(['admin', 'cashier']), (req, res) => {
  const sql = "SELECT DISTINCT category FROM products";

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });

    const categories = result.map(r => r.category);

    res.json({
      success: true,
      data: categories
    });
  });
});

module.exports = router;