// url base del backend en Render
const API_BASE = "https://encuesta-backend-vjme.onrender.com";

// url base del frontend en GitHub Pages
const FRONT_BASE = "https://dariabattisti.github.io/encuesta-frontend";

const form = document.getElementById("formParticipante");
const listaDiv = document.getElementById("listaParticipantes");
const btnLimpiar = document.getElementById("btnLimpiar");

const inputCorreo = document.getElementById("correo");
const inputNombre = document.getElementById("nombre");
const inputApellido = document.getElementById("apellido");
const inputEdad = document.getElementById("edad");
const inputGenero = document.getElementById("genero");
const inputSector = document.getElementById("sector");

// cuando la pagina carga pedimos la lista de participantes
window.addEventListener("DOMContentLoaded", cargarParticipantes);

// manejar el envio del formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault(); // evitar recarga

  const correo = inputCorreo.value.trim();
  const nombre = inputNombre.value.trim();
  const apellido = inputApellido.value.trim();
  const edad = inputEdad.value ? parseInt(inputEdad.value, 10) : null;
  const genero = inputGenero.value;
  const sector = inputSector.value.trim();

  if (!correo) {
    alert("El correo es obligatorio.");
    return;
  }

  const nuevo = { correo, nombre, apellido, edad, genero, sector };

  try {
    const resp = await fetch(API_BASE + "/api/participantes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevo),
    });

    const data = await resp.json();

    if (data.error) {
      alert("Error: " + data.error);
    } else {
      alert("Participante registrado. El enlace fue enviado al correo.");
      limpiarFormulario();
      cargarParticipantes(); // recargar lista
    }
  } catch (err) {
    console.error(err);
    alert("Error al conectar con el servidor.");
  }
});

// boton limpiar
btnLimpiar.addEventListener("click", limpiarFormulario);

// limpiar campos del formulario
function limpiarFormulario() {
  inputCorreo.value = "";
  inputNombre.value = "";
  inputApellido.value = "";
  inputEdad.value = "";
  inputGenero.value = "";
  inputSector.value = "";
}

// pedir lista de participantes al backend
async function cargarParticipantes() {
  try {
    const resp = await fetch(API_BASE + "/api/participantes");
    const lista = await resp.json();

    // limpiamos el div
    listaDiv.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {
      listaDiv.textContent = "No hay participantes registrados.";
      return;
    }

    // por cada participante, creamos una linea
    lista.forEach((p) => {
      const fila = document.createElement("div");
      fila.className = "part-item";

      const yaVotoTxt = p.yaVoto == 1 ? "Sí" : "No";

      const texto = document.createElement("div");
      texto.textContent =
        `${p.correo} | ${p.nombre || ""} ${p.apellido || ""}` +
        ` | Edad: ${p.edad || "-"} | Género: ${p.genero || "-"} | ` +
        `Sector: ${p.sector || "-"} | Ya votó: ${yaVotoTxt}`;

      fila.appendChild(texto);

      const info = document.createElement("div");
      info.textContent = "El enlace de votación enviado por correo.";
      info.className = "info-mail";

      fila.appendChild(info);
      listaDiv.appendChild(fila);
    });
  } catch (err) {
    console.error(err);
    listaDiv.textContent = "Error al cargar participantes.";
  }
}
