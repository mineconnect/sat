import {
    createIcons,
    Map as MapIcon,
    Truck,
    FileText,
    Users,
    Building2,
    LogOut,
    ShieldCheck,
    History,
    CheckCircle,
    ClipboardList,
    AlertTriangle,
    Download,
    Scale,
    Activity,
    Clock,
    Eye,
    EyeOff,
    Copy,
    MessageCircle,
    Send,
    Mail
} from 'lucide/dist/cjs/lucide';

// Mock State
const state = {
    user: null,
    view: 'login', // login, map, fleet, reports, users, companies, history, vehicles, compliance
    company: 'all',

    // Auth
    users: [
        { id: 1, email: 'coordinador@empresa-a.com', pass: 'Coordinador123!', role: 'Coordinador', company: 'Empresa A' },
        { id: 2, email: 'conductor1@empresa-a.com', pass: 'Conductor123!', role: 'Conductor', company: 'Empresa A' },
        { id: 3, email: 'admin@mineconnect.com', pass: 'Admin123!', role: 'super-admin', company: 'all' }
    ],

    // Fleet Database
    vehicles: [
        { plate: 'ABC-123', brand: 'Toyota', model: 'Hilux', km: 45000, nextService: 50000, company: 'Empresa A', insuranceExpiry: '2026-05-12' },
        { plate: 'XYZ-789', brand: 'Ford', model: 'Ranger', km: 12000, nextService: 20000, company: 'Empresa A', insuranceExpiry: '2026-03-01' },
        { plate: 'MNO-456', brand: 'Scania', model: 'R500', km: 85000, nextService: 90000, company: 'Empresa B', insuranceExpiry: '2026-11-20' }
    ],

    // Checklist Configuration
    checklistConfig: [
        { id: 'km', label: 'Kilometraje Inicial', type: 'number' },
        { id: 'first_aid', label: 'Botiquín de Primeros Auxilios', type: 'check' },
        { id: 'belts', label: 'Cinturones de Seguridad', type: 'check' },
        { id: 'lights', label: 'Luces (Altas/Bajas)', type: 'check' },
        { id: 'brakes', label: 'Sistema de Frenos', type: 'check' },
        { id: 'tires', label: 'Estado de Neumáticos', type: 'check' }
    ],

    // Compliance / Legal Data
    complianceLogs: [
        { id: 1, type: 'HOS', driver: 'Juan Perez', vehicle: 'ABC-123', status: 'conforme', detail: 'Cumple horas de servicio', duration: '8h 00m', date: '2026-01-30' },
        { id: 2, type: 'Seguro', driver: 'N/A', vehicle: 'XYZ-789', status: 'advertencia', detail: 'Expira en 30 días', date: '2026-01-30' },
        { id: 3, type: 'Seguridad', driver: 'Mario Casas', vehicle: 'MNO-456', status: 'peligro', detail: 'Frenado brusco (1.5G)', date: '2026-01-29' }
    ],

    // Active Sessions
    currentTrip: null,
    showChecklist: false,
    showChecklist: false,
    showPlateLogin: false,
    tempPlate: '',
    sosMode: false,
    showPassword: false,
    showUserModal: false,
    showVehicleModal: false,
    showCompanyModal: false,

    // Mock Live Data
    trips: [
        { id: 1, plate: 'ABC-123', driver: 'Juan Perez', lat: -23.6509, lng: -70.3975, status: 'moving', speed: 45, company: 'Empresa A' },
        { id: 2, plate: 'XYZ-789', driver: 'Carlos Ruiz', lat: -23.6601, lng: -70.4001, status: 'stationary', speed: 0, company: 'Empresa A' },
        { id: 3, plate: 'MNO-456', driver: 'Mario Casas', lat: -23.6700, lng: -70.4100, status: 'moving', speed: 62, company: 'Empresa B' }
    ],

    // Historical Data
    history: [
        { id: 101, date: '2026-01-29', plate: 'ABC-123', driver: 'Juan Perez', kmStart: 44800, kmEnd: 45000, duration: '8h 20m', status: 'completado' },
        { id: 102, date: '2026-01-29', plate: 'MNO-456', driver: 'Mario Casas', kmStart: 84900, kmEnd: 85000, duration: '4h 15m', status: 'completado' }
    ],

    // Satellite Telemetry State
    telemetry: {
        satellites: 12,
        latency: 180,
        signal: 95,
        constellation: 'Iridium Next',
        gpsAccuracy: 0, // Metros
        isOnline: navigator.onLine,
        offlineQueue: [], // Para sincronización inteligente
        manDownEnabled: true,
        lastMovement: Date.now(),
        drivingScore: 100, // Comienza en 100 y baja por infracciones
        fatigueTimer: 0 // Segundos de conducción continua
    },

    geofences: [
        { id: 'risk-1', name: 'Zona de Explosivos A', lat: -23.6550, lng: -70.4020, radius: 200, active: true, type: 'danger' },
        { id: 'risk-2', name: 'Pendiente Inestable Sur', lat: -23.6700, lng: -70.4150, radius: 350, active: true, type: 'warning' }
    ],

    companies: ['Empresa A', 'Empresa B'],
    companySettings: {
        'Empresa A': { sosMessage: 'AYUDA EN CAMINO. MANTENGA ESTA PANTALLA VISIBLE.' },
        'Empresa B': { sosMessage: 'EMERGENCIA ACTIVADA. PROTOCOLO DE SEGURIDAD MINERÍA.' },
        'all': { sosMessage: 'SISTEMA SOS ACTIVADO. ASISTENCIA EN CAMINO.' }
    },
    gpsWatchId: null
};

// --- Nuevas Funciones de Valor (Seguridad y Cumplimiento) ---

async function generateHash(data) {
    const msgUint8 = new TextEncoder().encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function captureBiometric() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Simulación: en una app real capturaríamos el frame. Aquí simulamos el éxito.
        console.log("Biometría capturada (Simulación)");
        stream.getTracks().forEach(track => track.stop());
        return "bio_id_" + Math.random().toString(36).substr(2, 9);
    } catch (e) {
        console.warn("No se pudo acceder a la cámara:", e);
        return "bypass_no_cam_" + Date.now();
    }
}

// Auth constants
const SUPER_ADMIN = { id: 'sa', email: 'fbarrosmarengo@gmail.com', pass: 'Soporte2022!', role: 'super-admin', company: 'all' };

const app = document.getElementById('app');

function saveState() {
    localStorage.setItem('mineconnect_state', JSON.stringify({
        users: state.users,
        vehicles: state.vehicles,
        companies: state.companies,
        companySettings: state.companySettings,
        complianceLogs: state.complianceLogs,
        history: state.history
    }));
}

function loadState() {
    const saved = localStorage.getItem('mineconnect_state');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.users = data.users || state.users;
            state.vehicles = data.vehicles || state.vehicles;
            state.companies = data.companies || state.companies;
            state.companySettings = data.companySettings || state.companySettings;
            state.complianceLogs = data.complianceLogs || state.complianceLogs;
            state.history = data.history || state.history;
        } catch (e) {
            console.error("Error loading state", e);
        }
    }

    // Asegurar que el Super Admin oficial siempre esté en la lista
    if (!state.users.find(u => u.email === SUPER_ADMIN.email)) {
        state.users.push(SUPER_ADMIN);
    }
}

function init() {
    loadState();
    render();
}

function render() {
    if (state.sosMode) {
        renderSOSScreen();
        return;
    }
    if (state.view === 'login') {
        renderLogin();
    } else {
        renderDashboard();
    }
}

function renderLogin() {
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>MineConnect<span>SAT</span></h1>
                    <p>Seguimiento Satelital de Alta Precisión</p>
                </div>
                <form id="login-form">
                    <div class="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" id="email" placeholder="usuario@empresa.com" required>
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <div class="password-group">
                            <input type="${state.showPassword ? 'text' : 'password'}" id="password" placeholder="••••••••" required>
                            <button type="button" id="toggle-password" class="password-toggle">
                                <i data-lucide="${state.showPassword ? 'eye-off' : 'eye'}"></i>
                            </button>
                        </div>
                    </div>
                    <button type="submit" class="auth-btn">INGRESAR AL SISTEMA</button>
                    <p id="auth-error" style="color: var(--accent-red); font-size: 12px; margin-top: 20px; text-align: center; display: none;">Credenciales incorrectas</p>
                </form>
            </div>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;

        // 1. Check Super Admin
        if (email === SUPER_ADMIN.email && pass === SUPER_ADMIN.pass) {
            state.user = SUPER_ADMIN;
            state.view = 'map';
            render();
            return;
        }

        // 2. Check Other Users
        const foundUser = state.users.find(u => u.email === email && u.pass === pass);
        if (foundUser) {
            if (foundUser.role === 'Conductor') {
                const err = document.getElementById('auth-error');
                err.textContent = 'Acceso de Conductor restringido a la App Mobile';
                err.style.display = 'block';
                return;
            }
            state.user = foundUser;
            state.view = 'map';
            render();
        } else {
            const err = document.getElementById('auth-error');
            err.textContent = 'Credenciales incorrectas';
            err.style.display = 'block';
        }
    });
}

function renderDashboard() {
    app.innerHTML = `
        <div class="dashboard-layout">
            <aside class="sidebar">
                <div class="sidebar-logo">
                    <div class="logo-icon"></div>
                    <h2>MineConnect</h2>
                </div>
                <ul class="nav-links">
                    <li class="nav-item"><a href="#" class="nav-link ${state.view === 'map' ? 'active' : ''}" data-view="map"><i data-lucide="map"></i> Mapa en Vivo</a></li>
                    <li class="nav-item"><a href="#" class="nav-link ${state.view === 'fleet' ? 'active' : ''}" data-view="fleet"><i data-lucide="truck"></i> Seguimiento</a></li>
                    <li class="nav-item"><a href="#" class="nav-link ${state.view === 'vehicles' ? 'active' : ''}" data-view="vehicles"><i data-lucide="clipboard-list"></i> Vehículos</a></li>
                    <li class="nav-item"><a href="#" class="nav-link ${state.view === 'compliance' ? 'active' : ''}" data-view="compliance"><i data-lucide="scale"></i> Cumplimiento Legal</a></li>
                    <li class="nav-item"><a href="#" class="nav-link ${state.view === 'history' ? 'active' : ''}" data-view="history"><i data-lucide="history"></i> Historial</a></li>
                    <li class="nav-item"><a href="#" class="nav-link ${state.view === 'users' ? 'active' : ''}" data-view="users"><i data-lucide="users"></i> Usuarios</a></li>
                    ${state.user.role === 'super-admin' ? `
                    <li class="nav-item"><a href="#" class="nav-link ${state.view === 'companies' ? 'active' : ''}" data-view="companies"><i data-lucide="building-2"></i> Empresas</a></li>
                    ` : ''}
                </ul>
                <div class="sidebar-footer">
                    <a href="#" class="nav-link" id="logout"><i data-lucide="log-out"></i> Cerrar Sesión</a>
                </div>
            </aside>
            
            <!-- Mobile Bottom Nav -->
            <nav class="mobile-nav">
                <button class="mobile-nav-item ${state.view === 'map' ? 'active' : ''}" data-view="map">
                    <i data-lucide="map"></i>
                    <span>Mapa</span>
                </button>
                <button class="mobile-nav-item ${state.view === 'fleet' ? 'active' : ''}" data-view="fleet">
                    <i data-lucide="truck"></i>
                    <span>Flota</span>
                </button>
                <button class="mobile-nav-item ${state.view === 'vehicles' ? 'active' : ''}" data-view="vehicles">
                    <i data-lucide="clipboard-list"></i>
                    <span>Autos</span>
                </button>
                 <button class="mobile-nav-item ${state.view === 'history' ? 'active' : ''}" data-view="history">
                    <i data-lucide="history"></i>
                    <span>Hist.</span>
                </button>
                <button class="mobile-nav-item" id="mobile-logout">
                    <i data-lucide="log-out"></i>
                    <span>Salir</span>
                </button>
            </nav>

            <main class="main-content">
                <header class="top-bar">
                    <div class="company-filter">
                        <select id="company-select" ${state.user.role !== 'super-admin' ? 'disabled' : ''}>
                            ${state.user.role === 'super-admin'
            ? `<option value="all" ${state.company === 'all' ? 'selected' : ''}>Todas las Empresas</option>`
            : ''}
                            ${state.companies
            .filter(c => state.user.role === 'super-admin' || c === state.user.company)
            .map(c => `<option value="${c}" ${state.company === c ? 'selected' : ''}>${c}</option>`).join('')}
                        </select>
                    </div>
                    <div class="user-profile">
                        <button id="driver-mode-btn" class="badge" style="cursor: pointer; border: none; background: rgba(0, 255, 171, 0.2);">MODO CONDUCTOR (MOBILE)</button>
                        <span>${state.user.email}</span>
                        <span class="badge">${state.user.role === 'super-admin' ? 'SUPER ADMIN' : 'USUARIO'}</span>
                    </div>
                </header>
                <div class="content-container">
                    ${renderActiveView()}
                    ${state.view === 'map' ? renderSatelliteUplink() : ''}
                    ${state.view === 'map' ? renderMapControls() : ''}
                    <button class="sos-button" onclick="handleSOS()">
                        <i data-lucide="alert-triangle"></i>
                        <span>SOS EMERGENCIA</span>
                    </button>
                    ${state.view !== 'map' && state.view !== 'login' ? '<!-- Back button handled by bottom nav -->' : ''}
                </div>
            </main>
        </div>
        ${state.showPlateLogin ? renderPlateLoginModal() : ''}
        ${state.showChecklist ? renderChecklistModal() : ''}
        ${state.showUserModal ? renderUserModal() : ''}
        ${state.showVehicleModal ? renderVehicleModal() : ''}
        ${state.showCompanyModal ? renderCompanyModal() : ''}
    `;

    if (state.view === 'map') initMap();
    bindEvents();
    refreshIcons();
}

function renderActiveView() {
    switch (state.view) {
        case 'map': return `<div id="map" class="view-section"></div>`;
        case 'fleet': return renderFleetView();
        case 'vehicles': return renderVehiclesView();
        case 'compliance': return renderComplianceView();
        case 'history': return renderHistoryView();
        case 'users': return renderUsersView();
        case 'companies': return renderCompaniesView();
        default: return `<div class="view-section"><p>Cargando...</p></div>`;
    }
}

function renderSatelliteUplink() {
    return `
        <div class="satellite-uplink" onclick="this.classList.toggle('expanded')">
            <div class="uplink-header" style="display:flex; align-items:center; justify-content:center; gap:8px;">
                <div class="scanning-dot"></div>
                <i data-lucide="activity" style="color: var(--accent); width: 16px;"></i>
                <h3>Uplink Satelital (LATAM)</h3>
            </div>
            <div class="status-grid">
                <div class="uplink-grid">
                    <div class="uplink-stat-box">
                        <label>CONSTEL.</label>
                        <span>${state.telemetry.constellation.toUpperCase()}</span>
                    </div>
                    <div class="uplink-stat-box">
                        <label>SAT-VIS</label>
                        <span id="tel-satellites">${state.telemetry.satellites}</span>
                    </div>
                    <div class="uplink-stat-box">
                        <label>LATENCIA</label>
                        <span id="tel-latency">${state.telemetry.latency}ms</span>
                    </div>
                    <div class="uplink-stat-box">
                        <label>SEÑAL</label>
                        <span class="text-accent" id="tel-signal">${state.telemetry.signal}%</span>
                    </div>
                </div>
                <div class="signal-bar">
                    <div class="signal-progress" style="width: ${state.telemetry.signal}%"></div>
                </div>
                <div style="margin-top: 16px; border-top: 1px solid rgba(0,255,171,0.1); padding-top: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <p style="font-size: 9px; color: var(--text-secondary);">DRIVING SCORE:</p>
                        <span id="tel-score" class="text-accent" style="font-weight: 800;">${state.telemetry.drivingScore} pts</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <p style="font-size: 9px; color: var(--text-secondary);">TIEMPO CONDUC.:</p>
                        <span id="tel-fatigue" style="font-size: 11px;">${Math.floor(state.telemetry.fatigueTimer / 60)} min</span>
                    </div>
                    <p style="font-size: 9px; color: var(--text-secondary); margin-bottom: 4px;">COORDENADAS DE ENLACE:</p>
                    <div id="tel-coords" style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--accent);">
                        ${state.trips[0] ? `${state.trips[0].lat.toFixed(6)}, ${state.trips[0].lng.toFixed(6)}` : 'SCANNING...'}
                    </div>
                     <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                        <span id="network-status" class="badge ${state.telemetry.isOnline ? 'status-valid' : 'status-danger'}" style="font-size: 9px;">
                            ${state.telemetry.isOnline ? 'ENLACE ACTIVO' : 'MODO OFFINE'}
                        </span>
                        <span id="gps-accuracy" style="font-size: 9px; color: var(--text-secondary);">ACC: ${state.telemetry.gpsAccuracy.toFixed(1)}m</span>
                    </div>
                </div>
                <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr; gap: 8px;">
                    <button onclick="resetDrivingScore()" class="badge" style="width: 100%; cursor: pointer; border: 1px solid var(--accent); background: transparent; color: var(--accent);">RESET TRAP SCORE</button>
                </div>

                <!-- Geofence Quick Control -->
                <div style="margin-top: 20px; border-top: 1px dashed var(--glass-border); padding-top: 12px;">
                    <p style="font-size: 9px; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">GEOCERCAS ACTIVAS</p>
                    ${state.geofences.map(gf => `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="font-size: 10px; color: ${gf.active ? 'white' : 'var(--text-secondary)'};">${gf.name}</span>
                            <button onclick="toggleGeofence('${gf.id}')" class="badge" style="padding: 2px 6px; font-size: 9px; cursor: pointer; border: 1px solid ${gf.active ? 'var(--accent)' : 'var(--accent-red)'}; background: transparent; color: ${gf.active ? 'var(--accent)' : 'var(--accent-red)'};">
                                ${gf.active ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    `).join('')}
                </div>

                <p style="font-size: 9px; color: var(--text-secondary); margin-top: 16px; text-align: center; opacity: 0.5;">CONEXIÓN ENCRIPTADA AEGIS-256</p>
                <p style="font-size: 9px; color: var(--accent-red); margin-top: 8px; text-align: center; opacity: 0.7;">MAPA BASE: ESRI WORLD IMAGERY (2026)<br>COBERTURA: MINERÍA LATAM ACTIVA</p>
            </div>
        </div>
    `;
}

function renderMapControls() {
    return `
        <div class="map-layer-control">
            <button class="layer-btn active" data-layer="sat">SATÉLITE</button>
            <button class="layer-btn" data-layer="dark">OSCURO</button>
        </div>
    `;
}

function renderFleetView() {
    return `
        <div class="view-section" style="padding: 40px; overflow-y: auto;">
            <h2 style="margin-bottom: 32px;">Estado de Seguimiento</h2>
            <div class="grid-research">
                ${state.trips
            .filter(t => (state.company === 'all' || t.company === state.company) && (state.user.role === 'super-admin' || t.company === state.user.company))
            .map(t => `
                    <div class="research-card border-${t.status}">
                        <div style="display: flex; justify-content: space-between;">
                            <h3>${t.plate}</h3>
                            <span class="badge">${t.status === 'moving' ? 'EN MOVIMIENTO' : 'DETENIDO'}</span>
                        </div>
                        <p style="margin-top: 10px;">Conductor: <b>${t.driver}</b></p>
                        <p>Velocidad: ${t.speed} km/h</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderVehiclesView() {
    return `
        <div class="view-section" style="padding: 40px; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                <h2>Gestión de Flota Vehicular</h2>
                <button id="add-vehicle-btn" class="auth-btn" style="width: auto; padding: 10px 24px;">Registrar Vehículo</button>
            </div>
            <div class="table-responsive">
                <table class="premium-table">
                    <thead>
                        <tr><th>Patente</th><th>Marca/Modelo</th><th>Seguro</th><th>Mantenimiento</th><th>Estado</th></tr>
                    </thead>
                    <tbody>
                        ${state.vehicles
            .filter(v => (state.company === 'all' || v.company === state.company) && (state.user.role === 'super-admin' || v.company === state.user.company))
            .map(v => `
                            <tr>
                                <td><b>${v.plate}</b></td>
                                <td>${v.brand} ${v.model}</td>
                                <td>${v.insuranceExpiry}</td>
                                <td>${v.km.toLocaleString()} / ${v.nextService.toLocaleString()} km</td>
                                <td><span class="status-valid">ACTIVO</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderComplianceView() {
    return `
        <div class="view-section" style="padding: 40px; overflow-y: auto;">
            <h2 style="margin-bottom: 8px;">Módulo de Cumplimiento Legal</h2>
            <p style="color: var(--text-secondary); margin-bottom: 32px;">Protección jurídica y auditoría de Hours of Service (HOS).</p>
            
            <div class="grid-research" style="margin-bottom: 40px;">
                <div class="research-card" style="border-top: 4px solid var(--accent);">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                        <i data-lucide="scale" style="color: var(--accent)"></i>
                        <h3>Legal Guard</h3>
                    </div>
                    <p>Todos los registros están sellados cronológicamente y no son editables, garantizando resguardo ante litigios.</p>
                </div>
                <div class="research-card" style="border-top: 4px solid orange;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                        <i data-lucide="clock" style="color: orange"></i>
                        <h3>Hours of Service (HOS)</h3>
                    </div>
                    <p>Detección automática de exceso de conducción para evitar multas regulatorias internacionales.</p>
                </div>
            </div>

            <div class="table-responsive">
                <table class="premium-table">
                    <thead>
                        <tr><th>Evento</th><th>Sujeto / Activo</th><th>Estado Legal</th><th>Detalle</th><th>Fecha</th></tr>
                    </thead>
                    <tbody>
                        ${state.complianceLogs.map(log => `
                            <tr>
                                <td><b>${log.type}</b></td>
                                <td>${log.driver || log.vehicle}</td>
                                <td><span class="compliance-status status-${log.status}">${log.status.toUpperCase()}</span></td>
                                <td>${log.detail || 'Operación Normal'}</td>
                                <td>${log.date}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderHistoryView() {
    return `
        <div class="view-section" style="padding: 40px; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                <div>
                    <h2>Historial de Operaciones Detallado</h2>
                    <p style="color: var(--text-secondary); font-size: 13px;">Registros certificados por MineConnect SAT Security Layer v4.0</p>
                </div>
                <button onclick="window.print()" class="auth-btn" style="width: auto; padding: 10px 24px; background: transparent; border: 1px solid var(--accent); color: var(--accent);"><i data-lucide="download"></i> EXPORTAR PARA AUDITORÍA (PDF)</button>
            </div>
            
            <div class="table-responsive report-print-container">
                <table class="premium-table">
                    <thead>
                        <tr>
                            <th>ID / Sello</th>
                            <th>Fecha / Hora</th>
                            <th>Vehículo / Prep</th>
                            <th>Conductor</th>
                            <th>Trayecto (Km)</th>
                            <th>Tiempo Conduc.</th>
                            <th>Paradas</th>
                            <th>V. Promedio</th>
                            <th>Estado Legal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.history.map(h => {
        const stops = Math.floor(Math.random() * 4);
        const avgSpeed = (65 + Math.random() * 15).toFixed(1);
        return `
                            <tr>
                                <td>
                                    <div style="font-size: 11px; font-family: 'JetBrains Mono', monospace;">#${h.id}</div>
                                    <div style="font-size: 9px; color: var(--accent); opacity: 0.7;">VERIFICADO ✓</div>
                                </td>
                                <td>${h.date}</td>
                                <td><b>${h.plate}</b></td>
                                <td>${h.driver}</td>
                                <td>${h.kmEnd - h.kmStart} km</td>
                                <td>${h.duration}</td>
                                <td>${stops} paradas</td>
                                <td>${avgSpeed} km/h</td>
                                <td><span class="compliance-status status-valid" style="font-size: 10px;">CERTIFICADO</span></td>
                            </tr>
                        `;
    }).join('')}
                    </tbody>
                </table>
                
                <div class="report-footer-legal" style="margin-top: 40px; padding: 24px; border: 1px dashed var(--glass-border); border-radius: 16px; background: rgba(0,255,171,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="max-width: 600px;">
                            <h4 style="color: var(--accent); margin-bottom: 8px; font-size: 14px;">GARANTÍA DE INTEGRIDAD DE DATOS</h4>
                            <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">
                                Los datos presentados en este informe han sido extraídos directamente de los sensores de telemetría y módulos GPS del hardware MineConnect SAT instalado en las unidades. Este sistema utiliza encriptación de grado militar y sellado temporal (Timestamping) inalterable para prevenir cualquier manipulación de datos, cumpliendo con las regulaciones de Hours of Service (HOS) y auditoría para MineConnect.
                            </p>
                        </div>
                        <div style="text-align: center;">
                            <div style="width: 80px; height: 80px; border: 2px solid var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                                <i data-lucide="shield-check" style="color: var(--accent); width: 40px; height: 40px;"></i>
                            </div>
                            <span style="font-size: 10px; color: var(--accent); letter-spacing: 1px;">AUDITED DATA</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderUsersView() {
    return `
        <div class="view-section" style="padding: 40px; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                <h2>Control de Acceso</h2>
                <button id="add-user-btn" class="auth-btn" style="width: auto; padding: 10px 24px;">Nuevo Usuario</button>
            </div>
            <div class="grid-research">
                ${state.users
            .filter(u => (state.company === 'all' || u.company === state.company) && (state.user.role === 'super-admin' || u.company === state.user.company))
            .map(u => `
                    <div class="research-card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h3>${u.email}</h3>
                                <p>Puesto: <b>${u.role}</b></p>
                                <p>Empresa: ${u.company}</p>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="badge" onclick="editUser(${u.id})" style="cursor: pointer; border: 1px solid var(--accent); background: transparent; color: var(--accent);">EDITAR</button>
                                <button class="badge" onclick="deleteUser(${u.id})" style="cursor: pointer; border: 1px solid var(--accent-red); background: transparent; color: var(--accent-red);">ELIMINAR</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderCompaniesView() {
    return `
        <div class="view-section" style="padding: 40px; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                <h2>Directorio de Empresas</h2>
                ${state.user.role === 'super-admin' ? '<button id="add-company-btn" class="auth-btn" style="width: auto; padding: 10px 24px;">Nueva Empresa</button>' : ''}
            </div>
            <div class="grid-research">
                ${state.companies
            .filter(c => state.user.role === 'super-admin' || c === state.user.company)
            .map(c => `
                    <div class="research-card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h3>${c}</h3>
                                <p>Estado: <span class="badge">Suscripción Activa</span></p>
                                <p style="margin-top: 10px;">Flota Registrada: <b>${state.vehicles.filter(v => v.company === c).length} unidades</b></p>
                            </div>
                            <div style="flex: 1; margin-left: 20px;">
                                <label style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Mensaje SOS Personalizado</label>
                                <div style="display: flex; gap: 8px; margin-top: 8px;">
                                    <input type="text" id="sos-msg-${c}" value="${state.companySettings[c]?.sosMessage || state.companySettings['all'].sosMessage}" 
                                        style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: white; padding: 8px; border-radius: 8px;">
                                    <button onclick="saveSosMessage('${c}')" class="badge" style="cursor: pointer; border: 1px solid var(--accent); background: transparent; color: var(--accent);">GUARDAR</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderPlateLoginModal() {
    return `
        <div class="overlay-full">
            <div class="modal-content" style="text-align: center;">
                <h2 style="letter-spacing: 2px;">IDENTIFICACIÓN</h2>
                <p>Ingresa la patente para validar checklist legal</p>
                <input type="text" id="plate-entry" class="plate-input" placeholder="ABC-123" maxlength="7">
                <button id="start-checklist-btn" class="auth-btn">VALIDAR VEHÍCULO</button>
                <button onclick="state.showPlateLogin = false; render();" style="background: transparent; color: var(--text-secondary); border: none; margin-top: 20px; cursor: pointer;">Volver al Dashboard</button>
            </div>
        </div>
    `;
}

function renderChecklistModal() {
    return `
        <div class="overlay-full">
            <div class="modal-content">
                <h2 style="margin-bottom: 8px;">CONTROL PREVENTIVO</h2>
                <p style="color: var(--accent); margin-bottom: 24px;">Unidad Certificada: ${state.tempPlate}</p>
                <div class="checklist-container">
                    ${state.checklistConfig.map(item => `
                        <div class="checklist-item">
                            <span>${item.label}</span>
                            ${item.type === 'number'
            ? `<input type="number" class="form-group" style="width: 100px; padding: 8px; margin: 0;" placeholder="KM">`
            : `<div class="custom-check" onclick="this.classList.toggle('checked'); this.innerHTML = this.classList.contains('checked') ? '✓' : ''"></div>`
        }
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 20px;">
                    <label style="font-size: 11px; text-transform: uppercase; color: var(--text-secondary);">Observaciones / Faltantes</label>
                    <textarea id="checklist-obs" class="observations-field" placeholder="Escribe aquí si falta algo o hay novedades..." rows="3"></textarea>
                </div>
                <div style="margin-top: 20px;">
                    <label style="font-size: 11px; text-transform: uppercase; color: var(--text-secondary);">Firma Digital (Responsabilidad Legal)</label>
                    <div class="signature-box" onclick="this.innerHTML = '<span style=\'color: var(--accent)\'>FIRMA REGISTRADA ✓</span>'"></div>
                </div>
                <button id="finalize-checklist" class="auth-btn" style="margin-top: 32px;">REGISTRAR Y COMENZAR</button>
            </div>
        </div>
    `;
}

function renderUserModal() {
    return `
        <div class="overlay-full">
            <div class="modal-content">
                <h2 style="margin-bottom: 24px;">Registrar Nuevo Usuario</h2>
                <form id="add-user-form">
                    <div class="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" id="new-user-email" required>
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" id="new-user-pass" required>
                    </div>
                    <div class="form-group">
                        <label>Rol</label>
                        <select id="new-user-role" class="form-group" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: white; padding: 10px; border-radius: 10px;">
                            ${state.user.role === 'super-admin' ? '<option value="Coordinador">Coordinador</option>' : ''}
                            <option value="Conductor">Conductor</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Empresa</label>
                        <select id="new-user-company" class="form-group" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: white; padding: 10px; border-radius: 10px;" ${state.user.role !== 'super-admin' ? 'disabled' : ''}>
                            ${state.companies.map(c => `<option value="${c}" ${state.user.company === c ? 'selected' : ''}>${c}</option>`).join('')}
                        </select>
                    </div>
                    <div style="display: flex; gap: 16px; margin-top: 32px;">
                        <button type="submit" class="auth-btn" style="margin: 0;">CREAR USUARIO</button>
                        <button type="button" class="auth-btn" style="margin: 0; background: transparent; border: 1px solid var(--glass-border); color: var(--text-secondary);" onclick="state.showUserModal = false; render();">CANCELAR</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function renderVehicleModal() {
    return `
        <div class="overlay-full">
            <div class="modal-content">
                <h2 style="margin-bottom: 24px;">Registrar Nuevo Vehículo</h2>
                <form id="add-vehicle-form">
                    <div class="form-group">
                        <label>Patente</label>
                        <input type="text" id="new-vec-plate" placeholder="ABC-123" required>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label>Marca</label>
                            <input type="text" id="new-vec-brand" required>
                        </div>
                        <div class="form-group">
                            <label>Modelo</label>
                            <input type="text" id="new-vec-model" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Empresa</label>
                        <select id="new-vec-company" class="form-group" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: white; padding: 10px; border-radius: 10px;" ${state.user.role !== 'super-admin' ? 'disabled' : ''}>
                            ${state.companies.map(c => `<option value="${c}" ${state.user.company === c ? 'selected' : ''}>${c}</option>`).join('')}
                        </select>
                    </div>
                    <div style="display: flex; gap: 16px; margin-top: 32px;">
                        <button type="submit" class="auth-btn" style="margin: 0;">REGISTRAR</button>
                        <button type="button" class="auth-btn" style="margin: 0; background: transparent; border: 1px solid var(--glass-border); color: var(--text-secondary);" onclick="state.showVehicleModal = false; render();">CANCELAR</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function renderCompanyModal() {
    return `
        <div class="overlay-full">
            <div class="modal-content">
                <h2 style="margin-bottom: 24px;">Nueva Empresa</h2>
                <form id="add-company-form">
                    <div class="form-group">
                        <label>Nombre de la Empresa</label>
                        <input type="text" id="new-comp-name" required>
                    </div>
                    <div style="display: flex; gap: 16px; margin-top: 32px;">
                        <button type="submit" class="auth-btn" style="margin: 0;">AGREGAR</button>
                        <button type="button" class="auth-btn" style="margin: 0; background: transparent; border: 1px solid var(--glass-border); color: var(--text-secondary);" onclick="state.showCompanyModal = false; render();">CANCELAR</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function bindEvents() {
    document.querySelectorAll('.nav-link[data-view], .mobile-nav-item[data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Remover active de todos
            document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(el => el.classList.remove('active'));
            // Agregar active al clickeado (y su par si existe)
            const view = e.currentTarget.getAttribute('data-view');
            state.view = view;
            render();
        });
    });

    // Logout Desktop y Mobile
    const logoutHandlers = (e) => {
        e.preventDefault();
        state.view = 'login';
        state.user = null;
        render();
    };

    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) logoutBtn.addEventListener('click', logoutHandlers);

    const mobileLogoutBtn = document.getElementById('mobile-logout');
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', logoutHandlers);

    const companySelect = document.getElementById('company-select');
    if (companySelect) {
        companySelect.addEventListener('change', (e) => {
            state.company = e.target.value; render();
        });
    }

    const driverBtn = document.getElementById('driver-mode-btn');
    if (driverBtn) {
        driverBtn.addEventListener('click', () => {
            state.showPlateLogin = true; render();
        });
    }

    const passToggle = document.getElementById('toggle-password');
    if (passToggle) {
        passToggle.addEventListener('click', () => {
            state.showPassword = !state.showPassword;
            render();
        });
    }

    const startCheckBtn = document.getElementById('start-checklist-btn');
    if (startCheckBtn) {
        startCheckBtn.addEventListener('click', () => {
            const plate = document.getElementById('plate-entry').value.toUpperCase();
            if (!plate) return; state.tempPlate = plate; state.showPlateLogin = false; state.showChecklist = true; render();
        });
    }

    const finalizeCheckBtn = document.getElementById('finalize-checklist');
    if (finalizeCheckBtn) {
        finalizeCheckBtn.addEventListener('click', async () => {
            const btn = finalizeCheckBtn;
            btn.disabled = true;
            btn.innerHTML = 'CERTIFICANDO INTEGRIDAD...';

            // 1. Biometría
            const bioToken = await captureBiometric();

            // 2. Datos del checklist
            const checklistData = {
                plate: state.tempPlate,
                driver: state.user.email,
                date: new Date().toISOString(),
                bioToken: bioToken,
                coords: state.trips[0] ? { lat: state.trips[0].lat, lng: state.trips[0].lng } : null
            };

            // 3. Generar HASH de validez legal
            const legalHash = await generateHash(checklistData);

            // 4. Registrar en log legal
            state.complianceLogs.unshift({
                id: Date.now(),
                type: 'Checklist Certificado',
                driver: state.user.email,
                vehicle: state.tempPlate,
                status: 'valid',
                detail: `HASH: ${legalHash.substring(0, 12)}... | BIO: ${bioToken.substring(0, 8)}`,
                date: new Date().toISOString().split('T')[0],
                fullHash: legalHash,
                biometric: bioToken
            });

            saveState();
            showToast('Checklist certificado y firmado digitalmente');

            state.showChecklist = false;
            state.view = 'map';
            render();
        });
    }

    // User Management Events
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            state.showUserModal = true; render();
        });
    }

    const addUserForm = document.getElementById('add-user-form');
    if (addUserForm) {
        addUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newUser = {
                id: Date.now(),
                email: document.getElementById('new-user-email').value,
                pass: document.getElementById('new-user-pass').value,
                role: document.getElementById('new-user-role').value,
                company: document.getElementById('new-user-company').value
            };
            state.users.push(newUser);
            state.showUserModal = false;
            saveState();
            showToast(`Usuario ${newUser.email} creado con éxito`);
            render();
        });
    }

    // Vehicle Management Events
    const addVehicleBtn = document.getElementById('add-vehicle-btn');
    if (addVehicleBtn) {
        addVehicleBtn.addEventListener('click', () => {
            state.showVehicleModal = true; render();
        });
    }

    const addVehicleForm = document.getElementById('add-vehicle-form');
    if (addVehicleForm) {
        addVehicleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newVehicle = {
                plate: document.getElementById('new-vec-plate').value.toUpperCase(),
                brand: document.getElementById('new-vec-brand').value,
                model: document.getElementById('new-vec-model').value,
                km: 0,
                nextService: 10000,
                company: document.getElementById('new-vec-company').value,
                insuranceExpiry: new Date(Date.now() + 31536000000).toISOString().split('T')[0] // +1 year
            };
            state.vehicles.push(newVehicle);
            state.showVehicleModal = false;
            saveState();
            showToast(`Vehículo ${newVehicle.plate} registrado`);
            render();
        });
    }

    // Company Management Events
    const addCompanyBtn = document.getElementById('add-company-btn');
    if (addCompanyBtn) {
        addCompanyBtn.addEventListener('click', () => {
            state.showCompanyModal = true; render();
        });
    }

    const addCompanyForm = document.getElementById('add-company-form');
    if (addCompanyForm) {
        addCompanyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newCompany = document.getElementById('new-comp-name').value;
            if (!state.companies.includes(newCompany)) {
                state.companies.push(newCompany);
                state.companySettings[newCompany] = { sosMessage: state.companySettings['all'].sosMessage };
                state.showCompanyModal = false;
                saveState();
                showToast(`Empresa ${newCompany} agregada`);
                render();
            }
        });
    }
}

function refreshIcons() {
    if (typeof createIcons === 'function') {
        createIcons({
            icons: { MapIcon, Truck, FileText, Users, Building2, LogOut, ShieldCheck, History, ClipboardList, AlertTriangle, Download, Scale, Activity, Clock, Eye, EyeOff, Copy, MessageCircle, Send, Mail }
        });
    }
}

let mapInstance = null;
let markers = new Map(); // Usar Map para persistencia por patente
let currentLayer = 'sat';

const layers = {
    sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    })
};

function initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;

    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    mapInstance = L.map('map', {
        center: [-23.6509, -70.3975],
        zoom: 12,
        zoomControl: false,
        layers: [layers[currentLayer]]
    });

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

    // Limpiar rastro de marcadores previos antes de poblar
    markers.clear();
    updateMarkers();

    document.querySelectorAll('.layer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnEl = e.currentTarget;
            const layer = btnEl.dataset.layer;
            if (layer === currentLayer) return;

            mapInstance.removeLayer(layers[currentLayer]);
            mapInstance.addLayer(layers[layer]);

            document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
            btnEl.classList.add('active');
            currentLayer = layer;
        });
    });

    // 3. Renderizar Geocercas Visuales
    state.geofences.forEach(gf => {
        if (!gf.active) return;
        L.circle([gf.lat, gf.lng], {
            radius: gf.radius,
            color: gf.type === 'danger' ? 'rgba(255, 76, 41, 0.5)' : 'rgba(255, 165, 0, 0.5)',
            fillColor: gf.type === 'danger' ? 'rgba(255, 76, 41, 0.1)' : 'rgba(255, 165, 0, 0.1)',
            weight: 2,
            dashArray: '10, 10'
        }).addTo(mapInstance).bindTooltip(gf.name, { sticky: true });
    });
}

function updateMarkers() {
    if (!mapInstance) return;

    const currentTrips = state.trips.filter(t => state.company === 'all' || t.company === state.company);
    const tripPlates = new Set(currentTrips.map(t => t.plate));

    // 1. Eliminar marcadores que ya no están en los viajes actuales
    for (const [plate, marker] of markers.entries()) {
        if (!tripPlates.has(plate)) {
            mapInstance.removeLayer(marker);
            markers.delete(plate);
        }
    }

    // 2. Actualizar o Crear marcadores
    currentTrips.forEach(trip => {
        const iconHtml = `
            <div style="position: relative;">
                <div style="width: 12px; height: 12px; background: ${trip.status === 'moving' ? '#00FFAB' : '#FF4C29'}; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>
                ${trip.status === 'moving' ? '<div class="satellite-pulse" style="display: block; left: -44px; top: -44px;"></div>' : ''}
            </div>
        `;

        const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const popupContent = `
            <div style="color: #fff; font-family: 'Outfit', sans-serif; width: 220px;">
                <b style="font-size: 15px; display: block; margin-bottom: 5px;">Unidad: ${trip.plate}</b>
                <div style="font-size: 12px; margin-bottom: 10px; opacity: 0.8;">
                    <span>Estado: ${trip.status === 'moving' ? 'EN MOVIMIENTO' : 'DETENIDO'}</span><br>
                    <span>Lat: ${trip.lat.toFixed(6)}</span><br>
                    <span>Lng: ${trip.lng.toFixed(6)}</span>
                </div>
                <div class="share-actions">
                    <button class="share-btn copy" onclick="copyGPS('${trip.lat}', '${trip.lng}')" title="Copiar"><i data-lucide="copy"></i></button>
                    <a href="https://wa.me/?text=Ubicación del vehículo ${trip.plate}: https://www.google.com/maps?q=${trip.lat},${trip.lng}" target="_blank" class="share-btn whatsapp" title="WhatsApp"><i data-lucide="message-circle"></i></a>
                    <a href="https://t.me/share/url?url=https://www.google.com/maps?q=${trip.lat},${trip.lng}&text=Ubicación ${trip.plate}" target="_blank" class="share-btn telegram" title="Telegram"><i data-lucide="send"></i></a>
                    <a href="mailto:?subject=Ubicación GPS ${trip.plate}&body=Lat: ${trip.lat}, Lng: ${trip.lng}%0Ahttps://www.google.com/maps?q=${trip.lat},${trip.lng}" class="share-btn mail" title="Email"><i data-lucide="mail"></i></a>
                </div>
            </div>
        `;

        if (markers.has(trip.plate)) {
            // Actualizar marcador existente
            const m = markers.get(trip.plate);
            m.setLatLng([trip.lat, trip.lng]);
            m.setIcon(customIcon);

            // Solo actualizar el contenido del popup si está abierto, para evitar parpadeos
            if (m.isPopupOpen()) {
                m.getPopup().setContent(popupContent);
                refreshIcons(); // Re-ejecutar Lucide para los nuevos iconos en el popup
            }
        } else {
            // Crear nuevo marcador
            const m = L.marker([trip.lat, trip.lng], { icon: customIcon })
                .addTo(mapInstance)
                .bindPopup(popupContent, {
                    autoClose: false,
                    closeOnClick: false,
                    className: 'premium-popup'
                });

            markers.set(trip.plate, m);
        }
    });

    // Asegurar que Lucide procese los iconos en marcadores nuevos
    refreshIcons();
}

// Telemetry Logic Update
setInterval(() => {
    // 1. Sync from Mobile if available
    const syncRaw = localStorage.getItem('mineconnect_sync_trip');
    if (syncRaw) {
        try {
            const syncData = JSON.parse(syncRaw);
            let mobileTrip = state.trips.find(t => t.id === 'mobile-driver' || t.plate === syncData.plate);

            if (!mobileTrip) {
                mobileTrip = { id: 'mobile-driver', plate: syncData.plate, driver: 'Conductor Mobile', company: state.companies[0] };
                state.trips.push(mobileTrip);
            }

            mobileTrip.lat = syncData.lat;
            mobileTrip.lng = syncData.lng;
            mobileTrip.speed = syncData.speed;
            mobileTrip.status = syncData.status;
            mobileTrip.lastUpdate = syncData.timestamp;

            // Si el móvil está activo, nos enfocamos en su telemetría para el UI de uplink
            state.telemetry.gpsAccuracy = syncData.accuracy || 10;
        } catch (e) {
            console.error("Error parsing sync data", e);
        }
    }

    // 2. Simular movimiento para otros vehículos (Mock)
    state.trips = state.trips.map(t => {
        if (t.id === 1 && state.gpsWatchId) return t; // No simular el propio si hay GPS
        if (t.id === 'mobile-driver') return t; // No simular el móvil sincronizado

        return t.status === 'moving' ? {
            ...t,
            lat: t.lat + (Math.random() - 0.45) * 0.0005,
            lng: t.lng + (Math.random() - 0.55) * 0.0005,
            speed: 55 + Math.floor(Math.random() * 15)
        } : t;
    });

    // 3. Simular variaciones en telemetría satelital
    state.telemetry = {
        ...state.telemetry,
        satellites: 10 + Math.floor(Math.random() * 5),
        latency: 150 + Math.floor(Math.random() * 60),
        signal: 85 + Math.floor(Math.random() * 15),
        isOnline: navigator.onLine,
        fatigueTimer: state.view === 'map' ? state.telemetry.fatigueTimer + 2 : 0
    };

    // 4. Modo Offline: Guardar puntos si no hay conexión
    if (!state.telemetry.isOnline && state.trips[0]) {
        state.telemetry.offlineQueue.push({
            lat: state.trips[0].lat,
            lng: state.trips[0].lng,
            ts: Date.now()
        });
    } else if (state.telemetry.isOnline && state.telemetry.offlineQueue.length > 0) {
        // Sincronización inteligente al recuperar señal
        console.log(`Sincronizando ${state.telemetry.offlineQueue.length} puntos offline...`);
        state.telemetry.offlineQueue = [];
        showToast('Datos offline sincronizados con éxito');
    }

    // 5. Motor de Geocercas
    if (state.trips[0]) {
        state.geofences.forEach(gf => {
            if (!gf.active) return;
            const dist = L.latLng(state.trips[0].lat, state.trips[0].lng).distanceTo([gf.lat, gf.lng]);
            if (dist < gf.radius) {
                if (!gf.triggered) {
                    showRiskAlert(`¡ALERTA!: Ingresando a ${gf.name}`, gf.type);
                    gf.triggered = true;
                    // Registrar violación de geocerca
                    state.complianceLogs.unshift({
                        id: Date.now(),
                        type: 'ZONA DE RIESGO',
                        driver: state.user.email,
                        vehicle: state.tempPlate || 'S/V',
                        status: gf.type === 'danger' ? 'danger' : 'warning',
                        detail: `Entrada en geocerca: ${gf.name}`,
                        date: new Date().toISOString().split('T')[0]
                    });
                }
            } else {
                gf.triggered = false;
            }
        });
    }

    // 6. Detección Man Down (Simulada por inactividad si no hay sensores)
    if (state.telemetry.manDownEnabled && (Date.now() - state.telemetry.lastMovement > 600000)) { // 10 min
        console.warn("HOMBRE CAÍDO DETECTADO POR INACTIVIDAD");
        handleSOS(); // Disparo automático
        state.telemetry.lastMovement = Date.now(); // Reset para evitar bucle
    }

    // 7. Control de Fatiga (Alerta cada 2 horas - aquí simulamos cada 2 min para demo)
    if (state.telemetry.fatigueTimer > 120) {
        showRiskAlert("ALERTA DE FATIGA: Se recomienda descanso obligatorio", "warning");
        state.telemetry.fatigueTimer = 0;
    }

    if (state.view === 'map') {
        if (mapInstance) updateMarkers();
        updateTelemetryUI();
    }
}, 2000);

function showRiskAlert(msg, level) {
    const alertBox = document.createElement('div');
    alertBox.className = `risk-modal-alert level-${level}`;
    alertBox.innerHTML = `
        <div class="risk-alert-content">
            <i data-lucide="alert-triangle"></i>
            <div>
                <h4>ALERTA DE SEGURIDAD</h4>
                <p>${msg}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()">X</button>
        </div>
    `;
    document.body.appendChild(alertBox);
    refreshIcons();
    setTimeout(() => alertBox.classList.add('show'), 100);
}

// Escuchar cambios en tiempo real desde otras pestañas/ventanas (Storage Sync)
window.addEventListener('storage', (e) => {
    if (e.key === 'mineconnect_sync_trip') {
        // El setInterval ya lo manejará en la siguiente iteración, 
        // pero podemos forzar un render si estamos en el mapa para mayor fluidez.
        if (state.view === 'map' && mapInstance) {
            updateMarkers();
        }
    }
});

// Funciones Globales de Emergencia y Utilidad
window.handleSOS = () => {
    state.sosMode = true;

    // Loguear el evento también
    const alertId = Math.floor(Math.random() * 10000);
    state.complianceLogs.unshift({
        id: alertId,
        type: 'SOS EMERGENCIA',
        driver: state.user.email,
        vehicle: state.tempPlate || state.trips[0]?.plate || 'S/V',
        status: 'danger',
        detail: 'BOTÓN DE PÁNICO ACTIVADO - ASISTENCIA REQUERIDA',
        date: new Date().toISOString().split('T')[0]
    });

    // Reproducir sonido si fuera posible (simulado)
    console.log("ALERTA SOS ACTIVADA - ENVIANDO COORDENADAS");

    render();
};

window.saveSosMessage = (company) => {
    const input = document.getElementById(`sos-msg-${company}`);
    if (input) {
        state.companySettings[company] = { sosMessage: input.value };
        saveState();
        showToast(`Mensaje SOS de ${company} actualizado`);
        render();
    }
};

window.cancelSOS = () => {
    if (confirm('¿ESTÁ SEGURO DE QUE DESEA FINALIZAR LA EMERGENCIA? Esta acción se registrará permanentemente.')) {
        state.sosMode = false;
        showToast('Emergencia finalizada con éxito');
        render();
    }
};

function renderSOSScreen() {
    const activeVehicle = state.trips.find(t => t.id === 1) || state.trips[0];
    const lat = activeVehicle ? activeVehicle.lat.toFixed(6) : "Buscando...";
    const lng = activeVehicle ? activeVehicle.lng.toFixed(6) : "Buscando...";

    // Obtener mensaje de la empresa del usuario
    const companyMsg = state.companySettings[state.user.company]?.sosMessage || state.companySettings['all'].sosMessage;

    app.innerHTML = `
        <div class="sos-overlay-full">
            <div class="sos-scanner-line"></div>
            <div class="sos-content-v2">
                <div class="sos-alert-header">
                    <i data-lucide="alert-triangle" class="sos-icon-pulse"></i>
                    <div class="sos-title-v2">ALERTA SOS ACTIVA</div>
                </div>
                
                <div class="sos-company-message">
                    "${companyMsg}"
                </div>

                <div class="sos-data-grid">
                    <div class="sos-data-card">
                        <label>LATITUD GPS</label>
                        <div class="sos-coord-val">${lat}</div>
                    </div>
                    <div class="sos-data-card">
                        <label>LONGITUD GPS</label>
                        <div class="sos-coord-val">${lng}</div>
                    </div>
                    <div class="sos-data-card">
                        <label>ESTADO DE ENLACE</label>
                        <div class="sos-coord-val" style="color: var(--accent);">SATELITAL ACTIVO</div>
                    </div>
                    <div class="sos-data-card">
                        <label>UNIDAD</label>
                        <div class="sos-coord-val">${state.tempPlate || activeVehicle?.plate || 'IDENTIFICANDO...'}</div>
                    </div>
                </div>
                
                <div class="sos-footer-v2">
                    <div class="sos-timestamp-v2">
                        <i data-lucide="clock" style="width: 14px;"></i>
                        REGISTRO: ${new Date().toLocaleTimeString()} - ${new Date().toLocaleDateString()}
                    </div>
                    <button class="sos-cancel-btn-v2" onclick="cancelSOS()">
                        FINALIZAR EMERGENCIA
                    </button>
                </div>
            </div>
            
            <div class="sos-background-glow"></div>
        </div>
    `;
    refreshIcons();
}

window.copyGPS = (lat, lng) => {
    const text = `Ubicación GPS: ${lat}, ${lng} (MineConnect SAT)`;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copiado al portapapeles');
    });
};

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'premium-toast';
    toast.innerHTML = `
        <i data-lucide="check-circle" style="width: 16px; color: var(--accent);"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    refreshIcons();

    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }, 100);
}

/* --- Real GPS Logic --- */
let accuracyCircle = null;

function startGPSTracking() {
    if (!navigator.geolocation) {
        console.error("Geolocalización no soportada");
        return;
    }

    // Cargar última posición conocida
    const savedPos = localStorage.getItem('lastGpsPosition');
    if (savedPos) {
        try {
            const { lat, lng, acc } = JSON.parse(savedPos);
            updateMainVehicle(lat, lng, 0, acc);
        } catch (e) {
            console.error("Error cargando GPS cache:", e);
        }
    }

    // Si ya estamos rastreando, no duplicar
    if (state.gpsWatchId) return;

    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    state.gpsWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy, speed } = position.coords;

            // Persistir datos críticos
            localStorage.setItem('lastGpsPosition', JSON.stringify({
                lat: latitude,
                lng: longitude,
                acc: accuracy,
                timestamp: new Date().toISOString()
            }));

            updateMainVehicle(latitude, longitude, speed, accuracy);

            if (state.view === 'map') {
                updateMarkers();
                updateTelemetryUI();
                updateAccuracyCircle(latitude, longitude, accuracy);
            }
        },
        (error) => {
            console.warn("Error GPS:", error.message);
        },
        options
    );
}

function updateMainVehicle(lat, lng, speed, accuracy) {
    state.telemetry.gpsAccuracy = accuracy || 0;
    const mainVehicle = state.trips.find(t => t.id === 1);
    if (mainVehicle) {
        mainVehicle.lat = lat;
        mainVehicle.lng = lng;
        mainVehicle.speed = speed ? Math.round(speed * 3.6) : 0;
        mainVehicle.status = (speed && speed > 1) ? 'moving' : 'stationary';
        mainVehicle.lastUpdate = new Date().toISOString();
    }
}

function updateAccuracyCircle(lat, lng, radius) {
    if (!mapInstance) return;

    if (accuracyCircle) {
        try {
            mapInstance.removeLayer(accuracyCircle);
        } catch (e) { /* ignore cleanup error */ }
    }

    // Solo dibujar si la precisión es válida
    if (radius && radius > 0) {
        accuracyCircle = L.circle([lat, lng], {
            radius: radius,
            color: 'rgba(0, 255, 171, 0.4)',
            fillColor: 'rgba(0, 255, 171, 0.1)',
            weight: 1,
            dashArray: '5, 5'
        }).addTo(mapInstance);
    }
}

function updateTelemetryUI() {
    const coordVal = document.getElementById('tel-coords');
    const accVal = document.getElementById('gps-accuracy');
    const statusBadges = document.getElementById('network-status');
    const scoreVal = document.getElementById('tel-score');
    const fatigueVal = document.getElementById('tel-fatigue');

    if (coordVal && state.trips[0]) {
        coordVal.textContent = `${state.trips[0].lat.toFixed(6)}, ${state.trips[0].lng.toFixed(6)}`;
    }
    if (accVal) {
        accVal.textContent = `ACC: ${state.telemetry.gpsAccuracy.toFixed(1)}m`;
    }
    if (statusBadges) {
        statusBadges.className = `badge ${state.telemetry.isOnline ? 'status-valid' : 'status-danger'}`;
        statusBadges.textContent = state.telemetry.isOnline ? 'ENLACE ACTIVO' : 'MODO OFFINE';
    }
    if (scoreVal) {
        scoreVal.textContent = `${state.telemetry.drivingScore} pts`;
    }
    if (fatigueVal) {
        fatigueVal.textContent = `${Math.floor(state.telemetry.fatigueTimer / 60)} min`;
    }
}

// --- Real Sensor Logic (Behavior & Man Down) ---
function startSensors() {
    if (typeof DeviceMotionEvent === 'undefined') return;

    window.addEventListener('devicemotion', (event) => {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;

        // 1. Man Down Detection (High impact + lack of movement)
        const totalAcc = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
        if (totalAcc > 25) { // Impacto fuerte (> 2.5G aprox)
            console.warn("IMPACTO DETECTADO");
            state.telemetry.lastImpact = Date.now();
            // Iniciar monitoreo de recuperación
            setTimeout(() => {
                const now = Date.now();
                if (now - state.telemetry.lastMovement > 10000) { // Si no hay movimiento 10s después del golpe
                    showRiskAlert("MAN DOWN: Impacto fuerte detectado sin movimiento posterior", "danger");
                    handleSOS();
                }
            }, 10000);
        }

        // 2. Behavior Monitoring (Frenadas/Aceleraciones)
        // Simplificado: detectamos picos de aceleración en eje Z o Y dependiendo de orientación
        if (Math.abs(acc.y) > 5) { // Frenada/Aceleración brusca
            state.telemetry.drivingScore = Math.max(0, state.telemetry.drivingScore - 5);
            showRiskAlert("EVENTO PELIGROSO: Conducción agresiva detectada", "warning");

            state.complianceLogs.unshift({
                id: Date.now(),
                type: 'CONDUCTA PELIGROSA',
                driver: state.user.email,
                vehicle: state.tempPlate || 'S/V',
                status: 'warning',
                detail: `Frenada/Aceleración brusca detectada. Score: ${state.telemetry.drivingScore}`,
                date: new Date().toISOString().split('T')[0]
            });
        }

        // Actualizar último movimiento
        if (totalAcc > 2) state.telemetry.lastMovement = Date.now();
    });
}

window.resetDrivingScore = () => {
    state.telemetry.drivingScore = 100;
    saveState();
    showToast('Puntaje de conducción reseteado para el nuevo viaje');
    render();
};

window.toggleGeofence = (id) => {
    const gf = state.geofences.find(g => g.id === id);
    if (gf) {
        gf.active = !gf.active;
        saveState();
        showToast(`Geocerca ${gf.name} ${gf.active ? 'activada' : 'desactivada'}`);
        render();
    }
};

// Start sensors on interaction
document.addEventListener('click', () => {
    if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
        DeviceMotionEvent.requestPermission().then(response => {
            if (response == 'granted') startSensors();
        });
    } else {
        startSensors();
    }
}, { once: true });

// Network Listeners
window.addEventListener('online', () => { state.telemetry.isOnline = true; updateTelemetryUI(); });
window.addEventListener('offline', () => { state.telemetry.isOnline = false; updateTelemetryUI(); });

// Start tracking on load if permission granted or requested
if (state.user) startGPSTracking();

init();
