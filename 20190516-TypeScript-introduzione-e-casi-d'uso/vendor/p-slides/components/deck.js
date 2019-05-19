import { attachStyle, defineConstants, matchKey, createRoot, fireEvent, formatClock, selectSlide, copyNotes, whenAllDefined, checkNoteActivations } from '../utils.js';

export class PresentationDeckElement extends HTMLElement {
  constructor() {
    super();
    createRoot(this, '<slot></slot><aside><header><span></span><span></span> <time></time> <button type="button"></button> <button type="button"></button></header><ul></ul></aside>');
    attachStyle('deck', this.root).then(() => this._computeFontSize());

    this._clockElapsed = 0;
    this._clockStart = null;
    this._keyHandler = this._keyHandler.bind(this);
    this._computeFontSize = this._computeFontSize.bind(this);

    this.root.querySelector('button').addEventListener('click', () => this.toggleClock());
    this.root.querySelector('button:last-of-type').addEventListener('click', () => this.clock = 0);

    // Channel for state sync
    const channel = new BroadcastChannel('p-slides');
    channel.addEventListener('message', ({ data }) => {
      // Sending a null state => requesting the state
      if (data === null) {
        this.broadcastState();
      } else this._muteAction(() => {
        this.state = data;
      });
    });
    this.broadcastState = () => channel.postMessage(this.state);
    this.requestState = () => channel.postMessage(null);
  }

  _muteAction(fn) {
    const { broadcastState } = this;
    this.broadcastState = () => {};
    fn();
    this.broadcastState = broadcastState;
  }

  connectedCallback() {
    this.ownerDocument.addEventListener('keydown', this._keyHandler);
    this.ownerDocument.defaultView.addEventListener('resize', this._computeFontSize, { passive: true });
    this._clockInterval = this.ownerDocument.defaultView.setInterval(() => this._updateClock(), 1000);
    this.root.querySelector('span:nth-child(2)').textContent = this.slides.length;
    this._updateClock();

    whenAllDefined().then(() => {
      this._muteAction(() => this._resetCurrentSlide());
      this.requestState();
    });
  }

  disconnectedCallback() {
    this.ownerDocument.removeEventListener('keydown', this._keyHandler);
    this.ownerDocument.defaultView.removeEventListener('resize', this._computeFontSize);
    this.ownerDocument.defaultView.clearInterval(this._clockInterval);
    this._clockInterval = null;
    this.stopClock();
  }

  get mode() {
    const attrValue = this.getAttribute('mode');
    return [ this.PRESENTATION_MODE, this.SPEAKER_MODE ].includes(attrValue) ? attrValue : this.PRESENTATION_MODE;
  }
  set mode(mode) {
    if ([ this.PRESENTATION_MODE, this.SPEAKER_MODE ].includes(mode)) {
      this.setAttribute('mode', mode);
    }
  }

  _resetCurrentSlide(nextSlide = this.querySelector('p-slide')) {
    let { currentSlide } = this;
    if (!currentSlide && nextSlide) {
      currentSlide = nextSlide;
    }
    if (currentSlide) {
      this.currentSlide = currentSlide;
    }
  }

  _computeFontSize() {
    const { width } = this.slideSizes;
    const fontSize = +this.ownerDocument.defaultView.getComputedStyle(this).getPropertyValue('--slide-font-size') || 5;
    this.style.fontSize = `${width * fontSize / 100}px`;
  }

  get slideSizes() {
    const { width, height } = this.getBoundingClientRect();
    const deckRatio = width / height;
    const aspectRatio = +this.ownerDocument.defaultView.getComputedStyle(this).getPropertyValue('--slide-aspect-ratio') || 1.5;
    if (deckRatio > aspectRatio) {
      return { width: height * aspectRatio, height };
    }
    return { width, height: width / aspectRatio };
  }

  get currentSlide() {
    return this.querySelector('p-slide[active]');
  }
  set currentSlide(nextSlide) {
    const { _currentSlide } = this;
    if (_currentSlide === nextSlide) {
      return;
    }
    if (!(nextSlide instanceof HTMLElement) || nextSlide.nodeName !== 'P-SLIDE') {
      throw Error('Current slide can only be a <p-slide> element');
    }
    if (!this.contains(nextSlide)) {
      throw Error('Deck does not contain given slide');
    }
    if (!nextSlide.isActive) {
      nextSlide.isActive = true;
      return;
    }

    selectSlide(this.slides, nextSlide);
    this.root.querySelector('span').textContent = this.currentIndex + 1;
    copyNotes(this.root.querySelector('ul'), nextSlide.notes);

    this._currentSlide = nextSlide;
    fireEvent(this, 'slidechange', { slide: nextSlide, previous: _currentSlide });
    if (this.atEnd) {
      fireEvent(this, 'finish');
    }
    this.broadcastState();
  }

  get currentIndex() {
    return [ ...this.slides ].findIndex(slide => slide.isActive);
  }
  set currentIndex(index) {
    const { slides } = this;
    if (slides.lenght === 0 && +index === 0) {
      return;
    }
    const slide = slides[index];
    if (!slide) {
      throw Error(`Slide index out of range (must be 0-${slides.length - 1}, ${index} given)`);
    }
    this.currentSlide = slide;
  }

  get slides() {
    return this.querySelectorAll('p-slide');
  }
  get atStart() {
    if (this.currentIndex > 0) {
      return false;
    }
    const firstSlide = this.slides[0];
    return !firstSlide || !firstSlide.lastVisibleFragment;
  }
  get atEnd() {
    if (this.currentIndex < this.slides.length - 1) {
      return false;
    }
    const { slides } = this;
    const lastSlide = slides[slides.length - 1];
    return !lastSlide || !lastSlide.nextHiddenFragment;
  }

  _keyHandler(keyEvent) {
    const command = matchKey(keyEvent, this.keyCommands);
    switch (command) {
      case this.PREVIOUS_COMMAND:
        this.previous();
        break;
      case this.NEXT_COMMAND:
        this.next();
        break;
      case this.TOGGLE_CLOCK_COMMAND:
        this.toggleClock();
        break;
      case this.RESET_CLOCK_COMMAND:
        this.clock = 0;
        break;
    }
  }

  next() {
    if (!this.atEnd) {
      const { currentIndex, currentSlide } = this;
      const goToNext = currentSlide.next();
      if (goToNext) {
        this.slides[currentIndex + 1].isActive = true;
      } else {
        checkNoteActivations(this.root.querySelector('ul'), currentSlide.notes);
        if (this.atEnd) {
          fireEvent(this, 'finish');
        }
      }
    }
  }

  previous() {
    if (!this.atStart) {
      const { currentIndex, currentSlide } = this;
      const goToPrevious = currentSlide.previous();
      if (goToPrevious) {
        this.slides[currentIndex - 1].isActive = true;
      } else {
        checkNoteActivations(this.root.querySelector('ul'), currentSlide.notes);
      }
    }
  }

  startClock() {
    this._clockStart = Date.now();
    this.root.querySelector('time').setAttribute('running', '');
    fireEvent(this, 'clockstart', { timestamp: this._clockStart, elapsed: this._clockElapsed });
    this.broadcastState();
  }
  stopClock() {
    if (this.isClockRunning) {
      this._clockElapsed += Date.now() - this._clockStart;
    }
    this._clockStart = null;
    this.root.querySelector('time').removeAttribute('running');
    fireEvent(this, 'clockstop', { elapsed: this._clockElapsed });
    this.broadcastState();
  }
  toggleClock() {
    if (this.isClockRunning) {
      this.stopClock();
    } else {
      this.startClock();
    }
  }

  _updateClock() {
    this.root.querySelector('time').textContent = formatClock(this.clock);
  }
  get clock() {
    return this._clockElapsed + (this.isClockRunning ? Date.now() - this._clockStart : 0);
  }
  set clock(value) {
    if (!isNaN(value)) {
      this._clockElapsed = +value;
      if (this.isClockRunning) {
        this._clockStart = Date.now();
      }
      fireEvent(this, 'clockset', { elapsed: this._clockElapsed });
      this.broadcastState();
    }
    if (this._clockInterval) {
      this._updateClock();
    }
  }
  get isClockRunning() {
    return this._clockStart !== null;
  }

  get state() {
    const state = {
      currentIndex: this.currentIndex,
      currentSlideFragmentVisibility: this.currentSlide.fragments.map(f => f.isVisible),
      clockElapsed: this._clockElapsed,
      clockStart: this._clockStart
    };
    return state;
  }
  set state(state) {
    this.currentIndex = state.currentIndex;
    this._clockElapsed = state.clockElapsed;
    this._clockStart = state.clockStart;
    this.currentSlide.fragments.forEach((fragment, index) => {
      fragment.isVisible = state.currentSlideFragmentVisibility[index];
    });
  }
}

const _proto = PresentationDeckElement.prototype;
defineConstants(_proto, {
  NEXT_COMMAND: 'next',
  PREVIOUS_COMMAND: 'previous',
  TOGGLE_CLOCK_COMMAND: 'toggleclock',
  RESET_CLOCK_COMMAND: 'resetclock',
  PRESENTATION_MODE: 'presentation',
  SPEAKER_MODE: 'speaker'
});
_proto.keyCommands = {
  [_proto.NEXT_COMMAND]: [{ key: 'ArrowRight' }, { key: 'ArrowDown' }],
  [_proto.PREVIOUS_COMMAND]: [{ key: 'ArrowLeft' }, { key: 'ArrowUp' }],
  [_proto.TOGGLE_CLOCK_COMMAND]: [{ key: 'P' }, { key: 'p' }],
  [_proto.RESET_CLOCK_COMMAND]: [{ key: '0', altKey: true }]
};
