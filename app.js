// تطبيق قائمة المهام
const storage = new TaskStorage();
let currentFilter = 'all';

// عناصر الـ DOM
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const addBtn = document.getElementById('addBtn');
const tasksList = document.getElementById('tasksList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const exportBtn = document.getElementById('exportBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const completedCount = document.getElementById('completedCount');
const toast = document.getElementById('toast');

// الأحداث
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

clearCompletedBtn.addEventListener('click', clearCompleted);
exportBtn.addEventListener('click', exportData);
clearAllBtn.addEventListener('click', () => {
    if (confirm('هل أنت متأكد من رغبتك في مسح جميع المهام؟')) {
        storage.clearAll();
        renderTasks();
        showToast('تم مسح جميع المهام', 'success');
    }
});

// إضافة مهمة جديدة
function addTask() {
    const text = taskInput.value.trim();
    const priority = prioritySelect.value;

    if (!text) {
        showToast('الرجاء إدخال نص المهمة', 'warning');
        taskInput.focus();
        return;
    }

    if (text.length > 500) {
        showToast('النص طويل جداً (الحد الأقصى 500 حرف)', 'warning');
        return;
    }

    storage.addTask(text, priority);
    taskInput.value = '';
    prioritySelect.value = 'medium';
    renderTasks();
    showToast('تم إضافة المهمة بنجاح', 'success');
}

// عرض المهام
function renderTasks() {
    const tasks = storage.getTasks();
    const filteredTasks = filterTasks(tasks);

    tasksList.innerHTML = '';

    if (filteredTasks.length === 0) {
        emptyState.classList.add('show');
        tasksList.style.display = 'none';
    } else {
        emptyState.classList.remove('show');
        tasksList.style.display = 'flex';
        filteredTasks.forEach(task => {
            const taskEl = createTaskElement(task);
            tasksList.appendChild(taskEl);
        });
    }

    updateStats();
}

// تصفية المهام
function filterTasks(tasks) {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        default:
            return tasks;
    }
}

// إنشاء عنصر المهمة
function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task-item priority-${task.priority}`;
    if (task.completed) div.classList.add('completed');

    const date = new Date(task.createdAt);
    const formattedDate = date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const priorityText = {
        low: 'منخفضة',
        medium: 'متوسطة',
        high: 'عالية'
    }[task.priority];

    div.innerHTML = `
        <input 
            type="checkbox" 
            class="task-checkbox" 
            ${task.completed ? 'checked' : ''}
            data-id="${task.id}"
        >
        <div class="task-content">
            <span class="task-text" data-id="${task.id}">${escapeHtml(task.text)}</span>
            <div class="task-meta">
                <span class="task-priority ${task.priority}">${priorityText}</span>
                <span class="task-date">
                    <i class="far fa-calendar"></i>
                    ${formattedDate}
                </span>
            </div>
        </div>
        <div class="task-actions">
            <button class="task-btn edit-btn" data-id="${task.id}" title="تعديل">
                <i class="fas fa-edit"></i>
            </button>
            <button class="task-btn delete-btn" data-id="${task.id}" title="حذف">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    // حدث تحديد المهمة
    div.querySelector('.task-checkbox').addEventListener('change', (e) => {
        storage.toggleTask(task.id);
        renderTasks();
    });

    // حدث حذف المهمة
    div.querySelector('.delete-btn').addEventListener('click', () => {
        if (confirm('هل أنت متأكد من رغبتك في حذف هذه المهمة؟')) {
            storage.deleteTask(task.id);
            renderTasks();
            showToast('تم حذف المهمة', 'success');
        }
    });

    // حدث تعديل المهمة
    div.querySelector('.edit-btn').addEventListener('click', () => {
        editTask(task, div);
    });

    return div;
}

// تعديل المهمة
function editTask(task, taskEl) {
    const textEl = taskEl.querySelector('.task-text');
    const originalText = task.text;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'task-edit-input';
    input.style.cssText = 'padding: 8px 12px; border: 2px solid #667eea; border-radius: 6px; background: white; font-size: 0.95em; width: 100%;';

    textEl.replaceWith(input);
    input.focus();
    input.select();

    function saveEdit() {
        const newText = input.value.trim();
        if (newText && newText !== originalText) {
            storage.updateTask(task.id, newText);
            renderTasks();
            showToast('تم تحديث المهمة', 'success');
        } else if (!newText) {
            showToast('نص المهمة لا يمكن أن يكون فارغاً', 'warning');
            renderTasks();
        } else {
            renderTasks();
        }
    }

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') renderTasks();
    });
}

// مسح المهام المنجزة
function clearCompleted() {
    const tasks = storage.getTasks();
    const completedCount = tasks.filter(t => t.completed).length;

    if (completedCount === 0) {
        showToast('لا توجد مهام منجزة للحذف', 'warning');
        return;
    }

    if (confirm(`هل تريد حذف ${completedCount} مهمة منجزة؟`)) {
        storage.clearCompleted();
        renderTasks();
        showToast('تم مسح المهام المنجزة', 'success');
    }
}

// تحديث الإحصائيات
function updateStats() {
    const tasks = storage.getTasks();
    const completed = tasks.filter(t => t.completed).length;
    const active = tasks.length - completed;

    totalCount.textContent = tasks.length;
    activeCount.textContent = active;
    completedCount.textContent = completed;
}

// تصدير البيانات
function exportData() {
    const tasks = storage.getTasks();
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('تم تحميل البيانات بنجاح', 'success');
}

// عرض الإشعارات
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// تجنب XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// تحميل البيانات عند فتح الصفحة
window.addEventListener('load', () => {
    renderTasks();
});

// حفظ البيانات تلقائياً كل 30 ثانية (احتياط)
setInterval(() => {
    storage.saveToLocalStorage();
}, 30000);