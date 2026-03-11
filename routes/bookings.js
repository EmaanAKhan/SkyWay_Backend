const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to check if logged in
function isLoggedIn(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
}

// Create booking
router.post('/', isLoggedIn, (req, res) => {
  const { flight_id, seat_id } = req.body;
  const user_id = req.session.user.id;
  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    const updateSeat = 'UPDATE seats SET is_available = FALSE WHERE id = ? AND is_available = TRUE';
    db.query(updateSeat, [seat_id], (err, result) => {
      if (err || result.affectedRows === 0) {
        return db.rollback(() => res.status(400).json({ error: 'Seat not available' }));
      }
      const insertBooking = 'INSERT INTO bookings (user_id, flight_id, seat_id) VALUES (?, ?, ?)';
      db.query(insertBooking, [user_id, flight_id, seat_id], (err) => {
        if (err) {
          return db.rollback(() => res.status(500).json({ error: 'Booking failed' }));
        }
        db.commit((err) => {
          if (err) return db.rollback(() => res.status(500).json({ error: 'Commit failed' }));
          res.json({ message: 'Booking confirmed' });
        });
      });
    });
  });
});

// Get my bookings
router.get('/my', isLoggedIn, (req, res) => {
  const sql = `
    SELECT b.*, 
      f.airline, f.departure_time, f.arrival_time, f.status AS flight_status,
      a1.city AS from_city, a1.code AS from_code,
      a2.city AS to_city, a2.code AS to_code,
      s.seat_number, s.class
    FROM bookings b
    JOIN flights f ON b.flight_id = f.id
    JOIN airports a1 ON f.departure_airport_id = a1.id
    JOIN airports a2 ON f.arrival_airport_id = a2.id
    JOIN seats s ON b.seat_id = s.id
    WHERE b.user_id = ?
    ORDER BY b.booking_date DESC
  `;
  db.query(sql, [req.session.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results);
  });
});

// Cancel booking
router.put('/:id/cancel', isLoggedIn, (req, res) => {
  const user_id = req.session.user.id;
  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    const getBooking = 'SELECT * FROM bookings WHERE id = ? AND user_id = ?';
    db.query(getBooking, [req.params.id, user_id], (err, results) => {
      if (err || results.length === 0) {
        return db.rollback(() => res.status(404).json({ error: 'Booking not found' }));
      }
      const seat_id = results[0].seat_id;
      const cancelBooking = 'UPDATE bookings SET status = "Cancelled" WHERE id = ?';
      db.query(cancelBooking, [req.params.id], (err) => {
        if (err) return db.rollback(() => res.status(500).json({ error: 'Cancel failed' }));
        const restoreSeat = 'UPDATE seats SET is_available = TRUE WHERE id = ?';
        db.query(restoreSeat, [seat_id], (err) => {
          if (err) return db.rollback(() => res.status(500).json({ error: 'Seat restore failed' }));
          db.commit((err) => {
            if (err) return db.rollback(() => res.status(500).json({ error: 'Commit failed' }));
            res.json({ message: 'Booking cancelled' });
          });
        });
      });
    });
  });
});

module.exports = router;