export const dispatchQueueEvent = (message) => {
  window.dispatchEvent(
    new CustomEvent("queueUpdate", {
      detail: { message },
    })
  );
};
