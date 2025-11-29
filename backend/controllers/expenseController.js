// backend/controllers/expenseController.js
const { pool } = require('../config/database');

const getExpenseTypes = async (req, res) => {
  try {
    const [types] = await pool.execute(
      'SELECT * FROM expense_types ORDER BY name'
    );

    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Get expense types error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense types'
    });
  }
};

const addFileExpense = async (req, res) => {
  try {
    const { file_id, expense_type_id, amount, expense_date, notes } = req.body;

    if (!file_id || !expense_type_id || !amount) {
      return res.status(400).json({
        success: false,
        message: 'File ID, expense type and amount are required'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO file_expenses 
       (file_id, expense_type_id, amount, expense_date, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [file_id, expense_type_id, amount, expense_date, notes, req.user.id]
    );

    // تحديث إجمالي المصاريف في الجدول الرئيسي
    await updateFileTotalExpenses(file_id);

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: {
        id: result.insertId,
        file_id,
        expense_type_id,
        amount,
        expense_date
      }
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding expense'
    });
  }
};

const getFileExpenses = async (req, res) => {
  try {
    const { fileId } = req.params;

    const [expenses] = await pool.execute(
      `SELECT fe.*, et.name as expense_type_name, u.name as created_by_name
       FROM file_expenses fe
       LEFT JOIN expense_types et ON fe.expense_type_id = et.id
       LEFT JOIN users u ON fe.created_by = u.id
       WHERE fe.file_id = ?
       ORDER BY fe.expense_date DESC`,
      [fileId]
    );

    const [total] = await pool.execute(
      'SELECT SUM(amount) as total FROM file_expenses WHERE file_id = ?',
      [fileId]
    );

    res.json({
      success: true,
      data: {
        expenses,
        total: total[0].total || 0
      }
    });
  } catch (error) {
    console.error('Get file expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching file expenses'
    });
  }
};

const updateFileTotalExpenses = async (fileId) => {
  try {
    const [total] = await pool.execute(
      'SELECT SUM(amount) as total FROM file_expenses WHERE file_id = ?',
      [fileId]
    );

    // يمكن استخدام هذا في الإحصائيات المستقبلية
    return total[0].total || 0;
  } catch (error) {
    console.error('Update total expenses error:', error);
    return 0;
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    // الحصول على file_id قبل الحذف
    const [expenses] = await pool.execute(
      'SELECT file_id FROM file_expenses WHERE id = ?',
      [id]
    );

    if (expenses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    const fileId = expenses[0].file_id;

    const [result] = await pool.execute(
      'DELETE FROM file_expenses WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // تحديث الإجمالي بعد الحذف
    await updateFileTotalExpenses(fileId);

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting expense'
    });
  }
};

module.exports = {
  getExpenseTypes,
  addFileExpense,
  getFileExpenses,
  deleteExpense
};