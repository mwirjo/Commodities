// 🔥 TITANIUM 8.5-YEAR GEOLOGY DASHBOARD - COMPLETE PRODUCTION READY (ALL BUGS FIXED)
class CommodityDashboard {
  constructor() {
    this.apiKey = import.meta.env.VITE_METALPRICE_KEY || 'demo-key';
    
    // ✅ FIXED: Proper CORS proxy handling for production
    this.apiBase = import.meta.env.DEV 
      ? '/commoditic/api/v1'  // Vite proxy
      : 'https://corsproxy.io/?'; // Production CORS proxy
    
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
    this.addFrequencyToggle();
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
    this.updateStatus('🔄 Loading Titanium 8.5-YEAR MONTHLY data...', 'loading');

    try {
      const [currentData, historicalData] = await Promise.all([
        this.fetchCurrentPrice(),
        this.fetchHistoricalData('month')
      ]);

      this.data.current = currentData;
      this.data.historical = this.sanitizePrices(historicalData);
      this.data.advanced = this.calculateAdvancedStats(this.data.historical);

      console.log('📊 TITANIUM 8.5-YEAR:', {
        months: historicalData.length,
        years: this.data.advanced.years,
        low: `$${this.data.advanced.cycleLow}`,
        high: `$${this.data.advanced.cycleHigh}`,
        rec: this.data.advanced.recommendation?.text
      });

      this.saveLocalData();
      this.updateAll();
      this.updateStatus(`✅ ${historicalData.length} MONTHS loaded (2017-${this.dateTo.slice(0,4)})`, 'success');
    } catch (error) {
      console.error('API Error:', error);
      this.updateStatus('❌ API error - Check trial limit', 'error');
    }
  }

  async fetchCurrentPrice() {
    const targetUrl = `https://api.commoditic.com/api/v1/commodities?key=${this.apiKey}&name=${this.commodity}`;
    const url = import.meta.env.DEV ? 
      `/commoditic/api/v1/commodities?key=${this.apiKey}&name=${this.commodity}` :
      `${this.apiBase}${encodeURIComponent(targetUrl)}`;

    console.log('🔍 FETCHING LIVE PRICE FROM:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📡 LIVE RAW RESPONSE:', data);
    const result = Array.isArray(data) ? data[0] || {} : data.results?.[0] || {};
    const apiUnit = result.unit || 'cny/kg';
    
    return {
      price: parseFloat(result.price || 0),
      unit: apiUnit,
      day_price_change: parseFloat(result.day_price_change || 0),
      d_perc_change: parseFloat(result.d_perc_change || result.w_perc_change || 0),
      w_perc_change: parseFloat(result.w_perc_change || 0),
      m_perc_change: parseFloat(result.m_perc_change || 0),
      y_perc_change: parseFloat(result.y_perc_change || 0),
      q1_forecast: parseFloat(result.q1_26 || 0),
      q2_forecast: parseFloat(result.q2_26 || 0),
      q3_forecast: parseFloat(result.q3_26 || 0),
      q4_forecast: parseFloat(result.q4_26 || 0),
      rawUnit: apiUnit
    };
  }

  async fetchHistoricalData(freq = 'month') {
    const config = {
      'month': { from: '2017-07-13', to: '2026-01-08', max: 1000 },
      'week':  { from: '2022-01-01', to: '2026-01-08', max: 200 },
      'day':   { from: '2025-01-01', to: '2026-01-08', max: 365 }
    };
    
    const settings = config[freq] || config.month;
    const targetUrl = `https://api.commoditic.com/api/v1/commodities_history?key=${this.apiKey}&name=${this.commodity}&date_from=${settings.from}&date_to=${settings.to}&frequency=${freq}`;
    const url = import.meta.env.DEV ? 
      `/commoditic/api/v1/commodities_history?key=${this.apiKey}&name=${this.commodity}&date_from=${settings.from}&date_to=${settings.to}&frequency=${freq}` :
      `${this.apiBase}${encodeURIComponent(targetUrl)}`;
    
    console.log('📈 FETCHING:', freq.toUpperCase(), url);
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      console.log('📡 RAW:', data);
      
      let prices = [];
      if (data.output?.[0]?.prices) {
        prices = data.output[0].prices;
      } else if (Array.isArray(data.output)) {
        prices = data.output;
      } else if (data.result?.output?.prices) {
        prices = data.result.output.prices;
      }
      
      console.log(`📊 ${freq.toUpperCase()} POINTS:`, prices.length);
      
      // ✅ FIXED: Proper map/filter chain
      const rawMapped = prices
        .map(p => ({ 
          date: p.date, 
          price: parseFloat(p.price || 0),
          unit: 'cny/kg',
          frequency: freq
        }))
        .filter(p => p.price > 0 && !isNaN(p.price));

      const processed = this.sanitizePrices(rawMapped)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, settings.max);
      
      console.log('✅ FINAL:', processed.length, 'points');
      return processed;
      
    } catch (error) {
      console.error('❌ HISTORICAL ERROR:', error);
      this.updateStatus(`❌ ${freq} data failed`, 'error');
      return [];
    }
  }

  calculateAdvancedStats(historical) {
    const prices = historical.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
    if (prices.length < 6) {
      return this.getInsufficientDataStats(historical.length);
    }

    const startDate = new Date(historical[0]?.date);
    const endDate = new Date(historical[historical.length - 1]?.date);
    const actualDaysSpan = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const yearsSpan = (actualDaysSpan / 365.25).toFixed(1);

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

  
  sanitizePrices(prices) {
  if (prices.length < 3) return prices;
  
  const values = prices.map(p => parseFloat(p.price)).filter(v => !isNaN(v) && v > 0);
  if (values.length === 0) return [];
  
  const sorted = [...values].sort((a,b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // 🔥 FIXED: Much higher borders for charts
  const minPrice = median * 0.01;  // 1% of median (was 10%)
  const maxPrice = median * 20;    // 20x median (was 5x)
  
  console.log(`🧹 SANITIZE: median=${median.toFixed(2)}, range=[${minPrice.toFixed(2)}-${maxPrice.toFixed(2)}]`);
  
  return prices.filter(p => {
    const val = parseFloat(p.price);
    const keep = val >= minPrice && val <= maxPrice && val > 0 && !isNaN(val);
    if (!keep) console.log(`❌ FILTERED: ${p.date} $${val.toFixed(2)}`);
    return keep;
  });
}


  getInsufficientDataStats(dataPoints) {
    return {
      volatility: 'N/A',
      rsi: 'N/A',
      ma20: 'N/A',
      totalChange: 0,
      cycleLow: 'N/A',
      cycleHigh: 'N/A',
      years: 0,
      dataPoints,
      daysSpan: 0,
      recommendation: { 
        text: 'Insufficient data', 
        mining: 'N/A', 
        stocks: 'N/A', 
        score: 0, 
        reasons: [] 
      }
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

  calculateMovingAverage(prices, period) {
    return prices.map((price, i) => {
      if (i < period - 1) return 0;
      const slice = prices.slice(i - period + 1, i + 1);
      return slice.reduce((a, b) => a + b, 0) / slice.length;
    });
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

    if (current > 20) { score += 3; reasons.push('💰 >$20 = Viable'); }
    if (current > 35) { score += 2; reasons.push('📊 >$35 = Strong'); }
    if (current > cycleHigh * 0.85) { score += 2; reasons.push(`🎯 Near cycle high (${(priceVsCycleHigh * 100).toFixed(0)}%)`); }

    if (rsi && rsi > 40 && rsi < 70) { score += 1; reasons.push(`✅ RSI ${rsi.toFixed(0)} (neutral zone)`); }
    if (current > ma6) { score += 2; reasons.push('📈 > MA6 = Profitable'); }
    if (ma6 > ma24) { score += 1; reasons.push('🔥 MA6>MA24 = Bull confirmed'); }

    if (volatility < 12) { score += 1; reasons.push(`✅ Vol ${volatility.toFixed(1)}% (manageable)`); }
    if (this.calculateVolatility(prices.slice(-6)) < 6) { score += 1; reasons.push('🟢 6m vol LOW = Stable ops'); }

    if (current < cycleLow * 1.5) { score -= 1; reasons.push('⚠️ Near cycle low zone'); }
    if (volatility > 15) { score -= 2; reasons.push(`❌ Vol ${volatility.toFixed(1)}% = High risk`); }

    const text = score >= 7 ? '🟢 MAX PRODUCTION + EXPLORE NEW' : 
                 score >= 4 ? '🟢 RUN FULL + HEDGE 20%' : 
                 score >= 1 ? '🟡 MAINTAIN + MONITOR' : '🔴 SHUT DOWN';

    return {
      text,
      mining: score >= 7 ? 'MAX+EXPLORE' : score >= 4 ? 'FULL+HEDGE' : score >= 1 ? 'MAINTAIN' : 'SHUTDOWN',
      stocks: score >= 7 ? 'BUY' : score >= 4 ? 'HOLD' : score >= 1 ? 'PARTIAL' : 'SELL',
      score,
      reasons,
      keyMetrics: { 
        current, 
        ma6: ma6.toFixed(1), 
        ma24: ma24.toFixed(1), 
        rsi: rsi?.toFixed(0), 
        vol: volatility.toFixed(1) 
      }
    };
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
    const current = this.data.current || 
                    (this.data.historical.length ? this.data.historical.slice(-1)[0] : null);
    
    if (!current) return;

    // Current price
    const priceEl = document.getElementById('currentPrice');
    if (priceEl) {
      const symbol = current.unit === 'USD/t' ? '$' : '¥';
      priceEl.textContent = `${symbol}${current.price?.toLocaleString() || 0} ${current.unit}`;
    }

    // Daily change
    const dayChange = current.day_price_change;
    const dailyEl = document.getElementById('dailyChange');
    if (dailyEl && dayChange !== undefined) {
      dailyEl.textContent = dayChange >= 0 ? `+${dayChange.toFixed(2)}%` : `${dayChange.toFixed(2)}%`;
      dailyEl.className = `price-change ${dayChange >= 0 ? 'positive' : 'negative'}`;
    }

    // Weekly change
    const weekChange = current.w_perc_change || current.d_perc_change;
    const weeklyEl = document.getElementById('weeklyChange');
    if (weeklyEl && weekChange !== undefined) {
      weeklyEl.textContent = `${weekChange.toFixed(2)}%`;
      weeklyEl.className = `change-display ${weekChange >= 0 ? 'positive' : 'negative'}`;
    }

    // Monthly change
    const monthEl = document.getElementById('monthChange');
    if (monthEl && current.m_perc_change !== undefined) {
      monthEl.textContent = `${current.m_perc_change >= 0 ? '+' : ''}${current.m_perc_change.toFixed(2)}%`;
      monthEl.className = `change-display ${current.m_perc_change >= 0 ? 'positive' : 'negative'}`;
    }

    // Yearly change
    const yearEl = document.getElementById('yearChange');
    if (yearEl && current.y_perc_change !== undefined) {
      yearEl.textContent = `${current.y_perc_change >= 0 ? '+' : ''}${current.y_perc_change.toFixed(2)}%`;
      yearEl.className = `change-display ${current.y_perc_change >= 0 ? 'positive' : 'negative'}`;
    }

    // Trend indicator
    const trendEl = document.getElementById('trendIndicator');
    if (trendEl) {
      const prices = this.data.historical.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
      const change = prices.length > 1 ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 : 0;
      const text = change > 100 ? '📈 8.5yr BULL' : change > 0 ? '➡️ STABIL' : '📉 BEAR';
      trendEl.textContent = text;
      trendEl.className = `trend-indicator trend-${change >= 0 ? 'positive' : 'negative'}`;
      trendEl.title = `${change.toFixed(1)}% (${prices.length} MONTHS)`;
    }

    // 2026 Forecast
    ['q1Forecast', 'q2Forecast', 'q3Forecast', 'q4Forecast'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const forecastKey = id.replace('Forecast', '').toLowerCase() + '_forecast';
        const forecastValue = current[forecastKey];
        el.textContent = forecastValue ? `${forecastValue.toLocaleString()} ${current.unit}` : '-';
      }
    });
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
    const summary = `Titanium Live: <strong>$${today.toLocaleString()}</strong> | ${parseFloat(stats.totalChange) > 0 ? '📈' : '📉'} ${Math.abs(parseFloat(stats.totalChange)).toFixed(1)}% | RSI ${stats.rsi} | Vol ${stats.volatility} | <strong>${rec.text}</strong><br><small>Mining: ${rec.mining} | Stocks: ${rec.stocks} | ${stats.cycleLow}→${stats.cycleHigh}</small>`;

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
      <div class="glossary-item"><span class="term">MA6</span><span>6-month average</span></div>
      <div class="glossary-item"><span class="term">RSI</span><span>6-month (45-65 = mining zone)</span></div>
      <div class="glossary-item"><span class="term">Volatility</span><span>Monthly risk (12x annualized)</span></div>
    `;
  }

  updateTable() {
    const hist = this.data.historical.slice(-12);
    const tbody = document.querySelector('#priceTable tbody');
    if (!tbody || !hist.length) return;

    tbody.innerHTML = hist.map((p, i) => {
      const price = parseFloat(p.price);
      const prevPrice = i > 0 ? parseFloat(hist[i - 1].price) : price;
      const monthChange = prevPrice ? ((price - prevPrice) / prevPrice * 100) : 0;
      const trendClass = monthChange >= 0 ? 'positive' : 'negative';

      return `
        <tr>
          <td>${new Date(p.date).toLocaleDateString('en-US')}</td>
          <td>$${price.toLocaleString()}</td>
          <td class="${trendClass}">${monthChange >= 0 ? '+' : ''}${monthChange.toFixed(2)}%</td>
          <td class="trend ${trendClass}">${monthChange >= 0 ? '📈' : '📉'}</td>
        </tr>
      `;
    }).join('');
  }

  addFrequencyToggle() {
    const frequencies = ['month', 'week', 'day'];
    frequencies.forEach(freq => {
      const btn = document.getElementById(`freq-${freq}`);
      if (btn) {
        btn.addEventListener('click', () => {
          frequencies.forEach(f => document.getElementById(`freq-${f}`)?.classList.remove('active'));
          btn.classList.add('active');
          this.loadFrequency(freq);
        });
      }
    });
  }

  async loadFrequency(freq) {
    this.updateStatus(`🔄 Loading ${freq.toUpperCase()} data...`, 'loading');
    try {
      const hist = await this.fetchHistoricalData(freq);
      this.data.historical = this.sanitizePrices(hist);
      this.data.advanced = this.calculateAdvancedStats(this.data.historical);
      this.updateAll();
      this.updateStatus(`✅ ${hist.length} ${freq} points loaded`, 'success');
    } catch (error) {
      console.error(error);
      this.updateStatus(`❌ ${freq} failed`, 'error');
    }
  }

  updateCharts() {
  if (typeof Chart === 'undefined' || !this.data.historical.length) return;

  this.destroyCharts();
  const prices = this.data.historical.map(p => parseFloat(p.price));
  const ma6 = this.calculateMovingAverage(prices, 6);
  const ma24 = this.calculateMovingAverage(prices, Math.min(24, prices.length));

  // 🔥 1. 8.5YR PRICE CHART - RESTORED TO ORIGINAL WORKING VERSION
  const priceCtx = document.getElementById('priceChart')?.getContext('2d');
  if (priceCtx) {
    this.charts.price = new Chart(priceCtx, {
      type: 'line',
      data: {
        labels: this.data.historical.map(p => new Date(p.date).toLocaleDateString('nl-NL')),
        datasets: [{
          label: 'Titanium (8.5yr)', 
          data: prices,
          borderColor: '#4682b4', 
          backgroundColor: 'rgba(70, 130, 180, 0.1)',
          fill: true, 
          tension: 0.3,
          pointRadius: 1.5
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { maxTicksLimit: 20 } }, // Show more ticks for 8.5yr
          y: { ticks: { callback: value => `¥${value.toLocaleString()}` } }
        }
      }
    });
  }

  // ✅ 2. YEARLY AVERAGE - FIXED PROPERLY (your 1yr/2yr still work)
  const yearlyCtx = document.getElementById('yearlyChart')?.getContext('2d');
  if (yearlyCtx) {
    const yearlyAvg = [];
    for (let i = 0; i <= 8; i++) {
      const year = 2017 + i;
      const yearData = this.data.historical.filter(p => {
        const dateYear = new Date(p.date).getFullYear();
        return dateYear === year && parseFloat(p.price) > 0;
      });
      yearlyAvg.push(yearData.length ? 
        yearData.reduce((sum, p) => sum + parseFloat(p.price), 0) / yearData.length : 0
      );
    }
    
    console.log('📊 YEARLY AVERAGES:', yearlyAvg.map((v,i) => `20${17 + i}: ${v.toFixed(1)}`));
    
    this.charts.yearly = new Chart(yearlyCtx, {
      type: 'line',
      data: {
        labels: ['17', '18', '19', '20', '21', '22', '23', '24', '25'],
        datasets: [{ 
          label: 'Yearly Average', 
          data: yearlyAvg, 
          borderColor: '#4682b4', 
          backgroundColor: 'rgba(70, 130, 180, 0.2)',
          fill: true, 
          tension: 0.4 
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 3. MA COMPARISON (1-2yr - UNCHANGED, works perfectly)
  const maCtx = document.getElementById('maComparisonChart')?.getContext('2d');
  if (maCtx) {
    const recent180 = prices.slice(-Math.min(180, prices.length));
    const recentLabels = this.data.historical.slice(-Math.min(180, prices.length)).map(p => new Date(p.date).toLocaleDateString('nl-NL'));

    this.charts.maComparison = new Chart(maCtx, {
      type: 'line',
      data: {
        labels: recentLabels,
        datasets: [
          { label: 'Price', data: recent180, borderColor: '#4682b4', backgroundColor: 'rgba(70, 130, 180, 0.1)', fill: true, tension: 0.4, pointRadius: 0 },
          { label: 'MA6', data: ma6.slice(-Math.min(180, ma6.length)), borderColor: '#4ecdc4', borderWidth: 3, tension: 0.4, pointRadius: 0, fill: false },
          { label: 'MA24', data: ma24.slice(-Math.min(180, ma24.length)), borderColor: '#ff6b6b', borderWidth: 3, tension: 0.4, pointRadius: 0, fill: false }
        ]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        scales: { x: { ticks: { maxTicksLimit: 12 } }, y: { ticks: { callback: value => `¥${value.toLocaleString()}` } } },
        interaction: { intersect: false, mode: 'index' }
      }
    });
  }

  // 4. VOLATILITY CHART (unchanged)
  const volCtx = document.getElementById('volatilityChart')?.getContext('2d');
  if (volCtx) {
    const volFull = this.calculateVolatility(prices);
    const vol2yr = this.calculateVolatility(prices.slice(-24));
    const vol6mo = this.calculateVolatility(prices.slice(-6));

    this.charts.volatility = new Chart(volCtx, {
      type: 'doughnut',
      data: {
        labels: ['8.5yr', '2yr', '6m'],
        datasets: [{ data: [volFull, vol2yr, vol6mo], backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1'] }]
      },
      options: { responsive: true, maintainAspectRatio: false }
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

document.addEventListener('DOMContentLoaded', () => {
  new CommodityDashboard();
});
