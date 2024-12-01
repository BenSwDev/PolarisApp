// app.js
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClFlC_URVRiFV_jdcG5L6ChxaTjH1Z7Qg",
  authDomain: "polaris-app-f0d6a.firebaseapp.com",
  projectId: "polaris-app-f0d6a",
  storageBucket: "polaris-app-f0d6a.firebasestorage.app",
  messagingSenderId: "573044910827",
  appId: "1:573044910827:web:a2fc7a0c330e651f92ecae",
  measurementId: "G-RBJ0LJ0S00"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
window.auth = firebase.auth();
window.db = firebase.firestore();

// Data Storage
let projects = [];
let currentProjectIndex = null;
let editMissionIndex = null;
let editSubMissionIndex = null;

// Utility Functions
function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ----------------------------
   Notification Functions
---------------------------- */

// Show Notification
function showNotification(message, type = 'info') {
    const notificationContainer = $('#notificationContainer');
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

/* ----------------------------
   Confirmation Modal Functions
---------------------------- */

// Show Confirmation Modal
function showConfirmation(message, callback) {
    const confirmationModal = $('#confirmationModal');
    const confirmationMessage = $('#confirmationMessage');
    confirmationMessage.innerText = message;
    showElement(confirmationModal);

    // Handler for Yes
    const handleYes = () => {
        hideElement(confirmationModal);
        confirmationYesBtn.removeEventListener('click', handleYes);
        confirmationNoBtn.removeEventListener('click', handleNo);
        callback(true);
    };

    // Handler for No
    const handleNo = () => {
        hideElement(confirmationModal);
        confirmationYesBtn.removeEventListener('click', handleYes);
        confirmationNoBtn.removeEventListener('click', handleNo);
        callback(false);
    };

    const confirmationYesBtn = $('#confirmYesBtn');
    const confirmationNoBtn = $('#confirmNoBtn');
    const closeConfirmationModal = $('#closeConfirmationModal');

    confirmationYesBtn.addEventListener('click', handleYes);
    confirmationNoBtn.addEventListener('click', handleNo);
    closeConfirmationModal.addEventListener('click', handleNo);

    // Allow closing modal with Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            handleNo();
        }
    };
    document.addEventListener('keydown', handleEscape);

    // Cleanup event listener after modal is closed
    confirmationModal.addEventListener('transitionend', () => {
        document.removeEventListener('keydown', handleEscape);
    }, { once: true });
}

/* ----------------------------
   Show/Hide Element Functions
---------------------------- */

function showElement(element) {
    if (!element) {
        console.error('Element not found');
        return;
    }
    if (element.classList.contains('modal')) {
        element.style.display = 'flex'; // Flex for modals
    } else {
        element.style.display = 'block'; // Block for others
    }
    element.classList.remove('hidden');
}

function hideElement(element) {
    if (!element) {
        console.error('Element not found');
        return;
    }
    element.style.display = 'none'; // Explicitly hide
    element.classList.add('hidden');
}

/* ----------------------------
   Update Sub-Missions Count Function
---------------------------- */

function updateSubMissionsCount() {
    const subMissionsContainer = $('#subMissionsContainer');
    const subMissionCount = subMissionsContainer.children.length;
    const maxSubMissions = 10;
    const remaining = maxSubMissions - subMissionCount;

    let countDisplay = $('#subMissionsCount');
    if (!countDisplay) {
        countDisplay = document.createElement('p');
        countDisplay.id = 'subMissionsCount';
        $('#subMissionsSection').insertBefore(countDisplay, $('#addSubMissionBtn'));
    }
    countDisplay.innerText = `You can add ${remaining} more sub-mission(s).`;
}

/* ----------------------------
   Event Listeners for Modals
---------------------------- */

// Project Modal (Add/Edit)
$('#addProjectBtn').addEventListener('click', () => {
    $('#projectModalTitle').innerText = 'Add New Project';
    $('#projectForm').reset();
    $('#projectForm').dataset.mode = 'add';
    showElement($('#projectModal'));
    $('#projectName').focus();
});

$('#closeProjectModal').addEventListener('click', () => {
    hideElement($('#projectModal'));
});

// Project Form Submission
$('#projectForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = $('#projectName').value.trim();
    const description = $('#projectDescription').value.trim();

    if (!name || !description) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }

    if (this.dataset.mode === 'add') {
        // Add Project
        if (projects.some(project => project.name.toLowerCase() === name.toLowerCase())) {
            showNotification('Project name already exists!', 'error');
            return;
        }

        const newProject = {
            name,
            description,
            missions: [],
            progress: 0
        };

        projects.push(newProject);
        showNotification('Project added successfully!', 'success');
    } else if (this.dataset.mode === 'edit') {
        // Edit Project
        if (projects.some((project, idx) => project.name.toLowerCase() === name.toLowerCase() && idx !== currentProjectIndex)) {
            showNotification('Another project with this name already exists!', 'error');
            return;
        }

        projects[currentProjectIndex].name = name;
        projects[currentProjectIndex].description = description;
        showNotification('Project updated successfully!', 'success');
    }

    // Save to Firestore
    saveProjectsToFirestore();

    // Update UI
    hideElement($('#projectModal'));
    this.reset();
    this.dataset.mode = 'add';
    currentProjectIndex = null;
});

/* ----------------------------
   Description Modal Close
---------------------------- */

$('#closeDescriptionModal').addEventListener('click', () => {
    hideElement($('#descriptionModal'));
});

/* ----------------------------
   Project Content Area Close
---------------------------- */

$('#closeProjectContentArea').addEventListener('click', () => {
    hideElement($('#projectContentArea'));
    currentProjectIndex = null;
});

/* ----------------------------
   Mission Modal (Add/Edit)
---------------------------- */

// Add Mission Button Listener
$('#addMissionBtn').addEventListener('click', () => {
    $('#missionModalTitle').innerText = 'Add New Mission';
    $('#missionForm').reset();
    $('#missionForm').dataset.mode = 'add';
    editMissionIndex = null;

    // During mission creation, enable mission type select
    $('#missionType').disabled = false;
    hideElement($('#subMissionsSection'));
    $('#subMissionsContainer').innerHTML = '';
    updateSubMissionsCount();

    showElement($('#missionModal'));
    $('#missionName').focus();
});

$('#closeMissionModal').addEventListener('click', () => {
    hideElement($('#missionModal'));
    $('#missionForm').reset();
    $('#subMissionsSection').classList.add('hidden');
    $('#subMissionsContainer').innerHTML = '';
    editMissionIndex = null;
    updateSubMissionsCount();

    // Re-enable missionType select in case it was disabled during add mode
    $('#missionType').disabled = false;
});

// Handle Mission Type Change
$('#missionType').addEventListener('change', function () {
    if (this.value === 'withSubmissions') {
        showElement($('#subMissionsSection'));
        updateSubMissionsCount();
    } else {
        hideElement($('#subMissionsSection'));
        $('#subMissionsContainer').innerHTML = '';
    }
});

// Handle Add Sub-Mission Button
$('#addSubMissionBtn').addEventListener('click', () => {
    const subMissionsContainer = $('#subMissionsContainer');
    const subMissionCount = subMissionsContainer.children.length;
    const maxSubMissions = 10;

    if (subMissionCount >= maxSubMissions) {
        showNotification(`You can add up to ${maxSubMissions} sub-missions.`, 'error');
        return;
    }

    const subMissionDiv = document.createElement('div');
    subMissionDiv.className = 'sub-mission';

    subMissionDiv.innerHTML = `
        <label>Name:</label>
        <input type="text" class="subMissionName" required>
        <label>Description:</label>
        <textarea class="subMissionDescription" required></textarea>
        <button type="button" class="btn removeSubMissionBtn">Remove</button>
    `;

    subMissionsContainer.appendChild(subMissionDiv);
    subMissionDiv.querySelector('.subMissionName').focus();

    // Handle Remove Sub-Mission Button
    subMissionDiv.querySelector('.removeSubMissionBtn').addEventListener('click', () => {
        subMissionsContainer.removeChild(subMissionDiv);
        updateSubMissionsCount();
    });

    updateSubMissionsCount();
});

/* ----------------------------
   Mission Form Submission (Add/Edit)
---------------------------- */

$('#missionForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = $('#missionName').value.trim();
    const description = $('#missionDescription').value.trim();
    const type = $('#missionType').value;

    if (!name || !description) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }

    const project = projects[currentProjectIndex];

    // **Issue 3: Duplicate Mission Names**
    if (this.dataset.mode === 'add') {
        if (project.missions.some(mission => mission.name.toLowerCase() === name.toLowerCase())) {
            showNotification('Mission name already exists!', 'error');
            return;
        }
    } else if (this.dataset.mode === 'edit') {
        if (project.missions.some((mission, idx) => mission.name.toLowerCase() === name.toLowerCase() && idx !== editMissionIndex)) {
            showNotification('Another mission with this name already exists!', 'error');
            return;
        }
    }

    if (this.dataset.mode === 'add') {
        // Add Mission
        const newMission = {
            name,
            description,
            type,
            status: type === 'single' ? 'not started' : null,
            subMissions: type === 'withSubmissions' ? [] : null
        };

        project.missions.push(newMission);
        showNotification('Mission added successfully!', 'success');
    } else if (this.dataset.mode === 'edit') {
        // Edit Mission
        const mission = project.missions[editMissionIndex];
        const originalType = mission.type;

        // Handle type change
        if (originalType !== type) {
            if (originalType === 'withSubmissions' && type === 'single') {
                if (mission.subMissions.length > 0) {
                    showNotification('Cannot change mission type to single while it has sub-missions. Please delete all sub-missions first.', 'error');
                    return;
                } else {
                    mission.type = type;
                    mission.status = 'not started';
                    mission.subMissions = null;
                }
            } else if (originalType === 'single' && type === 'withSubmissions') {
                mission.type = type;
                mission.status = null;
                mission.subMissions = [];
            }
        }

        mission.name = name;
        mission.description = description;
        showNotification('Mission updated successfully!', 'success');
    }

    // Handle Sub-Missions
    if (type === 'withSubmissions') {
        const subMissionsContainer = $('#subMissionsContainer');
        const subMissionElements = subMissionsContainer.querySelectorAll('.sub-mission');
        const maxSubMissions = 10;

        // **Issue 3: Duplicate Sub-Mission Names**
        const subMissionNames = [];

        let hasEmptyFields = false;
        subMissionElements.forEach((elem) => {
            const subMissionName = elem.querySelector('.subMissionName').value.trim();
            const subMissionDescription = elem.querySelector('.subMissionDescription').value.trim();

            if (!subMissionName || !subMissionDescription) {
                hasEmptyFields = true;
                return;
            }

            if (subMissionNames.includes(subMissionName.toLowerCase())) {
                hasEmptyFields = true;
                showNotification('Duplicate sub-mission names are not allowed.', 'error');
                return;
            }

            subMissionNames.push(subMissionName.toLowerCase());
        });

        if (hasEmptyFields) {
            return;
        }

        const subMissionsData = [];
        subMissionElements.forEach((elem) => {
            const subMissionName = elem.querySelector('.subMissionName').value.trim();
            const subMissionDescription = elem.querySelector('.subMissionDescription').value.trim();

            subMissionsData.push({
                name: subMissionName,
                description: subMissionDescription,
                status: 'not started'
            });
        });

        if (this.dataset.mode === 'add') {
            project.missions.slice(-1)[0].subMissions = subMissionsData;
        } else if (this.dataset.mode === 'edit') {
            project.missions[editMissionIndex].subMissions = subMissionsData;
        }
    }

    // Save to Firestore
    saveProjectsToFirestore();

    // Update UI
    hideElement($('#missionModal'));
    this.reset();
    this.dataset.mode = 'add';
    editMissionIndex = null;
    updateSubMissionsCount();

    // Re-enable missionType select after adding/editing
    $('#missionType').disabled = false;
});

/* ----------------------------
   Edit Sub-Mission Modal Close
---------------------------- */

$('#closeEditSubMissionModal').addEventListener('click', () => {
    hideElement($('#editSubMissionModal'));
    $('#editSubMissionForm').reset();
    editMissionIndex = null;
    editSubMissionIndex = null;
});

/* ----------------------------
   Delegate Event Listener for Projects Grid and List
---------------------------- */

function projectClickHandler(container) {
    container.addEventListener('click', function (e) {
        const projectCard = e.target.closest('.project-card');
        if (!projectCard) return;

        const index = projectCard.getAttribute('data-index');

        if (e.target.classList.contains('read-more')) {
            e.preventDefault();
            // Show full description
            const project = projects[index];
            $('#descTitle').innerText = project.name;
            $('#descContent').innerText = project.description;
            showElement($('#descriptionModal'));
        } else if (e.target.classList.contains('edit-btn')) {
            e.stopPropagation();
            // Edit Project
            editProject(index);
        } else if (e.target.classList.contains('delete-btn')) {
            e.stopPropagation();
            // Delete Project with Confirmation
            showConfirmation('Are you sure you want to delete this project? This will delete everything related to it.', function (confirmed) {
                if (confirmed) {
                    deleteProject(index);
                }
            });
        } else {
            // Open Project Details
            openProjectDetails(index);
        }
    });
}

// Initialize event listeners for both grid and list
projectClickHandler($('#projectsContainer'));
projectClickHandler($('#projectsList'));

/* ----------------------------
   Edit Project Function
---------------------------- */

function editProject(index) {
    const project = projects[index];

    $('#projectModalTitle').innerText = 'Edit Project';
    $('#projectName').value = project.name;
    $('#projectDescription').value = project.description;
    $('#projectForm').dataset.mode = 'edit';
    currentProjectIndex = parseInt(index);
    showElement($('#projectModal'));
    $('#projectName').focus();
}

/* ----------------------------
   Delete Project Function
---------------------------- */

function deleteProject(index) {
    projects.splice(index, 1);
    hideElement($('#projectContentArea'));
    currentProjectIndex = null;
    showNotification('Project deleted successfully!', 'success');

    // Save to Firestore
    saveProjectsToFirestore();
}

/* ----------------------------
   Open Project Details Function
---------------------------- */

function openProjectDetails(index) {
    const projIndex = parseInt(index);
    if (currentProjectIndex === projIndex) {
        // Close if the same project is clicked again
        hideElement($('#projectContentArea'));
        currentProjectIndex = null;
        return;
    }

    currentProjectIndex = projIndex;
    const project = projects[currentProjectIndex];
    $('#projectContentTitle').innerText = project.name;
    displayMissions(); // Show missions for this project
    showElement($('#projectContentArea'));
}

/* ----------------------------
   Display Missions
---------------------------- */

function displayMissions() {
    const missionsContainer = $('#missionsContainer');
    missionsContainer.innerHTML = '';

    const project = projects[currentProjectIndex];

    project.missions.forEach((mission, mIndex) => {
        const missionDiv = document.createElement('div');
        missionDiv.className = 'mission';
        missionDiv.setAttribute('data-mission-index', mIndex);

        // Determine if mission is single or has sub-missions
        const isSingle = mission.type === 'single';

        // Buttons for mission actions
        let missionButtonsHTML = `
            <button class="btn edit-mission-btn" data-mission-index="${mIndex}">Edit</button>
            <button class="btn delete-mission-btn" data-mission-index="${mIndex}">Delete</button>
        `;

        if (isSingle) {
            if (mission.status === 'not started') {
                missionButtonsHTML += `
                    <button class="btn start-mission-btn" data-mission-index="${mIndex}">Start</button>
                `;
            } else if (mission.status === 'in progress') {
                missionButtonsHTML += `
                    <button class="btn mark-done-mission-btn" data-mission-index="${mIndex}">Mark as Done</button>
                    <button class="btn reset-mission-btn" data-mission-index="${mIndex}">Reset</button>
                `;
            } else if (mission.status === 'done') {
                missionButtonsHTML += `
                    <button class="btn reopen-mission-btn" data-mission-index="${mIndex}">Reopen</button>
                `;
            }
        }

        missionDiv.innerHTML = `
            <div class="mission-buttons">
                <h3>${mission.name}</h3>
                ${missionButtonsHTML}
            </div>

            <p>${mission.description}</p>
            ${isSingle ? `<p>Status: <strong>${capitalize(mission.status)}</strong></p>` : ''}

            ${mission.type === 'withSubmissions' ? `
                <div class="sub-missions">
                    <div class="mission-buttons">
                        <h4>Sub-Missions</h4>
                        <p id="subMissionsCount-${mIndex}">You can add ${10 - mission.subMissions.length} more sub-mission(s).</p>
                        <button class="btn add-submission-btn" data-mission-index="${mIndex}">Add Sub-Mission</button>
                    </div>
                    <ul class="sub-mission-list">
                        ${mission.subMissions.map((sub, sIndex) => `
                            <li>
                                <div class="sub-mission-details">
                                    <strong>${sub.name}</strong> - ${sub.description} - Status: <strong>${capitalize(sub.status)}</strong>
                                </div>
                                <div class="sub-mission-buttons">
                                    ${sub.status === 'not started' ? `
                                        <button class="btn edit-submission-btn" data-mission-index="${mIndex}" data-sub-index="${sIndex}">Edit</button>
                                        <button class="btn delete-submission-btn" data-mission-index="${mIndex}" data-sub-index="${sIndex}">Delete</button>
                                        <button class="btn start-submission-btn" data-mission-index="${mIndex}" data-sub-index="${sIndex}">Start</button>
                                    ` : ''}
                                    ${sub.status === 'in progress' ? `
                                        <button class="btn mark-done-submission-btn" data-mission-index="${mIndex}" data-sub-index="${sIndex}">Mark as Done</button>
                                        <button class="btn reset-submission-btn" data-mission-index="${mIndex}" data-sub-index="${sIndex}">Reset</button>
                                    ` : ''}
                                    ${sub.status === 'done' ? `
                                        <button class="btn reopen-submission-btn" data-mission-index="${mIndex}" data-sub-index="${sIndex}">Reopen</button>
                                    ` : ''}
                                </div>
                            </li>
                        `).join('')}
                        ${mission.subMissions.length === 0 ? `<li>No sub-missions added yet.</li>` : ''}
                    </ul>
                </div>
            ` : ''}
        `;

        missionsContainer.appendChild(missionDiv);

        // Initialize Sub-Missions Count Display
        if (mission.type === 'withSubmissions') {
            updateSubMissionsCountDisplay(mIndex);
        }
    });
}

/* ----------------------------
   Update Sub-Missions Count Display Function
---------------------------- */

function updateSubMissionsCountDisplay(missionIndex) {
    const project = projects[currentProjectIndex];
    const mission = project.missions[missionIndex];
    const subMissionCount = mission.subMissions.length;
    const maxSubMissions = 10;
    const remaining = maxSubMissions - subMissionCount;

    const countDisplay = $(`#subMissionsCount-${missionIndex}`);
    if (countDisplay) {
        countDisplay.innerText = `You can add ${remaining} more sub-mission(s).`;
    }
}

/* ----------------------------
   Update Project Progress Function
---------------------------- */

/**
 * Calculate and update the progress of a specific project
 * @param {number} projectIndex - The index of the project in the projects array
 */
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

/* ----------------------------
   Delegate Event Listener for Missions Container
---------------------------- */

$('#missionsContainer').addEventListener('click', function (e) {
    const target = e.target;

    // Handle Mission Buttons
    if (target.classList.contains('edit-mission-btn')) {
        const missionIndex = target.getAttribute('data-mission-index');
        editMission(missionIndex);
    } else if (target.classList.contains('delete-mission-btn')) {
        const missionIndex = target.getAttribute('data-mission-index');
        showConfirmation('Are you sure you want to delete this mission? This will delete all related sub-missions.', function (confirmed) {
            if (confirmed) {
                deleteMission(missionIndex);
            }
        });
    } else if (target.classList.contains('start-mission-btn')) {
        const missionIndex = target.getAttribute('data-mission-index');
        updateMissionStatus(missionIndex, 'in progress');
    } else if (target.classList.contains('mark-done-mission-btn')) {
        const missionIndex = target.getAttribute('data-mission-index');
        updateMissionStatus(missionIndex, 'done');
    } else if (target.classList.contains('reset-mission-btn')) {
        const missionIndex = target.getAttribute('data-mission-index');
        updateMissionStatus(missionIndex, 'not started');
    } else if (target.classList.contains('reopen-mission-btn')) {
        const missionIndex = target.getAttribute('data-mission-index');
        updateMissionStatus(missionIndex, 'in progress');
    }

    // Handle Sub-Mission Buttons
    if (target.classList.contains('edit-submission-btn')) {
        const missionIndex = target.getAttribute('data-mission-index');
        const subMissionIndex = target.getAttribute('data-sub-index');
        editSubMission(missionIndex, subMissionIndex);
    } else if (target.classList.contains('delete-submission-btn')) {
        const missionIndex = target.getAttribute('data-mission-index');
        const subMissionIndex = target.getAttribute('data-sub-index');
        showConfirmation('Are you sure you want to delete this sub-mission?', function (confirmed) {
            if (confirmed) {
                deleteSubMission(missionIndex, subMissionIndex);
            }
        });
    } else if (target.classList.contains('start-submission-btn')) {
        const missionIndex = target.getAttribute('data-mission-index');
        const subMissionIndex = target.getAttribute('data-sub-index');
        updateSubMissionStatus(missionIndex, subMissionIndex, 'in progress');
    } else if (target.classList.contains('mark-done-submission-btn')) {
        const missionIndex = target.getAttribute('data-mission-index');
        const subMissionIndex = target.getAttribute('data-sub-index');
        updateSubMissionStatus(missionIndex, subMissionIndex, 'done');
    } else if (target.classList.contains('reset-submission-btn')) {
        const missionIndex = target.getAttribute('data-mission-index');
        const subMissionIndex = target.getAttribute('data-sub-index');
        updateSubMissionStatus(missionIndex, subMissionIndex, 'not started');
    } else if (target.classList.contains('reopen-submission-btn')) {
        const missionIndex = target.getAttribute('data-mission-index');
        const subMissionIndex = target.getAttribute('data-sub-index');
        updateSubMissionStatus(missionIndex, subMissionIndex, 'in progress');
    }

    // Handle Add Sub-Mission Button within Mission
    if (target.classList.contains('add-submission-btn')) {
        const missionIndex = target.getAttribute('data-mission-index');
        addSubMission(missionIndex);
    }
});

/* ----------------------------
   Add Sub-Mission Function
---------------------------- */

function addSubMission(missionIndex) {
    editMissionIndex = parseInt(missionIndex);
    editSubMissionIndex = -1; // Indicates adding new sub-mission
    $('#editSubMissionName').value = '';
    $('#editSubMissionDescription').value = '';
    showElement($('#editSubMissionModal'));
    $('#editSubMissionName').focus();
}

/* ----------------------------
   Edit Mission Function
---------------------------- */

function editMission(index) {
    const project = projects[currentProjectIndex];
    const mission = project.missions[index];

    $('#missionModalTitle').innerText = 'Edit Mission';
    $('#missionName').value = mission.name;
    $('#missionDescription').value = mission.description;
    $('#missionType').value = mission.type;
    $('#missionForm').dataset.mode = 'edit';
    editMissionIndex = parseInt(index);

    // Enable missionType select
    $('#missionType').disabled = false;
    if (mission.type === 'withSubmissions') {
        showElement($('#subMissionsSection'));
        // Load existing sub-missions
        const subMissionsContainer = $('#subMissionsContainer');
        subMissionsContainer.innerHTML = '';
        mission.subMissions.forEach((sub, sIndex) => {
            const subMissionDiv = document.createElement('div');
            subMissionDiv.className = 'sub-mission';
            subMissionDiv.innerHTML = `
                <label>Name:</label>
                <input type="text" class="subMissionName" value="${sub.name}" required>
                <label>Description:</label>
                <textarea class="subMissionDescription" required>${sub.description}</textarea>
                <button type="button" class="btn removeSubMissionBtn">Remove</button>
            `;

            subMissionsContainer.appendChild(subMissionDiv);

            // Handle Remove Sub-Mission Button
            subMissionDiv.querySelector('.removeSubMissionBtn').addEventListener('click', () => {
                subMissionsContainer.removeChild(subMissionDiv);
                updateSubMissionsCount();
            });
        });
    } else {
        hideElement($('#subMissionsSection'));
        $('#subMissionsContainer').innerHTML = '';
    }

    showElement($('#missionModal'));
    $('#missionName').focus();
    updateSubMissionsCount();
}

/* ----------------------------
   Delete Mission Function
---------------------------- */

function deleteMission(index) {
    const project = projects[currentProjectIndex];
    project.missions.splice(index, 1);
    showNotification('Mission deleted successfully!', 'success');

    // Save to Firestore
    saveProjectsToFirestore();
}

/* ----------------------------
   Update Mission Status Function
---------------------------- */

function updateMissionStatus(missionIndex, newStatus) {
    const project = projects[currentProjectIndex];
    const mission = project.missions[missionIndex];

    // **Issue 7: Enforce Logical Status Transitions**
    const validTransitions = {
        'not started': ['in progress'],
        'in progress': ['done'],
        'done': ['in progress']
    };

    if (validTransitions[mission.status].includes(newStatus)) {
        mission.status = newStatus;
        showNotification(`Mission status updated to "${capitalize(newStatus)}".`, 'success');

        // Save to Firestore
        saveProjectsToFirestore();
    } else {
        showNotification('Invalid status transition.', 'error');
    }
}

/* ----------------------------
   Edit Sub-Mission Function
---------------------------- */

function editSubMission(missionIndex, subMissionIndex) {
    const project = projects[currentProjectIndex];
    const subMission = project.missions[missionIndex].subMissions[subMissionIndex];

    if (subMission.status !== 'not started') {
        showNotification('Only sub-missions with status "Not Started" can be edited.', 'error');
        return;
    }

    editMissionIndex = parseInt(missionIndex);
    editSubMissionIndex = parseInt(subMissionIndex);

    $('#editSubMissionName').value = subMission.name;
    $('#editSubMissionDescription').value = subMission.description;
    showElement($('#editSubMissionModal'));
    $('#editSubMissionName').focus();
}

/* ----------------------------
   Delete Sub-Mission Function
---------------------------- */

function deleteSubMission(missionIndex, subMissionIndex) {
    const project = projects[currentProjectIndex];
    project.missions[missionIndex].subMissions.splice(subMissionIndex, 1);
    showNotification('Sub-Mission deleted successfully!', 'success');

    // Save to Firestore
    saveProjectsToFirestore();
}

/* ----------------------------
   Update Sub-Mission Status Function
---------------------------- */

function updateSubMissionStatus(missionIndex, subMissionIndex, newStatus) {
    const project = projects[currentProjectIndex];
    const subMission = project.missions[missionIndex].subMissions[subMissionIndex];

    // **Issue 7: Enforce Logical Status Transitions**
    const validTransitions = {
        'not started': ['in progress'],
        'in progress': ['done'],
        'done': ['in progress']
    };

    if (validTransitions[subMission.status].includes(newStatus)) {
        subMission.status = newStatus;
        showNotification(`Sub-Mission status updated to "${capitalize(newStatus)}".`, 'success');

        // Save to Firestore
        saveProjectsToFirestore();
    } else {
        showNotification('Invalid status transition.', 'error');
    }
}

/* ----------------------------
   Save and Load Projects to/from Firestore
---------------------------- */

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

// Real-time listener for Projects
function loadProjectsFromFirestore() {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('users').doc(user.uid).onSnapshot((doc) => {
        if (doc.exists) {
            projects = doc.data().projects;
            displayProjects();
            if (currentProjectIndex !== null) {
                displayMissions();
            }
        } else {
            projects = [];
            displayProjects();
        }
    }, (error) => {
        showNotification('Failed to load data.', 'error');
    });
}

/* ----------------------------
   Display Projects
---------------------------- */

function displayProjects() {
    const projectsContainer = $('#projectsContainer');
    const projectsList = $('#projectsList');
    projectsContainer.innerHTML = '';
    projectsList.innerHTML = '';

    // Now display projects
    const displayedProjects = projects.slice(0, 100); // Adjust as needed

    displayedProjects.forEach((project, index) => {
        // Create Project Card for Grid
        const projectCardGrid = document.createElement('div');
        projectCardGrid.className = 'project-card';
        projectCardGrid.setAttribute('data-index', index);

        const descriptionPreview = project.description.length > 100
            ? project.description.substring(0, 100) + '...'
            : project.description;

        projectCardGrid.innerHTML = `
            <div class="project-card-header">
                <h3>${project.name}</h3>
                <div class="buttons">
                    <button class="btn edit-btn" data-index="${index}">Edit</button>
                    <button class="btn delete-btn" data-index="${index}">Delete</button>
                </div>
            </div>
            <p>
                ${descriptionPreview}
                ${project.description.length > 100 ? `<a href="#" class="read-more" data-index="${index}">Read More</a>` : ''}
            </p>

            <div class="progress-bar">
                <div class="progress" style="width: ${project.progress}%"></div>
            </div>
        `;

        projectsContainer.appendChild(projectCardGrid);

        // Create Project List Item for Mobile
        const projectListItem = document.createElement('li');
        projectListItem.className = 'project-card';
        projectListItem.setAttribute('data-index', index);

        projectListItem.innerHTML = projectCardGrid.innerHTML;

        projectsList.appendChild(projectListItem);
    });

    // Hide project content area if the current project was deleted
    if (currentProjectIndex !== null && currentProjectIndex >= projects.length) {
        hideElement($('#projectContentArea'));
        currentProjectIndex = null;
    }
}

/* ----------------------------
   Initialize App
---------------------------- */

function initializeApp() {
    // Authentication State Observer
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            $('#loginBtn').classList.add('hidden');
            $('#logoutBtn').classList.remove('hidden');
            loadProjectsFromFirestore();
            updateGreetingAndTime();
        } else {
            // User is signed out
            $('#loginBtn').classList.remove('hidden');
            $('#logoutBtn').classList.add('hidden');
            projects = [];
            displayProjects();
            hideElement($('#projectContentArea'));
            currentProjectIndex = null;
        }
    });

    // Login Function
    $('#loginBtn').addEventListener('click', () => {
        // Use Firebase UI or implement your own login form
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch((error) => {
            showNotification('Login failed.', 'error');
        });
    });

    // Logout Function
    $('#logoutBtn').addEventListener('click', () => {
        auth.signOut().catch((error) => {
            showNotification('Logout failed.', 'error');
        });
    });

    // Keyboard navigation for modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close all open modals
            const openModals = document.querySelectorAll('.modal:not(.hidden)');
            openModals.forEach(modal => hideElement(modal));
        }
    });

    // Close modal when clicking outside modal-content
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideElement(modal);
            }
        });
    });

    // Initial responsive layout setup
    const projectsGrid = $('#projectsContainer');
    const projectsList = $('#projectsList');

    function handleResponsiveLayout() {
        if (window.innerWidth <= 768) {
            projectsGrid.classList.add('hidden');
            projectsList.classList.remove('hidden');
        } else {
            projectsGrid.classList.remove('hidden');
            projectsList.classList.add('hidden');
        }
    }

    window.addEventListener('resize', handleResponsiveLayout);
    handleResponsiveLayout(); // Initial call
}

initializeApp();

/* ----------------------------
   Edit Sub-Mission Modal Submission
---------------------------- */

// Handle Edit Sub-Mission Form Submission
$('#editSubMissionForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = $('#editSubMissionName').value.trim();
    const description = $('#editSubMissionDescription').value.trim();

    if (!name || !description) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }

    const project = projects[currentProjectIndex];
    const mission = project.missions[editMissionIndex];

    // **Issue 3: Duplicate Sub-Mission Names**
    if (mission.subMissions.some((sub, idx) => sub.name.toLowerCase() === name.toLowerCase() && idx !== editSubMissionIndex)) {
        showNotification('Sub-Mission name already exists!', 'error');
        return;
    }

    if (editSubMissionIndex === -1) {
        // Adding new sub-mission
        if (mission.subMissions.length >= 10) {
            showNotification('Cannot add more than 10 sub-missions.', 'error');
            return;
        }
        mission.subMissions.push({
            name,
            description,
            status: 'not started'
        });
        showNotification('Sub-Mission added successfully!', 'success');
    } else {
        // Editing existing sub-mission
        const subMission = mission.subMissions[editSubMissionIndex];
        subMission.name = name;
        subMission.description = description;
        showNotification('Sub-Mission updated successfully!', 'success');
    }

    // Save to Firestore
    saveProjectsToFirestore();

    // Update UI
    hideElement($('#editSubMissionModal'));
    this.reset();
    editMissionIndex = null;
    editSubMissionIndex = null;
});

/* ----------------------------
   Theme Toggle Functionality
---------------------------- */

// Theme Toggle Functionality
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;

// Apply saved theme on load
if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);

    if (currentTheme === 'dark') {
        toggleSwitch.checked = true;
    }
}

// Toggle theme on switch
toggleSwitch.addEventListener('change', function(e) {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
    else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
});

/* ----------------------------
   Update Greeting and Current Time
---------------------------- */

function updateGreetingAndTime() {
    const greetingText = $('#greetingText');
    const currentTime = $('#currentTime');

    function updateTime() {
        const now = new Date();
        const hours = now.getHours();

        let greeting = '';
        if (hours < 12) {
            greeting = 'Good Morning';
        } else if (hours < 18) {
            greeting = 'Good Afternoon';
        } else {
            greeting = 'Good Evening';
        }

        greetingText.innerText = greeting;
        currentTime.innerText = now.toLocaleTimeString();
    }

    updateTime();
    setInterval(updateTime, 1000); // Update every second
}

