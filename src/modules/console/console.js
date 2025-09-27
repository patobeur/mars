let consoleContainer;

/**
 * Initializes the console module.
 * @param {HTMLElement} container The element to use as the console container.
 */
function init(container) {
  if (!container) {
    console.error('Console container not found.');
    return;
  }
  consoleContainer = container;
}

/**
 * Adds a message to the console.
 * @param {string} message The message to display.
 */
function addMessage(message) {
  if (!consoleContainer) {
    console.error("Console not initialized. Call Console.init(container) first.");
    return;
  }

  const messageElement = document.createElement('div');
  messageElement.classList.add('console-message');
  messageElement.textContent = message;

  consoleContainer.appendChild(messageElement);

  // Remove the message element after the animation completes (5 seconds)
  setTimeout(() => {
    // Check if the element is still in the DOM before removing
    if (messageElement.parentNode === consoleContainer) {
        consoleContainer.removeChild(messageElement);
    }
  }, 5000);
}

const Console = {
  init,
  addMessage,
};

export default Console;