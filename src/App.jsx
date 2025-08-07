import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import InventoryPage from './pages/InventoryPage';
import AuthPage from './pages/AuthPage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/*" element={<InventoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
