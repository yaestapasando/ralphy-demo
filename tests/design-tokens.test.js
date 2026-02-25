/**
 * Design Tokens Tests
 * Validates that CSS custom properties are properly defined and accessible
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Design Tokens', () => {
  let cssContent;

  beforeEach(() => {
    // Read the design tokens CSS file
    const cssPath = join(process.cwd(), 'src/styles/design-tokens.css');
    cssContent = readFileSync(cssPath, 'utf-8');
  });

  describe('Color Tokens', () => {
    it('should define all gray scale colors', () => {
      const grayScales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

      grayScales.forEach(scale => {
        expect(cssContent).toContain(`--color-gray-${scale}:`);
      });
    });

    it('should define semantic colors', () => {
      const semanticColors = ['primary', 'success', 'warning', 'danger', 'info'];

      semanticColors.forEach(color => {
        expect(cssContent).toContain(`--color-${color}:`);
      });
    });

    it('should define blue color scale (WiFi)', () => {
      const blueScales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

      blueScales.forEach(scale => {
        expect(cssContent).toContain(`--color-blue-${scale}:`);
      });
    });

    it('should define green color scale (Success/Ethernet)', () => {
      const greenScales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

      greenScales.forEach(scale => {
        expect(cssContent).toContain(`--color-green-${scale}:`);
      });
    });

    it('should define yellow color scale (Warning/Cellular)', () => {
      const yellowScales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

      yellowScales.forEach(scale => {
        expect(cssContent).toContain(`--color-yellow-${scale}:`);
      });
    });

    it('should define red color scale (Error/Danger)', () => {
      const redScales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

      redScales.forEach(scale => {
        expect(cssContent).toContain(`--color-red-${scale}:`);
      });
    });

    it('should define indigo color scale (Bluetooth)', () => {
      const indigoScales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

      indigoScales.forEach(scale => {
        expect(cssContent).toContain(`--color-indigo-${scale}:`);
      });
    });

    it('should define base colors', () => {
      expect(cssContent).toContain('--color-white:');
      expect(cssContent).toContain('--color-black:');
    });
  });

  describe('Typography Tokens', () => {
    it('should define font families', () => {
      expect(cssContent).toContain('--font-family-sans:');
      expect(cssContent).toContain('--font-family-mono:');
    });

    it('should define font sizes', () => {
      const sizes = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];

      sizes.forEach(size => {
        expect(cssContent).toContain(`--text-${size}:`);
      });
    });

    it('should define line heights', () => {
      const lineHeights = ['none', 'tight', 'normal', 'relaxed', 'loose'];

      lineHeights.forEach(height => {
        expect(cssContent).toContain(`--leading-${height}:`);
      });
    });

    it('should define font weights', () => {
      const weights = ['normal', 'medium', 'semibold', 'bold'];

      weights.forEach(weight => {
        expect(cssContent).toContain(`--font-weight-${weight}:`);
      });
    });

    it('should define letter spacing', () => {
      const tracking = ['tight', 'normal', 'wide'];

      tracking.forEach(space => {
        expect(cssContent).toContain(`--tracking-${space}:`);
      });
    });
  });

  describe('Spacing Tokens', () => {
    it('should define spacing scale', () => {
      const spacingValues = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '10', '12', '16', '20', '24'];

      spacingValues.forEach(value => {
        expect(cssContent).toContain(`--spacing-${value}:`);
      });
    });

    it('should use rem units for spacing (except 0)', () => {
      const spacingPattern = /--spacing-[1-9]\d*:\s*[\d.]+rem/;
      expect(cssContent).toMatch(spacingPattern);
    });
  });

  describe('Border Tokens', () => {
    it('should define border radius values', () => {
      const radiusValues = ['none', 'sm', 'md', 'lg', 'xl', 'full'];

      radiusValues.forEach(value => {
        expect(cssContent).toContain(`--radius-${value}:`);
      });
    });

    it('should define border widths', () => {
      const widthValues = ['0', '1', '2', '4'];

      widthValues.forEach(value => {
        expect(cssContent).toContain(`--border-width-${value}:`);
      });
    });
  });

  describe('Shadow Tokens', () => {
    it('should define shadow scale', () => {
      const shadowValues = ['xs', 'sm', 'md', 'lg', 'xl', 'inner', 'none'];

      shadowValues.forEach(value => {
        expect(cssContent).toContain(`--shadow-${value}:`);
      });
    });
  });

  describe('Animation Tokens', () => {
    it('should define duration values', () => {
      const durations = ['fast', 'base', 'slow', 'slower'];

      durations.forEach(duration => {
        expect(cssContent).toContain(`--duration-${duration}:`);
      });
    });

    it('should define easing functions', () => {
      const easings = ['linear', 'in', 'out', 'in-out'];

      easings.forEach(easing => {
        expect(cssContent).toContain(`--ease-${easing}:`);
      });
    });
  });

  describe('Layout Tokens', () => {
    it('should define breakpoints', () => {
      const breakpoints = ['sm', 'md', 'lg', 'xl'];

      breakpoints.forEach(breakpoint => {
        expect(cssContent).toContain(`--breakpoint-${breakpoint}:`);
      });
    });

    it('should define container properties', () => {
      expect(cssContent).toContain('--container-max-width:');
      expect(cssContent).toContain('--container-padding-mobile:');
      expect(cssContent).toContain('--container-padding-tablet:');
      expect(cssContent).toContain('--container-padding-desktop:');
    });
  });

  describe('Icon Tokens', () => {
    it('should define icon sizes', () => {
      const iconSizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];

      iconSizes.forEach(size => {
        expect(cssContent).toContain(`--icon-size-${size}:`);
      });
    });
  });

  describe('Z-Index Tokens', () => {
    it('should define z-index values', () => {
      expect(cssContent).toContain('--z-index-dropdown:');
      expect(cssContent).toContain('--z-index-sticky:');
      expect(cssContent).toContain('--z-index-fixed:');
      expect(cssContent).toContain('--z-index-modal-backdrop:');
      expect(cssContent).toContain('--z-index-modal:');
      expect(cssContent).toContain('--z-index-popover:');
      expect(cssContent).toContain('--z-index-tooltip:');
    });

    it('should have hierarchical z-index values', () => {
      // Extract z-index values
      const dropdownMatch = cssContent.match(/--z-index-dropdown:\s*(\d+)/);
      const modalBackdropMatch = cssContent.match(/--z-index-modal-backdrop:\s*(\d+)/);
      const modalMatch = cssContent.match(/--z-index-modal:\s*(\d+)/);

      expect(dropdownMatch).toBeTruthy();
      expect(modalBackdropMatch).toBeTruthy();
      expect(modalMatch).toBeTruthy();

      const dropdownValue = parseInt(dropdownMatch[1]);
      const modalBackdropValue = parseInt(modalBackdropMatch[1]);
      const modalValue = parseInt(modalMatch[1]);

      // Modal should be above backdrop, backdrop should be above dropdown
      expect(modalValue).toBeGreaterThan(modalBackdropValue);
      expect(modalBackdropValue).toBeGreaterThan(dropdownValue);
    });
  });

  describe('Reduced Motion', () => {
    it('should include prefers-reduced-motion media query', () => {
      expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('should adjust animation durations for reduced motion', () => {
      expect(cssContent).toContain('animation-duration: 0.01ms !important');
      expect(cssContent).toContain('transition-duration: 0.01ms !important');
    });
  });

  describe('CSS Structure', () => {
    it('should use :root selector', () => {
      expect(cssContent).toContain(':root {');
    });

    it('should have proper CSS variable syntax', () => {
      // Check for valid CSS variable declarations
      const cssVarPattern = /--[\w-]+:\s*[^;]+;/g;
      const matches = cssContent.match(cssVarPattern);

      expect(matches).toBeTruthy();
      expect(matches.length).toBeGreaterThan(50); // Should have many variables
    });

    it('should not have duplicate variable names in the same scope', () => {
      // Extract the :root block and check for duplicates
      const rootBlockMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
      expect(rootBlockMatch).toBeTruthy();

      const rootBlock = rootBlockMatch[1];
      const variablePattern = /--([\w-]+):/g;
      const variables = [];
      let match;

      while ((match = variablePattern.exec(rootBlock)) !== null) {
        variables.push(match[1]);
      }

      // Remove duplicates and compare lengths
      const uniqueVariables = [...new Set(variables)];

      if (variables.length !== uniqueVariables.length) {
        const duplicates = variables.filter((item, index) => variables.indexOf(item) !== index);
        const uniqueDuplicates = [...new Set(duplicates)];
        console.warn('Duplicate variables found in :root:', uniqueDuplicates);
      }

      // In the :root scope, there should be no duplicates
      expect(variables.length).toBe(uniqueVariables.length);
    });
  });

  describe('Value Format Validation', () => {
    it('should use hex color format for color values', () => {
      const colorPattern = /--color-[\w-]+:\s*#[0-9a-fA-F]{6}/g;
      const matches = cssContent.match(colorPattern);

      expect(matches).toBeTruthy();
      expect(matches.length).toBeGreaterThan(40); // Should have many color definitions
    });

    it('should use rem units for most size values', () => {
      const remPattern = /--(?:text|spacing|radius|icon-size)-[\w-]+:\s*[\d.]+rem/g;
      const matches = cssContent.match(remPattern);

      expect(matches).toBeTruthy();
      expect(matches.length).toBeGreaterThan(20);
    });

    it('should use px units for border widths', () => {
      const pxPattern = /--border-width-[1-9]\d*:\s*\d+px/g;
      const matches = cssContent.match(pxPattern);

      expect(matches).toBeTruthy();
    });

    it('should use seconds for duration values', () => {
      const durationPattern = /--duration-[\w-]+:\s*[\d.]+s/g;
      const matches = cssContent.match(durationPattern);

      expect(matches).toBeTruthy();
    });
  });

  describe('Documentation', () => {
    it('should include section comments', () => {
      const expectedSections = [
        'COLORS',
        'TYPOGRAPHY',
        'SPACING',
        'BORDERS',
        'SHADOWS',
        'ANIMATIONS',
        'LAYOUT',
        'ICONS',
        'Z-INDEX'
      ];

      expectedSections.forEach(section => {
        expect(cssContent).toContain(section);
      });
    });

    it('should have a header comment with version', () => {
      expect(cssContent).toContain('Design Tokens');
      expect(cssContent).toContain('Version');
    });
  });
});
