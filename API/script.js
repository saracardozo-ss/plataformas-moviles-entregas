const lista = document.getElementById("lista");
const tarjetas = document.getElementById("tarjetas");
const listaFeriados = document.getElementById("listaFeriados");
const selectPais = document.getElementById("pais");//busca elementos del html por su id y los guarda en la variabe

const anioActual = new Date().getFullYear();//guara el año actual 
let feriados = [];//arreglo, almacena los feriados de la api
let eventos = JSON.parse(localStorage.getItem("eventos")) || [];//recupera los events guardados en el navegador

const paisesPermitidos = ["AR", "BR", "CL", "UY", "PY", "BO"];//lista de aises permitido

async function cargarPaises() {
  try {
    const res = await fetch("https://date.nager.at/api/v3/AvailableCountries");//pide a la api los paise
    const paises = await res.json();//convierte la respuesta en json
    selectPais.innerText = ""; //limpia el contenido textual antes de llenarlo

    paises.forEach(p => {//recorri cada pais y crea una opcion
      const opt = document.createElement("option");
      opt.value = p.countryCode;//codigo del pais
      opt.innerText = p.name; //nombrte del pais, texto visible
      selectPais.appendChild(opt);//se agrega al select
    });

    const argentina = paises.find(p => p.countryCode === "AR");//busca si AR esta en la lisa y la selecciona por defecto 
    if (argentina) selectPais.value = "AR";

    cargarFeriados(selectPais.value);//llama a cargarferiados de pais seleccionado
  } catch (error) {//si hay error los muestra por sonsola y manda un mensaje de error
    console.error("Error al cargar países:", error);
    selectPais.innerText = "Error al cargar";
  }
}

async function cargarFeriados(codigoPais) {//hace la peticion a la api de los feriados, los guarda en la variable
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${anioActual}/${codigoPais}`);
    feriados = await res.json();
    mostrarProximosFeriados(codigoPais);//muestra los proximos feriados
  } catch (error) {
    console.error("Error al cargar los feriados:", error);
  }
}

async function mostrarProximosFeriados(codigoPais) {
  listaFeriados.innerText = "Cargando...";
  try {//pide proximos feriados del pais
    const res = await fetch(`https://date.nager.at/api/v3/NextPublicHolidays/${codigoPais}`);
    const proximos = await res.json();
    listaFeriados.innerText = "";//limpia la lsta

    proximos.slice(0, 5).forEach(f => {//muestra solo los proximos 5 feriados
      const li = document.createElement("li");// Crea un <li> con fecha y nombre
      li.innerText = `${f.date}: ${f.localName}`;
      listaFeriados.appendChild(li);

      if (paisesPermitidos.includes(codigoPais)) {//solo si el pais esta permitido crea una tarjeta
        crearTarjeta(`🎉 ${f.localName}`, `${f.name} - ${selectPais.options[selectPais.selectedIndex].text}`, f.date);
      }
    });
  } catch {
    listaFeriados.innerText = "Error al cargar feriados";
  }
}
//crea la tarjeta
function crearTarjeta(titulo, descripcion, id) {
  const card = document.createElement("div");
  card.className = "holiday-card";
  card.id = "card-" + id;
  card.innerText = `${titulo}\n${descripcion}`; 
  tarjetas.appendChild(card);//agrega al conteedor
}

async function agregarEvento() {//agrega un evento, obtiene fecha y texto del formulario
  const fecha = document.getElementById("fecha").value;
  const evento = document.getElementById("evento").value.trim();
  const codigoPais = selectPais.value;

  if (!fecha || !evento) { //validacion de campos
    alert("Completá ambos campos");
    return;
  }

  const id = Date.now();//id unico
  const item = document.createElement("li");//crea un elemento li para el evento
  item.id = "item-" + id;
  item.innerText = `${fecha}: ${evento}`;
  const btn = document.createElement("button");//crea un boton
  btn.className = "btn-eliminar";
  btn.innerText = "Eliminar";
  btn.onclick = () => eliminarEvento(id);//al clikear elimina
  item.appendChild(btn);//agrega el boton al li

  lista.appendChild(item);// Agregar <li> a la lista visible

  eventos.push({ id, fecha, evento, pais: codigoPais });//guarda evento en array
  localStorage.setItem("eventos", JSON.stringify(eventos));//lo guarda en localstrong

  crearTarjeta("📌 Evento agendado", `Fecha: ${fecha} - ${evento}`, id);//crea tarjeta del evento

  mostrarFeriadosCercanos(fecha, codigoPais);//carga los feriados cercanos

  document.getElementById("evento").value = "";// Limpia el input de texto
}

async function mostrarFeriadosCercanos(fechaSeleccionada, codigoPais) {
  try {
    const res = await fetch("https://date.nager.at/api/v3/NextPublicHolidaysWorldwide");//pide feriados mundales
    const feriadosMundiales = await res.json();
    const fechaUser = new Date(fechaSeleccionada);// Convierte la fecha del usuario a Date

    feriadosMundiales.forEach(f => {  // Recorre todos los feriados mundiales
      const fechaF = new Date(f.date);//convierte la fecha del feriado
      const diff = Math.abs(fechaF - fechaUser) / (1000 * 60 * 60 * 24);// Calcula diferencia en días
      if (diff <= 3 && paisesPermitidos.includes(codigoPais)) {// Si está a 3 días o menos Y el país es permitido → mostrar tarjeta
        crearTarjeta(`${f.countryCode} - ${f.localName}`, `Feriado mundial cercano (${f.date})`, f.date + f.countryCode);
      }
    });
  } catch (error) {
    console.error("Error al cargar feriados cercanos:", error);
  }
}

function eliminarEvento(id) {
  document.getElementById("item-" + id)?.remove();//elimina el evento
  document.getElementById("card-" + id)?.remove();//elimina la tarjeta
  eventos = eventos.filter(e => e.id !== id);// Quita el evento del array
  localStorage.setItem("eventos", JSON.stringify(eventos));//actualiza localstrong
}

function cargarEventosGuardados() {//Cargar los eventos desde localStorage al iniciar la página
  eventos.forEach(e => {
    const item = document.createElement("li");// Crear <li> para el evento guardado
    item.id = "item-" + e.id;
    item.innerText = `${e.fecha}: ${e.evento}`;
    const btn = document.createElement("button");// Botón eliminar
    btn.className = "btn-eliminar";
    btn.innerText = "Eliminar";
    btn.onclick = () => eliminarEvento(e.id);
    item.appendChild(btn);// Insertar botón y <li>
    lista.appendChild(item);

    crearTarjeta("📌 Evento agendado", `Fecha: ${e.fecha} - ${e.evento}`, e.id);//crea su tarjeta visual
  });
}

function cambiarPais() {
  tarjetas.innerText = "";//limpia tarjetass
  cargarFeriados(selectPais.value);//carga los feriados del nuevo pais
}

cargarPaises();
cargarEventosGuardados();//restaura eventos del usuario
