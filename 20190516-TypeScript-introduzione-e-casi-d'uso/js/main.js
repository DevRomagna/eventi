import { registerElements, setStyleRoot } from '../vendor/p-slides/index.js';

const deck = document.querySelector('p-deck');

function handleHash() {
  const hash = location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const [ slideRef ] = [ ...params.keys() ];

  const slide = getSlide(slideRef);
  const current = document.querySelector('p-slide[active]');

  const mode = params.get('mode');
  if (mode) {
    deck.setAttribute('mode', mode);
  } else {
    deck.removeAttribute('mode');
  }
  if (slide && slide !== current) {
    if (current) {
      current.removeAttribute('active');
    }
    slide.setAttribute('active', '');
  }
}
addEventListener('hashchange', handleHash);
handleHash();

function getSlide(slideRef) {
  if (/^\d+$/.test(`${slideRef}`.trim())) {
    return deck.querySelectorAll('p-slide')[+slideRef] || null;
  }
  return document.querySelector(`#${slideRef}`);
}

const progressBar = document.querySelector('.presentation-progress');
const navButtons = [ ...document.querySelectorAll('.presentation-nav button') ].reduce((map, button) => {
  map[button.className] = button;
  return map;
}, {});
function toggleNavButtons() {
  navButtons.previous.disabled = deck.atStart;
  navButtons.next.disabled = deck.atEnd;
}

function changeHash(slide) {
  const slideRef = slide.id || deck.currentIndex;
  const { mode } = deck;
  location.hash = '#' + slideRef + (mode === 'presentation' ? '' : `&mode=${mode}`);
}
const lazyAttribs = [ 'src', 'srcset', 'href' ];
const lazySelector = lazyAttribs.map(attrib => `[data-lazy-${attrib}]`).join();
function loadLazyMedia(root) {
  for (const element of root.querySelectorAll(lazySelector)) {
    for (const { name, value } of Object.values(element.attributes))  {
      if (/^data-lazy-/.test(name)) {
        const realAttribute = name.slice(10);
        const realAttributeValue = element.getAttribute(realAttribute);
        if (realAttributeValue !== value) {
          element.setAttribute(realAttribute, value);
        }
      }
    }
  }
}
deck.addEventListener('p-slides.slidechange', ({ detail: { slide } }) => {
  loadLazyMedia(slide);
  changeHash(slide);

  const progress = +(deck.currentIndex * 100 / (deck.slides.length - 1)).toFixed(2);
  progressBar.setAttribute('aria-valuenow', progress);
  progressBar.style.setProperty('--progress', progress + '%');

  toggleNavButtons();
  setTimeout(() => {
    deck.style.setProperty('--current-slide-bg', getComputedStyle(slide).backgroundColor);
  });
});
deck.addEventListener('p-slides.fragmenttoggle', toggleNavButtons);
navButtons.previous.addEventListener('click', () => deck.previous());
navButtons.next.addEventListener('click', () => deck.next());

const fullscreenButton = document.querySelector('.fullscreen');
fullscreenButton.addEventListener('click', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.body.requestFullscreen();
  }
});

function toggleDeckMode() {
  const { mode } = deck;
  deck.mode = mode === deck.PRESENTATION_MODE ? deck.SPEAKER_MODE : deck.PRESENTATION_MODE;
  changeHash(deck.currentSlide);
}
const toggleModeButton = document.querySelector('.toggle-mode');
toggleModeButton.addEventListener('click', toggleDeckMode);
document.addEventListener('keydown', keyEvent => {
  if (keyEvent.key.toLowerCase() === 'm' && keyEvent.altKey) {
    toggleDeckMode();
  }
});

setStyleRoot('vendor/p-slides/css/');
registerElements();
