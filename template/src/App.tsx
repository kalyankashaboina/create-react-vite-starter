// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import MainLayout from '@layouts/MainLayout';
import Home from '@pages/Home';
import Login from '@pages/Login';
// import ProtectedRoute from '@components/ProtectedRoute';


const App = () => (
  <Routes>
    {/* Protected Routes within Main Layout */}
    <Route element={<MainLayout />}>
      <Route
        path="/"
        element={
          // <ProtectedRoute>
            <Home />
          // </ProtectedRoute>
        }
      />
    </Route>

    {/* Public Routes */}
    <Route path="/login" element={<Login />} />

    {/* Optional: Catch-all for 404 */}
    {/* <Route path="*" element={<NotFound />} /> */}
  </Routes>
);

export default App;
