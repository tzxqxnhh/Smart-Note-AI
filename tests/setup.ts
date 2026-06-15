import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom polyfill: scrollIntoView
if (typeof Element !== 'undefined' && typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = vi.fn() as unknown as () => void;
}
