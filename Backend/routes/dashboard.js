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
// DASHBOARD STATS (Admin ONLY)
// ===============================
router.get('/stats', checkRole(['admin']), (req, res) => {
  const statsQuery = `
    SELECT 
      (SELECT IFNULL(SUM(final_total),0) FROM sales WHERE DATE(created_at) = CURDATE()) AS todayRevenue,
      (SELECT COUNT(*) FROM sales WHERE DATE(created_at) = CURDATE()) AS todaySales,
      (SELECT COUNT(*) FROM customers) AS totalCustomers,
      (SELECT COUNT(*) FROM products WHERE stock <= threshold) AS lowStock,
      (SELECT IFNULL(SUM(final_total),0) FROM sales WHERE WEEK(created_at) = WEEK(CURDATE())) AS weekRevenue,
      (SELECT IFNULL(SUM(final_total),0) FROM sales WHERE MONTH(created_at) = MONTH(CURDATE())) AS monthRevenue
  `;

  db.query(statsQuery, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, error: err });
    }

    res.json({
      success: true,
      data: result[0]
    });
  });
});

// ===============================
// RECENT SALES (Admin + Cashier)
// ===============================
router.get('/recent-sales', checkRole(['admin', 'cashier']), (req, res) => {
  const query = `
    SELECT 
      s.id,
      s.final_total AS grand_total,
      s.payment_method,
      s.created_at AS sale_date,
      c.name AS customer_name
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    ORDER BY s.id DESC
    LIMIT 5
  `;

  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });

    res.json({
      success: true,
      data: result
    });
  });
});

// ===============================
// TOP CATEGORIES (Admin ONLY)
// ===============================
router.get('/top-categories', checkRole(['admin']), (req, res) => {
  const query = `
    SELECT 
      p.category,
      SUM(si.quantity) AS total_items_sold,
      SUM(si.quantity * si.price) AS total_revenue
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    GROUP BY p.category
    ORDER BY total_revenue DESC
    LIMIT 5
  `;

  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });

    res.json({
      success: true,
      data: result
    });
  });
});

// ===============================
// AI INSIGHTS (Admin + Cashier)
// ===============================
router.get('/insights', checkRole(['admin', 'cashier']), (req, res) => {
  const query = `
    SELECT name, stock, threshold 
    FROM products 
    WHERE stock <= threshold
    LIMIT 3
  `;

  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });

    const insights = [
      {
        type: 'info',
        title: 'System Running',
        message: 'POS system is working fine'
      }
    ];

    if (result.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Low Stock Alert',
        message: 'Some products are low in stock',
        items: result
      });
    }

    res.json({
      success: true,
      data: insights
    });
  });
});

module.exports = router;