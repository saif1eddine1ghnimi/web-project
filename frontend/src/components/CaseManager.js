import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { casesAPI, caseTypesAPI, caseEventsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CaseEventsModal from './CaseEventsModal';
import './CaseManager.css';

const CaseManager = ({ clientId, clientFiles, onCaseUpdate }) => {
  const [cases, setCases] = useState([]);
  const [caseTypes, setCaseTypes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    try {
      const [casesRes, typesRes] = await Promise.all([
        casesAPI.getClientCases(clientId),
        caseTypesAPI.getAll()
      ]);

      setCases(casesRes.data.data);
      setCaseTypes(typesRes.data.data);
    } catch (error) {
      console.error('Error fetching cases data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCourtInMaps = (courtName, lat, lng) => {
    if (lat && lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      window.open(url, '_blank');
    } else if (courtName) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(courtName + ' محكمة')}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="case-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5>قضايا العميل</h5>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          size="sm"
        >
          <i className="fas fa-plus me-2"></i>
          إضافة قضية جديدة
        </Button>
      </div>

      {cases.length > 0 ? (
        cases.map(caseItem => (
          <CaseCard 
            key={caseItem.id} 
            caseItem={caseItem} 
            onOpenEvents={() => setSelectedCase(caseItem)}
            onOpenMaps={openCourtInMaps}
            onUpdate={fetchData}
          />
        ))
      ) : (
        <div className="text-center py-5">
          <i className="fas fa-balance-scale fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">لا توجد قضايا</h5>
          <p className="text-muted">لم يتم إضافة أي قضايا لهذا العميل</p>
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
          >
            إضافة أول قضية
          </Button>
        </div>
      )}

      {/* مودال إضافة قضية جديدة */}
      <CreateCaseModal 
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchData();
          onCaseUpdate?.();
        }}
        clientId={clientId}
        clientFiles={clientFiles}
        caseTypes={caseTypes}
      />

      {/* مودال إدارة مواعيد القضية */}
      <CaseEventsModal 
        case={selectedCase}
        show={!!selectedCase}
        onHide={() => setSelectedCase(null)}
        onUpdate={fetchData}
      />
    </div>
  );
};

// بطاقة القضية
const CaseCard = ({ caseItem, onOpenEvents, onOpenMaps, onUpdate }) => {
  const { isAdmin, isEmployee } = useAuth();

  const getStatusColor = (status) => {
    const colors = {
      open: 'success',
      in_progress: 'warning',
      closed: 'secondary',
      on_hold: 'danger'
    };
    return colors[status] || 'secondary';
  };

  const getStatusText = (status) => {
    const texts = {
      open: 'مفتوحة',
      in_progress: 'قيد العمل',
      closed: 'مغلقة',
      on_hold: 'معلقة'
    };
    return texts[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'secondary',
      medium: 'primary',
      high: 'warning',
      urgent: 'danger'
    };
    return colors[priority] || 'secondary';
  };

  const getPriorityText = (priority) => {
    const texts = {
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
      urgent: 'عاجل'
    };
    return texts[priority] || priority;
  };

  return (
    <Card className="case-card mb-3">
      <Card.Body>
        <Row>
          <Col md={8}>
            <div className="d-flex align-items-start mb-2">
              <h6 className="case-title mb-0">{caseItem.title}</h6>
              {caseItem.case_number && (
                <Badge bg="light" text="dark" className="ms-2">
                  #{caseItem.case_number}
                </Badge>
              )}
            </div>

            {caseItem.description && (
              <p className="case-description text-muted">
                {caseItem.description}
              </p>
            )}

            <div className="case-meta">
              {caseItem.case_type_name && (
                <Badge bg="primary" className="me-2">
                  {caseItem.case_type_name}
                </Badge>
              )}
              
              <Badge bg={getStatusColor(caseItem.status)} className="me-2">
                {getStatusText(caseItem.status)}
              </Badge>

              <Badge bg={getPriorityColor(caseItem.priority)}>
                {getPriorityText(caseItem.priority)}
              </Badge>
            </div>

            {caseItem.court_name && (
              <div className="court-info mt-2">
                <small className="text-muted">
                  <strong>المحكمة:</strong> {caseItem.court_name}
                </small>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="ms-2"
                  onClick={() => onOpenMaps(caseItem.court_name, caseItem.court_lat, caseItem.court_lng)}
                >
                  <i className="fas fa-map-marker-alt"></i> عرض على الخريطة
                </Button>
              </div>
            )}
          </Col>

          <Col md={4}>
            <div className="case-actions">
              <Button 
                variant="outline-info" 
                size="sm" 
                className="w-100 mb-2"
                onClick={onOpenEvents}
              >
                <i className="fas fa-calendar me-1"></i>
                إدارة المواعيد
              </Button>

              {(isAdmin() || isEmployee()) && (
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  className="w-100"
                >
                  <i className="fas fa-edit me-1"></i>
                  تعديل القضية
                </Button>
              )}
            </div>

            <div className="case-dates mt-2">
              <small className="text-muted d-block">
                <strong>تاريخ الإنشاء:</strong> 
                {new Date(caseItem.created_at).toLocaleDateString('ar-EG')}
              </small>
              <small className="text-muted">
                <strong>آخر تحديث:</strong> 
                {new Date(caseItem.updated_at).toLocaleDateString('ar-EG')}
              </small>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

// مودال إنشاء قضية جديدة
const CreateCaseModal = ({ show, onHide, onSuccess, clientId, clientFiles, caseTypes }) => {
  const [formData, setFormData] = useState({
    file_id: '',
    case_type_id: '',
    case_number: '',
    title: '',
    description: '',
    court_name: '',
    court_address: '',
    status: 'open',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await casesAPI.create({
        ...formData,
        client_id: clientId
      });
      onSuccess();
      // Reset form
      setFormData({
        file_id: '',
        case_type_id: '',
        case_number: '',
        title: '',
        description: '',
        court_name: '',
        court_address: '',
        status: 'open',
        priority: 'medium'
      });
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء إنشاء القضية');
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
        <Modal.Title>إضافة قضية جديدة</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>الملف المرتبط *</Form.Label>
                <Form.Select
                  name="file_id"
                  value={formData.file_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">اختر الملف</option>
                  {clientFiles.map(file => (
                    <option key={file.id} value={file.id}>
                      {file.debtor} - ${file.total_amount?.toLocaleString()}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>نوع القضية</Form.Label>
                <Form.Select
                  name="case_type_id"
                  value={formData.case_type_id}
                  onChange={handleChange}
                >
                  <option value="">اختر نوع القضية</option>
                  {caseTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>رقم القضية</Form.Label>
                <Form.Control
                  type="text"
                  name="case_number"
                  value={formData.case_number}
                  onChange={handleChange}
                  placeholder="رقم القضية (اختياري)"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>عنوان القضية *</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="عنوان القضية"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>وصف القضية</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="وصف تفصيلي للقضية"
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>اسم المحكمة</Form.Label>
                <Form.Control
                  type="text"
                  name="court_name"
                  value={formData.court_name}
                  onChange={handleChange}
                  placeholder="اسم المحكمة"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>عنوان المحكمة</Form.Label>
                <Form.Control
                  type="text"
                  name="court_address"
                  value={formData.court_address}
                  onChange={handleChange}
                  placeholder="عنوان المحكمة"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>حالة القضية</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="open">مفتوحة</option>
                  <option value="in_progress">قيد العمل</option>
                  <option value="on_hold">معلقة</option>
                  <option value="closed">مغلقة</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>الأولوية</Form.Label>
                <Form.Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">منخفض</option>
                  <option value="medium">متوسط</option>
                  <option value="high">عالي</option>
                  <option value="urgent">عاجل</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ القضية'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CaseManager;