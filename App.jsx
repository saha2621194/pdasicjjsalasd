import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Edit2, Trash2, Eye, Upload, Download, MessageSquare, Clock, Building, Package, FileText, Users, LogOut, ChevronDown, ChevronUp, Filter, Search, TrendingUp, BarChart3, Calendar, XCircle, Camera, Image as ImageIcon, DollarSign, Receipt, Tag, Split } from 'lucide-react';

const API_URL = 'http://85.209.154.11:3001/api';

// Простая загрузка файла без компрессии
const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    // Проверка размера файла - макс 5MB
    if (file.size > 100 * 1024 * 1024) {
      reject(new Error(`Файл ${file.name} слишком большой (максимум 5MB)`));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

// API функции
const api = {
  checkUpdates: (timestamp) => fetch(`${API_URL}/check-updates?timestamp=${timestamp}`).then(r => r.json()),
  getUsers: () => fetch(`${API_URL}/users`).then(r => r.json()),
  createUser: (data) => fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  updateUser: (id, data) => fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteUser: (id) => fetch(`${API_URL}/users/${id}`, { method: 'DELETE' }).then(r => r.json()),
  
  getCompanies: () => fetch(`${API_URL}/companies`).then(r => r.json()),
  createCompany: (data) => fetch(`${API_URL}/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  updateCompany: (id, data) => fetch(`${API_URL}/companies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteCompany: (id) => fetch(`${API_URL}/companies/${id}`, { method: 'DELETE' }).then(r => r.json()),
  
  getRequests: () => fetch(`${API_URL}/requests`).then(r => r.json()),
  createRequest: (data) => fetch(`${API_URL}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  updateRequest: (id, data) => fetch(`${API_URL}/requests/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteRequest: (id) => fetch(`${API_URL}/requests/${id}`, { method: 'DELETE' }).then(r => r.json()),
  
  getInvoices: () => fetch(`${API_URL}/invoices`).then(r => r.json()),
  createInvoice: (data) => fetch(`${API_URL}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  updateInvoice: (id, data) => fetch(`${API_URL}/invoices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  getComments: () => fetch(`${API_URL}/comments`).then(r => r.json()),
  createComment: (data) => fetch(`${API_URL}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  getHistory: () => fetch(`${API_URL}/history`).then(r => r.json()),
  addHistory: (data) => fetch(`${API_URL}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  getExpenseCategories: () => fetch(`${API_URL}/expense-categories`).then(r => r.json()),
  createExpenseCategory: (data) => fetch(`${API_URL}/expense-categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteExpenseCategory: (id) => fetch(`${API_URL}/expense-categories/${id}`, { method: 'DELETE' }).then(r => r.json()),

  getExpenses: () => fetch(`${API_URL}/expenses`).then(r => r.json()),
  createExpense: (data) => fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  updateExpense: (id, data) => fetch(`${API_URL}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteExpense: (id) => fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' }).then(r => r.json()),

  login: (login, password) => fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password })
  }).then(r => r.json())
};

const addHistory = async (user, action, entity, details) => {
  await api.addHistory({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    user: user.name,
    action,
    entity,
    details
  });
};

// Компонент авторизации
const LoginForm = ({ onLogin }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const memePhrases = [
    "Не деньги идут к деньгам, а миллионы к миллионам 💰",
    "Работай пока они спят, учись пока они веселятся 🚀",
    "Единственный способ делать великую работу – любить то, что делаешь 💼",
    "Риск – это плата за возможность 📈",
    "Успех – это способность идти от неудачи к неудаче, не теряя энтузиазма ⚡",
    "Деньги не меняют людей, они их раскрывают 💸",
    "Чем больше ты работаешь, тем больше у тебя удачи 🍀",
    "Не ищи оправданий, ищи решения 🎯",
    "Твой единственный конкурент – это ты вчера 🏆",
    "Мечтай масштабно, начинай маленькое, действуй быстро 🔥"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % memePhrases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await api.login(login, password);
      if (result.success) {
        // Сохраняем пользователя в localStorage
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        onLogin(result.user);
      } else {
        setError('Неверный логин или пароль');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Анимированный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Сетка на фоне */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      {/* Контейнер */}
      <div className="relative z-10 w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        {/* Левая часть - мотивация */}
        <div className="hidden md:block text-white space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-black bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent animate-gradient">
              CRM СИСТЕМА
            </h1>
            <p className="text-2xl font-bold text-blue-200">Снабжение и Логистика</p>
          </div>

          {/* Мемная фраза с анимацией */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 border-white/20 shadow-2xl">
            <div className="text-2xl font-bold text-center leading-relaxed min-h-[100px] flex items-center justify-center">
              <span className="animate-fade-in-up" key={currentPhraseIndex}>
                {memePhrases[currentPhraseIndex]}
              </span>
            </div>
          </div>

          {/* Статистика (фейковая для красоты) */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-white/20">
              <div className="text-3xl font-black text-yellow-400">∞</div>
              <div className="text-xs text-blue-200 mt-1">Возможностей</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-white/20">
              <div className="text-3xl font-black text-green-400">24/7</div>
              <div className="text-xs text-blue-200 mt-1">Работаем</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-white/20">
              <div className="text-3xl font-black text-pink-400">🚀</div>
              <div className="text-xs text-blue-200 mt-1">К успеху</div>
            </div>
          </div>

          {/* Дополнительные эффекты */}
          <div className="flex items-center gap-3 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Система активна</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-1000"></div>
              <span>Защищено</span>
            </div>
          </div>
        </div>

        {/* Правая часть - форма входа */}
        <div className="relative">
          {/* Декоративные элементы */}
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full filter blur-2xl opacity-40 animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-pink-400 rounded-full filter blur-2xl opacity-40 animate-pulse animation-delay-2000"></div>

          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-white/50">
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg transform hover:scale-110 transition">
                <Building className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">Добро пожаловать! 👋</h2>
              <p className="text-gray-600 font-medium">Войдите чтобы начать работу</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  🔑 Логин
                </label>
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition font-medium"
                  placeholder="Введите ваш логин"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  🔐 Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition font-medium"
                  placeholder="Введите ваш пароль"
                  required
                  disabled={loading}
                />
              </div>
              
              {error && (
                <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-shake">
                  <span className="text-xl">⚠️</span>
                  <span className="font-medium">{error}</span>
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Вход в систему...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Войти 🚀
                  </span>
                )}
              </button>
            </form>
            
            <div className="mt-6 pt-6 border-t-2 border-gray-200">
              <p className="text-sm text-gray-600 text-center font-medium mb-3">Тестовые аккаунты:</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-2 text-center">
                  <div className="font-bold text-red-700">Admin</div>
                  <div className="text-red-600 text-[10px]">admin / admin123</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-2 text-center">
                  <div className="font-bold text-blue-700">Manager</div>
                  <div className="text-blue-600 text-[10px]">manager / manager123</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-2 text-center">
                  <div className="font-bold text-green-700">Logist</div>
                  <div className="text-green-600 text-[10px]">logist / logist123</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Мобильная версия фразы */}
        <div className="md:hidden bg-white/10 backdrop-blur-lg rounded-2xl p-4 border-2 border-white/20">
          <div className="text-lg font-bold text-center text-white leading-relaxed">
            <span className="animate-fade-in-up" key={currentPhraseIndex}>
              {memePhrases[currentPhraseIndex]}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
};

// Админ-панель
const AdminPanel = ({ user }) => {
  const [activeTab, setActiveTab] = useState('companies');
  const [companies, setCompanies] = useState([]);
  const [requests, setRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [statsPeriod, setStatsPeriod] = useState('week');
  const [statsStartDate, setStatsStartDate] = useState('');
  const [statsEndDate, setStatsEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [companiesData, requestsData, invoicesData, usersData] = await Promise.all([
        api.getCompanies(),
        api.getRequests(),
        api.getInvoices(),
        api.getUsers()
      ]);
      setCompanies(companiesData);
      setRequests(requestsData);
      setInvoices(invoicesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const handleSaveCompany = async (companyData) => {
    try {
      if (editingCompany) {
        await api.updateCompany(editingCompany.id, companyData);
        addHistory(user, 'Изменение компании', 'company', companyData.name);
      } else {
        await api.createCompany({ ...companyData, id: Date.now().toString() });
        addHistory(user, 'Добавление компании', 'company', companyData.name);
      }
      setShowCompanyModal(false);
      setEditingCompany(null);
      await loadData();
    } catch (error) {
      alert('Ошибка сохранения компании');
    }
  };

  const handleDeleteCompany = async (id) => {
    if (confirm('Удалить компанию? Все связанные заявки и счета также будут удалены.')) {
      try {
        const company = companies.find(c => c.id === id);
        await api.deleteCompany(id);
        addHistory(user, 'Удаление компании', 'company', company.name);
        await loadData();
      } catch (error) {
        alert('Ошибка удаления компании: ' + error.message);
      }
    }
  };

  const handleSaveRequest = async (requestData) => {
    try {
      if (editingRequest) {
        // ИСПРАВЛЕНО: Передаем ВСЕ поля заявки, включая status и logistId
        await api.updateRequest(editingRequest.id, {
          title: requestData.title,
          description: requestData.description,
          companyId: requestData.companyId,
          status: editingRequest.status, // Сохраняем текущий статус
          managers: editingRequest.managers, // Сохраняем текущих менеджеров
          logistId: editingRequest.logistId // Сохраняем текущего логиста
        });
        addHistory(user, 'Изменение заявки', 'request', requestData.title);
      } else {
        await api.createRequest({
          ...requestData,
          id: Date.now().toString(),
          status: 'active',
          managers: [],
          logistId: null,
          createdAt: new Date().toISOString()
        });
        addHistory(user, 'Создание заявки', 'request', requestData.title);
      }
      setShowRequestModal(false);
      setEditingRequest(null);
      await loadData();
    } catch (error) {
      alert('Ошибка сохранения заявки');
    }
  };

  const handleToggleRequestStatus = async (id) => {
    try {
      const request = requests.find(r => r.id === id);
      const newStatus = request.status === 'active' ? 'closed' : 'active';
      
      // ИСПРАВЛЕНО: Передаем только изменяемое поле
      await api.updateRequest(id, {
        status: newStatus
      });
      
      addHistory(user, newStatus === 'closed' ? 'Закрытие заявки' : 'Открытие заявки', 'request', request.title);
      await loadData();
    } catch (error) {
      alert('Ошибка изменения статуса заявки');
    }
  };

  const handleDeleteRequest = async (id) => {
    if (confirm('Удалить заявку? Все связанные счета также будут удалены.')) {
      try {
        const request = requests.find(r => r.id === id);
        await api.deleteRequest(id);
        addHistory(user, 'Удаление заявки', 'request', request.title);
        await loadData();
      } catch (error) {
        alert('Ошибка удаления заявки: ' + error.message);
      }
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, userData);
        addHistory(user, 'Изменение пользователя', 'user', userData.name);
      } else {
        await api.createUser({ ...userData, id: Date.now().toString() });
        addHistory(user, 'Добавление пользователя', 'user', userData.name);
      }
      setShowUserModal(false);
      setEditingUser(null);
      await loadData();
    } catch (error) {
      alert('Ошибка сохранения пользователя');
    }
  };

  const handleDeleteUser = async (id) => {
    if (users.length <= 1) {
      alert('Нельзя удалить последнего пользователя');
      return;
    }
    if (confirm('Удалить пользователя?')) {
      try {
        const deletedUser = users.find(u => u.id === id);
        await api.deleteUser(id);
        addHistory(user, 'Удаление пользователя', 'user', deletedUser.name);
        await loadData();
      } catch (error) {
        alert('Ошибка удаления пользователя');
      }
    }
  };

  const getRequestStats = (requestId) => {
    const allRequestInvoices = invoices.filter(inv => inv.requestId === requestId && inv.status !== 'deleted');
    const requestInvoices = allRequestInvoices.filter(inv => inv.status !== 'rejected');
    return {
      total: allRequestInvoices.length, // Всего счетов включая все статусы кроме deleted
      pendingApproval: requestInvoices.filter(inv => inv.status === 'pending_approval').length,
      approved: requestInvoices.filter(inv => ['approved', 'in_logistics'].includes(inv.status)).length,
      inLogistics: requestInvoices.filter(inv => ['in_logistics', 'documents_signed', 'in_transit', 'received', 'closed'].includes(inv.status)).length
    };
  };

  const getDateRange = () => {
    const end = statsEndDate ? new Date(statsEndDate) : new Date();
    let start;
    
    if (statsStartDate) {
      start = new Date(statsStartDate);
    } else {
      start = new Date(end);
      if (statsPeriod === 'day') {
        start.setDate(start.getDate() - 1);
      } else if (statsPeriod === 'week') {
        start.setDate(start.getDate() - 7);
      } else {
        start.setMonth(start.getMonth() - 1);
      }
    }
    
    return { start, end };
  };

  const getStatsByDateAndManager = () => {
    const { start, end } = getDateRange();
    const stats = {};
    
    users.filter(u => u.role === 'manager').forEach(manager => {
      // Учитываем ВСЕ счета кроме deleted (включая rejected/срезы)
      const managerInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.createdAt);
        return inv.managerId === manager.id && 
               inv.status !== 'deleted' && 
               invDate >= start && 
               invDate <= end;
      });
      
      const groupedByDate = {};
      managerInvoices.forEach(inv => {
        const date = new Date(inv.createdAt).toLocaleDateString('ru-RU');
        if (!groupedByDate[date]) {
          groupedByDate[date] = { 
            total: 0,
            new: 0,
            pendingApproval: 0,
            approved: 0, 
            rejected: 0,
            inLogistics: 0,
            amount: 0 
          };
        }
        groupedByDate[date].total++;
        
        if (inv.status === 'new') {
          groupedByDate[date].new++;
        }
        
        if (inv.status === 'pending_approval') {
          groupedByDate[date].pendingApproval++;
        }
        
        if (inv.status === 'approved' || ['in_logistics', 'documents_signed', 'in_transit', 'received', 'closed'].includes(inv.status)) {
          groupedByDate[date].approved++;
        }
        
        if (['in_logistics', 'documents_signed', 'in_transit', 'received', 'closed'].includes(inv.status)) {
          groupedByDate[date].inLogistics++;
        }
        
        if (inv.status === 'rejected') {
          groupedByDate[date].rejected++;
        }
        
        groupedByDate[date].amount += parseFloat(inv.amount) || 0;
      });
      
      stats[manager.id] = {
        name: manager.name,
        byDate: groupedByDate,
        total: managerInvoices.length,
        new: managerInvoices.filter(inv => inv.status === 'new').length,
        pendingApproval: managerInvoices.filter(inv => inv.status === 'pending_approval').length,
        approved: managerInvoices.filter(inv => 
          inv.status === 'approved' || 
          ['in_logistics', 'documents_signed', 'in_transit', 'received', 'closed'].includes(inv.status)
        ).length,
        inLogistics: managerInvoices.filter(inv => 
          ['in_logistics', 'documents_signed', 'in_transit', 'received', 'closed'].includes(inv.status)
        ).length,
        rejected: managerInvoices.filter(inv => inv.status === 'rejected').length,
        totalAmount: managerInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0)
      };
    });
    
    return stats;
  };

  // ИСПРАВЛЕНО: База поставщиков теперь ВКЛЮЧАЕТ срезы (убран фильтр rejected)
  const getUniqueSuppliers = () => {
    const supplierMap = new Map();
    
    invoices
      .filter(inv => inv.website && inv.status !== 'deleted')
      .forEach(invoice => {
        const domain = invoice.website.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        
        // Пропускаем согласованные счета (кроме pending_approval - это еще не согласовано)
        const isApproved = ['approved', 'in_logistics', 'documents_signed', 'in_transit', 'received', 'closed'].includes(invoice.status);
        if (isApproved) return;
        
        if (!supplierMap.has(domain)) {
          supplierMap.set(domain, {
            website: invoice.website,
            domain: domain,
            suppliers: [],
            requests: new Set(),
            contacts: [],
            hasRejected: false
          });
        }
        
        const supplier = supplierMap.get(domain);
        
        // Отмечаем если есть срезы
        if (invoice.status === 'rejected') {
          supplier.hasRejected = true;
        }
        
        if (!supplier.suppliers.includes(invoice.supplier)) {
          supplier.suppliers.push(invoice.supplier);
        }
        
        const request = requests.find(r => r.id === invoice.requestId);
        if (request) {
          supplier.requests.add(request.title);
        }
        
        const contactInfo = {
          person: invoice.contactPerson,
          phone: invoice.phone,
          date: invoice.createdAt,
          status: invoice.status
        };
        
        const existingContact = supplier.contacts.find(c => c.person === contactInfo.person && c.phone === contactInfo.phone);
        if (!existingContact) {
          supplier.contacts.push(contactInfo);
        }
      });
    
    return Array.from(supplierMap.values()).map(s => ({
      ...s,
      requests: Array.from(s.requests)
    })).sort((a, b) => new Date(b.contacts[0]?.date) - new Date(a.contacts[0]?.date));
  };

  const statsData = getStatsByDateAndManager();
  const uniqueSuppliers = getUniqueSuppliers();

  const filteredCompanies = companies.filter(c => 
    !searchTerm || 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.inn.includes(searchTerm) ||
    c.kpp.includes(searchTerm)
  );

  const filteredRequests = requests.filter(r => 
    !searchTerm || 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    !searchTerm || 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 relative">
      {/* Декоративный фон */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute top-20 -right-20 w-96 h-96 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 -left-20 w-96 h-96 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full filter blur-3xl"></div>
      </div>

      {/* Навигация с градиентом */}
      <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="flex gap-2 p-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('companies'); setSearchTerm(''); }}
            className={`px-6 py-3 font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'companies' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Building className="w-5 h-5" />
            Компании
          </button>
          <button
            onClick={() => { setActiveTab('requests'); setSearchTerm(''); }}
            className={`px-6 py-3 font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'requests' 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg transform scale-105' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Package className="w-5 h-5" />
            Заявки
          </button>
          <button
            onClick={() => { setActiveTab('statistics'); setSearchTerm(''); }}
            className={`px-6 py-3 font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'statistics' 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Статистика
          </button>
          <button
            onClick={() => { setActiveTab('suppliers'); setSearchTerm(''); }}
            className={`px-6 py-3 font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'suppliers'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            База поставщиков
          </button>
          <button
            onClick={() => { setActiveTab('logistics'); setSearchTerm(''); }}
            className={`px-6 py-3 font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'logistics'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Package className="w-5 h-5" />
            Логистика
          </button>
          <button
            onClick={() => { setActiveTab('users'); setSearchTerm(''); }}
            className={`px-6 py-3 font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Users className="w-5 h-5" />
            Пользователи
          </button>
        </div>
      </div>

      {activeTab === 'companies' && (
        <div>
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="🔍 Поиск компаний..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setEditingCompany(null);
                setShowCompanyModal(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-2xl transition transform hover:scale-105 flex items-center gap-2 font-bold"
            >
              <Plus className="w-5 h-5" />
              Добавить компанию
            </button>
          </div>

          {filteredCompanies.length === 0 && searchTerm ? (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-bold text-gray-600">Компании не найдены</p>
              <p className="text-gray-500 mt-2">Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map(company => (
                <div 
                  key={company.id} 
                  className="group bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 rounded-2xl p-6 hover:shadow-2xl hover:border-purple-400 transition-all transform hover:-translate-y-2"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                        <Building className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-gray-800 group-hover:text-purple-600 transition">{company.name}</h3>
                        <p className="text-xs text-gray-500 font-medium">Компания</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCompany(company);
                          setShowCompanyModal(true);
                        }}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2 bg-white bg-opacity-50 rounded-lg p-2">
                      <span className="font-bold text-purple-600">ИНН:</span>
                      <span className="font-medium">{company.inn}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white bg-opacity-50 rounded-lg p-2">
                      <span className="font-bold text-purple-600">КПП:</span>
                      <span className="font-medium">{company.kpp}</span>
                    </div>
                    <div className="bg-white bg-opacity-50 rounded-lg p-2">
                      <span className="font-bold text-purple-600">Адрес:</span>
                      <p className="font-medium text-xs mt-1">{company.address}</p>
                    </div>
                    {company.documents && company.documents.length > 0 && (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-2 mt-3">
                        <FileText className="w-4 h-4" />
                        <span className="font-bold">Документов: {company.documents.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showCompanyModal && (
            <CompanyModal
              company={editingCompany}
              onSave={handleSaveCompany}
              onClose={() => {
                setShowCompanyModal(false);
                setEditingCompany(null);
              }}
            />
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div>
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="🔍 Поиск заявок..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setEditingRequest(null);
                setShowRequestModal(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:shadow-2xl transition transform hover:scale-105 flex items-center gap-2 font-bold"
            >
              <Plus className="w-5 h-5" />
              Создать заявку
            </button>
          </div>

          {filteredRequests.length === 0 && searchTerm ? (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-bold text-gray-600">Заявки не найдены</p>
              <p className="text-gray-500 mt-2">Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredRequests.map(request => {
                const company = companies.find(c => c.id === request.companyId);
                const requestManagers = (request.managers || []).map(mId => users.find(u => u.id === mId)).filter(Boolean);
                const stats = getRequestStats(request.id);
                
                return (
                  <div 
                    key={request.id} 
                    className={`group bg-gradient-to-br ${request.status === 'closed' ? 'from-gray-50 to-gray-100 border-gray-300' : 'from-white to-blue-50 border-blue-300'} border-2 rounded-2xl p-6 hover:shadow-2xl transition-all transform hover:-translate-y-1`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <div className={`p-3 rounded-xl shadow-lg ${request.status === 'active' ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-black text-2xl text-gray-800 group-hover:text-blue-600 transition">{request.title}</h3>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-black mt-1 ${request.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                              {request.status === 'active' ? '✅ Активна' : '🔒 Закрыта'}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3 font-medium">{request.description}</p>
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <div className="flex items-center gap-2 bg-white bg-opacity-70 rounded-lg px-3 py-2">
                            <Building className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-gray-700">{company?.name || 'Не указана'}</span>
                          </div>
                          {requestManagers.length > 0 && (
                            <div className="flex items-center gap-2 bg-white bg-opacity-70 rounded-lg px-3 py-2">
                              <Users className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-gray-700">{requestManagers.map(m => m.name).join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleToggleRequestStatus(request.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition transform hover:scale-105 ${request.status === 'active' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        >
                          {request.status === 'active' ? '🔒 Закрыть' : '✅ Открыть'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingRequest(request);
                            setShowRequestModal(true);
                          }}
                          className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t-2 border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border-2 border-blue-200">
                        <div className="text-3xl font-black text-blue-600">{stats.total}</div>
                        <div className="text-xs text-blue-700 mt-1 font-bold">Всего счетов</div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center border-2 border-yellow-200">
                        <div className="text-3xl font-black text-yellow-600">{stats.pendingApproval}</div>
                        <div className="text-xs text-yellow-700 mt-1 font-bold">На согласовании</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border-2 border-green-200">
                        <div className="text-3xl font-black text-green-600">{stats.approved}</div>
                        <div className="text-xs text-green-700 mt-1 font-bold">Согласовано</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border-2 border-purple-200">
                        <div className="text-3xl font-black text-purple-600">{stats.inLogistics}</div>
                        <div className="text-xs text-purple-700 mt-1 font-bold">В логистике</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showRequestModal && (
            <RequestModal
              request={editingRequest}
              companies={companies}
              onSave={handleSaveRequest}
              onClose={() => {
                setShowRequestModal(false);
                setEditingRequest(null);
              }}
            />
          )}
        </div>
      )}

      {activeTab === 'statistics' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Статистика по менеджерам</h2>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex gap-4 flex-wrap items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Период</label>
                <select
                  value={statsPeriod}
                  onChange={(e) => setStatsPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="day">День</option>
                  <option value="week">Неделя</option>
                  <option value="month">Месяц</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">От</label>
                <input
                  type="date"
                  value={statsStartDate}
                  onChange={(e) => setStatsStartDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">До</label>
                <input
                  type="date"
                  value={statsEndDate}
                  onChange={(e) => setStatsEndDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  setStatsStartDate('');
                  setStatsEndDate('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Сбросить
              </button>
            </div>
          </div>

          {(() => {
            const managersStats = Object.values(statsData);
            const totalStats = {
              total: managersStats.reduce((sum, m) => sum + m.total, 0),
              new: managersStats.reduce((sum, m) => sum + m.new, 0),
              pendingApproval: managersStats.reduce((sum, m) => sum + m.pendingApproval, 0),
              approved: managersStats.reduce((sum, m) => sum + m.approved, 0),
              inLogistics: managersStats.reduce((sum, m) => sum + m.inLogistics, 0),
              rejected: managersStats.reduce((sum, m) => sum + m.rejected, 0),
              totalAmount: managersStats.reduce((sum, m) => sum + m.totalAmount, 0)
            };

            return (
              <>
                {/* Общая сводка */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Общая сводка</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4">
                      <div className="text-3xl font-bold text-blue-700">{totalStats.total}</div>
                      <div className="text-xs text-blue-600 mt-1 font-medium">Всего счетов</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-4">
                      <div className="text-3xl font-bold text-gray-700">{totalStats.new}</div>
                      <div className="text-xs text-gray-600 mt-1 font-medium">Новые</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-4">
                      <div className="text-3xl font-bold text-yellow-700">{totalStats.pendingApproval}</div>
                      <div className="text-xs text-yellow-600 mt-1 font-medium">На согласовании</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-4">
                      <div className="text-3xl font-bold text-green-700">{totalStats.approved}</div>
                      <div className="text-xs text-green-600 mt-1 font-medium">Согласовано</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4">
                      <div className="text-3xl font-bold text-purple-700">{totalStats.inLogistics}</div>
                      <div className="text-xs text-purple-600 mt-1 font-medium">В логистике</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-lg p-4">
                      <div className="text-3xl font-bold text-red-700">{totalStats.rejected}</div>
                      <div className="text-xs text-red-600 mt-1 font-medium">Срезов</div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-300 rounded-lg p-4">
                      <div className="text-2xl font-bold text-indigo-700">{totalStats.totalAmount.toLocaleString('ru-RU')}</div>
                      <div className="text-xs text-indigo-600 mt-1 font-medium">Рублей</div>
                    </div>
                  </div>
                </div>

                {/* Таблица по менеджерам */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-bold">Менеджер</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">Всего</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">Новые</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">На согласовании</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">Согласовано</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">В логистике</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">Срезов</th>
                          <th className="px-4 py-3 text-right text-sm font-bold">Сумма (₽)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {managersStats.map((manager, idx) => (
                          <tr key={manager.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{manager.name}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                                {manager.total}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 font-bold text-sm">
                                {manager.new}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm">
                                {manager.pendingApproval}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                                {manager.approved}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                                {manager.inLogistics}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold text-sm">
                                {manager.rejected}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                              {manager.totalAmount.toLocaleString('ru-RU')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200 border-t-2 border-gray-300">
                        <tr>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">ИТОГО:</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-200 text-blue-900 font-bold text-sm">
                              {totalStats.total}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-900 font-bold text-sm">
                              {totalStats.new}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-200 text-yellow-900 font-bold text-sm">
                              {totalStats.pendingApproval}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-200 text-green-900 font-bold text-sm">
                              {totalStats.approved}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-200 text-purple-900 font-bold text-sm">
                              {totalStats.inLogistics}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-200 text-red-900 font-bold text-sm">
                              {totalStats.rejected}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                            {totalStats.totalAmount.toLocaleString('ru-RU')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Детализация по дням */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">📅 Детализация по дням</h3>
                  <div className="space-y-4">
                    {managersStats.map(manager => (
                      <div key={manager.name} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3">
                          <h4 className="font-bold text-white text-lg">{manager.name}</h4>
                        </div>

                        {Object.keys(manager.byDate).length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Дата</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">Всего</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">Новые</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">На согласовании</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">Согласовано</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">В логистике</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">Срезов</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">Сумма (₽)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {Object.entries(manager.byDate)
                                  .sort((a, b) => {
                                    const dateA = a[0].split('.').reverse().join('-');
                                    const dateB = b[0].split('.').reverse().join('-');
                                    return new Date(dateB) - new Date(dateA);
                                  })
                                  .map(([date, stats]) => (
                                    <tr key={date} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 text-sm font-medium text-gray-700">{date}</td>
                                      <td className="px-4 py-2 text-center text-sm font-bold text-blue-600">{stats.total}</td>
                                      <td className="px-4 py-2 text-center text-sm text-gray-600">{stats.new}</td>
                                      <td className="px-4 py-2 text-center text-sm text-yellow-600 font-medium">{stats.pendingApproval}</td>
                                      <td className="px-4 py-2 text-center text-sm text-green-600 font-medium">{stats.approved}</td>
                                      <td className="px-4 py-2 text-center text-sm text-purple-600 font-medium">{stats.inLogistics}</td>
                                      <td className="px-4 py-2 text-center text-sm text-red-600 font-medium">{stats.rejected}</td>
                                      <td className="px-4 py-2 text-right text-sm font-bold text-gray-700">
                                        {stats.amount.toLocaleString('ru-RU')}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-6 text-center text-gray-500 text-sm italic">
                            Нет данных за выбранный период
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">База поставщиков</h2>
          <p className="text-sm text-gray-600 mb-6">Уникальные сайты поставщиков (несогласованные и срезы)</p>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Сайт</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Поставщики</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Заявки</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Контакты</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {uniqueSuppliers.map((supplier, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <a 
                          href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {supplier.domain}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="max-w-xs">
                          {supplier.suppliers.map((s, i) => (
                            <span key={i} className="inline-block bg-gray-100 px-2 py-1 rounded text-xs mr-1 mb-1">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="max-w-xs">
                          {supplier.requests.map((r, i) => (
                            <span key={i} className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs mr-1 mb-1">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="space-y-1">
                          {supplier.contacts.slice(0, 2).map((contact, i) => (
                            <div key={i} className="text-xs text-gray-600">
                              <div>{contact.person}</div>
                              <div className="text-gray-500">{contact.phone}</div>
                            </div>
                          ))}
                          {supplier.contacts.length > 2 && (
                            <div className="text-xs text-gray-500">+{supplier.contacts.length - 2} еще</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {supplier.hasRejected && (
                          <span className="inline-block bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                            Есть срезы
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {uniqueSuppliers.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                База поставщиков пуста. Поставщики появятся после добавления счетов с указанными сайтами.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logistics' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🚚 Логистика</h2>

          {/* Поиск */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="🔍 Поиск по счетам (поставщик, номер, контакт, менеджер, заявка)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {(() => {
            const logists = users.filter(u => u.role === 'logist');
            const logistsStats = logists.map(logist => {
              const logistInvoices = invoices.filter(inv => inv.logistId === logist.id);

              return {
                name: logist.name,
                id: logist.id,
                total: logistInvoices.length,
                inLogistics: logistInvoices.filter(inv => inv.status === 'in_logistics').length,
                documentsSigned: logistInvoices.filter(inv => inv.status === 'documents_signed').length,
                inTransit: logistInvoices.filter(inv => inv.status === 'in_transit').length,
                received: logistInvoices.filter(inv => inv.status === 'received').length,
                sold: logistInvoices.filter(inv => inv.status === 'sold').length,
                closed: logistInvoices.filter(inv => inv.status === 'closed').length,
                totalAmount: logistInvoices.reduce((sum, inv) => {
                  const amount = parseFloat(inv.amount.replace(/[^\d.-]/g, '')) || 0;
                  return sum + amount;
                }, 0),
                invoices: logistInvoices
              };
            });

            const totalLogistsStats = {
              total: logistsStats.reduce((sum, l) => sum + l.total, 0),
              inLogistics: logistsStats.reduce((sum, l) => sum + l.inLogistics, 0),
              documentsSigned: logistsStats.reduce((sum, l) => sum + l.documentsSigned, 0),
              inTransit: logistsStats.reduce((sum, l) => sum + l.inTransit, 0),
              received: logistsStats.reduce((sum, l) => sum + l.received, 0),
              sold: logistsStats.reduce((sum, l) => sum + l.sold, 0),
              closed: logistsStats.reduce((sum, l) => sum + l.closed, 0),
              totalAmount: logistsStats.reduce((sum, l) => sum + l.totalAmount, 0)
            };

            // Фильтрация всех счетов логистов по поиску
            const allLogisticsInvoices = invoices.filter(inv =>
              inv.logistId && ['in_logistics', 'documents_signed', 'in_transit', 'received', 'sold', 'closed'].includes(inv.status)
            );

            const filteredInvoices = allLogisticsInvoices.filter(inv => {
              if (!searchTerm) return true;
              const search = searchTerm.toLowerCase();
              const request = requests.find(r => r.id === inv.requestId);
              const manager = users.find(u => u.id === inv.managerId);
              const logist = users.find(u => u.id === inv.logistId);

              return inv.supplier.toLowerCase().includes(search) ||
                     inv.number.toLowerCase().includes(search) ||
                     inv.contactPerson.toLowerCase().includes(search) ||
                     inv.phone.toLowerCase().includes(search) ||
                     (inv.email && inv.email.toLowerCase().includes(search)) ||
                     (manager && manager.name.toLowerCase().includes(search)) ||
                     (logist && logist.name.toLowerCase().includes(search)) ||
                     (request && request.title.toLowerCase().includes(search));
            });

            return (
              <>
                {/* Общая сводка по логистам */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Общая статистика</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4">
                      <div className="text-3xl font-bold text-blue-700">{totalLogistsStats.total}</div>
                      <div className="text-xs text-blue-600 mt-1 font-medium">Всего счетов</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4">
                      <div className="text-3xl font-bold text-purple-700">{totalLogistsStats.inLogistics}</div>
                      <div className="text-xs text-purple-600 mt-1 font-medium">В логистике</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-4">
                      <div className="text-3xl font-bold text-yellow-700">{totalLogistsStats.documentsSigned}</div>
                      <div className="text-xs text-yellow-600 mt-1 font-medium">Док. подписаны</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4">
                      <div className="text-3xl font-bold text-blue-700">{totalLogistsStats.inTransit}</div>
                      <div className="text-xs text-blue-600 mt-1 font-medium">Товар в пути</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-4">
                      <div className="text-3xl font-bold text-green-700">{totalLogistsStats.received}</div>
                      <div className="text-xs text-green-600 mt-1 font-medium">Получено</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-lg p-4">
                      <div className="text-3xl font-bold text-orange-700">{totalLogistsStats.sold}</div>
                      <div className="text-xs text-orange-600 mt-1 font-medium">💰 Продано</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-4">
                      <div className="text-3xl font-bold text-gray-700">{totalLogistsStats.closed}</div>
                      <div className="text-xs text-gray-600 mt-1 font-medium">Закрыто</div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-300 rounded-lg p-4">
                      <div className="text-2xl font-bold text-indigo-700">{totalLogistsStats.totalAmount.toLocaleString('ru-RU')}</div>
                      <div className="text-xs text-indigo-600 mt-1 font-medium">Рублей</div>
                    </div>
                  </div>
                </div>

                {/* Таблица по логистам */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                  <h3 className="text-lg font-bold text-gray-800 p-4 bg-gray-50 border-b border-gray-200">Статистика по логистам</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-bold">Логист</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">Всего</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">В логистике</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">Док. подписаны</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">Товар в пути</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">Получено</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">💰 Продано</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">Закрыто</th>
                          <th className="px-4 py-3 text-right text-sm font-bold">Сумма (₽)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {logistsStats.map((logist, idx) => (
                          <tr key={logist.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{logist.name}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                                {logist.total}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                                {logist.inLogistics}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm">
                                {logist.documentsSigned}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                                {logist.inTransit}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                                {logist.received}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-700 font-bold text-sm">
                                {logist.sold}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 font-bold text-sm">
                                {logist.closed}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                              {logist.totalAmount.toLocaleString('ru-RU')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200 border-t-2 border-gray-300">
                        <tr>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">ИТОГО:</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-200 text-blue-900 font-bold text-sm">
                              {totalLogistsStats.total}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-200 text-purple-900 font-bold text-sm">
                              {totalLogistsStats.inLogistics}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-200 text-yellow-900 font-bold text-sm">
                              {totalLogistsStats.documentsSigned}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-200 text-blue-900 font-bold text-sm">
                              {totalLogistsStats.inTransit}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-200 text-green-900 font-bold text-sm">
                              {totalLogistsStats.received}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-900 font-bold text-sm">
                              {totalLogistsStats.closed}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                            {totalLogistsStats.totalAmount.toLocaleString('ru-RU')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Список счетов */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Счета ({searchTerm ? `найдено ${filteredInvoices.length}` : `всего ${allLogisticsInvoices.length}`})
                  </h3>

                  {filteredInvoices.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
                      {searchTerm ? 'Нет счетов, соответствующих запросу' : 'Нет счетов в логистике'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredInvoices.map(inv => {
                        const request = requests.find(r => r.id === inv.requestId);
                        const manager = users.find(u => u.id === inv.managerId);
                        const logist = users.find(u => u.id === inv.logistId);

                        return (
                          <div key={inv.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-bold text-gray-900">{inv.supplier}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    inv.status === 'in_logistics' ? 'bg-purple-100 text-purple-700' :
                                    inv.status === 'documents_signed' ? 'bg-yellow-100 text-yellow-700' :
                                    inv.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                                    inv.status === 'received' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-200 text-gray-700'
                                  }`}>
                                    {inv.status === 'in_logistics' ? 'В логистике' :
                                     inv.status === 'documents_signed' ? 'Док. подписаны' :
                                     inv.status === 'in_transit' ? 'Товар в пути' :
                                     inv.status === 'received' ? 'Получено' :
                                     'Закрыто'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm text-gray-600">
                                  <p><span className="font-medium">Номер:</span> {inv.number}</p>
                                  <p><span className="font-medium">Сумма:</span> {inv.amount} ₽</p>
                                  <p><span className="font-medium">Логист:</span> {logist?.name || 'Не назначен'}</p>
                                  <p><span className="font-medium">Менеджер:</span> {manager?.name || 'Удалён'}</p>
                                  <p><span className="font-medium">Заявка:</span> {request?.title || 'Удалена'}</p>
                                  <p><span className="font-medium">Контакт:</span> {inv.contactPerson}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="🔍 Поиск пользователей..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setEditingUser(null);
                setShowUserModal(true);
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-2xl transition transform hover:scale-105 flex items-center gap-2 font-bold"
            >
              <Plus className="w-5 h-5" />
              Добавить пользователя
            </button>
          </div>

          {filteredUsers.length === 0 && searchTerm ? (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-bold text-gray-600">Пользователи не найдены</p>
              <p className="text-gray-500 mt-2">Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map(u => (
                <div key={u.id} className="group bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 hover:shadow-2xl hover:border-indigo-400 transition-all transform hover:-translate-y-2">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl shadow-lg ${
                        u.role === 'admin' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                        u.role === 'manager' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                        'bg-gradient-to-br from-green-500 to-emerald-500'
                      }`}>
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-gray-800 group-hover:text-indigo-600 transition">{u.name}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-black mt-1 ${
                          u.role === 'admin' ? 'bg-red-100 text-red-700' :
                          u.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {u.role === 'admin' ? '👑 Администратор' : u.role === 'manager' ? '💼 Менеджер' : '🚚 Логист'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setShowUserModal(true);
                        }}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2 bg-white bg-opacity-50 rounded-lg p-2">
                      <span className="font-bold text-indigo-600">Email:</span>
                      <span className="font-medium truncate">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white bg-opacity-50 rounded-lg p-2">
                      <span className="font-bold text-indigo-600">Логин:</span>
                      <span className="font-medium">{u.login}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showUserModal && (
            <UserModal
              user={editingUser}
              onSave={handleSaveUser}
              onClose={() => {
                setShowUserModal(false);
                setEditingUser(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Панель менеджера
const ManagerPanel = ({ user }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [requests, setRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [users, setUsers] = useState([]);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('requests'); // requests, my-invoices
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const selectedRequestRef = useRef(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedRequest && selectedRequestRef.current) {
      setTimeout(() => {
        selectedRequestRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedRequest]);

  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem('selectedCompany', selectedCompany);
    }
  }, [selectedCompany]);

  const loadData = async () => {
    try {
      const [companiesData, requestsData, invoicesData, usersData] = await Promise.all([
        api.getCompanies(),
        api.getRequests(),
        api.getInvoices(),
        api.getUsers()
      ]);
      
      setCompanies(companiesData);
      setRequests(requestsData);
      setInvoices(invoicesData);
      setUsers(usersData);
      
      if (companiesData.length > 0) {
        const savedCompany = localStorage.getItem('selectedCompany');
        if (savedCompany && companiesData.find(c => c.id === savedCompany)) {
          setSelectedCompany(savedCompany);
        } else if (!selectedCompany) {
          setSelectedCompany(companiesData[0].id);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const handleTakeRequest = async (requestId) => {
    try {
      const request = requests.find(r => r.id === requestId);
      const managers = request.managers || [];
      
      if (!managers.includes(user.id)) {
        // ИСПРАВЛЕНО: Передаем только изменяемое поле
        await api.updateRequest(requestId, {
          managers: [...managers, user.id]
        });
        await addHistory(user, 'Закрепление за заявкой', 'request', request.title);
        await loadData();
      }
    } catch (error) {
      alert('Ошибка закрепления за заявкой');
    }
  };

  const handleLeaveRequest = async (requestId) => {
    try {
      const request = requests.find(r => r.id === requestId);
      const managers = request.managers || [];
      
      // ИСПРАВЛЕНО: Передаем только изменяемое поле
      await api.updateRequest(requestId, {
        managers: managers.filter(m => m !== user.id)
      });
      await addHistory(user, 'Выход из заявки', 'request', request.title);
      setSelectedRequest(null);
      await loadData();
    } catch (error) {
      alert('Ошибка выхода из заявки');
    }
  };

  // ДОБАВЛЕНО: Обработчик добавления счета
  const handleAddInvoice = async (invoiceData) => {
    try {
      setShowInvoiceModal(false);
      setEditingInvoice(null);
      await api.createInvoice({
        ...invoiceData,
        id: Date.now().toString(),
        requestId: selectedRequest.id,
        managerId: user.id,
        logistId: null,
        companyId: selectedCompany,
        status: 'new',
        createdAt: new Date().toISOString(),
        sentToLogisticsAt: null
      });
      await addHistory(user, 'Добавление счёта', 'invoice', `${invoiceData.supplier} - ${invoiceData.amount}₽`);
      await loadData();
    } catch (error) {
      alert('Ошибка добавления счёта');
    }
  };

  // ДОБАВЛЕНО: Обработчик редактирования счета
  const handleEditInvoice = async (invoiceData) => {
    try {
      setShowInvoiceModal(false);
      await api.updateInvoice(editingInvoice.id, invoiceData);
      await addHistory(user, 'Редактирование счёта', 'invoice', `${invoiceData.supplier} - ${invoiceData.amount}₽`);
      setEditingInvoice(null);
      await loadData();
    } catch (error) {
      alert('Ошибка редактирования счёта');
    }
  };

  const handlePendingApprovalInvoice = async (invoiceId) => {
    try {
      await api.updateInvoice(invoiceId, { status: 'pending_approval' });
      const invoice = invoices.find(inv => inv.id === invoiceId);
      await addHistory(user, 'Счёт на согласовании', 'invoice', invoice.supplier);
      await loadData();
    } catch (error) {
      alert('Ошибка изменения статуса счёта');
    }
  };

  const handleRejectInvoice = async (invoiceId) => {
    if (confirm('Выполнить срез? Счёт останется в заявке, но будет помечен как отклонённый.')) {
      try {
        await api.updateInvoice(invoiceId, { status: 'rejected' });
        const invoice = invoices.find(inv => inv.id === invoiceId);
        await addHistory(user, 'Срез счёта', 'invoice', invoice.supplier);
        await loadData();
      } catch (error) {
        alert('Ошибка выполнения среза');
      }
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (confirm('Удалить счёт? Это действие нельзя отменить.')) {
      try {
        await api.updateInvoice(invoiceId, { status: 'deleted' });
        const invoice = invoices.find(inv => inv.id === invoiceId);
        await addHistory(user, 'Удаление счёта', 'invoice', invoice.supplier);
        await loadData();
      } catch (error) {
        alert('Ошибка удаления счёта');
      }
    }
  };

  const handleApproveInvoice = async (invoiceId) => {
    try {
      await api.updateInvoice(invoiceId, { status: 'approved' });
      const invoice = invoices.find(inv => inv.id === invoiceId);
      await addHistory(user, 'Согласование счёта на поступление', 'invoice', invoice.supplier);
      await loadData();
    } catch (error) {
      alert('Ошибка согласования счёта');
    }
  };

  const handleSendToLogistics = async (invoiceId) => {
    try {
      await api.updateInvoice(invoiceId, { 
        status: 'in_logistics',
        sentToLogisticsAt: new Date().toISOString()
      });
      const invoice = invoices.find(inv => inv.id === invoiceId);
      await addHistory(user, 'Передача счёта в логистику', 'invoice', invoice.supplier);
      await loadData();
    } catch (error) {
      alert('Ошибка передачи в логистику');
    }
  };

  const availableRequests = requests.filter(r => 
    r.companyId === selectedCompany && r.status === 'active'
  );

  const myRequests = availableRequests.filter(r => 
    (r.managers || []).includes(user.id)
  );

  const getRequestInvoices = (requestId) => {
    return invoices.filter(inv => inv.requestId === requestId && inv.status !== 'deleted');
  };

  const getRequestManagers = (request) => {
    return (request.managers || []).map(mId => users.find(u => u.id === mId)).filter(Boolean);
  };

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);

  return (
    <div className="p-6">
      {/* Вкладки */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab('requests');
            setSearchTerm('');
            setSelectedInvoice(null);
          }}
          className={`px-6 py-3 font-bold rounded-t-lg transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Package className="w-5 h-5" />
          Заявки
        </button>
        <button
          onClick={() => {
            setActiveTab('my-invoices');
            setSearchTerm('');
            setSelectedRequest(null);
          }}
          className={`px-6 py-3 font-bold rounded-t-lg transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'my-invoices'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <FileText className="w-5 h-5" />
          Мои счета
        </button>
        <button
          onClick={() => {
            setActiveTab('sold-goods');
            setSearchTerm('');
            setSelectedRequest(null);
            setSelectedInvoice(null);
          }}
          className={`px-6 py-3 font-bold rounded-t-lg transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'sold-goods'
              ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          💰 Проданные товары
        </button>
      </div>

      {activeTab === 'requests' && (
        <>
          <div className="mb-6 flex gap-4 items-start">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Выберите компанию:</label>
              <select
                value={selectedCompany || ''}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  setSelectedRequest(null);
                }}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>

            {selectedCompanyData && (
              <button
                onClick={() => setShowCompanyInfo(!showCompanyInfo)}
                className="mt-7 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Инфо о компании
              </button>
            )}
          </div>
        </>
      )}

      {showCompanyInfo && selectedCompanyData && (
        <div className="mb-6 bg-white border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-xl text-gray-800">{selectedCompanyData.name}</h3>
            <button
              onClick={() => setShowCompanyInfo(false)}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">ИНН:</span> {selectedCompanyData.inn}</p>
              <p><span className="font-medium">КПП:</span> {selectedCompanyData.kpp}</p>
              <p><span className="font-medium">Адрес:</span> {selectedCompanyData.address}</p>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              {selectedCompanyData.bank && <p><span className="font-medium">Банк:</span> {selectedCompanyData.bank}</p>}
              {selectedCompanyData.bik && <p><span className="font-medium">БИК:</span> {selectedCompanyData.bik}</p>}
              {selectedCompanyData.account && <p><span className="font-medium">Р/с:</span> {selectedCompanyData.account}</p>}
            </div>
          </div>
          
          {selectedCompanyData.documents && selectedCompanyData.documents.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Уставные документы:</h4>
              <div className="space-y-2">
                {selectedCompanyData.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{doc.name}</span>
                      <span className="text-xs text-gray-500">({(doc.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <a
                      href={`${API_URL.replace('/api', '')}${doc.path}`}
                      download={doc.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Скачать
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedCompany && activeTab === 'requests' && (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Доступные заявки</h2>
            {availableRequests.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
                Нет доступных заявок для этой компании
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableRequests.map(request => {
                  const isMine = (request.managers || []).includes(user.id);
                  const requestInvoices = getRequestInvoices(request.id);
                  const requestManagers = getRequestManagers(request);
                  
                  return (
                    <div 
                      key={request.id} 
                      className={`border-2 rounded-lg p-4 transition ${
                        isMine 
                          ? 'border-blue-500 bg-blue-50 hover:shadow-lg cursor-pointer' 
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                      }`}
                      onClick={() => isMine && setSelectedRequest(request)}
                    >
                      <h3 className="font-bold text-lg text-gray-800 mb-2">{request.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                      
                      {requestManagers.length > 0 && (
                        <div className="mb-2 text-sm text-gray-600">
                          <span className="font-medium">Менеджеры:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {requestManagers.map(m => (
                              <span key={m.id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                {m.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {isMine ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            Закреплена за вами
                          </div>
                          <div className="text-sm text-gray-600">
                            Счетов добавлено: <span className="font-bold">{requestInvoices.length}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(request);
                            }}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                          >
                            Открыть заявку
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeaveRequest(request.id);
                            }}
                            className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition text-sm font-medium"
                          >
                            Выйти из заявки
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleTakeRequest(request.id)}
                          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
                        >
                          Закрепить за собой
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedRequest && (
            <div ref={selectedRequestRef} className="bg-white border-2 border-blue-500 rounded-lg p-6 mb-6 scroll-mt-4">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedRequest.title}</h2>
                  <p className="text-gray-600">{selectedRequest.description}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setEditingInvoice(null);
                      setShowInvoiceModal(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Добавить счёт
                  </button>
                  <button
                    onClick={() => handleLeaveRequest(selectedRequest.id)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition"
                  >
                    Выйти из заявки
                  </button>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Закрыть
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-800 mb-3">Счета по заявке:</h3>
                {getRequestInvoices(selectedRequest.id).length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-600">
                    Счетов пока нет. Добавьте первый счёт.
                  </div>
                ) : (
                  getRequestInvoices(selectedRequest.id).map(invoice => {
                    const invoiceManager = users.find(u => u.id === invoice.managerId);
                    const invoiceLogist = invoice.logistId ? users.find(u => u.id === invoice.logistId) : null;

                    return (
                      <div 
                        key={invoice.id} 
                        className={`border-2 rounded-lg p-4 ${
                          invoice.status === 'rejected' ? 'border-red-300 bg-red-50' :
                          invoice.status === 'new' ? 'border-gray-300 bg-white' :
                          invoice.status === 'pending_approval' ? 'border-yellow-300 bg-yellow-50' :
                          invoice.status === 'approved' ? 'border-green-500 bg-green-50' :
                          'border-blue-500 bg-blue-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h4 className="font-bold text-lg text-gray-800">{invoice.supplier}</h4>
                              {invoice.managerId === user.id && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  Мой счёт
                                </span>
                              )}
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                invoice.status === 'rejected' ? 'bg-red-200 text-red-700' :
                                invoice.status === 'new' ? 'bg-gray-200 text-gray-700' :
                                invoice.status === 'pending_approval' ? 'bg-yellow-200 text-yellow-700' :
                                invoice.status === 'approved' ? 'bg-green-200 text-green-700' :
                                'bg-blue-200 text-blue-700'
                              }`}>
                                {invoice.status === 'rejected' ? 'Срез' :
                                 invoice.status === 'new' ? 'Новый' :
                                 invoice.status === 'pending_approval' ? 'На согласовании' :
                                 invoice.status === 'approved' ? 'Согласован' :
                                 invoice.status === 'in_logistics' ? 'В логистике' :
                                 invoice.status === 'documents_signed' ? 'Док. подписаны' :
                                 invoice.status === 'in_transit' ? 'В пути' :
                                 invoice.status === 'received' ? 'Получен' :
                                 'Закрыт'}
                              </span>
                            </div>
                            {invoice.website && (
                              <a 
                                href={invoice.website.startsWith('http') ? invoice.website : `https://${invoice.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline mb-2 block"
                              >
                                {invoice.website}
                              </a>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                              <p><span className="font-medium">Номер:</span> {invoice.number}</p>
                              <p><span className="font-medium">Сумма:</span> {invoice.amount} ₽</p>
                              <p><span className="font-medium">Контакт:</span> {invoice.contactPerson}</p>
                              <p><span className="font-medium">Телефон:</span> {invoice.phone}</p>
                              {invoice.email && <p><span className="font-medium">Email:</span> {invoice.email}</p>}
                              <p><span className="font-medium">Менеджер:</span> {invoiceManager?.name}</p>
                              {invoiceLogist && (
                                <p className="flex items-center gap-2">
                                  <span className="font-medium">Логист:</span>
                                  <span className="text-green-600 font-semibold">🚚 {invoiceLogist.name}</span>
                                </p>
                              )}
                            </div>
                            {invoice.logisticsComment && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                                <p className="text-sm font-medium text-gray-700">Комментарий для логиста:</p>
                                <p className="text-sm text-gray-600">{invoice.logisticsComment}</p>
                              </div>
                            )}
                            {invoice.files && invoice.files.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700 mb-1">Прикреплённые файлы:</p>
                                <div className="flex flex-wrap gap-2">
                                  {invoice.files.map((file, idx) => (
                                    <a
                                      key={idx}
                                      href={`${API_URL.replace('/api', '')}${file.path}`}
                                      download={file.name}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1"
                                    >
                                      <FileText className="w-3 h-3" />
                                      {file.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-4 flex flex-col gap-2">
                            {/* Универсальная кнопка редактирования для всех статусов */}
                            {invoice.managerId === user.id && invoice.status !== 'deleted' && (
                              <button
                                onClick={() => {
                                  setEditingInvoice(invoice);
                                  setShowInvoiceModal(true);
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium whitespace-nowrap"
                              >
                                Редактировать
                              </button>
                            )}

                            {invoice.managerId === user.id && invoice.status === 'new' && (
                              <>
                                <button
                                  onClick={() => handlePendingApprovalInvoice(invoice.id)}
                                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm font-medium whitespace-nowrap"
                                >
                                  На согласовании
                                </button>
                                <button
                                  onClick={() => handlePendingApprovalInvoice(invoice.id)}
                                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm font-medium whitespace-nowrap"
                                >
                                  На согласовании
                                </button>
                                <button
                                  onClick={() => handleApproveInvoice(invoice.id)}
                                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium whitespace-nowrap"
                                >
                                  Согласовано на поступление
                                </button>
                                <button
                                  onClick={() => handleRejectInvoice(invoice.id)}
                                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium whitespace-nowrap"
                                >
                                  Срез
                                </button>
                                <button
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium whitespace-nowrap"
                                >
                                  Удалить счёт
                                </button>
                              </>
                            )}

                            {invoice.managerId === user.id && invoice.status === 'pending_approval' && (
                              <>
                                <button
                                  onClick={() => handleApproveInvoice(invoice.id)}
                                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium whitespace-nowrap"
                                >
                                  Согласовано на поступление
                                </button>
                                <button
                                  onClick={() => handleRejectInvoice(invoice.id)}
                                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium whitespace-nowrap"
                                >
                                  Срез
                                </button>
                                <button
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium whitespace-nowrap"
                                >
                                  Удалить счёт
                                </button>
                              </>
                            )}

                            {invoice.managerId === user.id && invoice.status === 'approved' && (
                              <>
                                <button
                                  onClick={() => handleSendToLogistics(invoice.id)}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium whitespace-nowrap"
                                >
                                  Передать в логистику
                                </button>
                                <button
                                  onClick={() => handleRejectInvoice(invoice.id)}
                                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium whitespace-nowrap"
                                >
                                  Срез
                                </button>
                                <button
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium whitespace-nowrap"
                                >
                                  Удалить счёт
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {showInvoiceModal && (
            <InvoiceModal
              invoice={editingInvoice}
              onSave={editingInvoice ? handleEditInvoice : handleAddInvoice}
              onClose={() => {
                setShowInvoiceModal(false);
                setEditingInvoice(null);
              }}
            />
          )}
        </>
      )}

      {/* Вкладка "Мои счета" */}
      {activeTab === 'my-invoices' && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Все мои счета</h2>

            {/* Поиск */}
            <div className="flex gap-4 items-end mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Поиск по счетам:
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Поиск по поставщику, номеру, контакту, заявке, компании..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {(() => {
              const myInvoices = invoices.filter(inv =>
                inv.managerId === user.id && inv.status !== 'deleted' && inv.status !== 'rejected'
              );

              const filteredInvoices = myInvoices.filter(inv => {
                if (!searchTerm) return true;
                const search = searchTerm.toLowerCase();
                const request = requests.find(r => r.id === inv.requestId);
                const company = companies.find(c => c.id === inv.companyId);

                return inv.supplier.toLowerCase().includes(search) ||
                       inv.number.toLowerCase().includes(search) ||
                       inv.contactPerson.toLowerCase().includes(search) ||
                       inv.phone.toLowerCase().includes(search) ||
                       (inv.email && inv.email.toLowerCase().includes(search)) ||
                       (inv.website && inv.website.toLowerCase().includes(search)) ||
                       (company && company.name.toLowerCase().includes(search)) ||
                       (request && request.title.toLowerCase().includes(search));
              });

              return (
                <div className="space-y-4">
                  {filteredInvoices.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
                      {searchTerm ? 'Нет счетов, соответствующих запросу' : 'У вас пока нет счетов'}
                    </div>
                  ) : (
                    filteredInvoices.map(invoice => {
                      const request = requests.find(r => r.id === invoice.requestId);
                      const company = companies.find(c => c.id === invoice.companyId);
                      const invoiceLogist = invoice.logistId ? users.find(u => u.id === invoice.logistId) : null;
                      const isExpanded = selectedInvoice === invoice.id;

                      return (
                        <div key={invoice.id} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h3 className="font-bold text-xl text-gray-800">{invoice.supplier}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  invoice.status === 'new' ? 'bg-gray-100 text-gray-700' :
                                  invoice.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                                  invoice.status === 'approved' ? 'bg-green-100 text-green-700' :
                                  invoice.status === 'in_logistics' ? 'bg-purple-100 text-purple-700' :
                                  invoice.status === 'documents_signed' ? 'bg-yellow-100 text-yellow-700' :
                                  invoice.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                                  invoice.status === 'received' ? 'bg-green-100 text-green-700' :
                                  invoice.status === 'closed' ? 'bg-gray-200 text-gray-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {invoice.status === 'new' ? 'Новый' :
                                   invoice.status === 'pending_approval' ? 'На согласовании' :
                                   invoice.status === 'approved' ? 'Согласовано' :
                                   invoice.status === 'in_logistics' ? 'В логистике' :
                                   invoice.status === 'documents_signed' ? 'Документы подписаны' :
                                   invoice.status === 'in_transit' ? 'Товар в пути' :
                                   invoice.status === 'received' ? 'Товар получен' :
                                   invoice.status === 'closed' ? 'Закрыто' :
                                   'Срез'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-600">
                                <p><span className="font-medium">Заявка:</span> {request?.title || 'Удалена'}</p>
                                <p><span className="font-medium">Компания:</span> {company?.name || 'Не указана'}</p>
                                <p><span className="font-medium">Номер счёта:</span> {invoice.number}</p>
                                <p><span className="font-medium">Сумма:</span> {invoice.amount} ₽</p>
                                <p><span className="font-medium">Контакт:</span> {invoice.contactPerson}</p>
                                <p><span className="font-medium">Телефон:</span> {invoice.phone}</p>
                                {invoiceLogist && (
                                  <p className="flex items-center gap-2">
                                    <span className="font-medium">Логист:</span>
                                    <span className="text-green-600 font-semibold">🚚 {invoiceLogist.name}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => setSelectedInvoice(isExpanded ? null : invoice.id)}
                              className="ml-4 text-blue-600 hover:text-blue-700"
                            >
                              {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-bold text-gray-800 mb-2">Детали:</h4>
                                  <div className="text-sm text-gray-600 space-y-1">
                                    {invoice.website && (
                                      <p><span className="font-medium">Сайт:</span> <a href={invoice.website.startsWith('http') ? invoice.website : `https://${invoice.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{invoice.website}</a></p>
                                    )}
                                    {invoice.email && <p><span className="font-medium">Email:</span> {invoice.email}</p>}
                                    <p><span className="font-medium">Дата создания:</span> {new Date(invoice.createdAt).toLocaleString('ru-RU')}</p>
                                    {invoice.sentToLogisticsAt && (
                                      <p><span className="font-medium">Передан в логистику:</span> {new Date(invoice.sentToLogisticsAt).toLocaleString('ru-RU')}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingInvoice(invoice);
                                      setShowInvoiceModal(true);
                                    }}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                  >
                                    Редактировать
                                  </button>
                                </div>
                              </div>

                              {invoice.logisticsComment && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                  <h4 className="font-bold text-gray-800 mb-1">Комментарий для логистики:</h4>
                                  <p className="text-sm text-gray-700">{invoice.logisticsComment}</p>
                                </div>
                              )}

                              {invoice.files && invoice.files.length > 0 && (
                                <div>
                                  <h4 className="font-bold text-gray-800 mb-2">Прикреплённые файлы:</h4>
                                  <div className="space-y-2">
                                    {invoice.files.map((file, idx) => (
                                      <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-5 h-5 text-gray-600" />
                                          <span className="text-sm font-medium text-gray-700">{file.name}</span>
                                          <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                        <a
                                          href={`${API_URL.replace('/api', '')}${file.path}`}
                                          download={file.name}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                        >
                                          <Download className="w-4 h-4" />
                                          Скачать
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })()}
          </div>

          {showInvoiceModal && (
            <InvoiceModal
              invoice={editingInvoice}
              onSave={editingInvoice ? handleEditInvoice : handleAddInvoice}
              onClose={() => {
                setShowInvoiceModal(false);
                setEditingInvoice(null);
              }}
            />
          )}
        </>
      )}

      {activeTab === 'sold-goods' && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">💰 Проданные товары</h2>

            {/* Поиск */}
            <div className="flex gap-4 items-end mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Поиск по проданным товарам:
                </label>
                <input
                  type="text"
                  placeholder="Поставщик, номер, контакт, заявка, компания..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            {(() => {
              const soldInvoices = invoices.filter(inv =>
                inv.managerId === user.id && inv.status === 'sold'
              );

              const filteredSoldInvoices = soldInvoices.filter(inv => {
                if (!searchTerm) return true;
                const search = searchTerm.toLowerCase();
                const request = requests.find(r => r.id === inv.requestId);
                const company = companies.find(c => c.id === inv.companyId);

                return inv.supplier.toLowerCase().includes(search) ||
                       inv.number.toLowerCase().includes(search) ||
                       inv.contactPerson.toLowerCase().includes(search) ||
                       inv.phone.toLowerCase().includes(search) ||
                       (inv.email && inv.email.toLowerCase().includes(search)) ||
                       (inv.website && inv.website.toLowerCase().includes(search)) ||
                       (company && company.name.toLowerCase().includes(search)) ||
                       (request && request.title.toLowerCase().includes(search));
              });

              return (
                <div className="space-y-4">
                  {filteredSoldInvoices.length === 0 ? (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-8 text-center">
                      <TrendingUp className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                      <p className="text-xl font-bold text-gray-800">{searchTerm ? 'Нет проданных товаров, соответствующих запросу' : 'У вас пока нет проданных товаров'}</p>
                      <p className="text-gray-600 mt-2">Как только логист отметит товар как "Продан", он появится здесь</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-3xl font-bold">{filteredSoldInvoices.length}</h3>
                            <p className="text-yellow-100">Товаров продано</p>
                          </div>
                          <div>
                            <h3 className="text-3xl font-bold">{filteredSoldInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0).toLocaleString('ru-RU')} ₽</h3>
                            <p className="text-yellow-100">Общая сумма</p>
                          </div>
                        </div>
                      </div>
                      {filteredSoldInvoices.map(invoice => {
                        const request = requests.find(r => r.id === invoice.requestId);
                        const company = companies.find(c => c.id === invoice.companyId);
                        const logist = users.find(u => u.id === invoice.logistId);
                        const isExpanded = selectedInvoice === invoice.id;

                        return (
                          <div key={invoice.id} className="bg-white border-2 border-yellow-300 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h3 className="font-bold text-xl text-gray-800">{invoice.supplier}</h3>
                                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                                    💰 Продан
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-600">
                                  <p><span className="font-medium">Заявка:</span> {request?.title || 'Удалена'}</p>
                                  <p><span className="font-medium">Компания:</span> {company?.name || 'Не указана'}</p>
                                  <p className="flex items-center gap-2">
                                    <span className="font-medium">Логист:</span>
                                    {logist ? (
                                      <span className="text-green-600 font-semibold">🚚 {logist.name}</span>
                                    ) : (
                                      <span>Не назначен</span>
                                    )}
                                  </p>
                                  <p><span className="font-medium">Номер счёта:</span> {invoice.number}</p>
                                  <p><span className="font-medium">Сумма:</span> {invoice.amount} ₽</p>
                                  <p><span className="font-medium">Контакт:</span> {invoice.contactPerson}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedInvoice(isExpanded ? null : invoice.id)}
                                className="ml-4 text-yellow-600 hover:text-yellow-700"
                              >
                                {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="text-sm text-gray-600 space-y-2">
                                  {invoice.website && (
                                    <p><span className="font-medium">Сайт:</span> <a href={invoice.website.startsWith('http') ? invoice.website : `https://${invoice.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{invoice.website}</a></p>
                                  )}
                                  <p><span className="font-medium">Телефон:</span> {invoice.phone}</p>
                                  {invoice.email && <p><span className="font-medium">Email:</span> {invoice.email}</p>}
                                  <p><span className="font-medium">Дата создания:</span> {new Date(invoice.createdAt).toLocaleString('ru-RU')}</p>
                                  {invoice.sentToLogisticsAt && (
                                    <p><span className="font-medium">Передан в логистику:</span> {new Date(invoice.sentToLogisticsAt).toLocaleString('ru-RU')}</p>
                                  )}
                                </div>

                                {invoice.logisticsComment && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                                    <h4 className="font-bold text-gray-800 mb-1">Комментарий:</h4>
                                    <p className="text-sm text-gray-700">{invoice.logisticsComment}</p>
                                  </div>
                                )}

                                {invoice.files && invoice.files.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="font-bold text-gray-800 mb-2">Прикреплённые файлы:</h4>
                                    <div className="space-y-2">
                                      {invoice.files.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                                          <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-gray-600" />
                                            <span className="text-sm font-medium text-gray-700">{file.name}</span>
                                          </div>
                                          <a
                                            href={`${API_URL.replace('/api', '')}${file.path}`}
                                            download={file.name}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                          >
                                            <Download className="w-4 h-4" />
                                            Скачать
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
};

// Панель логистики
const LogisticsPanel = ({ user }) => {
  const [invoices, setInvoices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('my-invoices'); // вкладки: my-invoices, received-goods, all-invoices, expenses
  const [logistTags, setLogistTags] = useState([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  // Состояние для расходов
  const [expenses, setExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [invoicesData, requestsData, usersData, companiesData, commentsData, tagsData, expensesData, categoriesData] = await Promise.all([
        api.getInvoices(),
        api.getRequests(),
        api.getUsers(),
        api.getCompanies(),
        api.getComments(),
        fetch(`${API_URL}/logist-tags/${user.id}`).then(r => r.json()),
        api.getExpenses(),
        api.getExpenseCategories()
      ]);

      setInvoices(invoicesData);
      setRequests(requestsData);
      setUsers(usersData);
      setCompanies(companiesData);
      setComments(commentsData);
      setLogistTags(tagsData);
      setExpenses(expensesData);
      setExpenseCategories(categoriesData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  // ИСПРАВЛЕНО: Теперь корректно обновляет счет и сразу обновляет локальное состояние
  const handleTakeInvoice = async (invoiceId) => {
    try {
      await api.updateInvoice(invoiceId, { logistId: user.id });
      const invoice = invoices.find(inv => inv.id === invoiceId);
      await addHistory(user, 'Взятие счёта в работу', 'invoice', invoice.supplier);
      // Немедленное обновление без ожидания
      await loadData();
    } catch (error) {
      console.error('Ошибка взятия счёта:', error);
      alert('Ошибка взятия счёта в работу');
    }
  };

  // Функция для передачи счета другому логисту
  const handleTransferInvoice = async (invoiceId, newLogistId) => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      const newLogist = users.find(u => u.id === newLogistId);
      if (!newLogist) {
        alert('Логист не найден');
        return;
      }

      await api.updateInvoice(invoiceId, { logistId: newLogistId });
      await addHistory(user, 'Передача счёта логисту', 'invoice', `${invoice.supplier} -> ${newLogist.name}`);
      await loadData();
      alert(`Счет успешно передан логисту ${newLogist.name}`);
    } catch (error) {
      alert('Ошибка передачи счёта');
    }
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      await api.updateInvoice(invoiceId, { status: newStatus });
      const invoice = invoices.find(inv => inv.id === invoiceId);
      await addHistory(user, 'Изменение статуса счёта', 'invoice', `${invoice.supplier} -> ${newStatus}`);
      await loadData();
    } catch (error) {
      alert('Ошибка изменения статуса');
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (confirm('Выполнить срез? Счёт будет удалён из логистики.')) {
      try {
        await api.updateInvoice(invoiceId, { status: 'deleted' });
        const invoice = invoices.find(inv => inv.id === invoiceId);
        await addHistory(user, 'Срез счёта', 'invoice', invoice.supplier);
        await loadData();
      } catch (error) {
        alert('Ошибка выполнения среза');
      }
    }
  };

  const handleAddComment = async (invoiceId) => {
    if (!newComment.trim()) return;

    try {
      await api.createComment({
        id: Date.now().toString(),
        invoiceId,
        userId: user.id,
        userName: user.name,
        text: newComment,
        createdAt: new Date().toISOString()
      });
      setNewComment('');
      await loadData();
    } catch (error) {
      alert('Ошибка добавления комментария');
    }
  };

  // Функции для работы с тегами
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      alert('Введите название тега');
      return;
    }

    try {
      await fetch(`${API_URL}/logist-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Date.now().toString(),
          logistId: user.id,
          name: newTagName,
          color: newTagColor,
          createdAt: new Date().toISOString()
        })
      });
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setShowTagModal(false);
      await loadData();
    } catch (error) {
      alert('Ошибка создания тега');
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!confirm('Удалить тег? Он будет удалён из всех счетов.')) return;

    try {
      await fetch(`${API_URL}/logist-tags/${tagId}`, {
        method: 'DELETE'
      });
      // Удаляем тег из всех счетов
      const updatedInvoices = invoices.filter(inv => inv.logistId === user.id && inv.tags && inv.tags.includes(tagId));
      await Promise.all(
        updatedInvoices.map(inv =>
          api.updateInvoice(inv.id, { tags: inv.tags.filter(t => t !== tagId) })
        )
      );
      await loadData();
    } catch (error) {
      alert('Ошибка удаления тега');
    }
  };

  const handleToggleInvoiceTag = async (invoiceId, tagId) => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      const currentTags = invoice.tags || [];
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter(t => t !== tagId)
        : [...currentTags, tagId];

      await api.updateInvoice(invoiceId, { tags: newTags });
      await loadData();
    } catch (error) {
      alert('Ошибка обновления тегов');
    }
  };

  // Функция для загрузки фотографий полученных товаров
  const handleUploadReceivedGoodsPhotos = async (invoiceId, files) => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        alert('Счет не найден');
        return;
      }

      const currentPhotos = invoice.receivedGoodsPhotos || [];
      const newPhotos = await Promise.all(
        Array.from(files).map(async file => {
          const data = await readFileAsDataURL(file);
          return {
            name: file.name,
            size: file.size,
            data
          };
        })
      );

      const updatedPhotos = [...currentPhotos, ...newPhotos];
      await api.updateInvoice(invoiceId, { receivedGoodsPhotos: updatedPhotos });
      await addHistory(user, 'Добавление фото товара', 'invoice', `${invoice.supplier} - добавлено ${newPhotos.length} фото`);
      await loadData();
    } catch (error) {
      console.error('Ошибка загрузки фотографий:', error);
      alert('Ошибка загрузки фотографий: ' + error.message);
    }
  };

  // Функция для удаления фотографии
  const handleDeleteReceivedGoodsPhoto = async (invoiceId, photoIndex) => {
    if (!confirm('Удалить эту фотографию?')) return;

    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        alert('Счет не найден');
        return;
      }

      const currentPhotos = invoice.receivedGoodsPhotos || [];
      const updatedPhotos = currentPhotos.filter((_, index) => index !== photoIndex);
      await api.updateInvoice(invoiceId, { receivedGoodsPhotos: updatedPhotos });
      await addHistory(user, 'Удаление фото товара', 'invoice', invoice.supplier);
      await loadData();
    } catch (error) {
      alert('Ошибка удаления фотографии');
    }
  };

  const logisticsInvoices = invoices.filter(inv => 
    inv.status === 'in_logistics' && !inv.logistId
  );

  const myInvoices = invoices.filter(inv => 
    inv.logistId === user.id && ['in_logistics', 'documents_signed', 'in_transit'].includes(inv.status)
  );

  const receivedInvoices = invoices.filter(inv =>
    inv.logistId === user.id && ['received', 'closed', 'sold'].includes(inv.status)
  );

  const soldInvoices = invoices.filter(inv =>
    inv.logistId === user.id && inv.status === 'sold'
  );

  const filteredInvoices = myInvoices
    .filter(inv => filterStatus === 'all' || inv.status === filterStatus)
    .filter(inv => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return inv.supplier.toLowerCase().includes(search) ||
             inv.number.toLowerCase().includes(search) ||
             inv.contactPerson.toLowerCase().includes(search);
    });

  const filteredReceivedInvoices = receivedInvoices.filter(inv => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return inv.supplier.toLowerCase().includes(search) ||
           inv.number.toLowerCase().includes(search) ||
           inv.contactPerson.toLowerCase().includes(search);
  });

  // ДОБАВЛЕНО: Все счета для базы поиска
  const allInvoices = invoices.filter(inv => inv.status !== 'deleted');
  
  // ДОБАВЛЕНО: Фильтрация базы всех счетов
  const filteredAllInvoices = allInvoices.filter(inv => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    
    const request = requests.find(r => r.id === inv.requestId);
    const company = companies.find(c => c.id === inv.companyId);
    const manager = users.find(u => u.id === inv.managerId);
    
    return inv.supplier.toLowerCase().includes(search) ||
           inv.number.toLowerCase().includes(search) ||
           inv.contactPerson.toLowerCase().includes(search) ||
           inv.phone.toLowerCase().includes(search) ||
           (inv.email && inv.email.toLowerCase().includes(search)) ||
           (inv.website && inv.website.toLowerCase().includes(search)) ||
           (company && company.inn.toLowerCase().includes(search)) ||
           (company && company.name.toLowerCase().includes(search)) ||
           (request && request.title.toLowerCase().includes(search)) ||
           (manager && manager.name.toLowerCase().includes(search));
  });

  const getInvoiceComments = (invoiceId) => {
    return comments.filter(c => c.invoiceId === invoiceId);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Панель логистики</h2>
        <button
          onClick={() => setShowTagModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Управление тегами
        </button>
      </div>

      {/* Вкладка "Расходы" */}
      {activeTab === 'expenses' && (
        <div>
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <Tag className="w-4 h-4" />
              Управление категориями
            </button>
            <button
              onClick={() => {
                setEditingExpense(null);
                setShowExpenseModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить расход
            </button>
          </div>

          {/* Список расходов */}
          <div className="space-y-4">
            {expenses.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
                <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Расходов пока нет</p>
                <p className="text-sm">Добавьте первый расход, нажав кнопку "Добавить расход"</p>
              </div>
            ) : (
              expenses.map(expense => {
                const category = expenseCategories.find(c => c.id === expense.categoryId);
                const expenseInvoices = expense.invoiceIds.map(invId =>
                  invoices.find(inv => inv.id === invId)
                ).filter(Boolean);
                const splitAmount = expenseInvoices.length > 0 ? (expense.amount / expenseInvoices.length) : expense.amount;

                return (
                  <div key={expense.id} className="bg-white border-2 border-orange-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {expense.amount.toLocaleString('ru-RU')} ₽
                          </div>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            {category?.name || 'Без категории'}
                          </span>
                          {expenseInvoices.length > 1 && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                              <Split className="w-4 h-4" />
                              Разделён на {expenseInvoices.length} счёта ({splitAmount.toLocaleString('ru-RU')} ₽ каждый)
                            </span>
                          )}
                        </div>

                        {expense.description && (
                          <p className="text-gray-700 mb-3">{expense.description}</p>
                        )}

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Привязан к счетам:</p>
                          <div className="flex flex-wrap gap-2">
                            {expenseInvoices.map(invoice => (
                              <div key={invoice.id} className="bg-gray-100 px-3 py-1 rounded-lg text-sm">
                                <span className="font-medium">{invoice.supplier}</span>
                                <span className="text-gray-600"> • {invoice.number}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-3">
                          Создан: {new Date(expense.createdAt).toLocaleString('ru-RU')}
                        </p>
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setEditingExpense(expense);
                            setShowExpenseModal(true);
                          }}
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Удалить этот расход?')) {
                              await api.deleteExpense(expense.id);
                              await loadData();
                            }
                          }}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Модальное окно для управления тегами */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Мои теги</h3>
              <button
                onClick={() => setShowTagModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Создание нового тега */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-bold text-gray-700 mb-3">Создать новый тег</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Название тега..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-16 h-10 rounded-lg cursor-pointer"
                />
                <button
                  onClick={handleCreateTag}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Создать
                </button>
              </div>
            </div>

            {/* Список тегов */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-700 mb-3">Мои теги ({logistTags.length})</h4>
              {logistTags.length === 0 ? (
                <p className="text-gray-500 text-center py-4">У вас пока нет тегов</p>
              ) : (
                logistTags.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium text-gray-800">{tag.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для управления категориями расходов */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Категории расходов</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Название категории"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={async () => {
                    if (!newTagName.trim()) return;
                    await api.createExpenseCategory({
                      id: Date.now().toString(),
                      name: newTagName.trim(),
                      createdBy: user.id,
                      createdAt: new Date().toISOString()
                    });
                    setNewTagName('');
                    await loadData();
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {expenseCategories.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Категорий пока нет</p>
              ) : (
                expenseCategories.map(category => (
                  <div key={category.id} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
                    <span className="font-medium">{category.name}</span>
                    <button
                      onClick={async () => {
                        if (confirm(`Удалить категорию "${category.name}"?`)) {
                          await api.deleteExpenseCategory(category.id);
                          await loadData();
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для добавления/редактирования расхода */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingExpense ? 'Редактировать расход' : 'Новый расход'}
              </h3>
              <button
                onClick={() => {
                  setShowExpenseModal(false);
                  setEditingExpense(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const selectedInvoiceIds = Array.from(formData.getAll('invoiceIds'));

                if (selectedInvoiceIds.length === 0) {
                  alert('Выберите хотя бы один счёт');
                  return;
                }

                const expenseData = {
                  categoryId: formData.get('categoryId'),
                  amount: parseFloat(formData.get('amount')),
                  description: formData.get('description'),
                  invoiceIds: selectedInvoiceIds
                };

                if (editingExpense) {
                  await api.updateExpense(editingExpense.id, expenseData);
                } else {
                  await api.createExpense({
                    id: Date.now().toString(),
                    ...expenseData,
                    createdBy: user.id,
                    createdAt: new Date().toISOString()
                  });
                }

                await loadData();
                setShowExpenseModal(false);
                setEditingExpense(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Категория *</label>
                <select
                  name="categoryId"
                  required
                  defaultValue={editingExpense?.categoryId || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Выберите категорию</option>
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Сумма расхода * (₽)</label>
                <input
                  type="number"
                  name="amount"
                  required
                  step="0.01"
                  min="0"
                  defaultValue={editingExpense?.amount || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Введите сумму"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                <textarea
                  name="description"
                  rows="3"
                  defaultValue={editingExpense?.description || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Опишите расход..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Привязать к счетам * (выберите один или несколько)
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {invoices.filter(inv => inv.logistId === user.id).map(invoice => (
                    <label key={invoice.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        name="invoiceIds"
                        value={invoice.id}
                        defaultChecked={editingExpense?.invoiceIds?.includes(invoice.id)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <div className="flex-1">
                        <span className="font-medium">{invoice.supplier}</span>
                        <span className="text-gray-600 text-sm"> • {invoice.number}</span>
                        <span className="text-gray-500 text-sm"> • {invoice.amount} ₽</span>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Если выбрать несколько счетов, расход автоматически разделится между ними поровну
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
                >
                  {editingExpense ? 'Сохранить' : 'Добавить расход'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ДОБАВЛЕНО: Вкладки */}
      <div className="mb-6 flex gap-4 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('my-invoices');
            setSearchTerm('');
            setFilterStatus('all');
          }}
          className={`px-6 py-3 font-medium transition whitespace-nowrap ${activeTab === 'my-invoices' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <Package className="inline mr-2 w-5 h-5" />
          Мои счета ({myInvoices.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('received-goods');
            setSearchTerm('');
            setSelectedInvoice(null);
          }}
          className={`px-6 py-3 font-medium transition whitespace-nowrap ${activeTab === 'received-goods' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <Package className="inline mr-2 w-5 h-5" />
          Полученные товары ({receivedInvoices.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('all-invoices');
            setSearchTerm('');
            setSelectedInvoice(null);
          }}
          className={`px-6 py-3 font-medium transition whitespace-nowrap ${activeTab === 'all-invoices' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <Search className="inline mr-2 w-5 h-5" />
          База всех счетов
        </button>
        <button
          onClick={() => {
            setActiveTab('expenses');
            setSearchTerm('');
            setSelectedInvoice(null);
          }}
          className={`px-6 py-3 font-medium transition whitespace-nowrap ${activeTab === 'expenses' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <Receipt className="inline mr-2 w-5 h-5" />
          💰 Расходы ({expenses.length})
        </button>
      </div>

      {activeTab === 'my-invoices' && (
        <div>
          {logisticsInvoices.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Доступные счета</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {logisticsInvoices.map(invoice => {
                  const request = requests.find(r => r.id === invoice.requestId);
                  const manager = users.find(u => u.id === invoice.managerId);
                  const company = companies.find(c => c.id === invoice.companyId);
                  
                  return (
                    <div key={invoice.id} className="bg-white border-2 border-purple-200 rounded-lg p-4 hover:shadow-md transition">
                      <h4 className="font-bold text-lg text-gray-800 mb-2">{invoice.supplier}</h4>
                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        <p><span className="font-medium">Заявка:</span> {request?.title || 'Удалена'}</p>
                        <p><span className="font-medium">Компания:</span> {company?.name || 'Не указана'}</p>
                        <p><span className="font-medium">Сумма:</span> {invoice.amount} ₽</p>
                        <p><span className="font-medium">Менеджер:</span> {manager?.name || 'Удалён'}</p>
                        {invoice.files && invoice.files.length > 0 && (
                          <p className="text-green-600">
                            <FileText className="inline w-4 h-4 mr-1" />
                            Файлов: {invoice.files.length}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleTakeInvoice(invoice.id)}
                        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                      >
                        Взять в работу
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{myInvoices.length}</div>
              <div className="text-sm text-gray-600 mt-1">Мои счета</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {invoices.filter(inv => inv.logistId === user.id && inv.status === 'in_logistics').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">В логистике</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {invoices.filter(inv => inv.logistId === user.id && inv.status === 'documents_signed').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Док. подписаны</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {invoices.filter(inv => inv.logistId === user.id && inv.status === 'in_transit').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Товар в пути</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {receivedInvoices.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Получено всего</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Поиск по поставщику, номеру, контакту..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все статусы</option>
                <option value="in_logistics">В логистике</option>
                <option value="documents_signed">Документы подписаны</option>
                <option value="in_transit">Товар в пути</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredInvoices.map(invoice => {
          const request = requests.find(r => r.id === invoice.requestId);
          const manager = users.find(u => u.id === invoice.managerId);
          const company = companies.find(c => c.id === invoice.companyId);
          const invoiceComments = getInvoiceComments(invoice.id);
          const isExpanded = selectedInvoice === invoice.id;
          
          return (
            <div key={invoice.id} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-bold text-xl text-gray-800">{invoice.supplier}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'in_logistics' ? 'bg-purple-100 text-purple-700' :
                      invoice.status === 'documents_signed' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {invoice.status === 'in_logistics' ? 'В логистике' :
                       invoice.status === 'documents_signed' ? 'Документы подписаны' :
                       'Товар в пути'}
                    </span>
                    {/* Теги */}
                    {invoice.tags && invoice.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {invoice.tags.map(tagId => {
                          const tag = logistTags.find(t => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <span
                              key={tagId}
                              className="px-2 py-0.5 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Заявка:</span> {request?.title || 'Удалена'}</p>
                    <p><span className="font-medium">Компания:</span> {company?.name || 'Не указана'}</p>
                    <p><span className="font-medium">Менеджер:</span> {manager?.name || 'Удалён'}</p>
                    <p><span className="font-medium">Номер счёта:</span> {invoice.number}</p>
                    <p><span className="font-medium">Сумма:</span> {invoice.amount} ₽</p>
                    <p><span className="font-medium">Контакт:</span> {invoice.contactPerson}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedInvoice(isExpanded ? null : invoice.id)}
                  className="ml-4 text-blue-600 hover:text-blue-700"
                >
                  {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Контактная информация:</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        {company && (
                          <>
                            <p className="font-medium text-blue-600 mb-2">Компания менеджера: {company.name}</p>
                            <p><span className="font-medium">ИНН:</span> {company.inn}</p>
                            <p><span className="font-medium">КПП:</span> {company.kpp}</p>
                            <p><span className="font-medium">Адрес:</span> {company.address}</p>
                            <div className="border-t border-gray-200 my-2 pt-2"></div>
                          </>
                        )}
                        {invoice.website && (
                          <p><span className="font-medium">Сайт:</span> <a href={invoice.website.startsWith('http') ? invoice.website : `https://${invoice.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{invoice.website}</a></p>
                        )}
                        <p><span className="font-medium">Телефон:</span> {invoice.phone}</p>
                        {invoice.email && <p><span className="font-medium">Email:</span> {invoice.email}</p>}
                        <p><span className="font-medium">Дата создания:</span> {new Date(invoice.createdAt).toLocaleString('ru-RU')}</p>
                        {invoice.sentToLogisticsAt && (
                          <p><span className="font-medium">Передан в логистику:</span> {new Date(invoice.sentToLogisticsAt).toLocaleString('ru-RU')}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Изменить статус:</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleStatusChange(invoice.id, 'documents_signed')}
                          className="w-full bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-200 transition text-sm font-medium"
                        >
                          Документы подписаны
                        </button>
                        <button
                          onClick={() => handleStatusChange(invoice.id, 'in_transit')}
                          className="w-full bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                        >
                          Товар в пути
                        </button>
                        <button
                          onClick={() => handleStatusChange(invoice.id, 'received')}
                          className="w-full bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition text-sm font-medium"
                        >
                          Товар получен
                        </button>
                        <button
                          onClick={() => handleStatusChange(invoice.id, 'closed')}
                          className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                        >
                          Закрыть
                        </button>
                        <div className="border-t border-gray-300 pt-2 mt-2">
                          <h4 className="font-bold text-gray-800 mb-2 text-sm">Передать счет:</h4>
                          <select
                            onChange={(e) => {
                              if (e.target.value && confirm(`Передать счет логисту ${users.find(u => u.id === e.target.value)?.name}?`)) {
                                handleTransferInvoice(invoice.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm mb-2"
                            defaultValue=""
                          >
                            <option value="">Выберите логиста...</option>
                            {users.filter(u => u.role === 'logist' && u.id !== user.id).map(logist => (
                              <option key={logist.id} value={logist.id}>{logist.name}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
                        >
                          Срез (удалить из логистики)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Управление тегами */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-bold text-gray-800 mb-3">Теги:</h4>
                    {logistTags.length === 0 ? (
                      <p className="text-sm text-gray-500">У вас пока нет тегов. Создайте теги в "Управление тегами".</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {logistTags.map(tag => {
                          const isActive = invoice.tags && invoice.tags.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              onClick={() => handleToggleInvoiceTag(invoice.id, tag.id)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                isActive
                                  ? 'text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                              }`}
                              style={isActive ? { backgroundColor: tag.color } : {}}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {invoice.logisticsComment && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <h4 className="font-bold text-gray-800 mb-1">Комментарий от менеджера:</h4>
                      <p className="text-sm text-gray-700">{invoice.logisticsComment}</p>
                    </div>
                  )}

                  {invoice.files && invoice.files.length > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Прикреплённые файлы от менеджера:</h4>
                      <div className="space-y-2">
                        {invoice.files.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-gray-600" />
                              <span className="text-sm font-medium text-gray-700">{file.name}</span>
                              <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <a
                              href={`${API_URL.replace('/api', '')}${file.path}`}
                              download={file.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                            >
                              <Download className="w-4 h-4" />
                              Скачать
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">Комментарии:</h4>
                    <div className="space-y-2 mb-3">
                      {invoiceComments.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Комментариев пока нет</p>
                      ) : (
                        invoiceComments.map(comment => (
                          <div key={comment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-medium text-gray-800">{comment.userName}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString('ru-RU')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Добавить комментарий..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(invoice.id)}
                      />
                      <button
                        onClick={() => handleAddComment(invoice.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
              );
            })}
          </div>

          {filteredInvoices.length === 0 && myInvoices.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
              Нет счетов с выбранными фильтрами
            </div>
          )}

          {myInvoices.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
              У вас пока нет счетов в работе. Возьмите счета из доступных выше.
            </div>
          )}
        </div>
      )}

      {/* ДОБАВЛЕНО: Вкладка "Полученные товары" */}
      {activeTab === 'received-goods' && (
        <div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Поиск по поставщику, номеру, контакту..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {invoices.filter(inv => inv.logistId === user.id && inv.status === 'received').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Товар получен</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-600">
                {invoices.filter(inv => inv.logistId === user.id && inv.status === 'closed').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Закрыто</div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReceivedInvoices.map(invoice => {
              const request = requests.find(r => r.id === invoice.requestId);
              const manager = users.find(u => u.id === invoice.managerId);
              const company = companies.find(c => c.id === invoice.companyId);
              const invoiceComments = getInvoiceComments(invoice.id);
              const isExpanded = selectedInvoice === invoice.id;
              
              return (
                <div key={invoice.id} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-xl text-gray-800">{invoice.supplier}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'received' ? 'bg-green-100 text-green-700' :
                          invoice.status === 'sold' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {invoice.status === 'received' ? 'Товар получен' :
                           invoice.status === 'sold' ? '💰 Продан' :
                           'Закрыто'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Заявка:</span> {request?.title || 'Удалена'}</p>
                        <p><span className="font-medium">Компания:</span> {company?.name || 'Не указана'}</p>
                        <p><span className="font-medium">Менеджер:</span> {manager?.name || 'Удалён'}</p>
                        <p><span className="font-medium">Номер счёта:</span> {invoice.number}</p>
                        <p><span className="font-medium">Сумма:</span> {invoice.amount} ₽</p>
                        <p><span className="font-medium">Контакт:</span> {invoice.contactPerson}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedInvoice(isExpanded ? null : invoice.id)}
                      className="ml-4 text-blue-600 hover:text-blue-700"
                    >
                      {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-bold text-gray-800 mb-2">Контактная информация:</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            {company && (
                              <>
                                <p className="font-medium text-blue-600 mb-2">Компания менеджера: {company.name}</p>
                                <p><span className="font-medium">ИНН:</span> {company.inn}</p>
                                <p><span className="font-medium">КПП:</span> {company.kpp}</p>
                                <p><span className="font-medium">Адрес:</span> {company.address}</p>
                                <div className="border-t border-gray-200 my-2 pt-2"></div>
                              </>
                            )}
                            {invoice.website && (
                              <p><span className="font-medium">Сайт:</span> <a href={invoice.website.startsWith('http') ? invoice.website : `https://${invoice.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{invoice.website}</a></p>
                            )}
                            <p><span className="font-medium">Телефон:</span> {invoice.phone}</p>
                            {invoice.email && <p><span className="font-medium">Email:</span> {invoice.email}</p>}
                            <p><span className="font-medium">Дата создания:</span> {new Date(invoice.createdAt).toLocaleString('ru-RU')}</p>
                            {invoice.sentToLogisticsAt && (
                              <p><span className="font-medium">Передан в логистику:</span> {new Date(invoice.sentToLogisticsAt).toLocaleString('ru-RU')}</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-gray-800 mb-2">Управление статусом:</h4>
                          <div className="space-y-2">
                            {invoice.status === 'received' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(invoice.id, 'sold')}
                                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition text-sm font-medium shadow-md"
                                >
                                  💰 Продан
                                </button>
                                <button
                                  onClick={() => handleStatusChange(invoice.id, 'closed')}
                                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                                >
                                  Закрыть счёт
                                </button>
                                <button
                                  onClick={() => handleStatusChange(invoice.id, 'in_transit')}
                                  className="w-full bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                                >
                                  Вернуть в "Товар в пути"
                                </button>
                              </>
                            )}
                            {invoice.status === 'closed' && (
                              <button
                                onClick={() => handleStatusChange(invoice.id, 'received')}
                                className="w-full bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition text-sm font-medium"
                              >
                                Вернуть в "Товар получен"
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
                            >
                              Срез (удалить из логистики)
                            </button>
                          </div>
                        </div>
                      </div>

                      {invoice.logisticsComment && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <h4 className="font-bold text-gray-800 mb-1">Комментарий от менеджера:</h4>
                          <p className="text-sm text-gray-700">{invoice.logisticsComment}</p>
                        </div>
                      )}

                      {invoice.files && invoice.files.length > 0 && (
                        <div>
                          <h4 className="font-bold text-gray-800 mb-2">Прикреплённые файлы от менеджера:</h4>
                          <div className="space-y-2">
                            {invoice.files.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700">{file.name}</span>
                                  <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <a
                                  href={`${API_URL.replace('/api', '')}${file.path}`}
                                  download={file.name}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                >
                                  <Download className="w-4 h-4" />
                                  Скачать
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Галерея фотографий полученных товаров */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-gray-800 flex items-center gap-2">
                            <Camera className="w-5 h-5 text-green-600" />
                            Фотографии полученных товаров ({invoice.receivedGoodsPhotos?.length || 0})
                          </h4>
                          <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium cursor-pointer flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Загрузить фото
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleUploadReceivedGoodsPhotos(invoice.id, e.target.files);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                        </div>

                        {invoice.receivedGoodsPhotos && invoice.receivedGoodsPhotos.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {invoice.receivedGoodsPhotos.map((photo, idx) => (
                              <div key={idx} className="relative group bg-gray-50 border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                                <img
                                  src={`${API_URL.replace('/api', '')}${photo.path}`}
                                  alt={photo.name}
                                  className="w-full h-48 object-cover cursor-pointer"
                                  onClick={() => window.open(`${API_URL.replace('/api', '')}${photo.path}`, '_blank')}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition flex gap-2">
                                    <button
                                      onClick={() => window.open(`${API_URL.replace('/api', '')}${photo.path}`, '_blank')}
                                      className="bg-white text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition"
                                      title="Открыть в полном размере"
                                    >
                                      <Eye className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteReceivedGoodsPhoto(invoice.id, idx)}
                                      className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition"
                                      title="Удалить фото"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="p-2 bg-white border-t border-gray-200">
                                  <p className="text-xs text-gray-600 truncate">{photo.name}</p>
                                  <p className="text-xs text-gray-500">{(photo.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500">Фотографий пока нет. Нажмите "Загрузить фото" чтобы добавить.</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-800 mb-2">Комментарии:</h4>
                        <div className="space-y-2 mb-3">
                          {invoiceComments.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">Комментариев пока нет</p>
                          ) : (
                            invoiceComments.map(comment => (
                              <div key={comment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-sm font-medium text-gray-800">{comment.userName}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.createdAt).toLocaleString('ru-RU')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.text}</p>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Добавить комментарий..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(invoice.id)}
                          />
                          <button
                            onClick={() => handleAddComment(invoice.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredReceivedInvoices.length === 0 && receivedInvoices.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
              Нет счетов с выбранными фильтрами
            </div>
          )}

          {receivedInvoices.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
              У вас пока нет полученных товаров.
            </div>
          )}
        </div>
      )}

      {/* ДОБАВЛЕНО: Вкладка "База всех счетов" */}
      {activeTab === 'all-invoices' && (
        <div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex gap-4 flex-wrap items-center">
              <div className="flex-1 min-w-[300px]">
                <input
                  type="text"
                  placeholder="Поиск: поставщик, ИНН компании, номер счета, контакт, телефон, менеджер, заявка..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-gray-600">
                Найдено: <span className="font-bold text-blue-600">{filteredAllInvoices.length}</span> из {allInvoices.length}
              </div>
            </div>
          </div>

          {searchTerm && filteredAllInvoices.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
              По вашему запросу ничего не найдено
            </div>
          )}

          {!searchTerm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center text-gray-700">
              <Search className="w-12 h-12 mx-auto mb-3 text-blue-600" />
              <p className="text-lg font-medium mb-2">База всех счетов системы</p>
              <p className="text-sm">Введите запрос в поле поиска, чтобы найти нужный счет</p>
              <p className="text-xs text-gray-600 mt-2">Поиск работает по: названию поставщика, ИНН компании, номеру счета, контактным данным, менеджеру, заявке</p>
            </div>
          )}

          <div className="space-y-4">
            {filteredAllInvoices.map(invoice => {
              const request = requests.find(r => r.id === invoice.requestId);
              const manager = users.find(u => u.id === invoice.managerId);
              const company = companies.find(c => c.id === invoice.companyId);
              const logist = invoice.logistId ? users.find(u => u.id === invoice.logistId) : null;
              const invoiceComments = getInvoiceComments(invoice.id);
              const isExpanded = selectedInvoice === invoice.id;
              
              return (
                <div key={invoice.id} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-xl text-gray-800">{invoice.supplier}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'new' ? 'bg-gray-200 text-gray-700' :
                          invoice.status === 'pending_approval' ? 'bg-yellow-200 text-yellow-700' :
                          invoice.status === 'approved' ? 'bg-green-200 text-green-700' :
                          invoice.status === 'rejected' ? 'bg-red-200 text-red-700' :
                          invoice.status === 'in_logistics' ? 'bg-purple-100 text-purple-700' :
                          invoice.status === 'documents_signed' ? 'bg-yellow-100 text-yellow-700' :
                          invoice.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                          invoice.status === 'received' ? 'bg-green-100 text-green-700' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {invoice.status === 'new' ? 'Новый' :
                           invoice.status === 'pending_approval' ? 'На согласовании' :
                           invoice.status === 'approved' ? 'Согласован' :
                           invoice.status === 'rejected' ? 'Срез' :
                           invoice.status === 'in_logistics' ? 'В логистике' :
                           invoice.status === 'documents_signed' ? 'Документы подписаны' :
                           invoice.status === 'in_transit' ? 'Товар в пути' :
                           invoice.status === 'received' ? 'Товар получен' :
                           'Закрыто'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Заявка:</span> {request?.title || 'Удалена'}</p>
                        <p><span className="font-medium">Компания:</span> {company?.name || 'Не указана'}</p>
                        <p><span className="font-medium">Менеджер:</span> {manager?.name || 'Удалён'}</p>
                        <p><span className="font-medium">Номер счёта:</span> {invoice.number}</p>
                        <p><span className="font-medium">Сумма:</span> {invoice.amount} ₽</p>
                        <p><span className="font-medium">Контакт:</span> {invoice.contactPerson}</p>
                        {logist && <p><span className="font-medium">Логист:</span> {logist.name}</p>}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedInvoice(isExpanded ? null : invoice.id)}
                      className="ml-4 text-blue-600 hover:text-blue-700"
                    >
                      {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-bold text-gray-800 mb-2">Информация о компании:</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            {company ? (
                              <>
                                <p className="font-medium text-blue-600 mb-2">{company.name}</p>
                                <p><span className="font-medium">ИНН:</span> {company.inn}</p>
                                <p><span className="font-medium">КПП:</span> {company.kpp}</p>
                                <p><span className="font-medium">Адрес:</span> {company.address}</p>
                                {company.bank && <p><span className="font-medium">Банк:</span> {company.bank}</p>}
                                {company.bik && <p><span className="font-medium">БИК:</span> {company.bik}</p>}
                                {company.account && <p><span className="font-medium">Р/с:</span> {company.account}</p>}
                              </>
                            ) : (
                              <p className="text-gray-500 italic">Компания не указана</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-gray-800 mb-2">Контакты поставщика:</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            {invoice.website && (
                              <p><span className="font-medium">Сайт:</span> <a href={invoice.website.startsWith('http') ? invoice.website : `https://${invoice.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{invoice.website}</a></p>
                            )}
                            <p><span className="font-medium">Телефон:</span> {invoice.phone}</p>
                            {invoice.email && <p><span className="font-medium">Email:</span> {invoice.email}</p>}
                            <p><span className="font-medium">Контактное лицо:</span> {invoice.contactPerson}</p>
                            <div className="border-t border-gray-200 my-2 pt-2"></div>
                            <p><span className="font-medium">Дата создания:</span> {new Date(invoice.createdAt).toLocaleString('ru-RU')}</p>
                            {invoice.sentToLogisticsAt && (
                              <p><span className="font-medium">Передан в логистику:</span> {new Date(invoice.sentToLogisticsAt).toLocaleString('ru-RU')}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {invoice.logisticsComment && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <h4 className="font-bold text-gray-800 mb-1">Комментарий от менеджера:</h4>
                          <p className="text-sm text-gray-700">{invoice.logisticsComment}</p>
                        </div>
                      )}

                      {company && company.documents && company.documents.length > 0 && (
                        <div>
                          <h4 className="font-bold text-gray-800 mb-2">Уставные документы компании:</h4>
                          <div className="space-y-2">
                            {company.documents.map((doc, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700">{doc.name}</span>
                                  <span className="text-xs text-gray-500">({(doc.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <a
                                  href={`${API_URL.replace('/api', '')}${doc.path}`}
                                  download={doc.name}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                >
                                  <Download className="w-4 h-4" />
                                  Скачать
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {invoice.files && invoice.files.length > 0 && (
                        <div>
                          <h4 className="font-bold text-gray-800 mb-2">Прикреплённые файлы счёта от менеджера:</h4>
                          <div className="space-y-2">
                            {invoice.files.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700">{file.name}</span>
                                  <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <a
                                  href={`${API_URL.replace('/api', '')}${file.path}`}
                                  download={file.name}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                >
                                  <Download className="w-4 h-4" />
                                  Скачать
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {invoiceComments.length > 0 && (
                        <div>
                          <h4 className="font-bold text-gray-800 mb-2">Комментарии:</h4>
                          <div className="space-y-2">
                            {invoiceComments.map(comment => (
                              <div key={comment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-sm font-medium text-gray-800">{comment.userName}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.createdAt).toLocaleString('ru-RU')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Модальные окна
const CompanyModal = ({ company, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    inn: company?.inn || '',
    kpp: company?.kpp || '',
    address: company?.address || '',
    bank: company?.bank || '',
    bik: company?.bik || '',
    account: company?.account || '',
    documents: company?.documents || []
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadProgress('');
    
    try {
      const uploadedFiles = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Загрузка ${i + 1} из ${files.length}: ${file.name}`);
        
        try {
          const dataUrl = await readFileAsDataURL(file);
          uploadedFiles.push({
            name: file.name,
            size: file.size,
            data: dataUrl
          });
        } catch (error) {
          alert(error.message);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...uploadedFiles]
      }));
      
      setUploadProgress('Готово!');
      setTimeout(() => setUploadProgress(''), 2000);
    } catch (error) {
      alert('Ошибка загрузки файлов');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {company ? 'Редактировать компанию' : 'Добавить компанию'}
          </h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название компании *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ИНН *</label>
              <input
                type="text"
                value={formData.inn}
                onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">КПП *</label>
              <input
                type="text"
                value={formData.kpp}
                onChange={(e) => setFormData({ ...formData, kpp: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Юридический адрес *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Банк</label>
            <input
              type="text"
              value={formData.bank}
              onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">БИК</label>
              <input
                type="text"
                value={formData.bik}
                onChange={(e) => setFormData({ ...formData, bik: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Расчётный счёт</label>
              <input
                type="text"
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Уставные документы
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploading ? uploadProgress || 'Загрузка...' : 'Нажмите для загрузки файлов'}
                </span>
                <span className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, JPG, PNG (макс. 5MB на файл)</span>
              </label>
            </div>

            {formData.documents.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{doc.name}</span>
                      <span className="text-xs text-gray-500">({(doc.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-600 hover:text-red-700"
                      disabled={uploading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              disabled={uploading}
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RequestModal = ({ request, companies, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: request?.title || '',
    description: request?.description || '',
    companyId: request?.companyId || (companies[0]?.id || '')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-xl">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {request ? 'Редактировать заявку' : 'Создать заявку'}
          </h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название (категория товара) *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Например: Арматура 20 тонн"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Дополнительная информация о заявке"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Компания *</label>
            <select
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserModal = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    login: user?.login || '',
    password: user?.password || '',
    role: user?.role || 'manager'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-xl">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {user ? 'Редактировать пользователя' : 'Добавить пользователя'}
          </h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ФИО *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Логин *</label>
            <input
              type="text"
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль *</label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Роль *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="admin">Администратор</option>
              <option value="manager">Менеджер</option>
              <option value="logist">Логист</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ИСПРАВЛЕНО: Модальное окно для счета теперь поддерживает редактирование
const InvoiceModal = ({ invoice, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    website: invoice?.website || '',
    supplier: invoice?.supplier || '',
    number: invoice?.number || '',
    amount: invoice?.amount || '',
    contactPerson: invoice?.contactPerson || '',
    phone: invoice?.phone || '',
    email: invoice?.email || '',
    logisticsComment: invoice?.logisticsComment || '',
    files: invoice?.files || []
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadProgress('');
    
    try {
      const uploadedFiles = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Загрузка ${i + 1} из ${files.length}: ${file.name}`);
        
        try {
          const dataUrl = await readFileAsDataURL(file);
          uploadedFiles.push({
            name: file.name,
            size: file.size,
            data: dataUrl
          });
        } catch (error) {
          alert(error.message);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...uploadedFiles]
      }));
      
      setUploadProgress('Готово!');
      setTimeout(() => setUploadProgress(''), 2000);
    } catch (error) {
      alert('Ошибка загрузки файлов');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">{invoice ? 'Редактировать счёт' : 'Добавить счёт'}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Сайт / Ссылка на сайт</label>
            <input
              type="text"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="example.com или https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название контрагента (поставщика) *</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Номер счёта *</label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Сумма (₽) *</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Контактное лицо *</label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий для логиста</label>
            <textarea
              value={formData.logisticsComment}
              onChange={(e) => setFormData({ ...formData, logisticsComment: e.target.value })}
              placeholder="Важная информация для отдела логистики"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Прикрепить файлы счёта
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="invoice-file-upload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={uploading}
              />
              <label
                htmlFor="invoice-file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploading ? uploadProgress || 'Загрузка...' : 'Нажмите для загрузки файлов'}
                </span>
                <span className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, JPG, PNG (макс. 5MB на файл)</span>
              </label>
            </div>

            {formData.files.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-600 hover:text-red-700"
                      disabled={uploading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              disabled={uploading}
            >
              {invoice ? 'Сохранить изменения' : 'Добавить счёт'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Главный компонент приложения
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // Восстанавливаем сессию при загрузке
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error('Ошибка восстановления сессии:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const handleLogout = () => {
    // Очищаем localStorage при выходе
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginForm onLogin={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <header className="bg-white border-b-4 border-gradient shadow-2xl sticky top-0 z-40 backdrop-blur-lg bg-opacity-95">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-2xl shadow-xl transform hover:scale-110 transition">
              <Building className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                CRM СИСТЕМА
              </h1>
              <p className="text-sm font-bold text-gray-600">
                {currentUser.role === 'admin' ? '👑 Панель администратора' :
                 currentUser.role === 'manager' ? '💼 Панель менеджера' :
                 '🚚 Панель логистики'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-3 border-2 border-blue-200">
              <p className="font-black text-gray-800">{currentUser.name}</p>
              <p className="text-xs text-gray-600 font-medium">{currentUser.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-2xl transition transform hover:scale-105 flex items-center gap-2 font-bold"
            >
              <LogOut className="w-5 h-5" />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main>
        {currentUser.role === 'admin' && <AdminPanel user={currentUser} />}
        {currentUser.role === 'manager' && <ManagerPanel user={currentUser} />}
        {currentUser.role === 'logist' && <LogisticsPanel user={currentUser} />}
      </main>

      <style jsx>{`
        .border-gradient {
          border-image: linear-gradient(to right, #9333ea, #ec4899, #3b82f6) 1;
        }
      `}</style>
    </div>
  );
}