import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';

const LoginForm = () => {
  const [credentials, setCredentials] = useState({
    login: '',
    password: '',
    userType: 'employee'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.login.trim() || !credentials.password.trim()) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const logMsg = `🔐 محاولة تسجيل الدخول... ${new Date().toISOString()}`;
      console.log(logMsg);
      sessionStorage.setItem('lastLoginAttempt', logMsg);
      
      const result = await login(credentials, credentials.userType === 'client');
      
      const resultMsg = `📊 نتيجة تسجيل الدخول: ${JSON.stringify(result)}`;
      console.log(resultMsg);
      sessionStorage.setItem('lastLoginResult', resultMsg);
      
      if (result.success) {
        const successMsg = `✅ تسجيل الدخول ناجح - Token: ${localStorage.getItem('token')?.substring(0, 20)}...`;
        console.log(successMsg);
        sessionStorage.setItem('lastLoginSuccess', successMsg);
        
        // إضافة تأخير أطول للتأكد من حفظ البيانات
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const navMsg = `🔄 جاري الانتقال إلى لوحة التحكم...`;
        console.log(navMsg);
        sessionStorage.setItem('lastNavigation', navMsg);
        navigate('/dashboard', { replace: true });
      } else {
        const errMsg = result.message || 'اسم المستخدم أو كلمة المرور غير صحيحة';
        setError(errMsg);
        console.error('❌ Login failed:', errMsg);
        sessionStorage.setItem('lastLoginError', errMsg);
      }
    } catch (err) {
      const errorMsg = 'حدث خطأ في النظام. يرجى المحاولة مرة أخرى لاحقاً.';
      setError(errorMsg);
      console.error('❌ Login error:', err);
      sessionStorage.setItem('lastCatchError', err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="login-container">
      <Row className="justify-content-center">
        <Col xl={6} lg={7} md={8} sm={10}>
          <Card className="login-card">
            <Card.Body>
              {/* Header */}
              <div className="text-center mb-4">
                <div className="login-logo">
                  م
                </div>
                <h3 className="login-title">تسجيل الدخول</h3>
                <p className="login-subtitle">اختر نوع المستخدم وأدخل بيانات الدخول</p>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="danger" className="text-center">
                  <span className="me-2">⚠️</span>
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <Form onSubmit={handleSubmit} noValidate>
                {/* User Type */}
                <Form.Group className="mb-4">
                  <Form.Label>نوع المستخدم</Form.Label>
                  <Form.Select 
                    name="userType"
                    value={credentials.userType}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="employee">موظف / مدير</option>
                    <option value="client">عميل</option>
                  </Form.Select>
                </Form.Group>

                {/* Username */}
                <Form.Group className="mb-4">
                  <Form.Label>اسم المستخدم</Form.Label>
                  <Form.Control
                    type="text"
                    name="login"
                    value={credentials.login}
                    onChange={handleChange}
                    placeholder="أدخل اسم المستخدم الخاص بك"
                    required
                    disabled={loading}
                    autoComplete="username"
                    autoFocus
                  />
                </Form.Group>

                {/* Password */}
                <Form.Group className="mb-4">
                  <Form.Label>كلمة المرور</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    placeholder="أدخل كلمة المرور الخاصة بك"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </Form.Group>

                {/* Submit Button */}
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 login-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span 
                        className="spinner-border spinner-border-sm me-2" 
                        role="status" 
                        aria-hidden="true"
                      ></span>
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>
              </Form>

              {/* Footer Note */}
              <div className="text-center mt-4 pt-4 border-top">
                <small className="text-muted">
                  للعملاء: سيتم إعطاؤك بيانات الدخول من إدارة المكتب
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginForm;