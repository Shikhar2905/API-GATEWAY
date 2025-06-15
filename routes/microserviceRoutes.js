const express = require('express');
const pool = require('../dbConfig');
const auth = require('../middleware/auth');
const router = express.Router();

// Create Microservice for logged-in client
router.post('/', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const { name, rate_limit, windowMS } = req.body;
  try {
    const [r] = await pool.query(
      'INSERT INTO microservices (client_id, name, rate_limit, windowMS) VALUES (?, ?, ?, ?)',
      [clientId, name, rate_limit, windowMS]
    );
    res.status(201).json({ micId: r.insertId });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get all microservices for client
router.get('/', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const [rows] = await pool.query(
    'SELECT * FROM microservices WHERE client_id = ?', [clientId]
  );
  res.json(rows);
});

// Update microservice
router.put('/:id', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const { name, rate_limit, windowMS } = req.body;
  const id = req.params.id;
  const [result] = await pool.query(
    'UPDATE microservices SET name=?, rate_limit=?, windowMS=? WHERE mic_id=? AND client_id=?',
    [name, rate_limit, windowMS, id, clientId]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Updated' });
});

// Delete microservice
router.delete('/:id', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const id = req.params.id;
  const [result] = await pool.query(
    'DELETE FROM microservices WHERE mic_id=? AND client_id=?', [id, clientId]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;