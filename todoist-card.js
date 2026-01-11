//import {LitElement, html, css, unsafeCSS } from 'https://unpkg.com/lit-element@3.3.2/lit-element.js?module';
import { LitElement, html, css, unsafeCSS } from "https://cdn.jsdelivr.net/npm/lit-element@2.4.0/+esm?module";
//import { renderTemplate } from 'ha-nunjucks';
// registering with HACS: https://hacs.xyz/docs/publish/start
import { marked } from 'https://cdn.skypack.dev/marked@4.0.0';

/**
 * Todoist Card V2 - Fork of PowerTodoist with subtask hierarchy
 *
 * New features:
 * - Subtask hierarchy (nested display using parent_id)
 * - Collapsible subtasks
 * - REST API v2 support for task operations
 * - Subtask count indicators
 *
 * All original PowerTodoist features preserved.
 */

const todoistColors = {
    "berry_red": "rgb(184, 37, 111)",
    "red": "rgb(219, 64, 53)",
    "orange": "rgb(255, 153, 51)",
    "yellow": "rgb(250, 208, 0)",
    "olive_green": "rgb(175, 184, 59)",
    "lime_green": "rgb(126, 204, 73)",
    "green": "rgb(41, 148, 56)",
    "mint_green": "rgb(106, 204, 188)",
    "teal": "rgb(21, 143, 173)",
    "sky_blue": "rgb(20, 170, 245)",
    "light_blue": "rgb(150, 195, 235)",
    "blue": "rgb(64, 115, 255)",
    "grape": "rgb(136, 77, 255)",
    "violet": "rgb(175, 56, 235)",
    "lavender": "rgb(235, 150, 235)",
    "magenta": "rgb(224, 81, 148)",
    "salmon": "rgb(255, 141, 133)",
    "charcoal": "rgb(128, 128, 128)",
    "grey": "rgb(184, 184, 184)",
    "taupe": "rgb(204, 172, 147)",
}

function replaceMultiple(str2Replace, mapReplaces, was, input) {
    mapReplaces["%was%"] = was;
    mapReplaces["%input%"] = input;
    mapReplaces["%line%"] = '\n';
    var re = new RegExp(Object.keys(mapReplaces).join("|"), "gi");
    if (typeof str2Replace !== "string") return str2Replace;
    return str2Replace.replace(re, function (matched) {
        return mapReplaces[matched.toLowerCase()];
    });
}

class PowerTodoistCardEditor extends LitElement {
    static get properties() {
        return {
            hass: Object,
            config: Object,
        };
    }

    get _entity() {
        if (this.config) {
            return this.config.entity || '';
        }
        return '';
    }
    get _show_completed() {
        if (this.config) {
            return (this.config.show_completed !== undefined) ? this.config.show_completed : 5;
        }
        return 5;
    }

    get _show_header() {
        if (this.config) {
            return this.config.show_header || true;
        }
        return true;
    }
    get _show_item_add() {
        if (this.config) {
            return this.config.show_item_add || true;
        }
        return true;
    }
    get _use_quick_add() {
        if (this.config) {
            return this.config.use_quick_add || false;
        }
        return false;
    }
    get _show_item_close() {
        if (this.config) {
            return this.config.show_item_close || true;
        }
        return true;
    }
    get _show_item_delete() {
        if (this.config) {
            return this.config.show_item_delete || true;
        }
        return true;
    }
    get _filter_today_overdue() {
        if (this.config) {
            return this.config.filter_today_overdue || false;
        }
        return false;
    }
    get _show_subtasks() {
        if (this.config) {
            return this.config.show_subtasks !== false;
        }
        return true;
    }
    get _collapse_subtasks() {
        if (this.config) {
            return this.config.collapse_subtasks || false;
        }
        return false;
    }

    setConfig(config) {
        this.config = config;
    }

    configChanged(config) {
        const e = new Event('config-changed', {
            bubbles: true,
            composed: true,
        });

        e.detail = { config: config };

        this.dispatchEvent(e);
    }

    getEntitiesByType(type) {
        return this.hass
            ? Object.keys(this.hass.states).filter(entity => entity.substr(0, entity.indexOf('.')) === type)
            : [];
    }
    isNumeric(v) {
        return !isNaN(parseFloat(v)) && isFinite(v);
    }

    valueChanged(e) {
        if (
            !this.config
            || !this.hass
            || (this[`_${e.target.configValue}`] === e.target.value)
        ) {
            return;
        }

        if (e.target.configValue) {
            if (e.target.value === '') {
                if (!['entity', 'show_completed'].includes(e.target.configValue)) {
                    delete this.config[e.target.configValue];
                }
            } else {
                this.config = {
                    ...this.config,
                    [e.target.configValue]: e.target.checked !== undefined
                        ? e.target.checked
                        : this.isNumeric(e.target.value) ? parseFloat(e.target.value) : e.target.value,
                };
            }
        }

        this.configChanged(this.config);
    }

    render() {
        if (!this.hass) {
            return html``;
        }

        const entities = this.getEntitiesByType('sensor');
        const completedCount = [...Array(16).keys()];
        return html`<div class="card-config">
            <div class="option">
                <ha-select
                    naturalMenuWidth
                    fixedMenuPosition
                    label="Entity (required)"
                    @selected=${this.valueChanged}
                    @closed=${(event) => event.stopPropagation()}
                    .configValue=${'entity'}
                    .value=${this._entity}
                >
                    ${entities.map(entity => {
            return html`<mwc-list-item .value="${entity}">${entity}</mwc-list-item>`;
        })}
                </ha-select>
            </div>
            <div class="option">
                <ha-select
                    naturalMenuWidth
                    fixedMenuPosition
                    label="Number of completed tasks shown at the end of the list (0 to disable)"
                    @selected=${this.valueChanged}
                    @closed=${(event) => event.stopPropagation()}
                    .configValue=${'show_completed'}
                    .value=${this._show_completed}
                >
                    ${completedCount.map(count => {
            return html`<mwc-list-item .value="${count}">${count}</mwc-list-item>`;
        })}
                </ha-select>
            </div>

            <div class="option">
                <ha-switch
                    .checked=${(this.config.show_header === undefined) || (this.config.show_header !== false)}
                    .configValue=${'show_header'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                <span>Show header</span>
            </div>
            <div class="option">
                <ha-switch
                    .checked=${(this.config.show_item_add === undefined) || (this.config.show_item_add !== false)}
                    .configValue=${'show_item_add'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                <span>Show text input element for adding new tasks to the list</span>
            </div>
            <div class="option">
                <ha-switch
                    .checked=${(this.config.use_quick_add !== undefined) && (this.config.use_quick_add !== false)}
                    .configValue=${'use_quick_add'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                <span>
                    Use the <a target="_blank" href="https://todoist.com/help/articles/task-quick-add">Quick Add</a> implementation
                </span>
            </div>
            <div class="option">
                <ha-switch
                    .checked=${(this.config.show_item_close === undefined) || (this.config.show_item_close !== false)}
                    .configValue=${'show_item_close'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                <span>Show "close/complete" and "uncomplete" buttons</span>
            </div>
            <div class="option">
                <ha-switch
                    .checked=${(this.config.show_item_delete === undefined) || (this.config.show_item_delete !== false)}
                    .configValue=${'show_item_delete'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                <span>Show "delete" buttons</span>
            </div>
            <div class="option">
                <ha-switch
                    .checked=${(this.config.filter_today_overdue !== undefined) && (this.config.filter_today_overdue !== false)}
                    .configValue=${'filter_today_overdue'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                <span>Only show today or overdue</span>
            </div>
            <div class="option">
                <ha-switch
                    .checked=${(this.config.show_subtasks === undefined) || (this.config.show_subtasks !== false)}
                    .configValue=${'show_subtasks'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                <span>Show subtasks nested under parent tasks</span>
            </div>
            <div class="option">
                <ha-switch
                    .checked=${(this.config.collapse_subtasks !== undefined) && (this.config.collapse_subtasks !== false)}
                    .configValue=${'collapse_subtasks'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                <span>Collapse subtasks by default</span>
            </div>
        </div>`;
    }

    static get styles() {
        return css`
            .card-config ha-select {
                width: 100%;
            }

            .option {
                display: flex;
                align-items: center;
                padding: 5px;
            }

            .option ha-switch {
                margin-right: 10px;
            }
        `;
    }
}

class PowerTodoistCard extends LitElement {
    constructor() {
        super();
        this.itemsJustCompleted = [];
        this.itemsEmphasized = [];
        this.toastText = "";
        this.myConfig = {};
        this.expandedItems = new Set(); // Track manually expanded items (when collapse_subtasks=true)
        this.collapsedItems = new Set(); // Track manually collapsed items (when collapse_subtasks=false)
        this.selectedTask = null; // Currently selected task for detail popup
        this.editingTitle = false; // Is title being edited
        this.editingDescription = false; // Is description being edited
        this.showPriorityPicker = false;
        this.showLabelPicker = false;
        this.showDatePicker = false;
        this.showDurationPicker = false;
        this.showCommentInput = false;
        this.availableLabels = []; // All available labels from Todoist
    }

    static get properties() {
        return {
            hass: Object,
            config: Object,
        };
    }

    // Long press configuration
    _longPressMs = 1500;
    _clickDelayMs = 500;
    _lpTimer = null;
    _clickTimer = null;
    _clickCount = 0;

    _lpStart(item, longPressActionName) {
        this._lpTimer = setTimeout(() => {
            this._lpTimer = null;
            this._clickCount = 0;
            if (this._clickTimer) {
                clearTimeout(this._clickTimer);
                this._clickTimer = null;
            }
            this.itemAction(item, longPressActionName);
        }, this._longPressMs);
    }

    _lpEnd(item, clickActionName, dblClickActionName = "") {
        if (this._lpTimer) {
            clearTimeout(this._lpTimer);
            this._lpTimer = null;

            this._clickCount++;

            if (this._clickCount === 1) {
                if (dblClickActionName === "") {
                    this._clickCount = 0;
                    this._clickTimer = null;
                    this.itemAction(item, clickActionName);
                }
                else {
                    this._clickTimer = setTimeout(() => {
                        this._clickCount = 0;
                        this._clickTimer = null;
                        this.itemAction(item, clickActionName);
                    }, this._clickDelayMs);
                }
            } else if (this._clickCount === 2) {
                clearTimeout(this._clickTimer);
                this._clickTimer = null;
                this._clickCount = 0;
                this.itemAction(item, dblClickActionName);
            }
        }
    }

    _lpCancel() {
        if (this._lpTimer) {
            clearTimeout(this._lpTimer);
            this._lpTimer = null;
        }
    }

    static getConfigElement() {
        return document.createElement('powertodoist-card-editor');
    }

    setConfig(config) {
        if (!config.entity) {
            throw new Error('Entity is not set!');
        }

        this.config = config;
        this.myConfig = this.parseConfig(config);

        // Initialize expanded state based on collapse_subtasks config
        if (!config.collapse_subtasks) {
            // If not collapsing, we don't need to track expanded - all are expanded
        }
    }

    getCardSize() {
        return this.hass ? (this.hass.states[this.config.entity].attributes.tasks.length || 1) : 1;
    }

    random(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    getUUID() {
        let date = new Date();
        return this.random(1, 100) + '-' + (+date) + '-' + date.getMilliseconds();
    }

    // Toggle subtask expansion
    toggleSubtasks(taskId) {
        if (this.myConfig.collapse_subtasks) {
            // Default collapsed: toggle expandedItems
            if (this.expandedItems.has(taskId)) {
                this.expandedItems.delete(taskId);
            } else {
                this.expandedItems.add(taskId);
            }
        } else {
            // Default expanded: toggle collapsedItems
            if (this.collapsedItems.has(taskId)) {
                this.collapsedItems.delete(taskId);
            } else {
                this.collapsedItems.add(taskId);
            }
        }
        this.requestUpdate();
    }

    // Open task detail popup
    async openTaskDetail(task, allTasks) {
        // Find children for this task
        const children = allTasks ? allTasks.filter(t => t.parent_id === task.id) : [];
        this.selectedTask = { ...task, children, _comments: [] };
        this.editingTitle = false;
        this.editingDescription = false;
        this.showPriorityPicker = false;
        this.showLabelPicker = false;
        this.showDatePicker = false;
        this.showDurationPicker = false;
        this.showCommentInput = false;
        this.requestUpdate();

        // Load comments async
        const comments = await this.fetchComments(task.id);
        if (this.selectedTask && this.selectedTask.id === task.id) {
            this.selectedTask._comments = comments;
            this.requestUpdate();
        }
    }

    // Close task detail popup
    closeTaskDetail() {
        this.selectedTask = null;
        this.editingTitle = false;
        this.editingDescription = false;
        this.showPriorityPicker = false;
        this.showLabelPicker = false;
        this.showDatePicker = false;
        this.requestUpdate();
    }

    // Handle backdrop click
    handleBackdropClick(e) {
        if (e.target.classList.contains('task-detail-overlay')) {
            this.closeTaskDetail();
        }
    }

    // Start editing title
    startEditTitle() {
        this.editingTitle = true;
        this.requestUpdate();
        setTimeout(() => {
            const input = this.shadowRoot.querySelector('.task-detail-title-input');
            if (input) {
                input.focus();
                input.select();
            }
        }, 50);
    }

    // Save title
    async saveTitle(task, newTitle) {
        if (newTitle && newTitle.trim() !== task.content) {
            await this.updateTask(task.id, { content: newTitle.trim() });
            task.content = newTitle.trim();
        }
        this.editingTitle = false;
        this.requestUpdate();
    }

    // Start editing description
    startEditDescription() {
        this.editingDescription = true;
        this.requestUpdate();
        setTimeout(() => {
            const input = this.shadowRoot.querySelector('.task-detail-description-input');
            if (input) {
                input.focus();
            }
        }, 50);
    }

    // Save description
    async saveDescription(task, newDesc) {
        if (newDesc !== task.description) {
            await this.updateTask(task.id, { description: newDesc || '' });
            task.description = newDesc || '';
        }
        this.editingDescription = false;
        this.requestUpdate();
    }

    // Update task via REST API
    async updateTask(taskId, updates) {
        try {
            const response = await this.hass.callService('rest_command', 'todoist', {
                url: `tasks/${taskId}`,
                payload: JSON.stringify(updates)
            });
            // Refresh sensor data
            await this.hass.callService('homeassistant', 'update_entity', {
                entity_id: this.config.entity
            });
        } catch (error) {
            console.error('Failed to update task:', error);
            this.toastText = 'Fout bij updaten taak';
            this.requestUpdate();
        }
    }

    // Set priority
    async setPriority(task, priority) {
        await this.updateTask(task.id, { priority });
        task.priority = priority;
        this.showPriorityPicker = false;
        this.requestUpdate();
    }

    // Toggle label
    async toggleLabel(task, label) {
        const labels = task.labels || [];
        const newLabels = labels.includes(label)
            ? labels.filter(l => l !== label)
            : [...labels, label];
        await this.updateTask(task.id, { labels: newLabels });
        task.labels = newLabels;
        this.requestUpdate();
    }

    // Set due date
    async setDueDate(task, dateString) {
        const due = dateString ? { date: dateString } : null;
        await this.updateTask(task.id, { due_date: dateString || null });
        task.due = due;
        this.showDatePicker = false;
        this.requestUpdate();
    }

    // Add subtask
    async addSubtask(parentTask) {
        const content = await this.promptForInput('Nieuwe subtaak:');
        if (content && content.trim()) {
            try {
                // Get project_id from parent or sensor
                const projectId = parentTask.project_id || this.hass.states[this.config.entity]?.attributes?.project?.id;
                await this.hass.callService('rest_command', 'todoist', {
                    url: 'tasks',
                    payload: JSON.stringify({
                        content: content.trim(),
                        parent_id: parentTask.id,
                        project_id: projectId
                    })
                });
                // Refresh
                await this.hass.callService('homeassistant', 'update_entity', {
                    entity_id: this.config.entity
                });
                this.closeTaskDetail();
            } catch (error) {
                console.error('Failed to add subtask:', error);
            }
        }
    }

    // Add new task (from bottom button)
    async addNewTask() {
        const content = await this.promptForInput('Nieuwe taak:');
        if (content && content.trim()) {
            try {
                const projectId = this.hass.states[this.config.entity]?.attributes?.project?.id;
                await this.hass.callService('rest_command', 'todoist', {
                    url: 'tasks',
                    payload: JSON.stringify({
                        content: content.trim(),
                        project_id: projectId
                    })
                });
                // Refresh
                await this.hass.callService('homeassistant', 'update_entity', {
                    entity_id: this.config.entity
                });
            } catch (error) {
                console.error('Failed to add task:', error);
            }
        }
    }

    // Fetch comments for a task
    async fetchComments(taskId) {
        try {
            // We need to call the API directly via fetch since HA rest_command doesn't return data
            const token = this.getApiToken();
            if (!token) return [];

            const response = await fetch(`https://api.todoist.com/rest/v2/comments?task_id=${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        }
        return [];
    }

    // Add comment to task
    async addComment(taskId, content) {
        try {
            const token = this.getApiToken();
            if (!token) return;

            const response = await fetch('https://api.todoist.com/rest/v2/comments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    task_id: taskId,
                    content: content
                })
            });
            if (response.ok) {
                // Refresh comments
                this.selectedTask._comments = await this.fetchComments(taskId);
                this.requestUpdate();
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    }

    // Get API token from secrets (stored in sensor command)
    getApiToken() {
        // Try to get from label_colors sensor command (it has the token hardcoded)
        // This is a workaround - ideally should be configurable
        return 'f12e0fd01aea0907b827f1e356a85b13a2cfe58f';
    }

    // Set task duration
    async setDuration(task, minutes) {
        await this.updateTask(task.id, {
            duration: minutes ? { amount: minutes, unit: 'minute' } : null
        });
        task.duration = minutes ? { amount: minutes, unit: 'minute' } : null;
        this.requestUpdate();
    }

    // Format duration for display
    formatDuration(duration) {
        if (!duration) return null;
        const mins = duration.amount;
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return remainingMins ? `${hours}u ${remainingMins}m` : `${hours}u`;
    }

    // Check if task is recurring
    isRecurring(task) {
        return task.due?.is_recurring || task.due?.string?.match(/elke|every|daily|weekly|monthly|yearly/i);
    }

    // Format comment date
    formatCommentDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Zojuist';
        if (diffMins < 60) return `${diffMins}m geleden`;
        if (diffHours < 24) return `${diffHours}u geleden`;
        if (diffDays < 7) return `${diffDays}d geleden`;
        return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    }

    // Simple prompt (browser native)
    promptForInput(message) {
        return new Promise(resolve => {
            const result = prompt(message);
            resolve(result);
        });
    }

    // Get priority label
    getPriorityLabel(priority) {
        switch(priority) {
            case 4: return 'P1';
            case 3: return 'P2';
            case 2: return 'P3';
            default: return 'P4';
        }
    }

    // Build task tree from flat list using parent_id
    buildTaskTree(items) {
        const taskMap = new Map();
        const rootTasks = [];

        // First pass: create map with children arrays
        items.forEach(task => {
            taskMap.set(task.id, { ...task, children: [] });
        });

        // Second pass: build tree structure
        items.forEach(task => {
            const taskWithChildren = taskMap.get(task.id);
            if (task.parent_id && taskMap.has(task.parent_id)) {
                taskMap.get(task.parent_id).children.push(taskWithChildren);
            } else {
                rootTasks.push(taskWithChildren);
            }
        });

        return rootTasks;
    }

    itemAdd(e) {
        if (e.which === 13) {
            let input = this.shadowRoot.getElementById('powertodoist-card-item-add');
            let value = input.value;

            if (value && value.length > 1) {
                let stateValue = this.hass.states[this.config.entity].state || undefined;

                if (stateValue) {
                    let uuid = this.getUUID();
                    if (!this.config.use_quick_add) {
                        let commands = [{
                            'type': 'item_add',
                            'temp_id': uuid,
                            'uuid': uuid,
                            'args': {
                                'project_id': stateValue,
                                'content': value,
                            },
                        }];
                        this.hass
                            .callService('rest_command', 'todoist', {
                                url: 'sync',
                                payload: 'commands=' + JSON.stringify(commands),
                            })
                            .then(response => {
                                input.value = '';
                                this.hass.callService('homeassistant', 'update_entity', {
                                    entity_id: this.config.entity,
                                });
                            });
                    } else {
                        let state = this.hass.states[this.config.entity] || undefined;
                        if (!state) {
                            return;
                        }

                        var qa = value;
                        try {
                            if (this.myConfig.filter_section && !qa.includes(' /'))
                                qa = qa + ' /' + this.myConfig.filter_section.replaceAll(' ', '\\ ');
                        } catch (error) { }
                        try {
                            if (state.attributes.project.name && !qa.includes(' #'))
                                qa = qa + ' #' + state.attributes.project.name.replaceAll(' ', '\\ ');
                        } catch (error) { }

                        // Use todoist_quick_add rest_command for v2
                        this.hass
                            .callService('rest_command', 'todoist_quick_add', {
                                text: qa,
                            })
                            .then(response => {
                                input.value = '';
                                this.hass.callService('homeassistant', 'update_entity', {
                                    entity_id: this.config.entity,
                                });
                            });
                    }
                }
            }
        }
    }

    parseConfig(srcConfig) {
        var parsedConfig;
        var project_notes = [];
        let myStrConfig = JSON.stringify(srcConfig);
        let date_formatted = (new Date()).format(this.myConfig["date_format"] || "mmm dd H:mm");
        try {
            const project_comments_results = this.hass.states[this.myConfig.comments_entity].attributes['results'];
            project_notes = project_comments_results[0].content;
        } catch (error) {
            project_notes = 'No project notes yet';
        }
        const strLabels = (typeof (item) !== "undefined" && item.labels) ? JSON.stringify(item.labels) : "";
        var mapReplaces = {
            "%user%": this.hass ? this.hass.user.name : "",
            "%date%": `${date_formatted}`,
            "%str_labels%": strLabels,
            "%section%": srcConfig.filter_section ?? '',
        };
        if (Array.isArray(project_notes) && project_notes.length > 0) {
            project_notes.forEach(function (value, index) {
                mapReplaces["%project_notes_" + index + '%'] = value.content;
                if (index == 0) mapReplaces["%project_notes%"] = value.content;
            });
        } else {
            mapReplaces["%project_notes%"] = "";
        }
        if (this.hass && this.hass.states['sensor.dow'] && this.hass.states['sensor.dow']?.state) {
            var dazeString = this.hass.states['sensor.dow'].state.split(', ');
            [0, 1, 2, 3, 4, 5, 6].forEach(function (index) {
                mapReplaces['%dow' + (index - 1) + '%'] = dazeString[index]?.replaceAll("'", "") || "";
            });
        }
        for (const key in mapReplaces) {
            if (/%[a-zA-Z0-9_-]+%/.test(mapReplaces[key])) {
                mapReplaces[key] = replaceMultiple(mapReplaces[key], mapReplaces);
            }
        }
        myStrConfig = replaceMultiple(myStrConfig, mapReplaces);
        try {
            parsedConfig = JSON.parse(myStrConfig);
        } catch (err) {
            var source = "";
            parsedConfig = JSON.parse(JSON.stringify(srcConfig));
            try {
                const span = 40;
                const start = err.message.match(/[-+]?[0-9]*\.?[0-9]+/g)[1] - span / 2;
                source = "(near --> " + myStrConfig.substring(start, start + span) + " <---)";
            } catch (err2) { }
            parsedConfig["error"] = err.name + ": " + err.message + source;
        }
        return parsedConfig;
    }

    buildCommands(item, button = "actions_close") {
        let state = this.hass.states[this.config.entity].attributes;
        let actions = this.config[button] !== undefined ? this.parseConfig(this.config[button]) : [];
        let automation = "", confirm = "", promptTexts = "", toast = "";
        let commands = [], updates = [], labelChanges = [], adds = [], allow = [], matches = [], emphasis = [];
        try { automation = actions.find(a => typeof a === 'object' && a.hasOwnProperty('service')).service || ""; } catch (error) { }
        try { confirm = actions.find(a => typeof a === 'object' && a.hasOwnProperty('confirm')).confirm || ""; } catch (error) { }
        try { promptTexts = actions.find(a => typeof a === 'object' && a.hasOwnProperty('prompt_texts')).prompt_texts || ""; } catch (error) { }
        try { updates = actions.find(a => typeof a === 'object' && a.hasOwnProperty('update')).update || []; } catch (error) { }
        try { labelChanges = actions.find(a => typeof a === 'object' && a.hasOwnProperty('label')).label || []; } catch (error) { }
        try { toast = actions.find(a => typeof a === 'object' && a.hasOwnProperty('toast')).toast || ""; } catch (error) { }
        try { adds = actions.find(a => typeof a === 'object' && a.hasOwnProperty('add')).add || []; } catch (error) { }
        try { allow = actions.find(a => typeof a === 'object' && a.hasOwnProperty('allow')).allow || []; } catch (error) { }
        try { matches = actions.find(a => typeof a === 'object' && a.hasOwnProperty('match')).match || []; } catch (error) { }
        try { emphasis = actions.find(a => typeof a === 'object' && a.hasOwnProperty('emphasis')).emphasis || []; } catch (error) { }
        try { paint = actions.find(a => typeof a === 'object' && a.hasOwnProperty('paint')).paint || []; } catch (error) { }

        let initialLabels = [...item.labels];
        let labels = item.labels;
        if (labelChanges.includes("!*")) labels = [];
        if (labelChanges.includes("!_")) labels =
            labels.filter(function (label) { return label[0] !== '_'; });
        if (labelChanges.includes("!!")) labels =
            labels.filter(function (label) { return label[0] === '_'; });
        labelChanges.map(change => {
            let newLabel = replaceMultiple(change, { "%user%": this.hass.user.name });
            if (change.startsWith("!")) {
                if (labels.includes(change.slice(1)))
                    labels = labels.filter(e => e !== change.slice(1));
            } else if (change.startsWith(":")) {
                if (labels.includes(change.slice(1)))
                    labels = labels.filter(e => e !== change.slice(1));
                else
                    if (!labels.includes(newLabel)) labels.push(newLabel.slice(1));
            } else {
                if (!labels.includes(newLabel)) labels.push(newLabel);
            }
        });

        let labelsBeingAdded = labels.filter(l => !initialLabels.includes(l));
        let labelsBeingRemoved = initialLabels.filter(l => !labels.includes(l));
        this.changeLabelsUINow(item, labelsBeingAdded, labelsBeingRemoved);

        let section_id2order = {};
        section_id2order[""] = 0;
        let section_order2id = [];
        state.sections.map(s => {
            section_id2order[s.id.toString()] = s.section_order;
            section_order2id[s.section_order] = s.id;
        });
        let nextSection = section_order2id[section_id2order[item.section_id] + 1] || item.project_id;
        let input = "";
        if (promptTexts ||
            JSON.stringify(updates).includes("%input%") ||
            (!actions.length && ["actions_content", "actions_description"].includes(button))
        ) {
            let field = button.slice(8);
            let questionText = "Please enter a new value for " + button.slice(8) + ":";
            let defaultText = item[button.slice(8)] || "";
            if (promptTexts)
                [questionText, defaultText] = promptTexts.split("|");
            field = /(?<=%).*(?=%)/.exec(defaultText);
            if (field && item[field])
                defaultText = defaultText.replaceAll("%" + field + "%", item[field]);
            input = window.prompt(questionText, defaultText) || "";
        }

        if (updates.length || labelChanges.length) {
            let newIndex = commands.push({
                "type": "item_update",
                "uuid": this.getUUID(),
                "args": {
                    "id": item.id,
                    "labels": labels,
                },
            }) - 1;
            let newObj = {};
            Object.entries(updates).map(([key, valueObj]) => {
                let value = Object.keys(valueObj)[0];
                if (["content", "description", "due", "priority", "collapsed",
                    "assigned_by_uid", "responsible_uid", "day_order", ""]
                    .includes(value)) {
                    newObj = { [value]: replaceMultiple(valueObj[value], mapReplaces, item[value], input) };
                    Object.assign(commands[newIndex].args, newObj);
                }
            });
        }

        if (emphasis.length) {
            this.emphasizeItem(item, emphasis);
        }
        if (actions.includes("move")) {
            let newIndex = commands.push({
                "type": "item_move",
                "uuid": this.getUUID(),
                "args": {
                    "id": item.id,
                },
            }) - 1;
            commands[newIndex].args[nextSection !== item.project_id ? "section_id" : "project_id"] = nextSection;
        }

        let default_actions = {
            "actions_close": { 'type': 'item_close', 'uuid': this.getUUID(), 'args': { 'id': item.id } },
            "actions_dbl_close": {},
            "actions_longpress_close": {},
            "actions_content": { "type": "item_update", "uuid": this.getUUID(), "args": { "id": item.id, "content": input } },
            "actions_dbl_content": {},
            "actions_longpress_content": {},
            "actions_description": { "type": "item_update", "uuid": this.getUUID(), "args": { "id": item.id, "description": input } },
            "actions_dbl_description": {},
            "actions_longpress_description": {},
            "actions_label": {},
            "actions_dbl_label": {},
            "actions_longpress_label": {},
            "actions_delete": { 'type': 'item_delete', 'uuid': this.getUUID(), 'args': { 'id': item.id } },
            "actions_dbl_delete": {},
            "actions_longpress_delete": {},
            "actions_uncomplete": { 'type': 'item_uncomplete', 'uuid': this.getUUID(), 'args': { 'id': item.id } },
            "actions_dbl_uncomplete": {},
            "actions_longpress_uncomplete": {},
        }

        Array.from(["close", "uncomplete", "delete"]).
            forEach(a => {
                if (actions.includes(a) &&
                    ((a != null || a.length !== 0)))
                    commands.push(default_actions["actions_" + a]);
            })
        if (!actions.length && default_actions[button])
            commands.push(default_actions[button]);

        if (confirm) {
            if (!window.confirm(confirm))
                return [[], [], "", ""];
        }
        if (allow.length && !allow.includes(this.hass.user.name)) {
            return [[], [], "", ""];
        }
        if (matches.length === 1) matches.push = 'on';
        if (matches.length === 2) matches.push = '';
        if (matches.length === 3) matches.push = '';
        matches.forEach(([field, value, subAction, subElseAction]) => {
            var stateToMatch, attrName;
            if (field.includes('.')) {
                attrName = field.includes('#') ? field.split('#')[1] : '';
                if (!attrName) {
                    stateToMatch = this?.hass?.states[field.split('#')[0]]?.state || undefined;
                } else {
                    stateToMatch = this?.hass?.states[field.split('#')[0]]?.attributes[attrName] || undefined;
                }
                if ((stateToMatch === value) && subAction.length) {
                    this.itemAction(item, subAction);
                }
                if ((stateToMatch !== value) && subElseAction.length) {
                    this.itemAction(item, subElseAction);
                }
            }
            else if ((Array.isArray(item[field]) && item[field].includes(value)) ||
                item[field] == value)
                this.itemAction(item, subActions);
        })
        return [commands, adds, automation, toast];
    }

    changeLabelsUINow(item, labelsBeingAdded, labelsBeingRemoved) {
        if (!labelsBeingAdded?.length && !labelsBeingRemoved?.length) return;
        let state = this.hass.states[this.config.entity] || undefined;
        let items = state?.attributes?.tasks || [];
        const itemIndex = items.findIndex(i => i.id === item.id);
        if (itemIndex === -1) return;
        let currentLabels = items[itemIndex].labels || [];
        currentLabels = currentLabels.filter(label => !labelsBeingRemoved.includes(label));
        currentLabels = [...new Set([...currentLabels, ...labelsBeingAdded])];
        items = [
            ...items.slice(0, itemIndex),
            { ...items[itemIndex], labels: currentLabels },
            ...items.slice(itemIndex + 1),
        ];
        this.items = items;
    }

    async showToast(message, duration, defer = 0) {
        if (!message) return;
        const toast = this.shadowRoot.querySelector("#todoist-toast");
        if (toast) {
            setTimeout(() => {
                toast.innerText = toast.innerText + ' ' + message;
                this.toastText = message;
                toast.style.display = 'block';
            }, 1000);
            setTimeout(() => {
                toast.innerText = "";
                this.toastText = "";
                toast.style.display = 'none';
            }, duration + 1000);
        }
    }

    emphasizeItem(item, className) {
        var itemNode = this.shadowRoot.querySelector("#item_" + item.id);
        if (itemNode) {
            itemNode.classList.add("todoist-" + className);
            setTimeout(() => {
                itemNode.classList.remove("todoist-" + className);
            }, 3000);
        }
    }

    async processAdds(adds) {
        for (const item of adds) {
            this.hass.callService('rest_command', 'todoist_quick_add', {
                text: item,
            });
        }
    }

    itemAction(item, action) {
        if (item === undefined) return;
        action = action.toLowerCase();
        let commands = [], adds = [], automation = [];
        let toast = "";
        [commands, adds, automation, toast] = this.buildCommands(item, "actions_" + action);
        this.showToast(toast, 3000);
        this.processAdds(adds);

        // Use REST API v2 for close/delete/reopen operations
        const commandTypes = commands.map(cmd => cmd.type);

        if (commandTypes.includes('item_close')) {
            // Use REST API v2 close
            this.hass.callService('rest_command', 'todoist', {
                url: `tasks/${item.id}/close`,
                payload: '{}',
            }).then(response => {
                if (this.itemsJustCompleted.length >= this.config.show_completed) {
                    this.itemsJustCompleted.splice(0, this.itemsJustCompleted.length - this.config.show_completed + 1);
                }
                this.itemsJustCompleted.push(item);
                return this.hass.callService('homeassistant', 'update_entity', {
                    entity_id: this.config.entity
                });
            }).catch(err => {
                console.error('Error closing task:', err);
            });
        } else if (commandTypes.includes('item_delete')) {
            // Use REST API v2 delete
            this.hass.callService('rest_command', 'todoist_delete', {
                task_id: item.id,
            }).then(response => {
                this.itemsJustCompleted = this.itemsJustCompleted.filter(v => v.id != item.id);
                return this.hass.callService('homeassistant', 'update_entity', {
                    entity_id: this.config.entity
                });
            }).catch(err => {
                console.error('Error deleting task:', err);
            });
        } else if (commandTypes.includes('item_uncomplete')) {
            // Use REST API v2 reopen
            this.hass.callService('rest_command', 'todoist', {
                url: `tasks/${item.id}/reopen`,
                payload: '{}',
            }).then(response => {
                this.itemsJustCompleted = this.itemsJustCompleted.filter(v => v.id != item.id);
                return this.hass.callService('homeassistant', 'update_entity', {
                    entity_id: this.config.entity
                });
            }).catch(err => {
                console.error('Error reopening task:', err);
            });
        } else {
            // Fall back to Sync API for other operations
            this.hass.callService('rest_command', 'todoist', {
                url: 'sync',
                payload: 'commands=' + JSON.stringify(commands),
            })
            .then(response => {
                return this.hass.callService('homeassistant', 'update_entity', {
                    entity_id: this.config.entity
                });
            })
            .catch(err => {
                console.error('Error in Todoist operation:', err);
            });
        }

        if (automation.length) {
            this.hass.callService(
                automation.includes('script.') ? 'homeassistant' : 'automation',
                automation.includes('script.') ? 'turn_on' : 'trigger',
                { entity_id: automation, }
            ).then(function () {
                console.log('Automation triggered successfully from todoist JS!');
                this.hass.callService('homeassistant', 'update_entity', { entity_id: this.config.entity, });
            }).catch(function (error) {
                console.error('Error triggering automation from todoist JS:', error);
            });
        }
    }

    itemUnlistCompleted(item) {
        this.itemsJustCompleted = this.itemsJustCompleted.filter(v => {
            return v.id != item.id;
        });
        this.hass.callService('homeassistant', 'update_entity', {
            entity_id: this.config.entity,
        });
    }

    filterDates(items) {
        // Sort by priority first (if enabled)
        if ((typeof this.myConfig.sort_by_priority !== 'undefined') && (this.myConfig.sort_by_priority !== false)) {
            items.sort((a, b) => {
                // Todoist: priority 4 = P1 (highest), 1 = P4 (lowest)
                // So we sort descending (4 first, then 3, 2, 1)
                if (this.myConfig.sort_by_priority === 'ascending') {
                    return (a.priority || 1) - (b.priority || 1); // Low priority first
                } else {
                    return (b.priority || 1) - (a.priority || 1); // High priority first (default)
                }
            });
        }

        // Then sort by due date (maintains priority order for same dates)
        if ((typeof this.myConfig.sort_by_due_date !== 'undefined') && (this.myConfig.sort_by_due_date !== false)) {
            items.sort((a, b) => {
                if (!(a.due && b.due)) return 0;
                if (this.myConfig.sort_by_due_date == 'ascending')
                    return (new Date(a.due.date)).getTime() - (new Date(b.due.date)).getTime();
                else
                    return (new Date(b.due.date)).getTime() - (new Date(a.due.date)).getTime();
            });
        }

        if ((typeof this.myConfig.filter_show_dates_starting !== 'undefined') ||
            (typeof this.myConfig.filter_show_dates_ending !== 'undefined')) {
            let startCompare = Number(this.myConfig.filter_show_dates_starting);
            let endCompare = Number(this.myConfig.filter_show_dates_ending);
            if ((typeof this.myConfig.filter_show_dates_starting == 'string') && !isNaN(startCompare))
                startCompare = new Date().setHours(0, 0, 0, 0) + (startCompare * 24 * 60 * 60 * 1000);
            else
                startCompare = new Date().getTime() + (startCompare * 1 * 60 * 60 * 1000);
            if ((typeof this.myConfig.filter_show_dates_ending == 'string') && !isNaN(endCompare))
                endCompare = new Date().setHours(23, 59, 59, 999) + (endCompare * 24 * 60 * 60 * 1000);
            else
                endCompare = new Date().getTime() + (endCompare * 1 * 60 * 60 * 1000);
            var dItem, dItem1, dItem2;
            items = items.filter(item => {
                if (!item.due) return (this.myConfig.filter_show_dates_empty !== false);
                let duration = 0;
                if (item.duration)
                    duration = item.duration.unit == 'day' ?
                        (item.duration.amount * 24 * 60 * 60 * 1000) :
                        (item.duration.amount * 1 * 1 * 60 * 1000);
                if (/^\d{4}-\d{2}-\d{2}$/.test(item.due.date)) {
                    dItem1 = (new Date(item.due.date + 'T23:59:59')).getTime();
                    dItem2 = (new Date(item.due.date + 'T00:00:00')).getTime();
                } else {
                    dItem1 = (new Date(item.due.date)).getTime();
                    dItem2 = dItem1;
                }
                if (isNaN(endCompare) && duration) {
                    startCompare -= duration;
                    endCompare = new Date().getTime();
                }
                let passStart = isNaN(startCompare) ? true : startCompare <= dItem1;
                let passEnd = isNaN(endCompare) ? true : endCompare >= dItem2;
                return passStart && passEnd;
            });
        }
        return items;
    }

    filterPriority(items) {
        if ((typeof this.myConfig.sort_by_priority !== 'undefined') && (this.myConfig.sort_by_priority !== false)) {
            items.sort((a, b) => {
                if (!(a.priority && b.priority)) return 0;
                if (this.myConfig.sort_by_priority === 'ascending')
                    return a.priority - b.priority;
                else
                    return b.priority - a.priority;
            });
        }
        return items;
    }

    assessLabelCriteriaForItem(item, criteria, defaultIfNoCriteria, cardLabels) {
        if (!criteria) return defaultIfNoCriteria;
        let includes = 0;
        let excludes = 0;
        criteria.forEach(label => {
            let l = label;
            if (l.startsWith("!")) {
                excludes += item.labels.includes(l.slice(1));
            } else {
                includes += item.labels.includes(l) || (l === "*");
                includes += (l === "!*") && (item.labels.length === 0);
                if (!cardLabels?.includes(l)) cardLabels.push(l);
            }
        });
        return (excludes === 0) && (includes > 0);
    }

    getIconName(icons, baseIndex, item) {
        let chosen = icons[baseIndex];
        if (
            this.config.status_from_labels !== undefined &&
            item?.statusFromLabelCriteria !== undefined &&
            icons.length >= 5
        ) {
            chosen = item.statusFromLabelCriteria ? icons[4] : icons[5];
        }
        return chosen;
    }

    formatDueDate(dueDate, configFormat) {
        // Smart date formatting - relative dates for nearby, absolute for far
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dueDateTime = new Date(dueDate);
        const dueDateOnly = new Date(dueDate);
        dueDateOnly.setHours(0, 0, 0, 0);

        const diffDays = Math.round((dueDateOnly - today) / (1000 * 60 * 60 * 24));

        let dateStr = "";
        if (dueDateOnly.getTime() === today.getTime()) {
            dateStr = "Vandaag";
        } else if (dueDateOnly.getTime() === tomorrow.getTime()) {
            dateStr = "Morgen";
        } else if (dueDateOnly.getTime() === yesterday.getTime()) {
            dateStr = "Gisteren";
        } else if (diffDays > 0 && diffDays <= 7) {
            // Within a week - show day name
            const days = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
            dateStr = days[dueDateOnly.getDay()];
        } else if (diffDays < 0) {
            // Overdue - show how many days
            dateStr = `${Math.abs(diffDays)}d te laat`;
        } else {
            // Far future - show date
            dateStr = `${dueDateOnly.getDate()} ${['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][dueDateOnly.getMonth()]}`;
        }

        return dateStr;
    }

    renderTemplate(templateStr) {
        if (!templateStr) {
            return '';
        }
        try {
            const expanded = this.expandJinjaExpressions(templateStr);
            return marked.parse(expanded);
        } catch (error) {
            console.warn('Template rendering failed:', error);
            return marked.parse(templateStr);
        }
    }

    expandJinjaExpressions(str) {
        return str.replace(/\{\{(.+?)\}\}/g, (match, expr) => {
            try {
                return this.evaluateExpression(expr.trim());
            } catch (e) {
                console.warn(`Failed to evaluate expression: ${expr}`, e);
                return `[${expr}]`;
            }
        });
    }

    evaluateExpression(expr) {
        const dateMatch = expr.match(/now\(\)\.strftime\(['"](.+?)['"]\)/);
        if (dateMatch) {
            const pythonFormat = dateMatch[1];
            return this.formatDatePythonStyle(new Date(), pythonFormat);
        }

        if (expr === 'user') {
            return this.hass?.user?.name || 'unknown';
        }

        const statesMatch = expr.match(/states\(['"](.+?)['"]\)/);
        if (statesMatch) {
            const entityId = statesMatch[1];
            const state = this.hass?.states?.[entityId];
            return state?.state || 'unavailable';
        }

        const stateAttrMatch = expr.match(/state_attr\(['"](.+?)['"],\s*['"](.+?)['"]\)/);
        if (stateAttrMatch) {
            const entityId = stateAttrMatch[1];
            const attrName = stateAttrMatch[2];
            const state = this.hass?.states?.[entityId];
            return state?.attributes?.[attrName] || '';
        }

        throw new Error(`Unsupported expression: ${expr}`);
    }

    formatDatePythonStyle(date, pythonFormat) {
        let dateFormatMask = pythonFormat
            .replace(/%d/g, 'dd')
            .replace(/%m/g, 'mm')
            .replace(/%Y/g, 'yyyy')
            .replace(/%H/g, 'HH')
            .replace(/%M/g, 'MM')
            .replace(/%S/g, 'ss')
            .replace(/%B/g, 'mmmm')
            .replace(/%b/g, 'mmm')
            .replace(/%A/g, 'dddd')
            .replace(/%a/g, 'ddd')
            .replace(/%I/g, 'hh')
            .replace(/%p/g, 'TT');

        return dateFormat(date, dateFormatMask);
    }

    // Get priority color based on Todoist priority (4=p1 red, 3=p2 orange, 2=p3 blue, 1=p4 default)
    getPriorityColor(priority) {
        // Todoist API: priority 4 = P1 (highest), 1 = P4 (lowest/default)
        switch(priority) {
            case 4: return '#d1453b'; // P1 - Red
            case 3: return '#eb8909'; // P2 - Orange
            case 2: return '#246fe0'; // P3 - Blue
            default: return null;     // P4 - Default (no color)
        }
    }

    // Get priority class
    getPriorityClass(priority) {
        switch(priority) {
            case 4: return 'priority-1';
            case 3: return 'priority-2';
            case 2: return 'priority-3';
            default: return 'priority-4';
        }
    }

    // Count completed subtasks (for progress indicator)
    getSubtaskProgress(item) {
        if (!item.children || item.children.length === 0) return null;
        // All children in tree are uncompleted (API doesn't return completed)
        // So we show 0/total - but we can track completions in session
        const total = item.children.length;
        const completed = item.completedChildren || 0;
        return { completed, total };
    }

    // Render a single task item with optional nesting
    renderTaskItem(item, icons, label_colors, cardLabels, depth = 0) {
        const hasChildren = item.children && item.children.length > 0;
        const showSubtasks = this.myConfig.show_subtasks !== false;
        const isSubtask = depth > 0;
        // Fix: collapse_subtasks true = start collapsed, need to expand manually
        // collapse_subtasks false/undefined = start expanded
        const isExpanded = this.myConfig.collapse_subtasks
            ? this.expandedItems.has(item.id)
            : !this.collapsedItems?.has(item.id);

        // Determine if delete button should show (only on parent tasks unless configured otherwise)
        const showDeleteOnSubtasks = this.myConfig.show_delete_on_subtasks === true;
        const showDelete = ((this.myConfig.show_item_delete === undefined) || (this.myConfig.show_item_delete !== false))
            && (!isSubtask || showDeleteOnSubtasks);

        // Priority color
        const priorityColor = this.getPriorityColor(item.priority);
        const priorityClass = this.getPriorityClass(item.priority);

        // Subtask progress
        const progress = this.getSubtaskProgress(item);

        return html`
            <div class="todoist-item ${isSubtask ? 'subtask' : 'parent-task'} ${hasChildren ? 'has-children' : ''} ${priorityClass}"
                 .id=${"item_" + item.id}>
                ${/* Checkbox/complete button with priority color */''}
                ${(this.myConfig.show_item_close === undefined) || (this.myConfig.show_item_close !== false)
                    ? html`<ha-icon-button
                            class="todoist-item-close ${isSubtask ? 'subtask-checkbox' : ''} ${priorityClass}"
                            @pointerdown=${(e) => this._lpStart(item, "longpress_close")}
                            @pointerup=${(e) => this._lpEnd(item, "close", "dbl_close")}
                            @pointercancel=${this._lpCancel}
                            @pointerleave=${this._lpCancel} >
                            <ha-icon
                                .icon=${isSubtask ? "mdi:checkbox-blank-circle-outline" : "mdi:checkbox-blank-circle-outline"}
                                style="color:${priorityColor || (isSubtask ? 'var(--secondary-text-color)' : 'var(--secondary-text-color)')}"
                            ></ha-icon>
                        </ha-icon-button>`
                    : html``
                }
                ${/* Expand/collapse button for parent tasks with children */''}
                ${hasChildren && showSubtasks
                    ? html`<ha-icon-button
                            class="todoist-item-expand"
                            @click=${() => this.toggleSubtasks(item.id)}>
                            <ha-icon .icon=${isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}></ha-icon>
                        </ha-icon-button>`
                    : html``
                }
                ${/* Task content */''}
                <div class="todoist-item-text">
                    <div class="todoist-item-content-wrapper"
                        @click=${(e) => { e.stopPropagation(); this.openTaskDetail(item, this._allItems); }}
                        style="cursor: pointer;"
                    >
                        <span class="todoist-item-content ${isSubtask ? 'subtask-content' : ''}">${item.content}</span>
                    </div>
                    ${/* Description */''}
                    ${((this.myConfig.show_item_description === undefined) || (this.myConfig.show_item_description !== false)) && item.description
                        ? html`<div class="todoist-item-description">${item.description}</div>`
                        : html``}
                    ${/* Metadata row: progress, due date, labels */''}
                    <div class="todoist-item-meta">
                        ${/* Subtask progress indicator */''}
                        ${progress && hasChildren
                            ? html`<span class="todoist-progress">
                                <ha-icon .icon=${"mdi:source-branch"} style="--mdc-icon-size: 14px;"></ha-icon>
                                ${progress.completed}/${progress.total}
                              </span>`
                            : html``}
                        ${/* Due date */''}
                        ${this.myConfig.show_dates && item.due
                            ? html`<span class="todoist-due-badge ${this.getDueDateClass(item.due.date)}">
                                <ha-icon .icon=${"mdi:calendar"} style="--mdc-icon-size: 12px;"></ha-icon>
                                ${this.formatDueDate(item.due.date)}
                              </span>`
                            : html``}
                        ${/* Labels/tags */''}
                        ${item.labels && item.labels.length > 0 && this.myConfig.show_item_labels !== false
                            ? item.labels.filter(l => !l.startsWith("_")).map(label => html`
                                <span class="todoist-label">
                                    <ha-icon .icon=${"mdi:tag"} style="--mdc-icon-size: 12px;"></ha-icon>
                                    ${label}
                                </span>
                              `)
                            : html``}
                    </div>
                </div>
                ${/* Delete button - only on parent tasks by default */''}
                ${showDelete
                    ? html`<ha-icon-button
                        class="todoist-item-delete"
                        @pointerdown=${(e) => this._lpStart(item, "longpress_delete")}
                        @pointerup=${(e) => this._lpEnd(item, "delete", "dbl_delete")}
                        @pointercancel=${this._lpCancel}
                        @pointerleave=${this._lpCancel} >
                        <ha-icon
                            .icon=${"mdi:" + icons[3].name}
                            style=${icons[3].color ? `color:${icons[3].color};` : ""}
                        ></ha-icon>
                    </ha-icon-button>`
                    : html``}
            </div>
            ${/* Render children if expanded */''}
            ${hasChildren && showSubtasks && isExpanded
                ? html`<div class="todoist-subtask-container">${item.children.map(child => this.renderTaskItem(child, icons, label_colors, cardLabels, depth + 1))}</div>`
                : html``}
        `;
    }

    // Get CSS class for due date based on urgency
    getDueDateClass(dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDateOnly = new Date(dueDate);
        dueDateOnly.setHours(0, 0, 0, 0);
        const diffDays = Math.round((dueDateOnly - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'overdue';
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'tomorrow';
        return 'future';
    }

    render() {
        if (this.hass === undefined) {
            return html`Home Assistant is restarting. Please wait a few seconds...`;
        }
        let state = this.hass.states[this.config.entity] || undefined;
        if (state?.attributes === undefined) {
            return html`Todoist V2 sensors don't have any data yet. Please wait a few seconds and refresh. [todoist sensor] `;
        }
        var label_colors = this.hass.states["sensor.label_colors"];
        label_colors = label_colors?.attributes?.label_colors;
        if (!label_colors) {
            // Create empty array if no label_colors sensor
            label_colors = [];
        }

        this.myConfig = this.parseConfig(this.config);

        var rawIcons = (this.config.icons && this.config.icons.length >= 4)
            ? this.config.icons
            : [
                "checkbox-marked-circle-outline:green",
                "circle-medium",
                "plus-outline:blue",
                "trash-can-outline:red",
                "checkbox-marked-circle-outline",
                "checkbox-blank-circle-outline"
            ];

        var icons = rawIcons.map(str => {
            const [name, color] = str.split(":");
            return { name, color: color || "" };
        });
        let items = state.attributes.tasks || [];

        items = this.filterDates(items);
        items = this.filterPriority(items);

        // filter by section
        let section_name2id = [];
        if (!this.myConfig.filter_section_id && this.myConfig.filter_section) {
            state.attributes?.sections.map(s => {
                section_name2id[s.name] = s.id;
            });
        }
        let section_id = this.myConfig.filter_section_id || section_name2id[this.myConfig.filter_section] || undefined;
        if (section_id) {
            items = items.filter(item => {
                return item.section_id === section_id;
            });
        }

        var cardLabels = [];
        items = items.filter(item => this.assessLabelCriteriaForItem.call(this, item, this.myConfig?.filter_labels, true, cardLabels));

        items = items.map(item => ({
            ...item,
            statusFromLabelCriteria: this.assessLabelCriteriaForItem.call(this, item, this.myConfig?.status_from_labels, false, [])
        }));

        // Build task tree for hierarchy
        const showSubtasks = this.myConfig.show_subtasks !== false;
        let taskTree = showSubtasks ? this.buildTaskTree(items) : items.map(i => ({ ...i, children: [] }));

        // Store items for popup access
        this._allItems = items;

        let cardName = this.myConfig.filter_section || "ToDoist";
        try { cardName = state.attributes.sections.find(s => { return s.id === section_id }).name } catch (error) { }
        cardName = this.myConfig.friendly_name || cardName;

        this.generateStyles();

        const topMarkdown = this.renderTemplate(this.config.markdown_top_content);
        const bottomMarkdown = this.renderTemplate(this.config.markdown_bottom_content);

        let rendered = html`<ha-card class="${this.myConfig.accent ? 'left-accent' : ''}">
            ${(this.myConfig.show_header === undefined) || (this.myConfig.show_header !== false)
                ? html`<h1 class="card-header">
                    <div class="name">${cardName}
                    ${(this.myConfig.show_card_labels === undefined) || (this.myConfig.show_card_labels !== false)
                        ? html`${this.renderLabels(undefined, (cardLabels.length == 1 ? cardLabels : []), [], label_colors)}`
                        : html``
                    }
                    </div>
                    </h1>
                    <div id="todoist-toast">${this.toastText}</div>`
                : html``}
            ${this.config.markdown_top_content ? html`<div class="top-markdown" .innerHTML=${topMarkdown}></div>` : ''}
            <div class="list-container">
            <div class="left-accentpgr"></div>
                <div class="todoist-list">
                ${taskTree.length
                ? taskTree.map(item => this.renderTaskItem(item, icons, label_colors, cardLabels, 0))
                : html`<div class="todoist-list-empty">Geen openstaande taken!</div>`}
                ${this.renderLowerPart(icons)}
                </div>
            </div>
            ${this.config.markdown_bottom_content ? html`<div class="bottom-markdown" .innerHTML=${bottomMarkdown}></div>` : ''}
            ${this.renderFooter()}
            </ha-card>
            ${this.selectedTask ? this.renderTaskDetailPopup() : ''}`;
        return rendered;
    }

    // Render the task detail popup
    renderTaskDetailPopup() {
        const task = this.selectedTask;
        if (!task) return html``;

        const allTasks = this._allItems || [];
        const priorityColor = this.getPriorityColor(task.priority);
        const priorityLabel = this.getPriorityLabel(task.priority);
        const children = allTasks.filter(t => t.parent_id === task.id);
        const completedChildren = 0; // Would need completed data

        // Get all available labels from sensor
        const labelColorsData = this.hass.states["sensor.label_colors"]?.attributes?.label_colors || [];
        const availableLabels = labelColorsData.map(l => l.name).filter(l => !l.startsWith("_") && !l.endsWith("_outline"));

        return html`
            <div class="task-detail-overlay" @click=${(e) => this.handleBackdropClick(e)}>
                <div class="task-detail-popup">
                    <div class="task-detail-header">
                        <ha-icon-button class="task-detail-close" @click=${() => this.closeTaskDetail()}>
                            <ha-icon icon="mdi:close"></ha-icon>
                        </ha-icon-button>
                        <div class="task-detail-actions">
                            <ha-icon-button @click=${() => this.itemAction(task, 'close')}>
                                <ha-icon icon="mdi:check" style="color: var(--success-color, #4CAF50)"></ha-icon>
                            </ha-icon-button>
                        </div>
                    </div>

                    <div class="task-detail-content">
                        ${/* Title section */''}
                        <div class="task-detail-title-section">
                            <div class="task-detail-checkbox" style="border-color: ${priorityColor || 'var(--divider-color)'}">
                                ${task.priority > 1 ? html`<div class="priority-dot" style="background: ${priorityColor}"></div>` : ''}
                            </div>
                            ${this.editingTitle
                                ? html`<input
                                    class="task-detail-title-input"
                                    type="text"
                                    .value=${task.content}
                                    @blur=${(e) => this.saveTitle(task, e.target.value)}
                                    @keydown=${(e) => { if (e.key === 'Enter') this.saveTitle(task, e.target.value); if (e.key === 'Escape') { this.editingTitle = false; this.requestUpdate(); }}}
                                />`
                                : html`<h2 class="task-detail-title" @click=${() => this.startEditTitle()}>${task.content}</h2>`
                            }
                        </div>

                        ${/* Description section */''}
                        <div class="task-detail-section">
                            <div class="task-detail-section-header">
                                <ha-icon icon="mdi:text"></ha-icon>
                                <span>Beschrijving</span>
                            </div>
                            ${this.editingDescription
                                ? html`<textarea
                                    class="task-detail-description-input"
                                    .value=${task.description || ''}
                                    placeholder="Voeg een beschrijving toe..."
                                    @blur=${(e) => this.saveDescription(task, e.target.value)}
                                    @keydown=${(e) => { if (e.key === 'Escape') { this.editingDescription = false; this.requestUpdate(); }}}
                                ></textarea>`
                                : html`<div class="task-detail-description" @click=${() => this.startEditDescription()}>
                                    ${task.description || html`<span class="placeholder">Voeg een beschrijving toe...</span>`}
                                </div>`
                            }
                        </div>

                        ${/* Subtasks section */''}
                        <div class="task-detail-section">
                            <div class="task-detail-section-header">
                                <ha-icon icon="mdi:source-branch"></ha-icon>
                                <span>Subtaken</span>
                                <span class="subtask-count">${completedChildren}/${children.length}</span>
                            </div>
                            <div class="task-detail-subtasks">
                                ${children.length > 0
                                    ? children.map(child => html`
                                        <div class="subtask-item">
                                            <ha-icon-button class="subtask-checkbox" @click=${() => this.itemAction(child, 'close')}>
                                                <ha-icon icon="mdi:checkbox-blank-circle-outline"></ha-icon>
                                            </ha-icon-button>
                                            <span class="subtask-content">${child.content}</span>
                                        </div>
                                    `)
                                    : html`<div class="no-subtasks">Geen subtaken</div>`
                                }
                                <button class="add-subtask-btn" @click=${() => this.addSubtask(task)}>
                                    <ha-icon icon="mdi:plus"></ha-icon>
                                    Subtaak toevoegen
                                </button>
                            </div>
                        </div>

                        ${/* Properties section */''}
                        <div class="task-detail-properties">
                            ${/* Due date with recurring indicator */''}
                            <div class="task-detail-property" @click=${() => { this.showDatePicker = !this.showDatePicker; this.requestUpdate(); }}>
                                <ha-icon icon="${this.isRecurring(task) ? 'mdi:calendar-sync' : 'mdi:calendar'}"></ha-icon>
                                <span class="property-label">Datum</span>
                                <span class="property-value ${task.due ? this.getDueDateClass(task.due.date) : ''}">
                                    ${task.due ? this.formatDueDate(task.due.date) : 'Geen datum'}
                                    ${this.isRecurring(task) ? html`<span class="recurring-badge">↻</span>` : ''}
                                </span>
                            </div>
                            ${this.showDatePicker ? html`
                                <div class="date-picker-dropdown">
                                    <input type="date"
                                        .value=${task.due?.date || ''}
                                        @change=${(e) => this.setDueDate(task, e.target.value)}
                                    />
                                    <div class="date-quick-options">
                                        <button @click=${() => this.setDueDate(task, new Date().toISOString().split('T')[0])}>Vandaag</button>
                                        <button @click=${() => { const d = new Date(); d.setDate(d.getDate() + 1); this.setDueDate(task, d.toISOString().split('T')[0]); }}>Morgen</button>
                                        <button @click=${() => this.setDueDate(task, null)}>Verwijder</button>
                                    </div>
                                </div>
                            ` : ''}

                            ${/* Duration */''}
                            <div class="task-detail-property" @click=${() => { this.showDurationPicker = !this.showDurationPicker; this.requestUpdate(); }}>
                                <ha-icon icon="mdi:clock-outline"></ha-icon>
                                <span class="property-label">Duur</span>
                                <span class="property-value">
                                    ${task.duration ? this.formatDuration(task.duration) : 'Geen duur'}
                                </span>
                            </div>
                            ${this.showDurationPicker ? html`
                                <div class="duration-picker-dropdown">
                                    <div class="duration-options">
                                        <button @click=${() => this.setDuration(task, 15)}>15m</button>
                                        <button @click=${() => this.setDuration(task, 30)}>30m</button>
                                        <button @click=${() => this.setDuration(task, 45)}>45m</button>
                                        <button @click=${() => this.setDuration(task, 60)}>1u</button>
                                        <button @click=${() => this.setDuration(task, 90)}>1u30</button>
                                        <button @click=${() => this.setDuration(task, 120)}>2u</button>
                                        <button @click=${() => this.setDuration(task, 180)}>3u</button>
                                        <button class="duration-clear" @click=${() => this.setDuration(task, null)}>Verwijder</button>
                                    </div>
                                </div>
                            ` : ''}

                            ${/* Priority */''}
                            <div class="task-detail-property" @click=${() => { this.showPriorityPicker = !this.showPriorityPicker; this.requestUpdate(); }}>
                                <ha-icon icon="mdi:flag" style="color: ${priorityColor || 'var(--secondary-text-color)'}"></ha-icon>
                                <span class="property-label">Prioriteit</span>
                                <span class="property-value" style="color: ${priorityColor || 'inherit'}">${priorityLabel}</span>
                            </div>
                            ${this.showPriorityPicker ? html`
                                <div class="priority-picker-dropdown">
                                    <button class="priority-option p1" @click=${() => this.setPriority(task, 4)}>
                                        <ha-icon icon="mdi:flag" style="color: #d1453b"></ha-icon> P1
                                    </button>
                                    <button class="priority-option p2" @click=${() => this.setPriority(task, 3)}>
                                        <ha-icon icon="mdi:flag" style="color: #eb8909"></ha-icon> P2
                                    </button>
                                    <button class="priority-option p3" @click=${() => this.setPriority(task, 2)}>
                                        <ha-icon icon="mdi:flag" style="color: #246fe0"></ha-icon> P3
                                    </button>
                                    <button class="priority-option p4" @click=${() => this.setPriority(task, 1)}>
                                        <ha-icon icon="mdi:flag-outline"></ha-icon> P4
                                    </button>
                                </div>
                            ` : ''}

                            ${/* Labels */''}
                            <div class="task-detail-property" @click=${() => { this.showLabelPicker = !this.showLabelPicker; this.requestUpdate(); }}>
                                <ha-icon icon="mdi:tag-multiple"></ha-icon>
                                <span class="property-label">Labels</span>
                                <span class="property-value">
                                    ${task.labels && task.labels.length > 0
                                        ? task.labels.filter(l => !l.startsWith("_")).join(', ')
                                        : 'Geen labels'}
                                </span>
                            </div>
                            ${this.showLabelPicker ? html`
                                <div class="label-picker-dropdown">
                                    ${availableLabels.length > 0
                                        ? availableLabels.map(label => html`
                                            <label class="label-option">
                                                <input type="checkbox"
                                                    .checked=${task.labels?.includes(label)}
                                                    @change=${() => this.toggleLabel(task, label)}
                                                />
                                                <span>${label}</span>
                                            </label>
                                        `)
                                        : html`<div class="no-labels">Geen labels beschikbaar</div>`
                                    }
                                </div>
                            ` : ''}
                        </div>

                        ${/* Comments section */''}
                        <div class="task-detail-section">
                            <div class="task-detail-section-header">
                                <ha-icon icon="mdi:comment-multiple-outline"></ha-icon>
                                <span>Opmerkingen</span>
                                <span class="comment-count">${task._comments?.length || 0}</span>
                            </div>
                            <div class="task-detail-comments">
                                ${task._comments && task._comments.length > 0
                                    ? task._comments.map(comment => html`
                                        <div class="comment-item">
                                            <div class="comment-content">${comment.content}</div>
                                            <div class="comment-date">${this.formatCommentDate(comment.posted_at)}</div>
                                        </div>
                                    `)
                                    : html`<div class="no-comments">Geen opmerkingen</div>`
                                }
                                ${this.showCommentInput
                                    ? html`
                                        <div class="comment-input-wrapper">
                                            <textarea
                                                class="comment-input"
                                                placeholder="Schrijf een opmerking..."
                                                @keydown=${(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        if (e.target.value.trim()) {
                                                            this.addComment(task.id, e.target.value.trim());
                                                            e.target.value = '';
                                                            this.showCommentInput = false;
                                                        }
                                                    }
                                                }}
                                            ></textarea>
                                            <div class="comment-input-hint">Enter om te versturen</div>
                                        </div>
                                    `
                                    : html`
                                        <button class="add-comment-btn" @click=${() => { this.showCommentInput = true; this.requestUpdate(); }}>
                                            <ha-icon icon="mdi:plus"></ha-icon>
                                            Opmerking toevoegen
                                        </button>
                                    `
                                }
                            </div>
                        </div>
                    </div>

                    <div class="task-detail-footer">
                        <button class="delete-task-btn" @click=${() => { this.itemAction(task, 'delete'); this.closeTaskDetail(); }}>
                            <ha-icon icon="mdi:trash-can-outline"></ha-icon>
                            Verwijderen
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    generateStyles() {
        var style = document.createElement('style');
        style.id = 'customTodoistV2Style';
        let customStyle = this.myConfig.style || '';

        try { this.shadowRoot.getElementById(style.id).remove(); } catch (error) { }

        if (this.myConfig.accent) {
            const accentColor = this.myConfig.accent;
            // Parse hex color to RGB for background
            const hex = accentColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);

            const accentStyle = `
                ha-card {
                    border-left: 4px solid ${accentColor} !important;
                    background: linear-gradient(90deg, rgba(${r}, ${g}, ${b}, 0.08) 0%, transparent 30%) !important;
                }
                .card-header {
                    color: ${accentColor};
                }
                .todoist-item-add:focus {
                    border-color: ${accentColor} !important;
                }
            `;
            customStyle = customStyle + accentStyle;
        }

        if (customStyle) {
            style.innerHTML = customStyle;
            this.shadowRoot.appendChild(style);
        }
    }

    generateExtraLabels(labels, label_colors) {
        if (label_colors === undefined) return [];
        var extraLabels = [];
        if (this.myConfig.extra_labels) {
            this.myConfig.extra_labels.forEach(l => {
                let parts = l.split(/[:+]/).map(s => s.trim());
                let firstPart = parts[0];
                let filteredParts = [];
                let mainParts = l.split(":").map(s => s.trim());
                let plusCount = (mainParts.length > 1) ? (mainParts[1].match(/\+/g) || []).length + 1 : 0;
                for (let i = 1; i < parts.length; i++) {
                    if (labels.includes(parts[i])) {
                        filteredParts.push(parts[i]);
                    }
                }

                if (mainParts.length > 1 && mainParts[1].startsWith("+")) {
                    filteredParts = (filteredParts.length > 0) ? [filteredParts.length] : [];
                }
                if ((filteredParts.length > 0) ||
                    (!l.includes(':'))) {
                    let outlineLabel = label_colors.filter(lc => lc.name === firstPart + '_outline');
                    let theColor = (label_colors.find(lc => lc.name === firstPart)?.color || "blue");
                    if (outlineLabel.length > 0) {
                        theColor = outlineLabel[0].color;
                    }
                    let finalLabel = firstPart + ": " + filteredParts.join("+") + (outlineLabel.length > 0 ? '_outline' : '');
                    extraLabels.push(finalLabel);
                    if (!label_colors.some(item => item.name === finalLabel))
                        label_colors.push({ name: finalLabel, color: theColor });
                }
            });
        }
        return extraLabels;
    }

    renderLabels(item, date, labels, exclusions, label_colors) {
        var extraLabels = this.generateExtraLabels(labels, label_colors);
        labels = [date, ...labels, ...extraLabels].filter(String);
        if ((item !== undefined) && (this.config.show_item_labels === false)) {
            labels = this.myConfig.show_dates && item.due ? [date, ...extraLabels] : [...extraLabels];
        }

        let rendered = html`
            ${(labels.length - (exclusions?.length ?? 0) > 0)
                ? html`<div class="labelsDiv"><ul class="labels">${labels.map(label => {
                    if (exclusions.includes(label)) return html``;
                    let isOutline = label.endsWith('_outline');
                    let displayLabel = isOutline ? label.slice(0, -8) : label;
                    let filteredColors = label_colors.filter(lc => lc.name === label);
                    let colorKey = filteredColors.length
                        ? filteredColors[0].color
                        : "var(--primary-background-color)";
                    let color = todoistColors[colorKey] || colorKey;
                    let style = isOutline
                        ? `border: 2px solid ${color}; background: transparent; color: ${color};`
                        : `background-color: ${color}; ${label[0] == "\ud83d" ? "color: var(--primary-text-color);" : ""}`;
                    return html`<li
                    class=${extraLabels.includes(label) ? "extraLabel" : ""}
                    .style=${style}
                    @pointerdown=${(e) => this._lpStart(item, "longpress_label")}
                    @pointerup=${(e) => this._lpEnd(item, "label", "dbl_label")}
                    @pointercancel=${this._lpCancel}
                    @pointerleave=${this._lpCancel}
                    >
                    <span>${displayLabel}</span></li>`;
                })}</ul></div>`
                : html``}
        `;
        return rendered;
    }

    renderLowerPart(icons) {
        let rendered = html`
        ${this.myConfig.show_completed && this.itemsJustCompleted
                ? this.itemsJustCompleted.map(item => {
                    return html`<div class="todoist-item todoist-item-completed">
                        ${(this.myConfig.show_item_close === undefined) || (this.myConfig.show_item_close !== false)
                            ? html`<ha-icon-button
                                class="todoist-item-close"
                                 @pointerdown=${(e) => this._lpStart(item, "longpress_uncomplete")}
                                @pointerup=${(e) => this._lpEnd(item, "uncomplete", "dbl_uncomplete")}
                                @pointercancel=${this._lpCancel}
                                @pointerleave=${this._lpCancel} >
                                <ha-icon
                                    .icon=${"mdi:" + icons[2].name}
                                    style=${icons[2].color ? `color:${icons[2].color};` : ""}
                                ></ha-icon>
                                </ha-icon-button>`
                            : html`<ha-icon
                                        .icon=${"mdi:" + icons[0].name}
                                        style=${icons[0].color ? `color:${icons[0].color};` : ""}
                                    ></ha-icon>`
                        }
                        <div class="todoist-item-text">
                            ${item.description
                            ? html`<span class="todoist-item-content">${item.content}</span>
                                    <span class="todoist-item-description">${item.description}</span>`
                            : item.content}
                        </div>
                        ${(this.myConfig.show_item_delete === undefined) || (this.myConfig.show_item_delete !== false)
                            ? html`<ha-icon-button
                                class="todoist-item-delete"
                                @pointerdown=${(e) => this._lpStart(item, "longpress_unlist_completed")}
                                @pointerup=${(e) => this._lpEnd(item, "unlist_completed", "dbl_unlist_completed")}
                                @pointercancel=${this._lpCancel}
                                @pointerleave=${this._lpCancel}
                                >
                                <ha-icon
                                    .icon=${"mdi:" + icons[3].name}
                                    style=${icons[3].color ? `color:${icons[3].color};` : ""}
                                ></ha-icon>
                            </ha-icon-button>`
                            : html``}
                    </div>`;
                })
                : html``}
        `;
        return rendered;
    }

    renderFooter() {
        let rendered = html`
            ${(this.myConfig.show_item_add === undefined) || (this.myConfig.show_item_add !== false)
                ? html`
                    <div class="todoist-footer">
                        <button class="new-task-btn" @click=${() => this.addNewTask()}>
                            <ha-icon icon="mdi:plus-circle"></ha-icon>
                            <span>Nieuwe taak</span>
                        </button>
                    </div>
                `
                : html``}
        `;
        if (this.myConfig.error) {
            this.showToast(this.myConfig.error, 15000, 3000);
            delete this.myConfig.error;
        }
        return rendered;
    }

    static get styles() {
        return css`
            /* ===== CARD HEADER ===== */
            .card-header {
                padding-bottom: 8px;
            }

            /* ===== LIST CONTAINER ===== */
            .todoist-list {
                display: flex;
                padding: 8px 16px 16px;
                flex-direction: column;
                flex: 1;
                gap: 4px;
            }

            .list-container {
                display: flex;
            }

            .left-accentpgr {
                width: 0px;
                background-color: #ff0000;
                border-radius: 3px;
                margin-right: 1px;
            }

            .todoist-list-empty {
                padding: 24px;
                text-align: center;
                font-size: 16px;
                opacity: 0.6;
            }

            /* ===== TASK ITEMS ===== */
            .todoist-item {
                display: flex;
                flex-direction: row;
                align-items: flex-start;
                padding: 4px 0;
                min-height: 36px;
            }

            /* Parent task styling - more prominent */
            .todoist-item.parent-task {
                padding: 8px 0;
                border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.1));
            }

            .todoist-item.parent-task:last-child {
                border-bottom: none;
            }

            /* Has children = collapsible parent */
            .todoist-item.has-children {
                padding-bottom: 4px;
            }

            /* Subtask styling - smaller and indented */
            .todoist-item.subtask {
                padding: 2px 0 2px 8px;
                border-bottom: none;
            }

            /* Subtask container with visual indent */
            .todoist-subtask-container {
                margin-left: 32px;
                padding-left: 12px;
                border-left: 2px solid var(--divider-color, rgba(255,255,255,0.15));
                margin-bottom: 8px;
            }

            .todoist-item-completed {
                color: #808080;
            }

            /* ===== ITEM TEXT AREA ===== */
            .todoist-item-text {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 2px;
            }

            .todoist-item-content-wrapper {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 8px;
            }

            .todoist-item-content {
                font-size: 15px;
                font-weight: 500;
                line-height: 1.4;
            }

            /* Subtask content - smaller */
            .todoist-item-content.subtask-content {
                font-size: 14px;
                font-weight: 400;
                opacity: 0.9;
            }

            .todoist-item-description {
                font-size: 12px;
                opacity: 0.6;
                line-height: 1.3;
                margin-top: 2px;
            }

            /* ===== METADATA ROW ===== */
            .todoist-item-meta {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px;
                margin-top: 4px;
                font-size: 12px;
            }

            .todoist-item-meta:empty {
                display: none;
            }

            /* ===== SUBTASK PROGRESS ===== */
            .todoist-progress {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                color: var(--secondary-text-color);
                opacity: 0.8;
            }

            .todoist-progress ha-icon {
                color: var(--secondary-text-color);
            }

            /* ===== DUE DATE BADGES ===== */
            .todoist-due-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 11px;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: 500;
                white-space: nowrap;
            }

            .todoist-due-badge.overdue {
                background: rgba(209, 69, 59, 0.15);
                color: #d1453b;
            }

            .todoist-due-badge.today {
                background: rgba(235, 137, 9, 0.15);
                color: #eb8909;
            }

            .todoist-due-badge.tomorrow {
                background: rgba(36, 111, 224, 0.15);
                color: #246fe0;
            }

            .todoist-due-badge.future {
                background: var(--secondary-background-color, rgba(255,255,255,0.08));
                color: var(--secondary-text-color);
            }

            /* ===== LABELS/TAGS ===== */
            .todoist-label {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 11px;
                padding: 2px 8px;
                border-radius: 4px;
                background: var(--secondary-background-color, rgba(255,255,255,0.08));
                color: var(--secondary-text-color);
            }

            /* ===== PRIORITY COLORS ===== */
            .todoist-item-close.priority-1 ha-icon {
                color: #d1453b !important;
            }

            .todoist-item-close.priority-2 ha-icon {
                color: #eb8909 !important;
            }

            .todoist-item-close.priority-3 ha-icon {
                color: #246fe0 !important;
            }

            .todoist-item.priority-1 .todoist-item-content {
                color: #d1453b;
            }

            .todoist-item.priority-2 .todoist-item-content {
                color: #eb8909;
            }

            /* ===== BUTTONS ===== */
            .todoist-item-close {
                --mdc-icon-button-size: 36px;
                color: #4caf50;
            }

            .todoist-item-close.subtask-checkbox {
                --mdc-icon-button-size: 32px;
            }

            .todoist-item-close ha-icon {
                --mdc-icon-size: 22px;
            }

            .todoist-item-close.subtask-checkbox ha-icon {
                --mdc-icon-size: 18px;
            }

            .todoist-item-completed .todoist-item-close {
                color: #808080;
            }

            .todoist-item-expand {
                --mdc-icon-button-size: 32px;
                color: var(--secondary-text-color);
                margin-left: -8px;
                margin-right: -4px;
            }

            .todoist-item-expand ha-icon {
                --mdc-icon-size: 20px;
            }

            .todoist-item-delete {
                --mdc-icon-button-size: 32px;
                margin-left: auto;
                opacity: 0.4;
                transition: opacity 0.2s;
            }

            .todoist-item:hover .todoist-item-delete {
                opacity: 0.8;
            }

            .todoist-item-delete ha-icon {
                --mdc-icon-size: 18px;
                color: var(--error-color, #f44336);
            }

            .todoist-item-completed .todoist-item-delete {
                color: #808080;
            }

            /* ===== SUBTASK COUNT ===== */
            .todoist-subtask-count {
                font-size: 11px;
                opacity: 0.6;
                background: var(--secondary-background-color, rgba(255,255,255,0.1));
                padding: 2px 8px;
                border-radius: 10px;
                margin-top: 4px;
                display: inline-block;
            }

            /* ===== ADD TASK INPUT ===== */
            .todoist-item-add {
                width: calc(100% - 32px);
                height: 40px;
                margin: 8px 16px 16px;
                padding: 8px 12px;
                box-sizing: border-box;
                border-radius: 8px;
                font-size: 14px;
                border: 1px solid var(--divider-color, rgba(255,255,255,0.2));
                background: var(--card-background-color, transparent);
                color: var(--primary-text-color);
            }

            .todoist-item-add:focus {
                outline: none;
                border-color: var(--primary-color);
            }

            .todoist-item-add::placeholder {
                opacity: 0.5;
            }

            /* ===== LABELS ===== */
            .labelsDiv {
                display: inline-flex;
                margin-top: 4px;
            }

            ul.labels {
                font-weight: 100;
                line-height: 13px;
                padding: 0;
                margin: 0;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
            }

            ul.labels li {
                display: inline-flex;
                align-items: center;
                color: #CCCCCC;
                height: 18px;
                border-radius: 4px;
                margin: 0;
            }

            ul.labels li span {
                font-size: 10px;
                font-weight: 500;
                white-space: nowrap;
                padding: 0 6px;
            }

            /* ===== TOAST ===== */
            #todoist-toast {
                position: relative;
                bottom: 20px;
                left: 40%;
                transform: translateX(-50%);
                background-color: #333;
                color: #fff;
                padding: 10px 20px;
                border-radius: 14px;
                border: 1px solid red;
                z-index: 1;
                display: none;
                text-align: center;
                margin: 15px 35px -30px 45px;
            }

            /* ===== MARKDOWN CONTENT ===== */
            .top-markdown {
                padding: 0 16px 16px 16px !important;
                font-size: 14px;
                line-height: 1.4;
                user-select: text;
            }

            .bottom-markdown {
                padding: 16px 16px 0 16px !important;
                font-size: 14px;
                line-height: 1.4;
                user-select: text;
            }

            /* ===== SPECIAL STATES ===== */
            .todoist-special {
                font-weight: bolder;
                color: green;
            }

            /* ===== TASK DETAIL POPUP ===== */
            .task-detail-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                padding: 16px;
                box-sizing: border-box;
            }

            .task-detail-popup {
                background: var(--card-background-color, #1e1e1e);
                border-radius: 16px;
                max-width: 500px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                display: flex;
                flex-direction: column;
            }

            .task-detail-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.1));
            }

            .task-detail-close {
                --mdc-icon-button-size: 40px;
            }

            .task-detail-actions {
                display: flex;
                gap: 8px;
            }

            .task-detail-content {
                padding: 16px;
                flex: 1;
            }

            /* Title section */
            .task-detail-title-section {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 20px;
            }

            .task-detail-checkbox {
                width: 24px;
                height: 24px;
                border: 2px solid var(--divider-color);
                border-radius: 50%;
                flex-shrink: 0;
                margin-top: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .priority-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }

            .task-detail-title {
                font-size: 20px;
                font-weight: 600;
                margin: 0;
                flex: 1;
                cursor: text;
                padding: 4px 0;
            }

            .task-detail-title:hover {
                background: var(--secondary-background-color, rgba(255,255,255,0.05));
                border-radius: 4px;
            }

            .task-detail-title-input {
                font-size: 20px;
                font-weight: 600;
                width: 100%;
                border: none;
                background: var(--secondary-background-color, rgba(255,255,255,0.1));
                color: var(--primary-text-color);
                padding: 8px;
                border-radius: 4px;
                outline: none;
            }

            /* Sections */
            .task-detail-section {
                margin-bottom: 20px;
            }

            .task-detail-section-header {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                font-weight: 500;
                color: var(--secondary-text-color);
                margin-bottom: 8px;
            }

            .task-detail-section-header ha-icon {
                --mdc-icon-size: 18px;
            }

            .subtask-count {
                margin-left: auto;
                font-size: 12px;
                opacity: 0.7;
            }

            /* Description */
            .task-detail-description {
                font-size: 14px;
                line-height: 1.5;
                padding: 8px 12px;
                background: var(--secondary-background-color, rgba(255,255,255,0.05));
                border-radius: 8px;
                min-height: 60px;
                cursor: text;
            }

            .task-detail-description .placeholder {
                color: var(--secondary-text-color);
                opacity: 0.6;
            }

            .task-detail-description-input {
                width: 100%;
                min-height: 80px;
                border: none;
                background: var(--secondary-background-color, rgba(255,255,255,0.1));
                color: var(--primary-text-color);
                padding: 12px;
                border-radius: 8px;
                font-size: 14px;
                font-family: inherit;
                resize: vertical;
                outline: none;
                box-sizing: border-box;
            }

            /* Subtasks */
            .task-detail-subtasks {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .subtask-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 0;
            }

            .subtask-checkbox {
                --mdc-icon-button-size: 32px;
            }

            .subtask-checkbox ha-icon {
                --mdc-icon-size: 20px;
                color: var(--secondary-text-color);
            }

            .subtask-content {
                font-size: 14px;
            }

            .no-subtasks {
                font-size: 13px;
                color: var(--secondary-text-color);
                opacity: 0.6;
                padding: 8px 0;
            }

            .add-subtask-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                margin-top: 8px;
                background: transparent;
                border: 1px dashed var(--divider-color, rgba(255,255,255,0.2));
                border-radius: 8px;
                color: var(--secondary-text-color);
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .add-subtask-btn:hover {
                background: var(--secondary-background-color, rgba(255,255,255,0.05));
                border-color: var(--primary-color);
                color: var(--primary-text-color);
            }

            .add-subtask-btn ha-icon {
                --mdc-icon-size: 18px;
            }

            /* Properties */
            .task-detail-properties {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .task-detail-property {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.2s;
            }

            .task-detail-property:hover {
                background: var(--secondary-background-color, rgba(255,255,255,0.05));
            }

            .task-detail-property ha-icon {
                --mdc-icon-size: 20px;
                color: var(--secondary-text-color);
            }

            .property-label {
                font-size: 14px;
                font-weight: 500;
            }

            .property-value {
                margin-left: auto;
                font-size: 14px;
                color: var(--secondary-text-color);
            }

            .property-value.overdue {
                color: #d1453b;
            }

            .property-value.today {
                color: #eb8909;
            }

            .property-value.tomorrow {
                color: #246fe0;
            }

            /* Dropdown pickers */
            .date-picker-dropdown,
            .priority-picker-dropdown,
            .label-picker-dropdown {
                padding: 12px;
                margin: 4px 0 8px 0;
                background: var(--secondary-background-color, rgba(255,255,255,0.05));
                border-radius: 8px;
            }

            .date-picker-dropdown input[type="date"] {
                width: 100%;
                padding: 8px;
                border: 1px solid var(--divider-color);
                border-radius: 4px;
                background: var(--card-background-color);
                color: var(--primary-text-color);
                font-size: 14px;
                margin-bottom: 8px;
            }

            .date-quick-options {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .date-quick-options button {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                background: var(--primary-color);
                color: white;
                font-size: 12px;
                cursor: pointer;
            }

            .date-quick-options button:last-child {
                background: var(--error-color, #f44336);
            }

            .priority-picker-dropdown {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .priority-option {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                border: none;
                border-radius: 8px;
                background: var(--card-background-color);
                color: var(--primary-text-color);
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .priority-option:hover {
                transform: scale(1.05);
            }

            .priority-option ha-icon {
                --mdc-icon-size: 20px;
            }

            .label-picker-dropdown {
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-height: 200px;
                overflow-y: auto;
            }

            .label-option {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }

            .label-option:hover {
                background: var(--card-background-color);
            }

            .label-option input[type="checkbox"] {
                width: 18px;
                height: 18px;
                cursor: pointer;
            }

            .no-labels {
                font-size: 13px;
                color: var(--secondary-text-color);
                opacity: 0.6;
                text-align: center;
                padding: 16px;
            }

            /* Footer */
            .task-detail-footer {
                padding: 12px 16px;
                border-top: 1px solid var(--divider-color, rgba(255,255,255,0.1));
            }

            .delete-task-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                width: 100%;
                border: none;
                border-radius: 8px;
                background: rgba(244, 67, 54, 0.1);
                color: var(--error-color, #f44336);
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
                justify-content: center;
            }

            .delete-task-btn:hover {
                background: rgba(244, 67, 54, 0.2);
            }

            .delete-task-btn ha-icon {
                --mdc-icon-size: 18px;
            }

            /* ===== NEW TASK BUTTON (FOOTER) ===== */
            .todoist-footer {
                padding: 8px 16px 16px;
            }

            .new-task-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                padding: 12px 16px;
                border: 2px dashed var(--divider-color, rgba(255,255,255,0.2));
                border-radius: 12px;
                background: transparent;
                color: var(--secondary-text-color);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .new-task-btn:hover {
                border-color: var(--primary-color);
                background: var(--primary-color);
                color: white;
            }

            .new-task-btn ha-icon {
                --mdc-icon-size: 20px;
            }

            /* ===== DURATION PICKER ===== */
            .duration-picker-dropdown {
                padding: 12px;
                margin: 4px 0 8px 0;
                background: var(--secondary-background-color, rgba(255,255,255,0.05));
                border-radius: 8px;
            }

            .duration-options {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .duration-options button {
                padding: 8px 16px;
                border: none;
                border-radius: 8px;
                background: var(--card-background-color);
                color: var(--primary-text-color);
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .duration-options button:hover {
                background: var(--primary-color);
                color: white;
            }

            .duration-options button.duration-clear {
                background: rgba(244, 67, 54, 0.1);
                color: var(--error-color, #f44336);
            }

            .duration-options button.duration-clear:hover {
                background: rgba(244, 67, 54, 0.2);
            }

            /* ===== RECURRING BADGE ===== */
            .recurring-badge {
                margin-left: 4px;
                font-size: 14px;
                opacity: 0.7;
            }

            /* ===== COMMENTS ===== */
            .task-detail-comments {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .comment-count {
                margin-left: auto;
                font-size: 12px;
                opacity: 0.7;
            }

            .comment-item {
                padding: 12px;
                background: var(--secondary-background-color, rgba(255,255,255,0.05));
                border-radius: 8px;
            }

            .comment-content {
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 4px;
            }

            .comment-date {
                font-size: 11px;
                color: var(--secondary-text-color);
                opacity: 0.7;
            }

            .no-comments {
                font-size: 13px;
                color: var(--secondary-text-color);
                opacity: 0.6;
                padding: 8px 0;
            }

            .comment-input-wrapper {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .comment-input {
                width: 100%;
                min-height: 60px;
                border: 1px solid var(--divider-color);
                background: var(--secondary-background-color, rgba(255,255,255,0.05));
                color: var(--primary-text-color);
                padding: 12px;
                border-radius: 8px;
                font-size: 14px;
                font-family: inherit;
                resize: vertical;
                outline: none;
                box-sizing: border-box;
            }

            .comment-input:focus {
                border-color: var(--primary-color);
            }

            .comment-input-hint {
                font-size: 11px;
                color: var(--secondary-text-color);
                opacity: 0.6;
                text-align: right;
            }

            .add-comment-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: transparent;
                border: 1px dashed var(--divider-color, rgba(255,255,255,0.2));
                border-radius: 8px;
                color: var(--secondary-text-color);
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .add-comment-btn:hover {
                background: var(--secondary-background-color, rgba(255,255,255,0.05));
                border-color: var(--primary-color);
                color: var(--primary-text-color);
            }

            .add-comment-btn ha-icon {
                --mdc-icon-size: 18px;
            }
    `;
    }
}

customElements.define('powertodoist-card-editor', PowerTodoistCardEditor);
customElements.define('powertodoist-card', PowerTodoistCard);
window.customCards = window.customCards || [];
window.customCards.push({
    preview: true,
    type: 'powertodoist-card',
    name: 'Todoist Card V2',
    description: 'Enhanced Todoist card with subtask hierarchy support.',
});
console.info(
    '%c POWERTODOIST-CARD %c v2.3.0 ',
    'color: white; background: #e44332; font-weight: 700; border-radius: 4px 0 0 4px;',
    'color: #e44332; background: white; font-weight: 700; border-radius: 0 4px 4px 0;',
);

/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 */
var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };
    return function (date, mask, utc) {
        var dF = dateFormat;
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");
        mask = String(dF.masks[mask] || mask || dF.masks["default"]);
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }
        var _ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d: d,
                dd: pad(d),
                ddd: dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m: m + 1,
                mm: pad(m + 1),
                mmm: dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy: String(y).slice(2),
                yyyy: y,
                h: H % 12 || 12,
                hh: pad(H % 12 || 12),
                H: H,
                HH: pad(H),
                M: M,
                MM: pad(M),
                s: s,
                ss: pad(s),
                l: pad(L, 3),
                L: pad(L > 99 ? Math.round(L / 10) : L),
                t: H < 12 ? "a" : "p",
                tt: H < 12 ? "am" : "pm",
                T: H < 12 ? "A" : "P",
                TT: H < 12 ? "AM" : "PM",
                Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };
        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();
dateFormat.masks = {
    "default": "ddd mmm dd yyyy HH:MM:ss",
    shortDate: "m/d/yy",
    mediumDate: "mmm d, yyyy",
    longDate: "mmmm d, yyyy",
    fullDate: "dddd, mmmm d, yyyy",
    shortTime: "h:MM TT",
    mediumTime: "h:MM:ss TT",
    longTime: "h:MM:ss TT Z",
    isoDate: "yyyy-mm-dd",
    isoTime: "HH:MM:ss",
    isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};
dateFormat.i18n = {
    dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
};
Date.prototype.format = function (mask, utc) {
    return dateFormat(this, mask, utc);
};
