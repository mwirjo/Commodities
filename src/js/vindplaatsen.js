document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const nextBtn = document.getElementById('nextSlideBtn');

    let currentSlide = 0;

    // Show first slide
    slides[currentSlide].classList.remove('hidden');

    nextBtn.addEventListener('click', () => {
        slides[currentSlide].classList.add('hidden');

        currentSlide++;

        // Loop back to start
        if (currentSlide >= slides.length) {
            currentSlide = 0;
        }

        slides[currentSlide].classList.remove('hidden');
    });
});
// Image cycling on click
document.querySelectorAll('.cycle-image').forEach(img => {
  const images = img.dataset.images.split(',');
  let index = 0;

  img.style.cursor = 'pointer';

  img.addEventListener('click', () => {
    index = (index + 1) % images.length;
    img.src = images[index].trim();
  });
});
