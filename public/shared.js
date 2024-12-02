// shared.js

// Initialize Firebase (Add your Firebase configuration here)
if (!firebase.apps.length) {
    firebase.initializeApp({
          apiKey: "AIzaSyClFlC_URVRiFV_jdcG5L6ChxaTjH1Z7Qg",
          authDomain: "polaris-app-f0d6a.firebaseapp.com",
          projectId: "polaris-app-f0d6a",
          storageBucket: "polaris-app-f0d6a.firebasestorage.app",
          messagingSenderId: "573044910827",
          appId: "1:573044910827:web:a2fc7a0c330e651f92ecae",
          measurementId: "G-RBJ0LJ0S00"
      });
}

// Initialize Firestore and Auth
const db = firebase.firestore();
const auth = firebase.auth();

if (window.location.hostname === 'localhost') {
    db.useEmulator('localhost', 8080); // Replace 8080 with your Firestore emulator port
    auth.useEmulator('http://localhost:9099/'); // Replace 9099 with your Auth emulator port
}

// Shared Data
let projects = [];

// Utility Functions
function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notificationContainer');
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.innerText = message;
    notificationContainer.appendChild(toast);

    // Remove toast after animation ends (4s)
    toast.addEventListener('animationend', (e) => {
        if (e.animationName === 'fadeOut') {
            toast.remove();
        }
    });
}

function updateProjectProgress(projectIndex) {
    const project = projects[projectIndex];
    let totalWeight = 0;
    let completedWeight = 0;

    const mainMissionCount = project.missions.length;
    if (mainMissionCount === 0) {
        project.progress = 0;
        return;
    }

    // Each main mission contributes equally to the total progress
    const mainMissionWeight = 100 / mainMissionCount;

    project.missions.forEach(mission => {
        if (mission.type === 'single') {
            totalWeight += mainMissionWeight;
            if (mission.status === 'done') {
                completedWeight += mainMissionWeight;
            }
        } else if (mission.type === 'withSubmissions') {
            const subMissionCount = mission.subMissions.length;
            if (subMissionCount === 0) {
                // If no sub-missions, skip progress calculation for this mission
                return;
            }
            const subMissionWeight = mainMissionWeight / subMissionCount;
            mission.subMissions.forEach(sub => {
                totalWeight += subMissionWeight;
                if (sub.status === 'done') {
                    completedWeight += subMissionWeight;
                }
            });
        }
    });

    project.progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
}

// Save Projects to Firestore
function saveProjectsToFirestore() {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('users').doc(user.uid).set({
        projects: projects
    }).catch((error) => {
        showNotification('Failed to save data.', 'error');
    });
}

// Load Projects from Firestore
function loadProjectsFromFirestore() {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('users').doc(user.uid).onSnapshot((doc) => {
        if (doc.exists) {
            projects = doc.data().projects || [];
            // Update UI in both scripts
            if (typeof displayProjects === 'function') {
                displayProjects();
            }
            if (typeof renderInProgressMissions === 'function') {
                renderInProgressMissions();
            }
        } else {
            projects = [];
            if (typeof displayProjects === 'function') {
                displayProjects();
            }
            if (typeof renderInProgressMissions === 'function') {
                renderInProgressMissions();
            }
        }
    }, (error) => {
        showNotification('Failed to load data.', 'error');
    });
}

// Authentication State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        loadProjectsFromFirestore();
        // Update UI to show user is logged in
        document.getElementById('loginBtn').classList.add('hidden');
        document.getElementById('logoutBtn').classList.remove('hidden');
        updateGreetingAndTime();
    } else {
        projects = [];
        if (typeof displayProjects === 'function') {
            displayProjects();
        }
        if (typeof renderInProgressMissions === 'function') {
            renderInProgressMissions();
        }
        // Update UI to show user is logged out
        document.getElementById('loginBtn').classList.remove('hidden');
        document.getElementById('logoutBtn').classList.add('hidden');
    }
});

// Expose shared variables and functions globally
window.projects = projects;
window.auth = auth;
window.db = db;
window.saveProjectsToFirestore = saveProjectsToFirestore;
window.updateProjectProgress = updateProjectProgress;
window.showNotification = showNotification;
