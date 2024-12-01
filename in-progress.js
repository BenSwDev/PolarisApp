// in-progress.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize In Progress Missions Section
    initializeInProgressMissions();
});

/**
 * Initialize the In Progress Missions Section
 */
function initializeInProgressMissions() {
    // Check if user is authenticated
    auth.onAuthStateChanged((user) => {
        if (user) {
            displayInProgressMissions();
        } else {
            const missionsContainer = document.getElementById('inProgressMissionsContainer');
            missionsContainer.innerHTML = '<p class="text-center">Please log in to see your missions.</p>';
        }
    });
}

/**
 * Display In Progress and Done Missions with Real-Time Updates
 */
function displayInProgressMissions() {
    const user = auth.currentUser;
    if (!user) return;

    const missionsContainer = document.getElementById('inProgressMissionsContainer');
    missionsContainer.innerHTML = ''; // Clear previous content

    db.collection('users').doc(user.uid).onSnapshot((doc) => {
        if (doc.exists) {
            projects = doc.data().projects;
            renderInProgressMissions();
        } else {
            projects = [];
            renderInProgressMissions();
        }
    }, (error) => {
        showNotification('Failed to load data.', 'error');
    });
}

/**
 * Render In Progress and Done Missions
 */
function renderInProgressMissions() {
    const missionsContainer = document.getElementById('inProgressMissionsContainer');
    missionsContainer.innerHTML = ''; // Clear previous content

    let inProgressMissions = [];
    let doneMissions = [];

    projects.forEach((project, projectIndex) => {
        project.missions.forEach((mission, missionIndex) => {
            if (mission.type === 'single') {
                if (mission.status === 'in progress') {
                    inProgressMissions.push({
                        projectName: project.name,
                        missionName: mission.name,
                        missionType: 'Single Mission',
                        missionIndex: missionIndex,
                        projectIndex: projectIndex,
                        subMission: null,
                    });
                } else if (mission.status === 'done') {
                    doneMissions.push({
                        projectName: project.name,
                        missionName: mission.name,
                        missionType: 'Single Mission',
                        missionIndex: missionIndex,
                        projectIndex: projectIndex,
                        subMission: null,
                    });
                }
            } else if (mission.type === 'withSubmissions') {
                mission.subMissions.forEach((subMission, subMissionIndex) => {
                    if (subMission.status === 'in progress') {
                        inProgressMissions.push({
                            projectName: project.name,
                            missionName: mission.name,
                            missionType: 'Sub-Mission',
                            missionIndex: missionIndex,
                            projectIndex: projectIndex,
                            subMission: {
                                name: subMission.name,
                                index: subMissionIndex
                            },
                        });
                    } else if (subMission.status === 'done') {
                        doneMissions.push({
                            projectName: project.name,
                            missionName: mission.name,
                            missionType: 'Sub-Mission',
                            missionIndex: missionIndex,
                            projectIndex: projectIndex,
                            subMission: {
                                name: subMission.name,
                                index: subMissionIndex
                            },
                        });
                    }
                });
            }
        });
    });

    // Create In Progress Missions Table
    if (inProgressMissions.length > 0) {
        const inProgressTitle = document.createElement('h4');
        inProgressTitle.innerText = 'In Progress Missions';
        missionsContainer.appendChild(inProgressTitle);

        const inProgressTable = document.createElement('table');
        inProgressTable.className = 'missions-table';

        // Table Header
        inProgressTable.innerHTML = `
            <thead>
                <tr>
                    <th>Project</th>
                    <th>Mission</th>
                    <th>Sub-Mission</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${inProgressMissions.map((mission, index) => `
                    <tr>
                        <td>${mission.projectName}</td>
                        <td>${mission.missionName}</td>
                        <td>${mission.subMission ? mission.subMission.name : '-'}</td>
                        <td>
                            <button class="btn action-btn mark-done" data-project-index="${mission.projectIndex}" data-mission-index="${mission.missionIndex}" data-sub-mission-index="${mission.subMission ? mission.subMission.index : 'null'}">
                                Mark as Done
                            </button>
                            <button class="btn action-btn revert" data-project-index="${mission.projectIndex}" data-mission-index="${mission.missionIndex}" data-sub-mission-index="${mission.subMission ? mission.subMission.index : 'null'}">
                                Revert to Not Started
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        missionsContainer.appendChild(inProgressTable);
    } else {
        const inProgressTitle = document.createElement('h4');
        inProgressTitle.innerText = 'In Progress Missions';
        missionsContainer.appendChild(inProgressTitle);
        missionsContainer.innerHTML += '<p class="text-center">No in-progress missions.</p>';
    }

    // Create Done Missions Table
    if (doneMissions.length > 0) {
        const doneTitle = document.createElement('h4');
        doneTitle.innerText = 'Done Missions';
        missionsContainer.appendChild(doneTitle);

        const doneTable = document.createElement('table');
        doneTable.className = 'missions-table';

        // Table Header
        doneTable.innerHTML = `
            <thead>
                <tr>
                    <th>Project</th>
                    <th>Mission</th>
                    <th>Sub-Mission</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${doneMissions.map((mission, index) => `
                    <tr>
                        <td>${mission.projectName}</td>
                        <td>${mission.missionName}</td>
                        <td>${mission.subMission ? mission.subMission.name : '-'}</td>
                        <td>
                            <button class="btn action-btn revert" data-project-index="${mission.projectIndex}" data-mission-index="${mission.missionIndex}" data-sub-mission-index="${mission.subMission ? mission.subMission.index : 'null'}">
                                Revert to In Progress
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        missionsContainer.appendChild(doneTable);
    } else {
        const doneTitle = document.createElement('h4');
        doneTitle.innerText = 'Done Missions';
        missionsContainer.appendChild(doneTitle);
        missionsContainer.innerHTML += '<p class="text-center">No done missions.</p>';
    }

    // Attach Event Listeners to Action Buttons
    attachActionButtonListeners();
}

/**
 * Attach Event Listeners to Mark Done and Revert Buttons
 */
function attachActionButtonListeners() {
    const missionsContainer = document.getElementById('inProgressMissionsContainer');

    missionsContainer.addEventListener('click', function (e) {
        const target = e.target;
        if (target.classList.contains('mark-done')) {
            handleMarkDone(e);
        } else if (target.classList.contains('revert')) {
            handleRevert(e);
        }
    });
}

/**
 * Handle Mark as Done Action
 * @param {Event} e
 */
function handleMarkDone(e) {
    const projectIndex = parseInt(e.target.getAttribute('data-project-index'));
    const missionIndex = parseInt(e.target.getAttribute('data-mission-index'));
    const subMissionIndex = e.target.getAttribute('data-sub-mission-index') === 'null' ? null : parseInt(e.target.getAttribute('data-sub-mission-index'));

    if (subMissionIndex !== null) {
        // It's a sub-mission
        projects[projectIndex].missions[missionIndex].subMissions[subMissionIndex].status = 'done';
    } else {
        // It's a single mission
        projects[projectIndex].missions[missionIndex].status = 'done';
    }

    // Update Project Progress
    updateProjectProgress(projectIndex);

    // Save changes to Firestore
    saveProjectsToFirestore();

    // Notify User
    showNotification('Mission marked as done!', 'success');
}

/**
 * Handle Revert Action
 * @param {Event} e
 */
function handleRevert(e) {
    const projectIndex = parseInt(e.target.getAttribute('data-project-index'));
    const missionIndex = parseInt(e.target.getAttribute('data-mission-index'));
    const subMissionIndex = e.target.getAttribute('data-sub-mission-index') === 'null' ? null : parseInt(e.target.getAttribute('data-sub-mission-index'));

    if (subMissionIndex !== null) {
        // It's a sub-mission
        const currentStatus = projects[projectIndex].missions[missionIndex].subMissions[subMissionIndex].status;
        if (currentStatus === 'in progress') {
            projects[projectIndex].missions[missionIndex].subMissions[subMissionIndex].status = 'not started';
            showNotification('Sub-Mission reverted to Not Started.', 'info');
        } else if (currentStatus === 'done') {
            projects[projectIndex].missions[missionIndex].subMissions[subMissionIndex].status = 'in progress';
            showNotification('Sub-Mission reverted to In Progress.', 'info');
        }
    } else {
        // It's a single mission
        const currentStatus = projects[projectIndex].missions[missionIndex].status;
        if (currentStatus === 'in progress') {
            projects[projectIndex].missions[missionIndex].status = 'not started';
            showNotification('Mission reverted to Not Started.', 'info');
        } else if (currentStatus === 'done') {
            projects[projectIndex].missions[missionIndex].status = 'in progress';
            showNotification('Mission reverted to In Progress.', 'info');
        }
    }

    // Update Project Progress
    updateProjectProgress(projectIndex);

    // Save changes to Firestore
    saveProjectsToFirestore();
}

/**
 * Update Project Progress
 * @param {number} projectIndex
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

/**
 * Show Notification
 * @param {string} message
 * @param {string} type - 'success', 'error', 'info'
 */
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
