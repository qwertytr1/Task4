import React, { useCallback, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthProvider/AuthProvider';

function SignInModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [values, setValues] = useState({
    email: location.state?.email || '',
    password: location.state?.password || '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginUser = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      setErrorMessage(null);

      axios
        .post(
          'https://task4-server-me06ks0dh-qwertytr1s-projects.vercel.app/login',
          values,
        )
        .then((res) => {
          const { Status, token, User } = res.data;
          if (Status === 'Success' && token) {
            // Сохраняем token и данные пользователя в localStorage
            localStorage.setItem('authToken', token);
            localStorage.setItem('userData', JSON.stringify(User)); // сохраняем объект пользователя

            login(token); // Логируем пользователя
            navigate('/home'); // Переходим на страницу Home
          } else {
            setErrorMessage('Invalid email or password');
          }
        })
        .catch((err) => {
          console.error('Login error:', err);
          setErrorMessage('An error occurred. Please try again.');
        });
    },
    [values, navigate, login, setErrorMessage],
  );

  const handleCreateAccountClick = useCallback(() => {
    navigate('/register');
  }, [navigate]);

  return (
    <div className="SignInPage">
      <div className="SignINBlock">
        <div className="TopPart">
          <h1>HOMECOMFORT</h1>
        </div>
        <div className="Middle">
          <h2 className="SignUpText">Sign In</h2>

          {/* Сообщение об ошибке */}
          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          )}

          <Form.Control
            size="lg"
            type="text"
            placeholder="Email"
            className="inputEmailPass"
            value={values.email}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          <Form.Control
            size="lg"
            type="password"
            placeholder="Password"
            className="inputEmailPass"
            value={values.password}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, password: e.target.value }))
            }
          />
          <Button
            variant="secondary"
            size="lg"
            className="SignInButton"
            onClick={loginUser}
          >
            SIGN IN
          </Button>
        </div>
      </div>
      <motion.div
        className="PicturePart"
        initial={{ backgroundPositionX: '100%' }}
        animate={{ backgroundPositionX: '0%' }}
        exit={{ backgroundPositionX: '-100%' }}
        transition={{ duration: 1 }}
      >
        <div className="TextOverlay">
          <p>Welcome to HomeComfort! Your journey to comfort starts here.</p>
          <Button variant="light" size="lg" onClick={handleCreateAccountClick}>
            CREATE ACCOUNT
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default SignInModal;
