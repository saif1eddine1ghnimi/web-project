import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button } from 'react-bootstrap';
import { statsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';
import ProtectedRoute from '../components/common/ProtectedRoute';
import './Statistics.css';

const Statistics = () => {
  const [dashboardStats, setDashboardStats] = useState({});
  const [clientStats, setClientStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [selectedYear]);

  const fetchStatistics = async () => {
    try {
      const [dashboardRes, clientsRes, monthlyRes] = await Promise.all([
        statsAPI.getDashboard(),
        statsAPI.getClients(),
        statsAPI.getMonthly(selectedYear)
      ]);

      setDashboardStats(dashboardRes.data.data);
      setClientStats(clientsRes.data.data);
      setMonthlyStats(monthlyRes.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole={['admin']}>
        <Header />
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">جاري التحميل...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const years = [2024, 2023, 2022];
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  return (
    <ProtectedRoute requiredRole={['admin']}>
      <div className="statistics-page">
        <Header />
        
        <Container fluid className="page-header bg-light py-4">
          <Container>
            <Row className="align-items-center">
              <Col>
                <h1 className="h2 mb-0">التقارير والإحصائيات</h1>
                <p className="text-muted mb-0">تحليلات وأداء المكتب</p>
              </Col>
              <Col xs="auto">
                <Form.Select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{ width: '120px' }}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Form.Select>
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
                  <div className="stat-icon revenue">
                    <i className="fas fa-money-bill-wave"></i>
                  </div>
                  <h4 className="stat-value text-success">
                    ${dashboardStats.financial?.total_recovered?.toLocaleString() || '0'}
                  </h4>
                  <p className="stat-label">إجمالي المستخلص</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <div className="stat-icon files">
                    <i className="fas fa-folder"></i>
                  </div>
                  <h4 className="stat-value text-primary">
                    {dashboardStats.files?.total_files || 0}
                  </h4>
                  <p className="stat-label">إجمالي الملفات</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <div className="stat-icon clients">
                    <i className="fas fa-users"></i>
                  </div>
                  <h4 className="stat-value text-info">
                    {dashboardStats.clients?.total_clients || 0}
                  </h4>
                  <p className="stat-label">إجمالي العملاء</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <div className="stat-icon commission">
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <h4 className="stat-value text-warning">
                    ${dashboardStats.financial?.total_net_commission?.toLocaleString() || '0'}
                  </h4>
                  <p className="stat-label">صافي العمولة</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4">
            {/* إحصائيات العملاء */}
            <Col lg={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">أداء العملاء</h5>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table hover size="sm">
                      <thead>
                        <tr>
                          <th>العميل</th>
                          <th>الملفات</th>
                          <th>إجمالي الدين</th>
                          <th>المستخلص</th>
                          <th>النسبة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientStats.slice(0, 8).map((client, index) => (
                          <tr key={index}>
                            <td>
                              <div className="client-name">
                                {client.client_name}
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-primary">
                                {client.file_count}
                              </span>
                            </td>
                            <td>${client.total_debt?.toLocaleString()}</td>
                            <td>${client.recovered_amount?.toLocaleString()}</td>
                            <td>
                              <div className="recovery-rate">
                                <span className={`rate ${getRateColor(client.recovery_rate)}`}>
                                  {client.recovery_rate?.toFixed(1)}%
                                </span>
                                <div className="progress" style={{ height: '4px', width: '60px' }}>
                                  <div 
                                    className={`progress-bar ${getRateColor(client.recovery_rate)}`}
                                    style={{ width: `${Math.min(client.recovery_rate, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* الإحصائيات الشهرية */}
            <Col lg={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">الأداء الشهري {selectedYear}</h5>
                </Card.Header>
                <Card.Body>
                  <div className="monthly-stats">
                    {monthlyStats.map((monthData, index) => (
                      <div key={index} className="month-item">
                        <div className="month-name">
                          {months[monthData.month - 1]}
                        </div>
                        <div className="month-data">
                          <div className="data-row">
                            <span className="label">الملفات:</span>
                            <span className="value">{monthData.files_count}</span>
                          </div>
                          <div className="data-row">
                            <span className="label">الدين:</span>
                            <span className="value">${monthData.total_debt?.toLocaleString()}</span>
                          </div>
                          <div className="data-row">
                            <span className="label">المستخلص:</span>
                            <span className="value text-success">
                              ${monthData.recovered_amount?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* إحصائيات مفصلة */}
          <Row className="g-4 mt-3">
            <Col lg={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">توزيع الملفات حسب الحالة</h5>
                </Card.Header>
                <Card.Body>
                  <div className="status-distribution">
                    <div className="status-item">
                      <div className="status-info">
                        <span className="status-dot new"></span>
                        <span>جديد</span>
                      </div>
                      <span className="status-count">
                        {dashboardStats.files?.new_files || 0}
                      </span>
                    </div>
                    <div className="status-item">
                      <div className="status-info">
                        <span className="status-dot in-progress"></span>
                        <span>قيد العمل</span>
                      </div>
                      <span className="status-count">
                        {dashboardStats.files?.in_progress_files || 0}
                      </span>
                    </div>
                    <div className="status-item">
                      <div className="status-info">
                        <span className="status-dot paid"></span>
                        <span>مدفوع</span>
                      </div>
                      <span className="status-count">
                        {dashboardStats.files?.paid_files || 0}
                      </span>
                    </div>
                    <div className="status-item">
                      <div className="status-info">
                        <span className="status-dot partially-paid"></span>
                        <span>مدفوع جزئياً</span>
                      </div>
                      <span className="status-count">
                        {dashboardStats.files?.partially_paid_files || 0}
                      </span>
                    </div>
                    <div className="status-item">
                      <div className="status-info">
                        <span className="status-dot closed"></span>
                        <span>مغلق</span>
                      </div>
                      <span className="status-count">
                        {dashboardStats.files?.closed_files || 0}
                      </span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">ملخص المهام</h5>
                </Card.Header>
                <Card.Body>
                  <div className="tasks-summary">
                    <div className="task-type">
                      <div className="task-info">
                        <i className="fas fa-clock text-warning"></i>
                        <span>معلقة</span>
                      </div>
                      <span className="task-count">
                        {dashboardStats.tasks?.pending_tasks || 0}
                      </span>
                    </div>
                    <div className="task-type">
                      <div className="task-info">
                        <i className="fas fa-play-circle text-info"></i>
                        <span>قيد العمل</span>
                      </div>
                      <span className="task-count">
                        {dashboardStats.tasks?.in_progress_tasks || 0}
                      </span>
                    </div>
                    <div className="task-type">
                      <div className="task-info">
                        <i className="fas fa-check-circle text-success"></i>
                        <span>مكتملة</span>
                      </div>
                      <span className="task-count">
                        {dashboardStats.tasks?.completed_tasks || 0}
                      </span>
                    </div>
                    <div className="task-type">
                      <div className="task-info">
                        <i className="fas fa-list-alt text-primary"></i>
                        <span>إجمالي المهام</span>
                      </div>
                      <span className="task-count">
                        {dashboardStats.tasks?.total_tasks || 0}
                      </span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </ProtectedRoute>
  );
};

// دوال مساعدة
const getRateColor = (rate) => {
  if (rate >= 80) return 'high';
  if (rate >= 50) return 'medium';
  return 'low';
};

export default Statistics;