/**
 * Laboratorio educativo: Express + MongoDB Atlas.
 * Propósito: enseñanza progresiva de MongoDB (básico → técnico → análisis profesional),
 * alineada a la taxonomía de Bloom y a competencias numéricas / análisis de datos.
 * Rutas: laboratorio (/), mapa (/curso), simulador (/simulador), métricas (/metricas), cierre Bloom (/cierre).
 */

// Carga variables desde el archivo .env (por ejemplo MONGODB_URI) en process.env
require("dotenv").config();

// Express = framework para crear el servidor HTTP y definir rutas (/, /api/...)
const express = require("express");

// path = rutas de archivos multiplataforma (sirve la página estática del simulador)
const path = require("path");

// MongoClient = conexión al servidor MongoDB; ObjectId = tipo del _id de cada documento
const { MongoClient, ObjectId } = require("mongodb");
// Tamaño aproximado en BSON de un documento (útil para estimación de almacenamiento)
const { calculateObjectSize } = require("bson");

// app es la aplicación Express: aquí se registran rutas y middlewares
const app = express();

// Puerto: usa PORT del entorno (ej. servicios en la nube) o 3000 en local
const port = process.env.PORT || 3000;

// Nombre de la base de datos en Atlas; si no existe en .env, usa "proyect_db"
const DB_NAME = process.env.MONGODB_DB_NAME || "proyect_db";

// Nombre de la colección (similar a una "tabla") donde guardamos personas
const COL_PERSONAS = "personas";

// Middleware: interpreta el cuerpo de peticiones JSON (útil para Postman /api/personas)
app.use(express.json());

// Middleware: interpreta formularios HTML enviados como application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// Rutas HTML explícitas ANTES de express.static para que /, /curso, /simulador, /metricas y /cierre
// siempre respondan (evita conflictos con la resolución de archivos estáticos).

const publicDir = path.join(__dirname, "public");

// Mapa del curso: taxonomía de Bloom, módulos y enlaces por nivel cognitivo
app.get("/curso", (req, res) => {
  res.sendFile(path.join(publicDir, "curso.html"));
});

// Página didáctica: simulador tipo Postman (conceptos HTTP + prueba fetch contra /api)
app.get("/simulador", (req, res) => {
  res.sendFile(path.join(publicDir, "simulador.html"));
});

// Estimación cuantitativa/cualitativa: costo de consulta, BSON, índices, almacenamiento
app.get("/metricas", (req, res) => {
  res.sendFile(path.join(publicDir, "metricas.html"));
});

// Fase 5 Bloom · Evaluar y crear — informe, vídeo y cierre del proyecto
app.get("/cierre", (req, res) => {
  res.sendFile(path.join(publicDir, "cierre.html"));
});

/**
 * Ruta GET "/": página principal con estado de BD, formulario y tabla.
 * req = petición HTTP (query string, cabeceras...); res = respuesta que enviamos al navegador.
 * Definida aquí (antes de express.static) para que siempre se genere este HTML y no un archivo estático.
 */
app.get("/", async (req, res) => {
  const result = await checkMongoConnection();
  const lista = await listarPersonas();
  const statusClass = result.ok ? "ok" : "error";
  const statusText = result.message;
  const hintHtml = result.hint
    ? `<p class="hint">${escapeHtml(result.hint)}</p>`
    : "";

  const guardado = req.query.guardado === "1";
  const eliminado = req.query.eliminado === "1";
  const errForm = req.query.err === "1";
  const errElim = req.query.err === "eliminar";
  let msgBanner = "";
  if (guardado) {
    msgBanner = `<p class="banner ok">Registro guardado en MongoDB.</p>`;
  } else if (eliminado) {
    msgBanner = `<p class="banner ok">Registro eliminado.</p>`;
  } else if (errElim) {
    msgBanner = `<p class="banner error">No se pudo eliminar (id inválido o ya borrado).</p>`;
  } else if (errForm) {
    msgBanner = `<p class="banner error">No se pudo guardar. Revisa los datos y la conexión.</p>`;
  }

  let filas = "";
  if (lista.ok && lista.docs.length > 0) {
    filas = lista.docs
      .map((p) => {
        const fn = p.fechaNacimiento instanceof Date
          ? p.fechaNacimiento.toISOString().slice(0, 10)
          : String(p.fechaNacimiento || "");
        const idStr = p._id ? String(p._id) : "";
        const delForm =
          result.ok && idStr
            ? `<form class="row-del" method="post" action="/personas/eliminar" onsubmit="return confirm('¿Eliminar este registro?');">
            <input type="hidden" name="id" value="${escapeHtml(idStr)}">
            <button type="submit" class="btn-del">Eliminar</button>
          </form>`
            : "—";
        return `<tr><td>${escapeHtml(p.nombre || "")}</td><td>${escapeHtml(fn)}</td><td>${escapeHtml(String(p.edad ?? ""))}</td><td class="td-acc">${delForm}</td></tr>`;
      })
      .join("");
  } else if (!lista.ok && result.ok) {
    filas = `<tr><td colspan="4" class="muted">No se pudieron cargar los registros: ${escapeHtml(lista.error || "")}</td></tr>`;
  } else {
    filas = `<tr><td colspan="4" class="muted">Sin registros todavía.</td></tr>`;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffffff">
  <meta name="description" content="Laboratorio MongoDB: CRUD en vivo, conexión Atlas y misma API que el simulador HTTP y métricas.">
  <title>Laboratorio — MongoDB (CRUD)</title>
  <link rel="stylesheet" href="/css/aprendizaje.css?v=lab2">
</head>
<body class="app-body" data-page="lab">
  <div id="site-header-mount"></div>
  <main class="layout-main layout-main--wide" id="contenido-principal">
    <span class="tag-bloom">Fase 3 · Bloom · Aplicar</span>
    <h1>Laboratorio: personas en MongoDB</h1>
    <p class="lead">
      <strong>Bloom · Aplicar:</strong> ejecutas <strong>CRUD</strong> sobre MongoDB y la API REST con feedback inmediato (después de <strong>Comprender</strong> en el <a href="/simulador">simulador</a>, Fase 2).
      El <a href="/curso.html">mapa</a> describe las cinco fases Bloom; el análisis técnico sigue en <a href="/metricas">métricas</a> (Fase 4) y el informe final en <a href="/cierre">cierre</a> (Fase 5).
    </p>

    <div class="cta-row" role="group" aria-label="Otras fases del curso">
      <a class="cta cta-sec" href="/curso.html">Fase 1 · Mapa</a>
      <a class="cta cta-sec" href="/simulador">Fase 2 · Simulador</a>
      <a class="cta cta-primary" href="/metricas">Fase 4 · Métricas</a>
      <a class="cta cta-sec" href="/cierre">Fase 5 · Cierre</a>
    </div>

    ${msgBanner}

    <div class="card">
      <h2>Estado de la conexión</h2>
      <p class="status ${statusClass}">${escapeHtml(statusText)}</p>
      ${hintHtml}
    </div>

    <div class="card">
      <h2>Registrar persona</h2>
      <form method="post" action="/personas">
        <label for="nombre">Nombre</label>
        <input type="text" id="nombre" name="nombre" required maxlength="120" autocomplete="name" placeholder="Tu nombre">
        <label for="fechaNacimiento">Fecha de nacimiento</label>
        <input type="date" id="fechaNacimiento" name="fechaNacimiento" required>
        <button type="submit" ${result.ok ? "" : "disabled"}>Calcular edad y guardar</button>
      </form>
      ${result.ok ? `<p class="hint">Los datos se guardan en la base <strong>${escapeHtml(DB_NAME)}</strong>, colección <strong>${escapeHtml(COL_PERSONAS)}</strong>.</p>` : `<p class="hint">Conecta Atlas para habilitar el envío.</p>`}
    </div>

    <div class="card">
      <h2>Últimos registros</h2>
      <table class="matrix">
        <thead><tr><th>Nombre</th><th>Fecha nac.</th><th>Edad</th><th>Acciones</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      <p class="api-hint">API REST (Postman): <code>GET</code> <code>/api/personas</code> · <code>POST</code> <code>/api/personas</code> (JSON) · <code>DELETE</code> <code>/api/personas/:id</code></p>
    </div>

    <p class="page-foot">
      Misma cabecera y tema que el resto del curso · <code>GET /</code> genera esta página en el servidor (no es un <code>.html</code> estático).
    </p>
  </main>
  <script src="/js/site-nav.js?v=lab2" defer></script>
</body>
</html>`);
});

// Sirve el resto de archivos estáticos desde public/ (p. ej. favicon si se añade)
app.use(express.static(publicDir));

/**
 * Opciones del driver de MongoDB:
 * - serverSelectionTimeoutMS: tiempo máximo para elegir un servidor del cluster
 * - connectTimeoutMS: tiempo máximo para establecer TCP con el servidor
 */
const mongoClientOptions = {
  serverSelectionTimeoutMS: 15_000,
  connectTimeoutMS: 15_000,
};

// Variable global: una sola instancia de cliente reutilizada (patrón singleton ligero)
let mongoClient = null;

/**
 * Obtiene el cliente MongoDB conectado; si ya existe, lo reutiliza.
 * Si falta MONGODB_URI en .env, lanza error con código NO_URI.
 */
async function getMongoClient() {
  // URI de conexión (mongodb+srv://...) definida en .env
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const err = new Error("MONGODB_URI no está definida");
    err.code = "NO_URI"; // Permite distinguir este error en el catch
    throw err;
  }
  // Solo crea y conecta la primera vez; las siguientes peticiones reutilizan mongoClient
  if (!mongoClient) {
    mongoClient = new MongoClient(uri, mongoClientOptions);
    await mongoClient.connect(); // Handshake con Atlas
  }
  return mongoClient;
}

/**
 * Convierte un error técnico en un objeto para mostrar en la página HTML:
 * mensaje corto + texto de ayuda si fue timeout de red.
 */
function connectionErrorPayload(err) {
  const detail = err.message || String(err);
  const base = `Error de conexión: ${detail}`;
  // ETIMEDOUT = la red no llegó al servidor (firewall, IP no permitida en Atlas, etc.)
  const timedOut =
    err.code === "ETIMEDOUT" ||
    /ETIMEDOUT|timed out/i.test(detail);
  const hint = timedOut
    ? "Suele deberse a la lista de IPs en Atlas o a la red local. En MongoDB Atlas: Network Access → Add IP Address → permite tu IP o 0.0.0.0/0 (solo pruebas). Revisa firewall, antivirus y VPN."
    : null;
  return { ok: false, message: base, hint };
}

/**
 * Comprueba si MongoDB responde enviando el comando "ping" a la base admin.
 */
async function checkMongoConnection() {
  try {
    const client = await getMongoClient();
    // ping es el comando estándar para verificar que el servidor está vivo
    await client.db("admin").command({ ping: 1 });
    return { ok: true, message: "Conectado a MongoDB Atlas", hint: null };
  } catch (err) {
    if (err.code === "NO_URI") {
      return {
        ok: false,
        message: "MONGODB_URI no está definida (crea un archivo .env)",
        hint: null,
      };
    }
    // Si falló la conexión, la siguiente vez se intentará crear el cliente de nuevo
    mongoClient = null;
    return connectionErrorPayload(err);
  }
}

/**
 * Convierte un string "YYYY-MM-DD" (del input type="date") en objeto Date en hora local.
 * Así evitamos que un día se corra por interpretar la fecha en UTC.
 */
function parseFechaNacimiento(isoDate) {
  // Expresión regular: año 4 dígitos, mes y día 2 dígitos
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate).trim());
  if (!m) return null;
  const y = Number(m[1]); // Grupo 1 = año
  const mo = Number(m[2]); // Grupo 2 = mes (1-12)
  const d = Number(m[3]); // Grupo 3 = día
  // En JavaScript los meses van 0-11, por eso mo - 1
  const date = new Date(y, mo - 1, d);
  // Comprobamos que la fecha sea válida (ej. no 31 de febrero)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

/**
 * Calcula la edad en años cumplidos comparando la fecha de nacimiento con hoy.
 */
function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  // Diferencia aproximada de años
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mes = hoy.getMonth() - fechaNacimiento.getMonth();
  // Si aún no cumplió años este año, restamos 1
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edad -= 1;
  }
  return edad;
}

/**
 * Convierte un string hexadecimal de 24 caracteres en ObjectId de MongoDB.
 * Devuelve null si el formato no es válido.
 */
function parseObjectId(idStr) {
  if (!idStr || typeof idStr !== "string") return null;
  const s = idStr.trim();
  // isValid comprueba el formato; no garantiza que el documento exista
  if (!ObjectId.isValid(s)) return null;
  try {
    return new ObjectId(s);
  } catch {
    return null;
  }
}

/**
 * Inserta un documento en la colección con nombre, fecha, edad calculada y marca de tiempo.
 */
async function crearPersona({ nombre, fechaNacimiento }) {
  const edad = calcularEdad(fechaNacimiento);
  if (edad < 0 || edad > 150) {
    throw new Error("Edad fuera de rango");
  }
  const client = await getMongoClient();
  // db(nombreBase).collection(nombreColección) accede a la "tabla"
  const col = client.db(DB_NAME).collection(COL_PERSONAS);
  const result = await col.insertOne({
    nombre,
    fechaNacimiento,
    edad,
    creadoEn: new Date(), // Momento en que se guardó el registro
  });
  return { insertedId: result.insertedId }; // insertedId es el nuevo _id generado por MongoDB
}

/**
 * Borra el documento cuyo _id coincide con el string recibido (desde formulario o API).
 */
async function eliminarPersonaPorId(idStr) {
  const oid = parseObjectId(idStr);
  if (!oid) {
    return { ok: false, code: "BAD_ID", deletedCount: 0 };
  }
  const client = await getMongoClient();
  const col = client.db(DB_NAME).collection(COL_PERSONAS);
  // deleteOne borra como máximo un documento que cumpla el filtro
  const result = await col.deleteOne({ _id: oid });
  return {
    ok: result.deletedCount === 1,
    code: result.deletedCount === 1 ? "OK" : "NOT_FOUND",
    deletedCount: result.deletedCount,
  };
}

/**
 * Escapa caracteres especiales para insertar texto de usuario en HTML de forma segura
 * (evita XSS si alguien escribe <script> en el nombre).
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Lee hasta 50 documentos de la colección, ordenados del más reciente al más antiguo.
 */
async function listarPersonas() {
  try {
    const client = await getMongoClient();
    const col = client.db(DB_NAME).collection(COL_PERSONAS);
    const docs = await col
      .find({}) // {} = sin filtro = todos los documentos
      .sort({ creadoEn: -1 }) // -1 = orden descendente por fecha de creación
      .limit(50)
      .toArray(); // Convierte el cursor en array de objetos JavaScript
    return { ok: true, docs };
  } catch (err) {
    mongoClient = null;
    return { ok: false, docs: [], error: err.message };
  }
}

/**
 * Convierte un documento MongoDB a JSON plano: fechas en ISO string y _id como texto
 * (JSON no tiene tipo Date ni ObjectId nativos).
 */
function serializarPersona(doc) {
  return {
    _id: doc._id ? doc._id.toString() : "",
    nombre: doc.nombre,
    fechaNacimiento:
      doc.fechaNacimiento instanceof Date
        ? doc.fechaNacimiento.toISOString()
        : doc.fechaNacimiento,
    edad: doc.edad,
    creadoEn:
      doc.creadoEn instanceof Date
        ? doc.creadoEn.toISOString()
        : doc.creadoEn,
  };
}

/** Convierte valores del driver (ObjectId, Date, Long…) a JSON seguro. */
function jsonSafe(value) {
  return JSON.parse(JSON.stringify(value, (_k, v) => {
    if (v && typeof v === "object" && typeof v.toHexString === "function") {
      return v.toHexString();
    }
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "bigint") return v.toString();
    return v;
  }));
}

/**
 * Resumen de estadísticas de colección, índices y muestra de tamaños BSON
 * (bases de datos multimedia: útil junto a GridFS y metadatos).
 */
async function obtenerMetricasResumen() {
  const client = await getMongoClient();
  const db = client.db(DB_NAME);
  const col = db.collection(COL_PERSONAS);
  const [collStats, indexes, muestra] = await Promise.all([
    db.command({ collStats: COL_PERSONAS }),
    col.indexes(),
    col
      .find({})
      .sort({ creadoEn: -1 })
      .limit(25)
      .toArray(),
  ]);

  const tamanos = muestra.map((doc) => ({
    id: doc._id ? String(doc._id) : "",
    bsonBytes: calculateObjectSize(doc),
  }));
  const bytesArr = tamanos.map((t) => t.bsonBytes);
  const avgSample =
    bytesArr.length > 0
      ? Math.round(bytesArr.reduce((a, b) => a + b, 0) / bytesArr.length)
      : 0;
  const minSample = bytesArr.length ? Math.min(...bytesArr) : 0;
  const maxSample = bytesArr.length ? Math.max(...bytesArr) : 0;

  const count = Number(collStats.count) || 0;
  const avgObjSize = Number(collStats.avgObjSize) || 0;
  const storageSize = Number(collStats.storageSize) || 0;
  const totalIndexSize = Number(collStats.totalIndexSize) || 0;
  const indexNames = indexes.map((ix) => ix.name).filter(Boolean);
  const tieneIndiceCreadoEn = indexes.some(
    (ix) => ix.key && Object.prototype.hasOwnProperty.call(ix.key, "creadoEn"),
  );
  const tieneIndiceNombre = indexes.some(
    (ix) => ix.key && Object.prototype.hasOwnProperty.call(ix.key, "nombre"),
  );

  const cualitativo = {
    almacenamiento: [
      "`storageSize` incluye espacio asignado en disco para la colección (con fragmentación); `size` es el tamaño lógico de los datos.",
      "En cargas multimedia suele crecer el volumen por campos binarios o referencias GridFS; los metadatos suelen ser BSON pequeños frente a los chunks.",
      `Índices actuales (${indexNames.length}): ocupan aprox. ${totalIndexSize} bytes según el servidor; cada índice mejora lecturas filtradas pero aumenta escritura y disco.`,
    ],
    indexacion: [
      tieneIndiceCreadoEn
        ? "Existe índice sobre `creadoEn`: las consultas ordenadas o filtradas por fecha pueden usar IXSCAN."
        : "No hay índice dedicado a `creadoEn`. Ordenar por fecha puede implicar SORT en memoria o COLLSCAN + sort.",
      tieneIndiceNombre
        ? "Hay índice que incluye `nombre`: búsquedas por nombre exacto pueden aprovecharlo."
        : "Sin índice en `nombre`: búsquedas por nombre recorren más documentos salvo que otro índice sirva de prefijo.",
      "Para texto libre en multimedia (etiquetas, descripciones) valorar índice de texto (`text`) o Atlas Search según el caso.",
      "Evitar índices redundantes que dupliquen prefijos de otros compuestos.",
    ],
  };

  return {
    ok: true,
    dbName: DB_NAME,
    collection: COL_PERSONAS,
    collStats: jsonSafe({
      ns: collStats.ns,
      count,
      size: collStats.size,
      avgObjSize,
      storageSize,
      totalIndexSize,
      indexSizes: collStats.indexSizes,
    }),
    cualitativo,
    indexes: jsonSafe(indexes),
    bsonMuestra: {
      documentos: tamanos,
      promedioMuestraBytes: avgSample,
      minMuestraBytes: minSample,
      maxMuestraBytes: maxSample,
      nota:
        "`calculateObjectSize` estima el tamaño BSON serializado (similar a lo que ocupa el documento en red/disco a nivel de documento).",
    },
    referencias: {
      costoConsulta:
        "Usa «Análisis explain» abajo: `executionStats` muestra documentos/índices examinados y tiempo de ejecución del plan ganador.",
      multimedia:
        "GridFS divide archivos en chunks; suma metadatos (`files`) + chunks y sus índices al proyectar almacenamiento total.",
    },
  };
}

/**
 * Explain de un find sobre la colección personas (solo objetos JSON planos).
 */
async function explainFindPersonas({
  filter = {},
  sort = { creadoEn: -1 },
  projection = null,
  limit = 50,
}) {
  const client = await getMongoClient();
  const col = client.db(DB_NAME).collection(COL_PERSONAS);
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const findOpts =
    projection && typeof projection === "object" && Object.keys(projection).length > 0
      ? { projection }
      : {};
  let cursor = col.find(filter, findOpts);
  if (sort && typeof sort === "object" && Object.keys(sort).length > 0) {
    cursor = cursor.sort(sort);
  }
  cursor = cursor.limit(lim);
  const explanation = await cursor.explain("executionStats");
  return jsonSafe(explanation);
}

function winningPlanHasStage(plan, stageName) {
  let p = plan;
  while (p && typeof p === "object") {
    if (p.stage === stageName) return true;
    if (Array.isArray(p.inputStages)) {
      return p.inputStages.some((s) => winningPlanHasStage(s, stageName));
    }
    p = p.inputStage;
  }
  return false;
}

function pickExplainSummary(explain) {
  const stats = explain.executionStats || {};
  const stages = stats.executionStages || {};
  const winningPlan = explain.queryPlanner?.winningPlan || null;
  const stageName =
    stages.stage ||
    winningPlan?.stage ||
    winningPlan?.inputStage?.stage ||
    null;
  return {
    executionTimeMillis: stats.executionTimeMillis,
    nReturned: stats.nReturned,
    totalDocsExamined: stats.totalDocsExamined,
    totalKeysExamined: stats.totalKeysExamined,
    stageResumen: stageName,
    winningPlanStage: winningPlan?.stage || null,
    tieneCollscan: winningPlanHasStage(winningPlan, "COLLSCAN"),
    tieneIxscan: winningPlanHasStage(winningPlan, "IXSCAN"),
  };
}

// GET /api/metricas/resumen — collStats, índices, tamaños BSON de muestra y notas cualitativas
app.get("/api/metricas/resumen", async (req, res) => {
  try {
    const data = await obtenerMetricasResumen();
    res.json(data);
  } catch (err) {
    mongoClient = null;
    const status = err.code === "NO_URI" ? 503 : 500;
    res.status(status).json({ ok: false, error: err.message });
  }
});

// POST /api/metricas/explain — costo estimado de una consulta find (executionStats)
app.post("/api/metricas/explain", async (req, res) => {
  const body = req.body || {};
  const filter = typeof body.filter === "object" && body.filter !== null ? body.filter : {};
  const sort =
    typeof body.sort === "object" && body.sort !== null ? body.sort : { creadoEn: -1 };
  const projection =
    typeof body.projection === "object" && body.projection !== null
      ? body.projection
      : null;
  const limit = body.limit;

  try {
    const explanation = await explainFindPersonas({
      filter,
      sort,
      projection,
      limit,
    });
    const cualitativo = [];
    const sum = pickExplainSummary(explanation);
    if (sum.totalDocsExamined != null && sum.nReturned != null) {
      const ratio =
        sum.nReturned > 0 ? sum.totalDocsExamined / sum.nReturned : sum.totalDocsExamined;
      cualitativo.push(
        ratio > 10
          ? "Se examinan muchos documentos respecto a los devueltos: valorar índice alineado con el filtro y el orden."
          : "Relación documentos examinados / devueltos razonable para el tamaño actual de la colección.",
      );
    }
    if (sum.tieneCollscan) {
      cualitativo.push(
        "Aparece COLLSCAN: recorrido completo de colección; para escalar o filtrar suele necesitarse índice adecuado.",
      );
    }
    if (sum.tieneIxscan) {
      cualitativo.push("Hay IXSCAN: el plan usa índice para reducir lecturas.");
    }
    res.json({
      ok: true,
      resumen: sum,
      cualitativo,
      explain: explanation,
    });
  } catch (err) {
    mongoClient = null;
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/personas — API REST: devuelve JSON para herramientas como Postman o fetch()
app.get("/api/personas", async (req, res) => {
  try {
    const lista = await listarPersonas();
    if (!lista.ok) {
      return res.status(500).json({ ok: false, error: lista.error || "Error al listar" });
    }
    // res.json() serializa a JSON y pone Content-Type: application/json
    res.json({
      ok: true,
      count: lista.docs.length,
      data: lista.docs.map(serializarPersona),
    });
  } catch (err) {
    mongoClient = null;
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/personas — Crea una persona enviando JSON en el cuerpo (Body → raw → JSON en Postman)
app.post("/api/personas", async (req, res) => {
  const nombre = String(req.body.nombre || "").trim();
  let fechaNacimiento = null;
  const raw = req.body.fechaNacimiento;
  // Acepta "2001-03-15" o una fecha en formato ISO
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    fechaNacimiento = parseFechaNacimiento(raw);
  } else if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      fechaNacimiento = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
      );
    }
  }

  if (!nombre || !fechaNacimiento) {
    return res.status(400).json({
      ok: false,
      error: "nombre y fechaNacimiento requeridos (fecha YYYY-MM-DD o ISO)",
    });
  }

  try {
    const { insertedId } = await crearPersona({ nombre, fechaNacimiento });
    // 201 Created = recurso nuevo creado correctamente
    res.status(201).json({
      ok: true,
      insertedId: insertedId.toString(),
      message: "Creado",
    });
  } catch (err) {
    mongoClient = null;
    const status = err.message === "Edad fuera de rango" ? 400 : 500;
    res.status(status).json({ ok: false, error: err.message });
  }
});

// DELETE /api/personas/:id — :id es un parámetro de ruta (req.params.id), ej. .../api/personas/507f1f77bcf86cd799439011
app.delete("/api/personas/:id", async (req, res) => {
  try {
    const out = await eliminarPersonaPorId(req.params.id);
    if (!out.ok && out.code === "BAD_ID") {
      return res.status(400).json({ ok: false, error: "Id inválido" });
    }
    if (out.deletedCount === 0) {
      return res.status(404).json({ ok: false, error: "No encontrado" });
    }
    res.json({ ok: true, deletedCount: out.deletedCount });
  } catch (err) {
    mongoClient = null;
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /personas — Mismo guardado que la API pero desde el formulario HTML (application/x-www-form-urlencoded)
app.post("/personas", async (req, res) => {
  const nombre = String(req.body.nombre || "").trim();
  const fechaRaw = req.body.fechaNacimiento;
  const fechaNacimiento = parseFechaNacimiento(fechaRaw);

  if (!nombre || !fechaNacimiento) {
    return res.redirect("/?err=1"); // Redirige al listado con ?err=1 para mostrar mensaje
  }

  try {
    await crearPersona({ nombre, fechaNacimiento });
    return res.redirect("/?guardado=1"); // PRG: Post/Redirect/Get evita reenvío accidental del formulario
  } catch (err) {
    mongoClient = null;
    return res.redirect("/?err=1");
  }
});

// POST /personas/eliminar — El botón "Eliminar" envía el id por POST (los formularios HTML no soportan DELETE sin JavaScript)
app.post("/personas/eliminar", async (req, res) => {
  const id = String(req.body.id || "").trim();
  try {
    const out = await eliminarPersonaPorId(id);
    if (!out.ok || out.deletedCount === 0) {
      return res.redirect("/?err=eliminar");
    }
    return res.redirect("/?eliminado=1");
  } catch (err) {
    mongoClient = null;
    return res.redirect("/?err=eliminar");
  }
});

// SIGINT = típicamente Ctrl+C en la terminal: cerramos la conexión a MongoDB antes de salir
process.on("SIGINT", async () => {
  if (mongoClient) {
    await mongoClient.close().catch(() => {});
  }
  process.exit(0);
});

// SIGTERM = señal que envían muchos sistemas al detener un proceso (ej. reinicio del servidor)
process.on("SIGTERM", async () => {
  if (mongoClient) {
    await mongoClient.close().catch(() => {});
  }
  process.exit(0);
});

/** HTML 404 con el mismo menú y tema que el resto del laboratorio */
function sendHtml404(res) {
  res.status(404).type("html").send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffffff">
  <title>No encontrado — Aprende MongoDB</title>
  <link rel="stylesheet" href="/css/aprendizaje.css">
</head>
<body class="app-body" data-page="none">
  <div id="site-header-mount"></div>
  <main class="layout-main layout-main--narrow">
    <div class="card">
      <h1>Página no encontrada</h1>
      <p class="lead">Esa ruta no existe en este proyecto. Usa el menú superior o la ruta de aprendizaje.</p>
      <p class="course-intro">
        <a href="/curso.html">Mapa del curso</a>
        · <a href="/">Laboratorio</a>
        · <a href="/simulador">Simulador</a>
        · <a href="/metricas">Métricas</a>
        · <a href="/cierre">Cierre</a>
      </p>
    </div>
  </main>
  <script src="/js/site-nav.js" defer></script>
</body>
</html>`);
}

app.use((req, res) => {
  const wantsHtml = req.method === "GET" && req.accepts("html") && !req.path.startsWith("/api");
  if (wantsHtml) {
    sendHtml404(res);
    return;
  }
  res.status(404).json({ ok: false, error: "Not found" });
});

// Escucha peticiones HTTP en el puerto indicado; el callback se ejecuta una vez al arrancar
app.listen(port, () => {
  console.log(`Servidor en http://localhost:${port}`);
  console.log(`Mapa del curso (Bloom): http://localhost:${port}/curso.html · alias http://localhost:${port}/curso`);
  console.log(`Laboratorio CRUD: http://localhost:${port}/`);
  console.log(`Simulador HTTP: http://localhost:${port}/simulador`);
  console.log(`Análisis y métricas: http://localhost:${port}/metricas`);
  console.log(`Cierre (Fase 5 Bloom): http://localhost:${port}/cierre`);
});
