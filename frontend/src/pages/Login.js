import React from 'react';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import './Login.css';

const Login = () => {
  return (
    <div className="login-page">
      {/* Header minimal avec lien vers l'accueil */}
      <Navbar bg="transparent" expand="lg" className="login-navbar">
        <Container>
          <Navbar.Brand as={Link} to="/" className="login-brand">
            <strong>مكتب استخلاص الديون</strong>
          </Navbar.Brand>
          
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" className="login-home-link">
              <i className="fas fa-home me-2"></i>
              العودة للرئيسية
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      
      <Container fluid className="login-background">
        <LoginForm />
      </Container>
    </div>
  );
};

export default Login;