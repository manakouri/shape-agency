import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, setDoc, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

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

// --- MASTER MISSION REGISTRY ---
const missionRegistry = {
    "1": { title: "Counting Vertices", type: "bulk", fields: [{id:"v", label:"Vertices", type:"number"}] },
    "2": { title: "Side Lengths", type: "bulk", fields: [{id:"len", label:"Lengths (cm)", type:"text"}] },
    "3": { title: "Parallel Pairs", type: "bulk", fields: [{id:"para", label:"Parallel Pairs", type:"number"}] },
    "4": { title: "Right Angles", type: "bulk", fields: [{id:"right", label:"Right Angles", type:"number"}] },
    "5": { title: "Perpendicular Lines", type: "bulk", fields: [{id:"perp", label:"Perp. Pairs", type:"number"}] },
    "6": { title: "Acute Angles", type: "bulk", fields: [{id:"acute", label:"Acute Angles", type:"number"}] },
    "7": { title: "Angle Estimation", type: "bulk", fields: [{id:"est", label:"Estimate (0-180°)", type:"number"}] },
    "8": { title: "Protractor Pulse", type: "bulk", fields: [{id:"exact", label:"Exact Degrees", type:"number"}] },
    "9": { title: "Reflex Angles", type: "bulk", fields: [{id:"reflex", label:"Reflex Angles", type:"number"}] },
    "10": { title: "Symmetry Probe", type: "bulk", fields: [{id:"symm", label:"Lines of Symmetry", type:"number"}] },
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
    {id:"ang", label:"Angles (Type/Measure)", type:"text"},
    {id:"par", label:"Parallel Pairs", type:"number"},
    {id:"per", label:"Perp. Pairs", type:"number"},
    {id:"sym", label:"Symmetry Lines", type:"number"}
];

// --- APP STATE ---
let loggedInAgents = [];
let activeMissionId = 1;

// --- TEACHER LOGIC ---
onSnapshot(doc(db, "system", "config"), (snapshot) => {
    if (snapshot.exists()) activeMissionId = snapshot.data().currentMission;
});

window.requestTeacherAccess = () => {
    if (prompt("CLEARANCE CODE:") === "SIA2026") {
        const sel = document.getElementById('mission-release-select');
        sel.innerHTML = '';
        Object.keys(missionRegistry).forEach(k => {
            sel.innerHTML += `<option value="${k}">${k}: ${missionRegistry[k].title}</option>`;
        });
        showScreen('teacher-screen');
    }
};

window.releaseMission = async () => {
    const val = document.getElementById('mission-release-select').value;
    await setDoc(doc(db, "system", "config"), { currentMission: parseInt(val) });
    alert("Mission " + val + " Authorized.");
};

// --- AGENT LOGIC ---
window.registerAgent = () => {
    const val = document.getElementById('agent-id-input').value;
    if (val.length === 4) {
        loggedInAgents.push(val);
        const p = document.createElement('span');
        p.className = 'agent-pill';
        p.innerText = 'Agent ' + val;
        document.getElementById('active-agents-list').appendChild(p);
        document.getElementById('agent-id-input').value = '';
    }
};

window.startOperation = () => {
    if (loggedInAgents.length > 0) {
        document.getElementById('session-controls').style.display = 'flex';
        showScreen('home-screen');
    }
};

window.renderMissionHub = () => {
    const list = document.getElementById('active-mission-list');
    list.innerHTML = `
        <div class="sia-card" onclick="openMission(${activeMissionId})">
            <h3 style="color:var(--sia-neon)">MISSION ${activeMissionId} AVAILABLE</h3>
            <p>${missionRegistry[activeMissionId].title}</p>
        </div>`;
    showScreen('mission-hub');
};

window.openMission = (id) => {
    const m = missionRegistry[id];
    const container = document.getElementById('polygon-entry-list');
    container.innerHTML = '';
    document.getElementById('entry-title').innerText = m.title;

    if (m.type === "bulk") {
        for (let i = 1; i <= 10; i++) {
            container.innerHTML += `
                <div class="sia-card">
                    <h3>POLYGON ${i}</h3>
                    ${m.fields.map(f => `<label>${f.label}</label><input type="${f.type}" class="sia-input m-in" data-poly="${i}" data-f="${f.id}">`).join('')}
                </div>`;
        }
    } else {
        ['A', 'B', 'C'].forEach(v => {
            container.innerHTML += `
                <div class="sia-card">
                    <h3 style="color:var(--sia-blue)">Variant ${v}</h3>
                    ${deepFields.map(f => `<label>${f.label}</label><input type="${f.type}" class="sia-input m-in" data-variant="${v}" data-f="${f.id}">`).join('')}
                </div>`;
        });
        container.innerHTML += `
            <div class="sia-card">
                <h3>WRITTEN REPORT</h3>
                <label>BECAUSE...</label><textarea id="rep-b" class="sia-input"></textarea>
                <label>BUT...</label><textarea id="rep-bt" class="sia-input"></textarea>
                <label>SO...</label><textarea id="rep-s" class="sia-input"></textarea>
            </div>`;
    }
    showScreen('mission-entry');
};

window.submitMissionBatch = async () => {
    const inputs = document.querySelectorAll('.m-in');
    const mission = missionRegistry[activeMissionId];
    const data = {
        missionId: activeMissionId,
        agents: loggedInAgents,
        timestamp: new Date(),
        entries: []
    };

    inputs.forEach(i => {
        data.entries.push({
            polyId: i.dataset.poly || null,
            variant: i.dataset.variant || null,
            field: i.dataset.f,
            val: i.value
        });
    });

    if (mission.type === "deep") {
        data.report = { b: document.getElementById('rep-b').value, bt: document.getElementById('rep-bt').value, s: document.getElementById('rep-s').value };
    }

    await addDoc(collection(db, "submissions"), data);
    alert("Report Filed.");
    showScreen('home-screen');
};

window.renderPolygonArchiveGrid = () => {
    const grid = document.getElementById('polygon-archive-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const b = document.createElement('button');
        b.className = 'sia-btn';
        b.innerText = "Specimen " + i;
        b.onclick = () => viewPolygonDetail(i);
        grid.appendChild(b);
    }
    showScreen('polygon-archive');
};

window.viewPolygonDetail = async (id) => {
    document.getElementById('detail-polygon-name').innerText = "Specimen " + id;
    const hist = document.getElementById('polygon-history');
    hist.innerHTML = "Scanning Archives...";
    
    const q = query(collection(db, "submissions"), where("agents", "array-contains-any", loggedInAgents));
    const snap = await getDocs(q);
    hist.innerHTML = '';
    
    snap.forEach(doc => {
        const d = doc.data();
        d.entries.forEach(e => {
            if (e.polyId == id) {
                hist.innerHTML += `<div class="sia-card" style="font-size:0.8rem"><b>M${d.missionId}:</b> ${e.val}</div>`;
            }
        });
    });
    showScreen('polygon-detail-screen');
};

window.secureLogout = () => {
    if(confirm("Secure Logout?")) location.reload();
};

window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};
