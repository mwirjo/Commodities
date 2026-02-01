document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleBtn');
  const dredge = document.getElementById('dredge');
  const dry = document.getElementById('dry');

  toggleBtn.addEventListener('click', () => {
    if (dredge.classList.contains('hidden')) {
      dredge.classList.remove('hidden');
      dry.classList.add('hidden');
      toggleBtn.textContent = 'Show Dry Mining';
    } else {
      dredge.classList.add('hidden');
      dry.classList.remove('hidden');
      toggleBtn.textContent = 'Show Dredge Mining';
    }
  });
});
