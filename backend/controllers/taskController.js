// backend/controllers/taskController.js
const { pool } = require('../config/database');

/* =============================================
   GET ALL TASKS
============================================= */
const getAllTasks = async (req, res) => {
  try {
    const { status, assigned_to } = req.query;
    let query = `
      SELECT 
        t.*, 
        f.debtor AS file_debtor,
        f.total_amount AS file_amount,
        u_assigned.name AS assigned_to_name,
        u_created.name AS created_by_name
      FROM tasks t
      LEFT JOIN files f ON t.file_id = f.id
      LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
      LEFT JOIN users u_created ON t.created_by = u_created.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE t.status = ?';
      params.push(status);
    }

    if (assigned_to) {
      query += params.length ? ' AND t.assigned_to = ?' : ' WHERE t.assigned_to = ?';
      params.push(assigned_to);
    }

    query += ' ORDER BY t.due_date ASC, t.priority DESC';

    const [tasks] = await pool.execute(query, params);

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Error fetching tasks' });
  }
};

/* =============================================
   CREATE TASK
============================================= */
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      file_id,
      assigned_to,
      priority,
      due_date,
      reminder_days
    } = req.body;

    if (!title || !assigned_to) {
      return res.status(400).json({
        success: false,
        message: 'Title and assigned user are required'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO tasks 
       (title, description, file_id, assigned_to, priority, due_date, reminder_days, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, file_id, assigned_to, priority, due_date, reminder_days, req.user.id]
    );

    // إشعار الموظف المعين
    await pool.execute(
      `INSERT INTO notifications (user_id, title, message, link)
       VALUES (?, 'مهمة جديدة', ?, '/tasks/${result.insertId}')`,
      [assigned_to, `تم تعيينك بمهمة جديدة: ${title}`]
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { id: result.insertId, title, assigned_to, due_date }
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task'
    });
  }
};

/* =============================================
   UPDATE TASK
============================================= */
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      file_id,
      assigned_to,
      priority,
      status,
      due_date,
      reminder_days
    } = req.body;

    const [result] = await pool.execute(
      `UPDATE tasks 
       SET title = ?, description = ?, file_id = ?, assigned_to = ?,
           priority = ?, status = ?, due_date = ?, reminder_days = ?
       WHERE id = ?`,
      [title, description, file_id, assigned_to, priority, status, due_date, reminder_days, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({ success: true, message: 'Task updated successfully' });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task'
    });
  }
};

/* =============================================
   GET AUTHENTICATED USER TASKS
============================================= */
const getUserTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const [tasks] = await pool.execute(
      `SELECT 
         t.*, 
         f.debtor AS file_debtor, 
         f.total_amount AS file_amount
       FROM tasks t
       LEFT JOIN files f ON t.file_id = f.id
       WHERE t.assigned_to = ?
       ORDER BY 
         CASE 
           WHEN t.status = 'pending' THEN 1
           WHEN t.status = 'in_progress' THEN 2
           ELSE 3
         END,
         t.due_date ASC`,
      [userId]
    );

    res.json({ success: true, data: tasks });

  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user tasks'
    });
  }
};

/* =============================================
   CHECK REMINDERS (CRON JOB)
============================================= */
const checkTaskReminders = async () => {
  try {
    const [tasks] = await pool.execute(
      `SELECT 
         t.*, 
         u.name AS assigned_to_name,
         u.email AS assigned_email
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.status IN ('pending', 'in_progress')
       AND t.reminder_days IS NOT NULL
       AND t.due_date <= DATE_ADD(CURDATE(), INTERVAL t.reminder_days DAY)
       AND t.due_date >= CURDATE()`
    );

    for (const task of tasks) {
      await pool.execute(
        `INSERT INTO notifications (user_id, title, message, link)
         VALUES (?, 'تذكير بمهمة', ?, '/tasks/${task.id}')`,
        [task.assigned_to, `المهمة "${task.title}" تستحق في ${task.due_date}`]
      );
    }

    console.log(`Sent reminders for ${tasks.length} tasks`);

  } catch (error) {
    console.error('Check task reminders error:', error);
  }
};

module.exports = {
  getAllTasks,
  createTask,
  updateTask,
  getUserTasks,
  checkTaskReminders
};
