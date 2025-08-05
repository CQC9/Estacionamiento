// === CONFIGURACIÓN GENERAL ===
const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbzgJAAleZcH3AqDPrm779IZgKfcIsDbFV8Y-nF5FRZjnEJzHCNze5pGvxOdEZYcxYXxQw/exec';  

// === REGISTRO DE EMPLEADOS === 
if (window.location.pathname.includes("index.html") || window.location.pathname === "/" || window.location.pathname.endsWith("/")) {
    window.onload = () => {
        const today = new Date().toLocaleDateString("es-MX");
        document.getElementById("Fecha").value = today;
    };

    document.getElementById('registro-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const form = e.target;

        // Convertir todos los campos de texto a mayúsculas
        Array.from(form.elements).forEach(el => {
            if (el.tagName === 'INPUT' && el.type === 'text') {
                el.value = el.value.toUpperCase();
            }
        });

        // Mostrar mensaje de carga
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Guardando...';
        submitBtn.disabled = true;
        console.log("TipoCalcomania:", document.getElementById("TipoCalcomania").value);
        console.log("NumeroCalcomania:", document.getElementById("NumeroCalcomania").value);

        const data = {
            action: "add",
            Fecha: document.getElementById("Fecha").value,
            RegistroPatronal: form.RegistroPatronal.value,
            Nomina: form.Nomina.value,
            Nombre: form.Nombre.value,
            Departamento: form.Departamento.value,
            Marca: form.Marca.value,
            Vehiculo: form.Vehiculo.value,
            Modelo: form.Modelo.value,
            Placas: form.Placas.value,
            TipoCalcomania: form.TipoCalcomania.value,
            NumeroCalcomania: form.NumeroCalcomania.value
        };

        console.log('Enviando datos:', data);

        fetch(SHEET_API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            mode: 'no-cors'
        })
        .then(response => {
            console.log('Respuesta recibida:', response);
            // Corroborar que se envio
            alert("Empleado registrado correctamente.");
            form.reset();
            document.getElementById("Fecha").value = new Date().toLocaleDateString("es-MX");
        })
        .catch(error => {
            console.error('Error:', error);
            alert("Error al registrar empleado. Intente nuevamente.");
        })
        .finally(() => {
            // Restaurar botón
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    });
}

// === TABLA DE REGISTROS  ===
if (window.location.pathname.includes("registros.html")) {
    const tablaBody = document.querySelector("#tablaRegistros tbody");

    function cargarRegistros() {
        console.log('Cargando registros...');
        fetch(SHEET_API_URL + '?timestamp=' + Date.now())
            .then(res => {
            console.log('Respuesta GET:', res);
            return res.json();
            })
            .then(data => {
            console.log('Datos recibidos:', data);
            tablaBody.innerHTML = "";
            if (!data || data.length === 0) {
                tablaBody.innerHTML = '<tr><td colspan="12">No hay registros disponibles</td></tr>';
                return;
            }

        data.forEach((fila, index) => {
            const tr = document.createElement("tr");

          // === CAMBIO AQUÍ ===
          // Se corrigió el orden y la inclusión de todas las columnas.
          // Antes faltaban las dos últimas columnas.
            const columnas = [
                'Fecha', 'RegistroPatronal', 'Nomina', 'Nombre',
                'Departamento', 'Marca', 'Vehiculo', 'Modelo',
                'Placas', 'TipoCalcomania', 'NumeroCalcomania'
            ];
          // === FIN DEL CAMBIO ===

            columnas.forEach(col => {
                const td = document.createElement("td");
                const input = document.createElement("input");
                let valor = fila[col] || '';

                    if (col === 'Fecha' && valor) {
                        valor = formatearFecha(valor);
                    }

                    input.value = valor;
                    input.disabled = true;
                    input.dataset.col = col;
                    td.appendChild(input);
                    tr.appendChild(td);
                    });
                    // Botones de acción
                    const tdAcciones = document.createElement("td");
                    tdAcciones.style.whiteSpace = "nowrap"; // Evitar que se rompan las líneas
                    tdAcciones.style.textAlign = "center"; // Centrar los botones
                    tdAcciones.style.padding = "2px"; // Reducir padding de la celda
                    const editarBtn = crearBoton("✎");
                    editarBtn.style.color="#173ea5";
                    const guardarBtn = crearBoton("🖫", true);
                    guardarBtn.style.color="#000000"
                    const eliminarBtn = crearBoton("⌫");
                    eliminarBtn.style.color="#FF0000";

                    editarBtn.onclick = () => {
                        tr.querySelectorAll("input").forEach(i => i.disabled = false);
                        editarBtn.disabled = true;
                        guardarBtn.disabled = false;
                    };

                    guardarBtn.onclick = () => {
                        const valores = {};
                        tr.querySelectorAll("input").forEach(input => {
                            let valor = input.value;
                            
                            // Si es el campo fecha y está en formato DD-MM-AAAA, convertir para envío
                            if (input.dataset.col === 'Fecha' && valor && valor.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
                                const partes = valor.split('-');
                                const dia = partes[0];
                                const mes = partes[1];
                                const año = partes[2];
                                valor = `${dia}/${mes}/${año}`;
                            }
                            
                            valores[input.dataset.col] = valor;
                        });
                        valores._row = fila._row;
                        valores.action = "edit";

                        fetch(SHEET_API_URL, {
                            method: "POST",
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(valores),
                            mode: 'no-cors'
                        }).then(() => {
                            alert("Registro actualizado.");
                            setTimeout(() => cargarRegistros(), 10); // Esperar un poco antes de recargar
                        }).catch(error => {
                            console.error('Error al actualizar:', error);
                            alert("Error al actualizar registro.");
                        });
                    };

                    eliminarBtn.onclick = () => {
                        if (confirm("¿Eliminar este registro?")) {
                            fetch(SHEET_API_URL, {
                                method: "POST",
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: "delete", _row: fila._row }),
                                mode: 'no-cors'
                            }).then(() => {
                                alert("Registro eliminado.");
                                setTimeout(() => cargarRegistros(), 1000);
                            }).catch(error => {
                                console.error('Error al eliminar:', error);
                                alert("Error al eliminar registro.");
                            });
                        }
                    };

                    tdAcciones.appendChild(editarBtn);
                    tdAcciones.appendChild(guardarBtn);
                    tdAcciones.appendChild(eliminarBtn);
                    tr.appendChild(tdAcciones);
                    tablaBody.appendChild(tr);
                });
            })
            .catch(error => {
                console.error('Error al cargar registros:', error);
                tablaBody.innerHTML = '<tr><td colspan="12">Error al cargar registros</td></tr>';
            });
    }

    function formatearFecha(fecha) {
        try {
            let fechaObj;
            
            // Si la fecha ya está en formato DD/MM/AAAA, la devolvemos tal como está
            if (typeof fecha === 'string' && fecha.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                return fecha.replace(/\//g, '-'); // Cambiar / por -
            }
            
            // Si es una fecha ISO (AAAA-MM-DDTHH:mm:ss.sssZ) o similar
            if (typeof fecha === 'string' && (fecha.includes('T') || fecha.includes('-'))) {
                fechaObj = new Date(fecha);
            } 
            // Si es un objeto Date
            else if (fecha instanceof Date) {
                fechaObj = fecha;
            }
            // Si es un string de fecha en otro formato
            else {
                fechaObj = new Date(fecha);
            }
            
            // Verificar si la fecha es válida
            if (isNaN(fechaObj.getTime())) {
                return fecha; // Devolver original si no se puede convertir
            }
            
            // Formatear a DD-MM-AAAA
            const dia = fechaObj.getDate().toString().padStart(2, '0');
            const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
            const año = fechaObj.getFullYear();
            
            return `${dia}-${mes}-${año}`;
            
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return fecha; // Devolver original en caso de error
        }
    }

    
function crearBoton(texto, disabled = false) {
    const btn = document.createElement("button");
    btn.textContent = texto;
    btn.disabled = disabled;
    btn.style.margin = "1px 2px"; // Reducir margen vertical
    btn.style.padding = "3px 6px"; // Reducir padding
    btn.style.fontSize = "11px"; // Tamaño de fuente más pequeño
    btn.style.display = "inline-block"; // Asegurar que estén en línea
    btn.style.verticalAlign = "middle"; // Alinear verticalmente
    btn.style.minWidth = "25px"; // Ancho mínimo consistente
    btn.style.height = "24px"; // Altura fija para uniformidad
    btn.style.border = "1px solid #ccc";
    btn.style.backgroundColor = "#f8f9fa";
    btn.style.cursor = "pointer";
    btn.style.borderRadius = "3px";
    return btn;
}

    // Cargar registros al inicio
    cargarRegistros();
}