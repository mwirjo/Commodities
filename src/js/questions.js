// questions.html - Quiz from ti.json + API data
const answers = JSON.parse(localStorage.getItem('ti-answers') || '[]');
if (answers.length === 5) window.location.href = 'thank-you.html'; // Completion

// thank-you.html shows: "Perfect! Group 5 Ti Report Complete ✅ +5 Gems"
