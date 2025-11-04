<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="app-layout">
    <!-- Header with intentional a11y issues -->
    <header class="header">
      <div class="container">
        <!-- Issue: div used instead of nav, missing aria-label -->
        <div class="nav-wrapper">
          <!-- Issue: Logo missing alt text -->
          <nuxt-link
            to="/"
            class="logo"
          >
            <img
              src="https://placehold.co/150x50/4F46E5/ffffff?text=A11y+Test"
              class="logo-img"
            >
          </nuxt-link>

          <!-- Issue: Non-semantic list markup -->
          <div class="nav-links">
            <!-- Issue: Links have poor color contrast -->
            <nuxt-link
              to="/"
              style="color: #aaa"
            >Home</nuxt-link>
            <nuxt-link
              to="/about-us"
              style="color: #aaa"
            >About</nuxt-link>
            <nuxt-link
              to="/contact"
              style="color: #aaa"
            >Contact</nuxt-link>

            <!-- Issue: Button without accessible name -->
            <button
              class="icon-button"
              @click="toggleMenu"
            >
              <span>☰</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main>
      <slot />
    </main>

    <!-- Footer with intentional a11y issues -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <!-- Issue: Heading order skipped (no h2, h3 before h4) -->
          <div class="footer-section">
            <h4>About Us</h4>
            <p>We are committed to web accessibility.</p>
          </div>

          <div class="footer-section">
            <h4>Quick Links</h4>
            <!-- Issue: Links without sufficient context -->
            <div>
              <a href="#">Click here</a>
              <a href="#">Read more</a>
              <a href="#">Learn more</a>
            </div>
          </div>

          <div class="footer-section">
            <h4>Contact</h4>
            <!-- Issue: Email and phone as plain text (not links) -->
            <p>Email: contact@example.com</p>
            <p>Phone: (555) 123-4567</p>
          </div>
        </div>

        <!-- Issue: Low contrast text -->
        <div
          class="footer-bottom"
          style="color: #666; background: #555;"
        >
          <p>&copy; 2025 A11y Playground. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
const toggleMenu = () => {
  // Menu toggle logic
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.header {
  background: #1e293b;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.nav-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-img {
  height: 50px;
}

.nav-links {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-links a {
  text-decoration: none;
  transition: color 0.2s;
  font-weight: 500;
}

.nav-links a:hover {
  color: #60a5fa;
}

.icon-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: none;
}

main {
  flex: 1;
}

.footer {
  background: #0f172a;
  color: white;
  padding: 3rem 0 0;
  margin-top: 4rem;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding-bottom: 2rem;
}

.footer-section h4 {
  margin-bottom: 1rem;
  color: #60a5fa;
}

.footer-section div {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-section a {
  color: #94a3b8;
  text-decoration: none;
}

.footer-section a:hover {
  color: #60a5fa;
}

.footer-bottom {
  padding: 1rem 0;
  text-align: center;
  border-top: 1px solid #334155;
}

@media (max-width: 768px) {
  .icon-button {
    display: block;
  }

  .nav-links a:not(:last-child) {
    display: none;
  }
}
</style>
