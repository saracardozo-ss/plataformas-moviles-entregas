const lista = document.getElementById("lista");
const tarjetas = document.getElementById("tarjetas");
const listaFeriados = document.getElementById("listaFeriados");
const selectPais = document.getElementById("pais");
const anioActual = new Date().getFullYear(); 
let feriados = [];
let eventos = JSON.parse(localStorage.getItem("eventos")) || [];

const paisesPermitidos = ["AR", "BR", "CL", "UY", "PY", "BO"];

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

    cargarFeriados(selectPais.value);
  } catch (error) {
    console.error("Error al cargar países:", error);
    selectPais.innerText = "Error al cargar";
  }
}

async function cargarFeriados(codigoPais) {
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${anioActual}/${codigoPais}`);
    feriados = await res.json();
    mostrarProximosFeriados(codigoPais);
  } catch (error) {
    console.error("Error al cargar los feriados:", error);
  }
}

async function mostrarProximosFeriados(codigoPais) {
  listaFeriados.innerText = "Cargando...";
  try {
    const res = await fetch(`https://date.nager.at/api/v3/NextPublicHolidays/${codigoPais}`);
    const proximos = await res.json();
    listaFeriados.innerText = "";

    proximos.slice(0, 5).forEach(f => {
      const li = document.createElement("li");
      li.innerText = `${f.date}: ${f.localName}`;
      listaFeriados.appendChild(li);

      if (paisesPermitidos.includes(codigoPais)) {
        crearTarjeta(`🎉 ${f.localName}`, `${f.name} - ${selectPais.options[selectPais.selectedIndex].text}`, f.date);
      }
    });
  } catch {
    listaFeriados.innerText = "Error al cargar feriados";
  }
}

function crearTarjeta(titulo, descripcion, id) {
  const card = document.createElement("div");
  card.className = "holiday-card";
  card.id = "card-" + id;
  card.innerText = `${titulo}\n${descripcion}`; 
  tarjetas.appendChild(card);
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
  item.innerText = `${fecha}: ${evento}`;
  const btn = document.createElement("button");
  btn.className = "btn-eliminar";
  btn.innerText = "Eliminar";
  btn.onclick = () => eliminarEvento(id);
  item.appendChild(btn);

  lista.appendChild(item);

  eventos.push({ id, fecha, evento, pais: codigoPais });
  localStorage.setItem("eventos", JSON.stringify(eventos));

  crearTarjeta("📌 Evento agendado", `Fecha: ${fecha} - ${evento}`, id);

  mostrarFeriadosCercanos(fecha, codigoPais);

  document.getElementById("evento").value = "";
}

async function mostrarFeriadosCercanos(fechaSeleccionada, codigoPais) {
  try {
    const res = await fetch("https://date.nager.at/api/v3/NextPublicHolidaysWorldwide");
    const feriadosMundiales = await res.json();
    const fechaUser = new Date(fechaSeleccionada);

    feriadosMundiales.forEach(f => {  
      const fechaF = new Date(f.date);
      const diff = Math.abs(fechaF - fechaUser) / (1000 * 60 * 60 * 24);
      if (diff <= 3 && paisesPermitidos.includes(codigoPais)) {
        crearTarjeta(`${f.countryCode} - ${f.localName}`, `Feriado mundial cercano (${f.date})`, f.date + f.countryCode);
      }
    });
  } catch (error) {
    console.error("Error al cargar feriados cercanos:", error);
  }
}

function eliminarEvento(id) {
  document.getElementById("item-" + id)?.remove();
  document.getElementById("card-" + id)?.remove();
  eventos = eventos.filter(e => e.id !== id);
  localStorage.setItem("eventos", JSON.stringify(eventos));
}

function cargarEventosGuardados() {
  eventos.forEach(e => {
    const item = document.createElement("li");
    item.id = "item-" + e.id;
    item.innerText = `${e.fecha}: ${e.evento}`;
    const btn = document.createElement("button");
    btn.className = "btn-eliminar";
    btn.innerText = "Eliminar";
    btn.onclick = () => eliminarEvento(e.id);
    item.appendChild(btn);
    lista.appendChild(item);

    crearTarjeta("📌 Evento agendado", `Fecha: ${e.fecha} - ${e.evento}`, e.id);
  });
}

function cambiarPais() {
  tarjetas.innerText = "";
  cargarFeriados(selectPais.value);
}

cargarPaises();
cargarEventosGuardados();
