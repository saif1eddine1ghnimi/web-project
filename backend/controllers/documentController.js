// backend/controllers/documentController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

// إعداد multer لرفع الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
}).single('document');

const uploadDocument = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      const { file_id, client_id, file_type } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const [result] = await pool.execute(
        `INSERT INTO documents 
         (file_id, client_id, file_name, file_path, file_type, file_size, uploaded_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          file_id,
          client_id,
          req.file.originalname,
          req.file.path,
          file_type || 'document',
          req.file.size,
          req.user.id
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          id: result.insertId,
          file_name: req.file.originalname,
          file_path: req.file.path,
          file_size: req.file.size
        }
      });
    } catch (error) {
      console.error('Upload document error:', error);
      
      // حذف الملف إذا فشلت العملية
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Error uploading document'
      });
    }
  });
};

const getFileDocuments = async (req, res) => {
  try {
    const { fileId } = req.params;

    const [documents] = await pool.execute(
      `SELECT d.*, u.name as uploaded_by_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.file_id = ?
       ORDER BY d.created_at DESC`,
      [fileId]
    );

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Get file documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents'
    });
  }
};

const getClientDocuments = async (req, res) => {
  try {
    const { clientId } = req.params;

    const [documents] = await pool.execute(
      `SELECT d.*, f.debtor, u.name as uploaded_by_name
       FROM documents d
       LEFT JOIN files f ON d.file_id = f.id
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.client_id = ?
       ORDER BY d.created_at DESC`,
      [clientId]
    );

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Get client documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client documents'
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // الحصول على معلومات الملف قبل الحذف
    const [documents] = await pool.execute(
      'SELECT file_path FROM documents WHERE id = ?',
      [id]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const filePath = documents[0].file_path;

    const [result] = await pool.execute(
      'DELETE FROM documents WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // حذف الملف من النظام
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document'
    });
  }
};

module.exports = {
  uploadDocument,
  getFileDocuments,
  getClientDocuments,
  deleteDocument
};