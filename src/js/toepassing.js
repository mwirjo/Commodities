fetch('/json/ti.json')
  .then(res => res.json())
  .then(data => {
    const toep = data.toepassingen;
    const container = document.getElementById('toepassingen-content');

    let html = `
      <section class="slide">
        <h2 class="highlight">${toep.title}</h2>
      </section>
    `;

    toep.sections.forEach(sec => {
      html += `
        <section class="slide hidden">
          <div class="mining-section">
            ${sec.image 
              ? `<div class="picture">
                  ${
                    Array.isArray(sec.image) 
                      ? sec.image.map(img => `
                          <div class="figure">
                            <img src="/images/logos/${img.src}" alt="${img.caption}">
                            <div class="caption">${img.caption}</div>
                          </div>`).join('')
                      : `<div class="figure">
                          <img src="/images/logos/${sec.image.src}" alt="${sec.image.caption}">
                          <div class="caption">${sec.image.caption}</div>
                        </div>`
                  }
                </div>` 
              : ''
            }
            <div class="text">
              <h3>${sec.heading}</h3>
              <p>${sec.text}</p>
            </div>
          </div>
        </section>
      `;
    });

    // Add navigation button
    html += `<button id="nextSlideBtn">Volgende slide ➜</button>`;

    container.innerHTML = html;

    // Slide logic
    const slides = container.querySelectorAll('.slide');
    let current = 0;
    slides[current].classList.remove('hidden');

    const nextBtn = document.getElementById('nextSlideBtn');
    nextBtn.addEventListener('click', () => {
      slides[current].classList.add('hidden');  // hide current
      current = (current + 1) % slides.length;   // next slide (loop back)
      slides[current].classList.remove('hidden'); // show next
    });
  })
  .catch(err => console.error('Error loading JSON:', err));
