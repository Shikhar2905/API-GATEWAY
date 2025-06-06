// Microservice A

const express = require('express');
const { raw } = require('body-parser');
var proxy = require('express-http-proxy');
const app = express();
const PORT = 3000;


// Middleware to parse the incoming request body as raw Buffer.
// This is useful when forwarding data without modifying it
app.use(raw({ type: '*/*' }));   

// app.use(express.json())              // To parse as json


// Route to intercept all incoming requests
app.use('*', 
  (req, res) => {
    // Decide the target dynamically based on the request URL
    let target;                                                                 
    if (req.originalUrl.startsWith('/B')) target = 'http://localhost:7000';
    else if (req.originalUrl.startsWith('/C')) target = 'http://localhost:7001';
    else return res.status(404).send('Invalid route');
  
   
    return proxy(target, {                                  // Proxy the request to the target microservice

      // To inspect or modify the body before sending it to the target (Optional)
      proxyReqBodyDecorator: (bodyContent, srcReq) => {
        console.log('Forwarding Body:', bodyContent);
        console.log('Type:', typeof bodyContent);
        return bodyContent;
      }
    }
  )(req, res);                                            // return the middleware result
});

// Start the server and listen on the defined port
app.listen(PORT, () => {
  console.log(`Microservice A running at http://localhost:${PORT}`);
});