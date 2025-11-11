/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createHighlighter } from '../src/runtime/utils/highlighter'

describe('highlighter', () => {
  let highlighter: ReturnType<typeof createHighlighter>

  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    highlighter = createHighlighter()
  })

  afterEach(() => {
    highlighter.unhighlightAll()
  })

  // Helper to create test elements
  function createTestElement(tag = 'div', id = 'test', className = ''): HTMLElement {
    const el = document.createElement(tag)
    if (id) el.id = id
    if (className) el.className = className
    document.body.appendChild(el)
    return el
  }

  describe('parseSelector', () => {
    it('should join selector array into valid CSS selector', () => {
      expect(highlighter.parseSelector(['#app', 'div.content', 'button'])).toBe('#app div.content button')
      expect(highlighter.parseSelector(['body', 'main'])).toBe('body main')
      expect(highlighter.parseSelector(['#single'])).toBe('#single')
    })
  })

  describe('highlightElement', () => {
    it('should inject styles on first highlight', () => {
      createTestElement('div', 'test1')

      expect(document.getElementById('__nuxt_a11y_highlight_styles__')).toBeNull()
      highlighter.highlightElement('#test1')
      expect(document.getElementById('__nuxt_a11y_highlight_styles__')).not.toBeNull()
    })

    it('should only inject styles once', () => {
      createTestElement('div', 'test1')
      createTestElement('div', 'test2')

      highlighter.highlightElement('#test1')
      const styleElement = document.getElementById('__nuxt_a11y_highlight_styles__')
      highlighter.highlightElement('#test2')

      expect(document.getElementById('__nuxt_a11y_highlight_styles__')).toBe(styleElement)
    })

    it('should add highlight class to regular elements', () => {
      const el = createTestElement('div', 'test1')

      highlighter.highlightElement('#test1')

      expect(el.classList.contains('__nuxt_a11y_highlight__')).toBe(true)
    })

    it('should apply custom color when provided', () => {
      const el = createTestElement('div', 'test1')
      const color = '#ff0000'

      highlighter.highlightElement('#test1', undefined, color)

      expect(el.style.outline).toContain(color)
    })

    it('should create ID badge when id is provided', () => {
      createTestElement('div', 'test1')

      highlighter.highlightElement('#test1', 5)

      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__')
      expect(badge).not.toBeNull()
      expect(badge?.textContent).toBe('5')
    })

    it('should set position relative for static positioned elements', () => {
      const el = createTestElement('div', 'test1')
      el.style.position = 'static'

      highlighter.highlightElement('#test1')

      expect(el.style.position).toBe('relative')
    })

    it('should not change position for non-static elements', () => {
      const el = createTestElement('div', 'test1')
      el.style.position = 'absolute'

      highlighter.highlightElement('#test1')

      expect(el.style.position).toBe('absolute')
    })

    it('should handle multiple elements with same selector', () => {
      createTestElement('div', 'test1', 'multi')
      createTestElement('div', 'test2', 'multi')
      createTestElement('div', 'test3', 'multi')

      highlighter.highlightElement('.multi')

      const elements = document.querySelectorAll('.multi')
      elements.forEach((el) => {
        expect(el.classList.contains('__nuxt_a11y_highlight__')).toBe(true)
      })
    })

    it('should handle void elements by wrapping them', () => {
      const img = createTestElement('img', 'test-img') as HTMLImageElement
      img.src = 'test.jpg'

      highlighter.highlightElement('#test-img')

      const wrapper = img.parentElement
      expect(wrapper?.tagName).toBe('SPAN')
      expect(wrapper?.classList.contains('__nuxt_a11y_highlight__')).toBe(true)
    })

    it('should handle input elements by wrapping them', () => {
      const input = createTestElement('input', 'test-input')

      highlighter.highlightElement('#test-input')

      const wrapper = input.parentElement
      expect(wrapper?.tagName).toBe('SPAN')
      expect(wrapper?.classList.contains('__nuxt_a11y_highlight__')).toBe(true)
    })

    it('should add ID badge to wrapper for void elements', () => {
      createTestElement('img', 'test-img')

      highlighter.highlightElement('#test-img', 3)

      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__')
      expect(badge).not.toBeNull()
      expect(badge?.textContent).toBe('3')
    })

    it('should handle selector not found gracefully', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})

      highlighter.highlightElement('#nonexistent')

      expect(spy).toHaveBeenCalledWith(expect.stringContaining('No elements found'))
      spy.mockRestore()
    })

    it('should handle invalid selector gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

      highlighter.highlightElement(':::invalid::selector')

      expect(spy).toHaveBeenCalledWith('[Nuxt A11y] Error highlighting element:', expect.anything())
      spy.mockRestore()
    })

    it('should use reference counting for multiple highlights of same selector', () => {
      const el = createTestElement('div', 'test1')

      highlighter.highlightElement('#test1')
      expect(highlighter.isHighlighted('#test1')).toBe(true)

      highlighter.highlightElement('#test1')
      highlighter.highlightElement('#test1')

      // Should still be highlighted after one unhighlight
      highlighter.unhighlightElement('#test1')
      expect(highlighter.isHighlighted('#test1')).toBe(true)
      expect(el.classList.contains('__nuxt_a11y_highlight__')).toBe(true)
    })

    it('should update ID badge when highlighting same element multiple times with different IDs', () => {
      createTestElement('div', 'test1')

      highlighter.highlightElement('#test1', 1)
      let badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__')
      expect(badge?.textContent).toBe('1')

      highlighter.highlightElement('#test1', 2)
      badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__')
      expect(badge?.textContent).toBe('2')
    })

    it('should create badge when highlighting again with ID after initial highlight without ID', () => {
      createTestElement('div', 'test1')

      highlighter.highlightElement('#test1')
      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).toBeNull()

      highlighter.highlightElement('#test1', 7)
      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__')
      expect(badge).not.toBeNull()
      expect(badge?.textContent).toBe('7')
    })

    it('should scroll element into view when scrollIntoView is true', () => {
      const el = createTestElement('div', 'test1')
      el.scrollIntoView = vi.fn()

      // Mock element as not visible
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: -100,
        left: 0,
        bottom: -50,
        right: 100,
        width: 100,
        height: 50,
        x: 0,
        y: -100,
        toJSON: () => {},
      })

      highlighter.highlightElement('#test1', undefined, undefined, true)

      expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    })

    it('should not scroll when element is already visible', () => {
      const el = createTestElement('div', 'test1')
      el.scrollIntoView = vi.fn()

      // Mock element as visible
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 10,
        left: 10,
        bottom: 100,
        right: 100,
        width: 90,
        height: 90,
        x: 10,
        y: 10,
        toJSON: () => {},
      })

      highlighter.highlightElement('#test1', undefined, undefined, true)

      expect(el.scrollIntoView).not.toHaveBeenCalled()
    })
  })

  describe('unhighlightElement', () => {
    it('should remove highlight class from element', () => {
      const el = createTestElement('div', 'test1')

      highlighter.highlightElement('#test1')
      expect(el.classList.contains('__nuxt_a11y_highlight__')).toBe(true)

      highlighter.unhighlightElement('#test1')
      expect(el.classList.contains('__nuxt_a11y_highlight__')).toBe(false)
    })

    it('should restore original styles', () => {
      const el = createTestElement('div', 'test1')
      el.style.outline = '1px solid blue'
      el.style.boxShadow = '0 0 5px red'
      const originalOutline = el.style.outline
      const originalBoxShadow = el.style.boxShadow

      highlighter.highlightElement('#test1', undefined, '#ff0000')
      expect(el.style.outline).not.toBe(originalOutline)

      highlighter.unhighlightElement('#test1')
      expect(el.style.outline).toBe(originalOutline)
      expect(el.style.boxShadow).toBe(originalBoxShadow)
    })

    it('should remove ID badge', () => {
      createTestElement('div', 'test1')

      highlighter.highlightElement('#test1', 5)
      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).not.toBeNull()

      highlighter.unhighlightElement('#test1')
      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).toBeNull()
    })

    it('should unwrap void elements', () => {
      const img = createTestElement('img', 'test-img')

      highlighter.highlightElement('#test-img')
      const wrapper = img.parentElement
      expect(wrapper?.tagName).toBe('SPAN')

      highlighter.unhighlightElement('#test-img')
      expect(img.parentElement).toBe(document.body)
    })

    it('should respect reference counting', () => {
      const el = createTestElement('div', 'test1')

      highlighter.highlightElement('#test1')
      highlighter.highlightElement('#test1')
      highlighter.highlightElement('#test1')

      highlighter.unhighlightElement('#test1')
      expect(el.classList.contains('__nuxt_a11y_highlight__')).toBe(true)

      highlighter.unhighlightElement('#test1')
      expect(el.classList.contains('__nuxt_a11y_highlight__')).toBe(true)

      highlighter.unhighlightElement('#test1')
      expect(el.classList.contains('__nuxt_a11y_highlight__')).toBe(false)
    })

    it('should do nothing for non-highlighted selector', () => {
      createTestElement('div', 'test1')

      // Should not throw
      expect(() => highlighter.unhighlightElement('#test1')).not.toThrow()
    })

    it('should handle missing parent node gracefully', () => {
      const img = createTestElement('img', 'test-img')

      highlighter.highlightElement('#test-img')
      const wrapper = img.parentElement!

      // Manually remove wrapper from DOM
      wrapper.remove()

      // Should not throw
      expect(() => highlighter.unhighlightElement('#test-img')).not.toThrow()
    })
  })

  describe('unhighlightAll', () => {
    it('should remove all highlights', () => {
      const el1 = createTestElement('div', 'test1')
      const el2 = createTestElement('div', 'test2')
      const el3 = createTestElement('span', 'test3')

      highlighter.highlightElement('#test1')
      highlighter.highlightElement('#test2')
      highlighter.highlightElement('#test3')

      expect(el1.classList.contains('__nuxt_a11y_highlight__')).toBe(true)
      expect(el2.classList.contains('__nuxt_a11y_highlight__')).toBe(true)
      expect(el3.classList.contains('__nuxt_a11y_highlight__')).toBe(true)

      highlighter.unhighlightAll()

      expect(el1.classList.contains('__nuxt_a11y_highlight__')).toBe(false)
      expect(el2.classList.contains('__nuxt_a11y_highlight__')).toBe(false)
      expect(el3.classList.contains('__nuxt_a11y_highlight__')).toBe(false)
    })

    it('should clear reference counts', () => {
      const el = createTestElement('div', 'test1')

      highlighter.highlightElement('#test1')
      highlighter.highlightElement('#test1')
      highlighter.highlightElement('#test1')

      highlighter.unhighlightAll()

      expect(el.classList.contains('__nuxt_a11y_highlight__')).toBe(false)
      expect(highlighter.isHighlighted('#test1')).toBe(false)
    })

    it('should handle empty state gracefully', () => {
      expect(() => highlighter.unhighlightAll()).not.toThrow()
    })
  })

  describe('isHighlighted', () => {
    it('should return true for highlighted elements', () => {
      createTestElement('div', 'test1')

      expect(highlighter.isHighlighted('#test1')).toBe(false)

      highlighter.highlightElement('#test1')

      expect(highlighter.isHighlighted('#test1')).toBe(true)
    })

    it('should return false after unhighlight', () => {
      createTestElement('div', 'test1')

      highlighter.highlightElement('#test1')
      expect(highlighter.isHighlighted('#test1')).toBe(true)

      highlighter.unhighlightElement('#test1')
      expect(highlighter.isHighlighted('#test1')).toBe(false)
    })

    it('should track multiple different highlights', () => {
      createTestElement('div', 'test1')
      createTestElement('div', 'test2')

      highlighter.highlightElement('#test1')

      expect(highlighter.isHighlighted('#test1')).toBe(true)
      expect(highlighter.isHighlighted('#test2')).toBe(false)

      highlighter.highlightElement('#test2')

      expect(highlighter.isHighlighted('#test1')).toBe(true)
      expect(highlighter.isHighlighted('#test2')).toBe(true)
    })
  })

  describe('updateElementId', () => {
    it('should update existing ID badge text', () => {
      createTestElement('div', 'test1')

      highlighter.highlightElement('#test1', 5)
      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__')
      expect(badge?.textContent).toBe('5')

      highlighter.updateElementId('#test1', 10)
      expect(badge?.textContent).toBe('10')
    })

    it('should create badge if it does not exist', () => {
      createTestElement('div', 'test1')

      highlighter.highlightElement('#test1')
      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).toBeNull()

      highlighter.updateElementId('#test1', 8)
      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__')
      expect(badge).not.toBeNull()
      expect(badge?.textContent).toBe('8')
    })

    it('should do nothing for non-highlighted elements', () => {
      createTestElement('div', 'test1')

      expect(() => highlighter.updateElementId('#test1', 5)).not.toThrow()
      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).toBeNull()
    })

    it('should update all elements with same selector', () => {
      createTestElement('div', 'test1', 'multi')
      createTestElement('div', 'test2', 'multi')

      highlighter.highlightElement('.multi', 1)
      const badges = document.querySelectorAll('.__nuxt_a11y_highlight_id_badge__')
      expect(badges).toHaveLength(2)

      highlighter.updateElementId('.multi', 99)
      badges.forEach((badge) => {
        expect(badge.textContent).toBe('99')
      })
    })
  })

  describe('removeElementIdBadge', () => {
    it('should remove ID badge without unhighlighting', () => {
      const el = createTestElement('div', 'test1')

      highlighter.highlightElement('#test1', 5)
      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).not.toBeNull()
      expect(el.classList.contains('__nuxt_a11y_highlight__')).toBe(true)

      highlighter.removeElementIdBadge('#test1')

      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).toBeNull()
      expect(el.classList.contains('__nuxt_a11y_highlight__')).toBe(true)
    })

    it('should handle element without badge gracefully', () => {
      createTestElement('div', 'test1')

      highlighter.highlightElement('#test1')

      expect(() => highlighter.removeElementIdBadge('#test1')).not.toThrow()
    })

    it('should do nothing for non-highlighted elements', () => {
      createTestElement('div', 'test1')

      expect(() => highlighter.removeElementIdBadge('#test1')).not.toThrow()
    })

    it('should remove badges from all elements with same selector', () => {
      createTestElement('div', 'test1', 'multi')
      createTestElement('div', 'test2', 'multi')

      highlighter.highlightElement('.multi', 1)
      expect(document.querySelectorAll('.__nuxt_a11y_highlight_id_badge__')).toHaveLength(2)

      highlighter.removeElementIdBadge('.multi')
      expect(document.querySelectorAll('.__nuxt_a11y_highlight_id_badge__')).toHaveLength(0)
    })

    it('should remove badge from wrapper for void elements', () => {
      createTestElement('img', 'test-img')

      highlighter.highlightElement('#test-img', 3)
      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).not.toBeNull()

      highlighter.removeElementIdBadge('#test-img')
      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).toBeNull()
    })

    it('should handle error when removing badge with mismatched parent', () => {
      createTestElement('div', 'test1')
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      highlighter.highlightElement('#test1', 5)
      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__') as HTMLElement

      // Move badge to a different parent to trigger the else branch
      const newParent = document.createElement('div')
      document.body.appendChild(newParent)
      newParent.appendChild(badge)

      highlighter.removeElementIdBadge('#test1')

      // Badge should be removed from its actual parent
      expect(newParent.children.length).toBe(0)
      spy.mockRestore()
    })
  })

  describe('scrollToElement', () => {
    it('should scroll to element', () => {
      const el = createTestElement('div', 'test1')
      el.scrollIntoView = vi.fn()

      highlighter.scrollToElement('#test1')

      expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    })

    it('should scroll to first element when multiple match', () => {
      const el1 = createTestElement('div', 'test1', 'multi')
      const el2 = createTestElement('div', 'test2', 'multi')
      el1.scrollIntoView = vi.fn()
      el2.scrollIntoView = vi.fn()

      highlighter.scrollToElement('.multi')

      expect(el1.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
      expect(el2.scrollIntoView).not.toHaveBeenCalled()
    })

    it('should handle invalid selector gracefully', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      highlighter.scrollToElement(':::invalid')

      expect(spy).toHaveBeenCalledWith('[Nuxt A11y] Error scrolling to element:', expect.anything())
      spy.mockRestore()
    })

    it('should do nothing for non-existent selector', () => {
      // Should not throw
      expect(() => highlighter.scrollToElement('#nonexistent')).not.toThrow()
    })
  })

  describe('special element handling', () => {
    it.each([
      'img', 'input', 'br', 'hr', 'area', 'base', 'col', 'embed',
      'link', 'meta', 'param', 'source', 'track', 'wbr',
    ])('should wrap void element: %s', (tag) => {
      const el = document.createElement(tag)
      el.id = 'test'
      document.body.appendChild(el)

      highlighter.highlightElement('#test')

      const parent = el.parentElement
      expect(parent?.tagName).toBe('SPAN')
      expect(parent?.style.position).toBe('relative')
    })

    it('should handle iframe as void element', () => {
      const iframe = createTestElement('iframe', 'test-iframe')

      highlighter.highlightElement('#test-iframe')

      const wrapper = iframe.parentElement
      expect(wrapper?.tagName).toBe('SPAN')
    })

    it('should handle select as void element', () => {
      const select = createTestElement('select', 'test-select')

      highlighter.highlightElement('#test-select')

      const wrapper = select.parentElement
      expect(wrapper?.tagName).toBe('SPAN')
    })

    it('should handle textarea as void element', () => {
      const textarea = createTestElement('textarea', 'test-textarea')

      highlighter.highlightElement('#test-textarea')

      const wrapper = textarea.parentElement
      expect(wrapper?.tagName).toBe('SPAN')
    })

    it('should set width 100% for select in wrapper', () => {
      const select = createTestElement('select', 'test-select')

      highlighter.highlightElement('#test-select')

      expect(select.style.width).toBe('100%')
    })

    it('should set width and height 100% for iframe in wrapper', () => {
      const iframe = createTestElement('iframe', 'test-iframe')
      Object.defineProperty(iframe, 'offsetWidth', { value: 300 })
      Object.defineProperty(iframe, 'offsetHeight', { value: 200 })

      highlighter.highlightElement('#test-iframe')

      expect(iframe.style.width).toBe('100%')
      expect(iframe.style.height).toBe('100%')
    })

    it('should set width 100% for textarea in wrapper', () => {
      const textarea = createTestElement('textarea', 'test-textarea')

      highlighter.highlightElement('#test-textarea')

      expect(textarea.style.width).toBe('100%')
    })

    it('should handle video element', () => {
      const video = createTestElement('video', 'test-video')

      highlighter.highlightElement('#test-video')

      const wrapper = video.parentElement
      expect(wrapper?.tagName).toBe('SPAN')
    })

    it('should handle audio element', () => {
      const audio = createTestElement('audio', 'test-audio')

      highlighter.highlightElement('#test-audio')

      const wrapper = audio.parentElement
      expect(wrapper?.tagName).toBe('SPAN')
    })

    it('should set image to display block when wrapped', () => {
      const img = createTestElement('img', 'test-img')

      highlighter.highlightElement('#test-img')

      expect(img.style.display).toBe('block')
    })

    it('should create wrapper with inline-block display for images', () => {
      const img = createTestElement('img', 'test-img')
      Object.defineProperty(img, 'offsetWidth', { value: 100 })
      Object.defineProperty(img, 'offsetHeight', { value: 50 })

      highlighter.highlightElement('#test-img')

      const wrapper = img.parentElement
      expect(wrapper?.style.display).toBe('inline-block')
      expect(wrapper?.style.width).toBe('100px')
      expect(wrapper?.style.height).toBe('50px')
    })

    it('should match wrapper dimensions to element', () => {
      const img = createTestElement('img', 'test-img')
      Object.defineProperty(img, 'offsetWidth', { value: 200 })
      Object.defineProperty(img, 'offsetHeight', { value: 150 })

      highlighter.highlightElement('#test-img')

      const wrapper = img.parentElement
      expect(wrapper?.style.width).toBe('200px')
      expect(wrapper?.style.height).toBe('150px')
    })
  })

  describe('edge cases', () => {
    it('should handle elements being removed from DOM during highlight', () => {
      const el = createTestElement('div', 'test1')

      highlighter.highlightElement('#test1')
      el.remove()

      expect(() => highlighter.unhighlightElement('#test1')).not.toThrow()
    })

    it('should preserve existing position values', () => {
      const el = createTestElement('div', 'test1')
      el.style.position = 'fixed'
      el.style.top = '10px'

      highlighter.highlightElement('#test1')

      expect(el.style.position).toBe('fixed')
      expect(el.style.top).toBe('10px')
    })

    it('should handle empty original styles correctly', () => {
      const el = createTestElement('div', 'test1')

      highlighter.highlightElement('#test1', undefined, '#ff0000')
      highlighter.unhighlightElement('#test1')

      // Should remove properties that weren't set originally
      expect(el.style.outline).toBe('')
      expect(el.style.boxShadow).toBe('')
    })

    it('should handle badge color matching highlight color', () => {
      createTestElement('div', 'test1')
      const color = '#00ff00'

      highlighter.highlightElement('#test1', 1, color)

      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__') as HTMLElement
      expect(badge.style.borderColor).toBe('rgb(0, 255, 0)')
    })

    it('should handle complex selectors', () => {
      const parent = createTestElement('div', 'parent')
      const child = document.createElement('div')
      child.className = 'child'
      parent.appendChild(child)

      highlighter.highlightElement('#parent .child')

      expect(child.classList.contains('__nuxt_a11y_highlight__')).toBe(true)
    })

    it('should handle elements with existing classes', () => {
      const el = createTestElement('div', 'test1', 'existing-class another-class')

      highlighter.highlightElement('#test1')

      expect(el.className).toContain('existing-class')
      expect(el.className).toContain('another-class')
      expect(el.className).toContain('__nuxt_a11y_highlight__')
    })
  })
})
