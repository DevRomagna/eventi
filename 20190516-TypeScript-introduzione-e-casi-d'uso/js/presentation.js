document.querySelectorAll('.random-features pre').forEach((frag, index) => {
  const variance = 100 / (index + 1);
  Object.assign(frag.style, {
    top: `${50 + (Math.random() * variance) - variance / 2}%`,
    left: `${50 + (Math.random() * variance) - variance / 2}%`,
    transform: `translate(-50%, -50%) scale(${(index + 5) / 10}) rotate(${Math.random() * 90 - 45}deg)`
  });
});
