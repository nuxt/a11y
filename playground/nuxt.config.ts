import { resolve } from 'node:path'
import { onDevtoolsReady } from '@nuxt/devtools-kit'
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

        onDevtoolsReady(async (ctx) => {
          const session = await ctx.terminals.startChildProcess(
            {
              command: 'npx',
              args: ['nuxt', 'dev', '--port', '3030'],
              cwd: resolve(import.meta.dirname, '../client'),
            },
            {
              id: 'nuxt-a11y:client',
              title: 'Nuxt a11y Client Dev',
            },
          )

          session.getChildProcess()?.stdout?.on('data', (data) => {
            console.log(` sub: ${data.toString()}`)
          })

          process.on('exit', () => {
            session.terminate()
          })
        }, nuxt)
      },
    }),
  ],

  devtools: { enabled: true },

  compatibilityDate: '2024-08-21',

  a11y: {},
})
