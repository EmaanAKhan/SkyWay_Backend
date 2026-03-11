const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to check if admin
function isAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}

// Get all bookings
router.get('/bookings', isAdmin, (req, res) => {
  const sql = `
    SELECT b.*, 
      u.name AS user_name, u.email,
      f.airline, f.departure_time, f.arrival_time,
      a1.city AS from_city, a1.code AS from_code,
      a2.city AS to_city, a2.code AS to_code,
      s.seat_number, s.class
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN flights f ON b.flight_id = f.id
    JOIN airports a1 ON f.departure_airport_id = a1.id
    JOIN airports a2 ON f.arrival_airport_id = a2.id
    JOIN seats s ON b.seat_id = s.id
    ORDER BY b.booking_date DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results);
  });
});

// Add airport
router.post('/airports', isAdmin, (req, res) => {
  const { code, name, city, country, terminal } = req.body;
  const sql = 'INSERT INTO airports (code, name, city, country, terminal) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [code, name, city, country, terminal], (err) => {
    if (err) return res.status(400).json({ error: 'Airport already exists or invalid data' });
    res.json({ message: 'Airport added' });
  });
});

// Add flight
router.post('/flights', isAdmin, (req, res) => {
  const { departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration, price, airline, aircraft_type } = req.body;
  const sql = 'INSERT INTO flights (departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration, price, airline, aircraft_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration, price, airline, aircraft_type], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to add flight' });
    res.json({ message: 'Flight added', flight_id: result.insertId });
  });
});

// Edit flight
router.put('/flights/:id', isAdmin, (req, res) => {
  const { price, departure_time, arrival_time, duration, status } = req.body;
  const sql = 'UPDATE flights SET price = ?, departure_time = ?, arrival_time = ?, duration = ?, status = ? WHERE id = ?';
  db.query(sql, [price, departure_time, arrival_time, duration, status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update flight' });
    res.json({ message:'Flight updated' });
  });
});

module.exports = router;
