import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { clientsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';
import ProtectedRoute from '../components/common/ProtectedRoute';
import './Clients.css';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isAdmin, isEmployee } = useAuth();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Header />
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">جاري التحميل...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={['admin', 'employee']}>
      <div className="clients-page">
        <Header />
        
        <Container fluid className="page-header bg-light py-4">
          <Container>
            <Row className="align-items-center">
              <Col>
                <h1 className="h2 mb-0">إدارة العملاء</h1>
                <p className="text-muted mb-0">عرض وإدارة جميع عملاء المكتب</p>
              </Col>
              <Col xs="auto">
                <Button 
                  variant="primary" 
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="fas fa-user-plus me-2"></i>
                  إضافة عميل جديد
                </Button>
              </Col>
            </Row>
          </Container>
        </Container>

        <Container className="py-4">
          {/* إحصائيات سريعة */}
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <h6 className="card-title">إجمالي العملاء</h6>
                  <h3 className="text-primary mb-0">{clients.length}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <h6 className="card-title">العملاء النشطين</h6>
                  <h3 className="text-success mb-0">
                    {clients.filter(c => c.active !== false).length}
                  </h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <h6 className="card-title">عملاء جدد</h6>
                  <h3 className="text-info mb-0">
                    {clients.filter(c => {
                      const created = new Date(c.created_at);
                      const today = new Date();
                      return (today - created) < 30 * 24 * 60 * 60 * 1000; // 30 يوم
                    }).length}
                  </h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <h6 className="card-title">ملفات نشطة</h6>
                  <h3 className="text-warning mb-0">
                    {/* سيتم حسابه لاحقاً */}
                    -
                  </h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* جدول العملاء */}
          <Card>
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">قائمة العملاء</h5>
                </Col>
                <Col xs="auto">
                  <small className="text-muted">
                    إجمالي العملاء: <strong>{clients.length}</strong>
                  </small>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              {clients.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>اسم العميل</th>
                        <th>البريد الإلكتروني</th>
                        <th>الهاتف</th>
                        <th>رقم الهوية</th>
                        <th>تاريخ التسجيل</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => (
                        <ClientRow key={client.id} client={client} onUpdate={fetchClients} />
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-users fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">لا توجد عملاء</h5>
                  <p className="text-muted">لم يتم إضافة أي عملاء حتى الآن</p>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowCreateModal(true)}
                  >
                    إضافة أول عميل
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* مودال إضافة عميل جديد */}
        <CreateClientModal 
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchClients();
          }}
        />
      </div>
    </ProtectedRoute>
  );
};

// مكون صف العميل
const ClientRow = ({ client, onUpdate }) => {
  const { isAdmin } = useAuth();

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        // await clientsAPI.delete(client.id);
        onUpdate();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  return (
    <tr>
      <td>
        <div>
          <div className="fw-semibold">{client.name}</div>
          {client.login && (
            <small className="text-muted">اسم المستخدم: {client.login}</small>
          )}
        </div>
      </td>
      <td>{client.email || '-'}</td>
      <td>{client.phone || '-'}</td>
      <td>{client.cin || '-'}</td>
      <td>
        {new Date(client.created_at).toLocaleDateString('ar-EG')}
      </td>
      <td>
        <Badge bg={client.active !== false ? 'success' : 'secondary'}>
          {client.active !== false ? 'نشط' : 'غير نشط'}
        </Badge>
      </td>
      <td>
        <div className="action-buttons">
          <Button
            as={Link}
            to={`/clients/${client.id}`}
            variant="outline-primary"
            size="sm"
            className="me-1"
          >
            <i className="fas fa-eye"></i>
          </Button>
          
          <Button
            as={Link}
            to={`/clients/${client.id}/files`}
            variant="outline-info"
            size="sm"
            className="me-1"
          >
            <i className="fas fa-folder"></i>
          </Button>
          
          {isAdmin() && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleDelete}
            >
              <i className="fas fa-trash"></i>
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};

// مودال إنشاء عميل جديد
const CreateClientModal = ({ show, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    cin: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await clientsAPI.create(formData);
      alert(`تم إنشاء العميل بنجاح!\nبيانات الدخول:\nاسم المستخدم: ${response.data.data.login}\nكلمة المرور: ${response.data.data.password}`);
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء إنشاء العميل');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>إضافة عميل جديد</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>اسم العميل *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="أدخل اسم العميل الكامل"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>البريد الإلكتروني</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>رقم الهاتف</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="05XXXXXXXX"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>رقم الهوية</Form.Label>
                <Form.Control
                  type="text"
                  name="cin"
                  value={formData.cin}
                  onChange={handleChange}
                  placeholder="رقم البطاقة الوطنية"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>العنوان</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="عنوان العميل"
            />
          </Form.Group>

          <Alert variant="info" className="mb-0">
            <i className="fas fa-info-circle me-2"></i>
            سيتم إنشاء بيانات الدخول تلقائياً وإظهارها بعد حفظ العميل
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ العميل'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default Clients;