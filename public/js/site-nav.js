/**
 * Menú global + secuencia del curso (5 fases = progresión Bloom).
 */
(function () {
  var STEPS = [
    {
      key: "curso",
      href: "/curso.html",
      num: 1,
      title: "Fase 1 · Recordar",
      blurb: "Mapa · vocabulario · SQL/NoSQL",
    },
    {
      key: "sim",
      href: "/simulador",
      num: 2,
      title: "Fase 2 · Comprender",
      blurb: "Simulador · HTTP · REST",
    },
    {
      key: "lab",
      href: "/",
      num: 3,
      title: "Fase 3 · Aplicar",
      blurb: "Laboratorio · CRUD · API",
    },
    {
      key: "met",
      href: "/metricas",
      num: 4,
      title: "Fase 4 · Analizar y evaluar",
      blurb: "Métricas · explain · decisión",
    },
    {
      key: "cierre",
      href: "/cierre",
      num: 5,
      title: "Fase 5 · Evaluar y crear",
      blurb: "Informe · vídeo · producto final",
    },
  ];

  var GITHUB = "https://github.com/profefranciscodiaz/aprendemongodb";

  function getPageKey() {
    var attr = document.body && document.body.getAttribute("data-page");
    if (attr === "none") return "";
    if (
      attr === "curso" ||
      attr === "lab" ||
      attr === "sim" ||
      attr === "met" ||
      attr === "cierre"
    ) {
      return attr;
    }
    var path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
    if (path === "/curso" || path.indexOf("curso") !== -1) return "curso";
    if (path === "/cierre") return "cierre";
    if (path === "/simulador") return "sim";
    if (path === "/metricas") return "met";
    if (path === "/" || path === "") return "lab";
    return "";
  }

  function stepClass(stepKey, currentKey) {
    if (!currentKey) return "learning-step learning-step--todo";
    var order = { curso: 1, sim: 2, lab: 3, met: 4, cierre: 5 };
    var a = order[stepKey];
    var b = order[currentKey];
    if (stepKey === currentKey) return "learning-step learning-step--current";
    if (a < b) return "learning-step learning-step--done";
    return "learning-step learning-step--todo";
  }

  function render() {
    var mount = document.getElementById("site-header-mount");
    if (!mount) return;

    var pageKey = getPageKey();

    var menuLinks = [
      { href: "/curso.html", label: "Mapa", key: "curso" },
      { href: "/simulador", label: "Simulador", key: "sim" },
      { href: "/", label: "Laboratorio", key: "lab" },
      { href: "/metricas", label: "Métricas", key: "met" },
      { href: "/cierre", label: "Cierre", key: "cierre" },
      { href: GITHUB, label: "GitHub", key: null, external: true },
    ];

    var navHtml =
      '<header class="site-header">' +
      '<div class="site-header__inner">' +
      '<div>' +
      '<a class="site-brand" href="/curso.html">Aprende MongoDB' +
      '<span class="site-brand__sub">5 fases · misma secuencia que Bloom</span></a>' +
      "</div>" +
      '<nav class="site-menu" aria-label="Curso en orden: Recordar → Comprender → Aplicar → Analizar y evaluar → Evaluar y crear">' +
      menuLinks
        .map(function (item) {
          var active =
            item.key && item.key === pageKey ? " site-menu__active" : "";
          var ext = item.external ? " site-menu__external" : "";
          var target = item.external ? ' target="_blank" rel="noopener noreferrer"' : "";
          return (
            '<a href="' +
            item.href +
            '"' +
            target +
            ' class="' +
            active +
            ext +
            '">' +
            item.label +
            "</a>"
          );
        })
        .join("") +
      "</nav>" +
      "</div>" +
      "</header>";

    var stepsHtml =
      '<div class="learning-track">' +
      '<div class="learning-track__inner">' +
      '<p class="learning-track__title">Secuencia Bloom · Fases 1 a 5</p>' +
      '<div class="learning-track__steps" role="list">' +
      STEPS.map(function (s) {
        var cls = stepClass(s.key, pageKey);
        return (
          '<a role="listitem" class="' +
          cls +
          '" href="' +
          s.href +
          '">' +
          '<span class="learning-step__num" aria-hidden="true">' +
          s.num +
          "</span>" +
          '<span class="learning-step__text"><strong>' +
          s.title +
          "</strong><span>" +
          s.blurb +
          "</span></span>" +
          "</a>"
        );
      }).join("") +
      "</div>" +
      "</div>" +
      "</div>";

    var note =
      '<p class="neuro-note" role="note">' +
      "<strong>Diseño instruccional:</strong> cada fase corresponde a un tramo Bloom — no saltar fases la primera vez que recorras el curso. " +
      "El menú y la franja siguen el mismo orden que la tabla del mapa." +
      "</p>";

    mount.innerHTML = navHtml + stepsHtml + note;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
