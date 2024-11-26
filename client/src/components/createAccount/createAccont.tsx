import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import '../SignInModal/SignInModal.css';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateAccountPage() {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  function register(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    axios
      .post('https://task4-server-qwertytr1s-projects.vercel.app/register', {
        username,
        email,
        password,
      })
      .then((response) => {
        navigate('/login', { state: { email, password } });
      })
      .catch((err) => {
        if (err.response && err.response.status === 409) {
          setErrorMessage('This email is already in use. Please try another.');
        } else {
          setErrorMessage(
            'An error occurred during registration. Please try again.',
          );
        }
        console.error(err);
      });
  }

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="SignInPage">
      <motion.div
        className="PicturePart"
        initial={{ backgroundPositionX: '100%' }}
        animate={{ backgroundPositionX: '0%' }}
        exit={{ backgroundPositionX: '-100%' }}
        transition={{ duration: 1 }}
      >
        <div className="TextOverlay">
          <p>
            Welcome to HomeComfort! Join us today and start your journey to
            comfort.
          </p>
          <Button variant="light" size="lg" onClick={handleBackToLogin}>
            BACK TO LOGIN
          </Button>
        </div>
      </motion.div>

      <div className="SignINBlock">
        <div className="TopPart">
          <h1>HOMECOMFORT</h1>
        </div>
        <form className="Middle" onSubmit={register}>
          <h2 className="SignUpText">Create Account</h2>
          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          )}
          <Form.Control
            size="lg"
            type="text"
            placeholder="Name"
            className="inputEmailPass"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setUsername(e.target.value);
            }}
            value={username}
          />
          <Form.Control
            size="lg"
            type="email"
            placeholder="Email"
            className="inputEmailPass"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            value={email}
          />
          <Form.Control
            size="lg"
            type="password"
            placeholder="Password"
            className="inputEmailPass"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            value={password}
          />
          <Button
            variant="secondary"
            size="lg"
            className="SignInButton"
            type="submit"
          >
            CREATE ACCOUNT
          </Button>
        </form>
      </div>
    </div>
  );
}

export default CreateAccountPage;
