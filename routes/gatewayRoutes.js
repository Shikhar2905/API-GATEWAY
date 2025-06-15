const express = require('express');
const pool = require('../dbConfig');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all clients overview (gateway admin)
// router.get('/clients', auth, async (req, res) => {
//   const [rows] = await pool.query('SELECT client_id, name, email, created_at FROM client');
//   res.json(rows);
// });

router.get('/clients', async (req, res) => {
  const [rows] = await pool.query('SELECT client_id, name, email, created_at FROM client');
  res.json(rows);
});


// Get full tree: clients → microservices → environments → mappings
router.get('/full-overview', async (req, res) => {
  const [data] = await pool.query(
    `SELECT c.client_id,c.name AS client,
            m.mic_id,m.name AS microservice,
            e.env_id,e.env_type,
            se.service_env_id,se.base_url,se.target_url,se.port,se.is_active
     FROM client c
     LEFT JOIN microservices m ON c.client_id=m.client_id
     LEFT JOIN service_env se ON m.mic_id=se.mic_id
     LEFT JOIN environment e ON se.env_id=e.env_id`
  );
  res.json(data);
});

module.exports = router;