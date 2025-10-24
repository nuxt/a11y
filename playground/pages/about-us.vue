<template>
  <div>
    <h2>Heading about</h2>
    <h4>Subheading</h4>
    Nuxt module playground!
  </div>
  <details>
    <p>Details content</p>
    <button @click="showImage = !showImage">
      Click me
    </button>
  </details>
  <nuxt-link to="/">Go to Home Page</nuxt-link>
  <div v-if="showImage">
    <img src="https://mockimg.co/600x400">
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showImage = ref(false)
</script>
