// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';

Object.defineProperty(window, 'CanvasRenderingContext2D', {
  value: class {
    measureText(text) {
      return { width: text.length * 10, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 5 };
    }
  },
  configurable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => new window.CanvasRenderingContext2D()),
  configurable: true,
});
