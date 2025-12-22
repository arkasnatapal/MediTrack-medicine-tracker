import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { MedicineProvider } from './context/MedicineContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <NotificationProvider>
        <AuthProvider>
          <MedicineProvider>
            <App />
          </MedicineProvider>
        </AuthProvider>
      </NotificationProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
