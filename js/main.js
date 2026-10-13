/* ---------- Menú hamburguesa ---------- */
const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

function toggleMenu() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    hamburgerBtn.classList.toggle('open');
    document.body.classList.toggle('menu-open');
}
hamburgerBtn.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);
document.querySelectorAll('.sidebar a:not(.dd-toggle)').forEach(link => {
    link.addEventListener('click', () => {
        if (sidebar.classList.contains('active')) toggleMenu();
    });
});

/* Submenús tipo acordeón (funcionan con toque en celular) */
document.querySelectorAll('.dd-toggle').forEach(t => {
    t.addEventListener('click', e => {
        e.preventDefault();
        t.parentElement.classList.toggle('open');
    });
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (sidebar.classList.contains('active')) toggleMenu();
        if (cartPanel.classList.contains('active')) closeCart();
    }
});

/* ---------- Datos del negocio (desde js/config.js) ---------- */
document.querySelectorAll('[data-cc]').forEach(el => {
    const v = CUPCRAFT[el.dataset.cc];
    if (v) el.textContent = v;
});
document.querySelectorAll('[data-cc-href]').forEach(el => {
    const k = el.dataset.ccHref;
    if (k === 'tel') el.href = 'tel:' + CUPCRAFT.telefono.replace(/[^+\d]/g, '');
    if (k === 'mail') el.href = 'mailto:' + CUPCRAFT.correo;
    if (k === 'wa') el.href = 'https://wa.me/' + CUPCRAFT.whatsapp;
    if (k === 'maplink') el.href = 'https://www.google.com/maps?q=' + encodeURIComponent(CUPCRAFT.mapa);
});
document.querySelectorAll('[data-cc-map]').forEach(el => {
    el.src = 'https://www.google.com/maps?q=' + encodeURIComponent(CUPCRAFT.mapa) + '&z=15&output=embed';
});

/* ---------- Carrito (compartido entre páginas con localStorage) ---------- */
const WHATSAPP = CUPCRAFT.whatsapp; // se cambia en js/config.js
let cart = [];
try { cart = JSON.parse(localStorage.getItem('cupcraft_cart')) || []; } catch (e) { cart = []; }

const cartPanel = document.getElementById('cart-panel');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartCountEl = document.getElementById('cart-count');
const toastEl = document.getElementById('toast');

const money = n => '$' + n.toFixed(2);
function saveCart() { try { localStorage.setItem('cupcraft_cart', JSON.stringify(cart)); } catch (e) {} }
function openCart() { renderCart(); cartPanel.classList.add('active'); cartOverlay.classList.add('active'); }
function closeCart() { cartPanel.classList.remove('active'); cartOverlay.classList.remove('active'); }

function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

function renderCart() {
    cartItemsEl.innerHTML = '';
    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<p class="cart-empty">Tu pedido está vacío. ¡Agrega algo delicioso! ☕</p>';
    }
    cart.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="row">
                <div>
                    <div class="name">${item.name}</div>
                    ${item.note ? `<div class="note">${item.note}</div>` : ''}
                </div>
                <strong>${money(item.price * item.qty)}</strong>
            </div>
            <div class="qty">
                <button data-act="minus" data-i="${i}">−</button>
                <span>${item.qty}</span>
                <button data-act="plus" data-i="${i}">+</button>
                <button class="remove-btn" data-act="remove" data-i="${i}" style="margin-left:auto;background:none;width:auto;">Quitar</button>
            </div>`;
        cartItemsEl.appendChild(div);
    });
    cartTotalEl.textContent = money(cart.reduce((s, it) => s + it.price * it.qty, 0));
    cartCountEl.textContent = cart.reduce((s, it) => s + it.qty, 0);
    saveCart();
}

function addToCart(name, price, note) {
    const found = cart.find(it => it.name === name && it.note === note);
    if (found) found.qty++;
    else cart.push({ name, price, note, qty: 1 });
    renderCart();
    showToast('✔ ' + name + ' agregado');
}

document.querySelectorAll('.card .add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const card = btn.closest('.card');
        const select = card.querySelector('select');
        const label = card.querySelector('.options label');
        const note = select ? `${label.textContent}: ${select.value}` : '';
        addToCart(card.dataset.name, parseFloat(card.dataset.price), note);
    });
});

cartItemsEl.addEventListener('click', e => {
    const act = e.target.dataset.act;
    if (!act) return;
    const i = +e.target.dataset.i;
    if (act === 'plus') cart[i].qty++;
    if (act === 'minus') { cart[i].qty--; if (cart[i].qty <= 0) cart.splice(i, 1); }
    if (act === 'remove') cart.splice(i, 1);
    renderCart();
});

document.getElementById('cart-open').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
document.getElementById('clear-btn').addEventListener('click', () => { cart = []; renderCart(); });

/* ---------- Confirmar pedido (API en Python + WhatsApp) ---------- */
const API = (CUPCRAFT.api || '').replace(/\/$/, '');
const CAMPOS = { nombre: 'co-nombre', telefono: 'co-telefono', correo: 'co-correo', direccion: 'co-direccion', pago: 'co-pago', notas: 'co-notas' };
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function leerDatos() {
    const d = {};
    for (const k in CAMPOS) d[k] = (document.getElementById(CAMPOS[k]) || {}).value?.trim() || '';
    return d;
}
// Recordar los datos del cliente para el próximo pedido
try {
    const guardados = JSON.parse(localStorage.getItem('cupcraft_cliente')) || {};
    for (const k in CAMPOS) {
        const el = document.getElementById(CAMPOS[k]);
        if (el && guardados[k]) el.value = guardados[k];
    }
} catch (e) {}

function urlWhatsApp(idPedido, d) {
    const lineas = cart.map(it => `• ${it.qty}x ${it.name}${it.note ? ' (' + it.note + ')' : ''} - ${money(it.price * it.qty)}`);
    const total = cart.reduce((s, it) => s + it.price * it.qty, 0);
    let msg = `Hola Cupcraft, quiero hacer este pedido${idPedido ? ' (#' + idPedido + ')' : ''}:\n${lineas.join('\n')}\n\nTotal: ${money(total)}`;
    msg += `\n\nNombre: ${d.nombre}\nTeléfono: ${d.telefono}\nDirección: ${d.direccion}\nPago: ${d.pago}`;
    if (d.notas) msg += `\nNotas: ${d.notas}`;
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

function mostrarResultado(ok, idPedido, wa, detalle) {
    cartItemsEl.innerHTML = `
        <div class="cart-item" style="text-align:center;">
            <div class="name" style="font-size:1.1rem;">${ok ? '✔ ¡Pedido registrado!' : '⚠ No se pudo registrar en el sistema'}</div>
            ${ok ? `<p class="note" style="margin:8px 0;">Número de pedido: #${idPedido}</p>` : `<p class="note" style="margin:8px 0;">${esc(detalle || '')}</p>`}
            <p style="font-size:0.85rem;margin:8px 0 14px;">${ok ? 'Avísanos por WhatsApp para confirmar tu entrega.' : 'Envíalo por WhatsApp y lo atendemos igual.'}</p>
            <a class="btn" href="${wa}" target="_blank" rel="noopener">Enviar por WhatsApp</a>
        </div>`;
}

document.getElementById('checkout-btn').addEventListener('click', async () => {
    if (cart.length === 0) { showToast('Tu pedido está vacío'); return; }
    const d = leerDatos();
    if (!d.nombre || !d.telefono || !d.direccion) { showToast('Completa nombre, teléfono y dirección'); return; }
    try { localStorage.setItem('cupcraft_cliente', JSON.stringify(d)); } catch (e) {}

    // Sin API configurada: solo WhatsApp
    if (!API) { window.open(urlWhatsApp(null, d), '_blank'); return; }

    const btn = document.getElementById('checkout-btn');
    const textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    const wa = urlWhatsApp(null, d);
    try {
        const res = await fetch(API + '/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            body: JSON.stringify({
                cliente: d,
                items: cart.map(it => ({ nombre: it.name, precio: it.price, cantidad: it.qty, nota: it.note }))
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error del servidor');
        const waOk = urlWhatsApp(data.id_pedido, d);
        mostrarResultado(true, data.id_pedido, waOk);
        cart = [];
        saveCart();
        cartCountEl.textContent = 0;
        cartTotalEl.textContent = money(0);
    } catch (e) {
        mostrarResultado(false, null, wa, 'Intenta de nuevo o usa WhatsApp.');
    } finally {
        btn.disabled = false;
        btn.textContent = textoOriginal;
    }
});

renderCart();

/* ---------- Carrusel (solo en local.html) ---------- */
const track = document.getElementById('carousel-track');
if (track) {
    const slides = track.children.length;
    const dotsBox = document.getElementById('car-dots');
    let current = 0, timer;

    for (let i = 0; i < slides; i++) {
        const d = document.createElement('button');
        d.setAttribute('aria-label', 'Ir a la imagen ' + (i + 1));
        d.addEventListener('click', () => { goTo(i); restart(); });
        dotsBox.appendChild(d);
    }
    function goTo(n) {
        current = (n + slides) % slides;
        track.style.transform = `translateX(-${current * 100}%)`;
        [...dotsBox.children].forEach((d, i) => d.classList.toggle('active', i === current));
    }
    function restart() { clearInterval(timer); timer = setInterval(() => goTo(current + 1), 4500); }

    document.getElementById('car-prev').addEventListener('click', () => { goTo(current - 1); restart(); });
    document.getElementById('car-next').addEventListener('click', () => { goTo(current + 1); restart(); });
    goTo(0);
    restart();
}

/* ---------- Galería: fotos de clientes (solo en galeria.html) ---------- */
const photoInput = document.getElementById('photo-input');
if (photoInput) {
    photoInput.addEventListener('change', e => {
        const grid = document.getElementById('gallery-grid');
        [...e.target.files].forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = ev => {
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.innerHTML = `<img src="${ev.target.result}" alt="Foto de un cliente"><span class="tag">📷 Foto de cliente</span>`;
                grid.prepend(item);
            };
            reader.readAsDataURL(file);
        });
        showToast('📷 ¡Gracias por compartir tu foto!');
        e.target.value = '';
    });
}

/* ---------- Formulario de contacto (solo en contacto.html) ---------- */
const sendBtn = document.getElementById('c-send');
if (sendBtn) {
    sendBtn.addEventListener('click', () => {
        const name = document.getElementById('c-name').value.trim();
        const email = document.getElementById('c-email').value.trim();
        const msg = document.getElementById('c-msg').value.trim();
        const fb = document.getElementById('c-feedback');
        if (!name || !msg) { fb.textContent = 'Escribe tu nombre y tu mensaje.'; return; }
        const text = `Hola Cupcraft, soy ${name}${email ? ' (' + email + ')' : ''}.\n${msg}`;
        window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank');
        fb.textContent = '¡Gracias! Te responderemos pronto.';
    });
}
