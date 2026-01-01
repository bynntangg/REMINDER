// ===== DATA & STATE MANAGEMENT =====
let courses = JSON.parse(localStorage.getItem("courses")) || [];
let cashData = JSON.parse(localStorage.getItem("cashData")) || [];
let currentWeekOffset = 0;
let currentTaskPriority = "medium";
let currentTransactionType = "masuk";

// Constants
const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
const dayNames = {
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat',
    sabtu: 'Sabtu',
    minggu: 'Minggu'
};

// ===== INITIALIZATION =====
function init() {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 16);
    
    // Set default values
    document.getElementById('modalCashDate').value = today;
    document.getElementById('taskDeadline').value = tomorrowStr;
    
    // Load and render data
    renderCourses();
    renderCash();
    renderSchedule();
    updateQuickStats();
    renderUpcomingDeadlines();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check for dark mode
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    
    // Show welcome message
    setTimeout(() => {
        if (!localStorage.getItem('hasVisited')) {
            showNotification("Selamat datang di Student Planner Pro! 🎓", "success");
            localStorage.setItem('hasVisited', 'true');
        }
    }, 1000);
}

// ===== NAVIGATION FUNCTIONS =====
function showSection(section) {
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Show corresponding section
    document.querySelectorAll('.mobile-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}Section`).classList.add('active');
    
    // Close menu if open
    toggleMenu(false);
}

function toggleMenu(forceClose = null) {
    const menu = document.getElementById('sideMenu');
    if (forceClose === false) {
        menu.classList.remove('active');
    } else {
        menu.classList.toggle('active');
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== COURSE FUNCTIONS =====
function renderCourses() {
    const list = document.getElementById("mobileCourseList");
    
    if (courses.length === 0) {
        list.innerHTML = `
            <div class="empty-state-mobile">
                <i class="fas fa-book-open"></i>
                <h3>Belum ada mata kuliah</h3>
                <p>Tambahkan mata kuliah pertama Anda untuk memulai!</p>
                <button class="btn-primary" onclick="showAddCourseModal()">
                    <i class="fas fa-plus"></i> Tambah Mata Kuliah
                </button>
            </div>
        `;
        return;
    }

    list.innerHTML = courses.map((course, i) => {
        const completedTasks = course.tasks.filter(task => task.done).length;
        const totalTasks = course.tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        const upcomingTasks = course.tasks.filter(task => {
            if (task.done || !task.deadline) return false;
            const deadline = new Date(task.deadline);
            const now = new Date();
            const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
            return diffDays <= 7 && diffDays >= 0;
        }).length;

        return `
            <div class="mobile-course-card">
                <div class="course-card-header">
                    <div>
                        <h3>${course.name}</h3>
                        <div class="course-meta">
                            ${course.day && course.startTime ? `
                                <div class="course-time">
                                    <i class="far fa-calendar"></i>
                                    <span>${dayNames[course.day] || course.day}, ${formatTime(course.startTime)} - ${formatTime(course.endTime)}</span>
                                </div>
                            ` : ''}
                            ${course.room ? `
                                <div class="course-room">
                                    <i class="fas fa-door-open"></i>
                                    <span>Ruangan: ${course.room}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="course-actions-mobile">
                        <button class="mobile-action-btn" onclick="showAddTaskModal(${i})" title="Tambah Tugas">
                            <i class="fas fa-plus-circle"></i>
                        </button>
                        <button class="mobile-action-btn delete" onclick="deleteCourse(${i})" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="mobile-course-progress">
                    <div class="mobile-progress-bar">
                        <div class="mobile-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="mobile-progress-text">
                        <span>${completedTasks}/${totalTasks} tugas selesai</span>
                        ${upcomingTasks > 0 ? `<span class="upcoming-badge">${upcomingTasks} deadline mendatang</span>` : ''}
                    </div>
                </div>
                
                <div class="mobile-task-list">
                    ${course.tasks.map((task, j) => `
                        <div class="mobile-task-item ${task.priority || 'medium'}-priority" onclick="toggleTask(${i}, ${j})">
                            <div class="mobile-task-checkbox ${task.done ? 'checked' : ''}"></div>
                            <div class="task-content">
                                <div class="task-header">
                                    <span class="mobile-task-text ${task.done ? 'done' : ''}">${task.text}</span>
                                    ${task.priority ? `<span class="priority-badge priority-${task.priority}">${task.priority}</span>` : ''}
                                </div>
                                ${task.deadline ? `
                                    <div class="task-deadline ${isDeadlineUrgent(task.deadline) ? 'urgent' : ''}">
                                        <i class="far fa-clock"></i>
                                        <span>${formatDeadline(task.deadline)}</span>
                                        ${task.done ? '<i class="fas fa-check success-icon"></i>' : ''}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${course.note ? `
                    <div class="mobile-course-note">
                        <div class="mobile-note-label">
                            <i class="fas fa-sticky-note"></i>
                            Catatan
                        </div>
                        <p class="note-content">${course.note}</p>
                    </div>
                ` : ''}
                
                <button class="add-task-btn" onclick="showAddTaskModal(${i})">
                    <i class="fas fa-plus"></i> Tambah Tugas Baru
                </button>
            </div>
        `;
    }).join('');
    
    updateQuickStats();
    renderUpcomingDeadlines();
}

function showAddCourseModal() {
    // Reset form
    document.getElementById('courseName').value = '';
    document.getElementById('courseDay').value = '';
    document.getElementById('courseStartTime').value = '';
    document.getElementById('courseEndTime').value = '';
    document.getElementById('courseRoom').value = '';
    document.getElementById('courseNote').value = '';
    
    showModal('addCourseModal');
}

function saveCourse() {
    const name = document.getElementById('courseName').value.trim();
    const day = document.getElementById('courseDay').value;
    const startTime = document.getElementById('courseStartTime').value;
    const endTime = document.getElementById('courseEndTime').value;
    const room = document.getElementById('courseRoom').value.trim();
    const note = document.getElementById('courseNote').value.trim();

    if (!name) {
        showNotification('Nama mata kuliah wajib diisi!', 'warning');
        return;
    }

    courses.push({
        name,
        day: day || null,
        startTime: startTime || null,
        endTime: endTime || null,
        room: room || null,
        note: note || '',
        tasks: []
    });

    saveData();
    renderCourses();
    hideModal('addCourseModal');
    showNotification('Mata kuliah berhasil ditambahkan!', 'success');
}

function deleteCourse(index) {
    if (confirm('Hapus mata kuliah ini? Semua tugas akan ikut terhapus.')) {
        courses.splice(index, 1);
        saveData();
        renderCourses();
        showNotification('Mata kuliah berhasil dihapus', 'success');
    }
}

// ===== TASK FUNCTIONS =====
function showAddTaskModal(courseIndex) {
    document.getElementById('taskCourseIndex').value = courseIndex;
    
    // Set default deadline (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 16);
    document.getElementById('taskDeadline').value = tomorrowStr;
    
    // Reset form
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskNote').value = '';
    
    // Reset priority selection
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.priority-btn[data-priority="medium"]').classList.add('active');
    currentTaskPriority = 'medium';
    
    showModal('addTaskModal');
}

function selectPriority(button, priority) {
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    currentTaskPriority = priority;
}

function saveTask() {
    const courseIndex = parseInt(document.getElementById('taskCourseIndex').value);
    const description = document.getElementById('taskDescription').value.trim();
    const deadline = document.getElementById('taskDeadline').value;
    const note = document.getElementById('taskNote').value.trim();

    if (!description) {
        showNotification('Deskripsi tugas wajib diisi!', 'warning');
        return;
    }

    if (!deadline) {
        showNotification('Deadline wajib diisi!', 'warning');
        return;
    }

    courses[courseIndex].tasks.push({
        text: description,
        deadline: deadline,
        priority: currentTaskPriority,
        note: note || '',
        done: false,
        createdAt: new Date().toISOString()
    });

    saveData();
    renderCourses();
    hideModal('addTaskModal');
    showNotification('Tugas berhasil ditambahkan!', 'success');
}

function toggleTask(courseIndex, taskIndex) {
    courses[courseIndex].tasks[taskIndex].done = !courses[courseIndex].tasks[taskIndex].done;
    saveData();
    renderCourses();
    
    // Check if all tasks are completed
    const allDone = courses[courseIndex].tasks.every(task => task.done);
    if (allDone && courses[courseIndex].tasks.length > 0) {
        showNotification(`🎉 Semua tugas ${courses[courseIndex].name} selesai!`, 'success');
    }
}

// ===== FINANCE FUNCTIONS =====
function renderCash() {
    const list = document.getElementById("mobileCashList");
    
    if (cashData.length === 0) {
        list.innerHTML = `
            <div class="empty-state-mobile">
                <i class="fas fa-money-bill-wave"></i>
                <h3>Belum ada transaksi</h3>
                <p>Tambahkan transaksi pertama Anda untuk memulai!</p>
            </div>
        `;
        updateCashSummary();
        return;
    }

    // Sort by date (newest first)
    const sortedData = [...cashData].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    list.innerHTML = sortedData.map(item => `
        <div class="mobile-cash-item">
            <div class="mobile-cash-info">
                <div class="mobile-cash-date">
                    <i class="far fa-calendar"></i>
                    ${formatDate(item.date)}
                </div>
                <div class="mobile-cash-desc">${item.desc}</div>
            </div>
            <div class="mobile-cash-amount ${item.type === 'masuk' ? 'amount-income' : 'amount-expense'}">
                ${item.type === 'masuk' ? '+' : '-'}Rp ${item.amount.toLocaleString()}
            </div>
        </div>
    `).join('');
    
    updateCashSummary();
}

function updateCashSummary() {
    const totalIn = cashData.filter(item => item.type === 'masuk')
        .reduce((sum, item) => sum + item.amount, 0);
    const totalOut = cashData.filter(item => item.type === 'keluar')
        .reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIn - totalOut;

    document.getElementById('mobileTotalIn').textContent = `Rp ${totalIn.toLocaleString()}`;
    document.getElementById('mobileTotalOut').textContent = `Rp ${totalOut.toLocaleString()}`;
    document.getElementById('mobileBalanceSummary').textContent = `Rp ${balance.toLocaleString()}`;
    
    updateQuickStats();
}

function showAddTransactionModal() {
    // Reset form
    document.getElementById('modalCashDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('modalCashDesc').value = '';
    document.getElementById('modalCashAmount').value = '';
    
    // Reset type selection
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.type-btn[data-type="masuk"]').classList.add('active');
    currentTransactionType = 'masuk';
    
    showModal('addTransactionModal');
}

function selectType(button, type) {
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    currentTransactionType = type;
}

function saveTransaction() {
    const date = document.getElementById('modalCashDate').value;
    const desc = document.getElementById('modalCashDesc').value.trim();
    const amount = parseFloat(document.getElementById('modalCashAmount').value);

    if (!date || !desc || !amount || amount <= 0) {
        showNotification('Harap isi semua field dengan benar!', 'warning');
        return;
    }

    cashData.push({
        date,
        desc,
        amount,
        type: currentTransactionType,
        id: Date.now()
    });

    saveData();
    renderCash();
    hideModal('addTransactionModal');
    showNotification('Transaksi berhasil disimpan!', 'success');
}

// ===== SCHEDULE FUNCTIONS =====
function renderSchedule() {
    const container = document.getElementById('scheduleGrid');
    const now = new Date();
    
    // Calculate week start (Monday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1 + (currentWeekOffset * 7));
    
    // Update week range display
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekRangeText = currentWeekOffset === 0 
        ? 'Minggu Ini' 
        : `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`;
    document.getElementById('weekRange').textContent = weekRangeText;
    
    // Generate schedule for each day
    let scheduleHTML = '';
    
    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(weekStart);
        currentDay.setDate(weekStart.getDate() + i);
        const dayName = days[currentDay.getDay()];
        
        // Get courses for this day
        const dayCourses = courses.filter(course => 
            course.day && course.day.toLowerCase() === dayName
        ).sort((a, b) => {
            if (!a.startTime || !b.startTime) return 0;
            return a.startTime.localeCompare(b.startTime);
        });
        
        scheduleHTML += `
            <div class="schedule-day">
                <div class="day-header">
                    ${dayNames[dayName] || dayName}
                    ${currentDay.toDateString() === now.toDateString() ? 
                      '<span class="today-badge">Hari Ini</span>' : ''}
                </div>
                <div class="day-courses">
                    ${dayCourses.length > 0 ? 
                      dayCourses.map(course => `
                        <div class="schedule-course">
                            <div class="course-time-small">
                                <i class="far fa-clock"></i>
                                ${formatTime(course.startTime)} - ${formatTime(course.endTime)}
                            </div>
                            <div class="course-name-small">${course.name}</div>
                            ${course.room ? `
                                <div class="course-room-small">
                                    <i class="fas fa-door-open"></i>
                                    ${course.room}
                                </div>
                            ` : ''}
                        </div>
                      `).join('') : `
                        <div class="no-class">
                            <i class="far fa-smile"></i>
                            <span>Tidak ada kelas</span>
                        </div>
                      `}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = scheduleHTML;
}

function changeWeek(direction) {
    currentWeekOffset += direction;
    renderSchedule();
}

// ===== DEADLINES FUNCTIONS =====
function renderUpcomingDeadlines() {
    const container = document.getElementById('deadlinesList');
    const now = new Date();
    
    // Collect all upcoming tasks
    let allTasks = [];
    courses.forEach((course, courseIndex) => {
        course.tasks.forEach((task, taskIndex) => {
            if (!task.done && task.deadline) {
                allTasks.push({
                    ...task,
                    courseIndex,
                    taskIndex,
                    courseName: course.name
                });
            }
        });
    });
    
    // Sort by deadline (closest first)
    allTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    // Filter tasks within 7 days
    const upcomingTasks = allTasks.filter(task => {
        const deadline = new Date(task.deadline);
        const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && diffDays >= 0;
    });
    
    if (upcomingTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state-small">
                <i class="far fa-smile"></i>
                <p>Tidak ada deadline mendatang</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = upcomingTasks.map(task => {
        const deadline = new Date(task.deadline);
        const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        const isUrgent = diffDays <= 2;
        
        return `
            <div class="deadline-item ${isUrgent ? 'urgent' : ''}" 
                 onclick="showTaskDetails(${task.courseIndex}, ${task.taskIndex})">
                <div class="deadline-info">
                    <h4>${task.text}</h4>
                    <div class="deadline-course">${task.courseName}</div>
                    <div class="deadline-time">
                        <i class="far fa-clock"></i>
                        <span>${formatDeadline(task.deadline)} (${diffDays} hari lagi)</span>
                    </div>
                </div>
                <div class="deadline-priority">
                    <span class="priority-badge priority-${task.priority || 'medium'}">
                        ${task.priority || 'medium'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function showTaskDetails(courseIndex, taskIndex) {
    const task = courses[courseIndex].tasks[taskIndex];
    const course = courses[courseIndex];
    
    alert(`
        Detail Tugas:
        
        📚 Mata Kuliah: ${course.name}
        📝 Deskripsi: ${task.text}
        ⏰ Deadline: ${formatDateTime(task.deadline)}
        🎯 Prioritas: ${task.priority}
        ${task.note ? `📌 Catatan: ${task.note}` : ''}
        
        Status: ${task.done ? '✅ Selesai' : '⏳ Belum Selesai'}
    `);
}

function showUpcomingDeadlines() {
    // Scroll to deadlines section
    showSection('courses');
    setTimeout(() => {
        document.getElementById('upcomingDeadlines').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }, 100);
}

// ===== STATS FUNCTIONS =====
function showStats() {
    // Calculate statistics
    const totalCourses = courses.length;
    const totalTasks = courses.reduce((sum, course) => sum + course.tasks.length, 0);
    const completedTasks = courses.reduce((sum, course) => 
        sum + course.tasks.filter(task => task.done).length, 0);
    
    // Calculate upcoming deadlines
    const now = new Date();
    const upcomingDeadlines = courses.reduce((sum, course) => 
        sum + course.tasks.filter(task => {
            if (task.done || !task.deadline) return false;
            const deadline = new Date(task.deadline);
            const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
            return diffDays <= 7 && diffDays >= 0;
        }).length, 0);
    
    // Calculate finance stats
    const totalIn = cashData.filter(item => item.type === 'masuk')
        .reduce((sum, item) => sum + item.amount, 0);
    const totalOut = cashData.filter(item => item.type === 'keluar')
        .reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIn - totalOut;
    const totalTransactions = cashData.length;
    
    // Update stat display
    document.getElementById('totalCoursesStat').textContent = totalCourses;
    document.getElementById('totalTasksStat').textContent = totalTasks;
    document.getElementById('completedTasksStat').textContent = completedTasks;
    document.getElementById('upcomingDeadlinesStat').textContent = upcomingDeadlines;
    document.getElementById('totalBalanceStat').textContent = `Rp ${balance.toLocaleString()}`;
    document.getElementById('totalTransactionsStat').textContent = totalTransactions;
    
    showModal('statsModal');
}

function updateQuickStats() {
    const totalCourses = courses.length;
    
    const totalTasks = courses.reduce((sum, course) => sum + course.tasks.length, 0);
    const completedTasks = courses.reduce((sum, course) => 
        sum + course.tasks.filter(task => task.done).length, 0);
    
    const totalIn = cashData.filter(item => item.type === 'masuk')
        .reduce((sum, item) => sum + item.amount, 0);
    const totalOut = cashData.filter(item => item.type === 'keluar')
        .reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIn - totalOut;
    
    // Update header stats
    document.getElementById('statCourses').textContent = totalCourses;
    document.getElementById('statTasks').textContent = `${completedTasks}/${totalTasks}`;
    document.getElementById('statBalance').textContent = `Rp ${balance.toLocaleString()}`;
}

// ===== UTILITY FUNCTIONS =====
function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
}

function formatDateShort(date) {
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
    });
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDeadline(dateTimeString) {
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return `Hari ini, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
        return `Besok, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 0) {
        return `${Math.abs(diffDays)} hari yang lalu`;
    } else {
        return `${diffDays} hari lagi`;
    }
}

function isDeadlineUrgent(dateTimeString) {
    const deadline = new Date(dateTimeString);
    const now = new Date();
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 2 && diffDays >= 0;
}

// ===== MODAL FUNCTIONS =====
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ===== DATA MANAGEMENT =====
function saveData() {
    localStorage.setItem('courses', JSON.stringify(courses));
    localStorage.setItem('cashData', JSON.stringify(cashData));
    updateQuickStats();
}

function exportData() {
    const data = {
        courses: courses,
        cashData: cashData,
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Data berhasil di-export!', 'success');
    toggleMenu(false);
}

function clearData() {
    if (confirm('HAPUS SEMUA DATA?\n\nSemua mata kuliah, tugas, dan transaksi akan dihapus.\nAksi ini tidak dapat dibatalkan!')) {
        courses = [];
        cashData = [];
        saveData();
        renderCourses();
        renderCash();
        renderSchedule();
        showNotification('Semua data telah dihapus', 'warning');
        toggleMenu(false);
    }
}

// ===== DARK MODE =====
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    toggleMenu(false);
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                           type === 'warning' ? 'exclamation-triangle' : 
                           'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== QUICK ACTION =====
function quickAction() {
    const activeSection = document.querySelector('.mobile-section.active').id;
    
    if (activeSection === 'coursesSection') {
        showAddCourseModal();
    } else if (activeSection === 'financeSection') {
        showAddTransactionModal();
    } else if (activeSection === 'scheduleSection') {
        showAddCourseModal();
    }
}

// ===== EVENT LISTENERS SETUP =====
function setupEventListeners() {
    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        const modals = ['addCourseModal', 'addTaskModal', 'addTransactionModal', 'statsModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && modal.classList.contains('active') && event.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close side menu when clicking outside
    document.addEventListener('click', function(event) {
        const menu = document.getElementById('sideMenu');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        
        if (menu && menu.classList.contains('active') &&
            !menu.contains(event.target) &&
            event.target !== menuBtn &&
            !menuBtn.contains(event.target)) {
            menu.classList.remove('active');
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            // Close all modals
            hideModal('addCourseModal');
            hideModal('addTaskModal');
            hideModal('addTransactionModal');
            hideModal('statsModal');
            toggleMenu(false);
        }
        
        // Quick add with Ctrl/Cmd + N
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            quickAction();
        }
    });
    
    // Prevent form submission on enter
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && event.target.classList.contains('modal-input')) {
            event.preventDefault();
        }
    });
}

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', init);