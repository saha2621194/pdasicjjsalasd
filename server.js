import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Создаем папки для загрузок
const UPLOADS_DIR = join(__dirname, 'uploads');
const COMPANY_DOCS_DIR = join(UPLOADS_DIR, 'company-docs');
const INVOICE_FILES_DIR = join(UPLOADS_DIR, 'invoice-files');
const RECEIVED_GOODS_PHOTOS_DIR = join(UPLOADS_DIR, 'received-goods-photos');

[UPLOADS_DIR, COMPANY_DOCS_DIR, INVOICE_FILES_DIR, RECEIVED_GOODS_PHOTOS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Раздача статических файлов
app.use('/uploads', express.static(UPLOADS_DIR));

// Инициализация базы данных
const db = new Database('crm.db');

// Оптимизация базы данных
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('temp_store = MEMORY');
db.pragma('mmap_size = 30000000000');

// Создание таблиц
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    inn TEXT NOT NULL,
    kpp TEXT NOT NULL,
    address TEXT NOT NULL,
    bank TEXT,
    bik TEXT,
    account TEXT,
    documents TEXT
  );

  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    companyId TEXT NOT NULL,
    status TEXT NOT NULL,
    managers TEXT,
    logistId TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    requestId TEXT NOT NULL,
    managerId TEXT NOT NULL,
    logistId TEXT,
    companyId TEXT,
    website TEXT,
    supplier TEXT NOT NULL,
    number TEXT NOT NULL,
    amount TEXT NOT NULL,
    contactPerson TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    logisticsComment TEXT,
    files TEXT,
    status TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    sentToLogisticsAt TEXT,
    receivedGoodsPhotos TEXT
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    invoiceId TEXT NOT NULL,
    userId TEXT NOT NULL,
    userName TEXT NOT NULL,
    text TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    user TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    details TEXT NOT NULL
  );
`);

// Миграция: добавление колонки receivedGoodsPhotos если её нет
try {
  const tableInfo = db.prepare("PRAGMA table_info(invoices)").all();
  const hasReceivedGoodsPhotos = tableInfo.some(col => col.name === 'receivedGoodsPhotos');

  if (!hasReceivedGoodsPhotos) {
    console.log('Adding receivedGoodsPhotos column to invoices table...');
    db.exec('ALTER TABLE invoices ADD COLUMN receivedGoodsPhotos TEXT');
    console.log('Migration completed successfully');
  }
} catch (error) {
  console.error('Migration error:', error);
}

// Создание индексов для быстрого поиска
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_requests_companyId ON requests(companyId);
  CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
  CREATE INDEX IF NOT EXISTS idx_invoices_requestId ON invoices(requestId);
  CREATE INDEX IF NOT EXISTS idx_invoices_managerId ON invoices(managerId);
  CREATE INDEX IF NOT EXISTS idx_invoices_logistId ON invoices(logistId);
  CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
  CREATE INDEX IF NOT EXISTS idx_comments_invoiceId ON comments(invoiceId);
`);

// Функция для сохранения base64 файла на диск
const saveBase64File = (base64Data, filename, directory) => {
  try {
    const base64String = base64Data.replace(/^data:.*;base64,/, '');
    const buffer = Buffer.from(base64String, 'base64');
    
    const ext = filename.split('.').pop();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const filepath = join(directory, uniqueName);
    
    fs.writeFileSync(filepath, buffer);
    return uniqueName;
  } catch (error) {
    console.error('Ошибка сохранения файла:', error);
    throw error;
  }
};

// Prepared statements для быстрых запросов
const statements = {
  getAllUsers: db.prepare('SELECT * FROM users'),
  insertUser: db.prepare('INSERT INTO users (id, name, email, login, password, role) VALUES (?, ?, ?, ?, ?, ?)'),
  updateUser: db.prepare('UPDATE users SET name = ?, email = ?, login = ?, password = ?, role = ? WHERE id = ?'),
  deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),
  
  getAllCompanies: db.prepare('SELECT * FROM companies'),
  insertCompany: db.prepare('INSERT INTO companies (id, name, inn, kpp, address, bank, bik, account, documents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  updateCompany: db.prepare('UPDATE companies SET name = ?, inn = ?, kpp = ?, address = ?, bank = ?, bik = ?, account = ?, documents = ? WHERE id = ?'),
  deleteCompany: db.prepare('DELETE FROM companies WHERE id = ?'),
  
  getAllRequests: db.prepare('SELECT * FROM requests'),
  insertRequest: db.prepare('INSERT INTO requests (id, title, description, companyId, status, managers, logistId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
  updateRequest: db.prepare('UPDATE requests SET title = ?, description = ?, companyId = ?, status = ?, managers = ?, logistId = ? WHERE id = ?'),
  deleteRequest: db.prepare('DELETE FROM requests WHERE id = ?'),
  getRequestById: db.prepare('SELECT * FROM requests WHERE id = ?'),
  
  getAllInvoices: db.prepare('SELECT * FROM invoices'),
  insertInvoice: db.prepare('INSERT INTO invoices (id, requestId, managerId, logistId, companyId, website, supplier, number, amount, contactPerson, phone, email, logisticsComment, files, status, createdAt, sentToLogisticsAt, receivedGoodsPhotos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  getInvoiceById: db.prepare('SELECT * FROM invoices WHERE id = ?'),
  
  getAllComments: db.prepare('SELECT * FROM comments'),
  insertComment: db.prepare('INSERT INTO comments (id, invoiceId, userId, userName, text, createdAt) VALUES (?, ?, ?, ?, ?, ?)'),
  
  getRecentHistory: db.prepare('SELECT * FROM history ORDER BY date DESC LIMIT 100'),
  insertHistory: db.prepare('INSERT INTO history (id, date, user, action, entity, details) VALUES (?, ?, ?, ?, ?, ?)')
};

// Инициализация данных по умолчанию
const initData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  
  if (userCount.count === 0) {
    statements.insertUser.run('1', 'Администратор', 'admin@company.ru', 'admin', 'admin123', 'admin');
    statements.insertUser.run('2', 'Менеджер Иван', 'manager@company.ru', 'manager', 'manager123', 'manager');
    statements.insertUser.run('3', 'Логист Мария', 'logist@company.ru', 'logist', 'logist123', 'logist');
    console.log('✅ Созданы пользователи по умолчанию');
  }
};

initData();

// Tracking последних изменений
let lastUpdateTimestamp = Date.now();

const updateTimestamp = () => {
  lastUpdateTimestamp = Date.now();
};

// Endpoint для проверки изменений
app.get('/api/check-updates', (req, res) => {
  const clientTimestamp = parseInt(req.query.timestamp) || 0;
  res.json({ 
    hasUpdates: lastUpdateTimestamp > clientTimestamp,
    timestamp: lastUpdateTimestamp
  });
});

// API Endpoints

// Users
app.get('/api/users', (req, res) => {
  try {
    const users = statements.getAllUsers.all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', (req, res) => {
  const { id, name, email, login, password, role } = req.body;
  try {
    statements.insertUser.run(id, name, email, login, password, role);
    updateTimestamp();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  const { name, email, login, password, role } = req.body;
  try {
    statements.updateUser.run(name, email, login, password, role, req.params.id);
    updateTimestamp();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    statements.deleteUser.run(req.params.id);
    updateTimestamp();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Companies
app.get('/api/companies', (req, res) => {
  try {
    const companies = statements.getAllCompanies.all();
    res.json(companies.map(c => ({
      ...c,
      documents: c.documents ? JSON.parse(c.documents) : []
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/companies', (req, res) => {
  const { id, name, inn, kpp, address, bank, bik, account, documents } = req.body;
  try {
    const savedDocs = documents.map(doc => {
      if (doc.data && doc.data.startsWith('data:')) {
        const savedFilename = saveBase64File(doc.data, doc.name, COMPANY_DOCS_DIR);
        return {
          name: doc.name,
          size: doc.size,
          path: `/uploads/company-docs/${savedFilename}`
        };
      }
      return doc;
    });
    
    statements.insertCompany.run(id, name, inn, kpp, address, bank || '', bik || '', account || '', JSON.stringify(savedDocs));
    updateTimestamp();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/companies/:id', (req, res) => {
  const { name, inn, kpp, address, bank, bik, account, documents } = req.body;
  try {
    const savedDocs = documents.map(doc => {
      if (doc.data && doc.data.startsWith('data:')) {
        const savedFilename = saveBase64File(doc.data, doc.name, COMPANY_DOCS_DIR);
        return {
          name: doc.name,
          size: doc.size,
          path: `/uploads/company-docs/${savedFilename}`
        };
      }
      return doc;
    });
    
    statements.updateCompany.run(name, inn, kpp, address, bank || '', bik || '', account || '', JSON.stringify(savedDocs), req.params.id);
    updateTimestamp();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/companies/:id', (req, res) => {
  try {
    const deleteInvoices = db.prepare('DELETE FROM invoices WHERE requestId IN (SELECT id FROM requests WHERE companyId = ?)');
    const deleteRequests = db.prepare('DELETE FROM requests WHERE companyId = ?');
    
    const transaction = db.transaction(() => {
      deleteInvoices.run(req.params.id);
      deleteRequests.run(req.params.id);
      statements.deleteCompany.run(req.params.id);
    });
    
    transaction();
    updateTimestamp();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Requests
app.get('/api/requests', (req, res) => {
  try {
    const requests = statements.getAllRequests.all();
    res.json(requests.map(r => ({
      ...r,
      managers: r.managers ? JSON.parse(r.managers) : []
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/requests', (req, res) => {
  const { id, title, description, companyId, status, managers, logistId, createdAt } = req.body;
  try {
    statements.insertRequest.run(id, title, description || '', companyId, status, JSON.stringify(managers || []), logistId || null, createdAt);
    updateTimestamp();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/requests/:id', (req, res) => {
  try {
    const requestId = req.params.id;
    console.log('Обновление заявки:', requestId);
    console.log('Полученные данные:', req.body);
    
    const currentRequest = statements.getRequestById.get(requestId);
    
    if (!currentRequest) {
      console.error('Заявка не найдена:', requestId);
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    console.log('Текущая заявка:', currentRequest);

    // Парсим managers из JSON
    const currentManagers = currentRequest.managers ? JSON.parse(currentRequest.managers) : [];
    
    // Формируем данные для обновления - берем из body или оставляем текущие значения
    const updateData = {
      title: req.body.title !== undefined ? req.body.title : currentRequest.title,
      description: req.body.description !== undefined ? req.body.description : (currentRequest.description || ''),
      companyId: req.body.companyId !== undefined ? req.body.companyId : currentRequest.companyId,
      status: req.body.status !== undefined ? req.body.status : currentRequest.status,
      managers: req.body.managers !== undefined ? req.body.managers : currentManagers,
      logistId: req.body.logistId !== undefined ? req.body.logistId : currentRequest.logistId
    };

    console.log('Данные для обновления:', updateData);
    console.log('Managers JSON:', JSON.stringify(updateData.managers));

    statements.updateRequest.run(
      updateData.title, 
      updateData.description, 
      updateData.companyId, 
      updateData.status, 
      JSON.stringify(updateData.managers), 
      updateData.logistId, 
      requestId
    );
    
    console.log('Заявка успешно обновлена');
    updateTimestamp();
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления заявки:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.delete('/api/requests/:id', (req, res) => {
  try {
    const deleteComments = db.prepare('DELETE FROM comments WHERE invoiceId IN (SELECT id FROM invoices WHERE requestId = ?)');
    const deleteInvoices = db.prepare('DELETE FROM invoices WHERE requestId = ?');
    
    const transaction = db.transaction(() => {
      deleteComments.run(req.params.id);
      deleteInvoices.run(req.params.id);
      statements.deleteRequest.run(req.params.id);
    });
    
    transaction();
    updateTimestamp();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Invoices - ИСПРАВЛЕНО: теперь полноценный PUT endpoint
app.get('/api/invoices', (req, res) => {
  try {
    const invoices = statements.getAllInvoices.all();
    res.json(invoices.map(i => ({
      ...i,
      files: i.files ? JSON.parse(i.files) : [],
      receivedGoodsPhotos: i.receivedGoodsPhotos ? JSON.parse(i.receivedGoodsPhotos) : []
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/invoices', (req, res) => {
  const { id, requestId, managerId, logistId, companyId, website, supplier, number, amount, contactPerson, phone, email, logisticsComment, files, status, createdAt, sentToLogisticsAt } = req.body;
  try {
    const savedFiles = files.map(file => {
      if (file.data && file.data.startsWith('data:')) {
        const savedFilename = saveBase64File(file.data, file.name, INVOICE_FILES_DIR);
        return {
          name: file.name,
          size: file.size,
          path: `/uploads/invoice-files/${savedFilename}`
        };
      }
      return file;
    });
    
    statements.insertInvoice.run(
      id, requestId, managerId, logistId || null, companyId || null,
      website || '', supplier, number, amount, contactPerson, phone,
      email || '', logisticsComment || '', JSON.stringify(savedFiles),
      status, createdAt, sentToLogisticsAt || null, '[]'
    );
    updateTimestamp();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ИСПРАВЛЕНО: Полноценное обновление счета
app.put('/api/invoices/:id', (req, res) => {
  try {
    const invoiceId = req.params.id;
    const currentInvoice = statements.getInvoiceById.get(invoiceId);
    
    if (!currentInvoice) {
      return res.status(404).json({ error: 'Счет не найден' });
    }

    // Парсим текущие файлы
    const currentFiles = currentInvoice.files ? JSON.parse(currentInvoice.files) : [];
    const currentReceivedGoodsPhotos = currentInvoice.receivedGoodsPhotos ? JSON.parse(currentInvoice.receivedGoodsPhotos) : [];

    // Обрабатываем новые файлы если они есть
    let updatedFiles = currentFiles;
    if (req.body.files) {
      updatedFiles = req.body.files.map(file => {
        if (file.data && file.data.startsWith('data:')) {
          const savedFilename = saveBase64File(file.data, file.name, INVOICE_FILES_DIR);
          return {
            name: file.name,
            size: file.size,
            path: `/uploads/invoice-files/${savedFilename}`
          };
        }
        return file;
      });
    }

    // Обрабатываем фотографии полученных товаров
    let updatedReceivedGoodsPhotos = currentReceivedGoodsPhotos;
    if (req.body.receivedGoodsPhotos !== undefined) {
      updatedReceivedGoodsPhotos = req.body.receivedGoodsPhotos.map(photo => {
        if (photo.data && photo.data.startsWith('data:')) {
          const savedFilename = saveBase64File(photo.data, photo.name, RECEIVED_GOODS_PHOTOS_DIR);
          return {
            name: photo.name,
            size: photo.size,
            path: `/uploads/received-goods-photos/${savedFilename}`
          };
        }
        return photo;
      });
    }

    // Формируем данные для обновления - берем из body или оставляем текущие значения
    const updateData = {
      requestId: req.body.requestId !== undefined ? req.body.requestId : currentInvoice.requestId,
      managerId: req.body.managerId !== undefined ? req.body.managerId : currentInvoice.managerId,
      logistId: req.body.logistId !== undefined ? req.body.logistId : currentInvoice.logistId,
      companyId: req.body.companyId !== undefined ? req.body.companyId : currentInvoice.companyId,
      website: req.body.website !== undefined ? req.body.website : currentInvoice.website,
      supplier: req.body.supplier !== undefined ? req.body.supplier : currentInvoice.supplier,
      number: req.body.number !== undefined ? req.body.number : currentInvoice.number,
      amount: req.body.amount !== undefined ? req.body.amount : currentInvoice.amount,
      contactPerson: req.body.contactPerson !== undefined ? req.body.contactPerson : currentInvoice.contactPerson,
      phone: req.body.phone !== undefined ? req.body.phone : currentInvoice.phone,
      email: req.body.email !== undefined ? req.body.email : currentInvoice.email,
      logisticsComment: req.body.logisticsComment !== undefined ? req.body.logisticsComment : currentInvoice.logisticsComment,
      files: JSON.stringify(updatedFiles),
      receivedGoodsPhotos: JSON.stringify(updatedReceivedGoodsPhotos),
      status: req.body.status !== undefined ? req.body.status : currentInvoice.status,
      createdAt: currentInvoice.createdAt,
      sentToLogisticsAt: req.body.sentToLogisticsAt !== undefined ? req.body.sentToLogisticsAt : currentInvoice.sentToLogisticsAt
    };

    // Выполняем обновление
    const updateStmt = db.prepare(`
      UPDATE invoices
      SET requestId = ?, managerId = ?, logistId = ?, companyId = ?, website = ?,
          supplier = ?, number = ?, amount = ?, contactPerson = ?, phone = ?,
          email = ?, logisticsComment = ?, files = ?, receivedGoodsPhotos = ?, status = ?,
          createdAt = ?, sentToLogisticsAt = ?
      WHERE id = ?
    `);

    updateStmt.run(
      updateData.requestId,
      updateData.managerId,
      updateData.logistId,
      updateData.companyId,
      updateData.website,
      updateData.supplier,
      updateData.number,
      updateData.amount,
      updateData.contactPerson,
      updateData.phone,
      updateData.email,
      updateData.logisticsComment,
      updateData.files,
      updateData.receivedGoodsPhotos,
      updateData.status,
      updateData.createdAt,
      updateData.sentToLogisticsAt,
      invoiceId
    );

    updateTimestamp();
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления счета:', error);
    res.status(500).json({ error: error.message });
  }
});

// Comments
app.get('/api/comments', (req, res) => {
  try {
    const comments = statements.getAllComments.all();
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/comments', (req, res) => {
  const { id, invoiceId, userId, userName, text, createdAt } = req.body;
  try {
    statements.insertComment.run(id, invoiceId, userId, userName, text, createdAt);
    updateTimestamp();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// History
app.get('/api/history', (req, res) => {
  try {
    const history = statements.getRecentHistory.all();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/history', (req, res) => {
  const { id, date, user, action, entity, details } = req.body;
  try {
    statements.insertHistory.run(id, date, user, action, entity, details);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Авторизация
app.post('/api/login', (req, res) => {
  const { login, password } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE login = ? AND password = ?').get(login, password);
    
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📊 База данных оптимизирована`);
  console.log(`💾 Файлы сохраняются в: ${UPLOADS_DIR}`);
  console.log(`⚡ Prepared statements активны`);
  console.log(`\n👤 Тестовые аккаунты:`);
  console.log(`   admin / admin123`);
  console.log(`   manager / manager123`);
  console.log(`   logist / logist123`);
});