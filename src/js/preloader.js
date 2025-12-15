document.addEventListener('DOMContentLoaded', () => {
    console.log('🔥 PRELOADER: DOM Loaded');
    
    const TIMING = {
        INTRO_SCREEN: 5000,
        LOADER_DURATION: 5000,
        TEAM_SCREEN: 8000,
        TRANSITION_DELAY: 500,
        SPOTLIGHT_INTERVAL: 2000
    };
    
    const preloader = document.getElementById('preloader');
    const introScreen = document.getElementById('intro-screen');
    const teamScreen = document.getElementById('team-screen');
    const loaderFill = document.getElementById('loader-fill');
    const tiImage = document.querySelector('.ti-image');
    const presentationBtn = document.querySelector('.presentation-btn');
    
    let loaderInterval, spotlightInterval, carouselTrack;
    
    function startPresentation() {
        console.log('🎬 PRESENTATION STARTED!');
        
        if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
        else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen();
        
        presentationBtn.style.display = 'none';
        preloader.style.display = 'block';
        
        introScreen.classList.add('active');
        teamScreen.classList.remove('active');
        
        setTimeout(() => startLoader(), TIMING.INTRO_SCREEN);
    }
    
    function startLoader() {
        console.log(`🚀 START LOADER (${TIMING.LOADER_DURATION / 1000}s)`);
        let progress = 0;
        const increment = 100 / (TIMING.LOADER_DURATION / 300);
        
        loaderInterval = setInterval(() => {
            progress += increment;
            loaderFill.style.width = Math.min(progress, 100) + '%';
            console.log(`⏳ Loader: ${Math.round(progress)}%`);
            
            if (progress >= 100) {
                clearInterval(loaderInterval);
                console.log('✅ LOADER COMPLETE → TEAM');
                setTimeout(() => {
                    introScreen.classList.remove('active');
                    teamScreen.classList.add('active');
                    startTeamCarousel();
                }, TIMING.TRANSITION_DELAY);
            }
        }, 300);
    }
    
    function startTeamCarousel() {
        carouselTrack = document.querySelector('.team-carousel-track');
        const teamMembers = document.querySelectorAll('.team-member');
        let currentMember = 0;
        
        console.log('🎮 STARTING TEAM CAROUSEL');
        
        spotlightInterval = setInterval(() => {
            // Remove previous selection
            teamMembers.forEach(member => {
                member.classList.remove('selected');
                const h3 = member.querySelector('h3'), p = member.querySelector('p');
                if (h3) h3.classList.remove('selected');
                if (p) p.classList.remove('selected');
            });
            
            // Select current member
            if (teamMembers[currentMember]) {
                teamMembers[currentMember].classList.add('selected');
                const h3 = teamMembers[currentMember].querySelector('h3');
                const p = teamMembers[currentMember].querySelector('p');
                if (h3) h3.classList.add('selected');
                if (p) p.classList.add('selected');
                
                // Slide to center
                const memberWidth = 220; // Fixed width for smooth movement
                const offset = -(currentMember * (memberWidth + 100));
                if (carouselTrack) {
                    carouselTrack.style.transform = `translateX(${offset}px)`;
                }
                
                console.log(`🚗 Selected: Member ${currentMember + 1}`);
            }
            
            currentMember = (currentMember + 1) % teamMembers.length;
        }, TIMING.SPOTLIGHT_INTERVAL);
        
        // Redirect after team time
        setTimeout(() => {
            clearInterval(spotlightInterval);
            console.log('🏁 TEAM COMPLETE → HOMEPAGE');
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            window.location.href = 'homepage.html';
        }, TIMING.TEAM_SCREEN);
    }
    
    function imageClickHandler() {
        console.log('🖱️ IMAGE CLICKED!');
        tiImage.style.animation = 'spin 1.2s forwards';
        if (loaderInterval) clearInterval(loaderInterval);
        setTimeout(() => {
            introScreen.classList.remove('active');
            teamScreen.classList.add('active');
            startTeamCarousel();
        }, 1200);
    }
    
    presentationBtn.onclick = startPresentation;
    tiImage.addEventListener('click', imageClickHandler);
});
