// backend/controllers/userController.js
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateLogin, generatePassword } = require('../utils/generateCredentials');

const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.login, u.phone, u.active, 
              r.name as role_name, u.created_at
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       ORDER BY u.created_at DESC`
    );

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, phone, role_id } = req.body;

    if (!name || !email || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and role are required'
      });
    }

    const login = generateLogin(name);
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users (name, email, login, password, phone, role_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, login, hashedPassword, phone, role_id]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: result.insertId,
        name,
        email,
        login,
        password, // إرجاع كلمة المرور للمدير فقط
        phone,
        role_id
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Email or login already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role_id, active } = req.body;

    const [result] = await pool.execute(
      `UPDATE users 
       SET name = ?, email = ?, phone = ?, role_id = ?, active = ?
       WHERE id = ?`,
      [name, email, phone, role_id, active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
};

module.exports = { getAllUsers, createUser, updateUser, deleteUser };