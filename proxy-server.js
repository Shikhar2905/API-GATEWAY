const express = require('express');
const proxy = require('express-http-proxy');           // For forwarding requests to microservices
const rateLimit = require('express-rate-limit');       // Rate limiting middleware
const bodyParser = require('body-parser');             // To handle raw request bodies
const pool = require('./dbConfig');                    // MySQL DB connection pool
const redisClient = require('./redisClient');          // Redis client
const jwtAuth = require('./middleware/auth');          // JWT middleware for end-user auth

// Routers
const userRoutes = require('./routes/userRoutes');
const configRoutes = require('./routes/configRoutes');
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

// Dynamically setup routing for services
(async () => {
  const [configs] = await pool.query(
    `SELECT se.base_url, se.target_url, se.port, se.rate_limit, se.window_ms
     FROM service_env se WHERE se.is_active=1`
  );

  configs.forEach(cfg => {
    app.use(
      cfg.base_url,
      bodyParser.raw({ type: '*/*' }),
      jwtAuth,
      rateLimit({ windowMs: cfg.window_ms, max: cfg.rate_limit }),
      proxy(`${cfg.target_url}:${cfg.port}`)
    );
  });
})();


app.listen(PORT, () => {
  console.log(`API Gateway running at http://localhost:${PORT}`);
});