const API_BASE = window.location.origin;
const PLACEHOLDER_IMG = 'placeholder.png';

const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

// mapping
const typeLabels = { tops: 'Футболки', hoodie: 'Худи', pants: 'Брюки', shoes: 'Обувь' };
const genderLabels = { male: 'Мужской', female: 'Женский', unisex: 'Унисекс' };
const colorLabels = { white: 'Белый', black: 'Чёрный', gray: 'Серый', blue: 'Синий', red: 'Красный', green: 'Зелёный', yellow: 'Жёлтый', brown: 'Коричневый', beige: 'Бежевый', pink: 'Розовый', purple: 'Фиолетовый', orange: 'Оранжевый' };
const seasonLabels = { summer: 'Лето', winter: 'Зима', spring: 'Весна', autumn: 'Осень' };
const orderStatusLabels = { 1: 'Принят', 2: 'В работе', 3: 'Собран', 4: 'Готов к выдаче', 5: 'Отменён', 6: 'Выдан' };

function label(key, map, fallback) { return key ? (map[key] || key) : (fallback || '—'); }

// QR icon SVG
const QR_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 0h6v6H0V0zm1 1v4h4V1H1zm8 0h6v6H9V1zm1 1v4h4V2h-4zM0 9h6v6H0V9zm1 1v4h4v-4H1zm9-1h1v1h-1V9zm2 0h1v1h-1V9zm2 0h1v1h-1V9zm-4 2h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h1v1h-1v-1zm-4 2h1v1h-1v-1zm2 0h2v2h-2v-2zm3 0h1v2h-1v-2z"/></svg>`;

// auth
const Auth = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  init() {
    this.renderHeader();
    window.addEventListener('storage', () => {
      this.user = JSON.parse(localStorage.getItem('user') || 'null');
      this.renderHeader();
    });
  },
  renderHeader() {
    const container = document.getElementById('header-actions');
    if (!container) return;
    let html = '';
    html += `<button onclick="showQR()" class="btn-link qr-btn" title="QR-код пользователя">${QR_ICON_SVG}</button>`;
    if (this.user && this.user.id) {
      html += `<span class="user-greeting">Привет, <b>${this.user.name || 'User'}</b></span>`;
      html += `<button onclick="Auth.logout()" class="btn-link" style="margin-left:8px;">Выход</button>`;
    } else {
      html += `<button onclick="Auth.showModal('login')" class="btn-link">Вход</button>`;
      html += ` <span class="divider">|</span> `;
      html += `<button onclick="Auth.showModal('register')" class="btn-link">Регистрация</button>`;
    }
    container.innerHTML = html;
    updateCartCount();
    updateNavLinks();
  },
  showModal(mode) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();
    const isLogin = mode === 'login';
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-window">
        <div class="modal-header">
          <h3>${isLogin ? 'Вход в систему' : 'Регистрация'}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">x</button>
        </div>
        <div class="modal-body">
          <form id="auth-form">
            ${!isLogin ? `<div class="form-group"><label>Имя:</label><input type="text" id="auth-name" class="input-field" required></div>` : ''}
            <div class="form-group"><label>Email:</label><input type="email" id="auth-email" class="input-field" required placeholder="admin@demo.com"></div>
            <div class="form-group"><label>Пароль:</label><input type="password" id="auth-pass" class="input-field" required placeholder="Минимум 6 символов"></div>
            <div id="auth-error" style="color:red; font-size:11px; margin-bottom:10px; display:none;"></div>
            <button type="submit" class="btn-primary" style="width:100%">${isLogin ? 'Войти' : 'Зарегистрироваться'}</button>
          </form>
          <p class="modal-switch">
            ${isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'} 
            <a href="#" onclick="event.preventDefault(); Auth.showModal('${isLogin ? 'register' : 'login'}')">
              ${isLogin ? 'Создать' : 'Войти'}
            </a>
          </p>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#auth-form').onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const pass = document.getElementById('auth-pass').value;
      const errorDiv = document.getElementById('auth-error');
      const btn = e.target.querySelector('button');
      if (pass.length < 6) {
        errorDiv.textContent = 'Пароль должен содержать минимум 6 символов';
        errorDiv.style.display = 'block';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Загрузка...';
      errorDiv.style.display = 'none';
      try {
        if (isLogin) {
          const res = await fetch(`${API_BASE}/user/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
          });
          if (!res.ok) throw new Error(await res.text() || 'Неверный email или пароль');
          this.user = await res.json();
        } else {
          const name = document.getElementById('auth-name').value;
          const roleId = email === 'admin@demo.com' ? '4' : '2';
          const res = await fetch(`${API_BASE}/user`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone: "+70000000000", password: pass, role_id: roleId })
          });
          if (!res.ok) throw new Error('Ошибка регистрации: ' + await res.text());
          this.user = await res.json();
        }
        localStorage.setItem('user', JSON.stringify(this.user));
        modal.remove();
        this.renderHeader();
        if (window.location.pathname.includes('cart.html') || window.location.pathname.includes('orders.html')) window.location.href = 'index.html';
        else window.location.reload();
      } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
        btn.disabled = false;
        btn.textContent = isLogin ? 'Войти' : 'Зарегистрироваться';
      }
    };
  },
  logout() {
    if (confirm('Выйти из аккаунта?')) {
      localStorage.removeItem('user');
      this.user = null;
      this.renderHeader();
      if (window.location.pathname.includes('admin.html') || window.location.pathname.includes('orders.html')) window.location.href = 'index.html';
      else if (window.location.pathname.includes('cart.html')) window.location.reload();
      else window.location.reload();
    }
  }
};
Auth.init();

function updateNavLinks() {
  const adminLink = document.getElementById('nav-admin-link');
  if (adminLink) {
    adminLink.style.display = (Auth.user && (Auth.user.role_id === '4' || Auth.user.role_id === 4)) ? 'inline-block' : 'none';
  }
  const ordersLink = document.getElementById('nav-orders-link');
  if (ordersLink) {
    ordersLink.style.display = (Auth.user && Auth.user.id) ? 'inline-block' : 'none';
  }
}

window.showQR = function () {
  if (!Auth.user || !Auth.user.id) {
    Auth.showModal('login');
    return;
  }
  const existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();

  const qrData = JSON.stringify({ user_id: Auth.user.id });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(qrData)}`;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-window qr-modal">
      <div class="modal-header">
        <h3>Ваш QR-код</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">x</button>
      </div>
      <div class="modal-body" style="text-align:center;">
        <p style="font-size:12px; color:#666; margin-bottom:12px;">Покажите этот код менеджеру для получения заказа</p>
        <img src="${qrUrl}" alt="QR Code" class="qr-image" style="border:1px solid #ccc; padding:8px; background:#fff; border-radius:4px;">
        <p style="font-size:10px; color:#999; margin-top:10px; word-break:break-all;">${qrData}</p>
      </div>
    </div>`;
  document.body.appendChild(modal);
};

async function api(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers }, ...options
    });
    if (!res.ok) { console.error(`API ${res.status}:`, endpoint); return undefined; }
    const text = await res.text();
    if (!text || text.trim() === 'null' || text.trim() === '') return [];
    const parsed = JSON.parse(text);
    return parsed === null ? [] : parsed;
  } catch (e) { console.error("Network error:", e); return undefined; }
}

async function updateCartCount() {
  if (!Auth.user || !Auth.user.id) return;
  const items = await api(`/cart/${Auth.user.id}`) || [];
  const count = items.reduce((sum, i) => sum + i.count, 0);
  const summary = document.getElementById('cart-summary');
  if (summary) {
    const word = getCartWord(count);
    summary.innerHTML = `<div class="cart-summary-text">Всего позиций: <b>${count}</b> ${word}</div>`;
  }
}

function getCartWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'товаров';
  if (mod10 === 1) return 'товар';
  if (mod10 >= 2 && mod10 <= 4) return 'товара';
  return 'товаров';
}

function truncateText(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '...';
}

window.resetAllFilters = function () {
  const gender = document.getElementById('filter-gender');
  const color = document.getElementById('filter-color');
  const season = document.getElementById('filter-season');
  const sort = document.getElementById('filter-sort');
  const search = document.getElementById('global-search');
  if (gender) gender.value = '';
  if (color) color.value = '';
  if (season) season.value = '';
  if (sort) sort.value = '';
  if (search) search.value = '';
  const clearBtn = document.querySelector('.search-clear');
  if (clearBtn) clearBtn.style.display = 'none';
  document.querySelectorAll('.cat-link').forEach(l => l.classList.remove('active'));
  const allBtn = document.querySelector('.cat-link[data-type=""]');
  if (allBtn) allBtn.classList.add('active');
  renderCatalog();
};

window.renderCatalog = async function () {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  const type = document.querySelector('.cat-link.active')?.dataset.type || '';
  const gender = document.getElementById('filter-gender')?.value || '';
  const color = document.getElementById('filter-color')?.value || '';
  const season = document.getElementById('filter-season')?.value || '';
  const sort = document.getElementById('filter-sort')?.value || '';
  const search = document.getElementById('global-search')?.value.toLowerCase() || '';
  let url = `/product?limit=50`;
  if (type) url += `&type=${type}`;
  if (gender) url += `&gender=${gender}`;
  if (color) url += `&color=${color}`;
  if (season) url += `&season=${season}`;
  const products = await api(url);
  if (products === undefined) {
    grid.innerHTML = `<div class="error-box" style="grid-column:1/-1;text-align:left;">
      <h3>Ошибка связи с сервером</h3>
      <p>Убедитесь, что сервер запущен.</p>
      <button class="btn-primary" onclick="location.reload()" style="margin-top:10px;">Обновить</button>
    </div>`;
    return;
  }
  let filtered = products.filter(p => (!search || p.name.toLowerCase().includes(search)));
  if (sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
  if (sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-box" style="grid-column:1/-1;">Товары не найдены.</div>`;
    return;
  }

  let cartMap = {};
  if (Auth.user && Auth.user.id) {
    const cartItems = await api(`/cart/${Auth.user.id}`) || [];
    cartItems.forEach(item => { cartMap[item.product_id] = item; });
  }

  grid.innerHTML = filtered.map(p => {
    const inCart = cartMap[p.id];
    const cartBtnHtml = inCart
      ? `<div class="cart-status">
          <a href="cart.html" class="btn-primary cart-link-btn">В корзине</a>
          <button class="btn-small qty-btn qty-btn-left" onclick="changeQty('${inCart.id}', -1)">−</button>
          <input type="number" class="qty-input" value="${inCart.count}" min="1" max="999" onchange="updateQtyFromInput('${inCart.id}', this.value)" onkeydown="if(event.key==='Enter'){this.blur()}">
          <button class="btn-small qty-btn qty-btn-right" onclick="changeQty('${inCart.id}', 1)">+</button>
         </div>`
      : `<button class="btn-primary" onclick="addToCart('${p.id}', this)">В корзину</button>`;
    return `
    <div class="product-box">
      <div class="product-img">
        <img src="${p.photo_id ? `${API_BASE}/photo/${p.photo_id}` : PLACEHOLDER_IMG}" alt="${p.name}">
      </div>
      <div class="product-info">
        <div class="product-brand">${p.brand || 'Бренд'}</div>
        <div class="product-title"><a href="product.html?id=${p.id}">${p.name}</a></div>
        <div class="product-desc-preview">${truncateText(p.description, 70)}</div>
        <div class="product-price">${Math.round(p.price)} ₽</div>
        ${cartBtnHtml}
      </div>
    </div>`;
  }).join('');
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.cat-link').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelectorAll('.cat-link').forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      renderCatalog();
    });
  });

  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    const wrapper = searchInput.parentElement;
    const clearBtn = document.createElement('span');
    clearBtn.className = 'search-clear';
    clearBtn.textContent = 'x';
    wrapper.appendChild(clearBtn);
    searchInput.addEventListener('input', () => {
      clearBtn.style.display = searchInput.value ? 'block' : 'none';
    });
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      renderCatalog();
      searchInput.focus();
    });
  }

  renderCatalog();
  loadProduct();
  loadCart();
  loadAdmin();
  loadMyOrders();
});

window.addToCart = async (id, btn) => {
  if (!Auth.user || !Auth.user.id) { Auth.showModal('login'); return; }
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = '...';
  await api('/cart', { method: 'POST', body: JSON.stringify({ user_id: Auth.user.id, product_id: id, count: 1 }) });
  updateCartCount();
  renderCatalog();
};

window.removeFromCart = async (cartItemId) => {
  await api(`/cart/${cartItemId}`, { method: 'DELETE' });
  updateCartCount();
  renderCatalog();
  if (window.location.pathname.includes('cart.html')) loadCart();
};

window.changeQty = async (cartItemId, delta) => {
  const row = document.querySelector(`[data-cart-id="${cartItemId}"]`);
  let current = 1;
  if (row) {
    const input = row.querySelector('.qty-input, .qty-input-cart');
    if (input) current = parseInt(input.value) || 1;
  } else {
    if (Auth.user && Auth.user.id) {
      const items = await api(`/cart/${Auth.user.id}`) || [];
      const item = items.find(i => i.id === cartItemId);
      if (item) current = item.count;
    }
  }
  const newCount = current + delta;
  if (newCount < 1) {
    await removeFromCart(cartItemId);
    return;
  }
  await api(`/cart/${cartItemId}`, { method: 'PUT', body: JSON.stringify({ count: newCount }) });
  updateCartCount();
  renderCatalog();
  if (window.location.pathname.includes('cart.html')) loadCart();
};

window.updateQtyFromInput = async (cartItemId, value) => {
  const newCount = parseInt(value);
  if (isNaN(newCount) || newCount < 1) {
    await removeFromCart(cartItemId);
    return;
  }
  await api(`/cart/${cartItemId}`, { method: 'PUT', body: JSON.stringify({ count: newCount }) });
  updateCartCount();
  renderCatalog();
  if (window.location.pathname.includes('cart.html')) loadCart();
};

async function loadProduct() {
  const container = document.getElementById('product-container');
  if (!container) return;
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { window.location.href = 'index.html'; return; }
  const p = await api(`/product/${id}`);
  if (!p) { container.innerHTML = '<div class="error-box">Товар не найден. <a href="index.html">Вернуться</a></div>'; return; }

  let cartStatus = '';
  if (Auth.user && Auth.user.id) {
    const cartItems = await api(`/cart/${Auth.user.id}`) || [];
    const inCart = cartItems.find(i => i.product_id === id);
    if (inCart) {
      cartStatus = `<div class="cart-status-detail">
        <a href="cart.html" class="btn-primary cart-link-btn">В корзине</a>
        <button class="btn-small qty-btn qty-btn-left" onclick="changeQty('${inCart.id}', -1)">−</button>
        <input type="number" class="qty-input" value="${inCart.count}" min="1" max="999" onchange="updateQtyFromInput('${inCart.id}', this.value)" onkeydown="if(event.key==='Enter'){this.blur()}">
        <button class="btn-small qty-btn qty-btn-right" onclick="changeQty('${inCart.id}', 1)">+</button>
      </div>`;
    }
  }

  container.innerHTML = `
    <div class="product-detail">
      <div class="detail-image">
        <img src="${p.photo_id ? `${API_BASE}/photo/${p.photo_id}` : PLACEHOLDER_IMG}" alt="${p.name}">
      </div>
      <div class="detail-info">
        <h1>${p.name}</h1>
        <div class="detail-brand">Бренд: <b>${p.brand || 'Не указан'}</b></div>
        <div class="detail-specs">
          <p><b>Тип:</b> ${label(p.type, typeLabels)}</p>
          <p><b>Пол:</b> ${label(p.gender, genderLabels)}</p>
          <p><b>Размер:</b> ${p.size || '—'}</p>
          <p><b>Цвет:</b> ${label(p.color, colorLabels)}</p>
          <p><b>Сезон:</b> ${label(p.season, seasonLabels)}</p>
        </div>
        <p class="detail-desc">${p.description || 'Описание отсутствует.'}</p>
        <div class="detail-price">${Math.round(p.price)} ₽</div>
        ${cartStatus || '<button class="btn-primary btn-large" onclick="addToCart(\'' + p.id + '\', this)">Добавить в корзину</button>'}
      </div>
    </div>`;
}

async function loadCart() {
  const tbody = document.getElementById('cart-items');
  const totalEl = document.getElementById('total-value');
  const container = document.getElementById('cart-container');
  if (!tbody) return;
  if (!Auth.user || !Auth.user.id) {
    container.innerHTML = `<div class="empty-box"><h3>Корзина пуста</h3><p>Для просмотра корзины необходимо <a href="#" onclick="Auth.showModal('login'); return false;">войти</a>.</p></div>`;
    return;
  }
  const render = async () => {
    const items = await api(`/cart/${Auth.user.id}`) || [];
    updateCartCount();
    if (items.length === 0) {
      container.innerHTML = `<div class="empty-box"><h3>Ваша корзина пуста</h3><a href="index.html" class="btn-primary" style="text-decoration:none;display:inline-block;padding:5px 15px;">Перейти к покупкам</a></div>`;
      const summary = document.getElementById('cart-summary');
      if (summary) summary.innerHTML = '';
      return;
    }
    let total = 0;
    const productsData = await Promise.all(items.map(i => api(`/product/${i.product_id}`)));
    tbody.innerHTML = items.map((item, idx) => {
      const p = productsData[idx] || {};
      const sum = (p.price || 0) * item.count;
      total += sum;
      return `<tr data-cart-id="${item.id}">
        <td>
          <div class="cart-item-cell">
            <img src="${p.photo_id ? `${API_BASE}/photo/${p.photo_id}` : PLACEHOLDER_IMG}" class="cart-thumb" alt="${p.name}">
            <div class="cart-item-text">
              <div class="cart-item-name">${p.name}</div>
              <div class="cart-item-meta">${p.brand || ''} ${p.size ? '| ' + p.size : ''} ${p.color ? '| ' + label(p.color, colorLabels) : ''}</div>
            </div>
          </div>
        </td>
        <td class="cart-price-cell">${Math.round(p.price)} ₽</td>
        <td>
          <div class="qty-control">
            <button class="btn-small" onclick="changeQty('${item.id}', -1)">−</button>
            <input type="number" class="qty-input qty-input-cart" value="${item.count}" min="1" max="999" onchange="updateQtyFromInput('${item.id}', this.value)" onkeydown="if(event.key==='Enter'){this.blur()}">
            <button class="btn-small" onclick="changeQty('${item.id}', 1)">+</button>
          </div>
        </td>
        <td class="cart-sum-cell">${Math.round(sum)} ₽</td>
        <td><button class="btn-small btn-remove" onclick="removeFromCart('${item.id}')">Удалить</button></td>
      </tr>`;
    }).join('');
    if (totalEl) totalEl.textContent = Math.round(total) + ' ₽';
  };
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.onclick = async () => {
      const items = await api(`/cart/${Auth.user.id}`);
      if (!items.length) return;
      const order = await api('/order', { method: 'POST', body: JSON.stringify({ user_id: Auth.user.id, status: 1 }) });
      for (const item of items) {
        const p = await api(`/product/${item.product_id}`);
        await api('/order_item', { method: 'POST', body: JSON.stringify({ order_id: order.id, product_id: item.product_id, price: p.price }) });
        await api(`/cart/${item.id}`, { method: 'DELETE' });
      }
      alert(`Заказ #${order.id} успешно оформлен!`);
      window.location.href = 'orders.html';
    };
  }
  await render();
}

// Admin
window.showAdminProducts = function () {
  document.getElementById('admin-products-view').style.display = 'block';
  document.getElementById('admin-orders-view').style.display = 'none';
  document.getElementById('admin-pickup-view').style.display = 'none';
  document.getElementById('admin-form-view').style.display = 'none';
  loadAdminProducts();
};

window.showAdminOrders = function () {
  document.getElementById('admin-products-view').style.display = 'none';
  document.getElementById('admin-orders-view').style.display = 'block';
  document.getElementById('admin-pickup-view').style.display = 'none';
  document.getElementById('admin-form-view').style.display = 'none';
  loadAdminOrders();
};

window.showAdminPickup = function () {
  document.getElementById('admin-products-view').style.display = 'none';
  document.getElementById('admin-orders-view').style.display = 'none';
  document.getElementById('admin-pickup-view').style.display = 'block';
  document.getElementById('admin-form-view').style.display = 'none';
  document.getElementById('pickup-user-id').value = '';
  document.getElementById('pickup-results').innerHTML = '';
};

window.showAdminForm = function (product = null) {
  document.getElementById('admin-products-view').style.display = 'none';
  document.getElementById('admin-orders-view').style.display = 'none';
  document.getElementById('admin-pickup-view').style.display = 'none';
  document.getElementById('admin-form-view').style.display = 'block';
  const form = document.getElementById('product-form');
  form.reset();
  if (product) {
    document.getElementById('form-title').textContent = 'Редактировать товар';
    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-brand').value = product.brand;
    document.getElementById('edit-type').value = product.type;
    document.getElementById('edit-gender').value = product.gender;
    document.getElementById('edit-size').value = product.size || '';
    document.getElementById('edit-color').value = product.color || '';
    document.getElementById('edit-season').value = product.season || '';
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-description').value = product.description || '';
  } else {
    document.getElementById('form-title').textContent = 'Добавить новый товар';
    document.getElementById('edit-product-id').value = '';
  }
};

async function loadAdminProducts() {
  const tbody = document.getElementById('admin-products-table');
  if (!tbody) return;
  const products = await api('/product?limit=100') || [];
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">Товаров пока нет.</td></tr>';
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img src="${p.photo_id ? `${API_BASE}/photo/${p.photo_id}` : PLACEHOLDER_IMG}" style="width:50px;height:50px;object-fit:cover;border:1px solid #ccc;"></td>
      <td><b>${p.name}</b><br><small>${label(p.type, typeLabels)}</small></td>
      <td>${p.brand}</td>
      <td>${Math.round(p.price)} ₽</td>
      <td><button class="btn-small" onclick='editProduct("${p.id}")'>Изменить</button></td>
    </tr>`).join('');
}

async function loadAdminOrders() {
  const tbody = document.getElementById('admin-orders-table');
  if (!tbody) return;
  const orders = await api('/order?limit=200') || [];
  // hide "Выдан" (status 6) orders
  const activeOrders = orders.filter(o => o.status !== 6);
  if (activeOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">Заказов пока нет.</td></tr>';
    return;
  }
  tbody.innerHTML = activeOrders.map(o => `
    <tr data-order-id="${o.id}">
      <td><b>${o.id}</b><br><small>${o.user_id}</small></td>
      <td>${new Date(o.date_time).toLocaleString('ru-RU')}</td>
      <td>
        <select class="input-field" style="margin:0;width:auto;" onchange="updateOrderStatus('${o.id}', this.value)">
          <option value="1" ${o.status === 1 ? 'selected' : ''}>Принят</option>
          <option value="2" ${o.status === 2 ? 'selected' : ''}>В работе</option>
          <option value="3" ${o.status === 3 ? 'selected' : ''}>Собран</option>
          <option value="4" ${o.status === 4 ? 'selected' : ''}>Готов к выдаче</option>
          <option value="5" ${o.status === 5 ? 'selected' : ''}>Отменён</option>
        </select>
      </td>
      <td><button class="btn-small" onclick="viewOrderDetails('${o.id}')">Состав</button></td>
    </tr>
  `).join('');
}

window.updateOrderStatus = async (orderId, newStatus) => {
  await api(`/order/${orderId}`, { method: 'PUT', body: JSON.stringify({ status: parseInt(newStatus) }) });
  alert('Статус заказа обновлён');
  loadAdminOrders();
};

window.viewOrderDetails = async (orderId) => {
  const items = await api(`/order_item/${orderId}`) || [];
  if (items.length === 0) {
    alert('Элементы заказа не найдены');
    return;
  }
  let details = 'Состав заказа:\n';
  for (const item of items) {
    const p = await api(`/product/${item.product_id}`);
    details += `- ${p ? p.name : 'Товар удалён'} (${Math.round(item.price)} ₽)\n`;
  }
  alert(details);
};

window.checkPickup = async function () {
  const userId = document.getElementById('pickup-user-id').value.trim();
  const resultsDiv = document.getElementById('pickup-results');
  if (!userId) {
    resultsDiv.innerHTML = '<div class="empty-box">Введите ID пользователя</div>';
    return;
  }
  resultsDiv.innerHTML = '<div style="text-align:center; padding:20px;">Загрузка...</div>';
  const orders = await api(`/order?user_id=${userId}&limit=50`) || [];
  // hide "Выдан" orders
  const activeOrders = orders.filter(o => o.status !== 6);
  if (activeOrders.length === 0) {
    resultsDiv.innerHTML = '<div class="empty-box">У этого пользователя нет активных заказов</div>';
    return;
  }
  const readyOrders = activeOrders.filter(o => o.status === 4);
  const otherOrders = activeOrders.filter(o => o.status !== 4);
  
  let html = '';
  if (readyOrders.length > 0) {
    html += `<div class="pickup-ready">
      <h4 style="color:#009933; margin:0 0 10px 0;">Готовы к выдаче (${readyOrders.length}):</h4>
      <p style="font-size:11px; color:#666; margin:0 0 10px 0;">Нажмите на заказ, чтобы отметить его как выданный</p>
      <ul style="margin:0; padding-left:20px; list-style:none;">
        ${readyOrders.map(o => `<li class="pickup-order-item" onclick="markAsPickedUp('${o.id}')"><b>#${o.id.substring(0,8)}...</b> — ${new Date(o.date_time).toLocaleString('ru-RU')}</li>`).join('')}
      </ul>
    </div>`;
  }
  if (otherOrders.length > 0) {
    html += `<div class="pickup-other" style="margin-top:15px;">
      <h4 style="color:#666; margin:0 0 10px 0;">Другие заказы (${otherOrders.length}):</h4>
      <ul style="margin:0; padding-left:20px; color:#888; list-style:none;">
        ${otherOrders.map(o => `<li>#${o.id.substring(0,8)}... — ${orderStatusLabels[o.status] || '—'} (${new Date(o.date_time).toLocaleDateString('ru-RU')})</li>`).join('')}
      </ul>
    </div>`;
  }
  resultsDiv.innerHTML = html;
};

window.markAsPickedUp = async function (orderId) {
  if (!confirm('Отметить заказ как выданный? Он исчезнет из всех списков.')) return;
  await api(`/order/${orderId}`, { method: 'PUT', body: JSON.stringify({ status: 6 }) });
  alert('Заказ отмечен как выданный');
  checkPickup(); // refresh pickup view
};

window.editProduct = async function (id) {
  const p = await api(`/product/${id}`);
  if (p) showAdminForm(p);
};

document.addEventListener('submit', async function (e) {
  if (e.target.id !== 'product-form') return;
  e.preventDefault();
  const formData = new FormData(e.target);
  const productId = formData.get('product_id');
  const photoFile = document.getElementById('edit-photo').files[0];

  const productData = {
    name: formData.get('name'), brand: formData.get('brand'),
    type: formData.get('type'), gender: formData.get('gender'),
    size: formData.get('size'), color: formData.get('color'),
    season: formData.get('season'),
    price: parseFloat(formData.get('price')),
    description: formData.get('description')
  };

  let finalProductId = productId;
  try {
    if (productId) {
      await api(`/product/${productId}`, { method: 'PUT', body: JSON.stringify(productData) });
    } else {
      const res = await api('/product', { method: 'POST', body: JSON.stringify(productData) });
      finalProductId = res.id;
    }

    if (photoFile && finalProductId) {
      const photoFormData = new FormData();
      photoFormData.append('file', photoFile);
      photoFormData.append('product_id', finalProductId);
      const photoRes = await fetch(`${API_BASE}/photo`, { method: 'POST', body: photoFormData });
      if (!photoRes.ok) {
        console.error("Photo upload failed:", await photoRes.text());
        alert('Товар сохранён, но фото не загрузилось.');
      }
    }

    alert('Товар успешно сохранён!');
    showAdminProducts();
  } catch (err) {
    console.error(err);
    alert('Ошибка при сохранении товара.');
  }
});

async function loadAdmin() {
  const panel = document.getElementById('admin-panel');
  const denied = document.getElementById('admin-denied');
  if (!panel || !denied) return;
  if (Auth.user && (Auth.user.role_id === '4' || Auth.user.role_id === 4)) {
    panel.style.display = 'block';
    denied.style.display = 'none';
    showAdminProducts();
  } else {
    panel.style.display = 'none';
    denied.style.display = 'block';
  }
}

async function loadMyOrders() {
  const tbody = document.getElementById('my-orders-table');
  const container = document.getElementById('my-orders-container');
  if (!tbody || !container) return;
  
  if (!Auth.user || !Auth.user.id) {
    container.innerHTML = `<div class="empty-box"><h3>Доступ запрещён</h3><p>Для просмотра истории заказов необходимо <a href="#" onclick="Auth.showModal('login'); return false;">войти</a>.</p></div>`;
    return;
  }

  const orders = await api(`/order?user_id=${Auth.user.id}&limit=50`) || [];
  // hide "Выдан" orders
  const activeOrders = orders.filter(o => o.status !== 6);
  if (activeOrders.length === 0) {
    container.innerHTML = `<div class="empty-box"><h3>У вас пока нет активных заказов</h3><a href="index.html" class="btn-primary" style="text-decoration:none;display:inline-block;padding:5px 15px;">Перейти к покупкам</a></div>`;
    return;
  }

  tbody.innerHTML = activeOrders.map(o => `
    <tr>
      <td><b>#${o.id.substring(0, 8)}...</b></td>
      <td>${new Date(o.date_time).toLocaleString('ru-RU')}</td>
      <td><span class="status-badge status-${o.status}">${orderStatusLabels[o.status] || 'Неизвестно'}</span></td>
      <td><button class="btn-small" onclick="viewOrderDetails('${o.id}')">Состав</button></td>
    </tr>
  `).join('');
}