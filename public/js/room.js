// room.js — the "leaving the room" transition on the challenge room pages.
// Clicking "Back to the Great Hall" zooms the room out and fades to black
// (the reverse of stepping in), then loads the Great Hall.

(function () {
  const back = document.querySelector('.back');
  const room = document.querySelector('.room');
  if (!back || !room) return;

  // Respect reduced-motion: just navigate normally.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  back.addEventListener('click', (e) => {
    e.preventDefault();
    const href = back.getAttribute('href');

    const overlay = document.createElement('div');
    overlay.id = 'room-transition';
    document.body.appendChild(overlay);

    // Paint the start state first, then trigger the transitions next frame.
    requestAnimationFrame(() => {
      room.classList.add('leaving');
      overlay.classList.add('on');
    });

    setTimeout(() => { window.location.href = href; }, 520);
  });
})();
