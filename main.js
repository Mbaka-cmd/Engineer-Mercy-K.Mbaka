// ============================================
// MERCY MBAKA PORTFOLIO v2.0 - MAIN.JS
// SaaS Architect & M-Pesa Specialist
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  initNavigation();
  initScrollAnimations();
  initContactForm();
  initSmoothScroll();
  initNavbarScroll();
  initMetricsAnimation();
});

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
  const navToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');
  
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = navToggle.querySelector('i');
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
    });
    
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.querySelector('i').classList.add('fa-bars');
        navToggle.querySelector('i').classList.remove('fa-times');
      });
    });
    
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navMenu.contains(e.target) && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        navToggle.querySelector('i').classList.add('fa-bars');
        navToggle.querySelector('i').classList.remove('fa-times');
      }
    });
  }
}

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.pageYOffset > 100) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

// ============================================
// SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
}

// ============================================
// METRICS ANIMATION
// ============================================
function initMetricsAnimation() {
  const metrics = document.querySelectorAll('.metric-number');
  
  const observerOptions = {
    threshold: 0.5
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const metric = entry.target;
        const text = metric.textContent;
        
        // Extract number from text like "1,000+"
        const numberMatch = text.match(/[\d,]+/);
        if (numberMatch) {
          animateMetric(metric, numberMatch[0]);
        }
        
        observer.unobserve(metric);
      }
    });
  }, observerOptions);
  
  metrics.forEach(metric => observer.observe(metric));
}

function animateMetric(element, targetText) {
  const cleanTarget = targetText.replace(/,/g, '');
  const targetNumber = parseInt(cleanTarget);
  const suffix = element.textContent.replace(/[\d,]/g, '').trim();
  
  const duration = 2000;
  const start = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    const currentNumber = Math.floor(targetNumber * easeOut);
    const formattedNumber = currentNumber.toLocaleString();
    
    element.textContent = formattedNumber + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = targetText;
    }
  }
  
  requestAnimationFrame(update);
}

// ============================================
// CONTACT FORM
// ============================================
function initContactForm() {
  const form = document.getElementById('contactForm');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const honeypot = form.querySelector('input[name="website"]');
      if (honeypot.value) {
        console.log('Bot detected');
        return;
      }
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');
      
      const formData = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        subject: form.subject.value.trim(),
        message: form.message.value.trim()
      };
      
      const errors = validateForm(formData);
      if (errors.length > 0) {
        showNotification(errors.join('. '), 'error');
        return;
      }
      
      btnText.hidden = true;
      btnLoading.hidden = false;
      submitBtn.disabled = true;
      
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          showNotification('Message sent! I\'ll get back to you within 24 hours.', 'success');
          form.reset();
        } else {
          showNotification(result.message || 'Something went wrong.', 'error');
        }
      } catch (error) {
        showNotification('Network error. Try WhatsApp: +254 748 077 609', 'error');
      } finally {
        btnText.hidden = false;
        btnLoading.hidden = true;
        submitBtn.disabled = false;
      }
    });
  }
}

function validateForm(formData) {
  const errors = [];
  
  if (!formData.name || formData.name.length < 2) {
    errors.push("Name required");
  }
  
  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.push("Valid email required");
  }
  
  if (!formData.subject || formData.subject.length < 3) {
    errors.push("Subject required");
  }
  
  if (!formData.message || formData.message.length < 10) {
    errors.push("Message must be at least 10 characters");
  }
  
  return errors;
}

function showNotification(message, type) {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;font-size:1.2rem;cursor:pointer;">&times;</button>
  `;
  
  document.body.appendChild(notification);
  
  notification.querySelector('button').addEventListener('click', () => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  });
  
  setTimeout(() => {
    if (notification.parentElement) {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        const navbar = document.getElementById('navbar');
        const navHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}