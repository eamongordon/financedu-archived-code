const template = document.createElement('template');

template.innerHTML = `
<style>
label {
  cursor: pointer;
  display: inline-block;
  width: 40px;
  height: 36px;
  overflow: hidden;
  border: 1px solid #D8D8D8;
  border-radius: 12px;
}

input {
  border: none;
  background: none;
  opacity: 0;
  padding: 0;
  margin: 0;
  width: 1px;
  height: 1px;
  font-size: 1px;
  border-radius: 5px;
}
</style>
<label aria-label="choose color">
  <input type="color">
</label>`;

customElements.define('color-picker', class extends HTMLElement {
    static get observedAttributes() {
        return ['color'];
    }

    connectedCallback() {
        const elem = template.content.cloneNode(true);
        const color = this.getAttribute('color') || '#000000';

        this.$input = elem.querySelector('input');
        this.$label = elem.querySelector('label');

        this.$input.addEventListener('change', this.onChange.bind(this));

        this.$ = this.attachShadow({ mode: 'open' });
        this.$.appendChild(elem);
        this.setColor(color);
    }

    attributeChangedCallback(name, _, newValue) {
        setTimeout(() => {
            if (name === 'color') {
                this.setColor(newValue);
            }
        }, 0);
    }

    onChange({ target }) {
        const event = new CustomEvent('change', {
            detail: target.value,
        });

        this.$label.style.backgroundColor = target.value;
        this.dispatchEvent(event);
    }

    setColor(color) {
        this.$input.value = color;
        this.$label.style.backgroundColor = color;
    }
});