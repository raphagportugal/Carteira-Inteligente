export function showSuccess(message: string) {
  window.dispatchEvent(
    new CustomEvent("financial-success", { detail: message }),
  );
}
