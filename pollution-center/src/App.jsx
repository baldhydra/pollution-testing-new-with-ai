import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import NewEntry from './components/NewEntry';
import Reports from './components/Reports';
import Overview from './components/Overview';
import { SidebarProvider } from './context/SidebarContext';

const App = () => {
  return (
    <SidebarProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/entry" element={<NewEntry />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/overview" element={<Overview />} />
      </Routes>
    </SidebarProvider>
  );
};

export default App;
