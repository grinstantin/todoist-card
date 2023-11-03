import {LitElement, html, css} from 'https://unpkg.com/lit-element@3.3.3/lit-element.js?module';

class TodoistKanbanCardEditor extends LitElement {
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

    get _only_today_overdue() {
        if (this.config) {
            return this.config.only_today_overdue || false;
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
        
        e.detail = {config: config};
        
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
                <span>Show text input element for adding new items to the list</span>
            </div>

            <div class="option">
                <ha-switch
                    .checked=${(this.config.use_quick_add !== undefined) && (this.config.use_quick_add !== false)}
                    .configValue=${'use_quick_add'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                <span>
                    Use the <a target="_blank" href="https://todoist.com/help/articles/task-quick-add">Quick Add</a> implementation, available in the official Todoist clients
                </span>
            </div>
            <div class="option" style="font-size: 0.7rem; margin: -12px 0 0 45px">
                <span>
                    Check your <a target="_blank" href="https://github.com/grinstantin/todoist-card#using-the-card">configuration</a> before using this option
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
                    .checked=${(this.config.only_today_overdue !== undefined) && (this.config.only_today_overdue !== false)}
                    .configValue=${'only_today_overdue'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                <span>Only show today or overdue</span>
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


class TodoistKanbanCard extends LitElement {
    constructor() {
        super();

        this.itemsCompleted = [];
    }

    static get properties() {
        return {
            hass: Object,
            config: Object,
        };
    }
    
    static getConfigElement() {
        return document.createElement('todoist-kanban-card-editor');
    }

    setConfig(config) {
        if (!config.entity) {
            throw new Error('Entity is not set!');
        }
        
        this.config = config;
    }

    getCardSize() {
        return this.hass ? (this.hass.states[this.config.entity].attributes.items.length || 1) : 1;
    }
    
    random(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    getUUID() {
        let date = new Date();
                    
        return this.random(1, 100) + '-' + (+date) + '-' + date.getMilliseconds();
    }
    
    itemAdd() {
        let input = this.shadowRoot.getElementById('todoist-card-item-add');
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
                    
                    this.hass
                        .callService('rest_command', 'todoist', {
                            url: 'quick/add',
                            payload: 'text=' + value + ' #' + state.attributes.project.name.replaceAll(' ',''),
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

    keyUp(e) {
        if (e.which === 13) {
            this.itemAdd();
        }
    }
    
    itemDelete(item) {
        let state = this.hass.states[this.config.entity] || undefined;
        
        if (state) {
            let items = state.attributes.items || [];
            let itemIndex = items.indexOf(item);
            items.splice(itemIndex, 1);

            let commands = [{
                'type': 'item_delete',
                'uuid': this.getUUID(),
                'args': {
                    'id': item.id,
                },
            }];
            
            this.hass
                .callService('rest_command', 'todoist', {
                    url: 'sync',
                    payload: 'commands=' + JSON.stringify(commands),
                })
                .then(response => {
                    this.hass.callService('homeassistant', 'update_entity', {
                        entity_id: this.config.entity,
                    });
                });

            this.requestUpdate();
        }
    }

    itemMove(item, direction) {
        let state = this.hass.states[this.config.entity] || undefined;
        
        if (state) {
            let sections = state.attributes.sections || [];
            console.log("Sections", sections);
            let section = sections.find(section => section.id == item.section_id)
            let sectionIndex = sections.indexOf(section);
            let newSection;

            if (direction === "right") {
                newSection = sections[sectionIndex + 1]
            } else {
                newSection = sections[sectionIndex - 1]
            }
            item.section_id = newSection.id;

            let uuid = this.getUUID();
            let commands = [{
                "type": "item_move",
                "uuid": uuid,
                "args": {
                    "id": item.id,
                    "section_id": newSection.id,
                }
            }];
            this.hass
                .callService('rest_command', 'todoist', {
                    url: 'sync',
                    payload: 'commands=' + JSON.stringify(commands),
                })
                .then(response => {
                    this.hass.callService('homeassistant', 'update_entity', {
                        entity_id: this.config.entity,
                    });
                });
            this.requestUpdate();
        }      
    }

    render() {
        let state = this.hass.states[this.config.entity] || undefined;
        
        if (!state) {
            return html``;
        }
        
        let items = state.attributes.items || [];
        let sections = state.attributes.sections || [];
        
        if (this.config.only_today_overdue) {
            items = items.filter(item => {
                if (item.due) {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(item.due.date)) {
                        item.due.date += 'T00:00:00';
                    }
                    
                    return (new Date()).setHours(23, 59, 59, 999) >= (new Date(item.due.date)).getTime();
                }

                return false;
            });
        }
        sections = sections.map(section => {
            return {
                ...section,
                items: items.filter(item => item.section_id == section.id)
            }
        });

        let show_header = this.config.show_header ?? true;      

        return html`<ha-card class="${show_header ? "has-header" : ""}">
            <div class="container">
                ${show_header ? html`<h1 class="kanban-heading">${state.attributes.friendly_name}</h1>` : html``}
                
                <div class="kanban-board">
                    ${sections.map((section, index) => html`
                        <div class="kanban-block" id="todo">
                            <strong>${section.name}</strong>
                            <div class="todoist-list">
                                ${section.items.map(item => html`
                                    <div class="card">
                                        <span class="card-content">${item.content}</span>
                                        ${index > 0
                                            ? html`<ha-icon-button @click=${() => this.itemMove(item, 'left')}>
                                                    <ha-icon icon="mdi:arrow-left">
                                                    </ha-icon>
                                                </button>` 
                                            : html``}
                                        ${index < sections.length - 1 
                                            ? html`<ha-icon-button @click=${() => this.itemMove(item, 'right')}>
                                                    <ha-icon icon="mdi:arrow-right">
                                                    </ha-icon>
                                                </button>` 
                                            : html``}
                                        ${index === sections.length - 1
                                            ? html`<ha-icon-button
                                                        class="todoist-item-delete"
                                                        @click=${() => this.itemDelete(item)}>
                                                        <ha-icon icon="mdi:close"></ha-icon>
                                                    </ha-icon-button>`
                                            : html``}
                                    </div>
                                `)}
                                </div>
                            ${index === 0 && ((this.config.show_item_add === undefined) || (this.config.show_item_add !== false))
                                ? html`<footer class="todoist-list-add-row">
                                            <ha-textfield
                                            id="todoist-card-item-add"
                                            type="text"
                                            class="todoist-item-add"
                                            placeholder="Add item"
                                            enterkeyhint="enter"
                                            @keyup=${this.keyUp}
                                        ></ha-textfield>
                                        <ha-icon-button
                                            class="todoist-item-add-btn"
                                            @click=${this.itemAdd}
                                        >
                                            <ha-icon icon="mdi:plus"></ha-icon>
                                        </ha-icon-button>
                                    </footer>`
                                : html``}
                        </div>`
                    )}
                </div>
            </div>
        </ha-card>`;
    }
    
    static get styles() {
        return css`
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        .container {
            width: calc(100% - 20px);
            margin: 20px auto;
        }
        
        .kanban-heading {
            text-align: center;
            font-family: Arial, sans-serif;
            font-size: 32px;
            color: #333;
            margin-bottom: 16px;
        }
        
        .kanban-board {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .kanban-block {
            width: 30%;
            border: 1px solid #ccc;
            border-radius: 10px;
            overflow-y: auto;
            font-family: Arial, sans-serif;
            font-size: 18px;
            color: #333;
            display: flex;
            flex-direction: column;
        }

        .todoist-list-add-row {
            display: flex;
            flex-direction: row;
            align-items: center;
        }
        
        .kanban-block strong {
            display: block;
            text-align: center;
            padding: 10px;
            background-color: #eee;
        }
        
        .kanban-block ul {
            list-style: none;
        }

        .todoist-list {
            display: flex;
            flex-direction: column;
            min-height: 82px;
            height: 100%;
            overflow: auto;
        }
        
        .card {
            padding: 10px;
            margin: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            background-color: #fff;
            box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: row;
            align-items: center;
        }

        .card-content {
            width: 100%;
        }

        .todoist-item-add {
            padding: 0px 5px 0px 16px;
        }

        .todoist-item-add {
            width: 100%;
            line-height: 9px;
            height: 3rem;
        }

        .todoist-item ha-icon-button ha-icon {
            margin-top: -10px;
        }
        `;
    }
}

customElements.define('todoist-kanban-card-editor', TodoistKanbanCardEditor);
customElements.define('todoist-kanban-card', TodoistKanbanCard);

window.customCards = window.customCards || [];
window.customCards.push({
    preview: true,
    type: 'todoist-kanban-card',
    name: 'Todoist Kanban Card',
    description: 'Custom card for displaying projects from Todoist in a Kanban format.',
});

console.info(
    '%c TODOIST-KANBAN-CARD ',
    'color: white; background: lightgreen; font-weight: 700',
);
