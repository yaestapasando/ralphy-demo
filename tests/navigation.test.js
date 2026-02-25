/**
 * Tests for the Navigation component
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createNavigation } from '../src/components/navigation.js';

describe('Navigation Component', () => {
  let container;
  let navigation;
  let onViewChangeMock;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    onViewChangeMock = vi.fn();
  });

  afterEach(() => {
    if (navigation) {
      navigation.destroy();
    }
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    it('should render navigation with default test view active', () => {
      navigation = createNavigation(container);

      const nav = container.querySelector('.app-nav');
      expect(nav).toBeTruthy();

      const testTab = container.querySelector('[data-view="test"]');
      expect(testTab).toBeTruthy();
      expect(testTab.classList.contains('app-nav__tab-button--active')).toBe(true);
      expect(testTab.getAttribute('aria-selected')).toBe('true');
    });

    it('should render navigation with custom initial view', () => {
      navigation = createNavigation(container, {
        initialView: 'history'
      });

      const historyTab = container.querySelector('[data-view="history"]');
      expect(historyTab.classList.contains('app-nav__tab-button--active')).toBe(true);
      expect(historyTab.getAttribute('aria-selected')).toBe('true');
    });

    it('should render both test and history tabs', () => {
      navigation = createNavigation(container);

      const testTab = container.querySelector('[data-view="test"]');
      const historyTab = container.querySelector('[data-view="history"]');

      expect(testTab).toBeTruthy();
      expect(historyTab).toBeTruthy();
      expect(testTab.textContent).toContain('Test');
      expect(historyTab.textContent).toContain('Histórico');
    });

    it('should include connection indicator container', () => {
      navigation = createNavigation(container);

      const indicatorContainer = container.querySelector('#connection-indicator-container');
      expect(indicatorContainer).toBeTruthy();
    });
  });

  describe('View Switching', () => {
    it('should switch view when clicking tab button', () => {
      navigation = createNavigation(container, {
        onViewChange: onViewChangeMock
      });

      const historyTab = container.querySelector('[data-view="history"]');
      historyTab.click();

      expect(onViewChangeMock).toHaveBeenCalledWith('history', 'test');
      expect(historyTab.classList.contains('app-nav__tab-button--active')).toBe(true);
      expect(historyTab.getAttribute('aria-selected')).toBe('true');
    });

    it('should not trigger callback when clicking already active tab', () => {
      navigation = createNavigation(container, {
        onViewChange: onViewChangeMock
      });

      const testTab = container.querySelector('[data-view="test"]');
      testTab.click();

      expect(onViewChangeMock).not.toHaveBeenCalled();
    });

    it('should update tab states when switching views', () => {
      navigation = createNavigation(container);

      const testTab = container.querySelector('[data-view="test"]');
      const historyTab = container.querySelector('[data-view="history"]');

      // Initially test is active
      expect(testTab.classList.contains('app-nav__tab-button--active')).toBe(true);
      expect(historyTab.classList.contains('app-nav__tab-button--active')).toBe(false);

      // Switch to history
      historyTab.click();

      expect(testTab.classList.contains('app-nav__tab-button--active')).toBe(false);
      expect(historyTab.classList.contains('app-nav__tab-button--active')).toBe(true);
    });

    it('should update URL hash when switching views', () => {
      navigation = createNavigation(container);

      const historyTab = container.querySelector('[data-view="history"]');
      historyTab.click();

      expect(window.location.hash).toBe('#history');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate to next tab with ArrowRight', () => {
      navigation = createNavigation(container, {
        onViewChange: onViewChangeMock
      });

      const testTab = container.querySelector('[data-view="test"]');
      const tabList = container.querySelector('[role="tablist"]');

      testTab.focus();
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      tabList.dispatchEvent(event);

      expect(onViewChangeMock).toHaveBeenCalledWith('history', 'test');
    });

    it('should navigate to previous tab with ArrowLeft', () => {
      navigation = createNavigation(container, {
        initialView: 'history',
        onViewChange: onViewChangeMock
      });

      const historyTab = container.querySelector('[data-view="history"]');
      const tabList = container.querySelector('[role="tablist"]');

      historyTab.focus();
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      tabList.dispatchEvent(event);

      expect(onViewChangeMock).toHaveBeenCalledWith('test', 'history');
    });

    it('should wrap to last tab when pressing ArrowLeft on first tab', () => {
      navigation = createNavigation(container, {
        onViewChange: onViewChangeMock
      });

      const tabList = container.querySelector('[role="tablist"]');
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      tabList.dispatchEvent(event);

      expect(onViewChangeMock).toHaveBeenCalledWith('history', 'test');
    });

    it('should wrap to first tab when pressing ArrowRight on last tab', () => {
      navigation = createNavigation(container, {
        initialView: 'history',
        onViewChange: onViewChangeMock
      });

      const tabList = container.querySelector('[role="tablist"]');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      tabList.dispatchEvent(event);

      expect(onViewChangeMock).toHaveBeenCalledWith('test', 'history');
    });

    it('should navigate to first tab with Home key', () => {
      navigation = createNavigation(container, {
        initialView: 'history',
        onViewChange: onViewChangeMock
      });

      const tabList = container.querySelector('[role="tablist"]');
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      tabList.dispatchEvent(event);

      expect(onViewChangeMock).toHaveBeenCalledWith('test', 'history');
    });

    it('should navigate to last tab with End key', () => {
      navigation = createNavigation(container, {
        onViewChange: onViewChangeMock
      });

      const tabList = container.querySelector('[role="tablist"]');
      const event = new KeyboardEvent('keydown', { key: 'End' });
      tabList.dispatchEvent(event);

      expect(onViewChangeMock).toHaveBeenCalledWith('history', 'test');
    });
  });

  describe('Public API', () => {
    it('should return current view', () => {
      navigation = createNavigation(container);
      expect(navigation.getCurrentView()).toBe('test');

      navigation.setView('history');
      expect(navigation.getCurrentView()).toBe('history');
    });

    it('should set view programmatically', () => {
      navigation = createNavigation(container, {
        onViewChange: onViewChangeMock
      });

      navigation.setView('history');

      expect(onViewChangeMock).toHaveBeenCalledWith('history', 'test');
      expect(navigation.getCurrentView()).toBe('history');
    });

    it('should ignore invalid view names', () => {
      navigation = createNavigation(container, {
        onViewChange: onViewChangeMock
      });

      navigation.setView('invalid');

      expect(onViewChangeMock).not.toHaveBeenCalled();
      expect(navigation.getCurrentView()).toBe('test');
    });

    it('should clean up on destroy', () => {
      navigation = createNavigation(container);
      navigation.destroy();

      expect(container.innerHTML).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      navigation = createNavigation(container);

      const nav = container.querySelector('.app-nav');
      expect(nav.getAttribute('role')).toBe('navigation');
      expect(nav.getAttribute('aria-label')).toBe('Navegación principal');

      const tabList = container.querySelector('[role="tablist"]');
      expect(tabList).toBeTruthy();

      const tabs = container.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(2);

      tabs.forEach(tab => {
        expect(tab.hasAttribute('aria-selected')).toBe(true);
        expect(tab.hasAttribute('aria-controls')).toBe(true);
        expect(tab.hasAttribute('id')).toBe(true);
      });
    });

    it('should update tabindex when switching tabs', () => {
      navigation = createNavigation(container);

      const testTab = container.querySelector('[data-view="test"]');
      const historyTab = container.querySelector('[data-view="history"]');

      // Initially test tab should be focusable
      expect(testTab.getAttribute('tabindex')).toBe('0');
      expect(historyTab.getAttribute('tabindex')).toBe('-1');

      // Switch to history
      historyTab.click();

      expect(testTab.getAttribute('tabindex')).toBe('-1');
      expect(historyTab.getAttribute('tabindex')).toBe('0');
    });

    it('should have visible focus indicators', () => {
      navigation = createNavigation(container);

      const testTab = container.querySelector('[data-view="test"]');
      const styles = window.getComputedStyle(testTab);

      // Check that outline is defined (browser default or custom)
      expect(testTab.matches(':focus-visible') || styles.outline !== 'none').toBeTruthy();
    });
  });
});
