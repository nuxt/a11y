<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <h2>Heading index</h2>
    <h4>Subheading</h4>
    Nuxt module playground!
  </div>
  <details>
    <p>Details content</p>
    <button @click="showImage = !showImage">
      Click me
    </button>
  </details>
  <nuxt-link to="about-us">Go to About Us Page</nuxt-link>
  <div v-if="showImage">
    <img src="https://mockimg.co/600x400">
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showImage = ref(false)
</script>
