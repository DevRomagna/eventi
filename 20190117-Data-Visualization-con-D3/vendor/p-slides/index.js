import { PresentationDeckElement } from './components/deck.js';
import { PresentationSlideElement } from './components/slide.js';
import { PresentationFragmentElement } from './components/fragment.js';
import { PresentationNotesElement } from './components/notes.js';
import { whenAllDefined, setStyleRoot } from './utils.js';

export {
  PresentationDeckElement,
  PresentationSlideElement,
  PresentationFragmentElement,
  PresentationNotesElement,
  setStyleRoot
};

export function registerElements() {
  customElements.define('p-deck', PresentationDeckElement);
  customElements.define('p-slide', PresentationSlideElement);
  customElements.define('p-fragment', PresentationFragmentElement);
  customElements.define('p-notes', PresentationNotesElement);
  return whenAllDefined();
}
