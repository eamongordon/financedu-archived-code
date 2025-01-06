class HelloWorld extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<p1>Hello World!</p1>';
  }
}

customElements.define('hello-world', HelloWorld);