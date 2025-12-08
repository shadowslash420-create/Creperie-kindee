(function() {
  'use strict';

  const morphShapes = {
    blob1: [
      'M60,10 Q90,20 85,50 Q95,80 60,90 Q25,85 15,55 Q10,25 60,10',
      'M55,5 Q95,15 90,45 Q100,85 55,95 Q10,90 5,50 Q5,15 55,5',
      'M65,8 Q88,25 82,55 Q92,78 65,88 Q30,82 20,52 Q15,22 65,8'
    ],
    blob2: [
      'M50,15 Q85,10 90,50 Q88,90 50,85 Q12,88 10,50 Q15,15 50,15',
      'M45,10 Q88,18 92,52 Q85,92 45,88 Q8,85 5,48 Q12,8 45,10',
      'M52,12 Q82,8 88,48 Q90,88 52,92 Q18,90 12,52 Q10,18 52,12'
    ],
    blob3: [
      'M48,8 Q88,15 85,48 Q90,85 48,92 Q10,88 8,52 Q5,18 48,8',
      'M52,5 Q92,12 88,52 Q92,90 52,95 Q8,92 5,48 Q8,12 52,5',
      'M50,10 Q85,18 82,50 Q88,82 50,88 Q15,85 10,50 Q12,15 50,10'
    ]
  };

  const config = {
    morphDuration: 4000,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  let currentMorphIndex = 0;
  let morphAnimationFrames = [];
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;

  function createSVGElement(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  function createMorphBlob(id, paths, color, opacity, size, position) {
    const svg = createSVGElement('svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.classList.add('morph-blob');
    svg.id = id;
    
    Object.assign(svg.style, {
      position: 'absolute',
      width: size,
      height: size,
      opacity: opacity,
      pointerEvents: 'none',
      zIndex: '0',
      willChange: 'transform',
      transform: 'translate3d(0,0,0)',
      ...position
    });

    const path = createSVGElement('path');
    path.setAttribute('d', paths[0]);
    path.setAttribute('fill', color);
    path.style.transition = `d ${config.morphDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    
    svg.appendChild(path);
    return svg;
  }

  function morphPath(pathElement, shapes, index) {
    if (config.reducedMotion) return;
    const nextShape = shapes[index % shapes.length];
    pathElement.setAttribute('d', nextShape);
  }

  function initHeroMorphShapes() {
    const heroSection = document.querySelector('.home-hero');
    if (!heroSection) return;

    heroSection.style.position = 'relative';
    heroSection.style.overflow = 'hidden';

    const blob1 = createMorphBlob(
      'hero-blob-1',
      morphShapes.blob1,
      'rgba(227, 6, 19, 0.08)',
      '0.6',
      '400px',
      { top: '-100px', left: '-100px' }
    );

    const blob2 = createMorphBlob(
      'hero-blob-2',
      morphShapes.blob2,
      'rgba(255, 107, 53, 0.06)',
      '0.5',
      '350px',
      { bottom: '-80px', right: '-80px' }
    );

    const blob3 = createMorphBlob(
      'hero-blob-3',
      morphShapes.blob3,
      'rgba(255, 215, 0, 0.05)',
      '0.4',
      '300px',
      { top: '50%', left: '50%', transform: 'translate3d(-50%, -50%, 0)' }
    );

    heroSection.insertBefore(blob1, heroSection.firstChild);
    heroSection.insertBefore(blob2, heroSection.firstChild);
    heroSection.insertBefore(blob3, heroSection.firstChild);

    startMorphAnimations([
      { element: blob1.querySelector('path'), shapes: morphShapes.blob1 },
      { element: blob2.querySelector('path'), shapes: morphShapes.blob2 },
      { element: blob3.querySelector('path'), shapes: morphShapes.blob3 }
    ]);
  }

  function initOfferingCardShapes() {
    const offeringCards = document.querySelectorAll('.offering-card');
    
    offeringCards.forEach((card, index) => {
      card.style.position = 'relative';
      card.style.overflow = 'hidden';
      
      const miniBlob = createMorphBlob(
        `offering-blob-${index}`,
        morphShapes.blob1,
        'rgba(227, 6, 19, 0.04)',
        '0.3',
        '150px',
        { top: '-50px', right: '-50px' }
      );
      
      card.insertBefore(miniBlob, card.firstChild);
      
      card.addEventListener('mouseenter', () => {
        miniBlob.style.transform = 'translate3d(0, 0, 0) scale(1.3) rotate(15deg)';
      }, { passive: true });
      
      card.addEventListener('mouseleave', () => {
        miniBlob.style.transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
      }, { passive: true });
    });
  }

  function startMorphAnimations(blobs) {
    if (config.reducedMotion) return;

    blobs.forEach((blob, index) => {
      let lastMorphTime = Date.now();
      
      function animate() {
        const now = Date.now();
        if (now - lastMorphTime >= config.morphDuration) {
          currentMorphIndex++;
          morphPath(blob.element, blob.shapes, currentMorphIndex + index);
          lastMorphTime = now;
        }
        morphAnimationFrames.push(requestAnimationFrame(animate));
      }
      
      animate();
    });
  }

  function triggerSwipeMorph(direction) {
    if (config.reducedMotion) return;
    
    const blobs = document.querySelectorAll('.morph-blob path');
    blobs.forEach((path, index) => {
      const shapes = Object.values(morphShapes)[index % 3];
      currentMorphIndex = direction === 'left' ? currentMorphIndex + 1 : currentMorphIndex - 1;
      if (currentMorphIndex < 0) currentMorphIndex = shapes.length - 1;
      morphPath(path, shapes, Math.abs(currentMorphIndex));
    });

    const heroContent = document.querySelector('.home-hero-content');
    if (heroContent) {
      const offset = direction === 'left' ? -10 : 10;
      heroContent.style.transform = `translate3d(${offset}px, 0, 0)`;
      
      setTimeout(() => {
        heroContent.style.transform = 'translate3d(0, 0, 0)';
      }, 300);
    }
  }

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }

  function handleTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const deltaTime = touchEndTime - touchStartTime;
    
    const velocity = Math.abs(deltaX) / deltaTime;
    
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) && velocity > 0.3) {
      const direction = deltaX > 0 ? 'right' : 'left';
      triggerSwipeMorph(direction);
    }
  }

  function handleMouseMove(e) {
    if (config.reducedMotion) return;
    
    const now = Date.now();
    if (now - lastMouseX < 16) return;
    
    lastMouseX = now;
    
    const heroSection = document.querySelector('.home-hero');
    if (!heroSection) return;
    
    const rect = heroSection.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const blobs = heroSection.querySelectorAll('.morph-blob');
    blobs.forEach((blob, index) => {
      const offsetX = (x - 0.5) * 20 * (index + 1);
      const offsetY = (y - 0.5) * 15 * (index + 1);
      blob.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
    });
  }

  function initSwipeListeners() {
    const heroSection = document.querySelector('.home-hero');
    if (!heroSection) return;

    heroSection.addEventListener('touchstart', handleTouchStart, { passive: true });
    heroSection.addEventListener('touchend', handleTouchEnd, { passive: true });
    heroSection.addEventListener('mousemove', handleMouseMove, { passive: true });
  }

  function addMorphStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .morph-blob {
        transform: translate3d(0,0,0) !important;
        will-change: transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        perspective: 1000px;
      }
      
      .morph-blob path {
        transform: translate3d(0,0,0);
        will-change: d;
      }
      
      @media (prefers-reduced-motion: reduce) {
        .morph-blob,
        .morph-blob path {
          will-change: auto !important;
        }
      }
      
      .home-hero {
        position: relative;
        overflow: hidden;
      }
      
      .home-hero-content {
        position: relative;
        z-index: 1;
        will-change: transform;
        transform: translate3d(0,0,0);
      }
      
      .offering-card {
        position: relative;
        overflow: hidden;
      }
      
      .offering-card .morph-blob {
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        will-change: transform;
      }
      
      @keyframes floatBlob {
        0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        50% { transform: translate3d(0, -15px, 0) rotate(3deg); }
      }
      
      .morph-blob.animate-float {
        animation: floatBlob 6s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initAll, 2500);
      });
    } else {
      setTimeout(initAll, 2500);
    }
  }

  function initAll() {
    addMorphStyles();
    initHeroMorphShapes();
    initOfferingCardShapes();
    initSwipeListeners();
    
    setTimeout(() => {
      const blobs = document.querySelectorAll('.morph-blob');
      blobs.forEach((blob, index) => {
        setTimeout(() => {
          blob.classList.add('animate-float');
        }, index * 200);
      });
    }, 1000);
  }

  window.morphAnimations = {
    triggerSwipeMorph,
    pause: () => morphAnimationFrames.forEach(id => cancelAnimationFrame(id)),
    resume: () => initHeroMorphShapes()
  };

  init();
})();
