/**
 * Confirmation Modal Component
 * A reusable modal for confirming destructive actions
 */

/**
 * Create and show a confirmation modal
 * @param {Object} options - Modal configuration
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message/description
 * @param {string} options.confirmText - Text for confirm button (default: "Confirmar")
 * @param {string} options.cancelText - Text for cancel button (default: "Cancelar")
 * @param {Function} options.onConfirm - Callback when confirmed
 * @param {Function} options.onCancel - Optional callback when cancelled
 * @returns {Object} Modal API
 */
export function createConfirmationModal(options) {
  const {
    title = 'Confirmar acción',
    message = '¿Está seguro de que desea continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm = () => {},
    onCancel = () => {}
  } = options;

  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-labelledby', 'modal-title');

  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'modal';

  // Create modal content
  modal.innerHTML = `
    <div class="modal__header">
      <h2 class="modal__title" id="modal-title">${title}</h2>
    </div>
    <div class="modal__body">
      <p class="modal__message">${message}</p>
    </div>
    <div class="modal__footer">
      <button class="modal__button modal__button--cancel" data-action="cancel">
        ${cancelText}
      </button>
      <button class="modal__button modal__button--confirm" data-action="confirm">
        ${confirmText}
      </button>
    </div>
  `;

  backdrop.appendChild(modal);

  // Handle button clicks
  const handleClick = (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const action = button.getAttribute('data-action');
    if (action === 'confirm') {
      onConfirm();
    } else if (action === 'cancel') {
      onCancel();
    }
    close();
  };

  // Handle backdrop click (close on click outside modal)
  const handleBackdropClick = (event) => {
    if (event.target === backdrop) {
      onCancel();
      close();
    }
  };

  // Handle escape key
  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      onCancel();
      close();
    }
  };

  // Open modal
  function open() {
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    // Add event listeners
    backdrop.addEventListener('click', handleBackdropClick);
    modal.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEscape);

    // Focus on cancel button by default for accessibility
    const cancelButton = modal.querySelector('[data-action="cancel"]');
    if (cancelButton) {
      cancelButton.focus();
    }
  }

  // Close modal
  function close() {
    // Remove event listeners
    backdrop.removeEventListener('click', handleBackdropClick);
    modal.removeEventListener('click', handleClick);
    document.removeEventListener('keydown', handleEscape);

    // Remove from DOM
    if (backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
    document.body.style.overflow = '';
  }

  // Auto-open on creation
  open();

  // Public API
  return {
    open,
    close
  };
}
