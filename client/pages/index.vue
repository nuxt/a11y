<script setup lang="ts">
import type axe from 'axe-core'
import { onDevtoolsClientConnected, useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'
import type {} from '../../shared/declarations'
import { shallowRef } from 'vue'

const client = useDevtoolsClient()

const results = shallowRef<axe.AxeResults | null>(null)

onDevtoolsClientConnected((client) => {
  client.host.hooks.callHook('a11y:iframe-ready')
  client.host.hooks.hook('a11y:run', (r) => {
    console.log('Axe results:', r)
    results.value = r
  })
})
</script>

<template>
  <div class="relative p-10 n-bg-base flex flex-col h-screen">
    <div
      v-if="client"
      class="flex flex-col gap-2"
    >
      <NTip
        n="green"
        icon="carbon-checkmark"
      >
        Nuxt DevTools is connected
      </NTip>
      <div>
        The current app is using
        <code class="text-green">vue@{{ client.host.nuxt.vueApp.version }}</code>
      </div>
      <div>
        <NButton
          n="green"
          class="mt-4"
          @click="client!.host.devtools.close()"
        >
          Close DevTools
        </NButton>
      </div>
    </div>
    <div v-else>
      <NTip n="yellow">
        Failed to connect to the client. Did you open this page inside Nuxt DevTools?
      </NTip>
    </div>

    <ul>
      <li
        v-for="i, idx of results?.violations"
        :key="idx"
      >
        {{ i.description }}
        <a
          :href="i.helpUrl"
          target="_blank"
        >{{ i.help }}</a>
      </li>
    </ul>
  </div>
</template>
