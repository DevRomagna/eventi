import { createRoot } from '../utils.js';

export class PresentationNotesElement extends HTMLElement {
  constructor() {
    super();
    createRoot(this, '');
  }

  get isVisible() {
    const fragment = this.closest('p-fragment');
    return !fragment || fragment.isVisible;
  }
}
