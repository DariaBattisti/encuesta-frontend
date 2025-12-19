// URL del backend
const API_BASE = "https://encuesta-backend-vjme.onrender.com";

const estadoDiv = document.getElementById("estado");
const formVoto = document.getElementById("formVoto");
const bloqueVoto = document.getElementById("bloqueVoto");

// leer correo desde la URL
const params = new URLSearchParams(window.location.search);
const correo = params.get("correo");

// si no viene correo en la URL no se puede votar
if (!correo) {
  estadoDiv.textContent = "Error: este enlace no contiene el correo del participante.";
} else {
  estadoDiv.textContent = "Validando correo, por favor espere...";
  validarParticipante();
}

// validar si el correo está registrado y si puede votar
async function validarParticipante() {
  try {
    const resp = await fetch(
      API_BASE + "/api/participantePorCorreo?correo=" + encodeURIComponent(correo)
    );
    const data = await resp.json();

    if (!data.permitido) {
      // no puede votar: correo no registrado o ya votó
      estadoDiv.textContent = "No puede votar: " + (data.motivo || "motivo desconocido.");
      formVoto.style.display = "none";
      return;
    }

    // puede votar
    estadoDiv.textContent = "Correo válido. Complete su intención de voto.";
    await cargarCargosYAspirantes();
    formVoto.style.display = "block";
  } catch (err) {
    console.error(err);
    estadoDiv.textContent = "Error al validar el correo.";
  }
}

// Pedir cargos y aspirantes al backend y construir el formulario
async function cargarCargosYAspirantes() {
  try {
    const resp = await fetch(API_BASE + "/api/cargosConAspirantes");
    const lista = await resp.json();

    bloqueVoto.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {
      bloqueVoto.textContent = "No hay cargos configurados.";
      return;
    }

    lista.forEach((cargo) => {
      const bloque = document.createElement("div");
      bloque.className = "cargo-block";

      const titulo = document.createElement("h4");
      titulo.textContent = cargo.nombre;
      bloque.appendChild(titulo);

      // cada cargo tendra un grupo de radios
      cargo.aspirantes.forEach((asp) => {
        const label = document.createElement("label");
        label.className = "opcion-linea";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "cargo_" + cargo.idCargo; // grupo por cargo
        radio.value = asp.id; // id del aspirante

        // texto al lado del radio
        const span = document.createElement("span");
        span.textContent = asp.nombre;

        label.appendChild(radio);
        label.appendChild(span);
        bloque.appendChild(label);
      });

      bloqueVoto.appendChild(bloque);
    });
  } catch (err) {
    console.error(err);
    bloqueVoto.textContent = "Error al cargar cargos y candidatos.";
  }
}

// Manejar el envio del voto
formVoto.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    // saber que cargos hay para leer sus radios
    const resp = await fetch(API_BASE + "/api/cargosConAspirantes");
    const lista = await resp.json();

    const votos = [];

    lista.forEach((cargo) => {
      const nombreGrupo = "cargo_" + cargo.idCargo;
      const seleccionado = document.querySelector(
        `input[name="${nombreGrupo}"]:checked`
      );

      if (!seleccionado) return;

      const idAspirante = parseInt(seleccionado.value, 10);

      votos.push({
        idCargo: cargo.idCargo,
        idAspirante: idAspirante,
      });
    });

    if (votos.length === 0) {
      alert("Debe seleccionar al menos una opción antes de enviar su voto.");
      return;
    }

    const body = {
      correo: correo,
      votos: votos,
    };

    const respVoto = await fetch(API_BASE + "/api/votar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await respVoto.json();

    if (data.error) {
      estadoDiv.textContent = "No se pudo registrar el voto: " + data.error;
    } else {
      estadoDiv.textContent = data.mensaje || "Voto registrado correctamente.";
      formVoto.style.display = "none";
    }
  } catch (err) {
    console.error(err);
    estadoDiv.textContent = "Error al enviar el voto.";
  }
});
