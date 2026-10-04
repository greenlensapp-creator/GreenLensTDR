import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registro global de errores para asegurar que la app nunca se quede en blanco de forma silenciosa
window.addEventListener('error', (event) => {
  console.error('[GreenLens Global Window Error]:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.warn('[GreenLens Unhandled Promise Rejection]:', event.reason);
});

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (err) {
    console.error('[GreenLens Root Mount Error]:', err);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafb; font-family: sans-serif; padding: 20px;">
        <div style="max-width: 400px; width: 100%; background: #ffffff; padding: 24px; border-radius: 20px; text-align: center; border: 1px solid #e1e3e4; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          <h2 style="color: #191c1d; font-size: 18px; margin-bottom: 8px;">GreenLens no ha podido iniciarse</h2>
          <p style="color: #526360; font-size: 13px; margin-bottom: 16px;">Se ha producido un error al cargar la aplicación. Inténtalo de nuevo.</p>
          <button onclick="window.location.reload()" style="background: #006b5e; color: #ffffff; border: none; padding: 10px 20px; border-radius: 12px; font-weight: bold; cursor: pointer; width: 100%;">Reintentar</button>
        </div>
      </div>
    `;
  }
}
