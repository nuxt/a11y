<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="about-page">
    <!-- Page Header -->
    <section class="page-header">
      <div class="container">
        <!-- Issue: Heading level skip -->
        <h1>About Our Company</h1>
        <h4>Learn more about our mission and values</h4>
      </div>
    </section>

    <!-- Mission Section -->
    <section class="mission">
      <div class="container">
        <!-- Issue: Section without proper heading structure -->
        <div class="content-wrapper">
          <div class="text-content">
            <h2>Our Mission</h2>
            <!-- Issue: Low contrast text -->
            <p style="color: #888;">
              We are dedicated to creating web experiences that showcase various accessibility challenges.
              Our goal is to help developers identify and fix common a11y issues in their applications.
            </p>
            <!-- Issue: Redundant link text -->
            <a href="#">Click here to learn more about our mission</a>
          </div>
          <!-- Issue: Image without alt text -->
          <img
            src="https://placehold.co/500x300/8B5CF6/ffffff?text=Mission"
            class="section-image"
          >
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="team">
      <div class="container">
        <h2>Meet Our Team</h2>
        <div class="team-grid">
          <!-- Issue: Each card lacks semantic structure -->
          <div class="team-member">
            <!-- Issue: Image missing alt -->
            <img
              src="https://placehold.co/200/EC4899/ffffff?text=JD"
              class="avatar"
            >
            <h3>John Doe</h3>
            <!-- Issue: Role not properly marked up -->
            <div style="color: #999;">
              CEO & Founder
            </div>
            <!-- Issue: Icon buttons without labels -->
            <div class="social-links">
              <a href="#"><span>🐦</span></a>
              <a href="#"><span>💼</span></a>
              <a href="#"><span>📧</span></a>
            </div>
          </div>

          <div class="team-member">
            <img
              src="https://placehold.co/200/10B981/ffffff?text=JS"
              class="avatar"
            >
            <h3>Jane Smith</h3>
            <div style="color: #999;">
              CTO
            </div>
            <div class="social-links">
              <a href="#"><span>🐦</span></a>
              <a href="#"><span>💼</span></a>
              <a href="#"><span>📧</span></a>
            </div>
          </div>

          <div class="team-member">
            <img
              src="https://placehold.co/200/F59E0B/ffffff?text=BJ"
              class="avatar"
            >
            <h3>Bob Johnson</h3>
            <div style="color: #999;">
              Lead Developer
            </div>
            <div class="social-links">
              <a href="#"><span>🐦</span></a>
              <a href="#"><span>💼</span></a>
              <a href="#"><span>📧</span></a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Values Section -->
    <section class="values">
      <div class="container">
        <h2>Our Values</h2>
        <!-- Issue: List not using proper list markup -->
        <div class="values-grid">
          <div class="value-card">
            <div class="value-icon">
              ⚡
            </div>
            <h3>Innovation</h3>
            <div>Pushing boundaries in web development</div>
          </div>
          <div class="value-card">
            <div class="value-icon">
              🤝
            </div>
            <h3>Collaboration</h3>
            <div>Working together towards common goals</div>
          </div>
          <div class="value-card">
            <div class="value-icon">
              🎯
            </div>
            <h3>Excellence</h3>
            <div>Striving for quality in everything we do</div>
          </div>
          <div class="value-card">
            <div class="value-icon">
              🌟
            </div>
            <h3>Impact</h3>
            <div>Making a difference in the web community</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats">
      <div class="container">
        <!-- Issue: Numbers not marked up as data -->
        <div class="stats-grid">
          <div class="stat-item">
            <div
              class="stat-number"
              style="color: #4f46e5;"
            >
              500+
            </div>
            <div class="stat-label">
              Projects Completed
            </div>
          </div>
          <div class="stat-item">
            <div
              class="stat-number"
              style="color: #4f46e5;"
            >
              50+
            </div>
            <div class="stat-label">
              Team Members
            </div>
          </div>
          <div class="stat-item">
            <div
              class="stat-number"
              style="color: #4f46e5;"
            >
              10+
            </div>
            <div class="stat-label">
              Years Experience
            </div>
          </div>
          <div class="stat-item">
            <div
              class="stat-number"
              style="color: #4f46e5;"
            >
              95%
            </div>
            <div class="stat-label">
              Client Satisfaction
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Timeline Section -->
    <section class="timeline">
      <div class="container">
        <h2>Our Journey</h2>
        <!-- Issue: Timeline without proper ARIA landmarks -->
        <div class="timeline-container">
          <div class="timeline-item">
            <div class="year">
              2020
            </div>
            <div class="event">
              Company Founded
            </div>
          </div>
          <div class="timeline-item">
            <div class="year">
              2021
            </div>
            <div class="event">
              First Major Client
            </div>
          </div>
          <div class="timeline-item">
            <div class="year">
              2023
            </div>
            <div class="event">
              Expanded to 50+ Team Members
            </div>
          </div>
          <div class="timeline-item">
            <div class="year">
              2025
            </div>
            <div class="event">
              Launched A11y Testing Tool
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-page {
  width: 100%;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Page Header */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 0;
  text-align: center;
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.page-header h4 {
  font-size: 1.25rem;
  opacity: 0.9;
}

/* Mission Section */
.mission {
  padding: 4rem 0;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

.text-content h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #1e293b;
}

.text-content p {
  line-height: 1.8;
  margin-bottom: 1.5rem;
}

.text-content a {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 600;
}

.section-image {
  width: 100%;
  border-radius: 0.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* Team Section */
.team {
  padding: 4rem 0;
  background: #f8fafc;
}

.team h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 3rem;
  color: #1e293b;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.team-member {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.team-member h3 {
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.social-links {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.social-links a {
  font-size: 1.5rem;
  text-decoration: none;
}

/* Values Section */
.values {
  padding: 4rem 0;
}

.values h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 3rem;
  color: #1e293b;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.value-card {
  text-align: center;
  padding: 2rem;
}

.value-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.value-card h3 {
  margin-bottom: 0.5rem;
  color: #1e293b;
}

/* Stats Section */
.stats {
  background: #1e293b;
  color: white;
  padding: 4rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1.125rem;
  opacity: 0.8;
}

/* Timeline Section */
.timeline {
  padding: 4rem 0;
}

.timeline h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 3rem;
  color: #1e293b;
}

.timeline-container {
  max-width: 800px;
  margin: 0 auto;
}

.timeline-item {
  display: flex;
  gap: 2rem;
  padding: 1.5rem;
  border-left: 3px solid #4f46e5;
  margin-bottom: 1rem;
}

.year {
  font-size: 1.5rem;
  font-weight: bold;
  color: #4f46e5;
  min-width: 100px;
}

.event {
  font-size: 1.125rem;
  color: #1e293b;
}

@media (max-width: 768px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .timeline-item {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
