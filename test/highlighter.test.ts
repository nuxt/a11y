/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createHighlighter,
  highlightElement,
  unhighlightElement,
  unhighlightAll,
  isHighlighted,
  updateElementId,
  removeElementIdBadge,
  scrollToElement,
} from '../src/runtime/utils/highlighter'

describe('highlighter', () => {
  // Helper to create test elements
  function createElement(id: string, tag = 'div'): HTMLElement {
    const el = document.createElement(tag)
    el.id = id
    document.body.appendChild(el)
    return el
  }

  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  afterEach(() => {
    unhighlightAll()
  })

  describe('highlightElement', () => {
    it('should inject styles on first call', () => {
      createElement('test')

      highlightElement('#test', undefined, '#ff0000')

      expect(document.getElementById('__nuxt_a11y_highlight_styles__')).toBeTruthy()
    })

    it('should create badge container when id provided', () => {
      createElement('test')

      highlightElement('#test', 1, '#ff0000')

      expect(document.getElementById('__nuxt_a11y_badge_container__')).toBeTruthy()
    })

    it('should apply inline highlight styles with color parameter', () => {
      const el = createElement('test')

      highlightElement('#test', undefined, '#ff0000')

      expect(el.style.outline).toContain('black')
      expect(el.style.boxShadow).toContain('#ff0000')
      expect(el.style.zIndex).toBe('999998')
    })

    it('should set position relative for static elements', () => {
      const el = createElement('test')
      el.style.position = 'static'

      highlightElement('#test', undefined, '#00ff00')

      expect(el.style.position).toBe('relative')
    })

    it('should preserve non-static position', () => {
      const el = createElement('test')
      el.style.position = 'absolute'

      highlightElement('#test', undefined, '#00ff00')

      expect(el.style.position).toBe('absolute')
    })

    it('should create ID badge in floating container when id provided', () => {
      createElement('test')

      highlightElement('#test', 5, '#ff0000')

      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__')
      expect(badge).toBeTruthy()
      expect(badge?.textContent).toBe('5')
      expect(badge?.parentElement?.id).toBe('__nuxt_a11y_badge_container__')
    })

    it('should position badge below element', () => {
      const el = createElement('test')
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 50,
        right: 200,
        bottom: 150,
        width: 100,
        height: 100,
        x: 100,
        y: 50,
        toJSON: () => {},
      })

      highlightElement('#test', 1, '#00ff00')

      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__') as HTMLElement
      expect(badge.style.left).toBe('138px') // 100 + 50 - 12
      expect(badge.style.top).toBe('158px') // 150 + 8
    })

    it('should apply custom border color to badge', () => {
      createElement('test')

      highlightElement('#test', 3, '#0000ff')

      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__') as HTMLElement
      expect(badge.style.borderColor).toBe('rgb(0, 0, 255)')
    })

    it('should handle multiple elements with same selector', () => {
      createElement('a').className = 'multi'
      createElement('b').className = 'multi'

      highlightElement('.multi', 7, '#ff00ff')

      const badges = document.querySelectorAll('.__nuxt_a11y_highlight_id_badge__')
      expect(badges).toHaveLength(2)
      badges.forEach(b => expect(b.textContent).toBe('7'))
    })

    it('should attach scroll and resize listeners', () => {
      const addEventSpy = vi.spyOn(window, 'addEventListener')
      createElement('test')

      highlightElement('#test')

      expect(addEventSpy).toHaveBeenCalledWith('scroll', expect.any(Function), expect.objectContaining({ passive: true, capture: true }))
      expect(addEventSpy).toHaveBeenCalledWith('resize', expect.any(Function), expect.objectContaining({ passive: true }))

      addEventSpy.mockRestore()
    })

    it('should update badge positions on scroll event', () => {
      const el = createElement('test')
      const getBoundingRect = vi.fn()
        .mockReturnValueOnce({
          left: 100,
          top: 50,
          right: 200,
          bottom: 150,
          width: 100,
          height: 100,
          x: 100,
          y: 50,
          toJSON: () => {},
        })
        .mockReturnValueOnce({
          left: 150,
          top: 100,
          right: 250,
          bottom: 200,
          width: 100,
          height: 100,
          x: 150,
          y: 100,
          toJSON: () => {},
        })

      vi.spyOn(el, 'getBoundingClientRect').mockImplementation(getBoundingRect)

      highlightElement('#test', 1, '#ff0000')
      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__') as HTMLElement

      // Initial position
      expect(badge.style.left).toBe('138px')
      expect(badge.style.top).toBe('158px')

      // Trigger scroll event
      window.dispatchEvent(new Event('scroll'))

      // Position should be updated
      expect(badge.style.left).toBe('188px')
      expect(badge.style.top).toBe('208px')
    })

    it('should update badge positions on resize event', () => {
      const el = createElement('test')
      const getBoundingRect = vi.fn()
        .mockReturnValueOnce({
          left: 100,
          top: 50,
          right: 200,
          bottom: 150,
          width: 100,
          height: 100,
          x: 100,
          y: 50,
          toJSON: () => {},
        })
        .mockReturnValueOnce({
          left: 200,
          top: 150,
          right: 300,
          bottom: 250,
          width: 100,
          height: 100,
          x: 200,
          y: 150,
          toJSON: () => {},
        })

      vi.spyOn(el, 'getBoundingClientRect').mockImplementation(getBoundingRect)

      highlightElement('#test', 2, '#00ff00')
      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__') as HTMLElement

      // Initial position
      expect(badge.style.left).toBe('138px')

      // Trigger resize event
      window.dispatchEvent(new Event('resize'))

      // Position should be updated
      expect(badge.style.left).toBe('238px')
      expect(badge.style.top).toBe('258px')
    })

    it('should use reference counting for repeated highlights', () => {
      createElement('test')

      highlightElement('#test', undefined, '#ff0000')
      highlightElement('#test', undefined, '#ff0000')
      highlightElement('#test', undefined, '#ff0000')

      unhighlightElement('#test')
      expect(isHighlighted('#test')).toBe(true)

      unhighlightElement('#test')
      expect(isHighlighted('#test')).toBe(true)

      unhighlightElement('#test')
      expect(isHighlighted('#test')).toBe(false)
    })

    it('should update badge on re-highlight with new id', () => {
      createElement('test')

      highlightElement('#test', 1, '#ff0000')
      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__')
      expect(badge?.textContent).toBe('1')

      highlightElement('#test', 9, '#ff0000')
      expect(badge?.textContent).toBe('9')
    })

    it('should scroll element into view when requested and not visible', () => {
      const el = createElement('test')
      el.scrollIntoView = vi.fn()
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: -200,
        right: 100,
        bottom: -100,
        width: 100,
        height: 100,
        x: 0,
        y: -200,
        toJSON: () => {},
      })

      highlightElement('#test', undefined, '#ff0000', true)

      expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    })

    it('should not scroll when element is visible', () => {
      const el = createElement('test')
      el.scrollIntoView = vi.fn()
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        right: 110,
        bottom: 110,
        width: 100,
        height: 100,
        x: 10,
        y: 10,
        toJSON: () => {},
      })

      highlightElement('#test', undefined, '#ff0000', true)

      expect(el.scrollIntoView).not.toHaveBeenCalled()
    })

    it('should log debug message for non-existent selector', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})

      highlightElement('#nonexistent')

      expect(spy).toHaveBeenCalledWith(expect.stringContaining('No elements found'))
      spy.mockRestore()
    })

    it('should catch and log error for invalid selector', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

      highlightElement(':::invalid')

      expect(spy).toHaveBeenCalledWith('[Nuxt A11y] Error highlighting element:', expect.anything())
      spy.mockRestore()
    })
  })

  describe('unhighlightElement', () => {
    it('should restore original styles', () => {
      const el = createElement('test')
      el.style.outline = '2px solid red'
      el.style.boxShadow = 'none'
      const origOutline = el.style.outline
      const origShadow = el.style.boxShadow

      highlightElement('#test', undefined, '#00ff00')
      expect(el.style.outline).not.toBe(origOutline)

      unhighlightElement('#test')
      expect(el.style.outline).toBe(origOutline)
      expect(el.style.boxShadow).toBe(origShadow)
    })

    it('should remove properties that were not originally set', () => {
      const el = createElement('test')

      highlightElement('#test', undefined, '#ff0000')
      unhighlightElement('#test')

      expect(el.style.outline).toBe('')
      expect(el.style.boxShadow).toBe('')
    })

    it('should remove badge from DOM', () => {
      createElement('test')

      highlightElement('#test', 5, '#ff0000')
      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).toBeTruthy()

      unhighlightElement('#test')
      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).toBeNull()
    })

    it('should handle missing badge gracefully', () => {
      createElement('test')

      highlightElement('#test')
      expect(() => unhighlightElement('#test')).not.toThrow()
    })

    it('should do nothing for non-highlighted selector', () => {
      createElement('test')

      expect(() => unhighlightElement('#test')).not.toThrow()
      expect(isHighlighted('#test')).toBe(false)
    })

    it('should respect reference counting', () => {
      const el = createElement('test')

      highlightElement('#test', undefined, '#ff0000')
      highlightElement('#test', undefined, '#ff0000')

      unhighlightElement('#test')
      expect(el.style.outline).toContain('black') // still highlighted

      unhighlightElement('#test')
      expect(el.style.outline).toBe('') // now unhighlighted
    })
  })

  describe('unhighlightAll', () => {
    it('should remove all highlights and badges', () => {
      const el1 = createElement('a')
      const el2 = createElement('b')

      highlightElement('#a', 1, '#ff0000')
      highlightElement('#b', 2, '#00ff00')

      expect(document.querySelectorAll('.__nuxt_a11y_highlight_id_badge__')).toHaveLength(2)

      unhighlightAll()

      expect(el1.style.outline).toBe('')
      expect(el2.style.outline).toBe('')
      expect(document.querySelectorAll('.__nuxt_a11y_highlight_id_badge__')).toHaveLength(0)
    })

    it('should force clear reference counts', () => {
      createElement('test')

      highlightElement('#test', undefined, '#ff0000')
      highlightElement('#test', undefined, '#ff0000')
      highlightElement('#test', undefined, '#ff0000')

      unhighlightAll()

      expect(isHighlighted('#test')).toBe(false)
    })

    it('should remove event listeners', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      createElement('test')

      highlightElement('#test')
      unhighlightAll()

      expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true)
      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))

      removeSpy.mockRestore()
    })

    it('should remove badge container', () => {
      createElement('test')

      highlightElement('#test', 1, '#ff0000')
      expect(document.getElementById('__nuxt_a11y_badge_container__')).toBeTruthy()

      unhighlightAll()
      expect(document.getElementById('__nuxt_a11y_badge_container__')).toBeNull()
    })

    it('should handle empty state gracefully', () => {
      expect(() => unhighlightAll()).not.toThrow()
    })
  })

  describe('isHighlighted', () => {
    it('should return true when element is highlighted', () => {
      createElement('test')

      expect(isHighlighted('#test')).toBe(false)

      highlightElement('#test', undefined, '#ff0000')

      expect(isHighlighted('#test')).toBe(true)
    })

    it('should return false after unhighlight', () => {
      createElement('test')

      highlightElement('#test', undefined, '#ff0000')
      unhighlightElement('#test')

      expect(isHighlighted('#test')).toBe(false)
    })
  })

  describe('updateElementId', () => {
    it('should update existing badge text and reposition', () => {
      createElement('test')

      highlightElement('#test', 1, '#ff0000')
      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__')
      expect(badge?.textContent).toBe('1')

      updateElementId('#test', 42)
      expect(badge?.textContent).toBe('42')
    })

    it('should create badge if none exists', () => {
      createElement('test')

      highlightElement('#test', undefined, '#ff0000')
      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).toBeNull()

      updateElementId('#test', 99)
      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__')
      expect(badge).toBeTruthy()
      expect(badge?.textContent).toBe('99')
    })

    it('should do nothing for non-highlighted selector', () => {
      createElement('test')

      expect(() => updateElementId('#test', 5)).not.toThrow()
      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).toBeNull()
    })

    it('should update all badges for multi-element selector', () => {
      createElement('a').className = 'multi'
      createElement('b').className = 'multi'

      highlightElement('.multi', 1, '#ff0000')
      updateElementId('.multi', 88)

      const badges = document.querySelectorAll('.__nuxt_a11y_highlight_id_badge__')
      badges.forEach(b => expect(b.textContent).toBe('88'))
    })
  })

  describe('removeElementIdBadge', () => {
    it('should remove badge without unhighlighting', () => {
      const el = createElement('test')

      highlightElement('#test', 5, '#ff0000')
      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).toBeTruthy()

      removeElementIdBadge('#test')

      expect(document.querySelector('.__nuxt_a11y_highlight_id_badge__')).toBeNull()
      expect(el.style.outline).toContain('black') // still highlighted
    })

    it('should handle missing badge gracefully', () => {
      createElement('test')

      highlightElement('#test', undefined, '#ff0000')
      expect(() => removeElementIdBadge('#test')).not.toThrow()
    })

    it('should do nothing for non-highlighted selector', () => {
      createElement('test')

      expect(() => removeElementIdBadge('#test')).not.toThrow()
    })

    it('should catch and log errors when badge removal fails', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      createElement('test')

      highlightElement('#test', 1, '#ff0000')
      const badge = document.querySelector('.__nuxt_a11y_highlight_id_badge__') as HTMLElement

      // Force an error by making parentNode throw
      Object.defineProperty(badge, 'parentNode', {
        get() {
          throw new Error('Test error')
        },
      })

      removeElementIdBadge('#test')

      expect(spy).toHaveBeenCalledWith('[Nuxt A11y] Error removing ID badge:', expect.anything())
      spy.mockRestore()
    })
  })

  describe('scrollToElement', () => {
    it('should scroll first matching element into view', () => {
      const el = createElement('test')
      el.scrollIntoView = vi.fn()

      scrollToElement('#test')

      expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    })

    it('should scroll only first element for multi-match selector', () => {
      const el1 = createElement('a')
      const el2 = createElement('b')
      el1.className = 'multi'
      el2.className = 'multi'
      el1.scrollIntoView = vi.fn()
      el2.scrollIntoView = vi.fn()

      scrollToElement('.multi')

      expect(el1.scrollIntoView).toHaveBeenCalled()
      expect(el2.scrollIntoView).not.toHaveBeenCalled()
    })

    it('should handle invalid selector gracefully', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      scrollToElement(':::invalid')

      expect(spy).toHaveBeenCalledWith('[Nuxt A11y] Error scrolling to element:', expect.anything())
      spy.mockRestore()
    })

    it('should do nothing for non-existent selector', () => {
      expect(() => scrollToElement('#nonexistent')).not.toThrow()
    })
  })

  describe('createHighlighter', () => {
    it('should return object with all expected functions', () => {
      const highlighter = createHighlighter()

      expect(highlighter).toHaveProperty('highlightElement')
      expect(highlighter).toHaveProperty('unhighlightElement')
      expect(highlighter).toHaveProperty('unhighlightAll')
      expect(highlighter).toHaveProperty('isHighlighted')
      expect(highlighter).toHaveProperty('updateElementId')
      expect(highlighter).toHaveProperty('removeElementIdBadge')
      expect(highlighter).toHaveProperty('scrollToElement')
      expect(highlighter).toHaveProperty('parseSelector')
    })

    it('should have working parseSelector utility', () => {
      const highlighter = createHighlighter()

      expect(highlighter.parseSelector(['#app', 'div', 'button'])).toBe('#app div button')
      expect(highlighter.parseSelector(['body'])).toBe('body')
    })
  })
})
