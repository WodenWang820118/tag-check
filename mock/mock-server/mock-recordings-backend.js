const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());

app.get('/recordings/:projectSlug/names', (req, res) => {
  try {
    // these are the mock data from the './mock/mock-db' folder
    const file1 = 'select_promotion_605eb6f7-1f00-447b-acbd-3d0110049af4';
    const file2 = 'view_item_list_f32a9835-2b8a-49b1-a6d1-2b019b9d11b8';
    const file3 = 'view_promotion_5395af27-52fe-406f-976f-513e3db334a3';
    const data = [file1, file2, file3];

    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (err) {
    res.status(404).send('Not found');
  }
});

app.get('/recordings/ng_gtm_integration_sample/:eventId', (req, res) => {
  try {
    const eventPath = `./mock/mock-db/${req.params.eventId}.json`;
    const data = fs.readFileSync(eventPath, 'utf8');
    const json = JSON.parse(data);
    res.send(json);
  } catch (err) {
    res.status(500).send('Error reading data file');
  }
});

app.enable;
app.listen(port, () => {
  console.log(`Mock server listening at http://localhost:${port}`);
});
