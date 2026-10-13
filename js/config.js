/* ============================================================
   DATOS DEL NEGOCIO - edita SOLO este archivo para cambiarlos
   en todas las páginas (dirección, teléfono, correo, mapa).
   ============================================================ */
const CUPCRAFT = {
    direccion: 'Calle Principal, Av. Del Café #123',
    telefono:  '+503 1234-5678',
    whatsapp:  '50312345678',          // solo números, con código de país
    correo:    'contacto@cupcraft.com',
    mapa:      '13.6989,-89.1914',     // coordenadas (lat,lng) o la dirección escrita

    // Dirección de la API en Python (cupcraft_api.py).
    //  - En tu computadora:  'http://localhost:5000'
    //  - Con ngrok u hosting: la URL https que te den
    //  - Vacío ('') = sin conexión: el pedido solo se envía por WhatsApp
    api:       'http://localhost:5050'
};
