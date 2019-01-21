const deck = document.querySelector('p-deck');

const codeSandboxes = deck.querySelectorAll('iframe[data-lazy-src^="https://codesandbox.io/embed/"]');

function updateCodeSandboxes() {
  requestIdleCallback(() => {
    const fontSize = Math.floor(parseFloat(getComputedStyle(deck).fontSize, 10) / 3);
    for (const iframe of codeSandboxes) {
      const source = iframe.getAttribute('data-lazy-src');
      const updatedSource = source.replace(/fontsize=\d+/, `fontsize=${fontSize}`);
      iframe.setAttribute('data-lazy-src', updatedSource);
      if (iframe.hasAttribute('src')) {
        iframe.setAttribute('src', updatedSource);
      }
    }
  });
}

window.addEventListener('resize', updateCodeSandboxes, { passive: true });
updateCodeSandboxes();
