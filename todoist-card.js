import {LitElement, html, css} from 'https://unpkg.com/lit-element@2.4.0/lit-element.js?module';

class TodoistCardEditor extends LitElement {
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
            <paper-dropdown-menu
                label="Entity (required)"
                .configValue=${'entity'}
                @value-changed=${this.valueChanged}
            >
                <paper-listbox
                    slot="dropdown-content"
                    .selected=${entities.indexOf(this.config.entity || '')}
                >
                    ${entities.map(entity => {
                        return html`<paper-item>${entity}</paper-item>`;
                    })}
                </paper-listbox>
            </paper-dropdown-menu>

            <paper-dropdown-menu
                label="Number of completed tasks shown at the end of the list (0 to disable)"
                .configValue=${'show_completed'}
                @value-changed=${this.valueChanged}
            >
                <paper-listbox
                    slot="dropdown-content"
                    .selected=${completedCount.indexOf(this._show_completed)}
                >
                    ${completedCount.map(count => {
                        return html`<paper-item>${count}</paper-item>`;
                    })}
                </paper-listbox>
            </paper-dropdown-menu>
            
            <p class="option">
                <ha-switch
                    .checked=${(this.config.show_header === undefined) || (this.config.show_header !== false)}
                    .configValue=${'show_header'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                Show header
            </p>

            <p class="option">
                <ha-switch
                    .checked=${(this.config.show_item_add === undefined) || (this.config.show_item_add !== false)}
                    .configValue=${'show_item_add'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                Show text input element for adding new items to the list
            </p>

            <p class="option">
                <ha-switch
                    .checked=${(this.config.show_item_close === undefined) || (this.config.show_item_close !== false)}
                    .configValue=${'show_item_close'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                Show "close/complete" and "uncomplete" buttons
            </p>

            <p class="option">
                <ha-switch
                    .checked=${(this.config.show_item_delete === undefined) || (this.config.show_item_delete !== false)}
                    .configValue=${'show_item_delete'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                Show "delete" buttons
            </p>

            <p class="option">
                <ha-switch
                    .checked=${(this.config.only_today_overdue !== undefined) && (this.config.only_today_overdue !== false)}
                    .configValue=${'only_today_overdue'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                Only show today or overdue
            </p>
        </div>`;
    }
    
    static get styles() {
        return css`
            .card-config paper-dropdown-menu {
                width: 100%;
            }
            
            .option {
                display: flex;
                align-items: center;
            }
            
            .option ha-switch {
                margin-right: 10px;
            }
        `;
    }
}


class TodoistCard extends LitElement {
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
        return document.createElement('todoist-card-editor');
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
    
    itemAdd(e) {
        if (e.which === 13) {
            let input = this.shadowRoot.getElementById('todoist-card-item-add');
            let value = input.value;
            
            if (value && value.length > 1) {
                let stateValue = this.hass.states[this.config.entity].state || undefined;
                
                if (stateValue) {
                    let uuid = this.getUUID();
                    
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
                            commands: JSON.stringify(commands),
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
    
    itemClose(item) {
        let commands = [{
            'type': 'item_close',
            'uuid': this.getUUID(),
            'args': {
                'id': item.id,
            },
        }];
        
        this.hass
            .callService('rest_command', 'todoist', {
                commands: JSON.stringify(commands),
            })
            .then(response => {
                if (this.itemsCompleted.length >= this.config.show_completed) {
                    this.itemsCompleted.splice(0, this.itemsCompleted.length - this.config.show_completed + 1);
                }
                this.itemsCompleted.push(item);

                this.hass.callService('homeassistant', 'update_entity', {
                    entity_id: this.config.entity,
                });
            });
    }

    itemUncomplete(item) {
        let commands = [{
            'type': 'item_uncomplete',
            'uuid': this.getUUID(),
            'args': {
                'id': item.id,
            },
        }];
        
        this.hass
            .callService('rest_command', 'todoist', {
                commands: JSON.stringify(commands),
            })
            .then(response => {
                this.itemDeleteCompleted(item);

                // this.hass.callService('homeassistant', 'update_entity', {
                //     entity_id: this.config.entity,
                // });
            });
    }
    
    itemDelete(item) {
        let commands = [{
            'type': 'item_delete',
            'uuid': this.getUUID(),
            'args': {
                'id': item.id,
            },
        }];
        
        this.hass
            .callService('rest_command', 'todoist', {
                commands: JSON.stringify(commands),
            })
            .then(response => {
                this.hass.callService('homeassistant', 'update_entity', {
                    entity_id: this.config.entity,
                });
            });
    }

    itemDeleteCompleted(item) {
        this.itemsCompleted = this.itemsCompleted.filter(v => {
            return v.id != item.id;
        });

        this.hass.callService('homeassistant', 'update_entity', {
            entity_id: this.config.entity,
        });
    }

    render() {
        let state = this.hass.states[this.config.entity] || undefined;
        
        if (!state) {
            return html``;
        }
        
        let items = state.attributes.items || [];
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
        
        return html`<ha-card>
            ${(this.config.show_header === undefined) || (this.config.show_header !== false)
                ? html`<h1 class="card-header">
                    <div class="name">${state.attributes.friendly_name}</div>
                </h1>`
                : html``}
            <div class="todoist-list">
                ${items.length
                    ? items.map(item => {
                        return html`<div class="todoist-item">
                            ${(this.config.show_item_close === undefined) || (this.config.show_item_close !== false)
                                ? html`<ha-icon-button
                                    class="todoist-item-close"
                                    @click=${() => this.itemClose(item)}
                                >
                                    <ha-icon icon="mdi:checkbox-marked-circle-outline"></ha-icon>
                                </ha-icon-button>`
                                : html`<ha-icon
                                    icon="mdi:circle-medium"
                                ></ha-icon>`}
                            <div class="todoist-item-text">${item.content}</div>
                            ${(this.config.show_item_delete === undefined) || (this.config.show_item_delete !== false)
                                ? html`<ha-icon-button
                                    class="todoist-item-delete"
                                    @click=${() => this.itemDelete(item)}
                                >
                                    <ha-icon icon="mdi:trash-can-outline"></ha-icon>
                                </ha-icon-button>`
                                : html``}
                        </div>`;
                    })
                    : html`<div class="todoist-list-empty">No uncompleted tasks!</div>`}
                ${this.config.show_completed && this.itemsCompleted
                    ? this.itemsCompleted.map(item => {
                            return html`<div class="todoist-item todoist-item-completed">
                                ${(this.config.show_item_close === undefined) || (this.config.show_item_close !== false)
                                    ? html`<ha-icon-button
                                        class="todoist-item-close"
                                        @click=${() => this.itemUncomplete(item)}
                                    >
                                        <ha-icon icon="mdi:plus-outline"></ha-icon>
                                    </ha-icon-button>`
                                    : html`<ha-icon
                                        icon="mdi:circle-medium"
                                    ></ha-icon>`}
                                <div class="todoist-item-text">${item.content}</div>
                                ${(this.config.show_item_delete === undefined) || (this.config.show_item_delete !== false)
                                    ? html`<ha-icon-button
                                        class="todoist-item-delete"
                                        @click=${() => this.itemDeleteCompleted(item)}
                                    >
                                        <ha-icon icon="mdi:trash-can-outline"></ha-icon>
                                    </ha-icon-button>`
                                    : html``}
                            </div>`;
                        })
                    : html``}
            </div>
            ${(this.config.show_item_add === undefined) || (this.config.show_item_add !== false)
                ? html`<input
                    id="todoist-card-item-add"
                    type="text"
                    class="todoist-item-add"
                    placeholder="New item..."
                    @keyup=${this.itemAdd}
                />`
                : html``}
        </ha-card>`;
    }
    
    static get styles() {
        return css`
            .card-header {
                padding-bottom: unset;
            }
            
            .todoist-list {
                display: flex;
                flex-direction: column;
                padding: 15px;
            }
            
            .todoist-list-empty {
                padding: 15px;
                text-align: center;
                font-size: 24px;
            }
            
            .todoist-item {
                display: flex;
                flex-direction: row;
                line-height: 48px;
            }

            .todoist-item-completed {
                color: #808080;
            }
            
            .todoist-item-text {
                font-size: 16px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .todoist-item-close {
                color: #008000;
            }

            .todoist-item-completed .todoist-item-close {
                color: #808080;
            }
            
            .todoist-item-delete {
                margin-left: auto;
                color: #800000;
            }

            .todoist-item-completed .todoist-item-delete {
                color: #808080;
            }
            
            .todoist-item-add {
                width: calc(100% - 30px);
                height: 32px;
                margin: 0 15px 15px;
                padding: 10px;
                box-sizing: border-box;
                border-radius: 5px;
                font-size: 16px;
            }

            .todoist-item ha-icon-button ha-icon {
                margin-top: -10px;
            }
        `;
    }
}

customElements.define('todoist-card-editor', TodoistCardEditor);
customElements.define('todoist-card', TodoistCard);

window.customCards = window.customCards || [];
window.customCards.push({
    preview: true,
    type: 'todoist-card',
    name: 'Todoist Card',
    description: 'Custom card for displaying lists from Todoist.',
});

console.info(
    '%c TODOIST-CARD ',
    'color: white; background: orchid; font-weight: 700',
);