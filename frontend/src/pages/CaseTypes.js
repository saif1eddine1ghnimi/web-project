import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert } from 'react-bootstrap';
import { caseTypesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';
import ProtectedRoute from '../components/common/ProtectedRoute';
import './CaseTypes.css';

const CaseTypes = () => {
  const [caseTypes, setCaseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchCaseTypes();
  }, []);

  const fetchCaseTypes = async () => {
    try {
      const response = await caseTypesAPI.getAll();
      setCaseTypes(response.data.data);
    } catch (error) {
      console.error('Error fetching case types:', error);
      setError('حدث خطأ في جلب أنواع القضايا');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`هل أنت متأكد من حذف نوع القضية "${name}"؟`)) {
      try {
        await caseTypesAPI.delete(id);
        fetchCaseTypes(); // إعادة تحميل البيانات
      } catch (error) {
        console.error('Error deleting case type:', error);
        if (error.response?.data?.message) {
          alert(error.response.data.message);
        } else {
          alert('حدث خطأ أثناء حذف نوع القضية');
        }
      }
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole={['admin', 'employee']}>
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
      <div className="case-types-page">
        <Header />
        
        <Container fluid className="page-header bg-light py-4">
          <Container>
            <Row className="align-items-center">
              <Col>
                <h1 className="h2 mb-0">إدارة أنواع القضايا</h1>
                <p className="text-muted mb-0">إضافة وتعديل أنواع القضايا المختلفة</p>
              </Col>
              <Col xs="auto">
                <Button 
                  variant="primary" 
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  إضافة نوع جديد
                </Button>
              </Col>
            </Row>
          </Container>
        </Container>

        <Container className="py-4">
          {error && <Alert variant="danger">{error}</Alert>}

          <Card>
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">قائمة أنواع القضايا</h5>
                </Col>
                <Col xs="auto">
                  <small className="text-muted">
                    إجمالي الأنواع: <strong>{caseTypes.length}</strong>
                  </small>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              {caseTypes.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>اسم النوع</th>
                        <th>الوصف</th>
                        <th>تم الإنشاء بواسطة</th>
                        <th>تاريخ الإنشاء</th>
                        {isAdmin() && <th>الإجراءات</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {caseTypes.map((type) => (
                        <tr key={type.id}>
                          <td>
                            <strong>{type.name}</strong>
                          </td>
                          <td>
                            {type.description || (
                              <span className="text-muted">لا يوجد وصف</span>
                            )}
                          </td>
                          <td>{type.created_by_name || 'غير معروف'}</td>
                          <td>
                            {new Date(type.created_at).toLocaleDateString('ar-EG')}
                          </td>
                          {isAdmin() && (
                            <td>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(type.id, type.name)}
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-gavel fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">لا توجد أنواع قضايا</h5>
                  <p className="text-muted">لم يتم إضافة أي أنواع قضايا حتى الآن</p>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowCreateModal(true)}
                  >
                    إضافة أول نوع
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* مودال إضافة نوع جديد */}
        <CreateCaseTypeModal 
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCaseTypes();
          }}
        />
      </div>
    </ProtectedRoute>
  );
};

// مودال إنشاء نوع قضية جديد
const CreateCaseTypeModal = ({ show, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await caseTypesAPI.create(formData);
      onSuccess();
      // Reset form
      setFormData({ name: '', description: '' });
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء إنشاء نوع القضية');
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
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>إضافة نوع قضية جديد</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form.Group className="mb-3">
            <Form.Label>اسم النوع *</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="أدخل اسم نوع القضية"
              required
            />
            <Form.Text className="text-muted">
              مثال: قضية تجارية، قضية مدنية، قضية جنائية
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>الوصف</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="وصف مختصر لنوع القضية"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ النوع'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CaseTypes;