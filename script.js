// ---------- Configuración de Supabase (pega aquí la tuya) ----------
const SUPABASE_URL = "https://clnpbivxqhzpmbijqcxk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnBiaXZ4cWh6cG1iaWpxY3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyNzY3MDQsImV4cCI6MjEwOTg1MjcwNH0.QOWf5B_mYLQAo49DrGecOOFswgO4GjFJHg0sULLaVGc";
const VAPID_PUBLIC_KEY = "BJ8H3418bX7ow7lzfp3o9LG2mw07VCF9CXgrFcItt5EuMYMp0A-DWEn4fGAkYq58BpGs0_uUq0MgTFcIPDrsLHU";

const veredas = [
    "Altamizal", "Boquerón", "Bosque", "Centro", "Centro Abajo", "Centro Arriba",
    "Chuscal", "Gaunza", "Juncal", "La Palma", "La Unión", "Llano Verde",
    "Loma Gorda", "Los Puentes", "Molino", "Molino Alto", "Nueve Pilas",
    "Palo Caído", "Pavas", "Rosal", "Sisa Arriba", "Sisa Medio",
    "Tambor Chiquito", "Tambor Grande"
];
const TODAS = "Todas las veredas";

const selector = document.getElementById("veredas");
const titulo = document.getElementById("titulo-vereda");
const lista = document.getElementById("lista-contactos");
const mensaje = document.getElementById("mensaje");
const listaAvisos = document.getElementById("lista-avisos");
const selectorAviso = document.getElementById("aviso-vereda");
const mensajeAviso = document.getElementById("mensaje-aviso");

let contactos = [];
let avisos = [];
selector.innerHTML = '<option value="">-- Seleccione una vereda --</option>' +
    veredas.map(v => `<option value="${v}">${v}</option>`).join("");
selectorAviso.innerHTML = `<option>${TODAS}</option>` +
    veredas.map(v => `<option>${v}</option>`).join("");

// ---------- Conexión ----------
let db = null;
try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
    console.error(e);
}

async function cargarContactos() {
    const { data, error } = await db.from("contactos").select("id,vereda,nombre,oficio,telefono_final");
    if (error) { lista.innerHTML = '<p class="vacio">No se pudo cargar. Revisa tu conexión.</p>'; return; }
    contactos = data;
    mostrarContactos();
}

async function cargarAvisos() {
    const { data, error } = await db.from("avisos").select("*");
    if (error) { listaAvisos.innerHTML = '<p class="vacio">No se pudo cargar. Revisa tu conexión.</p>'; return; }
    avisos = data;
    mostrarAvisos();
}

if (db) {
    cargarContactos();
    cargarAvisos();
    db.channel("cambios")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "contactos" }, cargarContactos)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "avisos" }, cargarAvisos)
        .subscribe();
} else {
    mostrarAvisos();
}

// ---------- Contactos ----------
function mostrarContactos() {
    const vereda = selector.value;
    lista.innerHTML = "";
    if (!vereda) { titulo.textContent = "Elige tu vereda"; return; }
    titulo.textContent = vereda;
    const delaVereda = contactos.filter(c => c.vereda === vereda);
    if (delaVereda.length === 0) {
        lista.innerHTML = '<p class="vacio">Aún no hay contactos en esta vereda. ¡Agrega el primero!</p>';
        return;
    }
    delaVereda.forEach(c => {
        const div = document.createElement("div");
        div.className = "contacto";
        const info = document.createElement("div");
        const nombre = document.createElement("strong");
        nombre.textContent = c.nombre;
        const oficio = document.createElement("span");
        oficio.textContent = c.oficio;
        const cel = document.createElement("span");
        cel.textContent = "Celular: ********" + c.telefono_final;
        info.append(nombre, oficio, cel);
        const acciones = document.createElement("div");
        acciones.className = "acciones";
        const llamar = document.createElement("button");
        llamar.type = "button";
        llamar.textContent = "Llamar";
        llamar.addEventListener("click", () => contactar(c.id, "tel"));
        const wsp = document.createElement("button");
        wsp.type = "button";
        wsp.textContent = "WhatsApp";
        wsp.addEventListener("click", () => contactar(c.id, "whatsapp"));
        acciones.append(llamar, wsp);
        div.append(info, acciones);
        lista.appendChild(div);
    });
}

// El número completo se pide solo al tocar el botón
async function contactar(id, medio) {
    const { data, error } = await db.rpc("telefono_contacto", { p_id: id });
    if (error || !data) { alert("No se pudo obtener el contacto. Intenta de nuevo."); return; }
    window.location.href = medio === "tel" ? `tel:+57${data}` : `https://wa.me/57${data}`;
}

document.getElementById("guardar").addEventListener("click", async () => {
    const vereda = selector.value;
    const nombre = document.getElementById("nombre").value.trim();
    const oficio = document.getElementById("oficio").value.trim();
    const telefono = document.getElementById("telefono").value.replace(/\D/g, "");
    if (!vereda) { mensaje.textContent = "Primero elige una vereda arriba."; return; }
    if (!nombre || telefono.length !== 10) {
        mensaje.textContent = "Escribe el nombre y un celular de 10 dígitos.";
        return;
    }
    if (!db) { mensaje.textContent = "Falta configurar Supabase."; return; }
    try {
        const { error } = await db.from("contactos").insert({ vereda, nombre, oficio, telefono });
        if (error) throw error;
        cargarContactos();
        ["nombre", "oficio", "telefono"].forEach(id => document.getElementById(id).value = "");
        mensaje.textContent = "Contacto guardado. Ya lo ve toda la comunidad.";
    } catch (e) {
        mensaje.textContent = "No se pudo guardar. Intenta de nuevo.";
    }
});

// ---------- Cartelera ----------
function formatoFecha(f) {
    if (!f) return "";
    const [a, m, d] = f.split("-");
    return `${d}/${m}/${a}`;
}

function mostrarAvisos() {
    const vereda = selector.value;
    const visibles = avisos
        .filter(a => a.vereda === TODAS || a.vereda === vereda)
        .sort((x, y) => (y.fecha || "").localeCompare(x.fecha || "") || (y.creado || "").localeCompare(x.creado || ""));
    listaAvisos.innerHTML = "";
    if (visibles.length === 0) {
        listaAvisos.innerHTML = '<p class="vacio">No hay avisos por ahora.</p>';
        return;
    }
    visibles.forEach(a => {
        const div = document.createElement("div");
        div.className = "aviso" + (a.tipo === "Salud" || a.tipo === "Servicio público" ? " urgente" : "");
        const cab = document.createElement("div");
        cab.className = "aviso-cabecera";
        const tipo = document.createElement("span");
        tipo.className = "aviso-tipo";
        tipo.textContent = a.tipo;
        const fecha = document.createElement("span");
        fecha.textContent = formatoFecha(a.fecha);
        cab.append(tipo, fecha);
        const texto = document.createElement("p");
        texto.textContent = a.texto;
        const donde = document.createElement("div");
        donde.className = "aviso-donde";
        donde.textContent = a.vereda;
        div.append(cab, texto, donde);
        listaAvisos.appendChild(div);
    });
}

document.getElementById("publicar").addEventListener("click", async () => {
    const texto = document.getElementById("aviso-texto").value.trim();
    if (!texto) { mensajeAviso.textContent = "Escribe el mensaje del aviso."; return; }
    if (!db) { mensajeAviso.textContent = "Falta configurar Supabase."; return; }
    try {
        const { error } = await db.from("avisos").insert({
            vereda: selectorAviso.value,
            tipo: document.getElementById("aviso-tipo").value,
            fecha: document.getElementById("aviso-fecha").value || null,
            texto
        });
        if (error) throw error;
        cargarAvisos();
        document.getElementById("aviso-texto").value = "";
        document.getElementById("aviso-fecha").value = "";
        mensajeAviso.textContent = "Aviso publicado.";
    } catch (e) {
        mensajeAviso.textContent = "No se pudo publicar. Intenta de nuevo.";
    }
});

selector.addEventListener("change", () => { mostrarContactos(); mostrarAvisos(); });

// ---------- Mercado ----------
const listaProductos = document.getElementById("lista-productos");
const mensajeProducto = document.getElementById("mensaje-producto");
const selectorProducto = document.getElementById("prod-vereda");
const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
let productos = [];

selectorProducto.innerHTML = veredas.map(v => `<option>${v}</option>`).join("");

async function cargarProductos() {
    const { data, error } = await db.from("productos")
        .select("id,vereda,nombre,descripcion,precio,vendedor,foto_url,telefono_final,creado")
        .order("creado", { ascending: false });
    if (error) { listaProductos.innerHTML = '<p class="vacio">No se pudo cargar el mercado.</p>'; return; }
    productos = data;
    mostrarProductos();
}

function mostrarProductos() {
    const vereda = selector.value;
    const visibles = vereda ? productos.filter(p => p.vereda === vereda) : productos;
    listaProductos.innerHTML = "";
    if (visibles.length === 0) {
        listaProductos.innerHTML = '<p class="vacio">Aún no hay productos. ¡Publica el primero!</p>';
        return;
    }
    visibles.forEach(p => {
        const div = document.createElement("div");
        div.className = "producto";
        if (p.foto_url) {
            const img = document.createElement("img");
            img.src = p.foto_url;
            img.alt = p.nombre;
            img.loading = "lazy";
            div.appendChild(img);
        }
        const nombre = document.createElement("strong");
        nombre.textContent = p.nombre;
        const precio = document.createElement("span");
        precio.className = "precio";
        precio.textContent = pesos.format(p.precio);
        div.append(nombre, precio);
        if (p.descripcion) {
            const desc = document.createElement("p");
            desc.textContent = p.descripcion;
            div.appendChild(desc);
        }
        const quien = document.createElement("span");
        quien.className = "aviso-donde";
        quien.textContent = `${p.vendedor} - ${p.vereda} - Celular: ********${p.telefono_final}`;
        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = "Escribir por WhatsApp";
        boton.addEventListener("click", async () => {
            const { data, error } = await db.rpc("telefono_producto", { p_id: p.id });
            if (error || !data) { alert("No se pudo obtener el contacto. Intenta de nuevo."); return; }
            const texto = `Hola, vi "${p.nombre}" en UMBITA CONECTADA y me interesa.`;
            window.location.href = `https://wa.me/57${data}?text=${encodeURIComponent(texto)}`;
        });
        div.append(quien, boton);
        listaProductos.appendChild(div);
    });
}

// Reduce la foto para que cargue rápido con poca señal
function comprimirImagen(file, maxLado = 800) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * escala);
            canvas.height = Math.round(img.height * escala);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            canvas.toBlob(b => b ? resolve(b) : reject(new Error("foto")), "image/jpeg", 0.75);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("foto")); };
        img.src = url;
    });
}

document.getElementById("publicar-producto").addEventListener("click", async () => {
    const nombre = document.getElementById("prod-nombre").value.trim();
    const precio = parseInt(document.getElementById("prod-precio").value, 10);
    const descripcion = document.getElementById("prod-descripcion").value.trim();
    const vendedor = document.getElementById("prod-vendedor").value.trim();
    const telefono = document.getElementById("prod-telefono").value.replace(/\D/g, "");
    const archivo = document.getElementById("prod-foto").files[0];
    if (!db) { mensajeProducto.textContent = "Falta configurar Supabase."; return; }
    if (!nombre || !vendedor || !(precio >= 0) || telefono.length !== 10) {
        mensajeProducto.textContent = "Escribe producto, precio, tu nombre y un celular de 10 dígitos.";
        return;
    }
    mensajeProducto.textContent = "Publicando...";
    try {
        let foto_url = null;
        if (archivo) {
            const blob = await comprimirImagen(archivo);
            const ruta = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
            const { error: errFoto } = await db.storage.from("fotos").upload(ruta, blob, { contentType: "image/jpeg" });
            if (errFoto) throw errFoto;
            foto_url = db.storage.from("fotos").getPublicUrl(ruta).data.publicUrl;
        }
        const { error } = await db.from("productos").insert({
            vereda: selectorProducto.value, nombre, precio, descripcion, vendedor, telefono, foto_url
        });
        if (error) throw error;
        ["prod-nombre", "prod-precio", "prod-descripcion", "prod-foto", "prod-vendedor", "prod-telefono"]
            .forEach(id => document.getElementById(id).value = "");
        mensajeProducto.textContent = "Producto publicado.";
        cargarProductos();
    } catch (e) {
        console.error(e);
        mensajeProducto.textContent = "No se pudo publicar. Revisa los datos e intenta de nuevo.";
    }
});

selector.addEventListener("change", mostrarProductos);
if (db) {
    cargarProductos();
    db.channel("mercado")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "productos" }, cargarProductos)
        .subscribe();
}

// ---------- Notificaciones ----------
const botonNotif = document.getElementById("notificaciones");
const mensajeNotif = document.getElementById("mensaje-notif");

function claveAUint8(base64) {
    const relleno = "=".repeat((4 - base64.length % 4) % 4);
    const b64 = (base64 + relleno).replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

if ("Notification" in window && Notification.permission === "granted") {
    botonNotif.textContent = "Notificaciones activadas";
}

botonNotif.addEventListener("click", async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        mensajeNotif.textContent = "Este navegador no permite notificaciones. En iPhone, primero agrega la página a la pantalla de inicio.";
        return;
    }
    if (!db) { mensajeNotif.textContent = "Falta configurar Supabase."; return; }
    try {
        const permiso = await Notification.requestPermission();
        if (permiso !== "granted") { mensajeNotif.textContent = "No diste permiso para las notificaciones."; return; }
        await navigator.serviceWorker.register("sw.js");
        const reg = await navigator.serviceWorker.ready;
        const sub = (await reg.pushManager.getSubscription()) ||
            await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveAUint8(VAPID_PUBLIC_KEY) });
        const j = sub.toJSON();
        const { error } = await db.from("suscripciones").insert({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth });
        if (error && error.code !== "23505") throw error;
        botonNotif.textContent = "Notificaciones activadas";
        mensajeNotif.textContent = "Listo. Te avisaremos cuando haya un evento.";
    } catch (e) {
        console.error(e);
        mensajeNotif.textContent = "No se pudieron activar las notificaciones. Intenta de nuevo.";
    }
});