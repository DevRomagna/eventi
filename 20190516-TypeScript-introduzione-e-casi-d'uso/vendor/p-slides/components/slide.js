import { attachStyle, createRoot, fireEvent, whenAllDefined } from '../utils.js';

let allDefined = false;
whenAllDefined().then(() => allDefined = true);

export class PresentationSlideElement extends HTMLElement {
  constructor() {
    super();
    createRoot(this, '<slot></slot>');
    attachStyle('slide', this.root);
  }

  static get observedAttributes() {
    return [ 'active' ];
  }

  attributeChangedCallback(attribute, _, value) {
    if (attribute === 'active') {
      const isActive = value !== null;
      this.setAttribute('aria-hidden', `${!isActive}`);
      if (isActive) {
        const { deck } = this;
        if (deck) {
          deck.currentSlide = this;
        }
      }
    }
  }

  connectedCallback() {
    this.setAttribute('aria-hidden', `${!this.isActive}`);
  }

  get deck() {
    return allDefined && this.closest('p-deck');
  }

  get isActive() {
    return this.getAttribute('active') !== null;
  }
  set isActive(isActive) {
    if (!!isActive) {
      this.setAttribute('active', '');
    } else {
      this.removeAttribute('active');
    }
  }

  get isPrevious() {
    return this.getAttribute('previous') !== null;
  }
  set isPrevious(isPrevious) {
    if (!!isPrevious) {
      this.setAttribute('previous', '');
    } else {
      this.removeAttribute('previous');
    }
  }

  get fragments() {
    return [ ...this.querySelectorAll('p-fragment') ].sort((f1, f2) => {
      // There *should* be some handling in case of non-stable sort, but it has been fixed in Chrome too
      return f1.index - f2.index;
    });
  }
  get nextHiddenFragment() {
    return this.fragments.find(fragment => fragment.getAttribute('aria-hidden') === 'true');
  }
  get lastVisibleFragment() {
    return this.fragments.reverse().find(fragment => fragment.getAttribute('aria-hidden') === 'false');
  }

  get notes() {
    return this.querySelectorAll('p-notes');
  }

  next() {
    const hiddenFragment = this.nextHiddenFragment;
    if (hiddenFragment) {
      hiddenFragment.setAttribute('aria-hidden', 'false');
      fireEvent(this, 'fragmenttoggle', { fragment: hiddenFragment, isVisible: false });
      const { deck } = this;
      if (deck) {
        deck.broadcastState();
      }
      return false;
    }
    this.isPrevious = true;
    this.isActive = false;
    return true;
  }
  previous() {
    const visibleFragment = this.lastVisibleFragment;
    if (visibleFragment) {
      visibleFragment.setAttribute('aria-hidden', 'true');
      fireEvent(this, 'fragmenttoggle', { fragment: visibleFragment, isVisible: true });
      const { deck } = this;
      if (deck) {
        deck.broadcastState();
      }
      return false;
    }
    this.isPrevious = false;
    this.isActive = false;
    return true;
  }

  setFragmentVisibility(visible) {
    for (const fragment of this.fragments) {
      fragment.setAttribute('aria-hidden', !visible);
    }
  }
}
