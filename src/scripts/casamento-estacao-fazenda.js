/* Scripts da página Casamento Estação Fazenda (duplicado de casamentos.js — não compartilhar entre as páginas) */

(function(){
  // ---- reveal on scroll ----
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold:0.12 });
    document.querySelectorAll('[data-reveal]').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function(el){ el.classList.add('is-visible'); });
  }

  // ---- carrossel de depoimentos ----
  var track = document.getElementById('testiTrack');
  if (track) {
    var prevBtn = document.getElementById('testiPrev');
    var nextBtn = document.getElementById('testiNext');
    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', function(){
        track.scrollBy({ left: -(track.clientWidth*0.8), behavior:'smooth' });
      });
      nextBtn.addEventListener('click', function(){
        track.scrollBy({ left: (track.clientWidth*0.8), behavior:'smooth' });
      });
    }
  }

  // ---- carrossel da galeria no mobile ----
  var galleryCarousel = document.querySelector('.gallery-carousel');
  var galleryTrack = document.querySelector('.gallery-track');
  var gallerySlides = document.querySelectorAll('.gallery-track img');
  if (galleryCarousel && galleryTrack && gallerySlides.length > 0) {
    var galleryIndex = 0;

    function updateGallery() {
      if (window.innerWidth <= 768) {
        galleryTrack.style.transform = 'translateX(' + (-galleryIndex * 100) + '%)';
      } else {
        galleryTrack.style.transform = 'none';
      }
    }

    function galleryPrev() {
      if (galleryIndex > 0) {
        galleryIndex--;
      } else {
        galleryIndex = gallerySlides.length - 1;
      }
      updateGallery();
    }

    function galleryNext() {
      if (galleryIndex < gallerySlides.length - 1) {
        galleryIndex++;
      } else {
        galleryIndex = 0;
      }
      updateGallery();
    }

    // Setas de navegação (mobile)
    var galleryPrevBtn = document.getElementById('galleryPrev');
    var galleryNextBtn = document.getElementById('galleryNext');
    if (galleryPrevBtn) galleryPrevBtn.addEventListener('click', galleryPrev);
    if (galleryNextBtn) galleryNextBtn.addEventListener('click', galleryNext);

    // Touch support for mobile swipe
    var gStartX = 0;
    var gIsSwiping = false;

    galleryCarousel.addEventListener('touchstart', function(e) {
      if (window.innerWidth > 768) return;
      gStartX = e.touches[0].clientX;
      gIsSwiping = true;
    }, { passive: true });

    galleryCarousel.addEventListener('touchend', function(e) {
      if (!gIsSwiping || window.innerWidth > 768) return;
      var diffX = e.changedTouches[0].clientX - gStartX;
      if (Math.abs(diffX) > 40) { // threshold of 40px
        if (diffX > 0) {
          galleryPrev(); // Swipe right -> show previous
        } else {
          galleryNext(); // Swipe left -> show next
        }
      }
      gIsSwiping = false;
    });

    // Handle screen resize to reset transform on desktop
    window.addEventListener('resize', function(){
      if (window.innerWidth > 768) {
        galleryIndex = 0;
        galleryTrack.style.transform = '';
      }
    });
  }
})();