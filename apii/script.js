const lista = document.getElementById("lista");
const tarjetas = document.getElementById("tarjetas");
const listaFeriados = document.getElementById("listaFeriados");
const selectPais = document.getElementById("pais");

const anioActual = new Date().getFullYear();
let feriados = [];
let eventos = JSON.parse(localStorage.getItem("eventos")) || [];

const limitrofesArgentina = ["CL", "BO", "PY", "UY", "BR"];

async function cargarPaises() {
  try {
    const res = await fetch("https://date.nager.at/api/v3/AvailableCountries");
    const paises = await res.json();
    selectPais.innerText = "";

    paises.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.countryCode;
      opt.innerText = p.name;
      selectPais.appendChild(opt);
    });

    const argentina = paises.find(p => p.countryCode === "AR");
    if (argentina) selectPais.value = "AR";

    cambiarPais();

  } catch (error) {
    console.error("Error al cargar países:", error);
    selectPais.innerText = "Error al cargar";
  }
}

async function cargarFeriadosPais(codigoPais) {
  try {
    tarjetas.innerHTML = "";

    const res = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${anioActual}/${codigoPais}`
    );
    const data = await res.json();

    mostrarListaFeriados(codigoPais);
    renderTarjetas(data, codigoPais);

  } catch (error) {
    console.error("Error:", error);
  }
}

async function cargarFeriadosLimitrofes() {
  tarjetas.innerHTML = "";

  const fechaEvento = new Date(fecha.value);

  for (let cod of limitrofesArgentina) {
    const res = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${anioActual}/${cod}`
    );
    const data = await res.json();

    const procesados = data
      .map(f => {
        const fechaF = new Date(f.date);
        const diffDays = Math.abs(fechaF - fechaEvento) / (1000 * 60 * 60 * 24);
        return { ...f, diffDays };
      })
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 5); //

    const titulo = document.createElement("h3");
    titulo.className = "mt-4 mb-2";
    titulo.textContent = "Feriados de " + cod;
    tarjetas.appendChild(titulo);

    renderTarjetas(procesados, cod);
  }

  mostrarListaFeriados("AR");
}

async function mostrarListaFeriados(codigoPais) {
  listaFeriados.innerHTML = "Cargando...";

  try {
    const res = await fetch(
      `https://date.nager.at/api/v3/NextPublicHolidays/${codigoPais}`
    );
    const proximos = await res.json();

    listaFeriados.innerHTML = "";

    proximos.slice(0, 5).forEach(f => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.innerText = `${f.date}: ${f.localName}`;
      listaFeriados.appendChild(li);
    });

  } catch (err) {
    listaFeriados.innerHTML = "Error al cargar feriados";
  }
}

function renderTarjetas(feriados, codPais) {
  feriados.forEach(f => {
    const col = document.createElement("div");
    col.className = "col-md-4 mb-3";

    col.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-body">
          <h5 class="card-title">${f.localName}</h5>
          <p class="card-text">Fecha: ${f.date}</p>
          <p class="text-muted small">${codPais}</p>
        </div>
      </div>
    `;

    tarjetas.appendChild(col);
  });
}

async function agregarEvento() {
  const fecha = document.getElementById("fecha").value;
  const evento = document.getElementById("evento").value.trim();
  const codigoPais = selectPais.value;

  if (!fecha || !evento) {
    alert("Completá ambos campos");
    return;
  }

  const id = Date.now();

  const item = document.createElement("li");
  item.id = "item-" + id;
  item.className = "list-group-item d-flex justify-content-between";
  item.innerText = `${fecha}: ${evento}`;

  const btn = document.createElement("button");
  btn.className = "btn btn-danger btn-sm";
  btn.innerText = "Eliminar";
  btn.onclick = () => eliminarEvento(id);

  item.appendChild(btn);
  lista.appendChild(item);

  eventos.push({ id, fecha, evento, pais: codigoPais });
  localStorage.setItem("eventos", JSON.stringify(eventos));

  mostrarFeriadosCercanos(fecha, codigoPais);
  document.getElementById("evento").value = "";
}

async function mostrarFeriadosCercanos(fechaSeleccionada, codigoPais) {
  listaFeriados.innerHTML = "Buscando feriados cercanos...";

  try {
    const res = await fetch("https://date.nager.at/api/v3/NextPublicHolidaysWorldwide");
    const feriados = await res.json();

    const fechaUser = new Date(fechaSeleccionada);

    const diffs = feriados.map(f => {
      const fechaF = new Date(f.date);
      const diffDays = Math.abs(fechaF - fechaUser) / (1000 * 60 * 60 * 24);
      return { ...f, diffDays };
    });

    diffs.sort((a, b) => a.diffDays - b.diffDays);

    const top5 = diffs.slice(0, 5);

    listaFeriados.innerHTML = "";
    top5.forEach(f => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.innerText = `${f.date}: ${f.localName} (${f.diffDays.toFixed(0)} días)`;
      listaFeriados.appendChild(li);
    });

  } catch (e) {
    console.error(e);
    listaFeriados.innerHTML = "No se pudieron obtener feriados cercanos.";
  }
}


function eliminarEvento(id) {
  document.getElementById("item-" + id)?.remove();
  eventos = eventos.filter(e => e.id !== id);
  localStorage.setItem("eventos", JSON.stringify(eventos));
}

function cargarEventosGuardados() {
  eventos.forEach(e => {
    const item = document.createElement("li");
    item.id = "item-" + e.id;
    item.className = "list-group-item d-flex justify-content-between";
    item.innerText = `${e.fecha}: ${e.evento}`;

    const btn = document.createElement("button");
    btn.className = "btn btn-danger btn-sm";
    btn.innerText = "Eliminar";
    btn.onclick = () => eliminarEvento(e.id);

    item.appendChild(btn);
    lista.appendChild(item);
  });
}

function cambiarPais() {
  tarjetas.innerHTML = "";

  if (selectPais.value === "AR") {
    cargarFeriadosLimitrofes();
  } else {
    cargarFeriadosPais(selectPais.value);
  }
}

cargarPaises();
cargarEventosGuardados();
