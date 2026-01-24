fetch('/json/ti.json')
  .then(res => res.json())
  .then(data => {
    const mining = data.mining;

    // Kroll process (big first)
    const kroll = mining.krollProcess;
    const krollSection = document.querySelector('.kroll-section');
    krollSection.innerHTML = `
      <figure>
        <img src="/images/logos/${kroll.src}" alt="${kroll.alt}" class="kroll-img" >
        <figcaption>${kroll.caption}</figcaption>
      </figure>
    `;

    // Container for points
    const container = document.querySelector('.mining-intro');

    mining.points.forEach(point => {
      // Create a card div for each point
      const card = document.createElement('div');
      card.className = 'bullet-point-card';

      // Text
      const p = document.createElement('p');
      p.textContent = point.text;
      card.appendChild(p);

      // Images for this point
      if (point.photoIds && point.photoIds.length > 0) {
        const figureDiv = document.createElement('div');
        figureDiv.className = 'point-figure';

        point.photoIds.forEach(id => {
          const imgData = mining.processGallery[id];
          if (imgData) {
            const figure = document.createElement('figure');
            figure.innerHTML = `
              <img src="${imgData.src}" alt="${imgData.alt}" loading="lazy">
              <figcaption>${imgData.caption}</figcaption>
            `;
            figureDiv.appendChild(figure);
          }
        });

        card.appendChild(figureDiv);
      }

      container.appendChild(card);
    });
  })
  .catch(err => console.error('Error loading JSON:', err));
