import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

app.use(cors());

/* =======================
   API ROUTES FIRST
======================= */

app.get('/api/titanium', async (req, res) => {
  const url = `https://api.commoditic.com/api/v1/commodities?key=${process.env.API_KEY}&name=titanium`;
  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
});

app.get('/api/titanium/history', async (req, res) => {
  const { from, to, frequency } = req.query;

  const url = `https://api.commoditic.com/api/v1/commodities_history?key=${process.env.API_KEY}&name=titanium&date_from=${from}&date_to=${to}&frequency=${frequency}`;

  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
});

/* =======================
   STATIC FILES LAST
======================= */

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
