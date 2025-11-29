const { pool } = require('../config/database');

const getCaseTypes = async (req, res) => {
  try {
    const [types] = await pool.execute(`
      SELECT ct.*, u.name as created_by_name 
      FROM case_types ct
      LEFT JOIN users u ON ct.created_by = u.id
      ORDER BY ct.name
    `);
    
    res.json({ success: true, data: types });
  } catch (error) {
    console.error('Get case types error:', error);
    res.status(500).json({ success: false, message: 'Error fetching case types' });
  }
};

const createCaseType = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Case type name is required' 
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO case_types (name, description, created_by) VALUES (?, ?, ?)',
      [name, description, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Case type created successfully',
      data: { id: result.insertId, name, description }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Case type name already exists'
      });
    }
    console.error('Create case type error:', error);
    res.status(500).json({ success: false, message: 'Error creating case type' });
  }
};

const deleteCaseType = async (req, res) => {
  try {
    const { id } = req.params;

    // التحقق من عدم وجود قضايا مرتبطة بهذا النوع
    const [cases] = await pool.execute(
      'SELECT COUNT(*) as case_count FROM cases WHERE case_type_id = ?',
      [id]
    );

    if (cases[0].case_count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete case type that has associated cases'
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM case_types WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Case type not found'
      });
    }

    res.json({ success: true, message: 'Case type deleted successfully' });
  } catch (error) {
    console.error('Delete case type error:', error);
    res.status(500).json({ success: false, message: 'Error deleting case type' });
  }
};

module.exports = { getCaseTypes, createCaseType, deleteCaseType };