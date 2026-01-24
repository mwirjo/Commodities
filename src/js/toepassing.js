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
        <section class="slide">
          <h3>${sec.heading}</h3>
          <p>${sec.text}</p>
          ${sec.image ? `
            <div class="figure">
              <img src="/images/logos/${sec.image.src}">
              <div class="caption">${sec.image.caption}</div>
            </div>` : ''}
        </section>
      `;
    });

    html += `
      <section class="slide">
        <h3>Productiestatistieken</h3>
        <div class="stats">${toep.statistics.join('<br>')}</div>
      </section>
    `;

    container.innerHTML = html;
  });
