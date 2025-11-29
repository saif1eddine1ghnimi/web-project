import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Navbar bg="white" expand="lg" className="custom-navbar shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="brand-logo">
          <strong>مكتب استخلاص الديون</strong>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">الرئيسية</Nav.Link>
            
            {isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/dashboard">لوحة التحكم</Nav.Link>
                <Nav.Link as={Link} to="/files">الملفات</Nav.Link>
                
                {user?.role === 'admin' && (
                  <>
                    <Nav.Link as={Link} to="/clients">العملاء</Nav.Link>
                    <Nav.Link as={Link} to="/users">المستخدمين</Nav.Link>
                  </>
                )}
                
                {user?.role === 'employee' && (
                  <Nav.Link as={Link} to="/tasks">مهامي</Nav.Link>
                )}
                
                {!user?.role && (
                  <Nav.Link as={Link} to="/my-files">ملفاتي</Nav.Link>
                )}
              </>
            ) : (
              <Nav.Link as={Link} to="/about">عن المكتب</Nav.Link>
            )}
          </Nav>
          
          <Nav>
            {isAuthenticated ? (
              <div className="d-flex align-items-center">
                <span className="user-welcome me-3">
                  مرحباً، {user?.name}
                </span>
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={handleLogout}
                >
                  تسجيل الخروج
                </Button>
              </div>
            ) : (
              <Button 
                as={Link} 
                to="/login" 
                variant="outline-primary"
                className="login-btn"
              >
                تسجيل الدخول
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;