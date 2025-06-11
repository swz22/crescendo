// src/utils/queueEvents.js
export const dispatchQueueEvent = (message) => {
  window.dispatchEvent(
    new CustomEvent("queueUpdate", {
      detail: { message },
    })
  );
};
