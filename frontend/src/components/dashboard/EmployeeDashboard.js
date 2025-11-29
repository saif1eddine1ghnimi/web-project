import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { tasksAPI, filesAPI } from '../../services/api';
import './Dashboard.css';

const EmployeeDashboard = () => {
  const [myTasks, setMyTasks] = useState([]);
  const [assignedFiles, setAssignedFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      const [tasksRes, filesRes] = await Promise.all([
        tasksAPI.getMyTasks(),
        filesAPI.getAll({ status: 'in_progress' })
      ]);

      setMyTasks(tasksRes.data.data);
      setAssignedFiles(filesRes.data.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching employee data:', error);
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
    <div className="dashboard-employee">
      <div className="dashboard-header bg-info text-white py-4">
        <div className="container">
          <h1 className="h2 mb-0">لوحة تحكم الموظف</h1>
          <p className="mb-0">المهام والملفات المسندة إليك</p>
        </div>
      </div>

      <div className="container py-4">
        <Row className="g-4">
          {/* مهامي */}
          <Col lg={6}>
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">مهامي</h5>
                <Button as={Link} to="/tasks" variant="outline-info" size="sm">
                  عرض الكل
                </Button>
              </Card.Header>
              <Card.Body>
                {myTasks.length > 0 ? (
                  <div className="task-list">
                    {myTasks.map(task => (
                      <div key={task.id} className="task-item d-flex align-items-center justify-content-between p-3 border-bottom">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{task.title}</h6>
                          <p className="text-muted mb-1 small">{task.description}</p>
                          {task.file_debtor && (
                            <small className="text-primary">ملف: {task.file_debtor}</small>
                          )}
                        </div>
                        <div className="text-end">
                          <Badge bg={getStatusBadge(task.status)} className="mb-1 d-block">
                            {getStatusText(task.status)}
                          </Badge>
                          <Badge bg={getPriorityBadge(task.priority)} className="mb-1 d-block">
                            {getPriorityText(task.priority)}
                          </Badge>
                          <small className="text-muted">
                            {new Date(task.due_date).toLocaleDateString('ar-EG')}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center">لا توجد مهام مسندة إليك</p>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* الملفات المسندة */}
          <Col lg={6}>
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">الملفات قيد العمل</h5>
                <Button as={Link} to="/files" variant="outline-info" size="sm">
                  عرض الكل
                </Button>
              </Card.Header>
              <Card.Body>
                {assignedFiles.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>العميل</th>
                          <th>المبلغ</th>
                          <th>الحالة</th>
                          <th>الإجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedFiles.map(file => (
                          <tr key={file.id}>
                            <td>{file.debtor}</td>
                            <td>${file.total_amount?.toLocaleString()}</td>
                            <td>
                              <Badge bg={getStatusBadge(file.status)}>
                                {getStatusText(file.status)}
                              </Badge>
                            </td>
                            <td>
                              <Button as={Link} to={`/files/${file.id}`} variant="outline-primary" size="sm">
                                عرض
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted text-center">لا توجد ملفات قيد العمل</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

// نفس دوال المساعدة من AdminDashboard
const getStatusBadge = (status) => {
  const statusMap = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'secondary',
    new: 'primary',
    paid: 'success',
    partially_paid: 'info',
    closed: 'secondary'
  };
  return statusMap[status] || 'secondary';
};

const getStatusText = (status) => {
  const statusMap = {
    pending: 'معلق',
    in_progress: 'قيد العمل',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    new: 'جديد',
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

export default EmployeeDashboard;