import { attachStyle, createRoot } from '../utils.js';

export class PresentationFragmentElement extends HTMLElement {
  constructor() {
    super();
    if (!this.hasAttribute('aria-hidden')) {
      this.isVisible = false;
    }
    createRoot(this, '<slot></slot>');
    attachStyle(this);
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

  get isCurrent() {
    return this.hasAttribute('current');
  }
  set isCurrent(isCurrent) {
    if (isCurrent) {
      this.setAttribute('current', '');
    } else {
      this.removeAttribute('current');
    }
  }
}
