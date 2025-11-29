const cron = require('cron');
const { pool } = require('../config/database');

const checkCaseReminders = async () => {
  try {
    console.log('🔔 Checking case reminders...');
    
    // البحث عن المواعيد التي تحتاج تذكير
    const [upcomingEvents] = await pool.execute(`
      SELECT 
        ce.*, 
        c.title as case_title, 
        c.case_number,
        c.client_id,
        cl.name as client_name,
        u.email, 
        u.name as user_name, 
        u.id as user_id
      FROM case_events ce
      JOIN cases c ON ce.case_id = c.id
      JOIN clients cl ON c.client_id = cl.id
      JOIN users u ON ce.created_by = u.id
      WHERE ce.reminder_sent = FALSE
      AND DATE(ce.event_date) = DATE_ADD(CURDATE(), INTERVAL ce.reminder_days DAY)
      AND ce.event_date >= CURDATE()
    `);

    console.log(`📋 Found ${upcomingEvents.length} events needing reminders`);

    for (const event of upcomingEvents) {
      try {
        // إنشاء إشعار للمستخدم
        await pool.execute(
          `INSERT INTO notifications (user_id, title, message, link) 
           VALUES (?, 'تذكير بموعد قضية', ?, ?)`,
          [
            event.user_id,
            `⏰ تذكير بموعد قضية\n\n` +
            `📌 الموعد: ${event.title}\n` +
            `📂 القضية: ${event.case_title} ${event.case_number ? `(#${event.case_number})` : ''}\n` +
            `👤 العميل: ${event.client_name}\n` +
            `📅 التاريخ: ${new Date(event.event_date).toLocaleDateString('ar-EG')}\n` +
            `⏰ الوقت: ${event.event_time || 'غير محدد'}\n` +
            `📍 المكان: ${event.location || 'غير محدد'}\n\n` +
            `🔔 سيتم التذكير قبل ${event.reminder_days} يوم من الموعد`,
            `/cases/${event.case_id}`
          ]
        );

        // تحديث حالة التذكير
        await pool.execute(
          'UPDATE case_events SET reminder_sent = TRUE WHERE id = ?',
          [event.id]
        );

        console.log(`✅ Sent reminder for event: "${event.title}" to user: ${event.user_name}`);
        
      } catch (error) {
        console.error(`❌ Error sending reminder for event ${event.id}:`, error);
      }
    }

    // إعادة تعيين التذكيرات للمواعيد التي انتهت
    const [resetResult] = await pool.execute(`
      UPDATE case_events 
      SET reminder_sent = FALSE 
      WHERE reminder_sent = TRUE 
      AND event_date < CURDATE()
    `);

    if (resetResult.affectedRows > 0) {
      console.log(`🔄 Reset ${resetResult.affectedRows} past event reminders`);
    }

    console.log(`🎉 Completed reminders check. Processed: ${upcomingEvents.length} events`);

  } catch (error) {
    console.error('❌ Error checking reminders:', error);
  }
};

// التحقق من مهام التذكير أيضاً
const checkTaskReminders = async () => {
  try {
    console.log('🔔 Checking task reminders...');
    
    const [upcomingTasks] = await pool.execute(`
      SELECT t.*, u.name as assigned_to_name, u_assigned.email as assigned_email
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
      WHERE t.status IN ('pending', 'in_progress')
      AND t.due_date <= DATE_ADD(CURDATE(), INTERVAL t.reminder_days DAY)
      AND t.due_date >= CURDATE()
    `);

    for (const task of upcomingTasks) {
      // إرسال إشعارات للتذكير
      await pool.execute(
        `INSERT INTO notifications (user_id, title, message, link) 
         VALUES (?, 'تذكير بمهمة', ?, '/tasks/${task.id}')`,
        [task.assigned_to, `المهمة "${task.title}" تستحق في ${task.due_date}`]
      );
    }

    console.log(`✅ Sent reminders for ${upcomingTasks.length} tasks`);
  } catch (error) {
    console.error('❌ Error checking task reminders:', error);
  }
};

// الجمع بين جميع عمليات التذكير
const runAllReminders = async () => {
  console.log('🚀 Starting all reminder checks...');
  await checkCaseReminders();
  await checkTaskReminders();
  console.log('✅ All reminder checks completed');
};

// تشغيل الـ Cron job يومياً الساعة 8 صباحاً
const reminderJob = new cron.CronJob('0 8 * * *', runAllReminders);

// يمكن أيضاً تشغيله كل ساعة للاختبار
// const reminderJob = new cron.CronJob('0 * * * *', runAllReminders);

module.exports = { 
  checkCaseReminders, 
  checkTaskReminders, 
  runAllReminders,
  reminderJob 
};