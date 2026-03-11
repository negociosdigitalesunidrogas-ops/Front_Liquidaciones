const API_URL = "https://tu-backend-en-render.onrender.com";

// --- Control del Loader ---
function showLoader() { document.getElementById('loader').classList.add('active'); }
function hideLoader() { document.getElementById('loader').classList.remove('active'); }

// --- Inicialización ---
window.onload = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'index.html'; 
        return;
    }

    const ahora = new Date();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const anio = ahora.getFullYear();
    document.getElementById('fechaFiltro').value = `${anio}-${mes}`;

    document.getElementById('userName').innerText = localStorage.getItem('nombre_usuario') || "Vendedor";
    switchView('comisiones');
};

async function switchView(view) {
    const tabs = { com: document.getElementById('tab-comisiones'), din: document.getElementById('tab-dinamicas') };
    const views = { com: document.getElementById('view-comisiones'), din: document.getElementById('view-dinamicas') };

    if (view === 'comisiones') {
        tabs.com.classList.add('active'); tabs.din.classList.remove('active');
        views.com.classList.remove('hidden'); views.din.classList.add('hidden');
        await cargarComisiones();
    } else {
        tabs.din.classList.add('active'); tabs.com.classList.remove('active');
        views.din.classList.remove('hidden'); views.com.classList.add('hidden');
        await cargarDinamicas();
    }
}

async function cargarComisiones() {
    showLoader();
    const token = localStorage.getItem('access_token');
    const fecha = document.getElementById('fechaFiltro').value;
    
    try {
        const res = await fetch(`${API_URL}/comisiones/mis-datos?fecha=${fecha}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) logout();
        const data = await res.json();
        
        let total = 0;
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = "";

        if(data.comisiones.length === 0){
            tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--text-muted)">No hay comisiones registradas en este periodo.</td></tr>`;
        } else {
            data.comisiones.forEach(item => {
                total += item.monto;
                tbody.innerHTML += `<tr>
                    <td><i class="fas fa-flask" style="color:var(--primary); margin-right:8px;"></i> <span style="font-weight:600;">${item.laboratorio}</span></td>
                    <td class="text-right" style="font-weight:700;">$ ${item.monto.toLocaleString()}</td>
                </tr>`;
            });
        }

        document.getElementById('mainLabel').innerText = "Total Ganado";
        document.getElementById('totalGeneral').innerText = `$ ${total.toLocaleString()}`;
        document.getElementById('pdv').innerText = data.comisiones[0]?.punto_venta || "Sucursal";
    } catch (e) { 
        console.error(e); 
    } finally {
        hideLoader();
    }
}

async function cargarDinamicas() {
    showLoader();
    const token = localStorage.getItem('access_token');
    const fecha = document.getElementById('fechaFiltro').value;
    
    try {
        const res = await fetch(`${API_URL}/comisiones/mis-dinamicas?fecha=${fecha}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) logout();
        const data = await res.json();
        
        const container = document.getElementById('tableDinamicas');
        container.innerHTML = "";
        let totalFaltanteGlobal = 0;

        // 1. Agrupar productos por Dinámica
        const agrupadas = data.dinamicas.reduce((acc, curr) => {
            if (!acc[curr.nombre]) acc[curr.nombre] = [];
            acc[curr.nombre].push(curr);
            return acc;
        }, {});

        // 2. Renderizar el Acordeón
        for (const [nombreDinamica, productos] of Object.entries(agrupadas)) {
            let faltanteDinamica = 0;
            
            // Construir las filas de productos
            let htmlProductos = productos.map(d => {
                totalFaltanteGlobal += d.faltante;
                faltanteDinamica += d.faltante;
                const color = d.progreso >= 100 ? 'var(--success)' : 'var(--primary)';
                
                return `
                    <div class="product-row">
                        <div>
                            <div class="prod-name">${d.producto}</div>
                        </div>
                        <div class="progress-wrapper-cell">
                            <div class="progress-container">
                                <div class="progress-bar" style="width: ${d.progreso}%; background: ${color}"></div>
                            </div>
                            <small style="color: var(--text-muted)">${d.actual.toLocaleString()} / ${d.meta.toLocaleString()} ${d.unidad}</small>
                        </div>
                        <div class="text-right">
                            <div style="color: ${d.faltante > 0 ? '#e11d48' : 'var(--success)'}; font-weight:700">
                                ${d.faltante > 0 ? 'Faltan ' + d.faltante.toLocaleString() : '¡OK!'}
                            </div>
                            <small style="font-weight:bold; color: var(--text-muted)">${d.progreso.toFixed(1)}%</small>
                        </div>
                    </div>`;
            }).join('');

            // Inyectar el bloque completo del acordeón
            container.innerHTML += `
                <div class="accordion-item">
                    <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
                        <div>
                            <i class="fas fa-chevron-down acc-icon"></i>
                            <strong style="font-size: 1.1rem; color: var(--text-main);">${nombreDinamica}</strong>
                        </div>
                        <div class="text-right">
                            <span style="color: ${faltanteDinamica > 0 ? '#e11d48' : 'var(--success)'}; font-weight: bold;">
                                Faltante: ${faltanteDinamica.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div class="accordion-content">
                        ${htmlProductos}
                    </div>
                </div>`;
        }

        if (Object.keys(agrupadas).length === 0) {
            container.innerHTML = `<div style="text-align:center; padding: 2rem; color:var(--text-muted)">No hay dinámicas activas en este periodo.</div>`;
        }

        document.getElementById('mainLabel').innerText = "Faltante Total Mes";
        document.getElementById('totalGeneral').innerText = totalFaltanteGlobal > 0 ? `- ${totalFaltanteGlobal.toLocaleString()}` : "¡COMPLETO!";
        
    } catch (e) { 
        console.error(e); 
    } finally {
        hideLoader();
    }
}

function cargarDinamicasConFiltro() {
    const vistaActiva = document.getElementById('tab-comisiones').classList.contains('active') ? 'comisiones' : 'dinamicas';
    if(vistaActiva === 'comisiones') {
        cargarComisiones();
    } else {
        cargarDinamicas();
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}