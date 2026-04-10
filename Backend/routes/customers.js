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
// GET ALL CUSTOMERS (Admin + Cashier)
// ===============================
router.get('/', (req, res) => {
  const sql = "SELECT * FROM customers";

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, error: err });
    }

    res.json({
      success: true,
      data: result
    });
  });
});

// ===============================
// GET SINGLE CUSTOMER (Admin + Cashier)
// ===============================
router.get('/:id', (req, res) => {
  const sql = "SELECT * FROM customers WHERE id = ?";

  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({ success: true, data: result[0] });
  });
});

// ===============================
// CREATE CUSTOMER (Admin + Cashier)
// ===============================
router.post('/', checkRole(['admin', 'cashier']), (req, res) => {
  const { name, email, phone, address, city, pincode, gst_number } = req.body;

  const sql = `
    INSERT INTO customers 
    (name, email, phone, address, city, pincode, gst_number, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  db.query(sql, [name, email, phone, address, city, pincode, gst_number], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }

    res.json({
      success: true,
      message: "Customer added successfully",
      id: result.insertId
    });
  });
});

// ===============================
// UPDATE CUSTOMER (Admin ONLY)
// ===============================
router.put('/:id', checkRole(['admin']), (req, res) => {
  const { name, email, phone, address, city, pincode, gst_number } = req.body;

  const sql = `
    UPDATE customers 
    SET name=?, email=?, phone=?, address=?, city=?, pincode=?, gst_number=? 
    WHERE id=?
  `;

  db.query(sql, [name, email, phone, address, city, pincode, gst_number, req.params.id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({
      success: true,
      message: "Customer updated successfully"
    });
  });
});

// ===============================
// DELETE CUSTOMER (Admin ONLY)
// ===============================
router.delete('/:id', checkRole(['admin']), (req, res) => {
  const sql = "DELETE FROM customers WHERE id=?";

  db.query(sql, [req.params.id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({
      success: true,
      message: "Customer deleted successfully"
    });
  });
});

module.exports = router;