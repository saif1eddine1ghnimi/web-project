import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { statsAPI, filesAPI, tasksAPI } from '../../services/api';
import './Dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [recentFiles, setRecentFiles] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, filesRes, tasksRes] = await Promise.all([
        statsAPI.getDashboard(),
        filesAPI.getAll({ status: 'new' }),
        tasksAPI.getAll({ status: 'pending' })
      ]);

      setStats(statsRes.data.data);
      setRecentFiles(filesRes.data.data.slice(0, 5));
      setUpcomingTasks(tasksRes.data.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    <div className="dashboard-admin">
      <div className="dashboard-header bg-primary text-white py-4">
        <div className="container">
          <h1 className="h2 mb-0">لوحة تحكم المدير</h1>
          <p className="mb-0">نظرة عامة على أداء المكتب</p>
        </div>
      </div>

      <div className="container py-4">
        {/* إحصائيات سريعة */}
        <Row className="g-3 mb-4">
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title">إجمالي الملفات</h6>
                    <h3 className="text-primary mb-0">{stats.files?.total_files || 0}</h3>
                  </div>
                  <div className="stat-icon">
                    <i className="fas fa-folder"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title">إجمالي الديون</h6>
                    <h3 className="text-success mb-0">
                      {stats.files?.total_debt ? `$${stats.files.total_debt.toLocaleString()}` : '$0'}
                    </h3>
                  </div>
                  <div className="stat-icon">
                    <i className="fas fa-money-bill-wave"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title">العملاء النشطين</h6>
                    <h3 className="text-info mb-0">{stats.clients?.active_clients || 0}</h3>
                  </div>
                  <div className="stat-icon">
                    <i className="fas fa-users"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title">المهام المعلقة</h6>
                    <h3 className="text-warning mb-0">{stats.tasks?.pending_tasks || 0}</h3>
                  </div>
                  <div className="stat-icon">
                    <i className="fas fa-tasks"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4">
          {/* الملفات الحديثة */}
          <Col lg={6}>
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">أحدث الملفات</h5>
                <Button as={Link} to="/files" variant="outline-primary" size="sm">
                  عرض الكل
                </Button>
              </Card.Header>
              <Card.Body>
                {recentFiles.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>العميل</th>
                          <th>المبلغ</th>
                          <th>الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentFiles.map(file => (
                          <tr key={file.id}>
                            <td>{file.debtor}</td>
                            <td>${file.total_amount?.toLocaleString()}</td>
                            <td>
                              <Badge bg={getStatusBadge(file.status)}>
                                {getStatusText(file.status)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted text-center">لا توجد ملفات حديثة</p>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* المهام القادمة */}
          <Col lg={6}>
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">المهام القادمة</h5>
                <Button as={Link} to="/tasks" variant="outline-primary" size="sm">
                  عرض الكل
                </Button>
              </Card.Header>
              <Card.Body>
                {upcomingTasks.length > 0 ? (
                  <div className="task-list">
                    {upcomingTasks.map(task => (
                      <div key={task.id} className="task-item d-flex align-items-center justify-content-between p-3 border-bottom">
                        <div>
                          <h6 className="mb-1">{task.title}</h6>
                          <small className="text-muted">
                            {task.file_debtor && `ملف: ${task.file_debtor}`}
                          </small>
                        </div>
                        <div className="text-end">
                          <Badge bg={getPriorityBadge(task.priority)} className="mb-1">
                            {getPriorityText(task.priority)}
                          </Badge>
                          <br />
                          <small className="text-muted">
                            {new Date(task.due_date).toLocaleDateString('ar-EG')}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center">لا توجد مهام قادمة</p>
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

const getPriorityBadge = (priority) => {
  const priorityMap = {
    high: 'danger',
    medium: 'warning',
    low: 'secondary'
  };
  return priorityMap[priority] || 'secondary';
};

const getPriorityText = (priority) => {
  const priorityMap = {
    high: 'عالي',
    medium: 'متوسط',
    low: 'منخفض'
  };
  return priorityMap[priority] || priority;
};

export default AdminDashboard;