// import { IconButton } from "https://unpkg.com/@material/web@1.0.1/iconbutton/icon-button.js?module";
// import { Icon } from "https://unpkg.com/@material/web@1.0.1/icon/icon.js?module";

// customElements.define('ha-icon-button', IconButton);
// customElements.define('ha-icon', Icon);
import {LitElement, html} from 'https://unpkg.com/lit-element@3.3.3/lit-element.js?module';

class HaIconButton extends LitElement {
    render() {
        return html`
        <button class="mdc-icon-button material-icons">
            <slot></slot>
        </button>
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
            <div class="mdc-icon-button__ripple"></div>
            ${this.icon.substring(4)}
        `;
    }
}

customElements.define('ha-icon-button', HaIconButton);
customElements.define('ha-icon', HaIcon);