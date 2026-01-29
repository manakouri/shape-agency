import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

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

// --- MISSION REGISTRY ---
// This defines what data and vocabulary each mission uses.
const missionRegistry = {
    "1": {
        title: "Mission 01: Vertex Scan",
        prompt: "The vertex is...",
        options: ["Sharp (Acute)", "Square (Right)", "Wide (Obtuse)", "Straight"],
        fields: [
            { id: "vertex_count", label: "Number of Vertices", type: "number" }
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
    },
    "17": {
        title: "Mission 17: Triangle Sector",
        prompt: "The entity is a...",
        options: ["Equilateral Triangle", "Isosceles Triangle", "Scalene Triangle"],
        fields: [
            { id: "side_a", label: "Side A (mm)", type: "number" },
            { id: "side_b", label: "Side B (mm)", type: "number" },
            { id: "side_c", label: "Side C (mm)", type: "number" }
        ]
    }
};

let activeAgents = [];
let currentMissionId = null;

// --- APP FUNCTIONS ---
window.addAgent = () => {
    const pin = document.getElementById('pin-input').value;
    if (pin.length === 4) {
        activeAgents.push(pin);
        const pill = document.createElement('span');
        pill.className = 'agent-pill';
        pill.innerText = 'Agent ' + pin;
        document.getElementById('active-agents-list').appendChild(pill);
        document.getElementById('pin-input').value = '';
    }
};

window.proceedToMissions = () => {
    if (activeAgents.length > 0) {
        renderMissionList();
        showScreen('mission-screen');
    } else { alert("Log in agents first!"); }
};

function renderMissionList() {
    const list = document.getElementById('mission-list');
    list.innerHTML = '';
    Object.keys(missionRegistry).forEach(id => {
        const m = missionRegistry[id];
        const btn = document.createElement('button');
        btn.className = 'sia-btn';
        btn.style.width = '100%';
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

    // Build Dynamic Inputs
    const inputArea = document.getElementById('attribute-inputs');
    inputArea.innerHTML = '';
    m.fields.forEach(f => {
        inputArea.innerHTML += `<label>${f.label}</label>
        <input type="${f.type}" id="${f.id}" class="sia-input" style="width:95%">`;
    });

    // Build Dropdown Options
    const select = document.getElementById('box-conclusion');
    select.innerHTML = '<option value="">-- Select Identity --</option>';
    m.options.forEach(opt => {
        select.innerHTML += `<option value="${opt}">${opt}</option>`;
    });

    showScreen('terminal-screen');
}

window.submitMission = async () => {
    const btn = document.getElementById('submit-btn');
    btn.innerText = "UPLOADING...";
    btn.disabled = true;

    // Collect Dynamic Data
    const missionData = {};
    missionRegistry[currentMissionId].fields.forEach(f => {
        missionData[f.id] = document.getElementById(f.id).value;
    });

    const report = {
        missionId: currentMissionId,
        agents: activeAgents,
        measurements: missionData,
        conclusion: document.getElementById('box-conclusion').value,
        because: document.getElementById('box-because').value,
        but: document.getElementById('box-but').value,
        so: document.getElementById('box-so').value,
        timestamp: new Date()
    };

    try {
        await addDoc(collection(db, "submissions"), report);
        alert("REPORT FILED SUCCESSFULLY!");
        // Clear fields and go back
        document.getElementById('box-because').value = '';
        document.getElementById('box-but').value = '';
        document.getElementById('box-so').value = '';
        btn.innerText = "FILE REPORT TO COMMAND";
        btn.disabled = false;
        showScreen('mission-screen');
    } catch (e) {
        console.error("Error: ", e);
        alert("Upload Failed. Check connection.");
        btn.disabled = false;
    }
};

window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};
