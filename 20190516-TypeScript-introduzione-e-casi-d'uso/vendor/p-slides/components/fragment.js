import { attachStyle, createRoot } from '../utils.js';

export class PresentationFragmentElement extends HTMLElement {
  constructor() {
    super();
    if (!this.hasAttribute('aria-hidden')) {
      this.isVisible = false;
    }
    createRoot(this, '<slot></slot>');
    attachStyle('fragment', this.root);
  }

  get index() {
    return +this.getAttribute('index') || 0;
  }
  set index(index = 0) {
    const attrIndex = +index || 0;
    if (attrIndex) {
      this.setAttribute('index', attrIndex);
    } else {
      this.removeAttribute('index');
    }
  }

  get isVisible() {
    return this.getAttribute('aria-hidden') === 'false';
  }
  set isVisible(isVisible) {
    this.setAttribute('aria-hidden', `${!isVisible}`);
  }
}
