# Aprende MongoDB — laboratorio web (enseñanza y aprendizaje)

Repositorio de referencia: [github.com/profefranciscodiaz/aprendemongodb](https://github.com/profefranciscodiaz/aprendemongodb).

Aplicación educativa con **Node.js**, **Express** y **MongoDB Atlas** para aprender bases de datos documentales **desde nivel básico hasta competencias técnicas y profesionales**: modelado de datos, API REST, **análisis cuantitativo y cualitativo** del motor (coste de consultas, almacenamiento BSON, índices) y **competencias numéricas** (estimaciones, ratios, lectura de estadísticas y gráficos).

El diseño pedagógico sigue la **taxonomía de Bloom revisada** (2001): cada parte del curso se relaciona con niveles cognitivos crecientes, de modo que el estudiante avanza de recordar conceptos a analizar, valorar y proponer soluciones.

---

## Objetivos generales

- Comprender el modelo documental (documentos, colecciones, `_id`, BSON).
- Conectar un proyecto real a **MongoDB Atlas** de forma segura (variables de entorno, sin subir secretos al repositorio).
- Practicar **CRUD** vía interfaz web y vía **API REST** (útil para Postman y clientes HTTP).
- Desarrollar **alfabetización de datos**: interpretar `collStats`, tamaños, índices y salidas de `explain("executionStats")`.
- Reforzar **competencias numéricas**: órdenes de magnitud, proyección de almacenamiento, comparación documentos examinados vs devueltos, lectura de gráficos.

### Diseño visual (neuroaprendizaje y color)

La interfaz usa un tema compartido (`public/css/aprendizaje.css`): fondo **azul-gris cálido** (sin negro puro), **acentos teal** para foco y acciones, **verdes suaves** para éxito y pasos completados, **ámbar** solo como refuerzo puntual. Objetivo: **menor fatiga**, **jerarquía clara** y **contraste legible**. El menú y la **ruta de aprendizaje** (4 pasos) se generan en `public/js/site-nav.js`.

---

## Taxonomía de Bloom y mapa del curso

En la web, el **mapa interactivo** está en [`/curso.html`](http://localhost:3000/curso.html) (archivo `public/curso.html`; la ruta corta `/curso` también funciona tras reiniciar el servidor con la versión actual de `server.js`). Resumen de la correspondencia:

| Nivel Bloom | Enfoque | Dónde se trabaja en esta app |
|-------------|---------|------------------------------|
| **Recordar** | vocabulario (BD, colección, documento, URI, API) | [Inicio](http://localhost:3000/), [Curso](http://localhost:3000/curso.html), glosario del [Simulador](http://localhost:3000/simulador) |
| **Comprender** | qué hace cada verbo HTTP y cada operación frente a MongoDB | Simulador, textos de ayuda en Inicio |
| **Aplicar** | ejecutar conexión, insertar, listar, borrar; enviar JSON por API | **Inicio** (formulario + tabla), **Simulador** (peticiones en vivo) |
| **Analizar** | descomponer planes de consulta, tamaños, distribución BSON, peso de índices | [**Métricas**](http://localhost:3000/metricas): `explain`, `collStats`, gráficos |
| **Evaluar** | juzgar si un índice es adecuado, si hay COLLSCAN costoso, si la proyección de disco es razonable | Métricas (metodología + interpretación + ejercicios reflexivos) |
| **Crear** | diseñar consultas, endpoints o agregaciones nuevas; extender el tablero de gráficos | Tareas sugeridas en `/curso.html` y en Métricas |

---

## Estructura del repositorio

```
proyect_db/
├── README.md                 # Este documento (guía del curso y del proyecto)
├── package.json
├── package-lock.json
├── server.js                 # Servidor Express, rutas HTML, API /api/* y /api/metricas/*
├── .env.example              # Plantilla de variables (copiar a .env)
├── .gitignore                # Excluye node_modules y .env
└── public/
    ├── css/
    │   └── aprendizaje.css   # Tema único: color, tipografía, ruta visual
    ├── js/
    │   └── site-nav.js       # Menú global + pasos de la ruta de aprendizaje
    ├── curso.html            # Paso 1 · Mapa Bloom y orientación
    ├── simulador.html        # Paso 3 · HTTP / API
    └── metricas.html         # Paso 4 · Análisis, explain, Chart.js
```

La página principal (`/`) se genera en `server.js` y usa el mismo CSS/JS. Las rutas HTML desconocidas (`GET`, fuera de `/api/*`) muestran una **404** con el mismo menú y tema. La **ruta sugerida** es **1 → 2 → 3 → 4** (curso → laboratorio → simulador → métricas), visible en la cabecera de cada pantalla.

---

## Requisitos

- [Node.js](https://nodejs.org/) LTS (incluye `npm`).
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas) y una cadena `MONGODB_URI`.

---

## Puesta en marcha

1. Clonar el repositorio e instalar dependencias:

   ```bash
   npm install
   ```

2. Configurar entorno:

   ```bash
   cp .env.example .env
   ```

   Editar `.env` y pegar tu URI de Atlas (usuario, contraseña y cluster). Opcional: `MONGODB_DB_NAME` (por defecto `proyect_db`).

3. Arrancar el servidor:

   ```bash
   npm start
   ```

4. Abrir en el navegador:

   | Recurso | URL |
   |---------|-----|
   | Mapa del curso (Bloom) | http://localhost:3000/curso.html |
   | Laboratorio CRUD | http://localhost:3000/ |
   | Simulador HTTP | http://localhost:3000/simulador |
   | Análisis y gráficos | http://localhost:3000/metricas |

---

## API REST (referencia rápida)

| Método | Ruta | Uso didáctico |
|--------|------|----------------|
| `GET` | `/api/personas` | Listar documentos (JSON) |
| `POST` | `/api/personas` | Crear (`nombre`, `fechaNacimiento`) |
| `DELETE` | `/api/personas/:id` | Borrar por `_id` |
| `GET` | `/api/metricas/resumen` | Estadísticas de colección + muestra BSON |
| `POST` | `/api/metricas/explain` | Cuerpo: `filter`, `sort`, `projection`, `limit` |

---

## Competencias numéricas y análisis de datos

En **Métricas** el estudiante:

- Lee **magnitudes** (`count`, `size`, `avgObjSize`, `storageSize`, `totalIndexSize`).
- Relaciona **promedio del servidor** con **muestra BSON** y con **gráficos** (barras, anillo).
- Interpreta **ratios** (documentos examinados / devueltos; índices / datos).
- **Proyecta** crecimiento con fórmulas explícitas y limitaciones (fragmentación, GridFS).

Estas prácticas enlazan con indicadores usados en **operación y diseño** de bases de datos en entornos profesionales.

---

## Seguridad y buenas prácticas (Recordar + Evaluar)

- No subas `.env` ni contraseñas al repositorio (ya está en `.gitignore`).
- En Atlas, restringe **Network Access** a IPs conocidas cuando sea posible.
- Este proyecto es para **enseñanza**; no incluye autenticación de usuarios finales ni endurecimiento de producción completo.

---

## Licencia y autoría

Proyecto educativo. Puedes adaptar contenidos y ejercicios citando la fuente si lo reutilizas en otros cursos.

Para el mapa visual del recorrido y actividades por nivel Bloom, entra siempre primero en **`/curso.html`** (o **`/curso`** si el servidor está actualizado y reiniciado).
