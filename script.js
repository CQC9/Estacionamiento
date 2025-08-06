// === CONFIGURACIÓN GENERAL ===
const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycby30LIdXsKtp8YKjl2L0gpyP3_6143PMvGFdsrTcRConUdXlRRuTo90hqVCNa5Hmf53fg/exec';  

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
        
        // ✅ SOLUCIÓN 1: Usar no-cors también para GET
        fetch(SHEET_API_URL, {
            method: 'GET',
            mode: 'no-cors'
        })
        .then(response => {
            console.log('Respuesta GET:', response);
            // ⚠️ Con no-cors no podemos leer response.json()
            // Necesitamos usar JSONP como alternativa
            return cargarRegistrosJSONP();
        })
        .catch(error => {
            console.error('Error al cargar registros:', error);
            // Intentar con JSONP como fallback
            return cargarRegistrosJSONP();
        });
    }

    // ✅ SOLUCIÓN 2: Función JSONP como alternativa
    function cargarRegistrosJSONP() {
        return new Promise((resolve, reject) => {
            // Crear función callback global
            const callbackName = 'jsonp_callback_' + Date.now();
            window[callbackName] = function(data) {
                delete window[callbackName];
                document.head.removeChild(script);
                
                console.log('Datos recibidos via JSONP:', data);
                mostrarRegistros(data);
                resolve(data);
            };

            // Crear script tag
            const script = document.createElement('script');
            script.src = SHEET_API_URL + '?callback=' + callbackName;
            script.onerror = () => {
                delete window[callbackName];
                document.head.removeChild(script);
                reject(new Error('Error al cargar JSONP'));
            };
            
            document.head.appendChild(script);
        });
    }

    // ✅ SOLUCIÓN 3: Función simplificada usando fetch directo (método recomendado)
    function cargarRegistrosDirecto() {
        console.log('Cargando registros...');
        
        // Crear un script tag dinámico para evitar CORS
        const script = document.createElement('script');
        const callbackName = 'callback_' + Date.now();
        
        // Definir callback global
        window[callbackName] = function(data) {
            console.log('Datos recibidos:', data);
            mostrarRegistros(data);
            
            // Limpiar
            document.head.removeChild(script);
            delete window[callbackName];
        };
        
        // Configurar script
        script.src = `${SHEET_API_URL}?callback=${callbackName}`;
        script.onerror = function() {
            console.error('Error al cargar registros');
            tablaBody.innerHTML = '<tr><td colspan="12">Error al cargar registros</td></tr>';
            document.head.removeChild(script);
            delete window[callbackName];
        };
        
        document.head.appendChild(script);
    }

    function mostrarRegistros(data) {
        tablaBody.innerHTML = "";
        
        if (!data || data.length === 0) {
            tablaBody.innerHTML = '<tr><td colspan="12">No hay registros disponibles</td></tr>';
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
                    setTimeout(() => cargarRegistrosDirecto(), 100);
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
                        setTimeout(() => cargarRegistrosDirecto(), 1000);
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

    // ✅ Usar la función directa al cargar
    cargarRegistrosDirecto();
}