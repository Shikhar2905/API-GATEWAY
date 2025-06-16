require('dotenv').config();
const express    = require('express');
const { raw }    = require('body-parser');
const pool       = require('./dbConfig');      // your MySQL pool

(async () => {
  // 1) Pull every active mapping’s port & base_url
  const [mappings] = await pool.query(`
    SELECT base_url, port
    FROM service_env
    WHERE is_active = 1
  `);

  if (!mappings.length) {
    console.error('No active service_env entries found.');
    process.exit(1);
  }

  // 2) For each mapping, spin up an Express app on its port
  mappings.forEach(({ base_url, port }) => {
    const app = express();
    app.use(raw({ type: '*/*' }));

    // Catch ALL routes under this mapping
    app.all('*', (req, res) => {
      console.log(`[${port}]  ${req.method} ${req.originalUrl}`);
      console.log('Headers:', req.headers);
      console.log('Query Params: ', req.query)
      console.log('Body:', req.body.toString() || '[empty]');
      res.setHeader('Content-Type', req.headers['content-type'] || 'text/plain');
      res.send(`From port ${port} (base ${base_url}): ` +
               (req.body.length ? req.body.toString() : '[no body]'));
    });

    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}${base_url}`);
    });
  });
})();
