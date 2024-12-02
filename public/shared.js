// shared.js

// Set DEV_MODE to true for development mode (anonymous auth)
// Set DEV_MODE to false for production mode (Google auth)

// Uncomment the line for the desired mode:

 const DEV_MODE = true; // Development Mode
//const DEV_MODE = false; // Production Mode

// Firebase configuration for Development and Production
const firebaseConfig = DEV_MODE ? {
    // Development Firebase config
    // Replace with your development Firebase project's config
    apiKey: "AIzaSyClFlC_URVRiFV_jdcG5L6ChxaTjH1Z7Qg",
    authDomain: "polaris-app-f0d6a.firebaseapp.com",
    projectId: "polaris-app-f0d6a",
    storageBucket: "polaris-app-f0d6a.firebasestorage.app",
    messagingSenderId: "573044910827",
    appId: "1:573044910827:web:a2fc7a0c330e651f92ecae",
    measurementId: "G-RBJ0LJ0S00"
} : {
    // Production Firebase config
    // Replace with your production Firebase project's config
    apiKey: "AIzaSyClFlC_URVRiFV_jdcG5L6ChxaTjH1Z7Qg",
    authDomain: "polaris-app-f0d6a.firebaseapp.com",
    projectId: "polaris-app-f0d6a",
    storageBucket: "polaris-app-f0d6a.firebasestorage.app",
    messagingSenderId: "573044910827",
    appId: "1:573044910827:web:a2fc7a0c330e651f92ecae",
    measurementId: "G-RBJ0LJ0S00"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Firestore and Auth
const db = firebase.firestore();
const auth = firebase.auth();

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
            // Update Missions Display if projectContentArea is visible
            if (typeof displayMissions === 'function' && !document.getElementById('projectContentArea').classList.contains('hidden')) {
                displayMissions();
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
    const navMenu = document.getElementById('navMenu');
    const mainSection = document.getElementById('mainSection');
    const projectsSection = document.getElementById('projects');
    const homePageSection = document.getElementById('homePageSection');

    if (user) {
        loadProjectsFromFirestore();
        // Update UI to show user is logged in
        document.getElementById('loginBtn').classList.add('hidden');
        document.getElementById('logoutBtn').classList.remove('hidden');
        if (typeof updateGreetingAndTime === 'function') {
            updateGreetingAndTime();
        }

        // Show navigation and main sections
        navMenu.classList.remove('hidden');
        homePageSection.classList.add('hidden');
        mainSection.classList.remove('hidden');
        projectsSection.classList.add('hidden'); // Show only main section initially
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

        // Hide navigation and main sections
        navMenu.classList.add('hidden');
        homePageSection.classList.remove('hidden');
        mainSection.classList.add('hidden');
        projectsSection.classList.add('hidden');

        if (DEV_MODE) {
            // Sign in anonymously in development mode
            auth.signInAnonymously().catch((error) => {
                showNotification('Failed to sign in anonymously.', 'error');
                console.error(error);
            });
        }
    }
});

// Login and Logout Button Event Listeners
document.getElementById('loginBtn').addEventListener('click', () => {
    if (DEV_MODE) {
        // In development mode, sign in anonymously
        auth.signInAnonymously().catch((error) => {
            showNotification('Failed to sign in anonymously.', 'error');
            console.error(error);
        });
    } else {
        // In production mode, use Google sign-in
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch((error) => {
            showNotification('Login failed.', 'error');
        });
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().catch((error) => {
        showNotification('Logout failed.', 'error');
    });
});

// Navigation Links Event Listeners
document.getElementById('homeLink').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('mainSection').classList.remove('hidden');
    document.getElementById('projects').classList.add('hidden');
});

document.getElementById('projectsLink').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('mainSection').classList.add('hidden');
    document.getElementById('projects').classList.remove('hidden');
});

// Expose shared variables and functions globally
window.projects = projects;
window.auth = auth;
window.db = db;
window.saveProjectsToFirestore = saveProjectsToFirestore;
window.updateProjectProgress = updateProjectProgress;
window.showNotification = showNotification;
