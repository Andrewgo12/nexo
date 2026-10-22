let widgetScriptPromise;

export default function loadWompiWidget() {
  if (window.WidgetCheckout) return Promise.resolve();
  if (!widgetScriptPromise) {
    widgetScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        widgetScriptPromise = null;
        reject(new Error('No fue posible cargar el checkout sandbox de Wompi.'));
      };
      document.head.appendChild(script);
    });
  }
  return widgetScriptPromise;
}
