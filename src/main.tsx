import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

/*
// Add global error handler to suppress browser extension errors
window.addEventListener('error', (event) => {
  // Suppress extension-related errors that don't affect our app
  if (event.message && (
    event.message.includes('message channel closed') ||
    event.message.includes('listener indicated an asynchronous response') ||
    event.message.includes('Extension context invalidated')
  )) {
    event.preventDefault();
    return false;
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && (
    event.reason.message.includes('message channel closed') ||
    event.reason.message.includes('listener indicated an asynchronous response') ||
    event.reason.message.includes('Extension context invalidated')
  )) {
    event.preventDefault();
    return false;
  }
});
*/

// Remove dark mode class addition
createRoot(document.getElementById("root")!).render(<App />);
