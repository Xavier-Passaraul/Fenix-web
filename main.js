/* ============================================================
   FENIX SALÓN UNISEX — main.js
   JavaScript principal compartido entre index.html y admin.html

   Módulos:
   1.  Cursor personalizado
   2.  Navegación (scroll + hamburger)
   3.  Reveal on scroll (IntersectionObserver)
   4.  Hero: entrada animada
   5.  Galería: drag-to-scroll + pausa/reanuda
   6.  Admin: dropzone, preview grid, localStorage
   7.  Helpers / utilidades
   ============================================================ */

'use strict'; /* Modo estricto para prevenir errores silenciosos */

/* ─── Esperar a que el DOM esté listo ─────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Detectar si estamos en el admin o en el landing ─────── */
  const isAdmin   = document.body.classList.contains('admin-body') ||
                    document.querySelector('.dropzone') !== null;
  const isLanding = !isAdmin;

  /* ============================================================
     1. CURSOR PERSONALIZADO
     — Solo en dispositivos con puntero fino (desktop/laptop)
     ============================================================ */
  const cursorDot      = document.querySelector('.cursor');
  const cursorFollower = document.querySelector('.cursor-follower');

  /* Solo inicializar si los elementos existen y hay puntero fino */
  if (cursorDot && cursorFollower && window.matchMedia('(pointer: fine)').matches) {

    let followerX = 0;
    let followerY = 0;
    let mouseX = 0;
    let mouseY = 0;

    /* Mover el punto central instantáneamente */
    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top  = mouseY + 'px';
    });

    /* Mover el anillo follower con inercia suave (lerp) */
    const animateFollower = () => {
      /* Interpolación lineal: se acerca al 12% de la distancia cada frame */
      followerX += (mouseX - followerX) * 0.12;
      followerY += (mouseY - followerY) * 0.12;
      cursorFollower.style.left = followerX + 'px';
      cursorFollower.style.top  = followerY + 'px';
      requestAnimationFrame(animateFollower);
    };
    animateFollower();

    /* Expandir cursor sobre elementos interactivos */
    const interactiveEls = document.querySelectorAll(
      'a, button, .service-card, .gallery__item, .preview-item, .dropzone, .gallery__btn'
    );
    interactiveEls.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorDot.classList.add('is-hovering');
        cursorFollower.classList.add('is-hovering');
      });
      el.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('is-hovering');
        cursorFollower.classList.remove('is-hovering');
      });
    });
  }


  /* ============================================================
     2. NAVEGACIÓN
     ============================================================ */
  const nav         = document.querySelector('.nav');
  const hamburger   = document.querySelector('.nav__hamburger');
  const mobileMenu  = document.querySelector('.nav__mobile-menu');
  const mobileLinks = document.querySelectorAll('.nav__mobile-menu .nav__link');

  /* ── Clase "scrolled" al bajar 80px ── */
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); /* Verificar estado inicial */
  }

  /* ── Menú hamburguesa ── */
  if (hamburger && mobileMenu) {
    const toggleMenu = () => {
      const isOpen = hamburger.classList.toggle('is-open');
      mobileMenu.classList.toggle('is-open', isOpen);
      /* Bloquear scroll del body cuando el menú está abierto */
      document.body.style.overflow = isOpen ? 'hidden' : '';
      /* Accesibilidad: anunciar estado */
      hamburger.setAttribute('aria-expanded', isOpen);
      mobileMenu.setAttribute('aria-hidden', !isOpen);
    };

    hamburger.addEventListener('click', toggleMenu);

    /* Cerrar al hacer click en un link del menú mobile */
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('is-open');
        mobileMenu.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });

    /* Cerrar con tecla Escape */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && hamburger.classList.contains('is-open')) {
        toggleMenu();
      }
    });
  }


  /* ============================================================
     3. REVEAL ON SCROLL — IntersectionObserver
     — Anima los elementos con clase .reveal al entrar en viewport
     ============================================================ */
  const revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            /* Dejar de observar una vez revelado (performance) */
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,       /* Se activa cuando el 12% es visible */
        rootMargin: '0px 0px -40px 0px' /* Un poco antes del borde inferior */
      }
    );

    revealEls.forEach(el => revealObserver.observe(el));
  }


  /* ============================================================
     4. HERO — Disparar animación de entrada
     ============================================================ */
  const heroLeft = document.querySelector('.hero__left');
  if (heroLeft) {
    /* Pequeño delay para que la fuente cargue antes de animar */
    setTimeout(() => {
      heroLeft.classList.add('is-loaded');
    }, 100);
  }


  /* ============================================================
     5. GALERÍA — Drag-to-scroll y control de animación CSS
     ============================================================ */
  const galleryWrapper = document.querySelector('.gallery__scroll-wrapper');
  const galleryTrack   = document.querySelector('.gallery__track');
  const galleryBtnPrev = document.querySelector('.gallery__btn--prev');
  const galleryBtnNext = document.querySelector('.gallery__btn--next');

  if (galleryWrapper && galleryTrack) {

    /* ── Drag-to-scroll: arrastrar con mouse ── */
    let isDragging  = false;
    let startX      = 0;
    let scrollLeft  = 0;

    galleryWrapper.addEventListener('mousedown', e => {
      isDragging = true;
      startX     = e.pageX - galleryWrapper.offsetLeft;
      scrollLeft = galleryWrapper.scrollLeft;
      /* Pausar la animación CSS mientras el usuario arrastra */
      galleryTrack.classList.add('is-paused');
    });

    galleryWrapper.addEventListener('mouseleave', () => {
      if (isDragging) {
        isDragging = false;
        galleryTrack.classList.remove('is-paused');
      }
    });

    galleryWrapper.addEventListener('mouseup', () => {
      isDragging = false;
      /* Reanudar la animación CSS después de soltar */
      galleryTrack.classList.remove('is-paused');
    });

    galleryWrapper.addEventListener('mousemove', e => {
      if (!isDragging) return;
      e.preventDefault();
      const x    = e.pageX - galleryWrapper.offsetLeft;
      const walk = (x - startX) * 1.5; /* Multiplicador de velocidad del drag */
      galleryWrapper.scrollLeft = scrollLeft - walk;
    });

    /* ── Touch swipe para mobile ── */
    let touchStartX = 0;

    galleryWrapper.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      galleryTrack.classList.add('is-paused');
    }, { passive: true });

    galleryWrapper.addEventListener('touchend', e => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff      = touchStartX - touchEndX;
      galleryWrapper.scrollLeft += diff * 2;
      galleryTrack.classList.remove('is-paused');
    }, { passive: true });

    /* ── Botones de control ── */
    const SCROLL_AMOUNT = 320; /* Píxeles a desplazar por click */

    if (galleryBtnPrev) {
      galleryBtnPrev.addEventListener('click', () => {
        galleryWrapper.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
      });
    }
    if (galleryBtnNext) {
      galleryBtnNext.addEventListener('click', () => {
        galleryWrapper.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
      });
    }
  }


  /* ============================================================
     6. ADMIN — Carga de fotos, preview y localStorage
     ============================================================ */
  if (isAdmin) {

    const dropzone    = document.querySelector('.dropzone');
    const fileInput   = document.querySelector('.dropzone__input');
    const previewGrid = document.querySelector('.preview-grid');
    const previewEmpty= document.querySelector('.preview-empty');
    const countEl     = document.querySelector('.admin-actions__count');
    const clearBtn    = document.querySelector('.admin-clear-btn');
    const exportBtn   = document.querySelector('.admin-export-btn');

    /* ── Estado interno: array de fotos {id, name, dataUrl, slot} ── */
    let photos = loadPhotosFromStorage();

    /* Renderizar el estado inicial */
    renderGrid();

    /* ── DROPZONE: arrastrar y soltar archivos ── */
    if (dropzone) {

      /* Prevenir comportamiento por defecto del browser en toda la página */
      ['dragenter','dragover','dragleave','drop'].forEach(evt => {
        document.addEventListener(evt, e => e.preventDefault());
      });

      /* Resaltar la zona al arrastrar encima */
      dropzone.addEventListener('dragenter', () => dropzone.classList.add('is-active'));
      dropzone.addEventListener('dragover',  () => dropzone.classList.add('is-active'));
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-active'));

      /* Procesar archivos al soltar */
      dropzone.addEventListener('drop', e => {
        dropzone.classList.remove('is-active');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        processFiles(files);
      });
    }

    /* ── INPUT FILE: click para seleccionar ── */
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const files = Array.from(fileInput.files).filter(f => f.type.startsWith('image/'));
        processFiles(files);
        fileInput.value = ''; /* Resetear para permitir subir el mismo archivo */
      });
    }

    /* ── LIMPIAR TODAS las fotos ── */
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('¿Eliminar todas las fotos? Esta acción no se puede deshacer.')) {
          photos = [];
          savePhotosToStorage();
          renderGrid();
          showToast('Todas las fotos fueron eliminadas');
        }
      });
    }

    /* ── EXPORTAR instrucciones ── */
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        showToast(`${photos.length} fotos guardadas · Para integrar, usa el localStorage "fenix_photos"`);
      });
    }

    /* ────────────────────────────────────────────
       FUNCIÓN: procesar array de File objects
       Convierte cada imagen a base64 y la guarda
    ──────────────────────────────────────────── */
    function processFiles(files) {
      if (files.length === 0) {
        showToast('Solo se aceptan imágenes (JPG, PNG, WebP)');
        return;
      }

      /* Límite de 30 fotos totales */
      const available = 30 - photos.length;
      if (available <= 0) {
        showToast('Máximo 30 fotos. Eliminá alguna para agregar más.');
        return;
      }

      const toProcess = files.slice(0, available);

      /* Leer cada archivo como DataURL (base64) */
      toProcess.forEach(file => {
        const reader = new FileReader();

        reader.onload = e => {
          /* Comprimir la imagen antes de guardar en localStorage */
          compressImage(e.target.result, 800, (compressedDataUrl) => {
            const photo = {
              id:      Date.now() + Math.random(), /* ID único */
              name:    file.name.replace(/\.[^/.]+$/, ''), /* Nombre sin extensión */
              dataUrl: compressedDataUrl,
              slot:    photos.length               /* Posición en la galería */
            };

            photos.push(photo);
            savePhotosToStorage();
            renderGrid();
            showToast(`"${photo.name}" cargada correctamente`);
          });
        };

        reader.onerror = () => {
          showToast(`Error al leer ${file.name}`);
        };

        reader.readAsDataURL(file);
      });

      if (files.length > available) {
        showToast(`Solo se cargaron ${available} fotos (límite 30)`);
      }
    }

    /* ────────────────────────────────────────────
       FUNCIÓN: comprimir imagen via canvas
       — Reduce peso antes de guardar en localStorage
    ──────────────────────────────────────────── */
    function compressImage(dataUrl, maxWidth, callback) {
      const img    = new Image();
      img.onload   = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        /* Escalar si excede el ancho máximo */
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width  = maxWidth;
        }

        canvas.width  = width;
        canvas.height = height;
        const ctx     = canvas.getContext('2d');

        /* Dibujar en blanco y negro (para coherencia con el diseño) */
        
        ctx.drawImage(img, 0, 0, width, height);

        /* Convertir a JPEG con 85% de calidad */
        callback(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = dataUrl;
    }

    /* ────────────────────────────────────────────
       FUNCIÓN: renderizar la grilla de previews
    ──────────────────────────────────────────── */
    function renderGrid() {
      if (!previewGrid) return;

      /* Limpiar la grilla */
      previewGrid.innerHTML = '';

      /* Mostrar u ocultar el mensaje vacío */
      if (previewEmpty) {
        previewEmpty.style.display = photos.length === 0 ? 'block' : 'none';
      }

      /* Actualizar contador */
      if (countEl) {
        countEl.textContent = `${photos.length} / 30 fotos`;
      }

      /* Renderizar cada foto */
      photos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item reveal';
        item.dataset.id = photo.id;

        item.innerHTML = `
          <img
            src="${photo.dataUrl}"
            alt="Foto del salón: ${escapeHtml(photo.name)}"
            loading="lazy"
          />
          <div class="preview-item__overlay" role="group" aria-label="Acciones para ${escapeHtml(photo.name)}">
            <button
              class="preview-item__delete"
              aria-label="Eliminar foto ${escapeHtml(photo.name)}"
              title="Eliminar foto"
            >✕</button>
          </div>
          <div class="preview-item__name" title="${escapeHtml(photo.name)}">
            ${escapeHtml(photo.name)}
          </div>
        `;

        /* Botón eliminar */
        const deleteBtn = item.querySelector('.preview-item__delete');
        deleteBtn.addEventListener('click', () => {
          deletePhoto(photo.id);
        });

        previewGrid.appendChild(item);

        /* Animar entrada con delay escalonado */
        requestAnimationFrame(() => {
          setTimeout(() => item.classList.add('is-visible'), index * 60);
        });
      });

      /* Actualizar la galería del landing si está en el mismo tab */
      updateLandingGallery();
    }

    /* ────────────────────────────────────────────
       FUNCIÓN: eliminar una foto por ID
    ──────────────────────────────────────────── */
    function deletePhoto(id) {
      const index = photos.findIndex(p => p.id === id);
      if (index === -1) return;

      const name = photos[index].name;

      /* Animación de salida antes de eliminar del DOM */
      const item = previewGrid.querySelector(`[data-id="${id}"]`);
      if (item) {
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        item.style.opacity    = '0';
        item.style.transform  = 'scale(0.9)';
        setTimeout(() => {
          photos = photos.filter(p => p.id !== id);
          savePhotosToStorage();
          renderGrid();
          showToast(`"${name}" eliminada`);
        }, 300);
      }
    }

    /* ────────────────────────────────────────────
       FUNCIÓN: actualizar galería del landing (si existe)
       Inyecta las fotos del localStorage en la galería
    ──────────────────────────────────────────── */
    function updateLandingGallery() {
      const galleryTrack = document.querySelector('.gallery__track');
      if (!galleryTrack || photos.length === 0) return;

      /* Mantener los items placeholder originales */
      const staticItems = galleryTrack.querySelectorAll('.gallery__item--static');

      /* Insertar fotos del admin al principio */
      photos.forEach(photo => {
        const existingEl = galleryTrack.querySelector(`[data-photo-id="${photo.id}"]`);
        if (existingEl) return; /* No duplicar */

        const item = document.createElement('div');
        item.className   = 'gallery__item';
        item.dataset.photoId = photo.id;

        item.innerHTML = `
          <img
            src="${photo.dataUrl}"
            alt="Foto del salón Fenix: ${escapeHtml(photo.name)}"
            loading="lazy"
          />
          <span class="gallery__caption" aria-hidden="true">${escapeHtml(photo.name)}</span>
        `;

        /* Insertar antes del primer item estático */
        if (staticItems.length > 0) {
          galleryTrack.insertBefore(item, staticItems[0]);
        } else {
          galleryTrack.appendChild(item);
        }
      });
    }

    /* ────────────────────────────────────────────
       FUNCIONES: persistencia en localStorage
    ──────────────────────────────────────────── */

    /* Guardar el array de fotos serializado */
    function savePhotosToStorage() {
      try {
        localStorage.setItem('fenix_photos', JSON.stringify(photos));
      } catch (e) {
        /* localStorage puede fallar si está lleno (límite ~5MB) */
        console.warn('localStorage lleno. Intentando liberar espacio...');
        /* Intentar con menos fotos (eliminar las más viejas) */
        if (photos.length > 1) {
          photos = photos.slice(1);
          savePhotosToStorage();
        }
      }
    }

    /* Cargar el array de fotos */
    function loadPhotosFromStorage() {
      try {
        const data = localStorage.getItem('fenix_photos');
        return data ? JSON.parse(data) : [];
      } catch (e) {
        console.warn('Error al leer localStorage:', e);
        return [];
      }
    }

  } /* END isAdmin */


  /* ============================================================
     INTEGRACIÓN: Cargar fotos del admin en el landing
     — Se ejecuta en index.html: lee las fotos del localStorage
       y las inyecta en la galería con scroll
     ============================================================ */
  if (isLanding) {
    try {
      const storedPhotos = JSON.parse(localStorage.getItem('fenix_photos') || '[]');
      const galleryTrack = document.querySelector('.gallery__track');

      if (galleryTrack && storedPhotos.length > 0) {

        /* Agregar fotos del admin a la galería */
        storedPhotos.forEach(photo => {
          const item = document.createElement('div');
          item.className = 'gallery__item';

          item.innerHTML = `
            <img
              src="${photo.dataUrl}"
              alt="Foto del salón Fenix: ${escapeHtml(photo.name)}"
              loading="lazy"
            />
            <span class="gallery__caption" aria-hidden="true">${escapeHtml(photo.name)}</span>
          `;

          /* Insertar al inicio de la pista */
          galleryTrack.insertBefore(item, galleryTrack.firstChild);
        });

        /* Duplicar el track para el loop seamless de la animación */
        const clones = Array.from(galleryTrack.children).map(el => el.cloneNode(true));
        clones.forEach(clone => galleryTrack.appendChild(clone));
      }
    } catch (e) {
      console.warn('No se pudieron cargar fotos del admin:', e);
    }
  }


  /* ============================================================
     7. HELPERS — Funciones de utilidad
     ============================================================ */

  /* ── Toast de notificación ── */
  function showToast(message, duration = 3000) {
    /* Reutilizar el toast existente o crear uno nuevo */
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className   = 'toast';
      toast.setAttribute('role', 'status');          /* Para lectores de pantalla */
      toast.setAttribute('aria-live', 'polite');     /* Anuncia cambios sin interrumpir */
      document.body.appendChild(toast);
    }

    toast.textContent = message;

    /* Mostrar */
    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });

    /* Ocultar después del timeout */
    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, duration);
  }

  /* ── Escapar HTML para prevenir XSS ── */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ── Smooth scroll para links internos ── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

}); /* END DOMContentLoaded */
