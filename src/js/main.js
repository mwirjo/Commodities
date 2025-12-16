/* global  */
class TiApp {
  constructor() {
    this.missions = [
      'Explore Ti beach sands deposits',
      'Master chloride processing techniques', 
      'Track live Titanium market prices',
      'Map Richards Bay mining operations',
      'Analyze global TiO₂ production trends'
    ];
    this.pages = ['mining','toepassingen','verwerking','geologie','vindplaatsen','productie','prijsontwikkeling'];
    this.init();
  }

  init() {
    // CHECK IF HOMEPAGE (no preloader elements)
    if (!document.getElementById('preloader')) {
      this.updateMission();
      this.setupFlipCards();
      this.setupNextButtons();
      this.loadLiveTiData();
    }
  }

  updateMission() {
    const missionEl = document.getElementById('mission');
    if (missionEl) {
      const viewed = JSON.parse(localStorage.getItem('ti-missions') || '[]');
      missionEl.textContent = this.missions[viewed.length % this.missions.length];
      viewed.push(Date.now());
      localStorage.setItem('ti-missions', JSON.stringify(viewed.slice(-5)));
    }
  }

  setupFlipCards() {
    document.querySelectorAll('.flip-card').forEach((card) => {
      card.onmouseenter = () => card.classList.add('hover');
      card.onmouseleave = () => card.classList.remove('hover');
      card.onclick = () => this.navigate(card.dataset.page);
    });
  }

  setupNextButtons() {
    const nextBtn = document.querySelector('.next-btn');
    if (nextBtn) {
      nextBtn.onclick = () => {
        const current = localStorage.getItem('current-page') || 'mining';
        const currentIndex = this.pages.indexOf(current);
        const nextIndex = currentIndex + 1;
        if (nextIndex < this.pages.length) {
          this.navigate(this.pages[nextIndex]);
        } else {
          window.location.href = 'questions.html';
        }
      };
    }
  }

  loadLiveTiData() {
    const tiPrices = {
      price: 652.75, change: 2.34, high: 685.20, low: 641.10,
      volume: 1245000, timestamp: Date.now()
    };
    localStorage.setItem('ti-prices', JSON.stringify(tiPrices));
  }

  navigate(page) {
    localStorage.setItem('current-page', page);
    window.location.href = `/${page}/index.html`;
  }
}

document.addEventListener('DOMContentLoaded', () => new TiApp());
