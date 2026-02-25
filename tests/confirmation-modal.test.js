/**
 * Unit tests for ConfirmationModal component.
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createConfirmationModal } from '../src/components/confirmation-modal.js';

describe('confirmation-modal component', () => {
  beforeEach(() => {
    // Clean up any existing modals
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up any remaining modals
    const modals = document.querySelectorAll('.modal-backdrop');
    modals.forEach(modal => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    });
    document.body.style.overflow = '';
  });

  // ===========================================================================
  // Component creation
  // ===========================================================================

  describe('component creation', () => {
    it('creates modal with default options', () => {
      createConfirmationModal({});

      const backdrop = document.querySelector('.modal-backdrop');
      expect(backdrop).not.toBeNull();

      const modal = document.querySelector('.modal');
      expect(modal).not.toBeNull();
    });

    it('displays modal with custom title', () => {
      createConfirmationModal({
        title: 'Custom Title'
      });

      const title = document.querySelector('.modal__title');
      expect(title).not.toBeNull();
      expect(title.textContent).toBe('Custom Title');
    });

    it('displays modal with custom message', () => {
      createConfirmationModal({
        message: 'Custom message text'
      });

      const message = document.querySelector('.modal__message');
      expect(message).not.toBeNull();
      expect(message.textContent).toBe('Custom message text');
    });

    it('displays modal with custom button texts', () => {
      createConfirmationModal({
        confirmText: 'Yes',
        cancelText: 'No'
      });

      const confirmButton = document.querySelector('[data-action="confirm"]');
      const cancelButton = document.querySelector('[data-action="cancel"]');

      expect(confirmButton).not.toBeNull();
      expect(confirmButton.textContent.trim()).toBe('Yes');
      expect(cancelButton).not.toBeNull();
      expect(cancelButton.textContent.trim()).toBe('No');
    });

    it('displays modal with default texts when not specified', () => {
      createConfirmationModal({});

      const confirmButton = document.querySelector('[data-action="confirm"]');
      const cancelButton = document.querySelector('[data-action="cancel"]');

      expect(confirmButton.textContent.trim()).toBe('Confirmar');
      expect(cancelButton.textContent.trim()).toBe('Cancelar');
    });
  });

  // ===========================================================================
  // Accessibility
  // ===========================================================================

  describe('accessibility', () => {
    it('has correct ARIA attributes', () => {
      createConfirmationModal({
        title: 'Test Modal'
      });

      const backdrop = document.querySelector('.modal-backdrop');
      expect(backdrop.getAttribute('role')).toBe('dialog');
      expect(backdrop.getAttribute('aria-modal')).toBe('true');
      expect(backdrop.getAttribute('aria-labelledby')).toBe('modal-title');
    });

    it('has correct ID on title element', () => {
      createConfirmationModal({
        title: 'Test Modal'
      });

      const title = document.querySelector('.modal__title');
      expect(title.getAttribute('id')).toBe('modal-title');
    });

    it('focuses cancel button on open', async () => {
      createConfirmationModal({});
      await new Promise(resolve => setTimeout(resolve, 50));

      const cancelButton = document.querySelector('[data-action="cancel"]');
      expect(document.activeElement).toBe(cancelButton);
    });
  });

  // ===========================================================================
  // User interactions
  // ===========================================================================

  describe('user interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const onConfirm = vi.fn();

      createConfirmationModal({
        onConfirm
      });

      const confirmButton = document.querySelector('[data-action="confirm"]');
      confirmButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const onCancel = vi.fn();

      createConfirmationModal({
        onCancel
      });

      const cancelButton = document.querySelector('[data-action="cancel"]');
      cancelButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('closes modal when confirm button is clicked', async () => {
      createConfirmationModal({});

      const confirmButton = document.querySelector('[data-action="confirm"]');
      confirmButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      const backdrop = document.querySelector('.modal-backdrop');
      expect(backdrop).toBeNull();
    });

    it('closes modal when cancel button is clicked', async () => {
      createConfirmationModal({});

      const cancelButton = document.querySelector('[data-action="cancel"]');
      cancelButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      const backdrop = document.querySelector('.modal-backdrop');
      expect(backdrop).toBeNull();
    });

    it('calls onCancel and closes modal when Escape key is pressed', async () => {
      const onCancel = vi.fn();

      createConfirmationModal({
        onCancel
      });

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onCancel).toHaveBeenCalledTimes(1);

      const backdrop = document.querySelector('.modal-backdrop');
      expect(backdrop).toBeNull();
    });

    it('calls onCancel and closes modal when backdrop is clicked', async () => {
      const onCancel = vi.fn();

      createConfirmationModal({
        onCancel
      });

      const backdrop = document.querySelector('.modal-backdrop');
      backdrop.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onCancel).toHaveBeenCalledTimes(1);

      const backdropAfter = document.querySelector('.modal-backdrop');
      expect(backdropAfter).toBeNull();
    });

    it('does not close modal when clicking inside modal content', async () => {
      createConfirmationModal({});

      const modal = document.querySelector('.modal');
      modal.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      const backdrop = document.querySelector('.modal-backdrop');
      expect(backdrop).not.toBeNull();

      // Clean up
      backdrop.click();
    });
  });

  // ===========================================================================
  // Body scroll lock
  // ===========================================================================

  describe('body scroll lock', () => {
    it('prevents body scroll when modal is open', () => {
      createConfirmationModal({});

      expect(document.body.style.overflow).toBe('hidden');

      // Clean up
      const backdrop = document.querySelector('.modal-backdrop');
      backdrop.click();
    });

    it('restores body scroll when modal is closed', async () => {
      createConfirmationModal({});

      const cancelButton = document.querySelector('[data-action="cancel"]');
      cancelButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(document.body.style.overflow).toBe('');
    });
  });

  // ===========================================================================
  // API methods
  // ===========================================================================

  describe('API methods', () => {
    it('returns an API object with open and close methods', () => {
      const modal = createConfirmationModal({});

      expect(modal).toHaveProperty('open');
      expect(modal).toHaveProperty('close');
      expect(typeof modal.open).toBe('function');
      expect(typeof modal.close).toBe('function');

      // Clean up
      modal.close();
    });

    it('close method removes modal from DOM', () => {
      const modal = createConfirmationModal({});

      let backdrop = document.querySelector('.modal-backdrop');
      expect(backdrop).not.toBeNull();

      modal.close();

      backdrop = document.querySelector('.modal-backdrop');
      expect(backdrop).toBeNull();
    });

    it('close method restores body scroll', () => {
      const modal = createConfirmationModal({});

      expect(document.body.style.overflow).toBe('hidden');

      modal.close();

      expect(document.body.style.overflow).toBe('');
    });
  });

  // ===========================================================================
  // Multiple modals
  // ===========================================================================

  describe('multiple modals', () => {
    it('can create multiple modals sequentially', () => {
      const modal1 = createConfirmationModal({
        title: 'Modal 1'
      });

      modal1.close();

      const modal2 = createConfirmationModal({
        title: 'Modal 2'
      });

      const title = document.querySelector('.modal__title');
      expect(title.textContent).toBe('Modal 2');

      modal2.close();
    });
  });
});
