'use strict';

class Color {
  r;
  g;
  b;

  constructor(r, g, b) {
    this.set(r, g, b);
  }

  toString() {
    return `rgb(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)})`;
  }

  set(r, g, b) {
    this.r = this.clamp(r);
    this.g = this.clamp(g);
    this.b = this.clamp(b);
  }

  hueRotate(angle = 0) {
    angle = angle / 180 * Math.PI;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    this.multiply([
      0.213 + cos * 0.787 - sin * 0.213,
      0.715 - cos * 0.715 - sin * 0.715,
      0.072 - cos * 0.072 + sin * 0.928,
      0.213 - cos * 0.213 + sin * 0.143,
      0.715 + cos * 0.285 + sin * 0.140,
      0.072 - cos * 0.072 - sin * 0.283,
      0.213 - cos * 0.213 - sin * 0.787,
      0.715 - cos * 0.715 + sin * 0.715,
      0.072 + cos * 0.928 + sin * 0.072,
    ]);
  }

  grayscale(value = 1) {
    this.multiply([
      0.2126 + 0.7874 * (1 - value),
      0.7152 - 0.7152 * (1 - value),
      0.0722 - 0.0722 * (1 - value),
      0.2126 - 0.2126 * (1 - value),
      0.7152 + 0.2848 * (1 - value),
      0.0722 - 0.0722 * (1 - value),
      0.2126 - 0.2126 * (1 - value),
      0.7152 - 0.7152 * (1 - value),
      0.0722 + 0.9278 * (1 - value),
    ]);
  }

  sepia(value = 1) {
    this.multiply([
      0.393 + 0.607 * (1 - value),
      0.769 - 0.769 * (1 - value),
      0.189 - 0.189 * (1 - value),
      0.349 - 0.349 * (1 - value),
      0.686 + 0.314 * (1 - value),
      0.168 - 0.168 * (1 - value),
      0.272 - 0.272 * (1 - value),
      0.534 - 0.534 * (1 - value),
      0.131 + 0.869 * (1 - value),
    ]);
  }

  saturate(value = 1) {
    this.multiply([
      0.213 + 0.787 * value,
      0.715 - 0.715 * value,
      0.072 - 0.072 * value,
      0.213 - 0.213 * value,
      0.715 + 0.285 * value,
      0.072 - 0.072 * value,
      0.213 - 0.213 * value,
      0.715 - 0.715 * value,
      0.072 + 0.928 * value,
    ]);
  }

  multiply(matrix) {
    const newR = this.clamp(this.r * matrix[0] + this.g * matrix[1] + this.b * matrix[2]);
    const newG = this.clamp(this.r * matrix[3] + this.g * matrix[4] + this.b * matrix[5]);
    const newB = this.clamp(this.r * matrix[6] + this.g * matrix[7] + this.b * matrix[8]);
    this.r = newR;
    this.g = newG;
    this.b = newB;
  }

  brightness(value = 1) {
    this.linear(value);
  }

  contrast(value = 1) {
    this.linear(value, -(0.5 * value) + 0.5);
  }

  linear(slope = 1, intercept = 0) {
    this.r = this.clamp(this.r * slope + intercept * 255);
    this.g = this.clamp(this.g * slope + intercept * 255);
    this.b = this.clamp(this.b * slope + intercept * 255);
  }

  invert(value = 1) {
    this.r = this.clamp((value + this.r / 255 * (1 - 2 * value)) * 255);
    this.g = this.clamp((value + this.g / 255 * (1 - 2 * value)) * 255);
    this.b = this.clamp((value + this.b / 255 * (1 - 2 * value)) * 255);
  }

  hsl() {
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: h * 100,
      s: s * 100,
      l: l * 100,
    };
  }

  clamp(value) {
    return Math.min(255, Math.max(0, value));
  }
}

class Solver {
  target;
  targetHSL;
  reusedColor;

  constructor(target) {
    this.target = target;
    this.targetHSL = target.hsl();
    this.reusedColor = new Color(0, 0, 0);
  }

  solve(startingValues = null) {
    const result = this.solveNarrow(this.solveWide(startingValues));
    return {
      values: result.values,
      loss: result.loss,
      filter: this.css(result.values),
    };
  }

  solveWide(startingValues = null) {
    const A = 5;
    const c = 15;
    const a = [60, 180, 18000, 600, 1.2, 1.2];
    
    let best = { loss: Infinity };
    
    // Use provided starting values or default
    const initial = startingValues || [50, 20, 3750, 50, 100, 100];
    
    for (let i = 0; best.loss > 5 && i < 3; i++) {
      const result = this.spsa(A, a, c, initial, 1000);
      if (result.loss < best.loss) {
        best = result;
      }
    }
    return best;
  }

  solveNarrow(wide) {
    const A = wide.loss;
    const c = 2;
    const A1 = A + 1;
    const a = [0.25 * A1, 0.25 * A1, A1, 0.25 * A1, 0.2 * A1, 0.2 * A1];
    return this.spsa(A, a, c, wide.values, 1000);
  }

  spsa(A, a, c, values, iters) {
    const alpha = 1;
    const gamma = 0.16666666666666666;

    let best = null;
    let bestLoss = Infinity;
    const deltas = new Array(6);
    const highArgs = new Array(6);
    const lowArgs = new Array(6);

    for (let k = 0; k < iters; k++) {
      const ck = c / Math.pow(k + 1, gamma);
      for (let i = 0; i < 6; i++) {
        deltas[i] = Math.random() > 0.5 ? 1 : -1;
        highArgs[i] = values[i] + ck * deltas[i];
        lowArgs[i] = values[i] - ck * deltas[i];
      }

      const lossDiff = this.loss(highArgs) - this.loss(lowArgs);
      for (let i = 0; i < 6; i++) {
        const g = lossDiff / (2 * ck) * deltas[i];
        const ak = a[i] / Math.pow(A + k + 1, alpha);
        values[i] = fix(values[i] - ak * g, i);
      }

      const loss = this.loss(values);
      if (loss < bestLoss) {
        best = values.slice(0);
        bestLoss = loss;
      }
    }
    return {values: best, loss: bestLoss};

    function fix(value, idx) {
      let max = 100;
      if (idx === 2) {
        max = 20000;
      } else if (idx === 4 || idx === 5) {
        max = 400;
      }
      if (idx === 3) {
        if (value > max) value %= max;
        else if (value < 0) value = max + value % max;
      } else if (value < 0) value = 0;
      else if (value > max) value = max;
      return value;
    }
  }

  loss(filters) {
    const color = this.reusedColor;
    color.set(0, 0, 0);
    color.invert(filters[0] / 100);
    color.sepia(filters[1] / 100);
    color.saturate(filters[2] / 100);
    color.hueRotate(filters[3] * 3.6);
    color.brightness(filters[4] / 100);
    color.contrast(filters[5] / 100);

    const colorHSL = color.hsl();
    
    const darkColorWeight = (this.targetHSL.l < 30) ? 2 : 1;
    
    return (
      Math.abs(color.r - this.target.r) * darkColorWeight +
      Math.abs(color.g - this.target.g) * darkColorWeight +
      Math.abs(color.b - this.target.b) * darkColorWeight +
      Math.abs(colorHSL.h - this.targetHSL.h) * 0.5 +
      Math.abs(colorHSL.s - this.targetHSL.s) +
      Math.abs(colorHSL.l - this.targetHSL.l) * darkColorWeight
    );
  }

  css(filters) {
    const fmt = (idx, multiplier = 1) => Math.round(filters[idx] * multiplier);
    return `filter: invert(${fmt(0)}%) sepia(${fmt(1)}%) saturate(${fmt(2)}%) hue-rotate(${fmt(3, 3.6)}deg) brightness(${fmt(4)}%) contrast(${fmt(5)}%)`;
  }
}

export class FilterGenerator {
  public static hexToRgb(hex): any {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ] : null;
  }

  public static generateFilter(hexColor: string): string {
    // Special handling for pure colors
    const lowerHex = hexColor.toLowerCase();
    if (lowerHex === '#000000') {
      return 'brightness(0%)';
    }
    if (lowerHex === '#ffffff') {
      // For white, we need to invert the black SVG
      return 'invert(100%) brightness(100%) contrast(100%)';
    }

    const rgb = this.hexToRgb(hexColor);
    if (!rgb || rgb.length !== 3) return hexColor;

    // Check if color is pure white or black
    const isPureWhite = rgb[0] >= 250 && rgb[1] >= 250 && rgb[2] >= 250;
    const isPureBlack = rgb[0] <= 5 && rgb[1] <= 5 && rgb[2] <= 5;
    
    if (isPureWhite) {
      // For near-white colors, use invert with slight adjustments
      const minChannel = Math.min(rgb[0], rgb[1], rgb[2]);
      const brightness = (minChannel / 255) * 100;
      return `invert(100%) brightness(${brightness}%) contrast(100%)`;
    }
    if (isPureBlack) {
      const maxChannel = Math.max(rgb[0], rgb[1], rgb[2]);
      const brightness = (maxChannel / 255) * 100;
      return `brightness(${brightness}%)`;
    }

    let result;
    let count = 0;
    let bestResult = null;
    let bestLoss = Infinity;
    
    // Try multiple starting points for better convergence
    const startingPoints = [
      [50, 20, 3750, 50, 100, 100],  // Default
      [0, 0, 100, 0, 100, 100],      // No filters
      [100, 100, 100, 0, 100, 100],  // Full filters
    ];

    for (const startingPoint of startingPoints) {
      do {
        const color = new Color(rgb[0], rgb[1], rgb[2]);
        const solver = new Solver(color);
        result = solver.solve(startingPoint);
        
        if (result.loss < bestLoss) {
          bestResult = result;
          bestLoss = result.loss;
        }
        
        count++;
      } while (result.loss >= 1 && count <= 20); // Reduced iterations per starting point
    }

    // If we still have high loss, use simpler filters based on color properties
    if (bestLoss > 5) {
      const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
      const maxRgb = Math.max(rgb[0], rgb[1], rgb[2]);
      const minRgb = Math.min(rgb[0], rgb[1], rgb[2]);
      const saturation = (maxRgb - minRgb) / maxRgb * 100;
      
      if (brightness < 128) {
        const brightnessValue = (brightness / 255) * 100;
        if (saturation < 20) {
          // Nearly grayscale dark colors
          return `brightness(${brightnessValue}%)`;
        } else {
          return `brightness(${brightnessValue}%) saturate(${saturation}%) contrast(150%)`;
        }
      } else {
        if (saturation < 20) {
          // Nearly grayscale light colors
          return `brightness(${(brightness / 255) * 100}%)`;
        }
      }
    }

    return bestResult.filter.replace('filter: ', '').replace(';', '');
  }
}