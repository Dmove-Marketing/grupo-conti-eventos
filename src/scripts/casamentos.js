/* Scripts extraídos de casamentos.html e adaptados */

(function(){
  // ---- nav: padding + fundo ao rolar ----
  var nav = document.getElementById('nav');
  function onScroll(){
    if(window.scrollY > 30){ nav.classList.add('is-scrolled'); }
    else { nav.classList.remove('is-scrolled'); }
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

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

  // ---- carrossel dos espaços (venue carousels) ----
  document.querySelectorAll('.venue-carousel').forEach(function(carousel){
    var vTrack = carousel.querySelector('.venue-carousel-track');
    var slides = carousel.querySelectorAll('.venue-carousel-track img');
    var prev = carousel.querySelector('.venue-carousel-btn.prev');
    var next = carousel.querySelector('.venue-carousel-btn.next');
    if (!vTrack || slides.length === 0) return;

    var currentIndex = 0;

    function update() {
      vTrack.style.transform = 'translateX(' + (-currentIndex * 100) + '%)';
    }

    if (prev && next) {
      prev.addEventListener('click', function(e){
        e.preventDefault();
        if (currentIndex > 0) {
          currentIndex--;
        } else {
          currentIndex = slides.length - 1;
        }
        update();
      });

      next.addEventListener('click', function(e){
        e.preventDefault();
        if (currentIndex < slides.length - 1) {
          currentIndex++;
        } else {
          currentIndex = 0;
        }
        update();
      });
    }

    // Touch support for mobile swipe
    var startX = 0;
    var isSwiping = false;

    carousel.addEventListener('touchstart', function(e) {
      startX = e.touches[0].clientX;
      isSwiping = true;
    }, { passive: true });

    carousel.addEventListener('touchend', function(e) {
      if (!isSwiping) return;
      var diffX = e.changedTouches[0].clientX - startX;
      if (Math.abs(diffX) > 40) { // threshold of 40px
        if (diffX > 0) {
          // Swipe right -> show previous
          if (currentIndex > 0) {
            currentIndex--;
          } else {
            currentIndex = slides.length - 1;
          }
        } else {
          // Swipe left -> show next
          if (currentIndex < slides.length - 1) {
            currentIndex++;
          } else {
            currentIndex = 0;
          }
        }
        update();
      }
      isSwiping = false;
    });
  });

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