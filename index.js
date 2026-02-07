import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, setDoc, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
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

// --- FULLY VERIFIED VALIDATION MASTER DATA ---
const validationRegistry = {
    // Mission 1: Counting Vertices [cite: 6, 10]
    "1": { "1": 3, "2": 4, "3": 4, "4": 5, "5": 6, "6": 6, "7": 7, "8": 10, "9": 10, "10": 12 }, 
    
    // Mission 3: Parallel Pairs [cite: 6, 10]
    "3": { "1": 0, "2": 1, "3": 2, "4": 0, "5": 3, "6": 2, "7": 0, "8": 0, "9": 0, "10": 1 }, 
    
    // Mission 4: Right Angles [cite: 6, 10]
    "4": { "1": 0, "2": 2, "3": 0, "4": 0, "5": 0, "6": 5, "7": 0, "8": 0, "9": 0, "10": 0 }, 
    
    // Mission 5: Perpendicular Pairs [cite: 6, 10]
    "5": { "1": 0, "2": 2, "3": 0, "4": 0, "5": 0, "6": 5, "7": 0, "8": 0, "9": 0, "10": 0 }, 
    
    // Mission 6: Acute Angles [cite: 6, 10]
    "6": { "1": 3, "2": 1, "3": 2, "4": 0, "5": 0, "6": 0, "7": 1, "8": 5, "9": 2, "10": 6 }, 
    
    // Mission 9: Reflex Angles [cite: 6, 10]
    "9": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 1, "7": 0, "8": 5, "9": 0, "10": 2 }, 
    
    // Mission 10: Lines of Symmetry [cite: 6, 10]
    "10": { "1": 3, "2": 0, "3": 0, "4": 0, "5": 6, "6": 0, "7": 0, "8": 1, "9": 0, "10": 0 }, 

    // Deep Dive Vertex Validation (Missions 11-24) [cite: 8, 10]
    "11": 3, "12": 3, "13": 3, "14": 4, "15": 4, "16": 4, "18": 5, 
    "19": 6, "20": 7, "21": 9, "22": 10, "23": 11, "24": 12
};

const missionRegistry = {
    "1": { title: "Counting Vertices", type: "bulk", fields: [{id:"v", label:"Vertices", type:"number"}] },
    "2": { title: "Side Lengths", type: "bulk", fields: [{id:"len", label:"Length (cm)", type:"text"}] },
    "3": { title: "Parallel Pairs", type: "bulk", fields: [{id:"para", label:"Parallel Pairs", type:"number"}] },
    "4": { title: "Right Angles", type: "bulk", fields: [{id:"right", label:"Right Angles", type:"number"}] },
    "5": { title: "Perpendicular Lines", type: "bulk", fields: [{id:"perp", label:"Perp. Pairs", type:"number"}] },
    "6": { title: "Acute Angles", type: "bulk", fields: [{id:"acute", label:"Acute Angles", type:"number"}] },
    "7": { title: "Naming Angles (0-180°)", type: "bulk", fields: [{id:"est", label:"Estimate", type:"number"}] },
    "8": { title: "Exact Measurements", type: "bulk", fields: [{id:"exact", label:"Degrees (°)", type:"number"}] },
    "9": { title: "Reflex Angles", type: "bulk", fields: [{id:"reflex", label:"Reflex Angles", type:"number"}] },
    "10": { title: "Lines of Symmetry", type: "bulk", fields: [{id:"symm", label:"Symmetry Lines", type:"number"}] },
    "11": { title: "Equilateral Triangles", type: "deep", target: "Triangle" },
    "12": { title: "Isosceles Triangles", type: "deep", target: "Triangle" },
    "13": { title: "Scalene Triangles", type: "deep", target: "Triangle" },
    "14": { title: "Rectangles", type: "deep", target: "Quadrilateral" },
    "15": { title: "Squares", type: "deep", target: "Quadrilateral" },
    "16": { title: "Rhombus", type: "deep", target: "Quadrilateral" },
    "17": { title: "Regularity Standard", type: "deep", target: "Polygon" },
    "18": { title: "Pentagon", type: "deep", target: "Pentagon" },
    "19": { title: "Hexagon", type: "deep", target: "Hexagon" },
    "20": { title: "Septagon", type: "deep", target: "Septagon" },
    "21": { title: "Nonagon", type: "deep", target: "Nonagon" },
    "22": { title: "Decagon", type: "deep", target: "Decagon" },
    "23": { title: "Hendecagon", type: "deep", target: "Hendecagon" },
    "24": { title: "Dodecagon", type: "deep", target: "Dodecagon" }
};

const deepFields = [
    {id:"v", label:"Vertices", type:"number"},
    {id:"ang", label:"Angle Data", type:"text"},
    {id:"par", label:"Parallel Pairs", type:"number"},
    {id:"per", label:"Perp. Pairs", type:"number"},
    {id:"sym", label:"Symmetry Lines", type:"number"}
];

let loggedInAgents = [];
let activeMissionId = 1;
let currentArchiveAgent = null;

window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelector('main').scrollTop = 0;
};

// --- TEACHER SYSTEM ---
onSnapshot(doc(db, "system", "config"), (snapshot) => {
    if (snapshot.exists()) activeMissionId = snapshot.data().currentMission;
});

window.teacherLogin = () => signInWithPopup(auth, provider).catch(e => alert(e.message));
window.staffLogout = () => auth.signOut().then(() => location.reload());

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadRoster();
        renderTeacherMissionGrid();
        const sel = document.getElementById('mission-release-select');
        if (sel) {
            sel.innerHTML = '';
            Object.keys(missionRegistry).forEach(k => {
                sel.innerHTML += `<option value="${k}">M${k}: ${missionRegistry[k].title}</option>`;
            });
        }
        showScreen('teacher-screen');
    }
});

function renderTeacherMissionGrid() {
    const grid = document.getElementById('teacher-mission-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 1; i <= 24; i++) {
        const mId = i.toString();
        const b = document.createElement('button');
        b.className = 'sia-btn';
        b.style.fontSize = '0.7rem';
        b.innerHTML = `INTEL: M${mId}`;
        b.onclick = () => window.viewMissionSubmissions(mId);
        grid.appendChild(b);
    }
}

window.viewMissionSubmissions = async (mId) => {
    const overlay = document.getElementById('submission-ledger-overlay');
    const content = document.getElementById('ledger-content');
    overlay.style.display = 'block';
    const q = query(collection(db, "submissions"), where("missionId", "==", parseInt(mId)));
    const snap = await getDocs(q);
    content.innerHTML = snap.empty ? "No data reported." : '';
    snap.forEach(docSnap => {
        const d = docSnap.data();
        content.innerHTML += `<div class="sia-card"><b>Agents: ${d.agents.join(', ')}</b><br>${d.entries.map(e => `${e.polyId || 'Variant '+e.variant}: ${e.val}`).join(' | ')}</div>`;
    });
};

window.createNewAgent = async () => {
    const name = document.getElementById('new-agent-name').value;
    const code = document.getElementById('new-agent-code').value;
    if (name && code.length === 4) {
        await setDoc(doc(db, "roster", code), { agentName: name, agentCode: code });
        loadRoster();
    }
};

async function loadRoster() {
    const list = document.getElementById('roster-list');
    const snap = await getDocs(collection(db, "roster"));
    list.innerHTML = '<h4>AUTHORIZED AGENTS</h4>';
    snap.forEach(d => { list.innerHTML += `<div>${d.data().agentCode}: ${d.data().agentName}</div>`; });
}

window.releaseMission = async () => {
    const val = document.getElementById('mission-release-select').value;
    await setDoc(doc(db, "system", "config"), { currentMission: parseInt(val) });
    alert("Field Protocol Updated.");
};

// --- AGENT ACTIONS ---
window.registerAgent = async () => {
    const val = document.getElementById('agent-id-input').value;
    const q = query(collection(db, "roster"), where("agentCode", "==", val));
    const agentDoc = await getDocs(q);
    if (!agentDoc.empty) {
        if (!loggedInAgents.includes(val)) {
            loggedInAgents.push(val);
            const p = document.createElement('span');
            p.className = 'agent-pill';
            p.innerText = 'AGENT ' + val;
            document.getElementById('active-agents-list').appendChild(p);
        }
    } else { alert("ACCESS DENIED."); }
    document.getElementById('agent-id-input').value = '';
};

window.startOperation = () => {
    if (loggedInAgents.length > 0) {
        document.getElementById('session-controls').style.display = 'flex';
        showScreen('home-screen');
    }
};

window.renderMissionHub = () => {
    const list = document.getElementById('active-mission-list');
    list.innerHTML = `<div class="sia-card" onclick="openMission(${activeMissionId})" style="cursor:pointer; border-color:var(--sia-neon);"><h3>MISSION ${activeMissionId}</h3><p>${missionRegistry[activeMissionId].title}</p></div>`;
    showScreen('mission-hub');
};

window.openMission = (id) => {
    const m = missionRegistry[id];
    const container = document.getElementById('polygon-entry-list');
    container.innerHTML = '';
    if (m.type === "bulk") {
        for (let i = 1; i <= 10; i++) {
            container.innerHTML += `<div class="sia-card"><h3>POLYGON ${i}</h3>${m.fields.map(f => `<label>${f.label}</label><input class="sia-input m-in" data-poly="${i}" data-f="${f.id}">`).join('')}</div>`;
        }
    } else {
        ['A', 'B', 'C'].forEach(v => {
            container.innerHTML += `<div class="sia-card"><h3>Variant ${v}</h3>${deepFields.map(f => `<label>${f.label}</label><input class="sia-input m-in" data-variant="${v}" data-f="${f.id}">`).join('')}</div>`;
        });
        container.innerHTML += `<div class="sia-card"><textarea id="rep-b" class="sia-input" placeholder="BECAUSE..."></textarea><textarea id="rep-bt" class="sia-input" placeholder="BUT..."></textarea><textarea id="rep-s" class="sia-input" placeholder="SO..."></textarea></div>`;
    }
    showScreen('mission-entry');
};

// --- SUBMISSION WITH FULL VALIDATION ---
window.submitMissionBatch = async () => {
    const inputs = document.querySelectorAll('.m-in');
    const mission = missionRegistry[activeMissionId];
    let errors = [];

    // Bulk Mission Validation (Missions 1, 3, 4, 5, 6, 9, 10)
    if (validationRegistry[activeMissionId] && typeof validationRegistry[activeMissionId] === 'object') {
        inputs.forEach(i => {
            const polyId = i.dataset.poly;
            const correctVal = validationRegistry[activeMissionId][polyId];
            if (i.value && parseInt(i.value) !== correctVal) {
                errors.push(`Polygon ${polyId}`);
            }
        });
    }

    // Deep Dive Vertex Validation (Missions 11-24)
    if (validationRegistry[activeMissionId] && typeof validationRegistry[activeMissionId] === 'number') {
        inputs.forEach(i => {
            if (i.dataset.f === 'v' && i.value && parseInt(i.value) !== validationRegistry[activeMissionId]) {
                errors.push(`Variant ${i.dataset.variant}`);
            }
        });
    }

    if (errors.length > 0) {
        alert(`⚠️ INTEL DISCREPANCY:\nSatellite data suggests errors in: ${errors.join(', ')}.\n\nRe-verify these shapes immediately.`);
        return;
    }

    const data = { missionId: activeMissionId, agents: loggedInAgents, timestamp: new Date(), entries: [] };
    inputs.forEach(i => { if(i.value) data.entries.push({ polyId: i.dataset.poly || null, variant: i.dataset.variant || null, field: i.dataset.f, val: i.value }); });
    if (mission.type === "deep") data.report = { b: document.getElementById('rep-b').value, bt: document.getElementById('rep-bt').value, s: document.getElementById('rep-s').value };
    
    await addDoc(collection(db, "submissions"), data);
    alert("Intelligence Sealed.");
    showScreen('home-screen');
};

// --- ARCHIVE LOGIC ---
window.unlockArchive = () => {
    const code = document.getElementById('archive-access-id').value;
    if (loggedInAgents.includes(code)) {
        currentArchiveAgent = code;
        document.getElementById('archive-access-lock').style.display = 'none';
        document.getElementById('archive-display').style.display = 'block';
        document.getElementById('viewing-as-label').innerText = `DECRYPTING RECORDS FOR: ${code}`;
        renderPolygonArchiveGrid();
    } else { alert("ID NOT RECOGNIZED."); }
};

window.relockArchive = () => {
    currentArchiveAgent = null;
    document.getElementById('archive-access-lock').style.display = 'block';
    document.getElementById('archive-display').style.display = 'none';
};

window.renderPolygonArchiveGrid = () => {
    const grid = document.getElementById('polygon-archive-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const b = document.createElement('button');
        b.className = 'sia-btn';
        b.innerHTML = `POLYGON ${i}`;
        b.onclick = () => window.viewPolygonDetail(i);
        grid.appendChild(b);
    }
};

window.viewPolygonDetail = async (id) => {
    const hist = document.getElementById('polygon-history');
    hist.innerHTML = "Scanning...";
    const q = query(collection(db, "submissions"), where("agents", "array-contains", currentArchiveAgent));
    const snap = await getDocs(q);
    hist.innerHTML = '';
    let found = false;
    snap.forEach(docSnap => {
        const d = docSnap.data();
        d.entries.forEach(e => {
            if (e.polyId == id) {
                found = true;
                hist.innerHTML += `<div class="sia-card"><b>M${d.missionId}: ${missionRegistry[d.missionId].title}</b><br>Result: ${e.val}</div>`;
            }
        });
    });
    if (!found) hist.innerHTML = "No record found.";
    showScreen('polygon-detail-screen');
};
