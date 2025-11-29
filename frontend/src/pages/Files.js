import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, Modal, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { filesAPI, clientsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';
import ProtectedRoute from '../components/common/ProtectedRoute';
import './Files.css';

const Files = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const { isAdmin, isEmployee } = useAuth();

  useEffect(() => {
    fetchFiles();
  }, [filterStatus]);

  const fetchFiles = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await filesAPI.getAll(params);
      setFiles(response.data.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status) => {
    setFilterStatus(status);
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
    <ProtectedRoute>
      <div className="files-page">
        <Header />
        
        <Container fluid className="page-header bg-light py-4">
          <Container>
            <Row className="align-items-center">
              <Col>
                <h1 className="h2 mb-0">إدارة الملفات</h1>
                <p className="text-muted mb-0">عرض وإدارة جميع ملفات الاستخلاص</p>
              </Col>
              <Col xs="auto">
                {(isAdmin() || isEmployee()) && (
                  <Button 
                    variant="primary" 
                    onClick={() => setShowCreateModal(true)}
                  >
                    <i className="fas fa-plus me-2"></i>
                    إضافة ملف جديد
                  </Button>
                )}
              </Col>
            </Row>
          </Container>
        </Container>

        <Container className="py-4">
          {/* فلاتر */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={6}>
                  <h6 className="mb-0">تصفية حسب الحالة:</h6>
                </Col>
                <Col md={6}>
                  <div className="filter-buttons">
                    <Button
                      variant={filterStatus === '' ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => handleStatusFilter('')}
                      className="me-2"
                    >
                      الكل
                    </Button>
                    <Button
                      variant={filterStatus === 'new' ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => handleStatusFilter('new')}
                      className="me-2"
                    >
                      جديد
                    </Button>
                    <Button
                      variant={filterStatus === 'in_progress' ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => handleStatusFilter('in_progress')}
                      className="me-2"
                    >
                      قيد العمل
                    </Button>
                    <Button
                      variant={filterStatus === 'paid' ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => handleStatusFilter('paid')}
                    >
                      مدفوع
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* جدول الملفات */}
          <Card>
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">قائمة الملفات</h5>
                </Col>
                <Col xs="auto">
                  <small className="text-muted">
                    إجمالي الملفات: <strong>{files.length}</strong>
                  </small>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              {files.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>رقم الملف</th>
                        <th>المدين</th>
                        <th>العميل</th>
                        <th>المبلغ الإجمالي</th>
                        <th>تاريخ الإيداع</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <FileRow key={file.id} file={file} onUpdate={fetchFiles} />
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">لا توجد ملفات</h5>
                  <p className="text-muted">لم يتم إضافة أي ملفات حتى الآن</p>
                  {(isAdmin() || isEmployee()) && (
                    <Button 
                      variant="primary" 
                      onClick={() => setShowCreateModal(true)}
                    >
                      إضافة أول ملف
                    </Button>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* مودال إضافة ملف جديد */}
        <CreateFileModal 
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchFiles();
          }}
        />
      </div>
    </ProtectedRoute>
  );
};

// مكون صف الملف
const FileRow = ({ file, onUpdate }) => {
  const { isAdmin, isEmployee } = useAuth();

  const getRowClassName = (file) => {
    if (file.status === 'paid') {
      return 'table-row-paid';
    } else if (file.status === 'partially_paid') {
      return 'table-row-partial';
    } else if (file.status === 'closed') {
      return 'table-row-closed';
    }
    return '';
  };

  const getStatusVariant = (status) => {
    const variants = {
      new: 'primary',
      in_progress: 'warning',
      paid: 'success',
      partially_paid: 'info',
      closed: 'secondary'
    };
    return variants[status] || 'secondary';
  };

  const getStatusText = (status) => {
    const texts = {
      new: 'جديد',
      in_progress: 'قيد العمل',
      paid: 'مدفوع',
      partially_paid: 'مدفوع جزئياً',
      closed: 'مغلق'
    };
    return texts[status] || status;
  };

  return (
    <tr className={getRowClassName(file)}>
      <td>
        <strong>#{file.id}</strong>
      </td>
      <td>
        <div>
          <div className="fw-semibold">{file.debtor}</div>
          {file.debt_proof && (
            <small className="text-muted">{file.debt_proof}</small>
          )}
        </div>
      </td>
      <td>
        {file.client_name || 'غير محدد'}
      </td>
      <td>
        <span className="fw-bold text-success">
          ${file.total_amount?.toLocaleString()}
        </span>
        {file.status === 'partially_paid' && file.recovery_percentage > 0 && (
          <div className="recovery-percentage mt-1">
            <small className="text-warning fw-bold">
              {file.recovery_percentage.toFixed(1)}% مستخلص
            </small>
          </div>
        )}
      </td>
      <td>
        {new Date(file.deposit_date).toLocaleDateString('ar-EG')}
      </td>
      <td>
        <Badge bg={getStatusVariant(file.status)}>
          {getStatusText(file.status)}
        </Badge>
      </td>
      <td>
        <div className="action-buttons">
          <Button
            as={Link}
            to={`/files/${file.id}`}
            variant="outline-primary"
            size="sm"
            className="me-1"
          >
            <i className="fas fa-eye"></i>
          </Button>
          
          {(isAdmin() || isEmployee()) && (
            <>
              <Button
                as={Link}
                to={`/files/${file.id}/edit`}
                variant="outline-secondary"
                size="sm"
                className="me-1"
              >
                <i className="fas fa-edit"></i>
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

// ✅ مودال إنشاء ملف جديد - VERSION MODIFIÉE AVEC AUTOCOMPLÉTION
const CreateFileModal = ({ show, onHide, onSuccess }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    deposit_date: new Date().toISOString().split('T')[0],
    client_name: '', // ✅ CHANGÉ: client_id → client_name
    debtor: '',
    debt_proof: '',
    total_amount: '',
    commission: '',
    notes: ''
  });

  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]); // ✅ NOUVEAU
  const [showSuggestions, setShowSuggestions] = useState(false); // ✅ NOUVEAU
  const [selectedClient, setSelectedClient] = useState(null); // ✅ NOUVEAU
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      fetchClients();
    }
  }, [show]);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      // backend returns { success: true, data: [...] }
      const data = response.data?.data || response.data;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // ✅ NOUVELLE FONCTION: Gérer le changement du nom du client
  const handleClientNameChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, client_name: value });
    setSelectedClient(null);

    if (value.trim() === '') {
      setFilteredClients([]);
      setShowSuggestions(false);
    } else {
      // Filtrer les clients existants
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredClients(filtered);
      setShowSuggestions(true);
    }
  };

  // ✅ NOUVELLE FONCTION: Sélectionner un client depuis les suggestions
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setFormData({ ...formData, client_name: client.name });
    setFilteredClients([]);
    setShowSuggestions(false);
  };

  // ✅ NOUVELLE FONCTION: Créer un nouveau client ou utiliser celui existant
  const handleCreateOrUseClient = async () => {
    if (!formData.client_name.trim()) {
      setError('الرجاء إدخال اسم العميل');
      return null;
    }

    let clientId = null;

    // Vérifier si le client existe
    const existingClient = clients.find(
      c => c.name.toLowerCase() === formData.client_name.toLowerCase()
    );

    if (existingClient) {
      clientId = existingClient._id || existingClient.id;
      setSelectedClient(existingClient);
    } else {
      // Créer un nouveau client
        try {
        const login = formData.client_name
          .toLowerCase()
          .replace(/\s+/g, '.')
          .substring(0, 20);
        
        const password = Math.random().toString(36).substring(2, 10);
        const response = await clientsAPI.create({
          name: formData.client_name,
          login: login,
          password: password,
          role: 'client'
        });

        const created = response.data?.data || response.data;
        clientId = created._id || created.id || created.insertId || created.ID;
        setSelectedClient(created);
        setClients([...clients, created]);
        setError('');
        
        console.log(`✅ عميل جديد تم إنشاؤه: ${formData.client_name}`);
        console.log(`📧 اسم المستخدم: ${login}`);
        console.log(`🔑 كلمة المرور: ${password}`);
        
      } catch (err) {
        setError('خطأ في إنشاء العميل');
        console.error(err);
        return null;
      }
    }

    return clientId;
  };

  // ✅ MODIFIÉE: Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Créer ou récupérer le client
      const clientId = await handleCreateOrUseClient();

      if (!clientId) {
        setLoading(false);
        return;
      }

      // Créer le dossier avec le client_id
      const dataToSubmit = {
        deposit_date: formData.deposit_date,
        client_name: formData.client_name,
        debtor_name: formData.debtor,
        debt_proof: formData.debt_proof,
        total_amount: formData.total_amount,
        commission: formData.commission,
        notes: formData.notes
      };


      await filesAPI.create(dataToSubmit);
      
      // Réinitialiser le formulaire
      setFormData({
        deposit_date: new Date().toISOString().split('T')[0],
        client_name: '',
        debtor: '',
        debt_proof: '',
        total_amount: '',
        commission: '',
        notes: ''
      });
      setSelectedClient(null);
      setFilteredClients([]);
      setShowSuggestions(false);

      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء إنشاء الملف');
      console.error('Error:', error);
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
        <Modal.Title>إضافة ملف جديد</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>تاريخ الإيداع *</Form.Label>
                <Form.Control
                  type="date"
                  name="deposit_date"
                  value={formData.deposit_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              {/* ✅ NOUVEAU CHAMP: Autocomplétion pour العميل */}
              <Form.Group className="mb-3">
                <Form.Label>العميل *</Form.Label>
                
                <div style={{ position: 'relative' }}>
                  <Form.Control
                    type="text"
                    value={formData.client_name}
                    onChange={handleClientNameChange}
                    placeholder="أدخل اسم العميل أو اختر من القائمة"
                    autoComplete="off"
                    required
                  />

                  {/* قائمة الاقتراحات */}
                  {showSuggestions && filteredClients.length > 0 && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '2px solid #0d6efd',
                        borderTop: 'none',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        borderRadius: '0 0 4px 4px',
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        marginTop: '-4px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {filteredClients.map(client => (
                        <div
                          key={client._id || client.id}
                          onClick={() => handleSelectClient(client)}
                          style={{
                            padding: '0.75rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f8f0'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <span style={{ fontWeight: 600 }}>{client.name}</span>
                          <span 
                            style={{
                              background: '#28a745',
                              color: 'white',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            موجود
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* رسالة عند عدم وجود عملاء مطابقين */}
                  {showSuggestions && formData.client_name.trim() && filteredClients.length === 0 && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#e8f5e9',
                        border: '2px solid #28a745',
                        borderTop: 'none',
                        padding: '1rem',
                        borderRadius: '0 0 4px 4px',
                        zIndex: 1000,
                        marginTop: '-4px',
                        textAlign: 'center'
                      }}
                    >
                      <p style={{ margin: 0, color: '#2e7d32', fontSize: '0.9rem' }}>
                        ✨ سيتم إنشاء عميل جديد: <strong>{formData.client_name}</strong>
                      </p>
                    </div>
                  )}
                </div>

                {/* عرض العميل المختار */}
                {selectedClient && (
                  <small style={{
                    display: 'block',
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: '#e8f5e9',
                    borderLeft: '4px solid #28a745',
                    borderRadius: '4px',
                    color: '#2e7d32',
                    fontSize: '0.85rem'
                  }}>
                    ✅ تم التحديد: {selectedClient.name}
                  </small>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>اسم المدين *</Form.Label>
                <Form.Control
                  type="text"
                  name="debtor"
                  value={formData.debtor}
                  onChange={handleChange}
                  placeholder="أدخل اسم المدين"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>سند الدين</Form.Label>
                <Form.Control
                  type="text"
                  name="debt_proof"
                  value={formData.debt_proof}
                  onChange={handleChange}
                  placeholder="وصف سند الدين"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>المبلغ الإجمالي *</Form.Label>
                <Form.Control
                  type="number"
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleChange}
                  placeholder="أدخل المبلغ"
                  required
                  min="0"
                  step="0.01"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>العمولة</Form.Label>
                <Form.Control
                  type="number"
                  name="commission"
                  value={formData.commission}
                  onChange={handleChange}
                  placeholder="العمولة"
                  min="0"
                  step="0.01"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>ملاحظات</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="أي ملاحظات إضافية"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ الملف'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default Files;