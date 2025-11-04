<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="home-page">
    <!-- Hero Section with a11y issues -->
    <section class="hero">
      <div class="container">
        <!-- Issue: Heading order skipped (h1 to h4) -->
        <h1>Welcome to Our Accessibility Testing Playground</h1>
        <h4>Discover common accessibility issues in modern web applications</h4>

        <!-- Issue: Button styled as link, poor contrast -->
        <div class="hero-actions">
          <a
            href="#"
            class="button-primary"
            style="background: #888; color: #aaa;"
          >Get Started</a>
          <!-- Issue: Empty link -->
          <a
            href="#"
            class="button-secondary"
          />
        </div>

        <!-- Issue: Decorative image without alt="" -->
        <img
          src="https://placehold.co/800x400/6366F1/ffffff?text=Hero+Image"
          class="hero-image"
        >
      </div>
    </section>

    <!-- Services Section with a11y issues -->
    <!-- Issue: Section without heading or aria-label -->
    <section class="services">
      <div class="container">
        <h2>Our Services</h2>

        <div class="services-grid">
          <!-- Issue: Card missing proper semantic structure -->
          <div class="service-card">
            <!-- Issue: Icon without alt text or aria-label -->
            <div class="icon">
              🎨
            </div>
            <h3>Web Design</h3>
            <!-- Issue: Low contrast text -->
            <p style="color: #999;">
              We create beautiful designs that may or may not be accessible.
            </p>
            <!-- Issue: Non-descriptive link text -->
            <a href="#">Learn More</a>
          </div>

          <div class="service-card">
            <div class="icon">
              💻
            </div>
            <h3>Development</h3>
            <p style="color: #999;">
              Building web applications with various accessibility challenges.
            </p>
            <a href="#">Learn More</a>
          </div>

          <div class="service-card">
            <div class="icon">
              📱
            </div>
            <h3>Mobile Apps</h3>
            <p style="color: #999;">
              Creating mobile experiences for testing purposes.
            </p>
            <a href="#">Learn More</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Call to Action Section -->
    <section class="cta">
      <div class="container">
        <!-- Issue: Using onClick on div instead of button -->
        <div
          class="cta-content"
          style="cursor: pointer;"
          @click="handleClick"
        >
          <h2>Ready to Test Accessibility?</h2>
          <p>Click anywhere in this box to continue</p>
        </div>
      </div>
    </section>

    <!-- Image Gallery with issues -->
    <section class="gallery">
      <div class="container">
        <h2>Image Gallery</h2>
        <div class="gallery-grid">
          <!-- Issue: Images missing alt text -->
          <img src="https://placehold.co/300x200/EF4444/ffffff?text=Image+1">
          <img src="https://placehold.co/300x200/10B981/ffffff?text=Image+2">
          <img src="https://placehold.co/300x200/3B82F6/ffffff?text=Image+3">
          <img src="https://placehold.co/300x200/F59E0B/ffffff?text=Image+4">
        </div>
      </div>
    </section>

    <!-- Form Section with issues -->
    <section class="newsletter">
      <div class="container">
        <h2>Subscribe to Our Newsletter</h2>
        <!-- Issue: Form without label, placeholder as label -->
        <form class="newsletter-form">
          <input
            type="text"
            placeholder="Enter your email"
          >
          <!-- Issue: Button with no accessible name -->
          <button
            type="submit"
            class="submit-btn"
          >
            <span>→</span>
          </button>
        </form>

        <!-- Issue: Required checkbox without label -->
        <input
          id="agree"
          type="checkbox"
        >
        <span>I agree to the terms</span>
      </div>
    </section>
  </div>
</template>

<script setup>
const handleClick = () => {
  console.log('CTA clicked')
}
</script>

<style scoped>
.home-page {
  width: 100%;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4rem 0;
  text-align: center;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero h4 {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3rem;
}

.button-primary, .button-secondary {
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.2s;
}

.button-primary {
  background: #4f46e5;
  color: white;
}

.button-secondary {
  background: transparent;
  border: 2px solid white;
  color: white;
}

.hero-image {
  max-width: 100%;
  border-radius: 1rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

/* Services Section */
.services {
  padding: 4rem 0;
  background: #f8fafc;
}

.services h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 3rem;
  color: #1e293b;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.service-card {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.2s;
}

.service-card:hover {
  transform: translateY(-5px);
}

.icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.service-card h3 {
  color: #1e293b;
  margin-bottom: 1rem;
}

.service-card p {
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.service-card a {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 600;
}

/* CTA Section */
.cta {
  background: #1e293b;
  color: white;
  padding: 4rem 0;
}

.cta-content {
  text-align: center;
  padding: 3rem;
  background: #334155;
  border-radius: 0.5rem;
}

.cta h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

/* Gallery Section */
.gallery {
  padding: 4rem 0;
}

.gallery h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 3rem;
  color: #1e293b;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.gallery-grid img {
  width: 100%;
  border-radius: 0.5rem;
  transition: transform 0.2s;
}

.gallery-grid img:hover {
  transform: scale(1.05);
}

/* Newsletter Section */
.newsletter {
  background: #f1f5f9;
  padding: 4rem 0;
  text-align: center;
}

.newsletter h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #1e293b;
}

.newsletter-form {
  display: flex;
  gap: 1rem;
  max-width: 500px;
  margin: 0 auto 1rem;
}

.newsletter-form input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #cbd5e1;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.submit-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-size: 1.5rem;
  cursor: pointer;
}

.newsletter input[type="checkbox"] {
  margin-right: 0.5rem;
}
</style>
