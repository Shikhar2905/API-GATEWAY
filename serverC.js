const express = require('express');
const { raw } = require('body-parser');
const app = express();
const PORT = 7001;

app.use(raw({ type: '*/*' }));
// app.use(express.json())

app.all('*', (req, res) => {                                // Handle all incoming requests with any method (GET, POST, PUT, DELETE)
  console.log('Server C received request');          // Log basic metadata
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Query Params:', req.query);
  console.log("Body", req.body, typeof req.body);


  // This checks whether the request body exists and is not null or undefined.
  let bodyText = (req.body) ? req.body : '[No body]';
  console.log('Raw Body:', bodyText);

  // Set Content-Type for response to match the original request's content-type 
  res.setHeader('Content-Type', req.headers['content-type'] || 'text/plain');

  
  // Send back a response echoing the received data
  // res.send(`Received data:\n${JSON.stringify(bodyText)}`);
  res.send(`Received data: ${bodyText}`);
});

app.listen(PORT, () => {
  console.log(`Server C running at http://localhost:${PORT}`);
});
