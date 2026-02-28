<template>
  <div class="interactive-page">
    <section class="page-header">
      <div class="container">
        <h1>Interactive Dashboard</h1>
        <h4>Dynamic content to demonstrate auto-scan on user events</h4>
      </div>
    </section>

    <!-- Notification Feed — click event -->
    <section class="notifications-section">
      <div class="container">
        <h2>Notification Feed</h2>
        <button
          class="load-btn"
          @click="loadNotifications"
        >
          Load Notifications
        </button>
        <div class="notification-feed">
          <div
            v-for="(n, i) in notifications"
            :key="i"
            class="notification-card"
          >
            <img :src="`https://placehold.co/40x40/6366F1/ffffff?text=${n.avatar}`">
            <div>
              <div class="notification-name">
                {{ n.name }}
              </div>
              <p style="color: #bbb;">
                {{ n.message }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Profile Preview — input + change events -->
    <section class="profile-section">
      <div class="container">
        <h2>Profile Editor</h2>
        <div class="profile-grid">
          <div class="profile-form">
            <div class="form-group">
              <input
                v-model="profile.name"
                type="text"
                placeholder="Display name"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <input
                v-model="profile.bio"
                type="text"
                placeholder="Bio"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <select
                v-model="profile.role"
                class="form-input"
              >
                <option value="">
                  Select role
                </option>
                <option>Designer</option>
                <option>Developer</option>
                <option>Manager</option>
              </select>
            </div>
          </div>
          <div
            v-if="hasProfileInput"
            class="profile-preview"
          >
            <h4>Preview</h4>
            <img
              v-if="profile.name"
              :src="`https://placehold.co/80x80/764ba2/ffffff?text=${profile.name.charAt(0)}`"
            >
            <h6>{{ profile.name || 'Name' }}</h6>
            <p style="color: #aaa;">
              {{ profile.bio || 'Bio' }}
            </p>
            <div
              v-if="profile.role"
              class="role-badge"
              style="color: #999; background: #eee;"
            >
              {{ profile.role }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Product Catalog — click event -->
    <section class="products-section">
      <div class="container">
        <h2>Product Catalog</h2>
        <div class="product-grid">
          <div
            v-for="(p, i) in products"
            :key="i"
            class="product-card"
          >
            <img :src="p.image">
            <h3>{{ p.name }}</h3>
            <p style="color: #999;">
              {{ p.price }}
            </p>
            <div
              class="buy-btn"
              @click="() => {}"
            >
              Buy Now
            </div>
            <a href="#">Learn More</a>
          </div>
        </div>
        <button
          v-if="canLoadMore"
          class="load-btn"
          @click="loadMoreProducts"
        >
          Load More Products
        </button>
      </div>
    </section>

    <!-- Comments — submit event -->
    <section class="comments-section">
      <div class="container">
        <h2>Comments</h2>
        <form
          class="comment-form"
          @submit.prevent="postComment"
        >
          <input
            v-model="newComment"
            type="text"
            placeholder="Write a comment..."
            class="form-input"
          >
          <button
            type="submit"
            class="submit-btn"
          >
            <span>→</span>
          </button>
        </form>
        <div class="comments-list">
          <div
            v-for="(c, i) in comments"
            :key="i"
            class="comment-card"
          >
            <div class="comment-header">
              <span class="comment-icon">💬</span>
              <span class="comment-author">{{ c.author }}</span>
              <span style="color: #ccc; font-size: 0.75rem;">{{ c.time }}</span>
            </div>
            <p>{{ c.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Filters — click + keydown events -->
    <section class="filters-section">
      <div class="container">
        <h2>Sidebar Filters</h2>
        <div class="filter-list">
          <div
            v-for="(f, i) in filters"
            :key="i"
            class="filter-group"
          >
            <div
              class="filter-toggle"
              @click="toggleFilter(i)"
            >
              {{ f.label }}
              <span>{{ openFilter === i ? '−' : '+' }}</span>
            </div>
            <div
              v-if="openFilter === i"
              class="filter-options"
            >
              <div
                v-for="(opt, j) in f.options"
                :key="j"
                class="filter-option"
              >
                <input
                  :id="`filter-${i}-${j}`"
                  type="checkbox"
                >
                <span>{{ opt }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineOptions({ name: 'InteractiveDashboard' })

const notifications = ref([])
const notificationData = [
  { avatar: 'A', name: 'Alice', message: 'Liked your post' },
  { avatar: 'B', name: 'Bob', message: 'Commented on your photo' },
  { avatar: 'C', name: 'Charlie', message: 'Sent you a message' },
  { avatar: 'D', name: 'Diana', message: 'Started following you' },
]

function loadNotifications() {
  notifications.value = [...notificationData]
}

const profile = ref({ name: '', bio: '', role: '' })
const hasProfileInput = computed(() =>
  profile.value.name || profile.value.bio || profile.value.role,
)

const allProducts = [
  { name: 'Wireless Headphones', price: '$49.99', image: 'https://placehold.co/300x200/EF4444/ffffff?text=Headphones' },
  { name: 'Smart Watch', price: '$129.99', image: 'https://placehold.co/300x200/10B981/ffffff?text=Watch' },
  { name: 'Laptop Stand', price: '$34.99', image: 'https://placehold.co/300x200/3B82F6/ffffff?text=Stand' },
  { name: 'Mechanical Keyboard', price: '$89.99', image: 'https://placehold.co/300x200/F59E0B/ffffff?text=Keyboard' },
  { name: 'USB-C Hub', price: '$24.99', image: 'https://placehold.co/300x200/8B5CF6/ffffff?text=Hub' },
  { name: 'Webcam HD', price: '$59.99', image: 'https://placehold.co/300x200/EC4899/ffffff?text=Webcam' },
]
const products = ref(allProducts.slice(0, 3))
const canLoadMore = computed(() => products.value.length < allProducts.length)

function loadMoreProducts() {
  products.value = [...allProducts]
}

const newComment = ref('')
const comments = ref([])

function postComment() {
  if (!newComment.value.trim()) return
  comments.value.push({
    author: 'You',
    text: newComment.value,
    time: 'Just now',
  })
  newComment.value = ''
}

const filters = [
  { label: 'Category', options: ['Electronics', 'Clothing', 'Books', 'Home'] },
  { label: 'Price Range', options: ['Under $25', '$25-$50', '$50-$100', 'Over $100'] },
  { label: 'Rating', options: ['4+ Stars', '3+ Stars', '2+ Stars', '1+ Stars'] },
]
const openFilter = ref(null)

function toggleFilter(i) {
  openFilter.value = openFilter.value === i ? null : i
}
</script>

<style scoped>
.interactive-page {
  width: 100%;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

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

/* Sections */
section:not(.page-header) {
  padding: 4rem 0;
}

section:nth-child(even) {
  background: #f8fafc;
}

section h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #1e293b;
}

/* Shared */
.load-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1.5rem;
}

.load-btn:hover {
  opacity: 0.9;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 2px solid #cbd5e1;
  border-radius: 0.5rem;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #4f46e5;
}

.form-group {
  margin-bottom: 1rem;
}

/* Notification Feed */
.notification-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

.notification-card {
  display: flex;
  gap: 1rem;
  align-items: center;
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.notification-card img {
  border-radius: 50%;
}

.notification-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

/* Profile */
.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.profile-preview {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.profile-preview img {
  border-radius: 50%;
  margin-bottom: 1rem;
}

.profile-preview h6 {
  font-size: 1.25rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

/* Products */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.product-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.product-card img {
  width: 100%;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.product-card h3 {
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.product-card p {
  margin-bottom: 1rem;
}

.buy-btn {
  background: #4f46e5;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  display: inline-block;
  margin-bottom: 0.75rem;
}

.product-card a {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 600;
}

/* Comments */
.comment-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.comment-form .form-input {
  flex: 1;
}

.submit-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1.25rem;
  cursor: pointer;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-card {
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.comment-author {
  font-weight: 600;
  color: #1e293b;
}

/* Filters */
.filter-list {
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-group {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.filter-toggle {
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  cursor: pointer;
  font-weight: 600;
  color: #1e293b;
}

.filter-toggle:hover {
  background: #f8fafc;
}

.filter-options {
  padding: 0 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
