(() => {
  'use strict';

  // Dati di fallback nel caso l'app venga aperta senza il server Node
  // (in produzione i dati arrivano sempre da GET /api/drinks)
  const FALLBACK_DRINKS = [
    { id: 'acqua-naturale-50', name: 'Acqua naturale 50 cl', price: 1.50, icon: 'water', category: 'BEVANDE' },
    { id: 'birra-33', name: 'Birra 33 cl', price: 5.00, icon: 'beer', category: 'BEVANDE' },
    { id: 'coca-cola-50', name: 'Coca-Cola 50 cl', price: 4.00, icon: 'cola', category: 'BEVANDE' },
    { id: 'fanta-50', name: 'Fanta 50 cl', price: 4.00, icon: 'fanta', category: 'BEVANDE' },
    { id: 'estathe-limone-50', name: 'Estathé Limone 50 cl', price: 4.00, icon: 'icetea-lemon', category: 'BEVANDE' },
    { id: 'estathe-pesca-50', name: 'Estathé Pesca 50 cl', price: 4.00, icon: 'icetea-peach', category: 'BEVANDE' }
  ];

  const state = {
    drinks: [],
    quantities: {} // id -> quantità
  };

  const euro = (value) => value.toFixed(2).replace('.', ',') + '€';

  // ---------- Caricamento dati ----------
  async function loadDrinks() {
    try {
      const res = await fetch('/api/drinks');
      if (!res.ok) throw new Error('risposta non ok');
      state.drinks = await res.json();
    } catch (err) {
      // Server non raggiungibile (es. apertura diretta del file): uso i dati di fallback
      state.drinks = FALLBACK_DRINKS;
    }
    state.drinks.forEach(d => { state.quantities[d.id] = 0; });
    renderMenu();
    updateOrderBar();
  }

  // ---------- Render menu, raggruppato per categoria ----------
  function renderMenu() {
    const container = document.getElementById('menuCategories');
    container.innerHTML = '';

    const byCategory = state.drinks.reduce((acc, drink) => {
      (acc[drink.category] = acc[drink.category] || []).push(drink);
      return acc;
    }, {});

    Object.entries(byCategory).forEach(([category, drinks]) => {
      const section = document.createElement('section');

      const header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML = `
        <span class="wave">${waveIcon()}</span>
        <h2>${category}</h2>
        <span class="chev">${chevronIcon()}</span>
      `;

      const list = document.createElement('div');
      list.className = 'category-list';

      drinks.forEach(drink => list.appendChild(renderDrinkCard(drink)));

      header.addEventListener('click', () => {
        header.classList.toggle('collapsed');
        list.classList.toggle('collapsed');
      });

      section.appendChild(header);
      section.appendChild(list);
      container.appendChild(section);
    });
  }

  function renderDrinkCard(drink) {
    const card = document.createElement('div');
    card.className = 'drink-card';
    card.dataset.id = drink.id;
    card.innerHTML = `
      <div class="drink-icon">
        <img src="${drink.image}" alt="${drink.name}" loading="lazy"
          onerror="this.onerror=null; this.src='/img/drinks/placeholder.png';">
      </div>
      <div class="drink-info">
        <div class="drink-name">${drink.name}</div>
        <div class="drink-price">${euro(drink.price)}</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" data-action="decrease" aria-label="Diminuisci ${drink.name}">−</button>
        <span class="qty-value" id="qty-${drink.id}">0</span>
        <button class="qty-btn" data-action="increase" aria-label="Aumenta ${drink.name}">+</button>
      </div>
    `;

    card.querySelector('[data-action="decrease"]').addEventListener('click', () => changeQty(drink.id, -1));
    card.querySelector('[data-action="increase"]').addEventListener('click', () => changeQty(drink.id, 1));

    return card;
  }

  function changeQty(id, delta) {
    const next = Math.max(0, (state.quantities[id] || 0) + delta);
    state.quantities[id] = next;
    document.getElementById(`qty-${id}`).textContent = next;
    updateOrderBar();
  }

  // ---------- Footer riepilogo ----------
  function getOrderItems() {
    return state.drinks
      .filter(d => state.quantities[d.id] > 0)
      .map(d => ({ ...d, qty: state.quantities[d.id] }));
  }

  function updateOrderBar() {
    const items = getOrderItems();
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = items.reduce((sum, i) => sum + i.qty * i.price, 0);

    document.getElementById('orderCount').textContent = `${totalQty} prodott${totalQty === 1 ? 'o' : 'i'}`;
    document.getElementById('orderTotal').textContent = euro(totalPrice);
    document.getElementById('cartBadge').textContent = totalQty;

    const proceedBtn = document.getElementById('proceedBtn');
    proceedBtn.disabled = totalQty === 0;

    renderDrawer(items, totalPrice);
  }

  function renderDrawer(items, totalPrice) {
    const list = document.getElementById('drawerList');
    list.innerHTML = '';

    if (items.length === 0) {
      list.innerHTML = '<li class="drawer-empty">Non hai ancora aggiunto nulla</li>';
    } else {
      items.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
          <div>
            <div class="item-name">${item.name}</div>
            <div class="item-meta">${item.qty} × ${euro(item.price)}</div>
          </div>
          <div class="item-price">${euro(item.qty * item.price)}</div>
        `;
        list.appendChild(li);
      });
    }

    document.getElementById('drawerTotal').textContent = euro(totalPrice);
  }

  // ---------- Drawer open/close ----------
  const drawer = document.getElementById('orderDrawer');
  function openDrawer() {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  document.getElementById('reviewBtn').addEventListener('click', openDrawer);
  document.getElementById('cartBtn').addEventListener('click', openDrawer);
  document.getElementById('drawerBackdrop').addEventListener('click', closeDrawer);
  document.getElementById('drawerCloseBtn').addEventListener('click', closeDrawer);

  // ---------- Procedi con l'ordine ----------
  document.getElementById('proceedBtn').addEventListener('click', async () => {
    const items = getOrderItems().map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }));
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Ordine inviato! Numero ordine: ${data.orderId}`);
      } else {
        alert('Non è stato possibile inviare l\'ordine. Riprova.');
      }
    } catch (err) {
      alert('Server non raggiungibile. Avvia "npm start" per inviare l\'ordine.');
    }
  });

  // ---------- Mappa: posizione utente in tempo reale ----------
  // TODO: sostituire il pin statico con la posizione reale, es:
  //
  // navigator.geolocation.watchPosition(pos => {
  //   const { latitude, longitude } = pos.coords;
  //   // convertire lat/lng in coordinate % sulla mappa (o integrare Leaflet/Google Maps)
  //   updateUserPin(latitude, longitude);
  // }, err => console.warn('Geolocalizzazione non disponibile', err), { enableHighAccuracy: true });

  document.getElementById('locateBtn').addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocalizzazione non supportata da questo browser.');
      return;
    }
    document.getElementById('locationText').textContent = 'Ricerca posizione…';
    navigator.geolocation.getCurrentPosition(
      () => {
        // Qui, in futuro, andrà l'aggiornamento reale del pin sulla mappa
        document.getElementById('locationText').textContent = 'Posizione aggiornata';
      },
      () => {
        document.getElementById('locationText').textContent = 'Posizione non disponibile';
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });

  // ---------- Icone di supporto ----------
  function waveIcon() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 15c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/><path d="M2 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/></svg>';
  }
  function chevronIcon() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  }

  // ---------- Avvio ----------
  loadDrinks();
})();
