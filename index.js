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

// --- REGISTRY ---
const missionRegistry = {
    "1": { title: "Counting Vertices", type: "bulk", fields: [{id:"v", label:"Vertices"}] },
    "2": { title: "Side Lengths", type: "bulk", fields: [{id:"len", label:"Length (cm)"}] },
    "3": { title: "Parallel Pairs", type: "bulk", fields: [{id:"para", label:"Parallel Pairs"}] },
    "4": { title: "Right Angles", type: "bulk", fields: [{id:"right", label:"Right Angles"}] },
    "5": { title: "Perpendicular Lines", type: "bulk", fields: [{id:"perp", label:"Perp. Pairs"}] },
    "6": { title: "Acute Angles", type: "bulk", fields: [{id:"acute", label:"Acute Angles"}] },
    "7": { title: "Angle Estimation", type: "bulk", fields: [{id:"est", label:"Estimate"}] },
    "8": { title: "Exact Measurements", type: "bulk", fields: [{id:"exact", label:"Degrees"}] },
    "9": { title: "Reflex Angles", type: "bulk", fields: [{id:"reflex", label:"Reflex Angles"}] },
    "10": { title: "Symmetry Probe", type: "bulk", fields: [{id:"symm", label:"Symmetry Lines"}] },
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

// --- TEACHER SYSTEM ---
onSnapshot(doc(db, "system", "config"), (snap) => { if(snap.exists()) activeMissionId = snap.data().currentMission; });

window.teacherLogin = () => signInWithPopup(auth, provider);

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadRoster();
        loadAllSubmissions(); // New: Teacher can see all data
        const sel = document.getElementById('mission-release-select');
        sel.innerHTML = '';
        Object.keys(missionRegistry).forEach(k => {
            sel.innerHTML += `<option value="${k}">${k}: ${missionRegistry[k].title}</option>`;
        });
        showScreen('teacher-screen');
    }
});

async function loadAllSubmissions() {
    const feed = document.getElementById('live-data-feed');
    if(!feed) return;
    feed.innerHTML = "<h3>ALL STUDENT SUBMISSIONS</h3>";
    const snap = await getDocs(query(collection(db, "submissions"), orderBy("timestamp", "desc")));
    snap.forEach(docSnap => {
        const d = docSnap.data();
        feed.innerHTML += `
            <div class="sia-card" style="font-size:0.8rem; border-color:var(--sia-blue)">
                <b>Mission ${d.missionId}</b> | Agents: ${d.agents.join(', ')} <br>
                <small>${d.timestamp.toDate().toLocaleString()}</small>
                <hr style="border:0; border-top:1px solid #333">
                ${d.entries.map(e => `[Poly ${e.polyId || e.variant}]: ${e.val}`).join(' | ')}
            </div>`;
    });
}

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
    alert("Mission " + val + " released.");
};

// --- STUDENT ACTIONS ---
window.registerAgent = async () => {
    const val = document.getElementById('agent-id-input').value;
    const q = query(collection(db, "roster"), where("agentCode", "==", val));
    const snap = await getDocs(q);
    if (!snap.empty) {
        if (!loggedInAgents.includes(val)) {
            loggedInAgents.push(val);
            const p = document.createElement('span');
            p.className = 'agent-pill';
            p.innerText = 'AGENT ' + val;
            document.getElementById('active-agents-list').appendChild(p);
        }
    } else { alert("Code not found."); }
    document.getElementById('agent-id-input').value = '';
};

window.startOperation = () => { if(loggedInAgents.length > 0) showScreen('home-screen'); };

window.renderMissionHub = () => {
    const list = document.getElementById('active-mission-list');
    list.innerHTML = `
        <div class="sia-card" onclick="openMission(${activeMissionId})" style="border-color:var(--sia-neon); cursor:pointer">
            <h3>MISSION ${activeMissionId}</h3>
            <p>${missionRegistry[activeMissionId].title}</p>
        </div>`;
    showScreen('mission-hub');
};

window.openMission = (id) => {
    const m = missionRegistry[id];
    const container = document.getElementById('polygon-entry-list');
    container.innerHTML = '';
    if (m.type === "bulk") {
        for (let i = 1; i <= 10; i++) {
            container.innerHTML += `<div class="sia-card"><h3>POLYGON ${i}</h3>
                ${m.fields.map(f => `<label>${f.label}</label><input class="sia-input m-in" data-poly="${i}" data-f="${f.id}">`).join('')}
            </div>`;
        }
    } else {
        ['A', 'B', 'C'].forEach(v => {
            container.innerHTML += `<div class="sia-card"><h3>Variant ${v}</h3>
                ${deepFields.map(f => `<label>${f.label}</label><input class="sia-input m-in" data-variant="${v}" data-f="${f.id}">`).join('')}
            </div>`;
        });
    }
    showScreen('mission-entry');
};

window.submitMissionBatch = async () => {
    const inputs = document.querySelectorAll('.m-in');
    const data = { missionId: activeMissionId, agents: loggedInAgents, timestamp: new Date(), entries: [] };
    inputs.forEach(i => { if(i.value) data.entries.push({ polyId: i.dataset.poly || null, variant: i.dataset.variant || null, field: i.dataset.f, val: i.value }); });
    await addDoc(collection(db, "submissions"), data);
    alert("Report Filed.");
    showScreen('home-screen');
};

// --- ARCHIVE LOGIC (THE FIX) ---
window.renderPolygonArchiveGrid = () => {
    const grid = document.getElementById('polygon-archive-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const b = document.createElement('button');
        b.className = 'sia-btn';
        b.innerHTML = `POLYGON ${i}`;
        b.onclick = () => viewPolygonDetail(i);
        grid.appendChild(b);
    }
    showScreen('polygon-archive');
};

window.viewPolygonDetail = async (id) => {
    const polyId = id.toString();
    const hist = document.getElementById('polygon-history');
    hist.innerHTML = "Scanning Archives...";
    
    // We fetch all submissions that contain any of our logged-in agent IDs
    const q = query(collection(db, "submissions"), 
                    where("agents", "array-contains-any", loggedInAgents));
    
    const snap = await getDocs(q);
    hist.innerHTML = '';
    let found = false;

    snap.forEach(docSnap => {
        const d = docSnap.data();
        d.entries.forEach(e => {
            if (e.polyId === polyId) {
                found = true;
                hist.innerHTML += `
                    <div class="sia-card" style="border-left:4px solid var(--sia-neon)">
                        <label>MISSION ${d.missionId}: ${missionRegistry[d.missionId].title}</label>
                        <div>${e.val}</div>
                    </div>`;
            }
        });
    });

    if (!found) hist.innerHTML = "No intelligence gathered for Polygon " + polyId;
    showScreen('polygon-detail-screen');
};

window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};
