// === CONFIGURACIÓN GENERAL ===
const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbyGO8YrC53XGw2R2HuwmZ_9PIQ2BK621hJuuk0W6Qc1PDH6pMH2bQQnnCFPUW94_vZ_Kw/exec';  

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
            alert("Empleado registrado correctamente.");
            form.reset();
            document.getElementById("Fecha").value = new Date().toLocaleDateString("es-MX");
        })
        .catch(error => {
            console.error('Error:', error);
            alert("Error al registrar empleado. Intente nuevamente.");
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    });
}

// === TABLA DE REGISTROS ===
if (window.location.pathname.includes("registros.html")) {
    const tablaBody = document.querySelector("#tablaRegistros tbody");

    // ✅ FUNCIÓN PRINCIPAL - SOLO JSONP
    function cargarRegistros() {
        console.log('Cargando registros con JSONP...');
        
        // Limpiar tabla mientras carga
        tablaBody.innerHTML = '<tr><td colspan="12">Cargando registros...</td></tr>';
        
        // Crear nombre único para el callback
        const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Definir el callback global
        window[callbackName] = function(data) {
            console.log('Datos recibidos via JSONP:', data);
            mostrarRegistros(data);
            
            // Limpiar
            document.head.removeChild(script);
            delete window[callbackName];
        };
        
        // Crear y configurar script tag
        const script = document.createElement('script');
        script.src = SHEET_API_URL + '?callback=' + callbackName;
        
        script.onerror = function() {
            console.error('Error al cargar registros via JSONP');
            tablaBody.innerHTML = '<tr><td colspan="12">Error al cargar registros. Verifique la conexión.</td></tr>';
            
            // Limpiar en caso de error
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            if (window[callbackName]) {
                delete window[callbackName];
            }
        };
        
        // Timeout de seguridad (10 segundos)
        setTimeout(() => {
            if (window[callbackName]) {
                console.log('Timeout en carga de registros');
                script.onerror();
            }
        }, 10000);
        
        document.head.appendChild(script);
    }

    function mostrarRegistros(data) {
        console.log('Mostrando registros:', data);
        tablaBody.innerHTML = "";
        
        // Verificar si hay datos
        if (!data || data.length === 0) {
            tablaBody.innerHTML = '<tr><td colspan="12">No hay registros disponibles</td></tr>';
            return;
        }

        // Verificar si hay error en la respuesta
        if (data.status === 'ERROR') {
            console.error('Error del servidor:', data.message);
            tablaBody.innerHTML = '<tr><td colspan="12">Error del servidor: ' + (data.message || 'Error desconocido') + '</td></tr>';
            return;
        }

        data.forEach((fila, index) => {
            const tr = document.createElement("tr");

            const columnas = [
                'Fecha', 'RegistroPatronal', 'Nomina', 'Nombre',
                'Departamento', 'Marca', 'Vehiculo', 'Modelo',
                'Placas', 'TipoCalcomania', 'NumeroCalcomania'
            ];

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
            tdAcciones.style.whiteSpace = "nowrap";
            tdAcciones.style.textAlign = "center";
            tdAcciones.style.padding = "2px";
            
            const editarBtn = crearBoton("✎");
            editarBtn.style.color = "#173ea5";
            const guardarBtn = crearBoton("🖫", true);
            guardarBtn.style.color = "#000000";
            const eliminarBtn = crearBoton("⌫");
            eliminarBtn.style.color = "#FF0000";

            editarBtn.onclick = () => {
                tr.querySelectorAll("input").forEach(i => i.disabled = false);
                editarBtn.disabled = true;
                guardarBtn.disabled = false;
            };

            guardarBtn.onclick = () => {
                const valores = {};
                tr.querySelectorAll("input").forEach(input => {
                    let valor = input.value;
                    
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

                // Deshabilitar botón mientras procesa
                guardarBtn.disabled = true;
                guardarBtn.textContent = "...";

                fetch(SHEET_API_URL, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(valores),
                    mode: 'no-cors'
                }).then(() => {
                    alert("Registro actualizado.");
                    setTimeout(() => cargarRegistros(), 500);
                }).catch(error => {
                    console.error('Error al actualizar:', error);
                    alert("Error al actualizar registro.");
                    guardarBtn.disabled = false;
                    guardarBtn.textContent = "🖫";
                });
            };

            eliminarBtn.onclick = () => {
                if (confirm("¿Eliminar este registro?")) {
                    eliminarBtn.disabled = true;
                    eliminarBtn.textContent = "...";

                    fetch(SHEET_API_URL, {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: "delete", _row: fila._row }),
                        mode: 'no-cors'
                    }).then(() => {
                        alert("Registro eliminado.");
                        setTimeout(() => cargarRegistros(), 500);
                    }).catch(error => {
                        console.error('Error al eliminar:', error);
                        alert("Error al eliminar registro.");
                        eliminarBtn.disabled = false;
                        eliminarBtn.textContent = "⌫";
                    });
                }
            };

            tdAcciones.appendChild(editarBtn);
            tdAcciones.appendChild(guardarBtn);
            tdAcciones.appendChild(eliminarBtn);
            tr.appendChild(tdAcciones);
            tablaBody.appendChild(tr);
        });
    }

    function formatearFecha(fecha) {
        try {
            let fechaObj;
            
            if (typeof fecha === 'string' && fecha.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                return fecha.replace(/\//g, '-');
            }
            
            if (typeof fecha === 'string' && (fecha.includes('T') || fecha.includes('-'))) {
                fechaObj = new Date(fecha);
            } 
            else if (fecha instanceof Date) {
                fechaObj = fecha;
            }
            else {
                fechaObj = new Date(fecha);
            }
            
            if (isNaN(fechaObj.getTime())) {
                return fecha;
            }
            
            const dia = fechaObj.getDate().toString().padStart(2, '0');
            const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
            const año = fechaObj.getFullYear();
            
            return `${dia}-${mes}-${año}`;
            
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return fecha;
        }
    }

    function crearBoton(texto, disabled = false) {
        const btn = document.createElement("button");
        btn.textContent = texto;
        btn.disabled = disabled;
        btn.style.margin = "1px 2px";
        btn.style.padding = "3px 6px";
        btn.style.fontSize = "11px";
        btn.style.display = "inline-block";
        btn.style.verticalAlign = "middle";
        btn.style.minWidth = "25px";
        btn.style.height = "24px";
        btn.style.border = "1px solid #ccc";
        btn.style.backgroundColor = "#f8f9fa";
        btn.style.cursor = "pointer";
        btn.style.borderRadius = "3px";
        return btn;
    }

    // ✅ INICIALIZAR - Cargar registros al inicio
    console.log('Inicializando carga de registros...');
    cargarRegistros();
    
    // ✅ AGREGAR BOTÓN DE RECARGA MANUAL (OPCIONAL)
    const btnRecarga = document.createElement('button');
    btnRecarga.textContent = '🔄 Recargar Registros';
    btnRecarga.style.margin = '10px 0';
    btnRecarga.onclick = cargarRegistros;
    
    // Insertar antes de la tabla si existe
    const tabla = document.querySelector('#tablaRegistros');
    if (tabla && tabla.parentNode) {
        tabla.parentNode.insertBefore(btnRecarga, tabla);
    }
}