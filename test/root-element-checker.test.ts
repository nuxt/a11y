import { describe, it, expect } from 'vitest'
import { isRootElementSelector } from '../client/composables/root-element-checker'

describe('isRootElementSelector', () => {
  const testCases = (cases: Array<[string, boolean]>) => {
    cases.forEach(([selector, expected]) => {
      it(`${expected ? 'returns true' : 'returns false'} for "${selector}"`, () => {
        expect(isRootElementSelector(selector)).toBe(expected)
      })
    })
  }

  describe('root element selectors', () => {
    testCases([
      // Basic root elements
      ['html', true],
      ['body', true],
      ['head', true],
      ['document', true],
      ['window', true],

      // Case insensitivity
      ['HTML', true],
      ['BODY', true],
      ['HEAD', true],
      ['HtMl', true],
      ['BoDy', true],

      // With attributes
      ['html[lang]', true],
      ['html[lang="en"]', true],
      ['body[class]', true],
      ['head[data-test]', true],

      // With classes
      ['body.main', true],
      ['html.no-js', true],
      ['head.custom', true],

      // With IDs
      ['body#app', true],
      ['html#root', true],

      // With pseudo-classes
      ['html:lang(en)', true],
      ['body:not(.loading)', true],

      // With whitespace
      ['  html  ', true],
      ['  body  ', true],
      ['  head  ', true],
      [' document ', true],
      [' window ', true],
    ])
  })

  describe('non-root element selectors', () => {
    testCases([
      // Regular elements
      ['div', false],
      ['span', false],
      ['p', false],
      ['a', false],
      ['button', false],

      // Elements with similar names
      ['htmldiv', false],
      ['bodywrapper', false],
      ['header', false],
      ['heading', false],

      // Compound selectors starting with non-root
      ['div body', false],
      ['#app html', false],
      ['.container body', false],

      // Complex selectors
      ['div.body', false],
      ['span#html', false],
      ['section.head', false],

      // IDs and classes
      ['#html', false],
      ['.body', false],
      ['#body', false],
      ['.html', false],

      // Attribute selectors
      ['[data-html]', false],
      ['[data-body]', false],

      // Descendant selectors (not starting with root)
      ['main > div', false],
      ['#app > .content', false],

      // Empty or whitespace only
      ['', false],
      ['   ', false],
    ])
  })
})
