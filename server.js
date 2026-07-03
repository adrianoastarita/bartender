const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/products -> restituisce l'elenco dei prodotti dal file JSON
app.get('/api/products', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'products.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Impossibile leggere il catalogo bevande' });
    }
    res.json(JSON.parse(data));
  });
});

// GET /api/bar-location -> posizione del bar (statica per ora, in futuro da DB)
app.get('/api/bar-location', (req, res) => {
  res.json({
    name: 'Bartender Beach Bar',
    lat: 43.9297,
    lng: 12.4547
  });
});

// POST /api/order -> riceve l'ordine provvisorio (stub, da collegare a un DB/gestionale)
app.post('/api/order', (req, res) => {
  const order = req.body;
  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    return res.status(400).json({ error: 'Ordine vuoto o non valido' });
  }
  console.log('Nuovo ordine ricevuto:', order);
  res.status(201).json({
    status: 'ok',
    orderId: 'ORD-' + Date.now(),
    received: order
  });
});

app.listen(PORT, () => {
  console.log(`Bartender app in ascolto su http://localhost:${PORT}`);
});
