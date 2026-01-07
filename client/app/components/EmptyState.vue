<script setup lang="ts">
const { version: axeVersion, docsUrl: axeDocsUrl } = useAxeVersion()
</script>

<template>
  <div class="flex items-center justify-center py-5">
    <div class="max-w-md">
      <div class="text-center mb-6">
        <NIcon
          icon="i-carbon-search"
          class="text-6xl opacity-50 mb-4"
        />
        <h2 class="text-xl font-semibold mb-2">
          No issues found
        </h2>
      </div>
      <div class="text-left space-y-4">
        <p class="text-sm opacity-70">
          No issues found does not necessarily mean your application is fully
          accessible. The commonly accepted rate for automatically detectable
          accessibility issues is around 20-30%.
        </p>
        <p class="text-sm opacity-70">
          The automated accessibility testing results of this tool are coming
          from
          <a
            href="https://www.deque.com/axe/"
            target="_blank"
            class="underline hover:opacity-100 transition-opacity"
          >axe-core</a>, which is a great starting point for identifying potential
          accessibility issues. All the rules the axe-core (v{{ axeVersion }})
          engine checks for can be found in their
          <a
            :href="axeDocsUrl"
            target="_blank"
            class="underline hover:opacity-100 transition-opacity"
          >rules list {{ axeVersion }}</a>.
        </p>
        <p class="text-sm opacity-70">
          For a more complete accessibility evaluation,
          consider testing manually against the
          <a
            href="https://www.w3.org/WAI/standards-guidelines/wcag/"
            target="_blank"
            class="underline hover:opacity-100 transition-opacity"
          >WCAG guidelines</a>, with
          <a
            href="https://www.w3.org/WAI/people/"
            target="_blank"
            class="underline hover:opacity-100 transition-opacity"
          >real users</a>
          and
          <a
            href="https://www.w3.org/WAI/people-use-web/tools-techniques/"
            target="_blank"
            class="underline hover:opacity-100 transition-opacity"
          >assistive technologies</a>
          to ensure accessibility for all.
        </p>
        <div class="mt-6">
          <h3 class="text-lg font-semibold mb-2">
            More resources to get you started:
          </h3>

          <ul class="list-disc list-inside text-sm opacity-70 space-y-1">
            <li>
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/Accessibility"
                target="_blank"
                class="underline hover:opacity-100 transition-opacity"
              >
                MDN Web Accessibility Documentation
              </a>
            </li>
            <li>
              <a
                href="https://aaardvarkaccessibility.com/wcag-plain-english/"
                target="_blank"
                class="underline hover:opacity-100 transition-opacity"
              >
                WCAG in Plain English
              </a>
            </li>
            <li>
              <a
                href="https://www.w3.org/WAI/standards-guidelines/wcag/"
                target="_blank"
                class="underline hover:opacity-100 transition-opacity"
              >
                Web Content Accessibility Guidelines "WCAG" (Normative)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
