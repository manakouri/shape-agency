import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// --- FIREBASE SETUP ---
const firebaseConfig = {
    apiKey: "AIzaSyAQ48kW1Eov65983S7J6WyHewrLcqw1-3o",
    authDomain: "geometry-87a8c.firebaseapp.com",
    projectId: "geometry-87a8c",
    storageBucket: "geometry-87a8c.firebasestorage.app",
    messagingSenderId: "535370913699",
    appId: "1:535370913699:web:e3e3e6cb05e21df8666c16",
    measurementId: "G-DQLDRDF3D8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- MISSION REGISTRY (Successive Steps) ---
const missionRegistry = {
    "1": {
        title: "Mission 01: Vertex Scan",
        prompt: "Based on the vertex count, the polygon is a...",
        options: ["Triangle (3)", "Quadrilateral (4)", "Pentagon (5)", "Hexagon (6)", "Heptagon (7)", "Octagon (8)"],
        fields: [
            { id: "vertex_count", label: "Number of Vertices Detected", type: "number" }
        ]
    },
    "2": {
        title: "Mission 02: Linear Calibration",
        prompt: "This segment is recorded as...",
        options: ["Short Edge", "Long Edge", "Equal Side"],
        fields: [
            { id: "side_length", label: "Side Length (mm)", type: "number" }
        ]
    },
    "5": {
        title: "Mission 05: Parallel Detect",
        prompt: "The lines are...",
        options: ["Parallel", "Intersecting", "Perpendicular"],
        fields: [
            { id: "gap_start", label: "Gap at Start (mm)", type: "number" },
            { id: "gap_end", label: "Gap at End (mm)", type: "number" }
        ]
    }
};

// --- APP STATE ---
let activeAgents = [];
let sessionFiles = [];
let currentMissionId = null;

// --- NAVIGATION ---
window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    // Always scroll to top when changing screens
    document.querySelector('main').scrollTop = 0;
};

// --- AGENT LOGIN ---
window.addAgent = () => {
    const input = document.getElementById('pin-input');
    const pin = input.value;
    if (pin.length === 4) {
        activeAgents.push(pin);
        const pill = document.createElement('span');
        pill.className = 'agent-pill';
        pill.innerText = 'Agent ' + pin;
        document.getElementById('active-agents-list').appendChild(pill);
        input.value = '';
    } else {
        alert("Agent PIN must be 4 digits.");
    }
};

window.proceedToMissions = () => {
    if (activeAgents.length > 0) {
        document.getElementById('archive-btn').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'block';
        document.getElementById('mission-status-label').innerText = "ONLINE";
        renderMissionList();
        showScreen('mission-screen');
    } else {
        alert("Access Denied: Log in Agents to continue.");
    }
};

// --- LOGOUT ---
window.secureLogout = () => {
    if (confirm("Terminate Session? Data will be securely filed.")) {
        activeAgents = [];
        sessionFiles = [];
        document.getElementById('active-agents-list').innerHTML = '';
        document.getElementById('archive-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'none';
        document.getElementById('mission-status-label').innerText = "OFFLINE";
        showScreen('login-screen');
    }
};

// --- MISSION MANAGEMENT ---
function renderMissionList() {
    const list = document.getElementById('mission-list');
    list.innerHTML = '';
    Object.keys(missionRegistry).forEach(id => {
        const m = missionRegistry[id];
        const btn = document.createElement('button');
        btn.className = 'sia-btn';
        btn.innerText = m.title;
        btn.onclick = () => launchMission(id);
        list.appendChild(btn);
    });
}

function launchMission(id) {
    currentMissionId = id;
    const m = missionRegistry[id];
    
    document.getElementById('current-mission-title').innerText = m.title;
    document.getElementById('prompt-conclusion').innerText = m.prompt;

    const inputArea = document.getElementById('attribute-inputs');
    inputArea.innerHTML = '<h4 style="color:var(--sia-neon); margin: 0 0 10px 0;">FIELD SENSORS</h4>';
    
    m.fields.forEach(f => {
        inputArea.innerHTML += `
            <div style="margin-bottom:15px;">
                <label style="display:block; font-size:0.8rem; color:var(--sia-blue); margin-bottom:5px;">${f.label}</label>
                <input type="${f.type}" id="${f.id}" class="sia-input" style="width:100%; margin:0;">
            </div>`;
    });

    const select = document.getElementById('box-conclusion');
    select.innerHTML = '<option value="">-- CLASSIFY ENTITY --</option>';
    m.options.forEach(opt => {
        select.innerHTML += `<option value="${opt}">${opt}</option>`;
    });

    // Reset reasoning boxes
    document.getElementById('box-because').value = '';
    document.getElementById('box-but').value = '';
    document.getElementById('box-so').value = '';

    showScreen('terminal-screen');
}

// --- DATA SUBMISSION ---
window.submitMission = async () => {
    const btn = document.getElementById('submit-btn');
    const conclusion = document.getElementById('box-conclusion').value;

    if (!conclusion) {
        alert("Agent Alert: Classification Required.");
        return;
    }

    btn.innerText = "UPLOADING...";
    btn.disabled = true;

    // Map dynamic fields
    const measurements = {};
    missionRegistry[currentMissionId].fields.forEach(f => {
        measurements[f.id] = document.getElementById(f.id).value;
    });

    const report = {
        missionId: currentMissionId,
        missionTitle: missionRegistry[currentMissionId].title,
        agents: [...activeAgents],
        measurements: measurements,
        conclusion: conclusion,
        because: document.getElementById('box-because').value,
        but: document.getElementById('box-but').value,
        so: document.getElementById('box-so').value,
        timestamp: new Date()
    };

    try {
        await addDoc(collection(db, "submissions"), report);
        
        // Add to local session archive
        sessionFiles.unshift(report);
        updateLocalArchiveUI();

        alert("INTELLIGENCE FILED SUCCESSFULLY.");
        btn.innerText = "FILE REPORT TO COMMAND";
        btn.disabled = false;
        showScreen('mission-screen');
    } catch (e) {
        console.error("Upload Error: ", e);
        alert("Upload Failed. Check connection.");
        btn.disabled = false;
    }
};

// --- ARCHIVE LOGIC ---
function updateLocalArchiveUI() {
    const container = document.getElementById('local-archive-list');
    container.innerHTML = '';
    sessionFiles.forEach(file => {
        const card = document.createElement('div');
        card.style.background = '#161b22';
        card.style.borderLeft = '4px solid var(--sia-neon)';
        card.style.padding = '10px';
        card.style.marginBottom = '10px';
        card.innerHTML = `
            <div style="font-size:0.7rem; color:var(--sia-blue);">MISSION ${file.missionId}</div>
            <div style="font-weight:bold;">${file.conclusion}</div>
            <div style="font-size:0.8rem; color:gray; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                Because ${file.because}
            </div>
        `;
        container.appendChild(card);
    });
}

// --- TEACHER ACCESS ---
window.requestTeacherAccess = () => {
    const code = prompt("CLEARANCE LEVEL 5 REQUIRED:");
    if (code === "SIA2026") {
        showScreen('teacher-screen');
        loadTeacherDashboard();
    } else if (code !== null) {
        alert("Access Denied.");
    }
};

async function loadTeacherDashboard() {
    const feed = document.getElementById('teacher-feed');
    feed.innerHTML = "Accessing Database...";
    
    try {
        const q = query(collection(db, "submissions"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        feed.innerHTML = '';
        
        snap.forEach((doc) => {
            const d = doc.data();
            const card = document.createElement('div');
            card.className = 'sia-card';
            card.style.border = '1px solid #333';
            card.style.padding = '10px';
            card.style.marginBottom = '10px';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
                    <span style="color:var(--sia-neon)">M${d.missionId}: ${d.conclusion}</span>
                    <span>Agents: ${d.agents.join(', ')}</span>
                </div>
                <div style="font-size:0.8rem; margin-top:5px; color:#ccc;">
                    <b>B:</b> ${d.because} <br> <b>B:</b> ${d.but} <br> <b>S:</b> ${d.so}
                </div>
            `;
            feed.appendChild(card);
        });
    } catch (e) {
        feed.innerHTML = "Error loading intelligence feed.";
        console.error(e);
    }
}
