const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = 3003;

// Enable CORS for all routes
app.use(cors());

app.get('/specs/ng_gtm_integration_sample/:eventName', (req, res) => {
  try {
    const data = fs.readFileSync('./mock/mock-db/db-specs.json');
    const json = JSON.parse(data);
    const project = json.specs[0];
    const projectEventSpec = project.specs.find(
      (spec) => spec.event === req.params.eventName
    );
    res.setHeader('Content-Type', 'application/json');
    res.send(projectEventSpec);
  } catch (err) {
    res.status(500).send('Error reading data file');
  }
});

app.enable;
app.listen(port, () => {
  console.log(`Mock server listening at http://localhost:${port}`);
});
