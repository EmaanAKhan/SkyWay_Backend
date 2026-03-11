const express = require('express');
const router = express.Router();
const db = require('../db');

// Register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
  db.query(sql, [name, email, password], (err, result) => {
    if (err) return res.status(400).json({ error: 'Email already exists' });
    res.json({ message: 'User registered successfully' });
  });
});

// User login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ? AND password = ? AND role = "user"';
  db.query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    req.session.user = { id: results[0].id, name: results[0].name, role: results[0].role };
    res.json({ message: 'Logged in', user: req.session.user });
  });
});

// Admin login
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ? AND password = ? AND role = "admin"';
  db.query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    req.session.user = { id: results[0].id, name: results[0].name, role: results[0].role };
    res.json({ message: 'Admin logged in', user: req.session.user });
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json({ user: req.session.user });
});

module.exports = router;