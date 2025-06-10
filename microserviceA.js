const express = require('express');
const proxy = require('express-http-proxy');
const rateLimit = require('express-rate-limit');
const { raw } = require('body-parser');

const connectDB = require('./dbConfig');
const serviceconfigs = require('./models/ServiceConfig');

const app = express();
const PORT = 3000;

app.use(raw({ type: '*/*' }));

// Connect to DB and load config
connectDB().then(async () => {
  const configs = await serviceconfigs.find();
 
  console.log("Loaded configs: ", configs);
  
  if (!configs.length) {
    console.log("No service configs found in DB");
    return;
  }

  // For each route config from DB
  configs.forEach(config => {
    const { prefix, target, windowMs, maxRequests } = config;

    console.log(target);
    // Add rate limiter
    const limiter = rateLimit({
      windowMs,
      max: maxRequests,
      message: 'Too many requests',
    });

    // Route with rate limiting and proxying
    app.use(prefix, limiter, proxy(target));
  });
});
  // Start server
  app.listen(PORT, () => {
    console.log(`Gateway running at http://localhost:${PORT}`);
  });
