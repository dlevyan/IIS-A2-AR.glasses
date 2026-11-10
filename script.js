// Stage 1: visual feedback only. Native buttons support mouse, touch,
// Enter and Space. No conversation, menu or microphone logic runs.
const pressTimers = new WeakMap();

document.querySelectorAll("[data-control]").forEach((button) => {
  button.addEventListener("click", () => {
    // Retain the press briefly so keyboard and touch get visible feedback too.
    window.clearTimeout(pressTimers.get(button));
    button.classList.add("is-pressed");
    pressTimers.set(button, window.setTimeout(() => {
      button.classList.remove("is-pressed");
    }, 180));
  });
});
