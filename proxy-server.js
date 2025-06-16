const express = require('express');
const proxy = require('express-http-proxy');           // For forwarding requests to microservices
const rateLimit = require('express-rate-limit');       // Rate limiting middleware
const bodyParser = require('body-parser');             // To handle raw request bodies
const pool = require('./dbConfig');                    // MySQL DB connection pool
const jwtAuth = require('./middleware/auth');          // JWT middleware for end-user auth

// Routers
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');
const microserviceRoutes = require('./routes/microserviceRoutes');
const environmentRoutes = require('./routes/environmentRoutes');
const serviceEnvRoutes = require('./routes/serviceEnvRoutes');
const gatewayRoutes = require('./routes/gatewayRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());                                // Middleware to parse JSON bodies


// End-user signup/login
app.use('/auth', userRoutes);

// Client signup/login on gateway
app.use('/client', clientRoutes);

// Client-specific CRUD
app.use('/client/microservices', microserviceRoutes);
app.use('/client/environments', environmentRoutes);
app.use('/client/service-env', serviceEnvRoutes);

// Gateway overview (admin)
app.use('/gateway', gatewayRoutes);


// Dynamic proxy with request logging
(async () => {
  // Fetch active service_env entries
  const [configs] = await pool.query(
    `SELECT service_env_id, base_url, target_url, port, rate_limit, window_ms
     FROM service_env WHERE is_active=1`
  );

  configs.forEach(cfg => {
    const { service_env_id, base_url, target_url, port, rate_limit, window_ms } = cfg;

    // Middleware to log to DB after response
    const logRequest = (req, res, next) => {
      const start = Date.now();
      res.on('finish', async () => {
        const duration = Date.now() - start;
        try {
          await pool.query(
            `INSERT INTO logs
              (service_env_id, ip_address, method, path, status_code, response_time_ms)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [service_env_id, req.ip || req.connection.remoteAddress, req.method, req.originalUrl, res.statusCode, duration]
          );
        } catch (logErr) {
          console.error('Failed to insert log:', logErr);
        }
      });
      next();
    };

    // Register proxy route
    app.use(
      base_url,                                             // Route prefix
      bodyParser.raw({ type: '*/*' }),                       // Raw body parser
      jwtAuth,                                               // Verify JWT
      rateLimit({ windowMs: window_ms, max: rate_limit }),    // Rate limiting
      logRequest,                                            // Log to DB
      proxy(`${target_url}:${port}`)                         // Forward request
    );
  });
})();


app.listen(PORT, () => {
  console.log(`API Gateway running at http://localhost:${PORT}`);
});