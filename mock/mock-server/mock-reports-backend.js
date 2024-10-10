const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = 3004;

// Enable CORS for all routes
app.use(cors());

app.get('/reports/:projectSlug/names', (req, res) => {
  try {
    const data = fs.readFileSync('./mock/mock-db/db-reports.json');
    const json = JSON.parse(data);
    const project = json['reports'].filter(
      (report) => report.projectSlug === req.params.projectSlug
    )[0];

    const results = project.reports.map((report) => report.eventId);

    res.setHeader('Content-Type', 'application/json');
    res.send(results);
  } catch (err) {
    res.status(500).send('Error reading data file');
  }
});

app.get('/reports/:projectSlug', (req, res) => {
  try {
    const data = fs.readFileSync('./mock/mock-db/db-reports.json');
    // Parse the buffer to a JSON object
    const json = JSON.parse(data);
    // Send the JSON content
    const completedTime = new Date();

    // TODO: the actual data structure follows the below format
    // however, it could be better
    const reports = json['reports'].filter(
      (report) => report.projectSlug === req.params.projectSlug
    )[0].reports;

    const results = reports.map((report) => {
      return {
        eventName: report.eventName,
        ...report,
        completedTime,
      };
    });

    res.setHeader('Content-Type', 'application/json');
    res.send({
      projectSlug: req.params.projectSlug,
      reports: results,
    });
  } catch (err) {
    res.status(500).send('Error reading data file');
  }
});

app.enable;
app.listen(port, () => {
  console.log(`Mock server listening at http://localhost:${port}`);
});
