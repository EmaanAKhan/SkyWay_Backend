const express = require('express');
const router = express.Router();
const db = require('../db');

// Get seats for a flight
router.get('/flight/:flight_id', (req, res) => {
  const sql = 'SELECT * FROM seats WHERE flight_id = ?';
  db.query(sql, [req.params.flight_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results);
  });
});

module.exports = router;