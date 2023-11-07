import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
import { LitElement, html, css }  from "https://unpkg.com/lit-element@3.3.3/lit-element.js?module";
import { MdFilledTextField } from '@material/web/textfield/filled-text-field.js';

function translateIcon(icon) {
    let ICON_TRANSLATION = {
        'mdi:plus': 'add',
        'mdi:checkbox-blank-outline': 'check_box_outline_blank',
        'mdi:arrow-right': 'arrow_right_alt',
        'mdi:arrow-left': 'arrow_left_alt',
    }
    
    if (ICON_TRANSLATION[icon]) {
        return ICON_TRANSLATION[icon];
    }
    
    return icon.replace("mdi:", "");
}

class HaCard extends LitElement {
    static get properties() {
        return {
            header: String
        }
    }

    render() {
        return html`
            <div>
                ${!!this.header 
                    ? html`<p style="font-size: x-large;">${this.header}</p>` 
                    : html`` 
                }
                <slot></slot>
            </div>
        `;
    }

    static get styles() {
        return css`
            :host {
                background: var(--ha-card-background,var(--card-background-color,#fff));
                box-shadow: var(--ha-card-box-shadow,none);
                box-sizing: border-box;
                border-radius: var(--ha-card-border-radius,12px);
                border-width: var(--ha-card-border-width,1px);
                border-style: solid;
                border-color: var(--ha-card-border-color,var(--divider-color,#e0e0e0));
                color: var(--primary-text-color);
                display: block;
                transition: all 0.3s ease-out 0s;
                position: relative;
                width: 1200px;
                margin: 1rem 2rem;
                padding: 16px;
            }
        `;
    }
}

class HaIconButton extends LitElement {
    render() {
        return html`
            <md-icon-button>
                <slot></slot>
            </md-icon-button>
        `;
    }

    static get styles() {
        return css`
            :host {
                color: var(--primary-text-color);
            }

            md-icon-button {
                color: var(--primary-text-color);
            }
        `;
    }
}

class HaIcon extends LitElement {
    static get properties() {
        return {
            icon: String
        }
    }

    render() {
        return html`
            <md-icon style="color: var(--primary-text-color);">
                ${translateIcon(this.icon)}
            </md-icon>
        `;
    }
}

class HaTextField extends MdFilledTextField {}

customElements.define('ha-card', HaCard);
customElements.define('ha-icon-button', HaIconButton);
customElements.define('ha-icon', HaIcon);
customElements.define('ha-textfield', HaTextField);