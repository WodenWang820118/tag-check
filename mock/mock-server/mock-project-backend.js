const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

app.get('/projects', (req, res) => {
  try {
    const data = fs.readFileSync('./mock/mock-db/project.json');
    const json = JSON.parse(data);
    res.setHeader('Content-Type', 'application/json');
    res.send(json);
  } catch (err) {
    res.status(500).send('Error reading data file');
  }
});

app.get('/projects/ng_gtm_integration_sample', (req, res) => {
  try {
    const data = fs.readFileSync('./mock/mock-db/settings.json');
    const json = JSON.parse(data);
    res.setHeader('Content-Type', 'application/json');
    res.send(json);
  } catch (err) {
    res.status(500).send('Error reading data file');
  }
});

app.get('/projects/images/ng_gtm_integration_sample/:imageName', (req, res) => {
  try {
    const imageName = req.params.imageName;
    const imagePath = `./mock/mock-db/${imageName}.png`;

    const data = fs.readFileSync(imagePath);
    res.setHeader('Content-Type', 'image/png');
    res.send(data);
  } catch (err) {
    res.status(500).send('Error reading data file');
  }
});

app.enable;
app.listen(port, () => {
  console.log(`Mock server listening at http://localhost:${port}`);
});
