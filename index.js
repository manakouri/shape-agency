import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAQ48kW1Eov65983S7J6WyHewrLcqw1-3o",
    authDomain: "geometry-87a8c.firebaseapp.com",
    projectId: "geometry-87a8c",
    storageBucket: "geometry-87a8c.firebasestorage.app",
    messagingSenderId: "535370913699",
    appId: "1:535370913699:web:e3e3e6cb05e21df8666c16"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- VERIFIED S.I.A. DATASET (Missions 1-10) ---
const validationRegistry = {
    "1": { "1": 3, "2": 4, "3": 4, "4": 5, "5": 6, "6": 6, "7": 7, "8": 10, "9": 10, "10": 12 },
    "2": { 
        "1": [6, 6, 6], "2": [6, 4.2, 6.4, 2.4], "3": [6, 3.5, 6, 3.5], 
        "4": [4.8, 3.1, 3.6, 3.6, 4.3], "5": [3.6, 3.6, 3.6, 3.6, 3.6, 3.6],
        "6": [6, 1.8, 3, 3, 3, 4.8], "7": [2.4, 2.4, 2.4, 2.4, 3.5, 3.5, 3.5],
        "8": [3.5, 3.5, 4.9], "9": [1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9],
        "10": [3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5]
    },
    "3": { "1": 0, "2": 1, "3": 2, "4": 0, "5": 3, "6": 2, "7": 0, "8": 0, "9": 0, "10": 1 },
    "4": { "1": 0, "2": 2, "3": 0, "4": 0, "5": 0, "6": 5, "7": 0, "8": 0, "9": 0, "10": 0 },
    "5": { "1": 0, "2": 2, "3": 0, "4": 0, "5": 0, "6": 5, "7": 0, "8": 0, "9": 0, "10": 0 },
    "6": { "1": 3, "2": 1, "3": 2, "4": 0, "5": 0, "6": 0, "7": 1, "8": 5, "9": 2, "10": 6 },
    "9": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 1, "7": 0, "8": 5, "9": 0, "10": 2 },
    "10": { "1": 3, "2": 0, "3": 0, "4": 0, "5": 6, "6": 0, "7": 0, "8": 1, "9": 0, "10": 0 },
    "11":3, "12":3, "13":3, "14":4, "15":4, "16":4, "17":3, "18":5, "19":6, "20":7, "21":9, "22":10, "23":11, "24":12
};

const missionRegistry = {
    "1": { title: "M01: Vertex Scan", type: "bulk", fields: [{id:"v", label:"Vertices"}] },
    "2": { title: "M02: Side Lengths", type: "bulk", fields: [{id:"len", label:"Length (cm) - separate with commas"}] },
    "3": { title: "M03: Parallel Pairs", type: "bulk", fields: [{id:"para", label:"Parallel Pairs"}] },
    "4": { title: "M04: Right Angles", type: "bulk", fields: [{id:"right", label:"Right Angles"}] },
    "5": { title: "M05: Perpendicular Lines", type: "bulk", fields: [{id:"perp", label:"Perp. Pairs"}] },
    "6": { title: "M06: Acute Angles", type: "bulk", fields: [{id:"acute", label:"Acute Angles"}] },
    "7": { title: "M07: Angle Naming", type: "bulk", fields: [{id:"name", label:"Type (Acute/Obtuse/Reflex)"}] },
    "8": { title: "M08: Exact Angles", type: "bulk", fields: [{id:"deg", label:"Degrees (°)"}] },
    "9": { title: "M09: Reflex Angles", type: "bulk", fields: [{id:"reflex", label:"Reflex Angles"}] },
    "10": { title: "M10: Symmetry", type: "bulk", fields: [{id:"symm", label:"Symmetry Lines"}] },
    "11": { title: "M11: Equilateral", type: "deep", target: "Triangle" },
    "12": { title: "M12: Isosceles", type: "deep", target: "Triangle" },
    "13": { title: "M13: Scalene", type: "deep", target: "Triangle" },
    "14": { title: "M14: Rectangles", type: "deep", target: "Quadrilateral" },
    "15": { title: "M15: Squares", type: "deep", target: "Quadrilateral" },
    "16": { title: "M16: Rhombus", type: "deep", target: "Quadrilateral" },
    "17": { title: "M17: Regularity", type: "deep", target: "Polygon" },
    "18": { title: "M18: Pentagon", type: "deep", target: "Pentagon" },
    "19": { title: "M19: Hexagon", type: "deep", target: "Hexagon" },
    "20": { title: "M20: Septagon", type: "deep", target: "Septagon" },
    "21": { title: "M21: Nonagon", type: "deep", target: "Nonagon" },
    "22": { title: "M22: Decagon", type: "deep", target: "Decagon" },
    "23": { title: "M23: Hendecagon", type: "deep", target: "Hendecagon" },
    "24": { title: "M24: Dodecagon", type: "deep", target: "Dodecagon" }
};

const deepFields = [
    {id:"v", label:"Vertices", type:"number"},
    {id:"ang", label:"Angle Data", type:"text"},
    {id:"par", label:"Parallel Pairs", type:"number"},
    {id:"sym", label:"Symmetry Lines", type:"number"}
];

let loggedInAgents = [];
let broadcastedMissionIds = []; // Now stores a list of missions
let activeMissionId = 0; // Currently selected mission for data entry

// --- DATABASE & AUTH ---
window.authoriseAgent = async () => {
    const name = document.getElementById('new-agent-name').value.trim();
    const code = document.getElementById('new-agent-code').value.trim();
    if (name && code.length === 4) {
        await setDoc(doc(db, "agents", code), { agentName: name, agentCode: code });
        document.getElementById('new-agent-name').value = '';
        document.getElementById('new-agent-code').value = '';
    }
};

const listenToRoster = () => {
    onSnapshot(collection(db, "agents"), (snap) => {
        const roster = document.getElementById('roster-list');
        if (roster) {
            roster.innerHTML = '';
            snap.forEach(d => {
                const a = d.data();
                roster.innerHTML += `<div style="padding:5px; border-bottom:1px solid #222; font-size:0.8rem;">${a.agentName} <span style="color:var(--sia-blue)">[${a.agentCode}]</span></div>`;
            });
        }
    });
};

window.registerAgent = async () => {
    const code = document.getElementById('agent-id-input').value.trim();
    if (code.length === 4) {
        const q = query(collection(db, "agents"), where("agentCode", "==", code));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const data = snap.docs[0].data();
            if (!loggedInAgents.includes(code)) {
                loggedInAgents.push(code);
                document.getElementById('active-agents-list').innerHTML += `<span class="agent-pill">AGENT ${data.agentName}</span> `;
                document.getElementById('welcome-msg').innerText = `WELCOME, AGENT ${data.agentName}`;
            }
        } else { alert("ACCESS DENIED: Code Unknown."); }
    }
    document.getElementById('agent-id-input').value = '';
};

// --- MISSION & ARCHIVE LOGIC ---
const getSessionKey = () => `M${activeMissionId}-G-${[...loggedInAgents].sort().join("-")}`;

window.openMission = async (id) => {
    activeMissionId = id;
    const m = missionRegistry[id];
    const container = document.getElementById('polygon-entry-list');
    container.innerHTML = '<p style="text-align:center;">DECRYPTING...</p>';

    const sessionKey = getSessionKey();
    const snap = await getDocs(query(collection(db, "mission_reports"), where("sessionKey", "==", sessionKey)));
    let existingData = !snap.empty ? snap.docs[0].data().values : {};

    container.innerHTML = '';
    const isBulk = m.type === "bulk";
    const count = isBulk ? 10 : 3;
    const fields = isBulk ? m.fields : deepFields;

    for (let i = 1; i <= count; i++) {
        container.innerHTML += `
            <div class="sia-card">
                <h3>${isBulk ? 'POLYGON' : m.target} ${i}</h3>
                ${fields.map(f => `<label>${f.label}</label><input class="sia-input m-in" data-poly="${i}" data-f="${f.id}" value="${existingData[`p${i}-${f.id}`] || ''}">`).join('')}
                ${!isBulk ? `<label>Field Notes</label><textarea class="sia-input">${existingData[`p${i}-notes`] || ''}</textarea>` : ''}
            </div>`;
    }
    window.showScreen('mission-entry');
};

window.submitMissionBatch = async () => {
    const inputs = document.querySelectorAll('.m-in');
    const missionData = {};
    let errors = [];
    const master = validationRegistry[activeMissionId];

    inputs.forEach(i => {
        const val = i.value.trim();
        if (!val) return;
        missionData[`p${i.dataset.poly}-${i.dataset.f}`] = val;

       if (activeMissionId === 2) {
    // Split by comma, convert to numbers, and sort to compare regardless of order
    const student = val.split(',').map(v => parseFloat(v.trim())).sort();
    const correct = [...master[i.dataset.poly]].sort();

    // Check if the number of sides matches and if each side is within 0.1cm (1mm) tolerance
    if (student.length !== correct.length || student.some((v, idx) => Math.abs(v - correct[idx]) > 0.1)) {
        errors.push(`P${i.dataset.poly}`);
    }
} else if (missionRegistry[activeMissionId].type === "bulk") {
            if (master && parseInt(val) !== master[i.dataset.poly]) errors.push(`P${i.dataset.poly}`);
        }
    });

    if (errors.length > 0) return alert(`SATELLITE WARNING: Review ${[...new Set(errors)].join(', ')}`);

    await setDoc(doc(db, "mission_reports", getSessionKey()), {
        sessionKey: getSessionKey(), missionId: activeMissionId, agents: loggedInAgents, values: missionData, lastUpdated: new Date()
    });
    alert("INTELLIGENCE SEALED.");
    window.showScreen('home-screen');
};

window.openArchiveMenu = () => {
    const grid = document.getElementById('polygon-grid');
    grid.innerHTML = Array.from({length: 10}, (_, i) => `<button class="sia-btn" onclick="window.viewPolygonDetail(${i+1})">POLYGON ${i+1}</button>`).join('');
    window.showScreen('archive-menu');
};

window.viewPolygonDetail = async (polyId) => {
    const content = document.getElementById('detail-content');
    document.getElementById('detail-title').innerText = `POLYGON ${polyId} DOSSIER`;
    content.innerHTML = '<p>QUERYING...</p>';
    window.showScreen('polygon-detail');

    const q = query(collection(db, "mission_reports"), where("agents", "array-contains-any", loggedInAgents));
    const snap = await getDocs(q);
    let html = `<div class="sia-card">`;
    let found = false;

    snap.forEach(doc => {
        const report = doc.data();
        const mission = missionRegistry[report.missionId];
        const fields = (mission.type === "bulk") ? mission.fields : deepFields;
        fields.forEach(f => {
            const val = report.values[`p${polyId}-${f.id}`];
            if (val) { found = true; html += `<p><strong>${mission.title}</strong>: ${val}</p>`; }
        });
    });

    content.innerHTML = found ? html + `</div>` : `<p>No data recorded for this artifact.</p>`;
};

// --- GLOBAL NAV & SESSION ---
window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};
window.agentLogout = () => { if(confirm("ABANDON MISSION?")) { loggedInAgents = []; document.getElementById('active-agents-list').innerHTML = ''; document.getElementById('session-controls').style.display = 'none'; window.showScreen('login-screen'); }};
window.teacherLogin = () => signInWithPopup(auth, provider);
window.staffLogout = () => auth.signOut().then(() => location.reload());

window.startOperation = () => loggedInAgents.length > 0 ? (document.getElementById('session-controls').style.display='flex', window.showScreen('home-screen')) : alert("IDENTIFY AGENTS");

// --- UPDATED MISSION MANAGEMENT ---

// 1. Populate the Toggle List in the Teacher Console
const renderMissionToggles = () => {
    const list = document.getElementById('mission-toggle-list');
    if (!list) return;
    list.innerHTML = Object.keys(missionRegistry).map(k => `
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; cursor: pointer; color: white; margin-bottom: 5px;">
            <input type="checkbox" class="mission-chk" value="${k}" ${broadcastedMissionIds.includes(parseInt(k)) ? 'checked' : ''}>
            ${missionRegistry[k].title}
        </label>
    `).join('');
};

// 1. Teacher: Send selected missions to Firebase
window.broadcastMissions = async () => {
    const checkboxes = document.querySelectorAll('.mission-chk');
    const selectedIds = Array.from(checkboxes)
        .filter(chk => chk.checked)
        .map(chk => parseInt(chk.value));
    
    try {
        await setDoc(doc(db, "system", "state"), {
            activeMissions: selectedIds,
            lastUpdated: new Date()
        });
        alert("HQ: Mission Protocols Broadcasted to all terminals.");
    } catch (e) {
        console.error("Broadcast Error:", e);
    }
};

// 2. Student: Listen for live updates from Firebase
const listenForMissions = () => {
    onSnapshot(doc(db, "system", "state"), (snap) => {
        if (snap.exists()) {
            broadcastedMissionIds = snap.data().activeMissions || [];
            // If the user is currently on the mission hub, refresh it automatically
            if (document.getElementById('mission-hub').classList.contains('active')) {
                window.renderMissionHub();
            }
        }
    });
};

// 3. Updated Hub Renderer
window.renderMissionHub = () => {
    const list = document.getElementById('active-mission-list');
    list.innerHTML = '';

    if (!broadcastedMissionIds || broadcastedMissionIds.length === 0) {
        list.innerHTML = `
            <div class="sia-card" style="border-color: red; text-align: center;">
                <h3 style="color: red;">NO ACTIVE MISSIONS</h3>
                <p>Awaiting authorization from SIA Command.</p>
            </div>`;
    } else {
        broadcastedMissionIds.sort((a,b) => a - b).forEach(id => {
            const m = missionRegistry[id];
            if (m) {
                list.innerHTML += `
                    <div class="sia-card linked" onclick="window.openMission(${id})" style="margin-bottom: 10px;">
                        <h3>MISSION ${id}</h3>
                        <p>${m.title}</p>
                    </div>`;
            }
        });
    }
    window.showScreen('mission-hub');
};

// 4. Update the Auth Observer to trigger the toggle list
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.showScreen('teacher-screen');
        listenToRoster();
        listenForMissions(); // Teacher sees live updates too
        renderMissionToggles();
    }
});

// Add this at the very bottom of your index.js for students
listenForMissions();
