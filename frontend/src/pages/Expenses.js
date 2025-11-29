import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, Modal, Alert } from 'react-bootstrap';
import { expensesAPI, filesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';
import ProtectedRoute from '../components/common/ProtectedRoute';
import './Expenses.css';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isAdmin, isEmployee } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [typesRes, filesRes] = await Promise.all([
        expensesAPI.getTypes(),
        filesAPI.getAll()
      ]);
      
      setExpenseTypes(typesRes.data.data);
      setFiles(filesRes.data.data);
      
      // جلب مصاريف جميع الملفات
      const allExpenses = [];
      for (const file of filesRes.data.data) {
        try {
          const expensesRes = await expensesAPI.getFileExpenses(file.id);
          allExpenses.push(...expensesRes.data.data.expenses.map(exp => ({
            ...exp,
            file_debtor: file.debtor,
            file_amount: file.total_amount
          })));
        } catch (error) {
          console.error(`Error fetching expenses for file ${file.id}:`, error);
        }
      }
      
      setExpenses(allExpenses);
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

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  return (
    <ProtectedRoute requiredRole={['admin', 'employee']}>
      <div className="expenses-page">
        <Header />
        
        <Container fluid className="page-header bg-light py-4">
          <Container>
            <Row className="align-items-center">
              <Col>
                <h1 className="h2 mb-0">إدارة المصاريف</h1>
                <p className="text-muted mb-0">تسجيل ومتابعة مصاريف الملفات</p>
              </Col>
              <Col xs="auto">
                <Button 
                  variant="primary" 
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  إضافة مصروف جديد
                </Button>
              </Col>
            </Row>
          </Container>
        </Container>

        <Container className="py-4">
          {/* إحصائيات المصاريف */}
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <h6 className="card-title">إجمالي المصاريف</h6>
                  <h3 className="text-danger mb-0">
                    ${totalExpenses.toLocaleString()}
                  </h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <h6 className="card-title">عدد المصاريف</h6>
                  <h3 className="text-primary mb-0">{expenses.length}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <h6 className="card-title">الملفات ذات المصاريف</h6>
                  <h3 className="text-info mb-0">
                    {[...new Set(expenses.map(exp => exp.file_id))].length}
                  </h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <h6 className="card-title">أنواع المصاريف</h6>
                  <h3 className="text-success mb-0">{expenseTypes.length}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* جدول المصاريف */}
          <Card>
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">سجل المصاريف</h5>
                </Col>
                <Col xs="auto">
                  <small className="text-muted">
                    إجمالي المصاريف: <strong>${totalExpenses.toLocaleString()}</strong>
                  </small>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              {expenses.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>نوع المصروف</th>
                        <th>الملف</th>
                        <th>المبلغ</th>
                        <th>التاريخ</th>
                        <th>مسجل بواسطة</th>
                        <th>ملاحظات</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <ExpenseRow key={expense.id} expense={expense} onUpdate={fetchData} />
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-receipt fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">لا توجد مصاريف</h5>
                  <p className="text-muted">لم يتم تسجيل أي مصاريف حتى الآن</p>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowCreateModal(true)}
                  >
                    تسجيل أول مصروف
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* مودال إضافة مصروف جديد */}
        <CreateExpenseModal 
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchData();
          }}
          expenseTypes={expenseTypes}
          files={files}
        />
      </div>
    </ProtectedRoute>
  );
};

// مكون صف المصروف
const ExpenseRow = ({ expense, onUpdate }) => {
  const { isAdmin } = useAuth();

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      try {
        await expensesAPI.delete(expense.id);
        onUpdate();
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('حدث خطأ أثناء حذف المصروف');
      }
    }
  };

  return (
    <tr>
      <td>
        <Badge bg="primary" className="mb-1">
          {expense.expense_type_name}
        </Badge>
      </td>
      <td>
        <div>
          <div className="fw-semibold">{expense.file_debtor}</div>
          <small className="text-muted">
            ${expense.file_amount?.toLocaleString()}
          </small>
        </div>
      </td>
      <td>
        <span className="fw-bold text-danger">
          ${expense.amount?.toLocaleString()}
        </span>
      </td>
      <td>
        {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString('ar-EG') : '-'}
      </td>
      <td>{expense.created_by_name || 'غير معروف'}</td>
      <td>
        {expense.notes ? (
          <small className="text-muted">{expense.notes.substring(0, 30)}...</small>
        ) : (
          '-'
        )}
      </td>
      <td>
        {isAdmin() && (
          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleDelete}
          >
            <i className="fas fa-trash"></i>
          </Button>
        )}
      </td>
    </tr>
  );
};

// مودال إنشاء مصروف جديد
const CreateExpenseModal = ({ show, onHide, onSuccess, expenseTypes, files }) => {
  const [formData, setFormData] = useState({
    file_id: '',
    expense_type_id: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await expensesAPI.add(formData);
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء تسجيل المصروف');
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
        <Modal.Title>إضافة مصروف جديد</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>الملف *</Form.Label>
                <Form.Select
                  name="file_id"
                  value={formData.file_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">اختر الملف</option>
                  {files.map(file => (
                    <option key={file.id} value={file.id}>
                      {file.debtor} - ${file.total_amount?.toLocaleString()}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>نوع المصروف *</Form.Label>
                <Form.Select
                  name="expense_type_id"
                  value={formData.expense_type_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">اختر نوع المصروف</option>
                  {expenseTypes.map(type => (
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
                <Form.Label>المبلغ *</Form.Label>
                <Form.Control
                  type="number"
                  name="amount"
                  value={formData.amount}
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
                <Form.Label>تاريخ المصروف</Form.Label>
                <Form.Control
                  type="date"
                  name="expense_date"
                  value={formData.expense_date}
                  onChange={handleChange}
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
              placeholder="أي ملاحظات إضافية حول المصروف"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ المصروف'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default Expenses;