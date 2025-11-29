const { pool } = require('../config/database');

const getClientCases = async (req, res) => {
  try {
    const { clientId } = req.params;

    const [cases] = await pool.execute(`
      SELECT c.*, ct.name as case_type_name, f.debtor as file_debtor,
             u.name as created_by_name
      FROM cases c
      LEFT JOIN case_types ct ON c.case_type_id = ct.id
      LEFT JOIN files f ON c.file_id = f.id
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.client_id = ?
      ORDER BY c.created_at DESC
    `, [clientId]);

    res.json({ success: true, data: cases });
  } catch (error) {
    console.error('Get client cases error:', error);
    res.status(500).json({ success: false, message: 'Error fetching cases' });
  }
};

const createCase = async (req, res) => {
  try {
    const {
      client_id,
      file_id,
      case_type_id,
      case_number,
      title,
      description,
      court_name,
      court_address,
      court_lat,
      court_lng,
      status,
      priority
    } = req.body;

    if (!client_id || !file_id || !title) {
      return res.status(400).json({
        success: false,
        message: 'Client ID, file ID and title are required'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO cases 
       (client_id, file_id, case_type_id, case_number, title, description, 
        court_name, court_address, court_lat, court_lng, status, priority, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client_id, file_id, case_type_id, case_number, title, description,
        court_name, court_address, court_lat, court_lng, status, priority, req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: { id: result.insertId, title, case_number }
    });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ success: false, message: 'Error creating case' });
  }
};

const updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE cases SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    res.json({ success: true, message: 'Case updated successfully' });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ success: false, message: 'Error updating case' });
  }
};

module.exports = { getClientCases, createCase, updateCase };