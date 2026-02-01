// 1️⃣ Content laden (jouw code)
fetch('/json/ti.json')
  .then(res => res.json())
  .then(data => {
    const mining = data.mining;

    // Kroll process
    const kroll = mining.krollProcess;
    const krollSection = document.querySelector('.kroll-section');
    krollSection.innerHTML = `
      <figure>
        <img src="/images/logos/${kroll.src}" alt="${kroll.alt}" class="kroll-img">
        <figcaption>${kroll.caption}</figcaption>
      </figure>
    `;

    const container = document.querySelector('.mining-intro');

mining.points.forEach(point => {
  const card = document.createElement('div');
  card.className = 'bullet-point-card ppt-slide'; // 👈 THIS is the slide

  const p = document.createElement('p');
  p.textContent = point.text;
  card.appendChild(p);

  if (point.photoIds?.length) {
    const figureDiv = document.createElement('div');
    figureDiv.className = 'point-figure';

    point.photoIds.forEach(id => {
      const imgData = mining.processGallery[id];
      if (imgData) {
        const figure = document.createElement('figure');
        figure.innerHTML = `
          <img src="${imgData.src}" alt="${imgData.alt}">
          <figcaption>${imgData.caption}</figcaption>
        `;
        figureDiv.appendChild(figure);
      }
    });

    card.appendChild(figureDiv);
  }

  container.appendChild(card);
});


    // ⚠️ NA het vullen → slides activeren
    initSlides();
  })
  .catch(err => console.error(err));

  function initSlides() {
  const slides = document.querySelectorAll('.ppt-slide');
  if (!slides.length) return;

  let current = 0;
  slides[current].classList.add('active');

  function show(index) {
    slides.forEach(s => s.classList.remove('active'));
    slides[index].classList.add('active');
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') {
      current = Math.min(current + 1, slides.length - 1);
      show(current);
    }
    if (e.key === 'ArrowLeft') {
      current = Math.max(current - 1, 0);
      show(current);
    }
  });

  document.addEventListener('click', () => {
    current = Math.min(current + 1, slides.length - 1);
    show(current);
  });
}
