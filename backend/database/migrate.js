// backend/database/migrate.js
const { pool } = require('../config/database');

const createTables = async () => {
  try {
    // جدول الأدوار
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول المستخدمين
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        login VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role_id INT,
        phone VARCHAR(20),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    // جدول العملاء
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        cin VARCHAR(50),
        login VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // جدول الملفات الرئيسي
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deposit_date DATE NOT NULL,
        client_id INT NOT NULL,
        debtor VARCHAR(255) NOT NULL,
        debt_proof TEXT,
        total_amount DECIMAL(15,2) NOT NULL,
        commission DECIMAL(15,2),
        notes TEXT,
        status ENUM('new', 'in_progress', 'paid', 'partially_paid', 'closed') DEFAULT 'new',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // جدول الملفات المدفوعة
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS paid_files (
        file_id INT PRIMARY KEY,
        deposit_date DATE,
        client_id INT,
        debtor VARCHAR(255),
        debt_proof TEXT,
        total_amount DECIMAL(15,2),
        last_action VARCHAR(255),
        last_action_date DATE,
        recovered_amount DECIMAL(15,2),
        client_rights DECIMAL(15,2),
        notes TEXT,
        client_balance DECIMAL(15,2),
        balance_date DATE,
        expenses DECIMAL(15,2),
        reference VARCHAR(255),
        net_commission DECIMAL(15,2),
        due_balance DECIMAL(15,2),
        FOREIGN KEY (file_id) REFERENCES files(id),
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `);

    // جدول أنواع المصاريف
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS expense_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول مصاريف الملفات
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS file_expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT NOT NULL,
        expense_type_id INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        expense_date DATE,
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files(id),
        FOREIGN KEY (expense_type_id) REFERENCES expense_types(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // جدول المهام
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_id INT,
        assigned_to INT,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        due_date DATE,
        reminder_days INT DEFAULT 3,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // جدول المستندات
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT,
        client_id INT,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(100),
        file_size INT,
        uploaded_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files(id),
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    // جدول الإشعارات
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(500),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // إدخال البيانات الأساسية
    await insertInitialData();
    
    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

const insertInitialData = async () => {
  try {
    // إدخال الأدوار
    await pool.execute(`
      INSERT IGNORE INTO roles (name, description) VALUES 
      ('admin', 'مدير النظام - صلاحيات كاملة'),
      ('employee', 'موظف - صلاحيات محددة'),
      ('client', 'عميل - صلاحيات محدودة')
    `);

    // إدخال أنواع المصاريف
    const expenseTypes = [
      'أجرة محامي', 'رفع اعتراض', 'اتعاب تقاضي', 'تنبيه', 'احتجاج بالدفع',
      'عقلة تنفيذية', 'شاحنة وعملة', 'قوة عاملة', 'ادراج عربة بالتفتيش',
      'محضر تنفيذ جزئي', 'ايقاف تنفيذ', 'مواصلة تنفيذ', 'رفع اعتراض سيارة',
      'محاولة التبليغ عن عجز', 'احتجاج', 'محاولة', 'انذار بالدفع',
      'اعلام حكم مدني', 'محضر ترسيم اعتراض تحفظي', 'كف تفتيش', 'اتصال بمركز',
      'محضر بحث واسترشاد', 'ايداع بمركز', 'تعذر تنفيذ', 'محاولة تنفيذ',
      'تنابر', 'تنفيذ بالاداء', 'اعلام بتوكيل', 'استقصاء', 'أمر بدفع',
      'اذون', 'تنابر إحالة', 'تنفيذية', 'استئناف', 'كشف ملكية', 'كشف اسطول',
      'بريدية', 'اعتراض', 'استدعائات', 'أجرة عدل تنفيذ'
    ];

    for (const type of expenseTypes) {
      await pool.execute(
        'INSERT IGNORE INTO expense_types (name) VALUES (?)',
        [type]
      );
    }

    console.log('Initial data inserted successfully!');
  } catch (error) {
    console.error('Error inserting initial data:', error);
  }
};

// تشغيل الإنشاء
if (require.main === module) {
  createTables().then(() => {
    console.log('Migration completed!');
    process.exit(0);
  });
}

module.exports = { createTables };