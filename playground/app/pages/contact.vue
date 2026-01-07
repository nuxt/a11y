<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="contact-page">
    <!-- Page Header -->
    <section class="page-header">
      <div class="container">
        <h1>Contact Us</h1>
        <h4>We'd love to hear from you</h4>
      </div>
    </section>

    <!-- Contact Section -->
    <section class="contact-section">
      <div class="container">
        <div class="contact-wrapper">
          <!-- Contact Form with multiple a11y issues -->
          <div class="form-container">
            <h2>Send us a message</h2>

            <!-- Issue: Form without proper structure and labels -->
            <form
              class="contact-form"
              @submit.prevent="handleSubmit"
            >
              <!-- Issue: Using placeholder instead of label -->
              <div class="form-group">
                <input
                  type="text"
                  placeholder="Your Name"
                  class="form-input"
                >
              </div>

              <!-- Issue: No label, email input without autocomplete -->
              <div class="form-group">
                <input
                  type="email"
                  placeholder="Email Address"
                  class="form-input"
                >
              </div>

              <!-- Issue: No label for phone -->
              <div class="form-group">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  class="form-input"
                >
              </div>

              <!-- Issue: Select without label, first option is placeholder -->
              <div class="form-group">
                <select class="form-input">
                  <option value="">
                    Select a topic
                  </option>
                  <option>General Inquiry</option>
                  <option>Support</option>
                  <option>Sales</option>
                </select>
              </div>

              <!-- Issue: Textarea without label, no character limit indication -->
              <div class="form-group">
                <textarea
                  placeholder="Your Message"
                  rows="5"
                  class="form-input"
                />
              </div>

              <!-- Issue: Required checkbox without proper label association -->
              <div class="form-group checkbox-group">
                <input
                  id="marketing"
                  type="checkbox"
                >
                <span style="color: #888;">Send me marketing emails</span>
              </div>

              <!-- Issue: Another checkbox without label element -->
              <div class="form-group checkbox-group">
                <input
                  id="terms"
                  type="checkbox"
                  required
                >
                <span>I agree to the terms and conditions</span>
              </div>

              <!-- Issue: Button with low contrast and small click target -->
              <button
                type="submit"
                class="submit-button"
                style="background: #888; color: #aaa; padding: 0.5rem 1rem;"
              >
                Submit
              </button>

              <!-- Issue: Reset button (generally not recommended) -->
              <button
                type="reset"
                class="reset-button"
                style="margin-left: 1rem;"
              >
                Reset Form
              </button>
            </form>
          </div>

          <!-- Contact Information -->
          <div class="info-container">
            <h2>Get in Touch</h2>

            <!-- Issue: Contact info not marked up as address -->
            <div class="contact-info">
              <!-- Issue: Icons without text alternatives -->
              <div class="info-item">
                <span class="icon">📍</span>
                <div>
                  <h3>Address</h3>
                  <!-- Issue: Address not in <address> tag -->
                  <p>123 Main Street<br>San Francisco, CA 94122</p>
                </div>
              </div>

              <div class="info-item">
                <span class="icon">📞</span>
                <div>
                  <h3>Phone</h3>
                  <!-- Issue: Phone not a clickable link -->
                  <p>(555) 123-4567</p>
                </div>
              </div>

              <div class="info-item">
                <span class="icon">📧</span>
                <div>
                  <h3>Email</h3>
                  <!-- Issue: Email not a mailto link -->
                  <p>contact@example.com</p>
                </div>
              </div>

              <div class="info-item">
                <span class="icon">🕐</span>
                <div>
                  <h3>Hours</h3>
                  <p>Mon - Fri: 9:00 AM - 5:00 PM<br>Sat - Sun: Closed</p>
                </div>
              </div>
            </div>

            <!-- Issue: Social media links without accessible names -->
            <div class="social-media">
              <h3>Follow Us</h3>
              <div class="social-links">
                <a
                  href="#"
                  style="background: #1DA1F2;"
                ><span>🐦</span></a>
                <a
                  href="#"
                  style="background: #0A66C2;"
                ><span>💼</span></a>
                <a
                  href="#"
                  style="background: #E4405F;"
                ><span>📷</span></a>
                <a
                  href="#"
                  style="background: #1877F2;"
                ><span>👍</span></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Map Section -->
    <section class="map-section">
      <div class="container">
        <h2>Find Us</h2>
        <!-- Issue: iframe without title -->
        <div class="map-container">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=-122.51068115234376%2C37.75350561106003%2C-122.39059448242189%2C37.81199842578225&layer=mapnik"
            width="100%"
            height="400"
            style="border: 0;"
          />
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq-section">
      <div class="container">
        <h2>Frequently Asked Questions</h2>

        <!-- Issue: FAQ not using proper disclosure pattern -->
        <div class="faq-list">
          <div
            class="faq-item"
            @click="toggleFAQ(1)"
          >
            <div class="faq-question">
              How long does it take to get a response?
            </div>
            <div
              v-if="openFAQ === 1"
              class="faq-answer"
            >
              We typically respond within 24-48 hours during business days.
            </div>
          </div>

          <div
            class="faq-item"
            @click="toggleFAQ(2)"
          >
            <div class="faq-question">
              Do you offer phone support?
            </div>
            <div
              v-if="openFAQ === 2"
              class="faq-answer"
            >
              Yes, phone support is available during business hours.
            </div>
          </div>

          <div
            class="faq-item"
            @click="toggleFAQ(3)"
          >
            <div class="faq-question">
              What information should I include in my message?
            </div>
            <div
              v-if="openFAQ === 3"
              class="faq-answer"
            >
              Please include as much detail as possible about your inquiry.
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const openFAQ = ref(null)

const toggleFAQ = (id) => {
  openFAQ.value = openFAQ.value === id ? null : id
}

const handleSubmit = () => {
  console.log('Form submitted')
}
</script>

<style scoped>
.contact-page {
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

/* Contact Section */
.contact-section {
  padding: 4rem 0;
}

.contact-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
}

/* Form Container */
.form-container h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #1e293b;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 2px solid #cbd5e1;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4f46e5;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
}

.submit-button, .reset-button {
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.submit-button {
  background: #4f46e5;
  color: white;
  padding: 0.75rem 2rem;
}

.submit-button:hover {
  opacity: 0.9;
}

.reset-button {
  background: #e5e7eb;
  color: #1e293b;
  padding: 0.75rem 2rem;
}

/* Info Container */
.info-container h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #1e293b;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.info-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.icon {
  font-size: 2rem;
}

.info-item h3 {
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.info-item p {
  color: #64748b;
  line-height: 1.6;
}

/* Social Media */
.social-media h3 {
  margin-bottom: 1rem;
  color: #1e293b;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-links a {
  width: 50px;
  height: 50px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  transition: transform 0.2s;
}

.social-links a:hover {
  transform: translateY(-3px);
}

/* Map Section */
.map-section {
  padding: 4rem 0;
  background: #f8fafc;
}

.map-section h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #1e293b;
}

.map-container {
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* FAQ Section */
.faq-section {
  padding: 4rem 0;
}

.faq-section h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 3rem;
  color: #1e293b;
}

.faq-list {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.faq-item:hover {
  border-color: #4f46e5;
}

.faq-question {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.125rem;
}

.faq-answer {
  margin-top: 1rem;
  color: #64748b;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .contact-wrapper {
    grid-template-columns: 1fr;
  }
}
</style>
