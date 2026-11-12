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

function label(key, map, fallback) { return key ? (map[key] || key) : (fallback || '—'); }

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
    updateAdminNav();
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
        if (window.location.pathname.includes('cart.html')) window.location.href = 'index.html';
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
      if (window.location.pathname.includes('admin.html')) window.location.href = 'index.html';
      else if (window.location.pathname.includes('cart.html')) window.location.reload();
      else window.location.reload();
    }
  }
};
Auth.init();

// show/hide admin nav link based on role
function updateAdminNav() {
  const navLink = document.getElementById('nav-admin-link');
  if (!navLink) return;
  if (Auth.user && (Auth.user.role_id === '4' || Auth.user.role_id === 4)) {
    navLink.style.display = 'inline-block';
  } else {
    navLink.style.display = 'none';
  }
}

// api helper
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
  // update cart summary on cart page
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

// truncate helper
function truncateText(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '...';
}

// reset all filters
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

// catalog
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
      : `<button class="btn-primary" onclick="addToCart('${p.id}', this)">Добавить в корзину</button>`;
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

// init
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

// product page
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

// cart
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
      window.location.href = 'index.html';
    };
  }
  await render();
}

// admin
window.showAdminList = function () {
  document.getElementById('admin-list-view').style.display = 'block';
  document.getElementById('admin-form-view').style.display = 'none';
  loadAdminProducts();
};

window.showAdminForm = function (product = null) {
  document.getElementById('admin-list-view').style.display = 'none';
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
    showAdminList();
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
    showAdminList();
  } else {
    panel.style.display = 'none';
    denied.style.display = 'block';
  }
}