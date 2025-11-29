import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Form, Row, Col, Badge, Alert } from 'react-bootstrap';
import { caseEventsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CaseEventsModal.css';

const CaseEventsModal = ({ case: caseItem, show, onHide, onUpdate }) => {
  const [events, setEvents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event_type: 'hearing',
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    address: '',
    reminder_days: 7
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (caseItem && show) {
      fetchCaseEvents();
    }
  }, [caseItem, show]);

  const fetchCaseEvents = async () => {
    try {
      const response = await caseEventsAPI.getByCaseId(caseItem.id);
      setEvents(response.data.data);
    } catch (error) {
      console.error('Error fetching case events:', error);
      setError('حدث خطأ في جلب مواعيد القضية');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await caseEventsAPI.create({
        ...newEvent,
        case_id: caseItem.id
      });
      
      // Reset form
      setNewEvent({
        event_type: 'hearing',
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        address: '',
        reminder_days: 7
      });
      
      setShowCreateForm(false);
      fetchCaseEvents(); // Refresh events list
      onUpdate?.(); // Notify parent component
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء إنشاء الموعد');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
      try {
        await caseEventsAPI.delete(eventId);
        fetchCaseEvents(); // Refresh events list
        onUpdate?.(); // Notify parent component
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('حدث خطأ أثناء حذف الموعد');
      }
    }
  };

  const handleChange = (e) => {
    setNewEvent({
      ...newEvent,
      [e.target.name]: e.target.value
    });
  };

  const calculateReminderDate = (eventDate, reminderDays) => {
    const date = new Date(eventDate);
    date.setDate(date.getDate() - reminderDays);
    return date;
  };

  const getEventTypeBadge = (eventType) => {
    const types = {
      hearing: { text: 'جلسة محكمة', variant: 'primary' },
      submission: { text: 'تسليم مستندات', variant: 'info' },
      meeting: { text: 'اجتماع', variant: 'warning' },
      deadline: { text: 'مهلة نهائية', variant: 'danger' },
      other: { text: 'أخرى', variant: 'secondary' }
    };
    return types[eventType] || types.other;
  };

  const isPastEvent = (eventDate) => {
    return new Date(eventDate) < new Date();
  };

  const upcomingEvents = events.filter(event => !isPastEvent(event.event_date));
  const pastEvents = events.filter(event => isPastEvent(event.event_date));

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          مواعيد القضية: {caseItem?.title}
          {caseItem?.case_number && ` (#${caseItem.case_number})`}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {error && <Alert variant="danger">{error}</Alert>}

        {/* زر إضافة موعد جديد */}
        <div className="text-end mb-3">
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <i className="fas fa-plus me-1"></i>
            {showCreateForm ? 'إلغاء الإضافة' : 'إضافة موعد جديد'}
          </Button>
        </div>

        {/* نموذج إضافة موعد جديد */}
        {showCreateForm && (
          <Card className="mb-4">
            <Card.Header>إضافة موعد جديد</Card.Header>
            <Card.Body>
              <Form onSubmit={handleCreateEvent}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>نوع الموعد *</Form.Label>
                      <Form.Select 
                        name="event_type"
                        value={newEvent.event_type}
                        onChange={handleChange}
                        required
                      >
                        <option value="hearing">جلسة محكمة</option>
                        <option value="submission">تسليم مستندات</option>
                        <option value="meeting">اجتماع</option>
                        <option value="deadline">مهلة نهائية</option>
                        <option value="other">أخرى</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>عنوان الموعد *</Form.Label>
                      <Form.Control 
                        type="text"
                        name="title"
                        value={newEvent.title}
                        onChange={handleChange}
                        placeholder="مثال: الجلسة الأولى، تسليم المستندات..."
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>وصف الموعد</Form.Label>
                  <Form.Control 
                    as="textarea"
                    rows={2}
                    name="description"
                    value={newEvent.description}
                    onChange={handleChange}
                    placeholder="وصف تفصيلي للموعد..."
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>التاريخ *</Form.Label>
                      <Form.Control 
                        type="date"
                        name="event_date"
                        value={newEvent.event_date}
                        onChange={handleChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>الوقت</Form.Label>
                      <Form.Control 
                        type="time"
                        name="event_time"
                        value={newEvent.event_time}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>المكان</Form.Label>
                      <Form.Control 
                        type="text"
                        name="location"
                        value={newEvent.location}
                        onChange={handleChange}
                        placeholder="اسم المكان"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>التذكير قبل (أيام)</Form.Label>
                      <Form.Select 
                        name="reminder_days"
                        value={newEvent.reminder_days}
                        onChange={handleChange}
                      >
                        <option value={1}>يوم واحد</option>
                        <option value={2}>يومان</option>
                        <option value={3}>3 أيام</option>
                        <option value={7}>أسبوع</option>
                        <option value={14}>أسبوعين</option>
                        <option value={30}>شهر</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {newEvent.event_date && newEvent.reminder_days && (
                  <Alert variant="info" className="py-2">
                    <small>
                      <i className="fas fa-bell me-1"></i>
                      سيتم التذكير في: {' '}
                      {calculateReminderDate(newEvent.event_date, parseInt(newEvent.reminder_days)).toLocaleDateString('ar-EG')}
                    </small>
                  </Alert>
                )}

                <div className="text-end">
                  <Button 
                    variant="secondary" 
                    className="me-2"
                    onClick={() => setShowCreateForm(false)}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ الموعد'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}

        {/* المواعيد القادمة */}
        {upcomingEvents.length > 0 && (
          <div className="mb-4">
            <h6 className="text-success mb-3">
              <i className="fas fa-clock me-1"></i>
              المواعيد القادمة
            </h6>
            {upcomingEvents.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                onDelete={handleDeleteEvent}
                getEventTypeBadge={getEventTypeBadge}
                calculateReminderDate={calculateReminderDate}
              />
            ))}
          </div>
        )}

        {/* المواعيد المنتهية */}
        {pastEvents.length > 0 && (
          <div>
            <h6 className="text-muted mb-3">
              <i className="fas fa-history me-1"></i>
              المواعيد المنتهية
            </h6>
            {pastEvents.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                onDelete={handleDeleteEvent}
                getEventTypeBadge={getEventTypeBadge}
                calculateReminderDate={calculateReminderDate}
                isPast={true}
              />
            ))}
          </div>
        )}

        {events.length === 0 && !showCreateForm && (
          <div className="text-center py-4">
            <i className="fas fa-calendar-times fa-2x text-muted mb-3"></i>
            <p className="text-muted">لا توجد مواعيد لهذه القضية</p>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

// بطاقة الموعد
const EventCard = ({ event, onDelete, getEventTypeBadge, calculateReminderDate, isPast = false }) => {
  const { isAdmin, isEmployee } = useAuth();
  const eventType = getEventTypeBadge(event.event_type);

  return (
    <Card className={`mb-2 ${isPast ? 'event-past' : 'event-upcoming'}`}>
      <Card.Body className="py-3">
        <Row className="align-items-center">
          <Col md={8}>
            <div className="d-flex align-items-center mb-1">
              <h6 className="mb-0 me-2">{event.title}</h6>
              <Badge bg={eventType.variant} className="me-2">
                {eventType.text}
              </Badge>
            </div>

            {event.description && (
              <p className="text-muted mb-1 small">{event.description}</p>
            )}

            <div className="event-details">
              <small className="text-muted">
                <strong>التاريخ:</strong> {new Date(event.event_date).toLocaleDateString('ar-EG')}
                {event.event_time && ` - ${event.event_time}`}
              </small>

              {event.location && (
                <small className="text-muted d-block">
                  <strong>المكان:</strong> {event.location}
                </small>
              )}

              {!isPast && (
                <small className="text-info d-block">
                  <i className="fas fa-bell me-1"></i>
                  التذكير: قبل {event.reminder_days} يوم 
                  ({calculateReminderDate(event.event_date, event.reminder_days).toLocaleDateString('ar-EG')})
                </small>
              )}
            </div>
          </Col>

          <Col md={4} className="text-end">
            {(isAdmin() || isEmployee()) && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onDelete(event.id)}
              >
                <i className="fas fa-trash"></i>
              </Button>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default CaseEventsModal;