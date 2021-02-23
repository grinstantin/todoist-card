import {LitElement, html, css} from 'https://unpkg.com/lit-element@2.4.0/lit-element.js?module';

class TodoistCardEditor extends LitElement {
    static get properties() {
        return {
            hass: Object,
            _config: Object,
        };
    }
    
    get _entity() {
        if (this._config) {
            return this._config.entity || '';
        }
        
        return '';
    }
    
    get _show_header() {
        if (this._config) {
            return this._config.show_header || true;
        }
        
        return true;
    }

    get _show_item_add() {
        if (this._config) {
            return this._config.show_item_add || true;
        }
        
        return true;
    }

    get _show_item_close() {
        if (this._config) {
            return this._config.show_item_close || true;
        }
        
        return true;
    }

    get _show_item_delete() {
        if (this._config) {
            return this._config.show_item_delete || true;
        }
        
        return true;
    }

    get _only_today_overdue() {
        if (this._config) {
            return this._config.only_today_overdue || false;
        }
        
        return false;
    }
    
    setConfig(config) {
        this._config = config;
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
    
    valueChanged(e) {
        if (
            !this._config
            || !this.hass
            || (this[`_${e.target.configValue}`] === e.target.value)
        ) {
            return;
        }
        
        if (e.target.configValue) {
            if (e.target.value === '') {
                if (e.target.configValue !== 'entity') {
                    delete this._config[e.target.configValue];
                }
            } else {
                this._config = {
                    ...this._config,
                    [e.target.configValue]: e.target.checked !== undefined
                        ? e.target.checked
                        : e.target.value,
                };
            }
        }
        
        this.configChanged(this._config);
    }
    
    render() {
        if (!this.hass) {
            return html``;
        }
        
        const entities = this.getEntitiesByType('sensor');

        return html`<div class="card-config">
            <paper-dropdown-menu
                label="Entity (required)"
                .configValue=${'entity'}
                @value-changed=${this.valueChanged}
            >
                <paper-listbox
                    slot="dropdown-content"
                    .selected=${entities.indexOf(this._config.entity || '')}
                >
                    ${entities.map(entity => {
                        return html`<paper-item>${entity}</paper-item>`;
                    })}
                </paper-listbox>
            </paper-dropdown-menu>
            
            <p class="option">
                <ha-switch
                    .checked=${(this._config.show_header === undefined) || (this._config.show_header !== false)}
                    .configValue=${'show_header'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                Show header
            </p>

            <p class="option">
                <ha-switch
                    .checked=${(this._config.show_item_add === undefined) || (this._config.show_item_add !== false)}
                    .configValue=${'show_item_add'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                Show text input element for adding new items to the list
            </p>

            <p class="option">
                <ha-switch
                    .checked=${(this._config.show_item_close === undefined) || (this._config.show_item_close !== false)}
                    .configValue=${'show_item_close'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                Show "close/complete" buttons
            </p>

            <p class="option">
                <ha-switch
                    .checked=${(this._config.show_item_delete === undefined) || (this._config.show_item_delete !== false)}
                    .configValue=${'show_item_delete'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                Show "delete" buttons
            </p>

            <p class="option">
                <ha-switch
                    .checked=${(this._config.only_today_overdue !== undefined) && (this._config.only_today_overdue !== false)}
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
    
    itemAdd(e) {
        if (e.which === 13) {
            let input = this.shadowRoot.getElementById('todoist-card-item-add');
            let value = input.value;
            
            if (value && value.length > 1) {
                let stateValue = this.hass.states[this.config.entity].state || undefined;
                
                if (stateValue) {
                    let date = new Date();
                    
                    let temp = this.random(1, 100) + '-' + (+date) + '-' + date.getMilliseconds();
                    
                    let commands = [{
                        'type': 'item_add',
                        'temp_id': temp,
                        'uuid': temp,
                        'args': {
                            'project_id': stateValue,
                            'content': value,
                        },
                    }];
                    
                    this.hass.callService('rest_command', 'todoist', {
                        commands: JSON.stringify(commands),
                    });
                    
                    input.value = '';
                    
                    let t = this;
                    setTimeout(function () {
                        t.hass.callService('homeassistant', 'update_entity', {
                            entity_id: t.config.entity,
                        });
                    }, 1000);
                }
            }
        }
    }
    
    itemClose(itemId) {
        let date = new Date();
        
        let commands = [{
            'type': 'item_close',
            'uuid': this.random(1, 100) + '-' + (+date) + '-' + date.getMilliseconds(),
            'args': {
                'id': itemId,
            },
        }];
        
        this.hass.callService('rest_command', 'todoist', {
            commands: JSON.stringify(commands),
        });
        
        let t = this;
        setTimeout(function () {
            t.hass.callService('homeassistant', 'update_entity', {
                entity_id: t.config.entity,
            });
        }, 1000);
    }
    
    itemDelete(itemId) {
        let date = new Date();
        
        let commands = [{
            'type': 'item_delete',
            'uuid': this.random(1, 100) + '-' + (+date) + '-' + date.getMilliseconds(),
            'args': {
                'id': itemId,
            },
        }];
        
        this.hass.callService('rest_command', 'todoist', {
            commands: JSON.stringify(commands),
        });
        
        let t = this;
        setTimeout(function () {
            t.hass.callService('homeassistant', 'update_entity', {
                entity_id: t.config.entity,
            });
        }, 1000);
    }

    render() {
        let state = this.hass.states[this.config.entity] || undefined;
        
        if (!state) {
            return html``;
        }
        
        let items = state.attributes.items || [];
        if (this.config.only_today_overdue) {
            items = items.filter(item => {
                return item.due && (+(new Date()) >= +(new Date(item.due.date))); // TODO: handle item.due.timezone
            });
        }
        
        return html`<ha-card>
            ${(this.config.show_header === undefined) || (this.config.show_header !== false)
                ? html`<h1 class="card-header">
                    <div class="name">${state.attributes.friendly_name}</div>
                </h1>`
                : html``}
            ${items.length
                ? html`<div class="todoist-list">
                    ${items.map(item => {
                        return html`<div class="todoist-item">
                            ${(this.config.show_item_close === undefined) || (this.config.show_item_close !== false)
                                ? html`<ha-icon-button
                                    icon="mdi:checkbox-marked-circle-outline"
                                    class="todoist-item-close"
                                    @click=${() => this.itemClose(item.id)}
                                ></ha-icon-button>`
                                : html`<ha-icon
                                    icon="mdi:circle-medium"
                                ></ha-icon>`}
                            <div class="todoist-item-text">${item.content}</div>
                            ${(this.config.show_item_delete === undefined) || (this.config.show_item_delete !== false)
                                ? html`<ha-icon-button
                                    icon="mdi:trash-can-outline"
                                    class="todoist-item-delete"
                                    @click=${() => this.itemDelete(item.id)}
                                ></ha-icon-button>`
                                : html``}
                        </div>`;
                    })}
                </ul>`
                : html`<div class="todoist-list-empty">No uncompleted tasks!</div>`}
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
            
            .todoist-item-text {
                font-size: 16px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .todoist-item-close {
                color: #008000;
            }
            
            .todoist-item-delete {
                margin-left: auto;
                color: #800000;
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