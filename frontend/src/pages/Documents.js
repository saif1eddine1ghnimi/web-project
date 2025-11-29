import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert } from 'react-bootstrap';
import { documentsAPI, filesAPI, clientsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';
import ProtectedRoute from '../components/common/ProtectedRoute';
import './Documents.css';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [files, setFiles] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { isAdmin, isEmployee, isClient, user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [filesRes, clientsRes] = await Promise.all([
        filesAPI.getAll(),
        clientsAPI.getAll()
      ]);

      setFiles(filesRes.data.data);
      setClients(clientsRes.data.data);

      // جلب المستندات بناءً على نوع المستخدم
      if (isClient()) {
        // للعميل: جلب مستندات ملفاته فقط
        const clientFiles = filesRes.data.data.filter(file => file.client_id === user.id);
        const clientDocs = [];
        for (const file of clientFiles) {
          try {
            const docsRes = await documentsAPI.getFileDocuments(file.id);
            clientDocs.push(...docsRes.data.data.map(doc => ({
              ...doc,
              file_debtor: file.debtor
            })));
          } catch (error) {
            console.error(`Error fetching documents for file ${file.id}:`, error);
          }
        }
        setDocuments(clientDocs);
      } else {
        // للموظف والمدير: جلب جميع المستندات
        const allDocs = [];
        for (const file of filesRes.data.data) {
          try {
            const docsRes = await documentsAPI.getFileDocuments(file.id);
            allDocs.push(...docsRes.data.data.map(doc => ({
              ...doc,
              file_debtor: file.debtor
            })));
          } catch (error) {
            console.error(`Error fetching documents for file ${file.id}:`, error);
          }
        }
        setDocuments(allDocs);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
    <ProtectedRoute>
      <div className="documents-page">
        <Header />
        
        <Container fluid className="page-header bg-light py-4">
          <Container>
            <Row className="align-items-center">
              <Col>
                <h1 className="h2 mb-0">المستندات والملفات</h1>
                <p className="text-muted mb-0">إدارة مستندات الملفات والعملاء</p>
              </Col>
              <Col xs="auto">
                {(isAdmin() || isEmployee()) && (
                  <Button 
                    variant="primary" 
                    onClick={() => setShowUploadModal(true)}
                  >
                    <i className="fas fa-upload me-2"></i>
                    رفع مستند
                  </Button>
                )}
              </Col>
            </Row>
          </Container>
        </Container>

        <Container className="py-4">
          {/* إحصائيات المستندات */}
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <h6 className="card-title">إجمالي المستندات</h6>
                  <h3 className="text-primary mb-0">{documents.length}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <h6 className="card-title">الملفات ذات المستندات</h6>
                  <h3 className="text-success mb-0">
                    {[...new Set(documents.map(doc => doc.file_id))].length}
                  </h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <h6 className="card-title">إجمالي الحجم</h6>
                  <h3 className="text-info mb-0">
                    {(documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0) / (1024 * 1024)).toFixed(2)} MB
                  </h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <h6 className="card-title">آخر رفع</h6>
                  <h3 className="text-warning mb-0">
                    {documents.length > 0 ? 
                      new Date(documents[0].created_at).toLocaleDateString('ar-EG') : 
                      '-'
                    }
                  </h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* جدول المستندات */}
          <Card>
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">قائمة المستندات</h5>
                </Col>
                <Col xs="auto">
                  <small className="text-muted">
                    إجمالي المستندات: <strong>{documents.length}</strong>
                  </small>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              {documents.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>اسم الملف</th>
                        <th>الملف</th>
                        <th>نوع الملف</th>
                        <th>الحجم</th>
                        <th>تاريخ الرفع</th>
                        <th>رفع بواسطة</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((document) => (
                        <DocumentRow key={document.id} document={document} onUpdate={fetchData} />
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">لا توجد مستندات</h5>
                  <p className="text-muted">لم يتم رفع أي مستندات حتى الآن</p>
                  {(isAdmin() || isEmployee()) && (
                    <Button 
                      variant="primary" 
                      onClick={() => setShowUploadModal(true)}
                    >
                      رفع أول مستند
                    </Button>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* مودال رفع مستند جديد */}
        <UploadDocumentModal 
          show={showUploadModal}
          onHide={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchData();
          }}
          files={files}
          clients={clients}
        />
      </div>
    </ProtectedRoute>
  );
};

// مكون صف المستند
const DocumentRow = ({ document, onUpdate }) => {
  const { isAdmin, isEmployee } = useAuth();

  const getFileTypeIcon = (fileType) => {
    if (fileType?.includes('pdf')) return 'fas fa-file-pdf text-danger';
    if (fileType?.includes('image')) return 'fas fa-file-image text-success';
    if (fileType?.includes('word') || fileType?.includes('document')) 
      return 'fas fa-file-word text-primary';
    return 'fas fa-file text-secondary';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = () => {
    // محاكاة تحميل الملف
    alert(`سيتم تحميل الملف: ${document.file_name}`);
    // في التطبيق الحقيقي: window.open(`http://localhost:5000/${document.file_path}`);
  };

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستند؟')) {
      try {
        await documentsAPI.delete(document.id);
        onUpdate();
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('حدث خطأ أثناء حذف المستند');
      }
    }
  };

  return (
    <tr>
      <td>
        <div className="d-flex align-items-center">
          <i className={`${getFileTypeIcon(document.file_type)} me-2`} style={{ fontSize: '1.25rem' }}></i>
          <div>
            <div className="fw-semibold">{document.file_name}</div>
            {document.file_type && (
              <small className="text-muted">{document.file_type}</small>
            )}
          </div>
        </div>
      </td>
      <td>
        {document.file_debtor ? (
          <div className="text-primary">{document.file_debtor}</div>
        ) : (
          '-'
        )}
      </td>
      <td>
        <span className="badge bg-light text-dark">
          {document.file_type || 'غير معروف'}
        </span>
      </td>
      <td>{formatFileSize(document.file_size)}</td>
      <td>
        {new Date(document.created_at).toLocaleDateString('ar-EG')}
      </td>
      <td>{document.uploaded_by_name || 'غير معروف'}</td>
      <td>
        <div className="action-buttons">
          <Button
            variant="outline-primary"
            size="sm"
            className="me-1"
            onClick={handleDownload}
          >
            <i className="fas fa-download"></i>
          </Button>
          
          {(isAdmin() || isEmployee()) && (
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

// مودال رفع مستند جديد
const UploadDocumentModal = ({ show, onHide, onSuccess, files, clients }) => {
  const [formData, setFormData] = useState({
    file_id: '',
    client_id: '',
    file_type: 'document'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('يرجى اختيار ملف للرفع');
      return;
    }

    setLoading(true);
    setError('');

    const uploadData = new FormData();
    uploadData.append('document', selectedFile);
    uploadData.append('file_id', formData.file_id);
    uploadData.append('client_id', formData.client_id);
    uploadData.append('file_type', formData.file_type);

    try {
      await documentsAPI.upload(uploadData);
      onSuccess();
      // Reset form
      setFormData({ file_id: '', client_id: '', file_type: 'document' });
      setSelectedFile(null);
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء رفع الملف');
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('حجم الملف يجب أن يكون أقل من 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>رفع مستند جديد</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>الملف (اختياري)</Form.Label>
                <Form.Select
                  name="file_id"
                  value={formData.file_id}
                  onChange={handleChange}
                >
                  <option value="">اختر ملف</option>
                  {files.map(file => (
                    <option key={file.id} value={file.id}>
                      {file.debtor} - ${file.total_amount}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>العميل (اختياري)</Form.Label>
                <Form.Select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                >
                  <option value="">اختر عميل</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>نوع المستند</Form.Label>
            <Form.Select
              name="file_type"
              value={formData.file_type}
              onChange={handleChange}
            >
              <option value="document">مستند عام</option>
              <option value="contract">عقد</option>
              <option value="invoice">فاتورة</option>
              <option value="report">تقرير</option>
              <option value="legal">وثيقة قانونية</option>
              <option value="other">أخرى</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>اختر الملف *</Form.Label>
            <Form.Control
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              required
            />
            <Form.Text className="text-muted">
              الأنواع المسموحة: PDF, Word, Images (حتى 10MB)
            </Form.Text>
          </Form.Group>

          {selectedFile && (
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              الملف المحدد: <strong>{selectedFile.name}</strong> 
              ({Math.round(selectedFile.size / 1024)} KB)
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={loading || !selectedFile}>
            {loading ? 'جاري الرفع...' : 'رفع المستند'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default Documents;