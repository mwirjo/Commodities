// 🔥 TITANIUM 8.5-YEAR GEOLOGY DASHBOARD - FULL 207 POINTS COMPLETE

class CommodityDashboard {
  constructor() {
    this.apiKey = '10edfc9e07416eafbcf71e7c387872f49fc6d09e';
    this.apiBase = '/commoditic/api/v1';
    this.commodity = 'titanium';  
    this.dateFrom = '2017-07-13';
    this.dateTo = '2025-12-31';

    this.data = {
      current: null,
      historical: [],
      advanced: {},
      localStorageKey: `${this.commodity}_trial_8_5yr_monthly`,
      cycleYears: 8.5
    };
    this.charts = {};

    this.updateStatus = this.updateStatus.bind(this);
    this.init();
  }
  
  init() {
    this.loadLocalData();
    this.bindEvents();
    this.refreshData();
  }

  bindEvents() {
    const btn = document.getElementById('refreshData');
    if (btn) btn.addEventListener('click', () => this.refreshData());
  }

  updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `status ${type}`;
    }
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  async refreshData() {
    localStorage.removeItem(this.data.localStorageKey);
    this.updateStatus('🔄 Laden Titanium 8.5-JAAR MAAND data...', 'loading');
    
    try {
      const [currentData, historicalData] = await Promise.all([
        this.fetchCurrentPrice(),
        this.fetchHistoricalData()
      ]);

      this.data.current = currentData;
      this.data.historical = historicalData;
      this.data.advanced = this.calculateAdvancedStats(historicalData);

      console.log('📊 TITANIUM 8.5-JAAR MAAND:', {
        months: historicalData.length,
        years: this.data.advanced.years,
        low: `$${this.data.advanced.cycleLow}`,
        high: `$${this.data.advanced.cycleHigh}`,
        rec: this.data.advanced.recommendation?.text
      });

      this.saveLocalData();
      this.updateAll();
      this.updateStatus(`✅ ${historicalData.length} MAANDEN geladen (2017-${this.dateTo.slice(0,4)})`, 'success');
    } catch (error) {
      console.error('API Error:', error);
      this.updateStatus('❌ API fout - Check trial limiet', 'error');
    }
  }

  async fetchCurrentPrice() {
    const url = `${this.apiBase}/commodities?key=${this.apiKey}&name=${this.commodity}`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('💰 CURRENT PRICE RAW:', {
      url,
      fullData: data,
      isArray: Array.isArray(data),
      hasResults: !!data.results,
      keys: data ? Object.keys(data) : 'NO DATA',
      firstItem: data[0] || data.results?.[0] || 'EMPTY'
    });
    
    const result = Array.isArray(data) ? data[0] || {} : data.results?.[0] || {};
    
    return {
      price: parseFloat(result.price || 0),
      unit: 'USD/t',
      day_price_change: parseFloat(result.day_price_change || result['Daily Change'] || 0),
      d_perc_change: parseFloat(result.d_perc_change || result.w_perc_change || 0),
      w_perc_change: parseFloat(result.w_perc_change || 0)
    };
  }

  async fetchHistoricalData() {
    const dateFrom = '2011-01-01';
    const dateTo = '2026-01-06';
    const url = `${this.apiBase}/commodities_history?key=${this.apiKey}&name=${this.commodity}&date_from=${dateFrom}&date_to=${dateTo}`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📊 HISTORICAL RAW:', {
      url,
      fullData: data,
      outputExists: !!data.output,
      outputKeys: data.output ? Object.keys(data.output) : 'NO OUTPUT',
      firstPrices: data.output?.[0]?.prices?.slice(0, 3),
      totalPrices: data.output?.[0]?.prices?.length || 'N/A',
      datesSample: data.output?.[0]?.prices ? 
        data.output[0].prices.slice(0, 3).map(p => p.date) : 'NO DATES'
    });
    
    let prices = [];
    if (data.output?.[0]?.prices) {
      prices = data.output[0].prices;
    } else if (Array.isArray(data.output)) {
      prices = data.output;
    }

    prices = prices
      .map(p => ({ date: p.date, price: parseFloat(p.price || 0) }))
      .filter(p => p.price > 0 && !isNaN(p.price))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .filter((p, i, self) => i === self.findIndex(t => t.date === p.date));
    
    return prices.map(p => ({ ...p, unit: 'USD/t' }));
  }

  calculateAdvancedStats(historical) {
    const prices = historical.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
    if (prices.length < 6) {
      return {
        volatility: 'N/A',
        rsi: 'N/A',
        ma20: 'N/A',
        totalChange: 0,
        cycleLow: 'N/A',
        cycleHigh: 'N/A',
        years: 0,
        dataPoints: historical.length,
        daysSpan: 0,
        recommendation: { text: 'Insufficient data', mining: 'N/A', stocks: 'N/A', score: 0, reasons: [] }
      };
    }

    const startDate = new Date(historical[0]?.date);
    const endDate = new Date(historical[historical.length - 1]?.date);
    const actualDaysSpan = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const yearsSpan = (actualDaysSpan / 365.25).toFixed(1);

    console.log('📏 MONTHLY SPAN:', {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      months: historical.length,
      daysSpan: actualDaysSpan,
      years: yearsSpan
    });

    return {
      volatility: this.calculateVolatility(prices).toFixed(2) + '%',
      rsi: (this.calculateRSI(prices, Math.min(6, prices.length - 1)) || 50).toFixed(0),
      ma20: (this.calculateMovingAverage(prices, Math.min(6, prices.length)).slice(-1)[0] || 0).toFixed(2),
      totalChange: prices.length ? (((prices[prices.length - 1] - prices[0]) / prices[0]) * 100).toFixed(1) : '0',
      cycleLow: Math.min(...prices).toFixed(2),
      cycleHigh: Math.max(...prices).toFixed(2),
      years: yearsSpan,
      dataPoints: historical.length,
      daysSpan: actualDaysSpan,
      recommendation: this.getMiningRecommendation(prices)
    };
  }

  calculateVolatility(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const change = (prices[i] - prices[i - 1]) / prices[i - 1];
      if (!isNaN(change) && Math.abs(change) > 0.00001) returns.push(change);
    }
    if (returns.length < 3) return 1.5;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.min(Math.sqrt(variance) * 100 * Math.sqrt(12), 10.0);
  }

  calculateRSI(prices, period = 6) {
    if (prices.length < period + 1) return null;
    const changes = [];
    for (let i = 1; i < prices.length; i++) changes.push(prices[i] - prices[i - 1]);
    
    let avgGain = 0, avgLoss = 0;
    for (let i = 0; i < period; i++) {
      avgGain += Math.max(0, changes[i]);
      avgLoss += Math.max(0, -changes[i]);
    }
    avgGain /= period;
    avgLoss /= period;
    
    for (let i = period; i < changes.length; i++) {
      avgGain = (avgGain * (period - 1) + Math.max(0, changes[i])) / period;
      avgLoss = (avgLoss * (period - 1) + Math.max(0, -changes[i])) / period;
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  getMiningRecommendation(prices) {
  const current = prices[prices.length - 1];
  const volatility = this.calculateVolatility(prices);
  const rsi = this.calculateRSI(prices, 6);
  const ma6 = this.calculateMovingAverage(prices, 6).slice(-1)[0];
  const ma24 = this.calculateMovingAverage(prices, 24).slice(-1)[0];
  const cycleHigh = Math.max(...prices);
  const cycleLow = Math.min(...prices);
  const priceVsCycleHigh = current / cycleHigh;

  let score = 0;
  const reasons = [];

  // 🔥 PRICE THRESHOLDS (geology-based)
  if (current > 20) { score += 3; reasons.push('💰 >$20 = Viable'); }
  if (current > 35) { score += 2; reasons.push('📊 >$35 = Strong'); }
  if (current > cycleHigh * 0.85) { score += 2; reasons.push(`🎯 Near cycle high (${(priceVsCycleHigh*100).toFixed(0)}%)`); }

  // 🔥 TECHNICAL SIGNALS
  if (rsi && rsi > 40 && rsi < 70) { score += 1; reasons.push(`✅ RSI ${rsi.toFixed(0)} (neutral zone)`); }
  if (current > ma6) { score += 2; reasons.push('📈 > MA6 = Profitable'); }
  if (ma6 > ma24) { score += 1; reasons.push('🔥 MA6>MA24 = Bull confirmed'); }

  // 🔥 VOLATILITY (multi-timeframe)
  if (volatility < 12) { score += 1; reasons.push(`✅ Vol ${volatility.toFixed(1)}% (manageable)`); }
  if (this.calculateVolatility(prices.slice(-6)) < 6) { score += 1; reasons.push('🟢 6m vol LOW = Stable ops'); }

  // 🔥 RISK FACTORS
  if (current < cycleLow * 1.5) { score -= 1; reasons.push('⚠️ Near cycle low zone'); }
  if (volatility > 15) { score -= 2; reasons.push(`❌ Vol ${volatility.toFixed(1)}% = High risk`); }

  // 🔥 NEW DECISION MATRIX
  const text = score >= 7 ? "🟢 MAX PRODUCTION + EXPLORE NEW" : 
               score >= 4 ? "🟢 RUN FULL + HEDGE 20%" : 
               score >= 1 ? "🟡 MAINTAIN + MONITOR" : "🔴 SHUT DOWN";

  return {
    text,
    mining: score >= 7 ? "MAX+EXPLORE" : score >= 4 ? "FULL+HEDGE" : score >= 1 ? "MAINTAIN" : "SHUTDOWN",
    stocks: score >= 7 ? "BUY" : score >= 4 ? "HOLD" : score >= 1 ? "PARTIAL" : "SELL",
    score,
    reasons,
    keyMetrics: { current, ma6: ma6.toFixed(1), ma24: ma24.toFixed(1), rsi: rsi?.toFixed(0), vol: volatility.toFixed(1) }
  };
}


  calculateMovingAverage(prices, period) {
    return prices.map((price, i) => {
      if (i < period - 1) return 0;
      const slice = prices.slice(i - period + 1, i + 1);
      return slice.reduce((a, b) => a + b, 0) / slice.length;
    });
  }

  updateAll() {
    this.updateMetrics();
    this.updateAdvancedStats();
    this.updateDataSummary();     
    this.updateGlossary();  
    this.updateTable();
    this.updateCharts();
  }

  updateMetrics() {
    const current = this.data.current;
    if (!current) return;

    const priceEl = document.getElementById('currentPrice');
    if (priceEl) priceEl.textContent = `$${current.price?.toLocaleString() || 0} USD/t`;
    
    const dayChange = current.day_price_change;
    const dailyEl = document.getElementById('dailyChange');
    if (dailyEl && dayChange !== undefined) {
      dailyEl.textContent = dayChange >= 0 ? `+${dayChange.toFixed(2)}%` : `${dayChange.toFixed(2)}%`;
      dailyEl.className = `price-change ${dayChange >= 0 ? 'positive' : 'negative'}`;
    }

    const weekChange = current.w_perc_change || current.d_perc_change;
    const weeklyEl = document.getElementById('weeklyChange');
    if (weeklyEl && weekChange !== undefined) {
      weeklyEl.textContent = `${weekChange.toFixed(2)}%`;
      weeklyEl.className = `change-display ${weekChange >= 0 ? 'positive' : 'negative'}`;
    }

    const trendEl = document.getElementById('trendIndicator');
    if (trendEl) {
      const prices = this.data.historical.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
      const change = prices.length > 1 ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 : 0;
      const text = change > 100 ? '📈 8.5jr BULL' : change > 0 ? '➡️ STABIL' : '📉 BEAR';
      trendEl.textContent = text;
      trendEl.className = `trend-indicator trend-${change >= 0 ? 'positive' : 'negative'}`;
      trendEl.title = `${change.toFixed(1)}% (${prices.length} MAANDEN)`;
    }
  }

  updateAdvancedStats() {
    const stats = this.data.advanced;
    
    const volEl = document.getElementById('volatility');
    if (volEl) volEl.textContent = stats.volatility || 'N/A';
    
    const rsiEl = document.getElementById('rsi');
    if (rsiEl) rsiEl.textContent = stats.rsi || 'N/A';
    
    const ma20El = document.getElementById('ma20');
    if (ma20El) ma20El.textContent = stats.ma20 ? `$${stats.ma20}` : 'N/A';
    
    const totalDaysEl = document.getElementById('totalDays');
    if (totalDaysEl) {
      const spanText = `${stats.dataPoints || 0} mnd | ${stats.daysSpan || 0}d (${stats.years || 0}jr)`;
      totalDaysEl.textContent = spanText;
    }
  }

  updateDataSummary() {
    const stats = this.data.advanced;
    if (!this.data.historical.length || !stats) return;
    
    const today = this.data.current?.price || this.data.historical.slice(-1)[0]?.price || 0;
    const rec = stats.recommendation;
    const summary = `Titanium Live: <strong>$${today.toLocaleString()}</strong> | ${parseFloat(stats.totalChange) > 0 ? '📈' : '📉'} ${Math.abs(parseFloat(stats.totalChange)).toFixed(1)}% | RSI ${stats.rsi} | Vol ${stats.volatility} | <strong>${rec.text}</strong><br><small>Mijn: ${rec.mining} | Aandelen: ${rec.stocks} | ${stats.cycleLow}→${stats.cycleHigh}</small>`;
    
    const summaryEl = document.getElementById('dataSummary');
    if (summaryEl) {
      summaryEl.innerHTML = summary;
      summaryEl.className = `summary ${rec.text.includes('🟢') ? 'buy' : rec.text.includes('🟡') ? 'neutral' : 'sell'}`;
    }
  }

  updateGlossary() {
    const glossaryGrid = document.getElementById('glossary-grid');
    if (!glossaryGrid || glossaryGrid.children.length > 0) return;
    
    glossaryGrid.innerHTML = `
      <div class="glossary-item"><span class="term">MA6</span><span>6-maands gemiddelde</span></div>
      <div class="glossary-item"><span class="term">RSI</span><span>6-maands (45-65 = mijnen zone)</span></div>
      <div class="glossary-item"><span class="term">Volatiliteit</span><span>Maandelijks risico (12x geannualiseerd)</span></div>
    `;
  }

  updateTable() {
    const hist = this.data.historical.slice(-12);
    const tbody = document.querySelector('#priceTable tbody');
    if (!tbody || !hist.length) return;
    
    tbody.innerHTML = hist.map((p, i) => {
      const price = parseFloat(p.price);
      const prevPrice = i > 0 ? parseFloat(hist[i-1].price) : price;
      const monthChange = prevPrice ? ((price - prevPrice) / prevPrice * 100) : 0;
      const trendClass = monthChange >= 0 ? 'positive' : 'negative';
      
      return `
        <tr>
          <td>${new Date(p.date).toLocaleDateString('nl-NL')}</td>
          <td>$${price.toLocaleString()}</td>
          <td class="${trendClass}">${monthChange >= 0 ? '+' : ''}${monthChange.toFixed(2)}%</td>
          <td class="trend ${trendClass}">${monthChange >= 0 ? '📈' : '📉'}</td>
        </tr>
      `;
    }).join('');
  }

  updateCharts() {
  if (typeof Chart === 'undefined' || !this.data.historical.length) return;

  this.destroyCharts();
  const prices = this.data.historical.map(p => parseFloat(p.price));
  const ma6 = this.calculateMovingAverage(prices, 6);
  const ma24 = this.calculateMovingAverage(prices, Math.min(24, prices.length));

  // 🔥 1. PRICE CHART - Full 103 points + MA6 overlay
  const priceCtx = document.getElementById('priceChart')?.getContext('2d');
  if (priceCtx) {
    this.charts.price = new Chart(priceCtx, {
      type: 'line',
      data: {
        labels: this.data.historical.map(p => new Date(p.date).toLocaleDateString('nl-NL')),
        datasets: [
          { 
            label: 'Titanium (103 mnd)', 
            data: prices,
            borderColor: '#4682b4', 
            backgroundColor: 'rgba(70, 130, 180, 0.1)',
            fill: true, 
            tension: 0.3,
            pointRadius: 1.5
          }
          // 🔥 MA6 REMOVED from price chart - goes to MA comparison!
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 🔥 2. YEARLY CHART - Unchanged
  const yearlyCtx = document.getElementById('yearlyChart')?.getContext('2d');
  if (yearlyCtx) {
    const yearlyAvg = [];
    for (let i = 0; i <= 8; i++) {
      const year = 2017 + i;
      const yearData = this.data.historical.filter(p => new Date(p.date).getFullYear() === year);
      yearlyAvg.push(yearData.length ? yearData.reduce((sum, p) => sum + parseFloat(p.price), 0) / yearData.length : 0);
    }
    this.charts.yearly = new Chart(yearlyCtx, {
      type: 'line',
      data: {
        labels: ['17', '18', '19', '20', '21', '22', '23', '24', '25'],
        datasets: [{ label: 'Jaarlijks Gemiddelde', data: yearlyAvg, borderColor: '#4682b4', fill: true, tension: 0.4 }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 🔥 3. MA VERGELIJKING (180d) - NEW!
  // Replace your MA Comparison section in updateCharts():
const maCtx = document.getElementById('maComparisonChart')?.getContext('2d');
if (maCtx) {
  const recent180 = prices.slice(-Math.min(180, prices.length));
  const recentLabels = this.data.historical.slice(-Math.min(180, prices.length)).map(p => new Date(p.date).toLocaleDateString('nl-NL'));
  
  this.charts.maComparison = new Chart(maCtx, {
    type: 'line',
    data: {
      labels: recentLabels,
      datasets: [
        { 
          label: 'Prijs', 
          data: recent180, 
          borderColor: '#4682b4', 
          backgroundColor: 'rgba(70, 130, 180, 0.1)',
          fill: true, 
          tension: 0.4,  // 🔥 SMOOTH
          pointRadius: 0
        },
        { 
          label: 'MA6', 
          data: ma6.slice(-Math.min(180, ma6.length)), 
          borderColor: '#4ecdc4', 
          borderWidth: 3, 
          tension: 0.4,  // 🔥 SMOOTH
          pointRadius: 0,
          fill: false
        },
        { 
          label: 'MA24', 
          data: ma24.slice(-Math.min(180, ma24.length)), 
          borderColor: '#ff6b6b', 
          borderWidth: 3, 
          tension: 0.4,  // 🔥 SMOOTH
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { maxTicksLimit: 12 } },
        y: {
          ticks: {
            callback: function(value) { return '$' + value.toLocaleString(); }
          }
        }
      },
      interaction: { intersect: false, mode: 'index' }
    }
  });
}


  // 🔥 4. VOLATILITY CHART - Unchanged
  // 🔥 4. VOLATILITY CHART - With % labels
// 🔥 4. VOLATILITY CHART - SIMPLIFIED % LABELS
const volCtx = document.getElementById('volatilityChart')?.getContext('2d');
if (volCtx) {
  const volFull = this.calculateVolatility(prices);
  const vol2yr = this.calculateVolatility(prices.slice(-24));
  const vol6mo = this.calculateVolatility(prices.slice(-6));
  
  this.charts.volatility = new Chart(volCtx, {
    type: 'doughnut',
    data: {
      labels: ['8.5jr', '2jr', '6m'],
      datasets: [{ 
        data: [volFull, vol2yr, vol6mo], 
        backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1']
      }]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            generateLabels: function(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i];
                  const color = data.datasets[0].backgroundColor[i];
                  return {
                    text: `${label}: ${value.toFixed(1)}%`,
                    fillStyle: color,
                    strokeStyle: color,
                    lineWidth: 2
                  };
                });
              }
              return [];
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.parsed.toFixed(1)}%`;
            }
          }
        }
      }
    }
  });
}


}


  destroyCharts() {
    Object.values(this.charts).forEach(chart => chart?.destroy());
    this.charts = {};
  }

  loadLocalData() {
    const saved = localStorage.getItem(this.data.localStorageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.current && Array.isArray(parsed.historical)) {
        this.data.current = parsed.current;
        this.data.historical = parsed.historical;
        this.data.advanced = parsed.advanced || this.calculateAdvancedStats(parsed.historical);
        this.updateAll();
      }
    } catch (e) {
      console.warn('Invalid cache, clearing.', e);
      localStorage.removeItem(this.data.localStorageKey);
    }
  }

  saveLocalData() {
    try {
      localStorage.setItem(this.data.localStorageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save cache:', e);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new CommodityDashboard());
