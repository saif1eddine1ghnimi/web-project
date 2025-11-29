const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateLogin, generatePassword } = require('../utils/generateCredentials');

const getAllClients = async (req, res) => {
  try {
    const [clients] = await pool.execute(
      'SELECT * FROM clients ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching clients'
    });
  }
};

const getClientFiles = async (req, res) => {
  try {
    const { clientId } = req.params;

    const [files] = await pool.execute(
      `SELECT f.*, 
              (SELECT SUM(amount) FROM file_expenses WHERE file_id = f.id) as total_expenses
       FROM files f 
       WHERE f.client_id = ? 
       ORDER BY f.created_at DESC`,
      [clientId]
    );

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Get client files error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client files'
    });
  }
};

const createClient = async (req, res) => {
  try {
    // ✅ NOUVEAU: Accepter login et password du frontend
    const { name, email, phone, address, cin, login, password } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'اسم العميل مطلوب'
      });
    }

    // ✅ NOUVEAU: Utiliser login/password du frontend ou générer
    const finalLogin = login || generateLogin(name);
    const finalPassword = password || generatePassword();
    const hashedPassword = await bcrypt.hash(finalPassword, 12);

    // ✅ NOUVEAU: Vérifier que le client n'existe pas déjà
    const [existingClient] = await pool.execute(
      'SELECT id FROM clients WHERE login = ? OR name = ?',
      [finalLogin, name]
    );

    if (existingClient && existingClient.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'هذا العميل موجود بالفعل'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO clients (name, email, phone, address, cin, login, password, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name.trim(), email || null, phone || null, address || null, cin || null, finalLogin, hashedPassword]
    );

    // envoyer les identifiants aux directeurs / employés dédiés via notifications
    try {
      const message =
        `تم إنشاء حساب لعميل جديد:\n` +
        `الاسم: ${name}\n` +
        `اسم المستخدم: ${finalLogin}\n` +
        `كلمة المرور: ${finalPassword}\n` +
        `يرجى التواصل مع العميل لإعطائه بيانات الدخول`;

      await pool.execute(
        `INSERT INTO notifications (user_id, title, message, link) 
         SELECT id, 'عميل جديد - بيانات الدخول', ?, '/clients/${result.insertId}' 
         FROM users WHERE role_id IN (1, 2)`,
        [message]
      );
    } catch (notifErr) {
      console.error('Error inserting client notifications:', notifErr);
      // ne pas bloquer la création du client si la notification échoue
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء العميل بنجاح',
      data: {
        _id: result.insertId,
        id: result.insertId,
        name,
        email,
        phone,
        address,
        cin,
        login: finalLogin
      }
    });
  } catch (error) {
    console.error('Create client error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم أو اسم العميل موجود بالفعل'
      });
    }
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء العميل: ' + error.message
    });
  }
};

const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, cin } = req.body;

    const [result] = await pool.execute(
      `UPDATE clients 
       SET name = ?, email = ?, phone = ?, address = ?, cin = ?
       WHERE id = ?`,
      [name, email, phone, address, cin, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client updated successfully'
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating client'
    });
  }
};

const getClientStats = async (req, res) => {
  try {
    const { clientId } = req.params;

    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_files,
        SUM(total_amount) as total_debt,
        SUM(CASE WHEN status = 'closed' THEN total_amount ELSE 0 END) as recovered_amount,
        AVG(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) * 100 as recovery_rate
       FROM files 
       WHERE client_id = ?`,
      [clientId]
    );

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client statistics'
    });
  }
};

// ✅ UN SEUL module.exports À LA FIN !
module.exports = {
  getAllClients,
  getClientFiles,
  createClient,
  updateClient,
  getClientStats
};