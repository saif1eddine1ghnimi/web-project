import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, Modal, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { tasksAPI, usersAPI, filesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';
import ProtectedRoute from '../components/common/ProtectedRoute';
import './Tasks.css';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const { isAdmin, isEmployee } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, [filterStatus]);

  const fetchTasks = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await tasksAPI.getAll(params);
      setTasks(response.data.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
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
      <div className="tasks-page">
        <Header />
        
        <Container fluid className="page-header bg-light py-4">
          <Container>
            <Row className="align-items-center">
              <Col>
                <h1 className="h2 mb-0">إدارة المهام</h1>
                <p className="text-muted mb-0">عرض وإدارة جميع مهام المكتب</p>
              </Col>
              <Col xs="auto">
                {(isAdmin() || isEmployee()) && (
                  <Button 
                    variant="primary" 
                    onClick={() => setShowCreateModal(true)}
                  >
                    <i className="fas fa-plus me-2"></i>
                    إضافة مهمة جديدة
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
                      variant={filterStatus === 'pending' ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => handleStatusFilter('pending')}
                      className="me-2"
                    >
                      معلق
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
                      variant={filterStatus === 'completed' ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => handleStatusFilter('completed')}
                    >
                      مكتمل
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* جدول المهام */}
          <Card>
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">قائمة المهام</h5>
                </Col>
                <Col xs="auto">
                  <small className="text-muted">
                    إجمالي المهام: <strong>{tasks.length}</strong>
                  </small>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              {tasks.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>عنوان المهمة</th>
                        <th>الملف</th>
                        <th>المسند إلى</th>
                        <th>الأولوية</th>
                        <th>تاريخ الاستحقاق</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <TaskRow key={task.id} task={task} onUpdate={fetchTasks} />
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-tasks fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">لا توجد مهام</h5>
                  <p className="text-muted">لم يتم إضافة أي مهام حتى الآن</p>
                  {(isAdmin() || isEmployee()) && (
                    <Button 
                      variant="primary" 
                      onClick={() => setShowCreateModal(true)}
                    >
                      إضافة أول مهمة
                    </Button>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* مودال إضافة مهمة جديدة */}
        <CreateTaskModal 
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTasks();
          }}
        />
      </div>
    </ProtectedRoute>
  );
};

// مكون صف المهمة
const TaskRow = ({ task, onUpdate }) => {
  const { user, isAdmin, isEmployee } = useAuth();

  const getStatusVariant = (status) => {
    const variants = {
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'secondary'
    };
    return variants[status] || 'secondary';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'معلق',
      in_progress: 'قيد العمل',
      completed: 'مكتمل',
      cancelled: 'ملغي'
    };
    return texts[status] || status;
  };

  const getPriorityVariant = (priority) => {
    const variants = {
      high: 'danger',
      medium: 'warning',
      low: 'secondary'
    };
    return variants[priority] || 'secondary';
  };

  const getPriorityText = (priority) => {
    const texts = {
      high: 'عالي',
      medium: 'متوسط',
      low: 'منخفض'
    };
    return texts[priority] || priority;
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await tasksAPI.update(task.id, { status: newStatus });
      onUpdate();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const isAssignedToMe = task.assigned_to === user?.id;

  return (
    <tr>
      <td>
        <div>
          <div className="fw-semibold">{task.title}</div>
          {task.description && (
            <small className="text-muted">{task.description.substring(0, 50)}...</small>
          )}
        </div>
      </td>
      <td>
        {task.file_debtor ? (
          <Link to={`/files/${task.file_id}`} className="text-decoration-none">
            {task.file_debtor}
          </Link>
        ) : (
          '-'
        )}
      </td>
      <td>{task.assigned_to_name || 'غير محدد'}</td>
      <td>
        <Badge bg={getPriorityVariant(task.priority)}>
          {getPriorityText(task.priority)}
        </Badge>
      </td>
      <td>
        <div className={new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-danger' : ''}>
          {new Date(task.due_date).toLocaleDateString('ar-EG')}
        </div>
      </td>
      <td>
        <Badge bg={getStatusVariant(task.status)}>
          {getStatusText(task.status)}
        </Badge>
      </td>
      <td>
        <div className="action-buttons">
          <Button
            as={Link}
            to={`/tasks/${task.id}`}
            variant="outline-primary"
            size="sm"
            className="me-1"
          >
            <i className="fas fa-eye"></i>
          </Button>
          
          {(isAdmin() || isEmployee() || isAssignedToMe) && (
            <>
              {task.status !== 'completed' && (
                <Button
                  variant="outline-success"
                  size="sm"
                  className="me-1"
                  onClick={() => handleStatusUpdate('completed')}
                >
                  <i className="fas fa-check"></i>
                </Button>
              )}
              
              {task.status === 'pending' && isAssignedToMe && (
                <Button
                  variant="outline-info"
                  size="sm"
                  className="me-1"
                  onClick={() => handleStatusUpdate('in_progress')}
                >
                  <i className="fas fa-play"></i>
                </Button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

// مودال إنشاء مهمة جديدة
const CreateTaskModal = ({ show, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_id: '',
    assigned_to: '',
    priority: 'medium',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reminder_days: 3
  });
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsersAndFiles();
  }, []);

  const fetchUsersAndFiles = async () => {
    try {
      const [usersRes, filesRes] = await Promise.all([
        usersAPI.getAll(),
        filesAPI.getAll()
      ]);
      setUsers(usersRes.data.data);
      setFiles(filesRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await tasksAPI.create(formData);
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء إنشاء المهمة');
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
        <Modal.Title>إضافة مهمة جديدة</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form.Group className="mb-3">
            <Form.Label>عنوان المهمة *</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="أدخل عنوان المهمة"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>وصف المهمة</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="وصف تفصيلي للمهمة"
            />
          </Form.Group>

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
                <Form.Label>مسند إلى *</Form.Label>
                <Form.Select
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  required
                >
                  <option value="">اختر الموظف</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.role_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
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
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>تاريخ الاستحقاق *</Form.Label>
                <Form.Control
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>أيام التذكير</Form.Label>
                <Form.Control
                  type="number"
                  name="reminder_days"
                  value={formData.reminder_days}
                  onChange={handleChange}
                  min="1"
                  max="30"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ المهمة'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default Tasks;