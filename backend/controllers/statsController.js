// backend/controllers/statsController.js
const { pool } = require('../config/database');

const getDashboardStats = async (req, res) => {
  try {
    // إحصائيات الملفات
    const [fileStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_files,
        SUM(total_amount) as total_debt,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_files,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_files,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_files,
        COUNT(CASE WHEN status = 'partially_paid' THEN 1 END) as partially_paid_files,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_files
      FROM files
    `);

    // إحصائيات العملاء
    const [clientStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_clients,
        COUNT(DISTINCT f.client_id) as active_clients
      FROM clients c
      LEFT JOIN files f ON c.id = f.client_id
    `);

    // إحصائيات المهام
    const [taskStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks
      FROM tasks
    `);

    // إحصائيات مالية
    const [financialStats] = await pool.execute(`
      SELECT 
        COALESCE(SUM(recovered_amount), 0) as total_recovered,
        COALESCE(SUM(expenses), 0) as total_expenses,
        COALESCE(SUM(net_commission), 0) as total_net_commission
      FROM paid_files
    `);

    // الملفات الأخيرة
    const [recentFiles] = await pool.execute(`
      SELECT f.*, c.name as client_name
      FROM files f
      LEFT JOIN clients c ON f.client_id = c.id
      ORDER BY f.created_at DESC
      LIMIT 5
    `);

    // المهام القادمة
    const [upcomingTasks] = await pool.execute(`
      SELECT t.*, u.name as assigned_to_name, f.debtor as file_debtor
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN files f ON t.file_id = f.id
      WHERE t.status IN ('pending', 'in_progress')
      AND t.due_date >= CURDATE()
      ORDER BY t.due_date ASC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        files: fileStats[0],
        clients: clientStats[0],
        tasks: taskStats[0],
        financial: financialStats[0],
        recentFiles,
        upcomingTasks
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
};

const getClientStatistics = async (req, res) => {
  try {
    const [clientStats] = await pool.execute(`
      SELECT 
        c.name as client_name,
        COUNT(f.id) as file_count,
        SUM(f.total_amount) as total_debt,
        COALESCE(SUM(pf.recovered_amount), 0) as recovered_amount,
        COALESCE(SUM(pf.expenses), 0) as total_expenses,
        COALESCE(SUM(pf.client_rights), 0) as client_rights,
        CASE 
          WHEN SUM(f.total_amount) > 0 THEN 
            (COALESCE(SUM(pf.recovered_amount), 0) / SUM(f.total_amount)) * 100 
          ELSE 0 
        END as recovery_rate,
        COALESCE(SUM(pf.net_commission), 0) as net_commission,
        COALESCE(SUM(pf.due_balance), 0) as due_balance
      FROM clients c
      LEFT JOIN files f ON c.id = f.client_id
      LEFT JOIN paid_files pf ON f.id = pf.file_id
      GROUP BY c.id, c.name
      ORDER BY total_debt DESC
    `);

    res.json({
      success: true,
      data: clientStats
    });
  } catch (error) {
    console.error('Get client statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client statistics'
    });
  }
};

const getMonthlyStats = async (req, res) => {
  try {
    const { year } = req.params;

    const [monthlyStats] = await pool.execute(`
      SELECT 
        MONTH(f.created_at) as month,
        YEAR(f.created_at) as year,
        COUNT(f.id) as files_count,
        SUM(f.total_amount) as total_debt,
        COALESCE(SUM(pf.recovered_amount), 0) as recovered_amount,
        COALESCE(SUM(pf.expenses), 0) as expenses,
        COALESCE(SUM(pf.net_commission), 0) as net_commission
      FROM files f
      LEFT JOIN paid_files pf ON f.id = pf.file_id
      WHERE YEAR(f.created_at) = ?
      GROUP BY YEAR(f.created_at), MONTH(f.created_at)
      ORDER BY year, month
    `, [year || new Date().getFullYear()]);

    res.json({
      success: true,
      data: monthlyStats
    });
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly statistics'
    });
  }
};

module.exports = {
  getDashboardStats,
  getClientStatistics,
  getMonthlyStats
};