const { pool } = require('../config/database');
const { generateLogin, generatePassword } = require('../utils/generateCredentials');
const bcrypt = require('bcryptjs');

// =======================================
// GET ALL FILES
// =======================================
const getAllFiles = async (req, res) => {
  try {
    const { status, client_name } = req.query;

    let query = `
      SELECT 
        f.*,
        pf.recovered_amount,
        CASE 
          WHEN pf.recovered_amount IS NOT NULL AND f.total_amount > 0
          THEN (pf.recovered_amount / f.total_amount) * 100
          ELSE 0
        END AS recovery_percentage
      FROM files f
      LEFT JOIN paid_files pf ON f.id = pf.file_id
    `;

    const params = [];

    if (status) {
      query += ' WHERE f.status = ?';
      params.push(status);
    }

    if (client_name) {
      query += params.length ? ' AND f.client_name = ?' : ' WHERE f.client_name = ?';
      params.push(client_name);
    }

    query += ' ORDER BY f.created_at DESC';

    const [files] = await pool.execute(query, params);

    res.json({ success: true, data: files });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ success: false, message: 'Error fetching files' });
  }
};

// =======================================
// GET FILE BY ID
// =======================================
const getFileById = async (req, res) => {
  try {
    const { id } = req.params;

    const [files] = await pool.execute(
      `SELECT * FROM files WHERE id = ?`,
      [id]
    );

    if (files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.json({ success: true, data: files[0] });

  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ success: false, message: 'Error fetching file' });
  }
};

// =======================================
// CREATE FILE
// =======================================
const createFile = async (req, res) => {
  try {
    const {
      deposit_date,
      client_name,
      debtor_name,
      debt_proof,
      total_amount,
      commission,
      notes
    } = req.body;

    if (!deposit_date || !client_name || !debtor_name || !total_amount) {
      return res.status(400).json({
        success: false,
        message: 'Required: deposit_date, client_name, debtor_name, total_amount'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO files
       (deposit_date, client_name, debtor_name, debt_proof, total_amount, commission, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [deposit_date, client_name, debtor_name, debt_proof, total_amount, commission, notes]
    );

    res.status(201).json({
      success: true,
      message: 'File created successfully',
      data: {
        id: result.insertId,
        deposit_date,
        client_name,
        debtor_name,
        total_amount
      }
    });

  } catch (error) {
    console.error('Create file error:', error);
    res.status(500).json({ success: false, message: 'Error creating file' });
  }
};

// =======================================
// UPDATE FILE
// =======================================
const updateFile = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      deposit_date,
      client_name,
      debtor_name,
      debt_proof,
      total_amount,
      commission,
      notes,
      status
    } = req.body;

    const [result] = await pool.execute(
      `UPDATE files
       SET deposit_date = ?, client_name = ?, debtor_name = ?, debt_proof = ?,
           total_amount = ?, commission = ?, notes = ?, status = ?
       WHERE id = ?`,
      [deposit_date, client_name, debtor_name, debt_proof, total_amount, commission, notes, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.json({ success: true, message: 'File updated successfully' });

  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ success: false, message: 'Error updating file' });
  }
};

// =======================================
// MOVE TO PAID
// =======================================
const moveToPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const paidData = req.body;

    const [files] = await pool.execute('SELECT * FROM files WHERE id = ?', [id]);

    if (files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = files[0];

    await pool.execute(
      `INSERT INTO paid_files
       (file_id, deposit_date, client_name, debtor_name, debt_proof, total_amount,
        last_action, last_action_date, recovered_amount, client_rights, notes,
        client_balance, balance_date, expenses, reference, net_commission, due_balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        file.id, file.deposit_date, file.client_name, file.debtor_name, file.debt_proof, file.total_amount,
        paidData.last_action, paidData.last_action_date, paidData.recovered_amount,
        paidData.client_rights, paidData.notes, paidData.client_balance, paidData.balance_date,
        paidData.expenses, paidData.reference, paidData.net_commission, paidData.due_balance
      ]
    );

    await pool.execute(
      'UPDATE files SET status = ? WHERE id = ?',
      ['closed', id]
    );

    res.json({ success: true, message: 'File moved to paid successfully' });

  } catch (error) {
    console.error('Move to paid error:', error);
    res.status(500).json({ success: false, message: 'Error moving file to paid' });
  }
};

// =======================================
// EXPORTS
// =======================================
module.exports = {
  getAllFiles,
  getFileById,
  createFile,
  updateFile,
  moveToPaid
};
