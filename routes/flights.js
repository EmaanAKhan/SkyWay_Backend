const express = require('express');
const router = express.Router();
const db = require('../db');

// Search flights
router.get('/search', (req, res) => {
  const { from, to, date } = req.query;
  const sql = `
    SELECT f.*, 
      a1.name AS departure_airport, a1.city AS from_city, a1.code AS from_code,
      a2.name AS arrival_airport, a2.city AS to_city, a2.code AS to_code
    FROM flights f
    JOIN airports a1 ON f.departure_airport_id = a1.id
    JOIN airports a2 ON f.arrival_airport_id = a2.id
    WHERE a1.code = ? AND a2.code = ? AND DATE(f.departure_time) = ?
  `;
  db.query(sql, [from, to, date], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results);
  });
});

// Airport schedule
router.get('/schedule/:code', (req, res) => {
  const sql = `
    SELECT f.*,
      a1.name AS departure_airport, a1.city AS from_city, a1.code AS from_code,
      a2.name AS arrival_airport, a2.city AS to_city, a2.code AS to_code
    FROM flights f
    JOIN airports a1 ON f.departure_airport_id = a1.id
    JOIN airports a2 ON f.arrival_airport_id = a2.id
    WHERE a1.code = ? OR a2.code = ?
    ORDER BY f.departure_time
  `;
  db.query(sql, [req.params.code, req.params.code], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results);
  });
});

// Get single flight
router.get('/:id', (req, res) => {
  const sql = `
    SELECT f.*,
      a1.name AS departure_airport, a1.city AS from_city, a1.code AS from_code,
      a2.name AS arrival_airport, a2.city AS to_city, a2.code AS to_code
    FROM flights f
    JOIN airports a1 ON f.departure_airport_id = a1.id
    JOIN airports a2 ON f.arrival_airport_id = a2.id
    WHERE f.id = ?
  `;
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (results.length === 0) return res.status(404).json({ error: 'Flight not found' });
    res.json(results[0]);
  });
});

module.exports = router;