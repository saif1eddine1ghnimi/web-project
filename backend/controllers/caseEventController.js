const { pool } = require('../config/database');

const getCaseEvents = async (req, res) => {
  try {
    const { caseId } = req.params;

    const [events] = await pool.execute(`
      SELECT ce.*, u.name as created_by_name
      FROM case_events ce
      LEFT JOIN users u ON ce.created_by = u.id
      WHERE ce.case_id = ?
      ORDER BY ce.event_date ASC, ce.event_time ASC
    `, [caseId]);

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Get case events error:', error);
    res.status(500).json({ success: false, message: 'Error fetching case events' });
  }
};

const createCaseEvent = async (req, res) => {
  try {
    const {
      case_id,
      event_type,
      title,
      description,
      event_date,
      event_time,
      location,
      address,
      lat,
      lng,
      reminder_days
    } = req.body;

    if (!case_id || !title || !event_date) {
      return res.status(400).json({
        success: false,
        message: 'Case ID, title and event date are required'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO case_events 
       (case_id, event_type, title, description, event_date, event_time, 
        location, address, lat, lng, reminder_days, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        case_id, event_type, title, description, event_date, event_time,
        location, address, lat, lng, reminder_days || 7, req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Case event created successfully',
      data: { id: result.insertId, title, event_date }
    });
  } catch (error) {
    console.error('Create case event error:', error);
    res.status(500).json({ success: false, message: 'Error creating case event' });
  }
};

const deleteCaseEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM case_events WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Case event not found'
      });
    }

    res.json({ success: true, message: 'Case event deleted successfully' });
  } catch (error) {
    console.error('Delete case event error:', error);
    res.status(500).json({ success: false, message: 'Error deleting case event' });
  }
};

module.exports = { getCaseEvents, createCaseEvent, deleteCaseEvent };