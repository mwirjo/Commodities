document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleBtn');
    const natuurlijke = document.getElementById('natuurlijke');
    const geologie = document.getElementById('vorming');

    toggleBtn.addEventListener('click', () => {
        if (natuurlijke.classList.contains('hidden')) {
            // Show Natuurlijke Titaan
            natuurlijke.classList.remove('hidden');
            geologie.classList.add('hidden');
            toggleBtn.textContent = 'naar Geologische Vorming';
        } else {
            // Show Geologische Vorming
            natuurlijke.classList.add('hidden');
            geologie.classList.remove('hidden');
            toggleBtn.textContent = 'naar Natuurlijke Titaan';
        }
    });
});
