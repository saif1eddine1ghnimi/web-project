import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      <Header />
      
      {/* Hero Section مع الفيديو المحلي */}
      <header className="custom-header">
        <div className="video-wrapper">
          <video 
            aria-hidden="true" 
            playsInline 
            autoPlay 
            muted 
            loop 
            poster="/assets/video-poster.jpg"
            id="hero-video"
          >
            {/* استخدام الفيديو المحلي */}
            <source src="/assets/hero-background.mp4" type="video/mp4" />
            {/* بديل إذا لم يعمل الفيديو المحلي */}
            <source src="https://starlink.ua/media/mod_starlink/car-blur.mp4" type="video/mp4" />
          </video>
        </div>
        
        {/* المحتوى فوق الفيديو */}
        <Container>
          <Row className="align-items-center header-content">
            <Col lg={6}>
              <div className="hero-content">
                <h1 className="hero-title">
                  حلول احترافية 
                  <span className="text-warning"> لاستخلاص الديون</span>
                </h1>
                <p className="hero-description">
                  نقدم خدمات متكاملة لاسترداد المستحقات المالية باحترافية عالية 
                  وكفاءة مميزة. نظام إدارة متكامل يضمن متابعة دقيقة لكل الملفات.
                </p>
                <div className="hero-buttons">
                  {!isAuthenticated ? (
                    <>
                      <Button as={Link} to="/login" variant="warning" size="lg" className="me-3">
                        <i className="fas fa-sign-in-alt me-2"></i>
                        تسجيل الدخول
                      </Button>
                      <Button as={Link} to="/about" variant="outline-light" size="lg">
                        <i className="fas fa-info-circle me-2"></i>
                        عن المكتب
                      </Button>
                    </>
                  ) : (
                    <Button as={Link} to="/dashboard" variant="warning" size="lg">
                      <i className="fas fa-tachometer-alt me-2"></i>
                      لوحة التحكم
                    </Button>
                  )}
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="hero-features">
                <div className="feature-item">
                  <i className="fas fa-file-invoice-dollar text-warning"></i>
                  <span>إدارة الملفات</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-chart-line text-warning"></i>
                  <span>تقارير وإحصائيات</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-tasks text-warning"></i>
                  <span>متابعة المهام</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-balance-scale text-warning"></i>
                  <span>خدمات قانونية</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </header>

      {/* بقية الأقسام تبقى كما هي */}
      <section className="features-section py-5 bg-white">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">خدماتنا المتكاملة</h2>
              <p className="section-subtitle">نقدم مجموعة متكاملة من الخدمات لإدارة عملية استخلاص الديون</p>
            </Col>
          </Row>
          <Row>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon">
                    <i className="fas fa-balance-scale"></i>
                  </div>
                  <Card.Title>الخدمات القانونية</Card.Title>
                  <Card.Text>
                    متابعة قانونية متكاملة لجميع مراحل استخلاص الديون 
                    مع فريق محاماة متخصص
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon">
                    <i className="fas fa-chart-pie"></i>
                  </div>
                  <Card.Title>التقارير والإحصائيات</Card.Title>
                  <Card.Text>
                    تقارير تفصيلية وإحصائيات حية لمتابعة أداء المكتب 
                    وتطور الملفات
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon">
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  <Card.Title>نظام آمن</Card.Title>
                  <Card.Text>
                    نظام آمن ومشفر يحافظ على سرية بيانات العملاء 
                    وملفاتهم بشكل كامل
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                  <Card.Title>متابعة مستمرة</Card.Title>
                  <Card.Text>
                    متابعة دائمة لكل ملف مع تحديثات فورية 
                    وتقارير دورية عن التقدم
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <Card.Title>فريق متخصص</Card.Title>
                  <Card.Text>
                    فريق عمل محترف ومدرب على أعلى مستوى 
                    لضمان أفضل النتائج
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon">
                    <i className="fas fa-rocket"></i>
                  </div>
                  <Card.Title>نتائج سريعة</Card.Title>
                  <Card.Text>
                    نضمن لكم تحقيق نتائج إيجابية في أقصر وقت 
                    ممكن وبكفاءة عالية
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* قسم الإحصائيات */}
      <section className="stats-section py-5 bg-light">
        <Container>
          <Row className="text-center">
            <Col md={3} className="mb-4">
              <div className="stat-item">
                <h3 className="stat-number text-primary">+500</h3>
                <p className="stat-label">ملف مستخلص</p>
              </div>
            </Col>
            <Col md={3} className="mb-4">
              <div className="stat-item">
                <h3 className="stat-number text-success">+300</h3>
                <p className="stat-label">عميل راضي</p>
              </div>
            </Col>
            <Col md={3} className="mb-4">
              <div className="stat-item">
                <h3 className="stat-number text-warning">+95%</h3>
                <p className="stat-label">نسبة النجاح</p>
              </div>
            </Col>
            <Col md={3} className="mb-4">
              <div className="stat-item">
                <h3 className="stat-number text-info">+5</h3>
                <p className="stat-label">سنوات خبرة</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <footer className="footer bg-dark text-white py-4">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h5 className="mb-2">مكتب استخلاص الديون</h5>
              <p className="mb-0 text-muted">حلول احترافية لاسترداد المستحقات المالية</p>
            </Col>
            <Col md={6} className="text-md-end">
              <p className="mb-0 text-muted">© 2024 جميع الحقوق محفوظة</p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default Home;