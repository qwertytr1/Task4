import React from 'react';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import SignInModal from './components/SignInModal/SignInModal';
import CreateAccountPage from './components/createAccount/createAccont';
import Home from './components/home/Home';
import ProtectedRoute from './components/AuthProvider/ProtectRoute';
import { AuthProvider } from './components/AuthProvider/AuthProvider';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignInModal />} />
          <Route path="/register" element={<CreateAccountPage />} />
          <Route path="/login" element={<SignInModal />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />{' '}
          .
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
