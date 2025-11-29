import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Tabs, Tab } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { clientsAPI, casesAPI, documentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';
import ProtectedRoute from '../components/common/ProtectedRoute';
import CaseManager from '../components/CaseManager';
import './ClientDetails.css';

const ClientDetails = () => {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [clientFiles, setClientFiles] = useState([]);
  const [clientCases, setClientCases] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isEmployee } = useAuth();

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      const [filesRes, casesRes, docsRes] = await Promise.all([
        clientsAPI.getFiles(clientId),
        casesAPI.getClientCases(clientId),
        documentsAPI.getClientDocuments(clientId)
      ]);

      setClientFiles(filesRes.data.data);
      setClientCases(casesRes.data.data);
      setDocuments(docsRes.data.data);

      // في التطبيق الحقيقي: جلب بيانات العميل من API
      setClient({
        id: clientId,
        name: 'اسم العميل',
        email: 'email@example.com',
        phone: '0512345678',
        login: 'client123'
      });
    } catch (error) {
      console.error('Error fetching client data:', error);
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
      <div className="client-details-page">
        <Header />
        
        <Container fluid className="page-header bg-light py-4">
          <Container>
            <Row className="align-items-center">
              <Col>
                <h1 className="h2 mb-0">تفاصيل العميل</h1>
                <p className="text-muted mb-0">معلومات العميل وملفاته وقضاياه</p>
              </Col>
              <Col xs="auto">
                <Button as={Link} to="/clients" variant="outline-primary">
                  <i className="fas fa-arrow-right me-2"></i>
                  رجوع للقائمة
                </Button>
              </Col>
            </Row>
          </Container>
        </Container>

        <Container className="py-4">
          {/* معلومات العميل */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">معلومات العميل</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="client-info-item">
                    <strong>الاسم:</strong> {client?.name}
                  </div>
                  <div className="client-info-item">
                    <strong>البريد الإلكتروني:</strong> {client?.email || 'غير متوفر'}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="client-info-item">
                    <strong>الهاتف:</strong> {client?.phone || 'غير متوفر'}
                  </div>
                  <div className="client-info-item">
                    <strong>اسم المستخدم:</strong> {client?.login || 'غير محدد'}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* التبويبات */}
          <Tabs defaultActiveKey="cases" className="mb-4">
            {/* تبويب القضايا */}
            <Tab eventKey="cases" title="القضايا">
              <CaseManager 
                clientId={clientId} 
                clientFiles={clientFiles}
                onCaseUpdate={fetchClientData}
              />
            </Tab>

            {/* تبويب الملفات */}
            <Tab eventKey="files" title="الملفات">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">ملفات العميل</h5>
                </Card.Header>
                <Card.Body>
                  {clientFiles.length > 0 ? (
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>المدين</th>
                            <th>المبلغ</th>
                            <th>الحالة</th>
                            <th>تاريخ الإيداع</th>
                            <th>الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientFiles.map(file => (
                            <tr key={file.id}>
                              <td>{file.debtor}</td>
                              <td>${file.total_amount?.toLocaleString()}</td>
                              <td>
                                <Badge bg={getStatusBadge(file.status)}>
                                  {getStatusText(file.status)}
                                </Badge>
                              </td>
                              <td>
                                {new Date(file.deposit_date).toLocaleDateString('ar-EG')}
                              </td>
                              <td>
                                <Button
                                  as={Link}
                                  to={`/files/${file.id}`}
                                  variant="outline-primary"
                                  size="sm"
                                >
                                  <i className="fas fa-eye"></i>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i className="fas fa-folder-open fa-2x text-muted mb-3"></i>
                      <p className="text-muted">لا توجد ملفات لهذا العميل</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab>

            {/* تبويب المستندات */}
            <Tab eventKey="documents" title="المستندات">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">مستندات العميل</h5>
                </Card.Header>
                <Card.Body>
                  {documents.length > 0 ? (
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>اسم الملف</th>
                            <th>نوع الملف</th>
                            <th>الحجم</th>
                            <th>تاريخ الرفع</th>
                            <th>الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map(doc => (
                            <tr key={doc.id}>
                              <td>
                                <i className="fas fa-file-pdf text-danger me-2"></i>
                                {doc.file_name}
                              </td>
                              <td>
                                <Badge bg="light" text="dark">
                                  {doc.file_type || 'مستند'}
                                </Badge>
                              </td>
                              <td>
                                {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'غير معروف'}
                              </td>
                              <td>
                                {new Date(doc.created_at).toLocaleDateString('ar-EG')}
                              </td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-1"
                                >
                                  <i className="fas fa-download"></i>
                                </Button>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                >
                                  <i className="fas fa-print"></i>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i className="fas fa-file-alt fa-2x text-muted mb-3"></i>
                      <p className="text-muted">لا توجد مستندات لهذا العميل</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Container>
      </div>
    </ProtectedRoute>
  );
};

// دوال مساعدة
const getStatusBadge = (status) => {
  const statusMap = {
    new: 'primary',
    in_progress: 'warning',
    paid: 'success',
    partially_paid: 'info',
    closed: 'secondary'
  };
  return statusMap[status] || 'secondary';
};

const getStatusText = (status) => {
  const statusMap = {
    new: 'جديد',
    in_progress: 'قيد العمل',
    paid: 'مدفوع',
    partially_paid: 'مدفوع جزئياً',
    closed: 'مغلق'
  };
  return statusMap[status] || status;
};

export default ClientDetails;