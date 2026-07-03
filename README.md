# Bartender

App web per ordinare bevande al bar della spiaggia: mappa con la posizione del bar e dell'utente, elenco bevande con quantità, riepilogo ordine.

## Stack

- **Backend**: Node.js + Express (server statico + piccole API)
- **Frontend**: HTML / CSS / JavaScript vanilla (nessun framework, nessuna build)
- **Dati**: `data/drinks.json`

## Struttura del progetto

```
bartender/
├── server.js              # server Express + API
├── data/
│   └── drinks.json        # catalogo bevande (fonte dati)
└── public/
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## Avvio in locale

```bash
npm install
npm start          # http://localhost:3000
```

Durante lo sviluppo, con auto-reload:

```bash
npm run dev
```

## API

| Metodo | Endpoint            | Descrizione                                  |
|--------|----------------------|-----------------------------------------------|
| GET    | `/api/drinks`        | Restituisce il catalogo bevande da `drinks.json` |
| GET    | `/api/bar-location`  | Restituisce le coordinate statiche del bar   |
| POST   | `/api/order`         | Riceve l'ordine (`{ items: [...] }`), per ora solo loggato in console |

## Cosa manca / prossimi passi

1. **Geolocalizzazione reale**: il pin dell'utente sulla mappa è statico. In `public/js/app.js` c'è già lo scheletro con `navigator.geolocation.watchPosition(...)`, commentato: va collegato a una vera libreria di mappe (Leaflet + OpenStreetMap, oppure Google Maps JS API) per convertire lat/lng in coordinate sulla mappa e aggiornare il pin in tempo reale.
2. **Persistenza ordini**: `/api/order` oggi logga solo in console. Da collegare a un database (es. SQLite/Postgres) o a un gestionale.
3. **Categorie multiple**: la UI supporta già più categorie (raggruppamento automatico per campo `category` in `drinks.json`); basta aggiungere voci con categorie diverse (es. "COCKTAIL", "SNACK") per vederle comparire come sezioni separate e collassabili.
4. **Autenticazione utente**, se serve associare gli ordini a un account.

## Note di design

Palette nautica (blu mare profondo, azzurro, accento arancio "sole", sabbia) coerente con il contesto beach bar. Font: `Fraunces` per il logotipo, `Manrope` per l'interfaccia.
