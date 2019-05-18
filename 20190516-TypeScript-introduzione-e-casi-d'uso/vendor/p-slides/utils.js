export function whenAllDefined() {
  return Promise.all(
    [ 'p-deck', 'p-slide', 'p-fragment', 'p-notes' ]
      .map(tag => customElements.whenDefined(tag))
  );
}

let styleRoot = 'css/';
export function setStyleRoot(root) {
  styleRoot = root;
}

export function attachStyle(name, root) {
  const linkEl = root.ownerDocument.createElement('link');
  linkEl.rel = 'stylesheet';
  linkEl.href = `${styleRoot}${name}.css`;
  return new Promise((resolve, reject) => {
    linkEl.addEventListener('load', () => {
      resolve(linkEl.sheet);
    });
    linkEl.addEventListener('error', reject);
    root.appendChild(linkEl);
  });
}

export function selectSlide(slides, nextSlide) {
  let isPrevious = true;
  let isNext = false;
  for (const slide of slides) {
    if (isNext) {
      slide.setAttribute('next', '');
      isNext = false;
    } else {
      slide.removeAttribute('next');
    }
    if (slide === nextSlide) {
      isPrevious = false;
      isNext = true;
    } else {
      slide.isActive = false;
      slide.isPrevious = isPrevious;
      slide.setFragmentVisibility(isPrevious);
    }
  }
}

export function copyNotes(noteContainer, notes) {
  while (noteContainer.lastChild) {
    noteContainer.removeChild(noteContainer.lastChild);
  }
  for (const note of notes) {
    const li = noteContainer.ownerDocument.createElement('li');
    for (const child of note.childNodes) {
      li.appendChild(child.cloneNode(true));
    }
    noteContainer.appendChild(li);
  };
  checkNoteActivations(noteContainer, notes);
}

export function checkNoteActivations(noteContainer, notes) {
  notes.forEach((note, index) => {
    noteContainer.children[index].classList.toggle('not-visible', !note.isVisible);
  });
}

export function defineConstants(target, constantMap) {
  const propDefinitions = Object.entries(constantMap).reduce((map, [ key, value ]) => {
    map[key] = { value, writable: false };
    return map;
  }, {});
  Object.defineProperties(target, propDefinitions);
}

export function matchKey(keyEvent, keyMap) {
  for (const [ command, keys ] of Object.entries(keyMap)) {
    for (const keyDef of keys) {
      const { key, altKey = false, ctrlKey = false, metaKey = false, shiftKey = false } = keyDef;
      const normalizedKeyDef = { key, altKey, ctrlKey, metaKey, shiftKey };
      if (Object.entries(normalizedKeyDef).every(([ prop, value ]) => keyEvent[prop] === value)) {
        return command;
      }
    }
  }
  return null;
}

export function createRoot(element, innerHTML) {
  if (element.root) return;

  element.root = element.attachShadow({ mode: 'open' });
  element.root.innerHTML = innerHTML;
}

export function fireEvent(target, eventName, detail = {}) {
  const event = new CustomEvent(`p-slides.${eventName}`, { bubbles: true, detail });
  target.dispatchEvent(event);
}

export function formatClock(millis) {
  const secs = Math.floor(millis / 1000);
  return (secs < 0 ? '-' : '')
    + Math.floor(secs / 3600).toString().padStart(2, '0')
    + ':' + Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
    + ':' + Math.floor(secs % 60).toString().padStart(2, '0');
}
