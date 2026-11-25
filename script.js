/* ==========================================
   TASKNOVA - SMART TASK MANAGEMENT
   Main JavaScript Application
========================================== */

const STORAGE_KEY = "tasknova_tasks_v1";

let tasks = [];
let editingTaskId = null;

// DOM ELEMENTS
const taskList = document.getElementById("taskList");
const taskModal = document.getElementById("taskModal");
const taskForm = document.getElementById("taskForm");

const addTaskButton = document.getElementById("addTaskButton");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const filterPriority = document.getElementById("filterPriority");

const themeButton = document.getElementById("themeButton");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

const toast = document.getElementById("toast");

// INITIALIZATION
document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  loadTasks();
  setCurrentDate();
  renderTasks();
  updateDashboard();
  setupEventListeners();
  loadTheme();
}

// EVENT LISTENERS
function setupEventListeners() {

  addTaskButton.addEventListener("click", openAddModal);

  closeModal.addEventListener("click", closeTaskModal);

  taskModal.addEventListener("click", function(event) {
    if (event.target === taskModal) {
      closeTaskModal();
    }
  });

  taskForm.addEventListener("submit", saveTask);

  searchInput.addEventListener("input", renderTasks);

  filterStatus.addEventListener("change", renderTasks);

  filterPriority.addEventListener("change", renderTasks);

  themeButton.addEventListener("click", toggleTheme);

  menuToggle.addEventListener("click", function() {
    sidebar.classList.toggle("open");
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", function() {
      document.querySelectorAll(".nav-link").forEach(item => {
        item.classList.remove("active");
      });

      this.classList.add("active");

      if (window.innerWidth <= 700) {
        sidebar.classList.remove("open");
      }
    });
  });

  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
      closeTaskModal();
    }
  });
}

// LOAD TASKS
function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    tasks = savedTasks ? JSON.parse(savedTasks) : [];

    if (!Array.isArray(tasks)) {
      tasks = [];
    }
  } catch (error) {
    console.error("Unable to load tasks:", error);
    tasks = [];
  }
}

// SAVE TASKS
function saveTasksToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Unable to save tasks:", error);
    showToast("Unable to save tasks in this browser.");
  }
}

// SET CURRENT DATE
function setCurrentDate() {
  const dateElement = document.getElementById("todayDate");

  const today = new Date();

  dateElement.textContent = today.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// OPEN ADD TASK MODAL
function openAddModal() {
  editingTaskId = null;

  taskForm.reset();

  document.getElementById("editTaskId").value = "";

  document.getElementById("taskPriority").value = "Medium";

  document.getElementById("taskStatus").value = "Pending";

  modalTitle.textContent = "Create New Task";

  taskModal.classList.add("show");

  document.getElementById("taskTitle").focus();
}

// CLOSE MODAL
function closeTaskModal() {
  taskModal.classList.remove("show");
  editingTaskId = null;
}

// SAVE OR UPDATE TASK
function saveTask(event) {
  event.preventDefault();

  const title = document.getElementById("taskTitle").value.trim();

  const description = document.getElementById("taskDescription").value.trim();

  const priority = document.getElementById("taskPriority").value;

  const status = document.getElementById("taskStatus").value;

  const deadline = document.getElementById("taskDeadline").value;

  if (!title) {
    showToast("Please enter a task title.");
    return;
  }

  if (deadline) {
    const dueDate = new Date(deadline + "T00:00:00");

    if (Number.isNaN(dueDate.getTime())) {
      showToast("Please enter a valid due date.");
      return;
    }
  }

  if (editingTaskId !== null) {

    const taskIndex = tasks.findIndex(
      task => task.id === editingTaskId
    );

    if (taskIndex !== -1) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        title,
        description,
        priority,
        status,
        deadline,
        updatedAt: new Date().toISOString()
      };
    }

    showToast("Task updated successfully! ✨");

  } else {

    const newTask = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      title,
      description,
      priority,
      status,
      deadline,
      createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);

    showToast("New task created successfully! 🎉");
  }

  saveTasksToStorage();

  closeTaskModal();

  taskForm.reset();

  renderTasks();

  updateDashboard();
}

// RENDER TASKS
function renderTasks() {

  const searchTerm = searchInput.value.toLowerCase().trim();

  const selectedStatus = filterStatus.value;

  const selectedPriority = filterPriority.value;

  const filteredTasks = tasks.filter(task => {

    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm) ||
      (task.description || "").toLowerCase().includes(searchTerm);

    const matchesStatus =
      selectedStatus === "all" ||
      task.status === selectedStatus;

    const matchesPriority =
      selectedPriority === "all" ||
      task.priority === selectedPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (filteredTasks.length === 0) {

    taskList.innerHTML = `
      <div class="empty-state">
        <div>📝</div>
        <h3>No tasks found</h3>
        <p>Try another search or create a new task!</p>
      </div>
    `;

    return;
  }

  taskList.innerHTML = filteredTasks.map(task => {

    const priorityClass = {
      High: "priority-high",
      Medium: "priority-medium",
      Low: "priority-low"
    }[task.priority] || "priority-medium";

    const statusClass = {
      Pending: "status-pending",
      "In Progress": "status-in-progress",
      Completed: "status-completed"
    }[task.status] || "status-pending";

    const dueDateText = task.deadline
      ? formatDate(task.deadline)
      : "No deadline";

    return `
      <article class="task-item">

        <div class="task-info">

          <h3>${escapeHTML(task.title)}</h3>

          <p>${escapeHTML(task.description || "No description added.")}</p>

          <div class="task-meta">

            <span class="tag ${priorityClass}">
              ${escapeHTML(task.priority)}
              Priority
            </span>

            <span class="tag ${statusClass}">
              ${escapeHTML(task.status)}
            </span>

            <span class="tag">
              📅 ${dueDateText}
            </span>

            ${isOverdue(task) ? `
              <span class="tag priority-high">
                Overdue
              </span>
            ` : ""}

          </div>

        </div>

        <div class="task-actions">

          <button
            type="button"
            onclick="editTask('${task.id}')"
            aria-label="Edit task"
          >
            ✏️ Edit
          </button>

          <button
            type="button"
            onclick="changeTaskStatus('${task.id}')"
            aria-label="Change task status"
          >
            ✓ Status
          </button>

          <button
            type="button"
            class="delete-button"
            onclick="deleteTask('${task.id}')"
            aria-label="Delete task"
          >
            🗑 Delete
          </button>

        </div>

      </article>
    `;

  }).join("");
}

// PREVENT HTML INJECTION
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// FORMAT DATE
function formatDate(dateString) {

  const date = new Date(dateString + "T00:00:00");

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// CHECK OVERDUE
function isOverdue(task) {
  if (!task.deadline || task.status === "Completed") {
    return false;
  }

  const deadline = new Date(task.deadline + "T00:00:00");

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return deadline < today;
}

// EDIT TASK
function editTask(id) {

  const task = tasks.find(item => item.id === id);

  if (!task) {
    showToast("Task not found.");
    return;
  }

  editingTaskId = id;

  document.getElementById("editTaskId").value = id;

  document.getElementById("taskTitle").value = task.title;

  document.getElementById("taskDescription").value = task.description || "";

  document.getElementById("taskPriority").value = task.priority;

  document.getElementById("taskStatus").value = task.status;

  document.getElementById("taskDeadline").value = task.deadline || "";

  modalTitle.textContent = "Edit Task";

  taskModal.classList.add("show");

  document.getElementById("taskTitle").focus();
}

// CHANGE TASK STATUS
function changeTaskStatus(id) {

  const task = tasks.find(item => item.id === id);

  if (!task) return;

  const statuses = [
    "Pending",
    "In Progress",
    "Completed"
  ];

  const currentIndex = statuses.indexOf(task.status);

  task.status = statuses[(currentIndex + 1) % statuses.length];

  task.updatedAt = new Date().toISOString();

  saveTasksToStorage();

  renderTasks();

  updateDashboard();

  showToast("Status changed to " + task.status + "!");
}

// DELETE TASK
function deleteTask(id) {

  const confirmed = confirm(
    "Are you sure you want to delete this task?"
  );

  if (!confirmed) return;

  tasks = tasks.filter(task => task.id !== id);

  saveTasksToStorage();

  renderTasks();

  updateDashboard();

  showToast("Task deleted successfully.");
}

// UPDATE DASHBOARD
function updateDashboard() {

  const total = tasks.length;

  const completed = tasks.filter(
    task => task.status === "Completed"
  ).length;

  const inProgress = tasks.filter(
    task => task.status === "In Progress"
  ).length;

  const pending = tasks.filter(
    task => task.status === "Pending"
  ).length;

  document.getElementById("totalTasks").textContent = total;

  document.getElementById("completedTasks").textContent = completed;

  document.getElementById("progressTasks").textContent = inProgress;

  document.getElementById("pendingTasks").textContent = pending;

  const percentage = total === 0
    ? 0
    : Math.round((completed / total) * 100);

  document.getElementById("progressPercentage").textContent =
    percentage + "%";

  document.getElementById("progressFill").style.width =
    percentage + "%";

  document.getElementById("progressCircle").style.background =
    `conic-gradient(#7165f5 ${percentage}%, #eceaf5 ${percentage}%)`;

  let message = "Your productivity journey starts here!";

  if (total > 0 && percentage === 100) {
    message = "Amazing! You completed every task! 🏆";
  } else if (percentage >= 70) {
    message = "Fantastic progress! Keep up the momentum! 🚀";
  } else if (percentage >= 30) {
    message = "Great work! Keep moving towards your goals! 💪";
  } else if (total > 0) {
    message = "Every small step counts. Keep going! ✨";
  }

  document.getElementById("progressMessage").textContent = message;
}

// THEME SWITCHING
function toggleTheme() {

  document.body.classList.toggle("dark-theme");

  const isDark = document.body.classList.contains("dark-theme");

  localStorage.setItem("tasknova_theme", isDark ? "dark" : "light");

  themeButton.innerHTML = isDark
    ? "<span>☀</span> Toggle Theme"
    : "<span>☾</span> Toggle Theme";

  showToast(isDark ? "Dark mode enabled 🌙" : "Light mode enabled ☀️");
}

// LOAD THEME
function loadTheme() {

  const savedTheme = localStorage.getItem("tasknova_theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");

    themeButton.innerHTML = "<span>☀</span> Toggle Theme";
  }
}

// SHOW NOTIFICATION
let toastTimer;

function showToast(message) {

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

/* ==========================================
   TASKNOVA INITIALIZATION COMPLETE
========================================== */
