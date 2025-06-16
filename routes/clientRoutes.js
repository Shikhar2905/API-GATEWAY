const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../dbConfig');
require('dotenv').config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Client Signup (register on gateway)
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO client (name, email, password) VALUES (?, ?, ?)',
      [name, email, hash]
    );
    res.status(201).json({ clientId: result.insertId });
  } catch (err) {
    res.status(400).json({ error: 'Signup failed', details: err.message });
  }
});

// Client Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Fetch client record
    const [rows] = await pool.query(
      'SELECT client_id, password FROM client WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const clientRec = rows[0];
    // Verify password
    const match = await bcrypt.compare(password, clientRec.password);
    if (!match) {
      return res.status(401).json({ error: 'Wrong password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { clientId: clientRec.client_id },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    // Expose error message for debugging
    res.status(500).json({ error: 'Login error', details: err.message });
  }
});

module.exports = router;