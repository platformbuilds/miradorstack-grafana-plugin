// Jest setup provided by Grafana scaffolding
import React from 'react';
import './.config/jest-setup';

const noop = () => {};

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
  // Polyfill required for uPlot layout logic in Discover histogram tests
  globalThis.ResizeObserver = ResizeObserver;
}

if (!('IntersectionObserver' in globalThis)) {
  class IntersectionObserverPolyfill {
    constructor(callback) {
      this.callback = callback;
    }

    observe(target) {
      this.callback?.([
        {
          isIntersecting: true,
          intersectionRatio: 1,
          target,
        },
      ]);
    }

    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  globalThis.IntersectionObserver = IntersectionObserverPolyfill;
}

if (!('Path2D' in globalThis)) {
  class Path2DPolyfill {
    constructor() {}
    addPath() {}
    moveTo() {}
    lineTo() {}
    closePath() {}
    arc() {}
    rect() {}
    quadraticCurveTo() {}
    bezierCurveTo() {}
  }
  globalThis.Path2D = Path2DPolyfill;
}

const ensureCanvasContext = () => {
  const proto = HTMLCanvasElement.prototype;

  proto.getContext = function getContext(type = '2d') {
    if (type !== '2d') {
      return null;
    }

    if (!this._context2d) {
      const canvas = this;
      const context = {
        canvas,
        clearRect: noop,
        fillRect: noop,
        strokeRect: noop,
        beginPath: noop,
        closePath: noop,
        moveTo: noop,
        lineTo: noop,
        bezierCurveTo: noop,
        arc: noop,
        rect: noop,
        fill: noop,
        stroke: noop,
        clip: noop,
        save: noop,
        restore: noop,
        setTransform: noop,
        resetTransform: noop,
        translate: noop,
        scale: noop,
        rotate: noop,
        drawImage: noop,
        putImageData: noop,
        getImageData: () => ({ data: [] }),
        createPattern: () => null,
        createLinearGradient: () => ({ addColorStop: noop }),
        createRadialGradient: () => ({ addColorStop: noop }),
        measureText: () => ({ width: 0 }),
        lineWidth: 1,
        font: '',
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        fillText: noop,
        strokeText: noop,
        setLineDash: noop,
        getLineDash: () => [],
        isPointInPath: () => false,
        isPointInStroke: () => false,
        textAlign: 'start',
        textBaseline: 'alphabetic',
        direction: 'inherit',
        fillStyle: '#000000',
        strokeStyle: '#000000',
        shadowBlur: 0,
        shadowColor: '#000000',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
      };

      Object.defineProperty(this, '_context2d', {
        value: context,
        enumerable: false,
        configurable: true,
        writable: true,
      });
    }

    return this._context2d;
  };
};

ensureCanvasContext();

if (!globalThis.grafanaBootData) {
  globalThis.grafanaBootData = {
    user: { timeZone: 'utc' },
    settings: {
      timeZone: 'utc',
      featureToggles: {},
      localeFormatPreference: 'browser',
    },
  };
}

jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');
  return {
    ...actual,
    TimeRangePicker: ({ onChange, timeRange, 'data-testid': dataTestId }) =>
      React.createElement('div', {
        'data-testid': dataTestId ?? 'mock-time-range-picker',
        onClick: () => onChange?.(timeRange),
      }),
  };
});
