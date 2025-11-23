const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(express.static(__dirname));

app.use('/api', require('./api/index.js'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Development server running at http://0.0.0.0:${PORT}/`);
  console.log(`Ready for local testing before Vercel deployment`);
});
