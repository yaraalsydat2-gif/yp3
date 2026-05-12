// نظام تخزين المهام
class TaskStorage {
    constructor() {
        this.storageKey = 'tasks_todo_app';
        this.loadFromLocalStorage();
    }

    // إضافة مهمة جديدة
    addTask(text, priority = 'medium') {
        const task = {
            id: Date.now() + Math.random(),
            text: text,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveToLocalStorage();
        return task;
    }

    // الحصول على جميع المهام
    getTasks() {
        return this.tasks.sort((a, b) => {
            // الأولوية: عالي > متوسط > منخفض
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            // الأحدث أولاً
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }

    // تحديث المهمة
    updateTask(id, newText) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.text = newText;
            task.updatedAt = new Date().toISOString();
            this.saveToLocalStorage();
            return task;
        }
        return null;
    }

    // تبديل حالة المهمة (إكمال/عدم إكمال)
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            this.saveToLocalStorage();
            return task;
        }
        return null;
    }

    // حذف مهمة
    deleteTask(id) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            const deletedTask = this.tasks.splice(index, 1);
            this.saveToLocalStorage();
            return deletedTask[0];
        }
        return null;
    }

    // مسح المهام المنجزة
    clearCompleted() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveToLocalStorage();
    }

    // مسح جميع المهام
    clearAll() {
        this.tasks = [];
        this.saveToLocalStorage();
    }

    // حفظ في التخزين المحلي
    saveToLocalStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
            return true;
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            return false;
        }
    }

    // تحميل من التخزين المحلي
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            this.tasks = data ? JSON.parse(data) : [];
            return true;
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            this.tasks = [];
            return false;
        }
    }

    // احصائيات
    getStats() {
        return {
            total: this.tasks.length,
            completed: this.tasks.filter(t => t.completed).length,
            active: this.tasks.filter(t => !t.completed).length,
            byPriority: {
                high: this.tasks.filter(t => t.priority === 'high').length,
                medium: this.tasks.filter(t => t.priority === 'medium').length,
                low: this.tasks.filter(t => t.priority === 'low').length
            }
        };
    }

    // البحث عن المهام
    searchTasks(query) {
        const q = query.toLowerCase();
        return this.tasks.filter(t => t.text.toLowerCase().includes(q));
    }

    // تصفية المهام حسب الأولوية
    getTasksByPriority(priority) {
        return this.tasks.filter(t => t.priority === priority);
    }
}