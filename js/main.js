/**
 * Gleason Construction Ltd Website
 * Main JavaScript file
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('Gleason Construction website loaded');

    // Load non-critical CSS
    loadNonCriticalCSS();

    // Initialize mobile navigation
    initMobileNav();

    // Initialize projects slider
    initProjectsSlider();

    // Initialize testimonials
    initTestimonials();

    // Initialize service detail navigation
    initServiceDetailNavigation();

    // Initialize projects filter and grid
    initProjectsFilter();

    // Initialize project detail view
    initProjectDetailView();

    // Initialize contact form
    initContactForm();

    // Initialize Google Maps
    initGoogleMaps();
});

// Helper function for responsive navigation
function initMobileNav() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function () {
            toggleMobileNav();
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function (event) {
        const isClickInsideNav = event.target.closest('.main-navigation');
        const isNavOpen = document.body.classList.contains('mobile-menu-open');

        if (!isClickInsideNav && isNavOpen) {
            toggleMobileNav();
        }
    });

    // Close mobile menu when window is resized to desktop size
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768 && document.body.classList.contains('mobile-menu-open')) {
            document.body.classList.remove('mobile-menu-open');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// Toggle mobile navigation
function toggleMobileNav() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';

    document.body.classList.toggle('mobile-menu-open');
    mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
}

// Enhanced Form validation and sanitization function - Task 8.4
function validateForm(formElement) {
    let isValid = true;

    // Reset previous error states
    const errorElements = formElement.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.style.display = 'none';
    });

    const inputElements = formElement.querySelectorAll('.form-control');
    inputElements.forEach(input => {
        input.classList.remove('error');
    });

    // Validate required fields
    const requiredFields = formElement.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            displayError(field, `${getFieldLabel(field)} is required`);
            isValid = false;
        }
    });

    // Validate and sanitize email format if email field exists and has a value
    const emailField = formElement.querySelector('input[type="email"]');
    if (emailField && emailField.value.trim()) {
        // Strict email validation regex
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(emailField.value.trim())) {
            displayError(emailField, 'Please enter a valid email address');
            isValid = false;
        } else {
            // Sanitize email by trimming and converting to lowercase
            emailField.value = emailField.value.trim().toLowerCase();
        }
    }

    // Validate and sanitize phone format if phone field exists and has a value
    const phoneField = formElement.querySelector('input[type="tel"]');
    if (phoneField && phoneField.value.trim()) {
        // Improved phone validation - international format with country code
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,4}$/;
        if (!phoneRegex.test(phoneField.value.trim())) {
            displayError(phoneField, 'Please enter a valid phone number (e.g., +254 701 596 894)');
            isValid = false;
        } else {
            // Sanitize phone by removing extra spaces and standardizing format
            phoneField.value = phoneField.value.trim().replace(/\s+/g, ' ');
        }
    }

    // Validate and sanitize text inputs for potential XSS attacks
    const textInputs = formElement.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach(input => {
        if (input.value.trim()) {
            // Check for potential script tags or suspicious HTML
            const scriptRegex = /<script|<\/script|javascript:|on\w+=/i;
            if (scriptRegex.test(input.value)) {
                displayError(input, 'Please remove any code or script tags from your input');
                isValid = false;
            } else {
                // Sanitize by encoding HTML entities
                input.value = sanitizeInput(input.value);
            }
        }
    });

    // Add CSRF token validation if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]');
    if (csrfToken) {
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'csrf_token';
        tokenInput.value = csrfToken.getAttribute('content');
        formElement.appendChild(tokenInput);
    }

    return isValid;
}

// Function to sanitize user input to prevent XSS attacks
function sanitizeInput(input) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return input.replace(/[&<>"']/g, function (m) { return map[m]; });
}

// Helper function to display form errors
function displayError(inputElement, message) {
    inputElement.classList.add('error');

    // Find the associated error message element
    const errorId = `${inputElement.id}-error`;
    const errorElement = document.getElementById(errorId);

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Helper function to get field label text
function getFieldLabel(inputElement) {
    const labelElement = document.querySelector(`label[for="${inputElement.id}"]`);
    if (labelElement) {
        // Remove the asterisk if present
        return labelElement.textContent.replace('*', '').trim();
    }
    return 'This field';
}

// Enhanced contact form with security measures - Task 8.4
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    const formSuccess = document.getElementById('form-success');
    const sendAnotherBtn = document.getElementById('send-another');

    if (!contactForm) return;

    // Add CSRF protection
    addCSRFProtection(contactForm);

    // Add rate limiting for form submissions
    const submissionRateLimit = setupRateLimit('form_submission', 5, 3600000); // 5 submissions per hour

    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Check rate limit before processing
        if (!submissionRateLimit.check()) {
            alert('Too many form submissions. Please try again later.');
            return;
        }

        // Validate and sanitize the form
        if (validateForm(contactForm)) {
            // Disable the submit button to prevent multiple submissions
            const submitButton = contactForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            // Collect form data securely
            const formData = new FormData(contactForm);
            const secureData = {};

            // Convert FormData to a secure object with sanitized values
            for (const [key, value] of formData.entries()) {
                secureData[key] = sanitizeInput(value);
            }

            // Add honeypot check for bot detection
            const honeypot = contactForm.querySelector('.honeypot-field');
            if (honeypot && honeypot.value) {
                console.log('Bot submission detected');
                // Silently fail for bots but show success to avoid revealing the honeypot
                simulateSuccess();
                return;
            }

            // Simulate secure form submission with a delay
            setTimeout(() => {
                // In a real implementation, this would be an HTTPS POST request
                // with proper CORS and content security headers

                // Record the successful submission in rate limit
                submissionRateLimit.increment();

                // Show success message
                contactForm.style.display = 'none';
                formSuccess.style.display = 'block';

                // Reset the form for future submissions
                contactForm.reset();
                submitButton.disabled = false;
                submitButton.textContent = 'Send Message';

                // Scroll to success message
                formSuccess.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 1500);
        }
    });

    // Add input event listeners for real-time validation
    const formInputs = contactForm.querySelectorAll('.form-control');
    formInputs.forEach(input => {
        // Add input sanitization on blur
        input.addEventListener('blur', function () {
            if (this.value.trim()) {
                this.value = sanitizeInput(this.value);
            }
        });

        // Remove error state when user starts typing
        input.addEventListener('input', function () {
            this.classList.remove('error');
            const errorId = `${this.id}-error`;
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        });
    });

    // Send another message button
    if (sendAnotherBtn) {
        sendAnotherBtn.addEventListener('click', function () {
            formSuccess.style.display = 'none';
            contactForm.style.display = 'block';
        });
    }

    // Add invisible honeypot field to detect bots
    addHoneypotField(contactForm);
}

// Add CSRF protection to forms
function addCSRFProtection(form) {
    // Generate a random token
    const token = generateRandomToken(32);

    // Store the token in sessionStorage
    sessionStorage.setItem('csrf_token', token);

    // Add the token to the form
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'csrf_token';
    tokenInput.value = token;
    form.appendChild(tokenInput);

    // Add a meta tag with the token
    const metaToken = document.createElement('meta');
    metaToken.name = 'csrf-token';
    metaToken.content = token;
    document.head.appendChild(metaToken);
}

// Generate a random token for CSRF protection
function generateRandomToken(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Add honeypot field to detect bots
function addHoneypotField(form) {
    const honeypotContainer = document.createElement('div');
    honeypotContainer.style.opacity = '0';
    honeypotContainer.style.position = 'absolute';
    honeypotContainer.style.height = '0';
    honeypotContainer.style.overflow = 'hidden';

    const honeypotField = document.createElement('input');
    honeypotField.type = 'text';
    honeypotField.name = 'website';
    honeypotField.className = 'honeypot-field';
    honeypotField.autocomplete = 'off';

    honeypotContainer.appendChild(honeypotField);
    form.appendChild(honeypotContainer);
}

// Setup rate limiting for various actions
function setupRateLimit(actionName, limit, timeWindow) {
    return {
        check: function () {
            const now = Date.now();
            const storageKey = `rateLimit_${actionName}`;

            // Get existing data from localStorage
            const storedData = localStorage.getItem(storageKey);
            let data = storedData ? JSON.parse(storedData) : { count: 0, timestamp: now };

            // Reset if outside time window
            if (now - data.timestamp > timeWindow) {
                data = { count: 0, timestamp: now };
            }

            // Check if limit exceeded
            return data.count < limit;
        },
        increment: function () {
            const now = Date.now();
            const storageKey = `rateLimit_${actionName}`;

            // Get existing data from localStorage
            const storedData = localStorage.getItem(storageKey);
            let data = storedData ? JSON.parse(storedData) : { count: 0, timestamp: now };

            // Reset if outside time window
            if (now - data.timestamp > timeWindow) {
                data = { count: 1, timestamp: now };
            } else {
                data.count++;
            }

            // Store updated data
            localStorage.setItem(storageKey, JSON.stringify(data));
        }
    };
}

// Enhanced lazy loading function for images and background images
function lazyLoadImages() {
    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        // Create observer for regular images
        const imgObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');

                    if (src) {
                        img.onload = () => {
                            img.classList.add('loaded');
                        };
                        img.src = src;
                        img.removeAttribute('data-src');
                    }

                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px', // Load images 50px before they enter viewport
            threshold: 0.1
        });

        // Create observer for background images
        const bgObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const bg = element.getAttribute('data-bg');

                    if (bg) {
                        // Create a temporary image to check when the background image is loaded
                        const tempImg = new Image();
                        tempImg.onload = () => {
                            element.style.backgroundImage = `url('${bg}')`;
                            element.classList.add('loaded');
                        };
                        tempImg.src = bg;

                        element.removeAttribute('data-bg');
                    }

                    observer.unobserve(element);
                }
            });
        }, {
            rootMargin: '50px 0px', // Load backgrounds 50px before they enter viewport
            threshold: 0.1
        });

        // Target all images with data-src attribute
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.classList.add('lazy-image');
            imgObserver.observe(img);
        });

        // Target all elements with data-bg attribute
        document.querySelectorAll('.lazy-background').forEach(element => {
            bgObserver.observe(element);
        });

        // Special handling for hero section and company image
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            bgObserver.observe(heroSection);
        }

        const companyImage = document.querySelector('.company-image');
        if (companyImage) {
            bgObserver.observe(companyImage);
        }
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
            img.classList.add('loaded');
        });

        document.querySelectorAll('.lazy-background').forEach(element => {
            const bg = element.getAttribute('data-bg');
            if (bg) {
                element.style.backgroundImage = `url('${bg}')`;
                element.classList.add('loaded');
                element.removeAttribute('data-bg');
            }
        });

        // Special handling for hero section and company image
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.classList.add('loaded');
        }

        const companyImage = document.querySelector('.company-image');
        if (companyImage) {
            companyImage.classList.add('loaded');
        }
    }
}

// Projects slider functionality - Task 3.3
function initProjectsSlider() {
    const sliderContainer = document.querySelector('.slider-container');
    const slides = document.querySelectorAll('.slider-slide');
    const prevArrow = document.querySelector('.prev-arrow');
    const nextArrow = document.querySelector('.next-arrow');
    const dots = document.querySelectorAll('.slider-dot');

    if (!sliderContainer || slides.length === 0) return;

    let currentSlide = 0;
    let slideWidth = 100; // percentage
    let slidesToShow = 1;

    // Determine how many slides to show based on viewport width
    function updateSlidesToShow() {
        if (window.innerWidth >= 992) {
            slidesToShow = 3;
        } else if (window.innerWidth >= 768) {
            slidesToShow = 2;
        } else {
            slidesToShow = 1;
        }

        // Update slide width based on slides to show
        slideWidth = 100 / slidesToShow;

        // Reset slider position and update slides width
        slides.forEach(slide => {
            slide.style.flex = `0 0 ${slideWidth}%`;
            slide.style.maxWidth = `${slideWidth}%`;
        });

        goToSlide(currentSlide);
    }

    // Go to specific slide
    function goToSlide(slideIndex) {
        // Ensure slideIndex is within bounds
        if (slideIndex < 0) {
            slideIndex = 0;
        } else if (slideIndex > slides.length - slidesToShow) {
            slideIndex = slides.length - slidesToShow;
        }

        currentSlide = slideIndex;

        // Update slider position
        const offset = -slideIndex * slideWidth;
        sliderContainer.style.transform = `translateX(${offset}%)`;

        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });

        // Update arrows state (optional)
        if (prevArrow) prevArrow.style.opacity = currentSlide === 0 ? '0.5' : '1';
        if (nextArrow) nextArrow.style.opacity = currentSlide >= slides.length - slidesToShow ? '0.5' : '1';
    }

    // Set up event listeners
    if (prevArrow) {
        prevArrow.addEventListener('click', () => {
            goToSlide(currentSlide - 1);
        });
    }

    if (nextArrow) {
        nextArrow.addEventListener('click', () => {
            goToSlide(currentSlide + 1);
        });
    }

    // Set up dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });

    // Auto-rotation
    let autoRotateInterval;

    function startAutoRotate() {
        autoRotateInterval = setInterval(() => {
            let nextSlide = currentSlide + 1;
            if (nextSlide > slides.length - slidesToShow) {
                nextSlide = 0;
            }
            goToSlide(nextSlide);
        }, 5000); // Rotate every 5 seconds
    }

    function stopAutoRotate() {
        clearInterval(autoRotateInterval);
    }

    // Start auto-rotation
    startAutoRotate();

    // Pause auto-rotation on hover
    sliderContainer.addEventListener('mouseenter', stopAutoRotate);
    sliderContainer.addEventListener('mouseleave', startAutoRotate);

    // Handle touch events for mobile swipe
    let touchStartX = 0;
    let touchEndX = 0;

    sliderContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoRotate();
    }, { passive: true });

    sliderContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoRotate();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe left, go to next slide
            goToSlide(currentSlide + 1);
        } else if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe right, go to previous slide
            goToSlide(currentSlide - 1);
        }
    }

    // Update slider on window resize
    window.addEventListener('resize', updateSlidesToShow);

    // Initialize slider
    updateSlidesToShow();
}

// Testimonials functionality - Task 3.5
function initTestimonials() {
    const testimonialItems = document.querySelectorAll('.testimonial-item');
    const navItems = document.querySelectorAll('.testimonial-nav-item');

    if (testimonialItems.length <= 1 || navItems.length === 0) return;

    // Hide all testimonials except the first one
    testimonialItems.forEach((item, index) => {
        if (index !== 0) {
            item.style.display = 'none';
        }
    });

    // Add click event to navigation items
    navItems.forEach((navItem, index) => {
        navItem.addEventListener('click', () => {
            // Hide all testimonials
            testimonialItems.forEach(item => {
                item.style.display = 'none';
            });

            // Show selected testimonial
            testimonialItems[index].style.display = 'block';

            // Update active nav item
            navItems.forEach(item => {
                item.classList.remove('active');
            });
            navItem.classList.add('active');
        });
    });

    // Auto-rotate testimonials
    let currentTestimonial = 0;
    const autoRotateInterval = setInterval(() => {
        currentTestimonial = (currentTestimonial + 1) % testimonialItems.length;

        // Hide all testimonials
        testimonialItems.forEach(item => {
            item.style.display = 'none';
        });

        // Show current testimonial
        testimonialItems[currentTestimonial].style.display = 'block';

        // Update active nav item
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        navItems[currentTestimonial].classList.add('active');
    }, 8000); // Rotate every 8 seconds

    // Stop auto-rotation when user interacts with navigation
    navItems.forEach(navItem => {
        navItem.addEventListener('click', () => {
            clearInterval(autoRotateInterval);
        });
    });
}

// Call lazy loading function when page is loaded
window.addEventListener('load', lazyLoadImages);

// Service detail navigation - Task 5.2
function initServiceDetailNavigation() {
    // Get all service links
    const serviceLinks = document.querySelectorAll('.service-link');

    if (serviceLinks.length === 0) return;

    // Add click event to each service link
    serviceLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // Only handle if we're on the services page
            if (window.location.pathname.includes('services.html')) {
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    e.preventDefault();

                    // Calculate offset to account for fixed header
                    const headerHeight = document.querySelector('.site-header').offsetHeight;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

                    // Smooth scroll to target
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // Update URL without page reload
                    history.pushState(null, null, targetId);
                }
            }
        });
    });

    // Check if URL has a hash on page load
    if (window.location.hash && window.location.pathname.includes('services.html')) {
        const targetElement = document.querySelector(window.location.hash);

        if (targetElement) {
            // Wait for page to fully load
            setTimeout(() => {
                // Calculate offset to account for fixed header
                const headerHeight = document.querySelector('.site-header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

                // Smooth scroll to target
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }, 300);
        }
    }
}

// Initialize service detail navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Existing initializations...

    // Initialize service detail navigation
    initServiceDetailNavigation();
});

// Projects filter functionality - Task 6.1
function initProjectsFilter() {
    // Check if we're on the projects page
    if (!document.querySelector('.projects-filter')) return;

    // Sample project data - in a real implementation, this would come from a database or API
    const projects = [
        {
            id: 1,
            name: "Kisumu Heights Apartments",
            location: "kisumu",
            type: "residential",
            status: "completed",
            year: 2024,
            image: "../images/projects/kisumu-heights.jpg",
            description: "A modern residential complex with 24 luxury apartments."
        },
        {
            id: 2,
            name: "Nakuru Business Center",
            location: "nakuru",
            type: "commercial",
            status: "completed",
            year: 2023,
            image: "../images/projects/nakuru-business.jpg",
            description: "A 5-story commercial building with office spaces and retail outlets."
        },
        {
            id: 3,
            name: "Ndhiwa Community Hospital",
            location: "ndhiwa",
            type: "commercial",
            status: "completed",
            year: 2023,
            image: "../images/projects/ndhiwa-hospital.jpg",
            description: "A modern healthcare facility serving the Ndhiwa community."
        },
        {
            id: 4,
            name: "Eldoret Industrial Park",
            location: "eldoret",
            type: "industrial",
            status: "ongoing",
            year: 2025,
            image: "../images/projects/eldoret-industrial.jpg",
            description: "A large-scale industrial development with multiple factory units."
        },
        {
            id: 5,
            name: "Kisumu Waterfront Villas",
            location: "kisumu",
            type: "residential",
            status: "ongoing",
            year: 2025,
            image: "../images/projects/kisumu-waterfront.jpg",
            description: "Luxury lakeside villas with private docks and gardens."
        },
        {
            id: 6,
            name: "Nakuru Highway Bridge",
            location: "nakuru",
            type: "infrastructure",
            status: "completed",
            year: 2022,
            image: "../images/projects/nakuru-bridge.jpg",
            description: "A reinforced concrete bridge spanning the Nakuru-Eldoret highway."
        }
    ];

    // Get filter elements
    const locationFilter = document.getElementById('location-filter');
    const typeFilter = document.getElementById('type-filter');
    const statusFilter = document.getElementById('status-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const activeFiltersContainer = document.getElementById('active-filters');
    const projectsGrid = document.getElementById('projects-grid');

    // Current filter state
    const currentFilters = {
        location: 'all',
        type: 'all',
        status: 'all'
    };

    // Initialize the projects grid
    function initProjectsGrid() {
        // Clear loading message
        projectsGrid.innerHTML = '';

        // Apply filters and render projects
        renderProjects(filterProjects(projects));
    }

    // Filter projects based on current filter state
    function filterProjects(projectsList) {
        return projectsList.filter(project => {
            const locationMatch = currentFilters.location === 'all' || project.location === currentFilters.location;
            const typeMatch = currentFilters.type === 'all' || project.type === currentFilters.type;
            const statusMatch = currentFilters.status === 'all' || project.status === currentFilters.status;

            return locationMatch && typeMatch && statusMatch;
        });
    }

    // Render projects to the grid
    function renderProjects(filteredProjects) {
        // Clear existing projects
        projectsGrid.innerHTML = '';

        if (filteredProjects.length === 0) {
            // No projects match the filters
            projectsGrid.innerHTML = '<p class="no-results">No projects match your filter criteria. Please try different filters.</p>';
            return;
        }

        // Create project cards
        filteredProjects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            projectCard.setAttribute('data-project-id', project.id);

            // Handle missing images with a placeholder
            const imageUrl = project.image || '../images/projects/placeholder.jpg';

            // Create status class based on project status
            const statusClass = project.status === 'completed' ? 'status-completed' : 'status-ongoing';

            projectCard.innerHTML = `
                <div class="project-image" style="background-image: url('${imageUrl}')">
                    <span class="project-status ${statusClass}">${project.status}</span>
                </div>
                <div class="project-details">
                    <h3>${project.name}</h3>
                    <div class="project-meta">
                        <span class="project-location">${capitalizeFirstLetter(project.location)}</span>
                        <span class="project-year">${project.year}</span>
                    </div>
                    <p>${project.description}</p>
                    <a href="#" class="btn btn-outline view-project-details" data-project-id="${project.id}">View Details</a>
                </div>
            `;

            projectsGrid.appendChild(projectCard);
        });

        // Add event listeners to view details buttons
        document.querySelectorAll('.view-project-details').forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                const projectId = parseInt(this.getAttribute('data-project-id'));
                // This will be implemented in task 6.3
                console.log(`View details for project ${projectId}`);
            });
        });
    }

    // Update active filters display
    function updateActiveFilters() {
        // Clear existing filter tags
        activeFiltersContainer.innerHTML = '';

        // Check if any filters are active
        const hasActiveFilters = Object.values(currentFilters).some(value => value !== 'all');

        if (!hasActiveFilters) {
            activeFiltersContainer.style.display = 'none';
            return;
        }

        activeFiltersContainer.style.display = 'flex';

        // Create filter tags for each active filter
        Object.entries(currentFilters).forEach(([key, value]) => {
            if (value !== 'all') {
                const filterTag = document.createElement('span');
                filterTag.className = 'filter-tag';

                // Format the filter name and value for display
                const filterName = key.charAt(0).toUpperCase() + key.slice(1);
                const filterValue = capitalizeFirstLetter(value);

                filterTag.innerHTML = `
                    ${filterName}: ${filterValue}
                    <button class="remove-filter" data-filter-type="${key}" aria-label="Remove ${filterName} filter">×</button>
                `;

                activeFiltersContainer.appendChild(filterTag);
            }
        });

        // Add event listeners to remove filter buttons
        document.querySelectorAll('.remove-filter').forEach(button => {
            button.addEventListener('click', function () {
                const filterType = this.getAttribute('data-filter-type');
                // Reset this specific filter
                currentFilters[filterType] = 'all';

                // Update the corresponding select element
                document.getElementById(`${filterType}-filter`).value = 'all';

                // Update display
                updateActiveFilters();
                renderProjects(filterProjects(projects));
            });
        });
    }

    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Set up event listeners for filters
    locationFilter.addEventListener('change', function () {
        currentFilters.location = this.value;
        updateActiveFilters();
        renderProjects(filterProjects(projects));
    });

    typeFilter.addEventListener('change', function () {
        currentFilters.type = this.value;
        updateActiveFilters();
        renderProjects(filterProjects(projects));
    });

    statusFilter.addEventListener('change', function () {
        currentFilters.status = this.value;
        updateActiveFilters();
        renderProjects(filterProjects(projects));
    });

    // Clear all filters
    clearFiltersBtn.addEventListener('click', function () {
        // Reset all filters to default
        currentFilters.location = 'all';
        currentFilters.type = 'all';
        currentFilters.status = 'all';

        // Reset select elements
        locationFilter.value = 'all';
        typeFilter.value = 'all';
        statusFilter.value = 'all';

        // Update display
        updateActiveFilters();
        renderProjects(filterProjects(projects));
    });

    // Initialize the projects grid with all projects
    setTimeout(initProjectsGrid, 500); // Small delay to simulate loading
}

// Initialize projects filter when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Existing initializations...

    // Initialize projects filter
    initProjectsFilter();
});

// Project detail view functionality - Task 6.3
function initProjectDetailView() {
    // Check if we're on the projects page
    if (!document.querySelector('.project-modal')) return;

    // Get modal elements
    const modal = document.getElementById('project-detail-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
    const contactButton = document.getElementById('modal-contact-btn');

    // Extended project data with more details for the modal view
    const projectsExtended = [
        {
            id: 1,
            name: "Kisumu Heights Apartments",
            location: "kisumu",
            type: "residential",
            status: "completed",
            year: 2024,
            image: "../images/projects/kisumu-heights.jpg",
            description: "A modern residential complex with 24 luxury apartments featuring contemporary design and premium amenities. Located in the heart of Kisumu city with easy access to shopping centers, schools, and healthcare facilities.",
            features: [
                "24 luxury apartments ranging from 1 to 3 bedrooms",
                "Rooftop swimming pool and recreation area",
                "24/7 security with CCTV surveillance",
                "Underground parking for residents",
                "Solar water heating system",
                "Backup generator for uninterrupted power supply"
            ],
            gallery: [
                "../images/projects/kisumu-heights.jpg",
                "../images/projects/placeholder.jpg",
                "../images/projects/placeholder.jpg"
            ]
        },
        {
            id: 2,
            name: "Nakuru Business Center",
            location: "nakuru",
            type: "commercial",
            status: "completed",
            year: 2023,
            image: "../images/projects/nakuru-business.jpg",
            description: "A 5-story commercial building with modern office spaces and retail outlets. The building features energy-efficient design, ample parking, and state-of-the-art facilities for businesses of all sizes.",
            features: [
                "5 floors of premium office and retail space",
                "Energy-efficient glass facade",
                "High-speed elevators",
                "Central air conditioning system",
                "Dedicated server rooms with backup power",
                "Conference facilities and meeting rooms"
            ],
            gallery: [
                "../images/projects/nakuru-business.jpg",
                "../images/projects/placeholder.jpg",
                "../images/projects/placeholder.jpg"
            ]
        },
        {
            id: 3,
            name: "Ndhiwa Community Hospital",
            location: "ndhiwa",
            type: "commercial",
            status: "completed",
            year: 2023,
            image: "../images/projects/ndhiwa-hospital.jpg",
            description: "A modern healthcare facility serving the Ndhiwa community with outpatient and inpatient services. The hospital was designed with patient comfort and efficient healthcare delivery in mind.",
            features: [
                "50-bed capacity with private and general wards",
                "Modern operating theaters",
                "Diagnostic imaging center",
                "Pharmacy and laboratory services",
                "Emergency department with ambulance bay",
                "Maternity wing with neonatal care unit"
            ],
            gallery: [
                "../images/projects/ndhiwa-hospital.jpg",
                "../images/projects/placeholder.jpg",
                "../images/projects/placeholder.jpg"
            ]
        },
        {
            id: 4,
            name: "Eldoret Industrial Park",
            location: "eldoret",
            type: "industrial",
            status: "ongoing",
            year: 2025,
            image: "../images/projects/eldoret-industrial.jpg",
            description: "A large-scale industrial development with multiple factory units, warehouses, and logistics facilities. The project aims to boost manufacturing and create employment opportunities in the region.",
            features: [
                "10 factory units of varying sizes",
                "Central logistics hub with loading bays",
                "Dedicated power substation",
                "Water treatment and recycling plant",
                "Administrative offices and staff facilities",
                "Secure perimeter with controlled access"
            ],
            gallery: [
                "../images/projects/eldoret-industrial.jpg",
                "../images/projects/placeholder.jpg",
                "../images/projects/placeholder.jpg"
            ]
        },
        {
            id: 5,
            name: "Kisumu Waterfront Villas",
            location: "kisumu",
            type: "residential",
            status: "ongoing",
            year: 2025,
            image: "../images/projects/kisumu-waterfront.jpg",
            description: "Luxury lakeside villas with private docks and gardens, offering an exclusive living experience with breathtaking views of Lake Victoria. Each villa is designed with sustainability and luxury in mind.",
            features: [
                "10 exclusive villas with 4-5 bedrooms each",
                "Private docks with boat access to Lake Victoria",
                "Infinity pools overlooking the lake",
                "Smart home automation systems",
                "Landscaped gardens with indigenous plants",
                "Solar power and rainwater harvesting systems"
            ],
            gallery: [
                "../images/projects/kisumu-waterfront.jpg",
                "../images/projects/placeholder.jpg",
                "../images/projects/placeholder.jpg"
            ]
        },
        {
            id: 6,
            name: "Nakuru Highway Bridge",
            location: "nakuru",
            type: "infrastructure",
            status: "completed",
            year: 2022,
            image: "../images/projects/nakuru-bridge.jpg",
            description: "A reinforced concrete bridge spanning the Nakuru-Eldoret highway, designed to improve traffic flow and enhance safety for motorists and pedestrians. The bridge incorporates modern engineering techniques for durability and strength.",
            features: [
                "200-meter span with reinforced concrete construction",
                "Pedestrian walkways on both sides",
                "LED lighting system for improved visibility",
                "Expansion joints for temperature fluctuations",
                "Drainage system to prevent water accumulation",
                "Safety barriers and guardrails"
            ],
            gallery: [
                "../images/projects/nakuru-bridge.jpg",
                "../images/projects/placeholder.jpg",
                "../images/projects/placeholder.jpg"
            ]
        }
    ];

    // Function to open modal with project details
    function openProjectModal(projectId) {
        // Find the project by ID
        const project = projectsExtended.find(p => p.id === projectId);

        if (!project) return;

        // Populate modal with project details
        document.getElementById('modal-project-title').textContent = project.name;
        document.getElementById('modal-main-image').src = project.image;
        document.getElementById('modal-main-image').alt = project.name;
        document.getElementById('modal-location').textContent = capitalizeFirstLetter(project.location);
        document.getElementById('modal-type').textContent = capitalizeFirstLetter(project.type);
        document.getElementById('modal-status').textContent = capitalizeFirstLetter(project.status);
        document.getElementById('modal-year').textContent = project.year;
        document.getElementById('modal-description').textContent = project.description;

        // Populate features list
        const featuresList = document.getElementById('modal-features');
        featuresList.innerHTML = '';

        if (project.features && project.features.length > 0) {
            document.getElementById('modal-features-section').style.display = 'block';
            project.features.forEach(feature => {
                const li = document.createElement('li');
                li.textContent = feature;
                featuresList.appendChild(li);
            });
        } else {
            document.getElementById('modal-features-section').style.display = 'none';
        }

        // Populate gallery thumbnails
        const thumbnailsContainer = document.getElementById('modal-thumbnails');
        thumbnailsContainer.innerHTML = '';

        if (project.gallery && project.gallery.length > 0) {
            project.gallery.forEach((image, index) => {
                const thumbnail = document.createElement('div');
                thumbnail.className = 'thumbnail' + (index === 0 ? ' active' : '');
                thumbnail.innerHTML = `<img src="${image}" alt="${project.name} - Image ${index + 1}">`;

                // Add click event to switch main image
                thumbnail.addEventListener('click', function () {
                    document.getElementById('modal-main-image').src = image;

                    // Update active thumbnail
                    document.querySelectorAll('.thumbnail').forEach(thumb => {
                        thumb.classList.remove('active');
                    });
                    thumbnail.classList.add('active');
                });

                thumbnailsContainer.appendChild(thumbnail);
            });
        }

        // Show modal
        modal.classList.add('active');
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    }

    // Function to close modal
    function closeProjectModal() {
        modal.classList.remove('active');
        modalOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Set up event listeners for opening project details
    document.addEventListener('click', function (e) {
        if (e.target.closest('.view-project-details')) {
            e.preventDefault();
            const projectId = parseInt(e.target.closest('.view-project-details').getAttribute('data-project-id'));
            openProjectModal(projectId);
        }
    });

    // Set up event listeners for closing modal
    closeButtons.forEach(button => {
        button.addEventListener('click', closeProjectModal);
    });

    // Close modal when clicking outside
    modalOverlay.addEventListener('click', closeProjectModal);

    // Prevent closing when clicking inside modal content
    modal.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeProjectModal();
        }
    });

    // Handle contact button click
    if (contactButton) {
        contactButton.addEventListener('click', function () {
            closeProjectModal();
            // Redirect to contact page
            window.location.href = 'contact.html';
        });
    }

    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

// Initialize project detail view when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Existing initializations...

    // Initialize project detail view
    initProjectDetailView();
});

// Initialize Google Maps - Task 7.3
function initGoogleMaps() {
    // The map is already embedded via iframe, so we don't need to initialize it with JavaScript
    // This function is a placeholder for any additional map functionality we might want to add

    // Add click event to directions button (already handled by the href attribute)
    const directionsBtn = document.querySelector('.map-directions-btn');
    if (directionsBtn) {
        directionsBtn.addEventListener('click', function (e) {
            // We're using the href attribute to open Google Maps directions in a new tab
            // This is just a placeholder for any additional functionality
            console.log('Opening directions in Google Maps');
        });
    }
}

// Cross-browser compatibility fixes

// iOS-specific touch event handling for testimonial slider
function enhanceIOSTouchEvents() {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        const testimonialItems = document.querySelectorAll('.testimonial-nav-item');
        testimonialItems.forEach(item => {
            item.addEventListener('touchend', function (e) {
                e.preventDefault();
                this.click();
            });
        });

        // Enhance slider arrows for iOS
        const sliderArrows = document.querySelectorAll('.slider-arrow');
        sliderArrows.forEach(arrow => {
            arrow.addEventListener('touchend', function (e) {
                e.preventDefault();
                this.click();
            });
        });
    }
}

// Fix for Safari IntersectionObserver issues
function fixSafariIntersectionObserver() {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari && 'IntersectionObserver' in window) {
        // Add a small delay for Safari to improve reliability
        const originalObserve = IntersectionObserver.prototype.observe;
        IntersectionObserver.prototype.observe = function (target) {
            setTimeout(() => {
                originalObserve.call(this, target);
            }, 50);
        };
    }
}

// Fix for Edge CSS variable support
function fixEdgeCSSVariables() {
    const isEdge = /Edge\/\d./i.test(navigator.userAgent);

    if (isEdge) {
        // Add fallback colors for Edge
        document.documentElement.style.setProperty('--color-dark-brown', '#5D4037');
        document.documentElement.style.setProperty('--color-medium-brown', '#8D6E63');
        document.documentElement.style.setProperty('--color-sage-green', '#7CB342');
        document.documentElement.style.setProperty('--color-warm-gray', '#757575');
        document.documentElement.style.setProperty('--color-light-beige', '#F5F5DC');
    }
}

// Initialize cross-browser fixes
document.addEventListener('DOMContentLoaded', function () {
    // Apply browser-specific fixes
    enhanceIOSTouchEvents();
    fixSafariIntersectionObserver();
    fixEdgeCSSVariables();
});

// Function to load non-critical CSS
function loadNonCriticalCSS() {
    // Change media attribute from 'print' to 'all' to apply styles
    const normalizeCSS = document.getElementById('normalize-css');
    const mainCSS = document.getElementById('main-css');

    if (normalizeCSS) normalizeCSS.media = 'all';
    if (mainCSS) mainCSS.media = 'all';

    console.log('Non-critical CSS loaded');
}