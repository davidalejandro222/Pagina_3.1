/* ---------- Menú hamburguesa ---------- */
const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

function toggleMenu() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    hamburgerBtn.classList.toggle('open');
}
hamburgerBtn.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);
document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', () => {
        if (sidebar.classList.contains('active')) toggleMenu();
    });
});

/* ---------- Carrito (compartido entre páginas con localStorage) ---------- */
const WHATSAPP = '50312345678'; // cambia por el número real
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
function openCart() { cartPanel.classList.add('active'); cartOverlay.classList.add('active'); }
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

document.getElementById('checkout-btn').addEventListener('click', () => {
    if (cart.length === 0) { showToast('Tu pedido está vacío'); return; }
    const lines = cart.map(it => `• ${it.qty}x ${it.name}${it.note ? ' (' + it.note + ')' : ''} - ${money(it.price * it.qty)}`);
    const total = cart.reduce((s, it) => s + it.price * it.qty, 0);
    const msg = `Hola Cupcraft, quiero hacer este pedido:\n${lines.join('\n')}\n\nTotal: ${money(total)}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
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
