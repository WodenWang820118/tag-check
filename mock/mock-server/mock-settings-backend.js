const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = 3005;

// Enable CORS for all routes
app.use(cors());

app.get('/settings/ng_gtm_integration_sample', (req, res) => {
  try {
    const data = fs.readFileSync('./mock/mock-server/settings.json');
    // Parse the buffer to a JSON object
    const json = JSON.parse(data);
    // Send the JSON content
    res.setHeader('Content-Type', 'application/json');
    res.send({
      projectSlug: 'ng_gtm_integration_sample',
      settings: json,
    });
  } catch (err) {
    res.status(500).send('Error reading data file');
  }
});

app.enable;
app.listen(port, () => {
  console.log(`Mock server listening at http://localhost:${port}`);
});
