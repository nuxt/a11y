/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createScanner } from '../src/runtime/utils/scanner'
import { DEBOUNCE_DELAY, SCAN_EVENTS } from '../src/runtime/constants'

describe('scanner', () => {
  let scanner: ReturnType<typeof createScanner>
  let onScanMock: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    onScanMock = vi.fn()
    scanner = createScanner(onScanMock)
  })

  afterEach(() => {
    scanner.disable()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  function dispatchEventAndAdvance(eventType: string, delay = DEBOUNCE_DELAY) {
    document.dispatchEvent(new Event(eventType))
    vi.advanceTimersByTime(delay)
  }

  describe('enable', () => {
    it('should attach event listeners when enabled', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

      scanner.enable()

      expect(addEventListenerSpy).toHaveBeenCalledTimes(SCAN_EVENTS.length)
      SCAN_EVENTS.forEach((event) => {
        expect(addEventListenerSpy).toHaveBeenCalledWith(event, expect.any(Function), true)
      })
    })

    it('should set isEnabled to true and not attach listeners multiple times', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

      expect(scanner.isEnabled()).toBe(false)
      scanner.enable()
      expect(scanner.isEnabled()).toBe(true)

      scanner.enable()
      scanner.enable()

      // Should only be called once per event type
      expect(addEventListenerSpy).toHaveBeenCalledTimes(SCAN_EVENTS.length)
    })
  })

  describe('disable', () => {
    it('should remove event listeners and set isEnabled to false', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      scanner.enable()
      expect(scanner.isEnabled()).toBe(true)

      scanner.disable()

      expect(scanner.isEnabled()).toBe(false)
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(SCAN_EVENTS.length)
      SCAN_EVENTS.forEach((event) => {
        expect(removeEventListenerSpy).toHaveBeenCalledWith(event, expect.any(Function), true)
      })
    })

    it('should not remove event listeners if already disabled', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      scanner.disable()
      scanner.disable()

      expect(removeEventListenerSpy).not.toHaveBeenCalled()
    })

    it('should clear pending debounced scans when disabled', () => {
      scanner.enable()

      dispatchEventAndAdvance('click', DEBOUNCE_DELAY - 100)
      scanner.disable()
      vi.advanceTimersByTime(100)

      expect(onScanMock).not.toHaveBeenCalled()
    })
  })

  describe('isEnabled', () => {
    it('should track state through enable/disable cycles', () => {
      expect(scanner.isEnabled()).toBe(false)

      scanner.enable()
      expect(scanner.isEnabled()).toBe(true)

      scanner.disable()
      expect(scanner.isEnabled()).toBe(false)

      scanner.enable()
      expect(scanner.isEnabled()).toBe(true)
    })
  })

  describe('event handling and debouncing', () => {
    it.each(SCAN_EVENTS)('should trigger scan after debounce delay on %s event', (eventType) => {
      scanner.enable()

      dispatchEventAndAdvance(eventType)

      expect(onScanMock).toHaveBeenCalledTimes(1)
    })

    it('should debounce multiple rapid events into single scan', () => {
      scanner.enable()

      dispatchEventAndAdvance('click', 100)
      dispatchEventAndAdvance('click', 100)
      dispatchEventAndAdvance('click', 100)
      dispatchEventAndAdvance('click', DEBOUNCE_DELAY)

      expect(onScanMock).toHaveBeenCalledTimes(1)
    })

    it('should reset debounce timer on each event', () => {
      scanner.enable()

      dispatchEventAndAdvance('click', DEBOUNCE_DELAY - 100)
      expect(onScanMock).not.toHaveBeenCalled()

      dispatchEventAndAdvance('input', DEBOUNCE_DELAY - 100)
      expect(onScanMock).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(onScanMock).toHaveBeenCalledTimes(1)
    })

    it('should allow multiple scans with sufficient time between events', () => {
      scanner.enable()

      dispatchEventAndAdvance('click')
      expect(onScanMock).toHaveBeenCalledTimes(1)

      dispatchEventAndAdvance('input')
      expect(onScanMock).toHaveBeenCalledTimes(2)

      dispatchEventAndAdvance('change')
      expect(onScanMock).toHaveBeenCalledTimes(3)
    })

    it('should not trigger scan when disabled', () => {
      scanner.enable()
      scanner.disable()

      dispatchEventAndAdvance('click')

      expect(onScanMock).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle onScan callback throwing an error', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Scan error')
      })
      const errorScanner = createScanner(errorCallback)

      errorScanner.enable()

      expect(() => {
        dispatchEventAndAdvance('click')
      }).toThrow('Scan error')

      errorScanner.disable()
    })

    it('should handle rapid enable/disable cycles', () => {
      scanner.enable()
      scanner.disable()
      scanner.enable()
      scanner.disable()
      scanner.enable()

      expect(scanner.isEnabled()).toBe(true)

      dispatchEventAndAdvance('click')

      expect(onScanMock).toHaveBeenCalledTimes(1)
    })

    it('should maintain separate state for multiple scanner instances', () => {
      const onScanMock2 = vi.fn()
      const scanner2 = createScanner(onScanMock2)

      scanner.enable()
      expect(scanner.isEnabled()).toBe(true)
      expect(scanner2.isEnabled()).toBe(false)

      scanner2.enable()
      expect(scanner.isEnabled()).toBe(true)
      expect(scanner2.isEnabled()).toBe(true)

      scanner.disable()
      expect(scanner.isEnabled()).toBe(false)
      expect(scanner2.isEnabled()).toBe(true)

      scanner2.disable()
    })
  })
})
