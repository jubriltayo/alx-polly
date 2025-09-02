import '@testing-library/jest-dom';

// Polyfill TextEncoder for JSDOM environment
import { TextEncoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

// Polyfill Request and Response for JSDOM environment
import 'whatwg-fetch';

// Mock FormData for tests
global.FormData = class FormData {
  constructor() {
    this.data = new Map();
  }

  append(key, value) {
    if (!this.data.has(key)) {
      this.data.set(key, []);
    }
    this.data.get(key).push(value);
  }

  get(key) {
    return this.data.has(key) ? this.data.get(key)[0] : null;
  }

  getAll(key) {
    return this.data.has(key) ? this.data.get(key) : [];
  }

  has(key) {
    return this.data.has(key);
  }
};