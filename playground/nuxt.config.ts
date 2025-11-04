import { resolve } from 'node:path'
import { startSubprocess } from '@nuxt/devtools-kit'
import { defineNuxtModule } from '@nuxt/kit'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxt/a11y',
    /**
     * Start a sub Nuxt Server for developing the client
     *
     * The terminal output can be found in the Terminals tab of the devtools.
     */
    defineNuxtModule({
      setup(_, nuxt) {
        if (!nuxt.options.dev) return

        const subprocess = startSubprocess(
          {
            command: 'npx',
            args: ['nuxi', 'dev', '--port', '3030'],
            cwd: resolve(__dirname, '../client'),
          },
          {
            id: 'nuxt-a11y:client',
            name: 'Nuxt a11y Client Dev',
          },
        )
        subprocess.getProcess().stdout?.on('data', (data) => {
          console.log(` sub: ${data.toString()}`)
        })

        process.on('exit', () => {
          subprocess.terminate()
        })

        // process.getProcess().stdout?.pipe(process.stdout)
        // process.getProcess().stderr?.pipe(process.stderr)
      },
    }),
  ],

  devtools: { enabled: true },

  routeRules: {
    '/__nuxt-a11y-client/**': { proxy: 'http://localhost:3030/__nuxt-a11y-client/**' },
  },

  compatibilityDate: '2024-08-21',

  nitro: {
    devProxy: {
      '/__nuxt-a11y-client': {
        target: 'http://localhost:3030/__nuxt-a11y-client',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  a11y: {},
})
