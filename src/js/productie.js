fetch('/json/ti.json')
  .then(res => res.json())
  .then(data => {
    const stats = data.toepassingen.statistics;
    const container = document.getElementById('toepassingen-content');

    const labels = [];
    const values = [];

    stats.forEach(s => {
      const [country, amountStr] = s.split(':').map(x => x.trim());
      labels.push(country);

      // remove ± and "ton"
      let numStr = amountStr.replace('±', '').replace('ton', '').trim();

      let value = 0;

      if (numStr.includes('miljoen')) {
        // e.g., "3,3 miljoen" -> 3.3 * 1,000,000
        value = parseFloat(numStr.replace('miljoen','').replace(',','.').trim()) * 1_000_000;
      } else {
        // e.g., "400.000" -> 400000
        value = parseInt(numStr.replace('.', '').replace(',', ''), 10);
      }

      values.push(value);
    });

    // Slide HTML
    container.innerHTML = `
      <section class="slide">
        <div class="mining-section">
          <div class="picture">
            <canvas id="productieChart"></canvas>
          </div>
          <div class="text">
            <h3>Productie statistieken</h3>
            <ul>
              ${stats.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        </div>
      </section>
    `;

    // Chart.js pie chart
    const ctx = document.getElementById('productieChart').getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: ['#FFB74D','#4DB6AC','#BA68C8','#FFD54F','#64B5F6'],
          borderColor: '#000',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 14 } } },
          tooltip: { enabled: true }
        }
      }
    });
  });
