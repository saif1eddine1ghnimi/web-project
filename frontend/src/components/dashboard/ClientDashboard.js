import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { clientsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const ClientDashboard = () => {
  const [clientFiles, setClientFiles] = useState([]);
  const [clientStats, setClientStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchClientData();
    }
  }, [user]);

  const fetchClientData = async () => {
    try {
      const [filesRes, statsRes] = await Promise.all([
        clientsAPI.getFiles(user.id),
        clientsAPI.getStats(user.id)
      ]);

      setClientFiles(filesRes.data.data);
      setClientStats(statsRes.data.data);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-client">
      <div className="dashboard-header bg-success text-white py-4">
        <div className="container">
          <h1 className="h2 mb-0">لوحة تحكم العميل</h1>
          <p className="mb-0">مرحباً {user?.name}، هذه نظرة عامة على ملفاتك</p>
        </div>
      </div>

      <div className="container py-4">
        {/* إحصائيات العميل */}
        <Row className="g-3 mb-4">
          <Col md={4}>
            <Card className="stat-card">
              <Card.Body>
                <div className="text-center">
                  <h6 className="card-title">إجمالي الملفات</h6>
                  <h3 className="text-primary mb-2">{clientStats.total_files || 0}</h3>
                  <ProgressBar 
                    now={100} 
                    variant="primary" 
                    style={{ height: '6px' }}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card">
              <Card.Body>
                <div className="text-center">
                  <h6 className="card-title">إجمالي الديون</h6>
                  <h3 className="text-success mb-2">
                    ${clientStats.total_debt?.toLocaleString() || '0'}
                  </h3>
                  <ProgressBar 
                    now={100} 
                    variant="success" 
                    style={{ height: '6px' }}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card">
              <Card.Body>
                <div className="text-center">
                  <h6 className="card-title">نسبة الاستخلاص</h6>
                  <h3 className="text-info mb-2">{clientStats.recovery_rate?.toFixed(1) || 0}%</h3>
                  <ProgressBar 
                    now={clientStats.recovery_rate || 0} 
                    variant="info" 
                    style={{ height: '6px' }}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* ملفات العميل */}
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">ملفاتي</h5>
              </Card.Header>
              <Card.Body>
                {clientFiles.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>المدين</th>
                          <th>المبلغ</th>
                          <th>المصاريف</th>
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
                            <td>${file.total_expenses?.toLocaleString() || '0'}</td>
                            <td>
                              <Badge bg={getStatusBadge(file.status)}>
                                {getStatusText(file.status)}
                              </Badge>
                            </td>
                            <td>{new Date(file.deposit_date).toLocaleDateString('ar-EG')}</td>
                            <td>
                              <Button as={Link} to={`/my-files/${file.id}`} variant="outline-primary" size="sm">
                                التفاصيل
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
                    <p className="text-muted">لا توجد ملفات مسجلة لحسابك</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
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

export default ClientDashboard;