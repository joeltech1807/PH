/* ═══════════════════════════════════════════════════════════════════════════
   UNIVERSE HEALING HAVEN — Management Dashboard & Patient Record System
   Core Javascript: Database Engine, State Management, Router, Ledgers, Reports
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── INITIAL SEED DATA FOR LOCALSTORAGE ────────────────────────────────
  const SEED_USERS = [
    { id: 'USR001', name: 'Super Admin', username: 'superadmin@healing.com', password: 'password', role: 'Super Admin', status: 'active', mobile: '+91 99999 88888', email: 'superadmin@healing.com', dateCreated: '2026-01-01', lastLogin: '' },
    { id: 'USR002', name: 'Admin One', username: 'admin1@healing.com', password: 'password', role: 'Admin', status: 'active', mobile: '+91 99999 77777', email: 'admin1@healing.com', dateCreated: '2026-01-01', lastLogin: '' },
    { id: 'USR003', name: 'Admin Two', username: 'admin2@healing.com', password: 'password', role: 'Admin', status: 'active', mobile: '+91 99999 66666', email: 'admin2@healing.com', dateCreated: '2026-01-01', lastLogin: '' },
    { id: 'USR004', name: 'Admin Three', username: 'admin3@healing.com', password: 'password', role: 'Admin', status: 'active', mobile: '+91 99999 55555', email: 'admin3@healing.com', dateCreated: '2026-01-01', lastLogin: '' }
  ];

  const SEED_HEALERS = [];
  const SEED_PROTOCOLS = [];
  const SEED_PACKAGES = [];
  const SEED_PATIENTS = [];
  const SEED_ASSIGNMENTS = [];
  const SEED_SESSIONS = [];
  const SEED_PAYMENTS = [];
  const SEED_COMMISSIONS = [];
  const SEED_LOGS = [];

  const SEED_SETTINGS = {
    organizationName: 'Universe Healing Haven',
    contactEmail: 'contact@universehealing.com',
    contactPhone: '+91 72079 60077',
    defaultCommissionRate: 25,
    referralSources: ['Super Admin 1', 'Super Admin 2', 'Super Admin 3', 'Social Media / Website'],
    allowHealersFinancialAccess: false
  };

  // ─── DATABASE STATE MANAGEMENT (LOCALSTORAGE ENGINE) ──────────────────
  class HealingDB {
    constructor() {
      // Force database reset once for clean v4 setup (RBAC alignment)
      if (!localStorage.getItem('hh_db_reset_v4')) {
        this.resetDatabase();
      }

      this.initStorage('users', SEED_USERS);
      this.initStorage('healers', SEED_HEALERS);
      this.initStorage('protocols', SEED_PROTOCOLS);
      this.initStorage('packages', SEED_PACKAGES);
      this.initStorage('patients', SEED_PATIENTS);
      this.initStorage('assignments', SEED_ASSIGNMENTS);
      this.initStorage('sessions', SEED_SESSIONS);
      this.initStorage('payments', SEED_PAYMENTS);
      this.initStorage('commissions', SEED_COMMISSIONS);
      this.initStorage('events', []);
      this.initStorage('contacts', []);
      this.initStorage('logs', SEED_LOGS);
      this.initStorage('settings', SEED_SETTINGS);
      this.initStorage('content', {});
    }

    resetDatabase() {
      const keys = [
        'users', 'healers', 'protocols', 'packages', 'patients', 'assignments',
        'sessions', 'payments', 'commissions', 'events', 'contacts', 'logs', 'settings', 'content'
      ];
      keys.forEach(k => localStorage.removeItem('hh_db_' + k));
      localStorage.setItem('hh_db_reset_v4', 'true');
    }

    initStorage(key, seed) {
      if (!localStorage.getItem('hh_db_' + key)) {
        localStorage.setItem('hh_db_' + key, JSON.stringify(seed));
      }
    }

    get(key) {
      return JSON.parse(localStorage.getItem('hh_db_' + key));
    }

    isWriteBlocked(key) {
      const activeUser = JSON.parse(sessionStorage.getItem('hh_active_user'));
      if (activeUser && activeUser.role === 'Admin') {
        // Only logs are allowed for audit trail login tracking
        if (key === 'logs') return false;
        return true;
      }
      return false;
    }

    save(key, data) {
      if (this.isWriteBlocked(key)) {
        alert('Access Denied: Admins are strictly view-only accounts.');
        throw new Error('Unauthorized DB write attempt.');
      }
      localStorage.setItem('hh_db_' + key, JSON.stringify(data));
    }

    add(key, record) {
      if (this.isWriteBlocked(key)) {
        alert('Access Denied: Admins are strictly view-only accounts.');
        return;
      }
      const data = this.get(key);
      data.push(record);
      this.save(key, data);
      this.logAction(record.id ? `Created ${key} record: ${record.id}` : `Created ${key} record`);
    }

    update(key, id, updatedRecord) {
      if (this.isWriteBlocked(key)) {
        alert('Access Denied: Admins are strictly view-only accounts.');
        return false;
      }
      const data = this.get(key);
      const idx = data.findIndex(r => r.id === id);
      if (idx !== -1) {
        const oldVal = JSON.stringify(data[idx]);
        data[idx] = { ...data[idx], ...updatedRecord };
        this.save(key, data);
        this.logAction(`Updated ${key} record: ${id}`, oldVal, JSON.stringify(data[idx]));
        return true;
      }
      return false;
    }

    delete(key, id) {
      if (this.isWriteBlocked(key)) {
        alert('Access Denied: Admins are strictly view-only accounts.');
        return false;
      }
      const data = this.get(key);
      const filtered = data.filter(r => r.id !== id);
      this.save(key, filtered);
      this.logAction(`Deleted ${key} record: ${id}`);
      return true;
    }

    logAction(details, oldVal = '', newVal = '') {
      const activeUser = JSON.parse(sessionStorage.getItem('hh_active_user')) || { username: 'System', role: 'System' };
      const logs = this.get('logs') || [];
      const timestamp = new Date().toISOString().replace('Z', '+05:30');
      logs.unshift({
        timestamp: timestamp,
        user: activeUser.username,
        role: activeUser.role,
        action: details.split(':')[0],
        details: details,
        oldValue: oldVal,
        newValue: newVal,
        ip: '127.0.0.1 (Local Session)'
      });
      this.save('logs', logs);
    }
  }

  const db = new HealingDB();

  // ─── AUTHENTICATION CONTROL ──────────────────────────────────────────
  function getActiveUser() {
    return JSON.parse(sessionStorage.getItem('hh_active_user'));
  }

  function isSuperAdmin() {
    return state.currentUser && state.currentUser.role === 'Super Admin';
  }

  function login(username, password) {
    const users = db.get('users');
    const user = users.find(u => u.username === username.toLowerCase().trim() && u.password === password);
    if (user) {
      if (user.status !== 'active') return { success: false, msg: 'Account is deactivated' };
      sessionStorage.setItem('hh_active_user', JSON.stringify(user));
      db.update('users', user.id, { lastLogin: new Date().toISOString().split('T')[0] });
      db.logAction(`Login success: ${user.username}`);
      return { success: true, user: user };
    }
    return { success: false, msg: 'Invalid username or password' };
  }

  function logout() {
    const user = getActiveUser();
    if (user) {
      db.logAction(`Logout: ${user.username}`);
    }
    sessionStorage.removeItem('hh_active_user');
    window.location.reload();
  }

  // ─── COMMISSION LEDGER ENGINE ────────────────────────────────────────
  function recordPaymentAndTriggerCommission(payment) {
    db.add('payments', payment);

    // Dynamic Referral Commission calculation
    const settings = db.get('settings');
    const rate = settings.defaultCommissionRate || 25;
    const patient = db.get('patients').find(p => p.id === payment.patientId);

    if (patient) {
      const commId = 'COM' + String(db.get('commissions').length + 1).padStart(3, '0');
      const commission = {
        id: commId,
        patientId: payment.patientId,
        referredBy: patient.referredBy,
        paymentId: payment.id,
        rate: rate,
        commissionableAmount: payment.amountReceived,
        commissionAmount: Math.round(payment.amountReceived * (rate / 100)),
        status: (patient.referredBy === 'Social Media / Website') ? 'pending' : 'accrued',
        paymentDate: '',
        paidBy: '',
        notes: `Auto-generated commission at ${rate}% against payment ${payment.id}.`
      };
      db.add('commissions', commission);
    }
  }

  // ─── MAIN STATE AND ROUTING ENGINE ─────────────────────────────────────
  const state = {
    currentUser: null,
    currentTab: 'dashboard',
    activeSubTab: {
      content: 'homepage',
      operations: 'patients',
      financials: 'payments',
      referrals: 'sources',
      reports: 'operational'
    },
    activePatientId: null, // Patient profile context
    currentPageSizes: {
      patients: 10,
      sessions: 10,
      payments: 10
    },
    currentPageNumbers: {
      patients: 1,
      sessions: 1,
      payments: 1
    }
  };

  // Nav mapping structure aligning to sidebar
  const TABS = [
    'dashboard', 'patients', 'healers', 'assignments', 'protocols', 'sessions',
    'packages', 'payments', 'commissions', 'events', 'contacts', 'reports', 'logs', 'users'
  ];

  function switchTab(tabId) {
    if (!state.currentUser) return;

    // RBAC: Only Super Admin can access Admin Accounts management (users tab)
    if (tabId === 'users' && !isSuperAdmin()) {
      alert('Access Denied: Admin Account Management is restricted to the Super Admin.');
      return;
    }

    state.currentTab = tabId;
    state.activePatientId = null;

    // Toggle sidebar navigation items active state
    document.querySelectorAll('.sidebar-item').forEach(el => {
      el.classList.remove('active');
      if (el.dataset.tab === tabId) el.classList.add('active');
    });

    updateSidebarBadges();
    renderActiveTab();
  }

  // ─── TAB RENDERERS ─────────────────────────────────────────────────────
  function renderActiveTab() {
    const mainContent = document.getElementById('main-content-panel');
    if (!mainContent) return;

    // Standard header template
    let contentHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>${formatTabTitle(state.currentTab)}</h2>
          <div class="page-title-breadcrumbs">
            <span>Admin Portal</span>
            <span class="breadcrumb-separator">&rarr;</span>
            <span style="color:var(--primary); font-weight:600;">${formatTabTitle(state.currentTab)}</span>
          </div>
        </div>
        <div class="page-header-actions" id="page-header-actions-slot"></div>
      </div>
    `;

    mainContent.innerHTML = contentHTML + `<div id="tab-specific-content"></div>`;

    // Render specific layout contents
    switch (state.currentTab) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'patients':
        renderPatients();
        break;
      case 'healers':
        renderHealers();
        break;
      case 'assignments':
        renderAssignments();
        break;
      case 'protocols':
        renderProtocols();
        break;
      case 'sessions':
        renderSessions();
        break;
      case 'packages':
        renderPackages();
        break;
      case 'payments':
        renderPayments();
        break;
      case 'commissions':
        renderCommissions();
        break;
      case 'events':
        renderEventsCMS();
        break;
      case 'contacts':
        renderContacts();
        break;
      case 'reports':
        renderReports();
        break;
      case 'logs':
        renderLogs();
        break;
      case 'users':
        renderUsers();
        break;
    }
  }

  function formatTabTitle(tabId) {
    if (tabId === 'commissions') return 'Referral Commissions';
    if (tabId === 'packages') return 'Packages & Services';
    if (tabId === 'protocols') return 'Healing Protocols';
    if (tabId === 'sessions') return 'Sessions Log';
    if (tabId === 'events') return 'Major Events CMS';
    if (tabId === 'contacts') return 'Contact Messages';
    if (tabId === 'logs') return 'Audit Trail Logs';
    if (tabId === 'users') return 'Admin Accounts Management';
    if (tabId === 'payments') return 'Revenue Ledger';
    if (tabId === 'assignments') return 'Caseload Assignments';
    if (tabId === 'healers') return 'Healers Directory';
    return tabId.charAt(0).toUpperCase() + tabId.slice(1);
  }

  // ─── DASHBOARD SCREEN ──────────────────────────────────────────────────
  function renderDashboard() {
    const slot = document.getElementById('tab-specific-content');
    const actionsSlot = document.getElementById('page-header-actions-slot');

    // Add date range selector to page header actions
    actionsSlot.innerHTML = `
      <select class="form-select" id="dashboard-period" style="min-width: 150px; height: 38px;">
        <option value="this-week">This Week</option>
        <option value="last-week">Last Week</option>
        <option value="this-month" selected>This Month</option>
        <option value="last-month">Last Month</option>
        <option value="this-year">This Year</option>
      </select>
    `;

    // Hook period change
    document.getElementById('dashboard-period').addEventListener('change', () => {
      renderDashboard(); // Re-render dashboard stats dynamically based on selection
    });

    const patients = db.get('patients') || [];
    const sessions = db.get('sessions') || [];
    const payments = db.get('payments') || [];
    const commissions = db.get('commissions') || [];
    const assignments = db.get('assignments') || [];
    const healers = db.get('healers') || [];
    const protocols = db.get('protocols') || [];

    // Check if current user is a Healer
    if (state.currentUser && state.currentUser.role === 'Healer') {
      const healerObj = healers.find(hl => hl.email.toLowerCase() === state.currentUser.email.toLowerCase() || hl.name.toLowerCase() === state.currentUser.name.toLowerCase() || (hl.id && state.currentUser.username.toLowerCase() === hl.email.toLowerCase()));

      const myAssignments = healerObj ? assignments.filter(a => a.primaryHealerId === healerObj.id && a.status === 'active') : [];
      const myPatientIds = myAssignments.map(a => a.patientId);
      const myPatients = patients.filter(p => myPatientIds.includes(p.id));
      const mySessions = healerObj ? sessions.filter(s => s.healerId === healerObj.id) : [];
      const myCompletedSessions = mySessions.filter(s => s.status === 'completed');
      const myScheduledSessions = mySessions.filter(s => s.status === 'scheduled');

      // Healer financial metrics (billing and collected payouts/pays)
      const myPayments = payments.filter(p => myPatientIds.includes(p.patientId));
      const totalBilled = myPayments.reduce((acc, p) => acc + p.totalAmount, 0);
      const totalCollected = myPayments.reduce((acc, p) => acc + p.amountReceived, 0);
      const totalPending = myPayments.reduce((acc, p) => acc + p.balance, 0);

      // Render Healer Dashboard
      slot.innerHTML = `
        <!-- Healer KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-details">
              <span class="kpi-title">Assigned Patients</span>
              <span class="kpi-value">${myPatients.length}</span>
              <span class="kpi-trend neutral">Active caseload</span>
            </div>
            <div class="kpi-icon-wrap blue">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-details">
              <span class="kpi-title">Completed Sessions</span>
              <span class="kpi-value">${myCompletedSessions.length}</span>
              <span class="kpi-trend up">&uarr; ${myScheduledSessions.length} pending</span>
            </div>
            <div class="kpi-icon-wrap green">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-details">
              <span class="kpi-title">Total Revenue Billed</span>
              <span class="kpi-value">₹${totalBilled.toLocaleString()}</span>
              <span class="kpi-trend neutral">Package pricing</span>
            </div>
            <div class="kpi-icon-wrap yellow">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-details">
              <span class="kpi-title">Payments Collected (Pays)</span>
              <span class="kpi-value">₹${totalCollected.toLocaleString()}</span>
              <span class="kpi-trend up">Collected from patients</span>
            </div>
            <div class="kpi-icon-wrap green">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-details">
              <span class="kpi-title">Pending Bills (Balances)</span>
              <span class="kpi-value">₹${totalPending.toLocaleString()}</span>
              <span class="kpi-trend down">Uncollected ledger balance</span>
            </div>
            <div class="kpi-icon-wrap red">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
          </div>
        </div>

        <!-- Healer Tables Grid -->
        <div class="charts-grid" style="grid-template-columns: 1fr; gap:24px; margin-top:24px;">
          <!-- Caseload Assignments Table -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">My Healing Assignments & Caseload</span>
            </div>
            <div class="card-body" style="padding:0;">
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Protocol Assigned</th>
                      <th>Healing Frequency</th>
                      <th>Cases Priority</th>
                      <th>Date Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${myAssignments.length > 0 ? myAssignments.map(asg => {
        const patName = patients.find(p => p.id === asg.patientId)?.name || 'Unknown Patient';
        const protName = protocols.find(pr => pr.id === asg.protocolId)?.name || 'None';
        return `
                        <tr>
                          <td><strong>${patName}</strong></td>
                          <td><span class="badge-category">${protName}</span></td>
                          <td>${asg.frequency || 'N/A'}</td>
                          <td><span class="badge-status ${asg.priority === 'High' ? 'new' : 'completed'}">${asg.priority || 'Normal'}</span></td>
                          <td>${asg.dateAssigned ? asg.dateAssigned.split('T')[0] : 'N/A'}</td>
                        </tr>
                      `;
      }).join('') : '<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--text-muted);">No active healing assignments yet.</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- My Recent Sessions Log -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">My Recent Healing Sessions</span>
            </div>
            <div class="card-body" style="padding:0;">
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Session ID</th>
                      <th>Date</th>
                      <th>Patient Name</th>
                      <th>Protocol Administered</th>
                      <th>Session #</th>
                      <th>Mode</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${mySessions.length > 0 ? mySessions.slice(0, 10).map(s => {
        const patName = patients.find(p => p.id === s.patientId)?.name || 'Unknown Patient';
        const protName = protocols.find(pr => pr.id === s.protocolId)?.name || 'None';
        return `
                        <tr>
                          <td><strong>${s.id}</strong></td>
                          <td>${s.date}</td>
                          <td><strong>${patName}</strong></td>
                          <td>${protName}</td>
                          <td>Session #${s.sessionNumber}</td>
                          <td>${s.mode}</td>
                          <td><span class="badge-status ${s.status}">${s.status}</span></td>
                        </tr>
                      `;
      }).join('') : '<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">No sessions logged yet.</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Stats calculations
    const totalPatients = patients.length;
    const activePatients = patients.filter(p => p.status === 'active').length;
    const completedCases = patients.filter(p => p.status === 'completed').length;
    const newPatients = patients.filter(p => p.status === 'new').length;

    const totalSessions = sessions.filter(s => s.status === 'completed').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.date === todayStr).length;

    const totalCollected = payments.reduce((acc, p) => acc + p.amountReceived, 0);
    const totalPending = payments.reduce((acc, p) => acc + p.balance, 0);

    const commGenerated = commissions.reduce((acc, c) => acc + c.commissionAmount, 0);
    const commPaid = commissions.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.commissionAmount, 0);
    const commPending = commissions.filter(c => c.status === 'accrued' || c.status === 'pending').reduce((acc, c) => acc + c.commissionAmount, 0);

    slot.innerHTML = `
      <!-- KPI Grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-details">
            <span class="kpi-title">Total Patients</span>
            <span class="kpi-value">${totalPatients}</span>
            <span class="kpi-trend up">&uarr; 12% <span style="color:var(--text-muted)">vs last month</span></span>
          </div>
          <div class="kpi-icon-wrap blue">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-details">
            <span class="kpi-title">Active Patients</span>
            <span class="kpi-value">${activePatients}</span>
            <span class="kpi-trend up">&uarr; 4 <span style="color:var(--text-muted)">currently healing</span></span>
          </div>
          <div class="kpi-icon-wrap green">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-details">
            <span class="kpi-title">Today's Sessions</span>
            <span class="kpi-value">${todaySessions}</span>
            <span class="kpi-trend neutral">0 scheduled <span style="color:var(--text-muted)">remaining</span></span>
          </div>
          <div class="kpi-icon-wrap yellow">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-details">
            <span class="kpi-title">Amount Collected</span>
            <span class="kpi-value">₹${totalCollected.toLocaleString()}</span>
            <span class="kpi-trend up">&uarr; 8.4% <span style="color:var(--text-muted)">this month</span></span>
          </div>
          <div class="kpi-icon-wrap green">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-details">
            <span class="kpi-title">Pending Payments</span>
            <span class="kpi-value">₹${totalPending.toLocaleString()}</span>
            <span class="kpi-trend down">&darr; ₹500 <span style="color:var(--text-muted)">uncollected</span></span>
          </div>
          <div class="kpi-icon-wrap red">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-details">
            <span class="kpi-title">Referral Commission</span>
            <span class="kpi-value" style="font-size:1.3rem;">Paid: ₹${commPaid.toLocaleString()}<br><span style="color:var(--text-muted); font-size:0.8rem;">Pend: ₹${commPending.toLocaleString()}</span></span>
            <span class="kpi-trend neutral">Total: ₹${commGenerated.toLocaleString()}</span>
          </div>
          <div class="kpi-icon-wrap blue">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          </div>
        </div>
      </div>

      <!-- Charts & Tables Grid -->
      <div class="charts-grid">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Registration & Session Analytics</span>
          </div>
          <div class="card-body">
            <div class="chart-container" style="display:flex; align-items:center; justify-content:center; background-color:#fafbfe; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
              <canvas id="dashboard-analytics-chart"></canvas>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <span class="card-title">Active Referrals Distribution</span>
          </div>
          <div class="card-body">
            <div class="chart-container" style="display:flex; align-items:center; justify-content:center; background-color:#fafbfe; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
              <canvas id="dashboard-referrals-chart"></canvas>
            </div>
          </div>
      </div>

      <!-- Website Summaries (Events & Contacts) -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:20px; margin-bottom:28px; margin-top:20px;">
        <div class="card" id="widget-contacts-summary" style="cursor:pointer; transition: transform 0.15s ease;">
          <div class="card-header">
            <span class="card-title">Contact Enquiries</span>
            <span class="badge-status new" id="widget-contacts-unread-badge">0 unread</span>
          </div>
          <div class="card-body" style="display:flex; justify-content:space-between; text-align:center; padding: 20px 24px;">
            <div style="flex:1; border-right: 1px solid var(--border-color);">
              <span class="profile-detail-lbl">New Messages</span>
              <strong id="widget-contacts-new" style="font-size:1.4rem; color:var(--info);">0</strong>
            </div>
            <div style="flex:1; border-right: 1px solid var(--border-color);">
              <span class="profile-detail-lbl">In Progress</span>
              <strong id="widget-contacts-progress" style="font-size:1.4rem; color:var(--warning);">0</strong>
            </div>
            <div style="flex:1;">
              <span class="profile-detail-lbl">Total Inbox</span>
              <strong id="widget-contacts-total" style="font-size:1.4rem; color:var(--text-main);">0</strong>
            </div>
          </div>
        </div>

        <div class="card" id="widget-events-summary" style="cursor:pointer; transition: transform 0.15s ease;">
          <div class="card-header">
            <span class="card-title">Website Major Events CMS</span>
            <span class="badge-status completed" id="widget-events-active-badge">0 published</span>
          </div>
          <div class="card-body" style="display:flex; justify-content:space-between; text-align:center; padding: 20px 24px;">
            <div style="flex:1; border-right: 1px solid var(--border-color);">
              <span class="profile-detail-lbl">Published</span>
              <strong id="widget-events-published" style="font-size:1.4rem; color:var(--success);">0</strong>
            </div>
            <div style="flex:1; border-right: 1px solid var(--border-color);">
              <span class="profile-detail-lbl">Drafts</span>
              <strong id="widget-events-drafts" style="font-size:1.4rem; color:var(--text-muted);">0</strong>
            </div>
            <div style="flex:1;">
              <span class="profile-detail-lbl">Total Events</span>
              <strong id="widget-events-total" style="font-size:1.4rem; color:var(--text-main);">0</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Sessions -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Today's Session Schedule</span>
          ${isSuperAdmin() ? '<button class="btn btn-primary-admin btn-sm" id="btn-quick-session">+ Quick Log Session</button>' : ''}
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Healer</th>
                  <th>Protocol</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="dashboard-schedule-tbody">
                <!-- Loaded dynamically -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Render Today's Schedule
    const tbody = document.getElementById('dashboard-schedule-tbody');
    const todaySessionsList = sessions.filter(s => s.date === todayStr);

    if (todaySessionsList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
            No sessions scheduled for today. 
            ${isSuperAdmin() ? '<a href="#" id="link-schedule-session" style="color:var(--primary); font-weight:600; text-decoration:underline;">Log a new session manually &rarr;</a>' : ''}
          </td>
        </tr>
      `;
      if (isSuperAdmin() && document.getElementById('link-schedule-session')) {
        document.getElementById('link-schedule-session').addEventListener('click', (e) => {
          e.preventDefault();
          openLogSessionModal();
        });
      }
    } else {
      todaySessionsList.forEach(s => {
        const pat = patients.find(p => p.id === s.patientId) || { name: 'Unknown' };
        const hlr = db.get('healers').find(h => h.id === s.healerId) || { name: 'Unknown' };
        const prot = db.get('protocols').find(p => p.id === s.protocolId) || { name: 'None' };

        tbody.innerHTML += `
          <tr>
            <td><strong>${s.startTime} - ${s.endTime}</strong></td>
            <td><a href="#" class="view-patient-link" data-id="${s.patientId}" style="color:var(--primary); font-weight:600;">${pat.name}</a></td>
            <td>${hlr.name}</td>
            <td>${prot.name}</td>
            <td>${s.mode}</td>
            <td><span class="badge-status ${s.status}">${s.status}</span></td>
            <td>
              <button class="btn btn-secondary-admin btn-sm view-patient-link" data-id="${s.patientId}">View Profile</button>
            </td>
          </tr>
        `;
      });

      // Wire view links
      document.querySelectorAll('.view-patient-link').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const pid = el.dataset.id;
          openPatientProfile(pid);
        });
      });
    }

    if (isSuperAdmin() && document.getElementById('btn-quick-session')) {
      document.getElementById('btn-quick-session').addEventListener('click', () => {
        openLogSessionModal();
      });
    }

    // Update Contact Messages Summary card metrics
    (function updateContactWidget() {
      const contacts = db.get('contacts') || [];
      const unreadCount = contacts.filter(c => c.status === 'new').length;
      const inProgressCount = contacts.filter(c => c.status === 'in_progress').length;

      const unreadBadge = document.getElementById('widget-contacts-unread-badge');
      if (unreadBadge) unreadBadge.innerText = `${unreadCount} unread`;

      const newEl = document.getElementById('widget-contacts-new');
      if (newEl) newEl.innerText = unreadCount;

      const progressEl = document.getElementById('widget-contacts-progress');
      if (progressEl) progressEl.innerText = inProgressCount;

      const totalEl = document.getElementById('widget-contacts-total');
      if (totalEl) totalEl.innerText = contacts.length;

      const card = document.getElementById('widget-contacts-summary');
      if (card) {
        card.addEventListener('click', () => {
          switchTab('contacts');
        });
      }
    })();

    // Update Website Events Summary card metrics
    (function updateEventWidget() {
      const events = db.get('events') || [];
      const publishedCount = events.filter(e => e.status === 'published').length;
      const draftCount = events.filter(e => e.status === 'draft').length;

      const activeBadge = document.getElementById('widget-events-active-badge');
      if (activeBadge) activeBadge.innerText = `${publishedCount} published`;

      const pubEl = document.getElementById('widget-events-published');
      if (pubEl) pubEl.innerText = publishedCount;

      const draftEl = document.getElementById('widget-events-drafts');
      if (draftEl) draftEl.innerText = draftCount;

      const totalEl = document.querySelectorAll('#widget-events-summary #widget-events-total')[0];
      if (totalEl) totalEl.innerText = events.length;

      const card = document.getElementById('widget-events-summary');
      if (card) {
        card.addEventListener('click', () => {
          switchTab('events');
        });
      }
    })();

    // Initialize Chart.js drawings
    renderDashboardCharts();
  }

  // ─── DASHBOARD CHARTS ──────────────────────────────────────────────────
  function renderDashboardCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') return;

    // Line Chart: Patient registrations & Sessions Completed
    const ctxAnalytics = document.getElementById('dashboard-analytics-chart').getContext('2d');
    new Chart(ctxAnalytics, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [{
          label: 'New Patients',
          data: [1, 2, 4, 3, 5, 6, 8, db.get('patients').length],
          borderColor: '#9b7dd4',
          backgroundColor: 'rgba(155, 125, 212, 0.1)',
          fill: true,
          tension: 0.3
        }, {
          label: 'Completed Sessions',
          data: [2, 5, 8, 12, 18, 22, 28, db.get('sessions').length],
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    // Doughnut Chart: Referral distribution
    const ctxReferrals = document.getElementById('dashboard-referrals-chart').getContext('2d');
    const patients = db.get('patients');

    // Count referrers
    const referrers = ['Super Admin 1', 'Super Admin 2', 'Super Admin 3', 'Social Media / Website'];
    const counts = referrers.map(ref => patients.filter(p => p.referredBy === ref).length);

    new Chart(ctxReferrals, {
      type: 'doughnut',
      data: {
        labels: referrers,
        datasets: [{
          data: counts,
          backgroundColor: ['#9b7dd4', '#b8a0d6', '#e6d0ff', '#64748b'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // ─── PATIENT LIST VIEW ─────────────────────────────────────────────────
  function renderPatients() {
    const slot = document.getElementById('tab-specific-content');
    const actionsSlot = document.getElementById('page-header-actions-slot');

    if (isSuperAdmin()) {
      actionsSlot.innerHTML = `
        <button class="btn btn-primary-admin" id="btn-add-patient-action">+ Add Patient</button>
      `;
    } else {
      actionsSlot.innerHTML = '';
    }

    slot.innerHTML = `
      <!-- Filters bar -->
      <div class="filters-bar">
        <div class="filter-group">
          <label>Global Search</label>
          <input type="text" id="patient-search-query" class="form-input-text" placeholder="ID, Name, Mobile..." style="min-width:240px;">
        </div>
        <div class="filter-group">
          <label>Case Status</label>
          <select id="patient-filter-status" class="form-select">
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="active">Active</option>
            <option value="follow-up">Follow-up</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Referrer</label>
          <select id="patient-filter-referrer" class="form-select">
            <option value="">All Referrers</option>
            <option value="Super Admin 1">Super Admin 1</option>
            <option value="Super Admin 2">Super Admin 2</option>
            <option value="Super Admin 3">Super Admin 3</option>
            <option value="Social Media / Website">Social Media / Website</option>
          </select>
        </div>
        <div class="filters-bar-actions">
          <button class="btn btn-secondary-admin" id="btn-clear-filters">Clear</button>
        </div>
      </div>

      <!-- Main card table container -->
      <div class="card">
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Full Name</th>
                  <th>Mobile</th>
                  <th>Category</th>
                  <th>Referred By</th>
                  <th>Assigned Healer</th>
                  <th>Protocol</th>
                  <th>Status</th>
                  <th>Last Session</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="patients-table-tbody">
                <!-- Dynamically bound -->
              </tbody>
            </table>
          </div>
          
          <!-- Pagination -->
          <div class="table-pagination">
            <span id="patients-pagination-info">Showing 1 to 10 of 100 entries</span>
            <div class="pagination-controls">
              <button class="btn btn-secondary-admin btn-sm" id="btn-patient-prev" disabled>Previous</button>
              <button class="btn btn-secondary-admin btn-sm" id="btn-patient-next" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Hook events
    if (isSuperAdmin() && document.getElementById('btn-add-patient-action')) {
      document.getElementById('btn-add-patient-action').addEventListener('click', () => {
        openAddPatientModal();
      });
    }

    document.getElementById('patient-search-query').addEventListener('input', filterAndRenderPatients);
    document.getElementById('patient-filter-status').addEventListener('change', filterAndRenderPatients);
    document.getElementById('patient-filter-referrer').addEventListener('change', filterAndRenderPatients);

    document.getElementById('btn-clear-filters').addEventListener('click', () => {
      document.getElementById('patient-search-query').value = '';
      document.getElementById('patient-filter-status').value = '';
      document.getElementById('patient-filter-referrer').value = '';
      filterAndRenderPatients();
    });

    filterAndRenderPatients();
  }

  function filterAndRenderPatients() {
    const q = document.getElementById('patient-search-query').value.toLowerCase().trim();
    const status = document.getElementById('patient-filter-status').value;
    const ref = document.getElementById('patient-filter-referrer').value;

    let patients = db.get('patients') || [];
    const assignments = db.get('assignments') || [];
    const healers = db.get('healers') || [];
    const protocols = db.get('protocols') || [];
    const sessions = db.get('sessions') || [];

    // Apply filters
    if (q) {
      patients = patients.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.mobile.includes(q)
      );
    }
    if (status) {
      patients = patients.filter(p => p.status === status);
    }
    if (ref) {
      patients = patients.filter(p => p.referredBy === ref);
    }

    // Sort: newest first
    patients.sort((a, b) => b.registrationDate.localeCompare(a.registrationDate));

    // Page logic
    const tbody = document.getElementById('patients-table-tbody');
    tbody.innerHTML = '';

    if (patients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:32px; color:var(--text-muted);">No patients found matching the active filters.</td></tr>`;
      document.getElementById('patients-pagination-info').innerText = 'Showing 0 to 0 of 0 entries';
      return;
    }

    patients.forEach(p => {
      // Find assignment
      const asg = assignments.find(a => a.patientId === p.id && a.status === 'active');
      let healerName = '<span style="color:var(--text-light); font-style:italic;">Unassigned</span>';
      let protocolName = '<span style="color:var(--text-light); font-style:italic;">None</span>';

      if (asg) {
        const hlr = healers.find(h => h.id === asg.primaryHealerId);
        const prot = protocols.find(pr => pr.id === asg.protocolId);
        if (hlr) healerName = hlr.name;
        if (prot) protocolName = prot.name;
      }

      // Last Session Date
      const patSessions = sessions.filter(s => s.patientId === p.id && s.status === 'completed');
      patSessions.sort((a, b) => b.date.localeCompare(a.date));
      const lastSession = patSessions.length > 0 ? patSessions[0].date : '<span style="color:var(--text-light); font-style:italic;">No sessions</span>';

      const actionsHTML = isSuperAdmin() ? `
        <div class="table-actions" style="justify-content: flex-end;">
          <button class="btn-action-icon view-btn view-patient-profile-link" data-id="${p.id}" title="View Patient Profile">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="btn-action-icon edit-btn edit-patient-link" data-id="${p.id}" title="Edit Patient Details">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-action-icon assign-btn assign-patient-link" data-id="${p.id}" title="Assign Healer/Protocol">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M16 11l2 2 4-4"/></svg>
          </button>
        </div>
      ` : `
        <div style="text-align:right;">
          <button class="btn btn-secondary-admin btn-sm view-patient-profile-link" data-id="${p.id}">View Details</button>
        </div>
      `;

      tbody.innerHTML += `
        <tr>
          <td><strong style="color:var(--primary);">${p.id}</strong></td>
          <td><a href="#" class="view-patient-profile-link" data-id="${p.id}" style="font-weight:600; color:var(--text-main);">${p.name}</a></td>
          <td>${p.mobile}</td>
          <td><span class="badge-category">${p.category}</span></td>
          <td>${p.referredBy}</td>
          <td>${healerName}</td>
          <td>${protocolName}</td>
          <td><span class="badge-status ${p.status}">${p.status}</span></td>
          <td>${lastSession}</td>
          <td style="text-align:right;">
            ${actionsHTML}
          </td>
        </tr>
      `;
    });

    // Pagination text update
    document.getElementById('patients-pagination-info').innerText = `Showing 1 to ${patients.length} of ${patients.length} entries`;

    // Add profile click handlers
    document.querySelectorAll('.view-patient-profile-link').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openPatientProfile(el.dataset.id);
      });
    });

    document.querySelectorAll('.edit-patient-link').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditPatientModal(el.dataset.id);
      });
    });

    document.querySelectorAll('.assign-patient-link').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openAssignHealerModal(el.dataset.id);
      });
    });
  }

  // ─── PATIENT COMPREHENSIVE PROFILE ─────────────────────────────────────
  function openPatientProfile(patientId) {
    state.activePatientId = patientId;
    const mainContent = document.getElementById('main-content-panel');
    if (!mainContent) return;

    const p = db.get('patients').find(pt => pt.id === patientId);
    if (!p) return;

    // Load sub data
    const assignments = db.get('assignments').filter(a => a.patientId === patientId);
    const sessions = db.get('sessions').filter(s => s.patientId === patientId);
    const payments = db.get('payments').filter(pay => pay.patientId === patientId);
    const commissions = db.get('commissions').filter(c => c.patientId === patientId);

    // Active assignment
    const activeAsg = assignments.find(a => a.status === 'active');
    let primaryHealer = 'Unassigned';
    let currentProtocol = 'None';
    if (activeAsg) {
      const h = db.get('healers').find(hl => hl.id === activeAsg.primaryHealerId);
      const pr = db.get('protocols').find(p => p.id === activeAsg.protocolId);
      if (h) primaryHealer = h.name;
      if (pr) currentProtocol = pr.name;
    }

    // Financial balance calculations
    const totalCharged = payments.reduce((acc, pay) => acc + pay.amountCharged, 0);
    const totalReceived = payments.reduce((acc, pay) => acc + pay.amountReceived, 0);
    const outstanding = totalCharged - totalReceived;

    mainContent.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Patient Profile — ${p.name}</h2>
          <div class="page-title-breadcrumbs">
            <span style="cursor:pointer;" id="profile-breadcrumb-back">Patients List</span>
            <span class="breadcrumb-separator">&rarr;</span>
            <span style="color:var(--primary); font-weight:600;">${p.name} (${p.id})</span>
          </div>
        </div>
        <div class="page-header-actions">
          ${isSuperAdmin() ? `
            <button class="btn btn-secondary-admin" id="btn-profile-edit">Edit Details</button>
            <button class="btn btn-primary-admin" id="btn-profile-add-session">+ Log Session</button>
            <button class="btn btn-primary-admin" id="btn-profile-add-payment">+ Add Payment</button>
          ` : ''}
        </div>
      </div>

      <div class="profile-grid">
        <!-- Left Column: Patient Summary -->
        <div class="profile-card">
          <div class="profile-avatar-large">${p.name.charAt(0)}</div>
          <span class="profile-name">${p.name}</span>
          <span class="profile-id">${p.id}</span>
          <div class="profile-category">
            <span class="badge-status ${p.status}">${p.status}</span>
            <span class="badge-category">${p.category}</span>
          </div>
          
          <div class="profile-details-list">
            <div class="profile-detail-item">
              <span class="profile-detail-lbl">Mobile Number</span>
              <span class="profile-detail-val">${p.mobile}</span>
            </div>
            <div class="profile-detail-item">
              <span class="profile-detail-lbl">WhatsApp</span>
              <span class="profile-detail-val">${p.whatsapp || 'Not provided'}</span>
            </div>
            <div class="profile-detail-item">
              <span class="profile-detail-lbl">Email Address</span>
              <span class="profile-detail-val">${p.email || 'Not provided'}</span>
            </div>
            <div class="profile-detail-item">
              <span class="profile-detail-lbl">Address / City</span>
              <span class="profile-detail-val">${p.address || 'Not provided'}</span>
            </div>
            <div class="profile-detail-item">
              <span class="profile-detail-lbl">Registration Date</span>
              <span class="profile-detail-val">${p.registrationDate}</span>
            </div>
            <div class="profile-detail-item">
              <span class="profile-detail-lbl">Referred By</span>
              <span class="profile-detail-val"><strong>${p.referredBy}</strong></span>
            </div>
          </div>
        </div>

        <!-- Right Column: Tabs -->
        <div class="tabs-container">
          <div class="tabs-header">
            <button class="tab-btn active" data-target="tab-overview">Overview</button>
            <button class="tab-btn" data-target="tab-assignment">Assignment & Protocol</button>
            <button class="tab-btn" data-target="tab-history">Healing History (${sessions.length})</button>
            <button class="tab-btn" data-target="tab-payments">Payments & Packages</button>
            <button class="tab-btn" data-target="tab-referral">Referrals & Ledger</button>
          </div>

          <div class="tab-content">
            <!-- OVERVIEW TAB -->
            <div class="tab-pane active" id="tab-overview">
              <h3 style="font-size:1.1rem; font-weight:600; margin-bottom:14px;">Main Health Concern</h3>
              <p style="font-size:0.9rem; color:var(--text-main); background-color:#f8fafc; border:1px solid var(--border-color); padding:16px; border-radius:var(--radius-sm); margin-bottom:24px; line-height:1.6;">
                ${p.concern || 'No health concern recorded.'}
              </p>

              <div class="form-grid" style="margin-top:20px;">
                <div>
                  <h4 class="profile-detail-lbl">Primary Healer</h4>
                  <p style="font-size:0.95rem; font-weight:500;">${primaryHealer}</p>
                </div>
                <div>
                  <h4 class="profile-detail-lbl">Current Active Protocol</h4>
                  <p style="font-size:0.95rem; font-weight:500;">${currentProtocol}</p>
                </div>
                <div class="form-group-full" style="border-top: 1px solid var(--border-color); padding-top:20px;">
                  <h4 class="profile-detail-lbl">General Administrator Notes</h4>
                  <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.6;">${p.notes || 'No administrative notes.'}</p>
                </div>
              </div>
            </div>

            <!-- ASSIGNMENT TAB -->
            <div class="tab-pane" id="tab-assignment">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="font-size:1.1rem; font-weight:600;">Active Alignment Setting</h3>
                ${isSuperAdmin() ? '<button class="btn btn-primary-admin btn-sm" id="btn-reassign-healer">Assign Healer / Modify Protocol</button>' : ''}
              </div>
              
              ${activeAsg ? `
                <div class="form-grid" style="background-color:#fafbfe; border: 1px solid var(--border-color); padding:20px; border-radius:var(--radius-md);">
                  <div>
                    <span class="profile-detail-lbl">Assigned Primary Healer</span>
                    <strong style="font-size:1rem;">${primaryHealer}</strong>
                  </div>
                  <div>
                    <span class="profile-detail-lbl">Additional Auxiliary Healers</span>
                    <span>${activeAsg.additionalHealers.map(id => db.get('healers').find(h => h.id === id)?.name || id).join(', ') || 'None'}</span>
                  </div>
                  <div>
                    <span class="profile-detail-lbl">Active Protocol Standard</span>
                    <strong>${currentProtocol}</strong>
                  </div>
                  <div>
                    <span class="profile-detail-lbl">Assignment Priority</span>
                    <span class="badge-status ${activeAsg.priority.toLowerCase()}">${activeAsg.priority}</span>
                  </div>
                  <div>
                    <span class="profile-detail-lbl">Session Frequency Plan</span>
                    <span>${activeAsg.frequency}</span>
                  </div>
                  <div>
                    <span class="profile-detail-lbl">Assignment Start Date</span>
                    <span>${activeAsg.date}</span>
                  </div>
                  <div class="form-group-full" style="border-top:1px solid var(--border-color); padding-top:12px; margin-top:8px;">
                    <span class="profile-detail-lbl">Assignment Instructions/Notes</span>
                    <p style="font-size:0.85rem; color:var(--text-muted);">${activeAsg.notes || 'None'}</p>
                  </div>
                </div>
              ` : `
                <div style="text-align:center; padding:40px; border:1px dashed var(--border-color); border-radius:var(--radius-md);">
                  <p style="color:var(--text-muted); margin-bottom:16px;">This patient has no active healer assignments or clinical protocols.</p>
                  ${isSuperAdmin() ? '<button class="btn btn-primary-admin" id="btn-assign-healer-empty">Create First Assignment</button>' : ''}
                </div>
              `}
            </div>

            <!-- HEALING HISTORY TAB -->
            <div class="tab-pane" id="tab-history">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="font-size:1.1rem; font-weight:600;">Chronological Healing Session Logs</h3>
                ${isSuperAdmin() ? '<button class="btn btn-primary-admin btn-sm" id="btn-tab-add-session">+ Log New Session</button>' : ''}
              </div>

              ${sessions.length > 0 ? `
                <div class="timeline">
                  ${sessions.map(s => {
      const hlr = db.get('healers').find(h => h.id === s.healerId)?.name || 'Unknown';
      const prot = db.get('protocols').find(p => p.id === s.protocolId)?.name || 'None';
      return `
                      <div class="timeline-item">
                        <div class="timeline-marker success"></div>
                        <div class="timeline-header">
                          <span class="timeline-title">Session #${s.sessionNumber} — ${prot}</span>
                          <span class="timeline-date">${s.date} @ ${s.startTime} (${s.mode})</span>
                        </div>
                        <div class="timeline-body">
                          <p><strong>Healer:</strong> ${hlr} | <strong>Status:</strong> <span class="badge-status ${s.status}">${s.status}</span></p>
                          <p style="margin-top:6px; font-style:italic;">&ldquo;${s.healerNotes || 'No notes logged.'}&rdquo;</p>
                          ${s.patientFeedback ? `<p style="margin-top:4px; font-size:0.78rem; color:var(--text-muted);"><strong>Patient Feedback:</strong> "${s.patientFeedback}"</p>` : ''}
                        </div>
                      </div>
                    `;
    }).join('')}
                </div>
              ` : `
                <div style="text-align:center; padding:40px; border:1px dashed var(--border-color); border-radius:var(--radius-md);">
                  <p style="color:var(--text-muted); margin-bottom:16px;">No healing session records found for this patient.</p>
                  ${isSuperAdmin() ? '<button class="btn btn-primary-admin" id="btn-tab-add-session-empty">+ Log First Session</button>' : ''}
                </div>
              `}
            </div>

            <!-- PAYMENTS TAB -->
            <div class="tab-pane" id="tab-payments">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="font-size:1.1rem; font-weight:600;">Ledger Summary</h3>
                ${isSuperAdmin() ? '<button class="btn btn-primary-admin btn-sm" id="btn-tab-add-payment">+ Record New Payment</button>' : ''}
              </div>

              <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin-bottom:24px;">
                <div style="background-color:#f8fafc; border:1px solid var(--border-color); padding:16px; border-radius:var(--radius-sm); text-align:center;">
                  <span class="profile-detail-lbl">Total Charged</span>
                  <strong style="font-size:1.3rem; color:var(--text-main);">₹${totalCharged.toLocaleString()}</strong>
                </div>
                <div style="background-color:#ecfdf5; border:1px solid #d1fae5; padding:16px; border-radius:var(--radius-sm); text-align:center;">
                  <span class="profile-detail-lbl" style="color:var(--success);">Total Received</span>
                  <strong style="font-size:1.3rem; color:var(--success);">₹${totalReceived.toLocaleString()}</strong>
                </div>
                <div style="background-color:${outstanding > 0 ? '#fef2f2' : '#f8fafc'}; border:1px solid ${outstanding > 0 ? '#fca5a5' : 'var(--border-color)'}; padding:16px; border-radius:var(--radius-sm); text-align:center;">
                  <span class="profile-detail-lbl" style="color:${outstanding > 0 ? 'var(--danger)' : 'var(--text-muted)'};">Outstanding Balance</span>
                  <strong style="font-size:1.3rem; color:${outstanding > 0 ? 'var(--danger)' : 'var(--text-main)'};">₹${outstanding.toLocaleString()}</strong>
                </div>
              </div>

              <h4 style="font-size:0.9rem; font-weight:600; margin-bottom:12px;">Payment Transactions History</h4>
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Date</th>
                      <th>Charged</th>
                      <th>Received</th>
                      <th>Balance</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${payments.length > 0 ? payments.map(pay => `
                      <tr>
                        <td><strong>${pay.id}</strong></td>
                        <td>${pay.date}</td>
                        <td>₹${pay.amountCharged.toLocaleString()}</td>
                        <td>₹${pay.amountReceived.toLocaleString()}</td>
                        <td>₹${pay.balance.toLocaleString()}</td>
                        <td>${pay.paymentMode}</td>
                        <td><span class="badge-status ${pay.status}">${pay.status}</span></td>
                      </tr>
                    `).join('') : '<tr><td colspan="7" style="text-align:center; padding:16px; color:var(--text-muted);">No payment entries.</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- REFERRALS TAB -->
            <div class="tab-pane" id="tab-referral">
              <h3 style="font-size:1.1rem; font-weight:600; margin-bottom:12px;">Referrer Information</h3>
              <p style="font-size:0.88rem; margin-bottom:20px;">
                This patient was acquired through referral source: <strong>${p.referredBy}</strong>. 
                System calculation evaluates commissions for this referrer at <strong>25%</strong> of received payments.
              </p>

              <h4 style="font-size:0.9rem; font-weight:600; margin-bottom:12px;">Commission Ledgers (25% Rate)</h4>
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Commission ID</th>
                      <th>Payment Source</th>
                      <th>Amount Received</th>
                      <th>Commission Earned</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${commissions.length > 0 ? commissions.map(c => `
                      <tr>
                        <td><strong>${c.id}</strong></td>
                        <td>${c.paymentId}</td>
                        <td>₹${c.commissionableAmount.toLocaleString()}</td>
                        <td><strong>₹${c.commissionAmount.toLocaleString()}</strong></td>
                        <td><span class="badge-status ${c.status}">${c.status}</span></td>
                        <td style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${c.notes}</td>
                      </tr>
                    `).join('') : '<tr><td colspan="6" style="text-align:center; padding:16px; color:var(--text-muted);">No commission ledgers recorded.</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Hook tab switches
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.add('active');
      });
    });

    // Wire actions
    document.getElementById('profile-breadcrumb-back').addEventListener('click', () => {
      switchTab('patients');
    });

    const editBtn = document.getElementById('btn-profile-edit');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        openEditPatientModal(patientId);
      });
    }

    const addSessionBtns = ['btn-profile-add-session', 'btn-tab-add-session', 'btn-tab-add-session-empty'];
    addSessionBtns.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => openLogSessionModal(patientId));
    });

    const addPaymentBtns = ['btn-profile-add-payment', 'btn-tab-add-payment'];
    addPaymentBtns.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => openAddPaymentModal(patientId));
    });

    const reassignBtns = ['btn-reassign-healer', 'btn-assign-healer-empty'];
    reassignBtns.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => openAssignHealerModal(patientId));
    });
  }

  // ─── HEALER MANAGEMENT SCREEN ──────────────────────────────────────────
  function renderHealers() {
    const slot = document.getElementById('tab-specific-content');
    const actionsSlot = document.getElementById('page-header-actions-slot');

    if (isSuperAdmin()) {
      actionsSlot.innerHTML = `
        <button class="btn btn-primary-admin" id="btn-add-healer">+ Add Healer Account</button>
      `;
    } else {
      actionsSlot.innerHTML = '';
    }

    const healers = db.get('healers');
    const assignments = db.get('assignments');
    const sessions = db.get('sessions');

    slot.innerHTML = `
      <div class="card">
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Healer ID</th>
                  <th>Healer Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Specialization Areas</th>
                  <th>Active Cases</th>
                  <th>Sessions Logged</th>
                  <th>Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="healers-table-tbody">
                ${healers.map(h => {
      const activeCases = assignments.filter(a => a.primaryHealerId === h.id && a.status === 'active').length;
      const totalSessions = sessions.filter(s => s.healerId === h.id && s.status === 'completed').length;
      return `
                    <tr>
                      <td><strong>${h.id}</strong></td>
                      <td style="font-weight:600;">${h.name}</td>
                      <td>${h.mobile}</td>
                      <td>${h.email}</td>
                      <td style="max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${h.specialization}</td>
                      <td><span class="badge-category">${activeCases} active</span></td>
                      <td><strong>${totalSessions}</strong></td>
                      <td>
                        <select class="form-select healer-status-select btn-sm" data-id="${h.id}" ${!isSuperAdmin() ? 'disabled' : ''} style="padding:4px 8px; font-size:0.75rem; min-width:auto; height:auto;">
                          <option value="active" ${h.status === 'active' ? 'selected' : ''}>Active</option>
                          <option value="inactive" ${h.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                      </td>
                      <td style="text-align:right;">
                        <button class="btn btn-secondary-admin btn-sm btn-edit-healer" data-id="${h.id}">${isSuperAdmin() ? 'Edit Info' : 'View Details'}</button>
                      </td>
                    </tr>
                  `;
    }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    if (isSuperAdmin() && document.getElementById('btn-add-healer')) {
      document.getElementById('btn-add-healer').addEventListener('click', () => {
        openAddHealerModal();
      });
    }

    document.querySelectorAll('.healer-status-select').forEach(sel => {
      sel.addEventListener('change', () => {
        db.update('healers', sel.dataset.id, { status: sel.value });
        renderHealers();
      });
    });

    document.querySelectorAll('.btn-edit-healer').forEach(btn => {
      btn.addEventListener('click', () => {
        openEditHealerModal(btn.dataset.id);
      });
    });
  }

  // ─── ASSIGNMENTS LIST VIEW ─────────────────────────────────────────────
  function renderAssignments() {
    const slot = document.getElementById('tab-specific-content');
    const actionsSlot = document.getElementById('page-header-actions-slot');

    if (isSuperAdmin()) {
      actionsSlot.innerHTML = `
        <button class="btn btn-primary-admin" id="btn-create-assignment">+ Create Assignment</button>
      `;
    } else {
      actionsSlot.innerHTML = '';
    }

    const assignments = db.get('assignments');
    const patients = db.get('patients');
    const healers = db.get('healers');
    const protocols = db.get('protocols');

    slot.innerHTML = `
      <div class="card">
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Assignment ID</th>
                  <th>Patient Name</th>
                  <th>Primary Healer</th>
                  <th>Auxiliary Healers</th>
                  <th>Assigned Protocol</th>
                  <th>Priority</th>
                  <th>Assigned Date</th>
                  <th>Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${assignments.map(a => {
      const pat = patients.find(p => p.id === a.patientId)?.name || 'Unknown';
      const hlr = healers.find(h => h.id === a.primaryHealerId)?.name || 'Unknown';
      const aux = a.additionalHealers.map(id => healers.find(h => h.id === id)?.name || id).join(', ') || 'None';
      const prot = protocols.find(p => p.id === a.protocolId)?.name || 'None';

      return `
                    <tr>
                      <td><strong>${a.id}</strong></td>
                      <td><strong>${pat}</strong></td>
                      <td>${hlr}</td>
                      <td>${aux}</td>
                      <td>${prot}</td>
                      <td><span class="badge-status ${a.priority.toLowerCase()}">${a.priority}</span></td>
                      <td>${a.date}</td>
                      <td>
                        <span class="badge-status ${a.status}">${a.status}</span>
                      </td>
                      <td style="text-align:right;">
                        <button class="btn btn-secondary-admin btn-sm btn-edit-asg" data-id="${a.patientId}">${isSuperAdmin() ? 'Re-assign / Edit' : 'View Details'}</button>
                      </td>
                    </tr>
                  `;
    }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    if (isSuperAdmin() && document.getElementById('btn-create-assignment')) {
      document.getElementById('btn-create-assignment').addEventListener('click', () => {
        openAssignHealerModal();
      });
    }

    document.querySelectorAll('.btn-edit-asg').forEach(btn => {
      btn.addEventListener('click', () => {
        if (isSuperAdmin()) {
          openAssignHealerModal(btn.dataset.id);
        } else {
          openPatientProfile(btn.dataset.id);
        }
      });
    });
  }

  // ─── HEALING PROTOCOLS LIBRARY ─────────────────────────────────────────
  function renderProtocols() {
    const slot = document.getElementById('tab-specific-content');
    const actionsSlot = document.getElementById('page-header-actions-slot');

    if (isSuperAdmin()) {
      actionsSlot.innerHTML = `
        <button class="btn btn-primary-admin" id="btn-create-protocol">+ Add Protocol Standard</button>
      `;
    } else {
      actionsSlot.innerHTML = '';
    }

    const protocols = db.get('protocols');

    slot.innerHTML = `
      <div class="card">
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Protocol ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Target Frequency / Duration</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${protocols.map(p => `
                  <tr>
                    <td><strong>${p.id}</strong></td>
                    <td style="font-weight:600;">${p.name}</td>
                    <td><span class="badge-category">${p.category}</span></td>
                    <td style="max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.description}</td>
                    <td>${p.frequency} (${p.duration})</td>
                    <td>v${p.version}</td>
                    <td><span class="badge-status ${p.status}">${p.status}</span></td>
                    <td style="text-align:right;">
                      <button class="btn btn-secondary-admin btn-sm btn-view-protocol" data-id="${p.id}">View Protocol details</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    if (document.getElementById('btn-create-protocol')) {
      document.getElementById('btn-create-protocol').addEventListener('click', () => {
        openProtocolModal();
      });
    }

    document.querySelectorAll('.btn-view-protocol').forEach(btn => {
      btn.addEventListener('click', () => {
        openProtocolModal(btn.dataset.id);
      });
    });
  }

  // ─── HEALING SESSIONS LEDGER ───────────────────────────────────────────
  function renderSessions() {
    const slot = document.getElementById('tab-specific-content');
    const actionsSlot = document.getElementById('page-header-actions-slot');

    if (isSuperAdmin()) {
      actionsSlot.innerHTML = `
        <button class="btn btn-primary-admin" id="btn-log-session">+ Record Session</button>
      `;
    } else {
      actionsSlot.innerHTML = '';
    }

    let sessions = db.get('sessions') || [];
    const patients = db.get('patients') || [];
    const healers = db.get('healers') || [];
    const protocols = db.get('protocols') || [];

    slot.innerHTML = `
      <div class="card">
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Date</th>
                  <th>Patient Name</th>
                  <th>Responsible Healer</th>
                  <th>Protocol Administered</th>
                  <th>Session #</th>
                  <th>Time Frame</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${sessions.map(s => {
      const pat = patients.find(p => p.id === s.patientId)?.name || 'Unknown';
      const hlr = healers.find(h => h.id === s.healerId)?.name || 'Unknown';
      const prot = protocols.find(p => p.id === s.protocolId)?.name || 'None';
      return `
                    <tr>
                      <td><strong>${s.id}</strong></td>
                      <td>${s.date}</td>
                      <td><strong>${pat}</strong></td>
                      <td>${hlr}</td>
                      <td>${prot}</td>
                      <td>Session #${s.sessionNumber}</td>
                      <td>${s.startTime} - ${s.endTime}</td>
                      <td>${s.mode}</td>
                      <td><span class="badge-status ${s.status}">${s.status}</span></td>
                      <td style="text-align:right;">
                        <button class="btn btn-secondary-admin btn-sm btn-view-session-details" data-id="${s.id}">View Notes</button>
                      </td>
                    </tr>
                  `;
    }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    if (isSuperAdmin() && document.getElementById('btn-log-session')) {
      document.getElementById('btn-log-session').addEventListener('click', () => {
        openLogSessionModal();
      });
    }

    document.querySelectorAll('.btn-view-session-details').forEach(btn => {
      btn.addEventListener('click', () => {
        openSessionNotesModal(btn.dataset.id);
      });
    });
  }

  // ─── PACKAGES AND SERVICES ─────────────────────────────────────────────
  function renderPackages() {
    const slot = document.getElementById('tab-specific-content');
    const actionsSlot = document.getElementById('page-header-actions-slot');

    if (isSuperAdmin()) {
      actionsSlot.innerHTML = `
        <button class="btn btn-primary-admin" id="btn-add-package">+ Add Package Variant</button>
      `;
    } else {
      actionsSlot.innerHTML = '';
    }

    const packages = db.get('packages');

    slot.innerHTML = `
      <div class="card">
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Package ID</th>
                  <th>Name</th>
                  <th>Sessions Limit</th>
                  <th>Price Point</th>
                  <th>Validity Period</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${packages.map(p => `
                  <tr>
                    <td><strong>${p.id}</strong></td>
                    <td style="font-weight:600;">${p.name}</td>
                    <td><span class="badge-category">${p.sessions} Sessions</span></td>
                    <td><strong>₹${p.price.toLocaleString()}</strong></td>
                    <td>${p.validity}</td>
                    <td style="max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.description}</td>
                    <td>
                      <select class="form-select package-status-select btn-sm" data-id="${p.id}" ${!isSuperAdmin() ? 'disabled' : ''} style="padding:4px 8px; font-size:0.75rem; min-width:auto; height:auto;">
                        <option value="active" ${p.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${p.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                      </select>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    if (isSuperAdmin() && document.getElementById('btn-add-package')) {
      document.getElementById('btn-add-package').addEventListener('click', () => {
        openAddPackageModal();
      });
    }

    document.querySelectorAll('.package-status-select').forEach(sel => {
      sel.addEventListener('change', () => {
        db.update('packages', sel.dataset.id, { status: sel.value });
      });
    });
  }

  // ─── PAYMENTS LEDGER SCREEN ────────────────────────────────────────────
  function renderPayments() {
    const slot = document.getElementById('tab-specific-content');
    const actionsSlot = document.getElementById('page-header-actions-slot');

    if (isSuperAdmin()) {
      actionsSlot.innerHTML = `
        <button class="btn btn-primary-admin" id="btn-add-payment">+ Record New Payment</button>
      `;
    } else {
      actionsSlot.innerHTML = '';
    }

    const payments = db.get('payments');
    const patients = db.get('patients');
    const packages = db.get('packages');

    slot.innerHTML = `
      <div class="card">
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Transaction Date</th>
                  <th>Patient Name</th>
                  <th>Package Variant</th>
                  <th>Charged Amt</th>
                  <th>Received Amt</th>
                  <th>Outstanding Balance</th>
                  <th>Payment Mode</th>
                  <th>Recorded By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map(pay => {
      const pat = patients.find(p => p.id === pay.patientId)?.name || 'Unknown';
      const pkg = packages.find(pk => pk.id === pay.packageId)?.name || 'Custom / None';
      return `
                    <tr>
                      <td><strong>${pay.id}</strong></td>
                      <td>${pay.date}</td>
                      <td><strong>${pat}</strong></td>
                      <td>${pkg}</td>
                      <td>₹${pay.amountCharged.toLocaleString()}</td>
                      <td><span style="color:var(--success); font-weight:600;">₹${pay.amountReceived.toLocaleString()}</span></td>
                      <td><span style="color:${pay.balance > 0 ? 'var(--danger)' : 'var(--text-muted)'}; font-weight:600;">₹${pay.balance.toLocaleString()}</span></td>
                      <td>${pay.paymentMode}</td>
                      <td>${pay.collectedBy}</td>
                      <td><span class="badge-status ${pay.status}">${pay.status}</span></td>
                    </tr>
                  `;
    }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    if (isSuperAdmin() && document.getElementById('btn-add-payment')) {
      document.getElementById('btn-add-payment').addEventListener('click', () => {
        openAddPaymentModal();
      });
    }
  }

  // ─── COMMISSIONS LEDGER SCREEN ─────────────────────────────────────────
  function renderCommissions() {
    const slot = document.getElementById('tab-specific-content');
    const commissions = db.get('commissions');
    const patients = db.get('patients');

    const totalPaid = commissions.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.commissionAmount, 0);
    const totalPending = commissions.filter(c => c.status === 'accrued' || c.status === 'pending').reduce((acc, c) => acc + c.commissionAmount, 0);

    slot.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:16px; margin-bottom:24px;">
        <div style="background-color:#ecfdf5; border:1px solid #d1fae5; padding:20px; border-radius:var(--radius-md); text-align:center;">
          <span class="profile-detail-lbl" style="color:var(--success);">Paid Out Commissions</span>
          <strong style="font-size:1.6rem; color:var(--success);">₹${totalPaid.toLocaleString()}</strong>
        </div>
        <div style="background-color:#fffbeb; border:1px solid #fef3c7; padding:20px; border-radius:var(--radius-md); text-align:center;">
          <span class="profile-detail-lbl" style="color:var(--warning);">Accrued / Pending Payouts</span>
          <strong style="font-size:1.6rem; color:var(--warning);">₹${totalPending.toLocaleString()}</strong>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Referral Commission Ledger Entries</span>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Commission ID</th>
                  <th>Patient Name</th>
                  <th>Referred By</th>
                  <th>Payment Ref</th>
                  <th>Comm. Rate</th>
                  <th>Received Amt</th>
                  <th>Payout Amount</th>
                  <th>Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${commissions.map(c => {
      const pat = patients.find(p => p.id === c.patientId)?.name || 'Unknown';
      const actionCol = isSuperAdmin() ? (
        c.status === 'accrued' || c.status === 'pending' ? `
          <button class="btn btn-primary-admin btn-sm btn-payout-commission" data-id="${c.id}">Settle Payout</button>
        ` : `
          <span style="color:var(--text-light); font-size:0.78rem;">Settled</span>
        `
      ) : `
        <span style="color:var(--text-light); font-size:0.78rem; text-transform:capitalize;">${c.status}</span>
      `;
      return `
                    <tr>
                      <td><strong>${c.id}</strong></td>
                      <td><strong>${pat}</strong></td>
                      <td>${c.referredBy}</td>
                      <td>${c.paymentId}</td>
                      <td>${c.rate}%</td>
                      <td>₹${c.commissionableAmount.toLocaleString()}</td>
                      <td><strong>₹${c.commissionAmount.toLocaleString()}</strong></td>
                      <td><span class="badge-status ${c.status}">${c.status}</span></td>
                      <td style="text-align:right;">
                        ${actionCol}
                      </td>
                    </tr>
                  `;
    }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.btn-payout-commission').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm(`Mark referral commission payout ${id} as PAID? This records ledger settlement.`)) {
          const user = getActiveUser();
          db.update('commissions', id, {
            status: 'paid',
            paymentDate: new Date().toISOString().split('T')[0],
            paidBy: user.name
          });
          renderCommissions();
        }
      });
    });
  }

  // ─── REPORTS SCREEN ────────────────────────────────────────────────────
  function renderReports() {
    const slot = document.getElementById('tab-specific-content');

    slot.innerHTML = `
      <div class="reports-grid">
        <div class="report-type-card" data-type="patient">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <h3>Patient Registration Report</h3>
          <p>Registration metrics, categories, referral sources distribution, case transitions and active stats.</p>
          <button class="btn btn-secondary-admin btn-sm" style="align-self:flex-start;">Generate Report</button>
        </div>
        
        <div class="report-type-card" data-type="healing">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <h3>Healer & Session Activity Report</h3>
          <p>Healer assignments, completed vs cancelled session metrics, protocols utilization and caseload benchmarks.</p>
          <button class="btn btn-secondary-admin btn-sm" style="align-self:flex-start;">Generate Report</button>
        </div>
        
        <div class="report-type-card" data-type="financial">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <h3>Financial Collections Summary</h3>
          <p>Revenue charged, payments received, outstanding balance allocations and distribution by payment modes.</p>
          <button class="btn btn-secondary-admin btn-sm" style="align-self:flex-start;">Generate Report</button>
        </div>

        <div class="report-type-card" data-type="referral">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          <h3>Referral & Commissions Ledger</h3>
          <p>Commissions generated per Super Admin, paid commissions, pending ledgers, and source acquisition performance.</p>
          <button class="btn btn-secondary-admin btn-sm" style="align-self:flex-start;">Generate Report</button>
        </div>
      </div>
      
      <!-- Generated Report Viewer (starts empty) -->
      <div id="generated-report-area" style="margin-top:32px;"></div>
    `;

    document.querySelectorAll('.report-type-card').forEach(card => {
      card.addEventListener('click', () => {
        generateSpecificReport(card.dataset.type);
      });
    });
  }

  function generateSpecificReport(type) {
    const area = document.getElementById('generated-report-area');
    if (!area) return;

    let title = '';
    let tableHeaders = [];
    let tableRowsHTML = '';
    let summaryHTML = '';
    let csvData = [];

    const patients = db.get('patients');
    const healers = db.get('healers');
    const sessions = db.get('sessions');
    const payments = db.get('payments');
    const commissions = db.get('commissions');
    const protocols = db.get('protocols');

    if (type === 'patient') {
      title = 'Patient Registration & Status Distribution Report';
      tableHeaders = ['Patient ID', 'Name', 'Category', 'Referred By', 'Status', 'Reg Date'];
      csvData.push(tableHeaders);

      patients.forEach(p => {
        tableRowsHTML += `
          <tr>
            <td><strong>${p.id}</strong></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.category}</td>
            <td>${p.referredBy}</td>
            <td><span class="badge-status ${p.status}">${p.status}</span></td>
            <td>${p.registrationDate}</td>
          </tr>
        `;
        csvData.push([p.id, p.name, p.category, p.referredBy, p.status, p.registrationDate]);
      });

      // Stats breakdown
      summaryHTML = `
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; margin-bottom:20px;">
          <div style="background-color:#fafbfe; padding:12px; border:1px solid var(--border-color); border-radius:4px; text-align:center;">
            <span class="profile-detail-lbl">Total Patients</span>
            <strong style="font-size:1.2rem;">${patients.length}</strong>
          </div>
          <div style="background-color:#ecfdf5; padding:12px; border:1px solid #d1fae5; border-radius:4px; text-align:center;">
            <span class="profile-detail-lbl" style="color:var(--success)">Active Healing</span>
            <strong style="font-size:1.2rem; color:var(--success);">${patients.filter(p => p.status === 'active').length}</strong>
          </div>
          <div style="background-color:#f8fafc; padding:12px; border:1px solid var(--border-color); border-radius:4px; text-align:center;">
            <span class="profile-detail-lbl">Completed / Healed</span>
            <strong style="font-size:1.2rem;">${patients.filter(p => p.status === 'completed').length}</strong>
          </div>
          <div style="background-color:#fee2e2; padding:12px; border:1px solid #fca5a5; border-radius:4px; text-align:center;">
            <span class="profile-detail-lbl" style="color:var(--danger)">Inactive</span>
            <strong style="font-size:1.2rem; color:var(--danger);">${patients.filter(p => p.status === 'inactive' || p.status === 'closed').length}</strong>
          </div>
        </div>
      `;

    } else if (type === 'healing') {
      title = 'Healer Caseload & Session Performance';
      tableHeaders = ['Healer ID', 'Healer Name', 'Specialization', 'Cases Assigned', 'Sessions Logged', 'Status'];
      csvData.push(tableHeaders);

      healers.forEach(h => {
        const assignments = db.get('assignments').filter(a => a.primaryHealerId === h.id && a.status === 'active').length;
        const sCount = sessions.filter(s => s.healerId === h.id && s.status === 'completed').length;
        tableRowsHTML += `
          <tr>
            <td><strong>${h.id}</strong></td>
            <td><strong>${h.name}</strong></td>
            <td>${h.specialization}</td>
            <td><span class="badge-category">${assignments} active cases</span></td>
            <td><strong>${sCount}</strong></td>
            <td><span class="badge-status ${h.status}">${h.status}</span></td>
          </tr>
        `;
        csvData.push([h.id, h.name, h.specialization, `${assignments} active`, sCount, h.status]);
      });

      summaryHTML = `
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin-bottom:20px;">
          <div style="background-color:#fafbfe; padding:12px; border:1px solid var(--border-color); border-radius:4px; text-align:center;">
            <span class="profile-detail-lbl">Total Healers</span>
            <strong style="font-size:1.2rem;">${healers.length}</strong>
          </div>
          <div style="background-color:#fafbfe; padding:12px; border:1px solid var(--border-color); border-radius:4px; text-align:center;">
            <span class="profile-detail-lbl">Total Logged Sessions</span>
            <strong style="font-size:1.2rem;">${sessions.length}</strong>
          </div>
          <div style="background-color:#fafbfe; padding:12px; border:1px solid var(--border-color); border-radius:4px; text-align:center;">
            <span class="profile-detail-lbl">Active Protocols Standard</span>
            <strong style="font-size:1.2rem;">${protocols.filter(p => p.status === 'active').length}</strong>
          </div>
        </div>
      `;

    } else if (type === 'financial') {
      title = 'Revenue Ledger & Collections Summary';
      tableHeaders = ['Payment ID', 'Transaction Date', 'Patient ID', 'Charged', 'Received', 'Balance', 'Method', 'Status'];
      csvData.push(tableHeaders);

      let totalCharged = 0;
      let totalReceived = 0;
      let totalBalance = 0;

      payments.forEach(pay => {
        totalCharged += pay.amountCharged;
        totalReceived += pay.amountReceived;
        totalBalance += pay.balance;

        tableRowsHTML += `
          <tr>
            <td><strong>${pay.id}</strong></td>
            <td>${pay.date}</td>
            <td>${pay.patientId}</td>
            <td>₹${pay.amountCharged.toLocaleString()}</td>
            <td>₹${pay.amountReceived.toLocaleString()}</td>
            <td>₹${pay.balance.toLocaleString()}</td>
            <td>${pay.paymentMode}</td>
            <td><span class="badge-status ${pay.status}">${pay.status}</span></td>
          </tr>
        `;
        csvData.push([pay.id, pay.date, pay.patientId, pay.amountCharged, pay.amountReceived, pay.balance, pay.paymentMode, pay.status]);
      });

      // Total row
      tableRowsHTML += `
        <tr style="background-color:#f1f5f9; font-weight:700;">
          <td colspan="3" style="text-align:right;">TOTAL:</td>
          <td>₹${totalCharged.toLocaleString()}</td>
          <td>₹${totalReceived.toLocaleString()}</td>
          <td>₹${totalBalance.toLocaleString()}</td>
          <td colspan="2"></td>
        </tr>
      `;
      csvData.push(['TOTAL', '', '', totalCharged, totalReceived, totalBalance, '', '']);

      summaryHTML = `
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin-bottom:20px;">
          <div style="background-color:#f8fafc; padding:12px; border:1px solid var(--border-color); border-radius:4px; text-align:center;">
            <span class="profile-detail-lbl">Total Charged</span>
            <strong style="font-size:1.2rem;">₹${totalCharged.toLocaleString()}</strong>
          </div>
          <div style="background-color:#ecfdf5; padding:12px; border:1px solid #d1fae5; border-radius:4px; text-align:center;">
            <span class="profile-detail-lbl" style="color:var(--success)">Total Received</span>
            <strong style="font-size:1.2rem; color:var(--success);">₹${totalReceived.toLocaleString()}</strong>
          </div>
          <div style="background-color:#fee2e2; padding:12px; border:1px solid #fca5a5; border-radius:4px; text-align:center;">
            <span class="profile-detail-lbl" style="color:var(--danger)">Total Balance Outstanding</span>
            <strong style="font-size:1.2rem; color:var(--danger);">₹${totalBalance.toLocaleString()}</strong>
          </div>
        </div>
      `;

    } else if (type === 'referral') {
      title = 'Referrer Activity & Commission Payout Summary';
      tableHeaders = ['Referrer Name', 'Patients Acquired', 'Total Received Revenue', 'Commissions Generated', 'Commissions Paid', 'Outstanding Commissions'];
      csvData.push(tableHeaders);

      const referrers = ['Super Admin 1', 'Super Admin 2', 'Super Admin 3', 'Social Media / Website'];

      referrers.forEach(ref => {
        const refPatients = patients.filter(p => p.referredBy === ref);
        const pIds = refPatients.map(p => p.id);

        // Sum revenue
        const refPayments = payments.filter(pay => pIds.includes(pay.patientId));
        const totalReceived = refPayments.reduce((acc, pay) => acc + pay.amountReceived, 0);

        // Sum commissions
        const refCommissions = commissions.filter(c => pIds.includes(c.patientId));
        const commGenerated = refCommissions.reduce((acc, c) => acc + c.commissionAmount, 0);
        const commPaid = refCommissions.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.commissionAmount, 0);
        const commPending = refCommissions.filter(c => c.status === 'accrued' || c.status === 'pending').reduce((acc, c) => acc + c.commissionAmount, 0);

        tableRowsHTML += `
          <tr>
            <td><strong>${ref}</strong></td>
            <td><span class="badge-category">${refPatients.length} patients</span></td>
            <td>₹${totalReceived.toLocaleString()}</td>
            <td>₹${commGenerated.toLocaleString()}</td>
            <td><span style="color:var(--success); font-weight:600;">₹${commPaid.toLocaleString()}</span></td>
            <td><span style="color:var(--warning); font-weight:600;">₹${commPending.toLocaleString()}</span></td>
          </tr>
        `;
        csvData.push([ref, refPatients.length, totalReceived, commGenerated, commPaid, commPending]);
      });

      const grandTotalCommGenerated = commissions.reduce((acc, c) => acc + c.commissionAmount, 0);
      const grandTotalCommPaid = commissions.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.commissionAmount, 0);
      const grandTotalCommPending = commissions.filter(c => c.status === 'accrued' || c.status === 'pending').reduce((acc, c) => acc + c.commissionAmount, 0);

      summaryHTML = `
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin-bottom:20px;">
          <div style="background-color:#fafbfe; padding:12px; border:1px solid var(--border-color); border-radius:4px; text-align:center;">
            <span class="profile-detail-lbl">Grand Generated Commissions</span>
            <strong style="font-size:1.2rem;">₹${grandTotalCommGenerated.toLocaleString()}</strong>
          </div>
          <div style="background-color:#ecfdf5; padding:12px; border:1px solid #d1fae5; border-radius:4px; text-align:center;">
            <span class="profile-detail-lbl" style="color:var(--success)">Total Settled</span>
            <strong style="font-size:1.2rem; color:var(--success);">₹${grandTotalCommPaid.toLocaleString()}</strong>
          </div>
          <div style="background-color:#fffbeb; padding:12px; border:1px solid #fef3c7; border-radius:4px; text-align:center;">
            <span class="profile-detail-lbl" style="color:var(--warning)">Total Pending Settlement</span>
            <strong style="font-size:1.2rem; color:var(--warning);">₹${grandTotalCommPending.toLocaleString()}</strong>
          </div>
        </div>
      `;
    }

    area.innerHTML = `
      <div class="card">
        <div class="card-header" style="background-color:#fff;">
          <span class="card-title" style="font-size:1.1rem; color:var(--primary); font-weight:700;">${title}</span>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-secondary-admin btn-sm" id="btn-print-report">Print Report</button>
            <button class="btn btn-primary-admin btn-sm" id="btn-export-csv-action">Export CSV</button>
          </div>
        </div>
        <div class="card-body">
          ${summaryHTML}
          <div class="table-responsive">
            <table class="data-table" id="report-view-table">
              <thead>
                <tr>
                  ${tableHeaders.map(th => `<th>${th}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${tableRowsHTML}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Export CSV logic
    document.getElementById('btn-export-csv-action').addEventListener('click', () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvData.forEach(rowArray => {
        let row = rowArray.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
        csvContent += row + "\r\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Universe_Healing_Haven_${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    // Print logic
    document.getElementById('btn-print-report').addEventListener('click', () => {
      window.print();
    });
  }

  // ─── AUDIT LOGS SCREEN ─────────────────────────────────────────────────
  function renderLogs() {
    const slot = document.getElementById('tab-specific-content');
    const logs = db.get('logs');

    slot.innerHTML = `
      <div class="card">
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User Email</th>
                  <th>Account Role</th>
                  <th>Action Category</th>
                  <th>Operational details</th>
                  <th>Terminal Host</th>
                </tr>
              </thead>
              <tbody>
                ${logs.map(l => `
                  <tr>
                    <td><strong>${l.timestamp}</strong></td>
                    <td>${l.user}</td>
                    <td><span class="badge-category">${l.role}</span></td>
                    <td><span style="font-weight:600; color:var(--primary-hover);">${l.action}</span></td>
                    <td style="max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${l.details}">${l.details}</td>
                    <td><span style="color:var(--text-light); font-family:monospace; font-size:0.8rem;">${l.ip}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // ─── ADMIN ACCOUNTS MANAGEMENT SCREEN (SUPER ADMIN ONLY) ───────────────────
  function renderUsers() {
    const slot = document.getElementById('tab-specific-content');
    const actionsSlot = document.getElementById('page-header-actions-slot');

    actionsSlot.innerHTML = '';

    // Filter to only show the 3 Admin accounts (excluding Super Admin)
    const adminUsers = (db.get('users') || []).filter(u => u.role === 'Admin');

    slot.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">System Admin Accounts (3 Accounts)</span>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Username / Email</th>
                  <th>Mobile</th>
                  <th>Account Role</th>
                  <th>Created Date</th>
                  <th>Last Login</th>
                  <th>Account Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${adminUsers.map(u => `
                  <tr>
                    <td><strong>${u.id}</strong></td>
                    <td style="font-weight:600;">${u.name}</td>
                    <td>${u.username}</td>
                    <td>${u.mobile}</td>
                    <td><span class="badge-category" style="background-color:#e0e7ff; color:#3730a3;">${u.role} (View-Only)</span></td>
                    <td>${u.dateCreated}</td>
                    <td>${u.lastLogin || 'Never'}</td>
                    <td>
                      <select class="form-select user-status-select btn-sm" data-id="${u.id}" style="padding:4px 8px; font-size:0.75rem; min-width:auto; height:auto;">
                        <option value="active" ${u.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${u.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                      </select>
                    </td>
                    <td style="text-align:right;">
                      <button class="btn btn-secondary-admin btn-sm btn-edit-user" data-id="${u.id}">Edit Details / Reset Pwd</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.user-status-select').forEach(sel => {
      sel.addEventListener('change', () => {
        db.update('users', sel.dataset.id, { status: sel.value });
      });
    });

    document.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.addEventListener('click', () => {
        openAddUserModal(btn.dataset.id);
      });
    });
  }

  // ─── MAJOR EVENTS CMS RENDERER ──────────────────────────────────────────
  function renderEventsCMS() {
    const slot = document.getElementById('tab-specific-content');
    const actionsSlot = document.getElementById('page-header-actions-slot');

    if (isSuperAdmin()) {
      actionsSlot.innerHTML = '<button class="btn btn-primary-admin" id="btn-cms-add-event">+ Add Event</button>';
    } else {
      actionsSlot.innerHTML = '';
    }

    const events = db.get('events') || [];

    let tbodyHTML = '';
    if (events.length > 0) {
      tbodyHTML = events.map(ev => {
        const imgTag = ev.image ? `<img src="${ev.image}" style="width:50px; height:34px; object-fit:cover; border-radius:4px; border:1px solid var(--border-color);">` : '<span style="color:var(--text-light); font-style:italic;">No image</span>';
        const dateStr = ev.updatedAt || ev.createdAt || 'N/A';
        const formattedDate = dateStr.split('T')[0];
        const statusBadge = ev.status === 'published' ? 'completed' : 'closed';
        const toggleLabel = ev.status === 'published' ? 'Unpublish' : 'Publish';

        const actionsHTML = isSuperAdmin() ? `
          <div class="table-actions" style="justify-content: flex-end;">
            <button class="btn btn-secondary-admin btn-sm btn-cms-preview" data-id="${ev.id}">Preview</button>
            <button class="btn btn-secondary-admin btn-sm btn-cms-edit" data-id="${ev.id}">Edit</button>
            <button class="btn btn-secondary-admin btn-sm btn-cms-toggle" data-id="${ev.id}">${toggleLabel}</button>
            <button class="btn btn-danger-admin btn-sm btn-cms-delete" data-id="${ev.id}">Delete</button>
          </div>
        ` : `
          <div class="table-actions" style="justify-content: flex-end;">
            <button class="btn btn-secondary-admin btn-sm btn-cms-preview" data-id="${ev.id}">Preview</button>
          </div>
        `;

        return `
          <tr>
            <td>${imgTag}</td>
            <td style="font-weight:600; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${ev.title}">${ev.title}</td>
            <td><span class="badge-category">${ev.shortTitle || 'None'}</span></td>
            <td>${ev.date}</td>
            <td><span class="badge-status ${statusBadge}">${ev.status}</span></td>
            <td><strong>${ev.displayOrder || 0}</strong></td>
            <td>${formattedDate}</td>
            <td style="text-align:right;">
              ${actionsHTML}
            </td>
          </tr>
        `;
      }).join('');
    } else {
      tbodyHTML = '<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">No events created yet.</td></tr>';
    }

    slot.innerHTML = `
      <div class="card">
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Event Image</th>
                  <th>Event Title</th>
                  <th>Short Code</th>
                  <th>Event Date</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Last Updated</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${tbodyHTML}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    if (isSuperAdmin() && document.getElementById('btn-cms-add-event')) {
      document.getElementById('btn-cms-add-event').addEventListener('click', () => {
        openEventFormModal(null);
      });
    }

    document.querySelectorAll('.btn-cms-preview').forEach(btn => {
      btn.addEventListener('click', () => {
        openEventPreviewModal(btn.dataset.id);
      });
    });

    if (isSuperAdmin()) {
      document.querySelectorAll('.btn-cms-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          openEventFormModal(btn.dataset.id);
        });
      });

      document.querySelectorAll('.btn-cms-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const ev = events.find(e => e.id === id);
          if (ev) {
            const nextStatus = ev.status === 'published' ? 'unpublished' : 'published';
            db.update('events', id, { status: nextStatus, updatedAt: new Date().toISOString() });
            renderEventsCMS();
          }
        });
      });

      document.querySelectorAll('.btn-cms-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          if (confirm('Are you sure you want to permanently delete this event? This action cannot be undone.')) {
            db.delete('events', id);
            renderEventsCMS();
          }
        });
      });
    }
  }

  function openEventFormModal(eventId = null) {
    const isEdit = !!eventId;
    const events = db.get('events') || [];
    const ev = isEdit ? events.find(e => e.id === eventId) : null;
    const nextId = isEdit ? ev.id : 'EVT' + String(events.length + 1).padStart(3, '0');

    // Parse links
    let posterUrl = "", brochureUrl = "", websiteUrl = "", regUrl = "";
    if (isEdit && ev.links) {
      ev.links.forEach(lk => {
        if (lk.label === 'Poster') posterUrl = lk.url;
        else if (lk.label === 'Brochure') brochureUrl = lk.url;
        else if (lk.label === 'Website') websiteUrl = lk.url;
        else if (lk.label === 'Registration') regUrl = lk.url;
      });
    }

    const titleVal = isEdit ? ev.title : '';
    const shortVal = isEdit ? ev.shortTitle : '';
    const dateVal = isEdit ? ev.date : '';
    const orderVal = isEdit ? ev.displayOrder : '1';
    const statusVal = isEdit ? ev.status : 'draft';
    const descVal = isEdit ? ev.description : '';
    const imageVal = isEdit ? ev.image : '';

    const bodyHTML = `
      <form id="cms-event-form">
        <div class="form-grid">
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin required">Event Title</label>
            <input type="text" id="ev-title" class="form-input-admin" value="${titleVal}" placeholder="e.g. 2nd International Conference on..." required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Short Code / Tag</label>
            <input type="text" id="ev-short" class="form-input-admin" value="${shortVal}" placeholder="e.g. ICSSECC 26" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Event Date String</label>
            <input type="text" id="ev-date" class="form-input-admin" value="${dateVal}" placeholder="e.g. 28th & 29th August 2026" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Display Order</label>
            <input type="number" id="ev-order" class="form-input-admin" value="${orderVal}" min="1" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">CMS Status</label>
            <select id="ev-status" class="form-select-admin" required>
              <option value="draft" ${statusVal === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="published" ${statusVal === 'published' ? 'selected' : ''}>Published</option>
              <option value="unpublished" ${statusVal === 'unpublished' ? 'selected' : ''}>Unpublished</option>
            </select>
          </div>

          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin required">Event Description</label>
            <textarea id="ev-desc" class="form-textarea-admin" required placeholder="Type short event summary...">${descVal}</textarea>
          </div>

          <!-- Links Section -->
          <div class="form-control-wrap">
            <label class="form-label-admin">Poster Website Link</label>
            <input type="text" id="ev-link-poster" class="form-input-admin" value="${posterUrl}" placeholder="e.g. https://...">
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin">Brochure Link</label>
            <input type="text" id="ev-link-brochure" class="form-input-admin" value="${brochureUrl}" placeholder="e.g. https://...">
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin">External Website URL</label>
            <input type="text" id="ev-link-website" class="form-input-admin" value="${websiteUrl}" placeholder="e.g. https://...">
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin">Registration Link</label>
            <input type="text" id="ev-link-reg" class="form-input-admin" value="${regUrl}" placeholder="e.g. https://...">
          </div>

          <!-- Image Management -->
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin">Event Image</label>
            <input type="file" id="ev-image-file" class="form-input-admin" accept="image/*">
            <div style="margin-top:12px; display:flex; align-items:center; gap:16px;">
              <img id="ev-image-preview" src="${imageVal}" style="width:120px; height:80px; object-fit:cover; border-radius:6px; border:1px solid var(--border-color); background-color:#f1f5f9; display:${isEdit && imageVal ? 'block' : 'none'};">
              <span id="ev-image-placeholder-text" style="display:${isEdit && imageVal ? 'none' : 'block'}; font-size:0.8rem; color:var(--text-muted);">No image selected yet. Recommended dimension: 600x400px.</span>
            </div>
          </div>
        </div>
      </form>
    `;

    const titleLabel = isEdit ? `Edit Event Details — ${ev.shortTitle}` : 'Create Website Event Entry';

    showModal(titleLabel, bodyHTML, () => {
      const form = document.getElementById('cms-event-form');
      if (!form.reportValidity()) return false;

      // Construct links array dynamically
      const links = [];
      const posterVal = document.getElementById('ev-link-poster').value.trim();
      const brochureVal = document.getElementById('ev-link-brochure').value.trim();
      const websiteVal = document.getElementById('ev-link-website').value.trim();
      const regVal = document.getElementById('ev-link-reg').value.trim();

      if (posterVal) links.push({ label: 'Poster', url: posterVal, newTab: true });
      if (brochureVal) links.push({ label: 'Brochure', url: brochureVal, newTab: true });
      if (websiteVal) links.push({ label: 'Website', url: websiteVal, newTab: true });
      if (regVal) links.push({ label: 'Registration', url: regVal, newTab: true });

      let imageSrc = document.getElementById('ev-image-preview').getAttribute('src');
      if (!imageSrc || imageSrc.trim() === '' || imageSrc.includes('admin.html')) {
        imageSrc = 'assets/event_placeholder.jpg';
      }

      const eventData = {
        id: nextId,
        title: document.getElementById('ev-title').value.trim(),
        shortTitle: document.getElementById('ev-short').value.trim(),
        date: document.getElementById('ev-date').value.trim(),
        displayOrder: parseInt(document.getElementById('ev-order').value, 10),
        status: document.getElementById('ev-status').value,
        description: document.getElementById('ev-desc').value.trim(),
        links: links,
        image: imageSrc,
        createdAt: isEdit ? ev.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isEdit) {
        db.update('events', eventId, eventData);
      } else {
        db.add('events', eventData);
      }

      closeModal();
      renderEventsCMS();
      return true;
    });

    // Wire file input reader
    const fileEl = document.getElementById('ev-image-file');
    const previewEl = document.getElementById('ev-image-preview');
    const textEl = document.getElementById('ev-image-placeholder-text');

    fileEl.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          previewEl.src = event.target.result;
          previewEl.style.display = 'block';
          textEl.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function openEventPreviewModal(eventId) {
    const ev = db.get('events').find(e => e.id === eventId);
    if (!ev) return;

    let linksHTML = '';
    if (ev.links && ev.links.length) {
      linksHTML = ev.links.map(lk => {
        return '<a href="' + (lk.url || '#') + '" target="_blank" class="btn btn-secondary-admin btn-sm" style="margin-right:8px; border-color:var(--primary); color:var(--primary); pointer-events:none;">' + lk.label + ' &rarr;</a>';
      }).join('');
    }

    const badgeHTML = ev.shortTitle ? `<span class="badge-category" style="background-color:var(--primary-wash); color:var(--primary); font-weight:600; border-radius:4px; margin-bottom:12px; display:inline-block;">${ev.shortTitle}</span>` : '';

    const bodyHTML = `
      <div style="font-family:'Inter', sans-serif; color:var(--text-main); background-color:#fafafa; border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:24px; max-width:800px; margin:0 auto;">
        <span style="font-size:0.75rem; color:var(--primary); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; display:block; margin-bottom:8px;">Live Frontend Preview Simulation</span>
        <div style="display:flex; flex-direction:row; gap:24px; align-items:center; flex-wrap:wrap;">
          <div style="flex:1; min-width:280px;">
            <span style="font-size:0.8rem; color:var(--primary); font-weight:600; text-transform:uppercase;">${ev.date}</span>
            <h3 style="font-size:1.3rem; font-weight:700; color:#1e1b24; margin-top:6px; margin-bottom:8px; font-family:Georgia, serif;">${ev.title}</h3>
            ${badgeHTML}
            <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.6; margin-top:8px;">${ev.description}</p>
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:16px;">
              ${linksHTML || '<span style="font-size:0.78rem; color:var(--text-light); font-style:italic;">No links attached</span>'}
            </div>
          </div>
          <div style="width:240px; flex-shrink:0; aspect-ratio:3/2; overflow:hidden; border-radius:8px; border:1px solid var(--border-color);">
            <img src="${ev.image}" style="width:100%; height:100%; object-fit:cover;">
          </div>
        </div>
      </div>
    `;

    showModal('Event Display Preview — ' + ev.shortTitle, bodyHTML, null, 'Close');
  }


  // ─── CONTACT US ENQUIRIES RENDERER ──────────────────────────────────────
  function renderContacts() {
    const slot = document.getElementById('tab-specific-content');
    const contacts = db.get('contacts') || [];

    let tbodyHTML = '';
    if (contacts.length > 0) {
      tbodyHTML = contacts.map(c => {
        const datePart = c.createdAt.split('T')[0];
        const statusClass = c.status === 'new' ? 'new' : c.status === 'in_progress' ? 'follow-up' : c.status === 'replied' ? 'info' : 'completed';
        const displayStatus = c.status.replace('_', ' ');
        const assignedStaff = c.assignedTo || '<span style="color:var(--text-light); font-style:italic;">Unassigned</span>';

        return `
          <tr>
            <td><strong>${c.id}</strong></td>
            <td>${datePart}</td>
            <td style="font-weight:600;">${c.name}</td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td><span class="badge-category">${c.preferredService}</span></td>
            <td style="text-transform:capitalize;">${c.preferredSessionType}</td>
            <td><span class="badge-status ${statusClass}">${displayStatus}</span></td>
            <td>${assignedStaff}</td>
            <td style="text-align:right;">
              <button class="btn btn-secondary-admin btn-sm btn-view-contact" data-id="${c.id}">View details</button>
            </td>
          </tr>
        `;
      }).join('');
    } else {
      tbodyHTML = '<tr><td colspan="10" style="text-align:center; padding:32px; color:var(--text-muted);">No enquiries in contact inbox yet.</td></tr>';
    }

    slot.innerHTML = `
      <div class="card">
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Enquiry ID</th>
                  <th>Submitted Date</th>
                  <th>Visitor Name</th>
                  <th>Email</th>
                  <th>Phone / WhatsApp</th>
                  <th>Preferred Service</th>
                  <th>Session Type</th>
                  <th>Status</th>
                  <th>Assigned Staff</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${tbodyHTML}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.btn-view-contact').forEach(btn => {
      btn.addEventListener('click', () => {
        openContactDetailsModal(btn.dataset.id);
      });
    });
  }

  function openContactDetailsModal(contactId) {
    const c = db.get('contacts').find(msg => msg.id === contactId);
    if (!c) return;

    // Mark as read automatically when viewed
    if (c.status === 'new') {
      db.update('contacts', contactId, { status: 'read', updatedAt: new Date().toISOString() });
      updateSidebarBadges();
      c.status = 'read';
    }

    const healers = db.get('healers') || [];

    const bodyHTML = `
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div class="form-grid">
          <div>
            <span class="profile-detail-lbl">Enquirer Name</span>
            <strong style="font-size:1rem;">${c.name}</strong>
          </div>
          <div>
            <span class="profile-detail-lbl">Email Address</span>
            <strong>${c.email}</strong>
          </div>
          <div>
            <span class="profile-detail-lbl">Phone / WhatsApp</span>
            <strong>${c.phone}</strong>
          </div>
          <div>
            <span class="profile-detail-lbl">Visitor Location</span>
            <strong>${c.location || 'Not specified'}</strong>
          </div>
          <div>
            <span class="profile-detail-lbl">Requested Service</span>
            <span class="badge-category">${c.preferredService}</span>
          </div>
          <div>
            <span class="profile-detail-lbl">Session Format</span>
            <strong style="text-transform:capitalize;">${c.preferredSessionType}</strong>
          </div>
        </div>

        <div style="border-top:1px solid var(--border-color); padding-top:12px;">
          <span class="profile-detail-lbl">Message Text</span>
          <p style="font-size:0.88rem; color:var(--text-main); background-color:#f8fafc; border:1px solid var(--border-color); padding:12px; border-radius:4px; line-height:1.5;">
            ${c.message || 'None'}
          </p>
        </div>

        <div class="form-grid" style="border-top:1px solid var(--border-color); padding-top:16px;">
          <div class="form-control-wrap">
            <label class="form-label-admin">Process Status</label>
            <select id="msg-status-select" class="form-select-admin" ${!isSuperAdmin() ? 'disabled' : ''}>
              <option value="read" ${c.status === 'read' ? 'selected' : ''}>Read</option>
              <option value="in_progress" ${c.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="replied" ${c.status === 'replied' ? 'selected' : ''}>Replied</option>
              <option value="closed" ${c.status === 'closed' ? 'selected' : ''}>Closed</option>
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin">Assign To Staff / Healer</label>
            <select id="msg-assignee-select" class="form-select-admin" ${!isSuperAdmin() ? 'disabled' : ''}>
              <option value="">Choose Healer</option>
              ${healers.map(h => {
      return `<option value="${h.name}" ${c.assignedTo === h.name ? 'selected' : ''}>${h.name}</option>`;
    }).join('')}
            </select>
          </div>
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin">Internal Admin Notes</label>
            <textarea id="msg-notes" class="form-textarea-admin" ${!isSuperAdmin() ? 'disabled' : ''} placeholder="Type internal staff notes here...">${c.internalNotes || ''}</textarea>
          </div>
        </div>
      </div>
    `;

    const overlayId = 'active-modal-overlay';
    const modalTitle = 'Contact Enquiry details — ' + c.id;

    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = overlayId;

    const footerHTML = isSuperAdmin() ? `
      <div class="modal-footer" style="justify-content: space-between;">
        <button class="btn btn-secondary-admin btn-danger-admin" id="btn-convert-patient" style="background-color:#5b21b6; border-color:#5b21b6; color:#fff;">+ Convert to Patient</button>
        <div style="display:flex; gap:12px;">
          <button class="btn btn-secondary-admin" id="btn-modal-cancel">Cancel</button>
          <button class="btn btn-primary-admin" id="btn-modal-save-contact">Save Details</button>
        </div>
      </div>
    ` : `
      <div class="modal-footer" style="justify-content: flex-end;">
        <button class="btn btn-secondary-admin" id="btn-modal-cancel">Close</button>
      </div>
    `;

    overlay.innerHTML = `
      <div class="modal-container" style="max-width:720px;">
        <div class="modal-header">
          <span class="modal-title">${modalTitle}</span>
          <button class="modal-close" id="btn-modal-close-times">&times;</button>
        </div>
        <div class="modal-body">
          ${bodyHTML}
        </div>
        ${footerHTML}
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btn-modal-close-times').addEventListener('click', closeModal);
    document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);

    if (isSuperAdmin()) {
      document.getElementById('btn-modal-save-contact').addEventListener('click', () => {
        const updatedStatus = document.getElementById('msg-status-select').value;
        const updatedAssignee = document.getElementById('msg-assignee-select').value;
        const updatedNotes = document.getElementById('msg-notes').value.trim();

        db.update('contacts', contactId, {
          status: updatedStatus,
          assignedTo: updatedAssignee,
          internalNotes: updatedNotes,
          updatedAt: new Date().toISOString()
        });

        closeModal();
        renderContacts();
      });

      document.getElementById('btn-convert-patient').addEventListener('click', () => {
        closeModal();
        openConvertPatientForm(c);
      });
    }
  }

  function openConvertPatientForm(contactObj) {
    const settings = db.get('settings') || { referralSources: [] };
    const nextPatientId = 'PTN' + String(db.get('patients').length + 1).padStart(3, '0');

    const selectOptions = settings.referralSources.map(ref => {
      return `<option value="${ref}">${ref}</option>`;
    }).join('');

    const bodyHTML = `
      <form id="convert-patient-form">
        <div class="form-grid">
          <div class="form-control-wrap">
            <label class="form-label-admin">Patient ID</label>
            <input type="text" class="form-input-admin" value="${nextPatientId}" disabled style="background-color:#f1f5f9;">
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Full Name</label>
            <input type="text" id="conv-name" class="form-input-admin" value="${contactObj.name}" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Gender</label>
            <select id="conv-gender" class="form-select-admin" required>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Date of Birth</label>
            <input type="date" id="conv-dob" class="form-input-admin" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Mobile Number</label>
            <input type="tel" id="conv-mobile" class="form-input-admin" value="${contactObj.phone}" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin">WhatsApp Number</label>
            <input type="tel" id="conv-whatsapp" class="form-input-admin" value="${contactObj.whatsapp || contactObj.phone}">
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin">Email Address</label>
            <input type="email" id="conv-email" class="form-input-admin" value="${contactObj.email}">
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required" style="color:var(--danger); font-weight:700;">Referred By</label>
            <select id="conv-referred" class="form-select-admin" required>
              <option value="" selected disabled>-- MUST SELECT REFERRAL SOURCE --</option>
              ${selectOptions}
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Patient Category</label>
            <select id="conv-category" class="form-select-admin" required>
              <option value="New" selected>New</option>
              <option value="Existing">Existing</option>
              <option value="Adult">Adult</option>
              <option value="Senior">Senior</option>
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Case Status</label>
            <select id="conv-status" class="form-select-admin" required>
              <option value="new" selected>New</option>
              <option value="active">Active</option>
            </select>
          </div>
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin">Address / City</label>
            <input type="text" id="conv-address" class="form-input-admin" value="${contactObj.location || ''}">
          </div>
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin required">Main Concern / Reason for Seeking Healing</label>
            <textarea id="conv-concern" class="form-textarea-admin" required>${contactObj.preferredService} — Message: ${contactObj.message || ''}</textarea>
          </div>
        </div>
      </form>
    `;

    showModal('Convert Contact ' + contactObj.id + ' to Patient Record', bodyHTML, () => {
      const form = document.getElementById('convert-patient-form');
      if (!form.reportValidity()) return false;

      const dobStr = document.getElementById('conv-dob').value;
      const age = new Date().getFullYear() - new Date(dobStr).getFullYear();

      const patientData = {
        id: nextPatientId,
        name: document.getElementById('conv-name').value.trim(),
        gender: document.getElementById('conv-gender').value,
        dob: dobStr,
        age: age,
        mobile: document.getElementById('conv-mobile').value.trim(),
        whatsapp: document.getElementById('conv-whatsapp').value.trim(),
        email: document.getElementById('conv-email').value.trim(),
        address: document.getElementById('conv-address').value.trim(),
        category: document.getElementById('conv-category').value,
        referredBy: document.getElementById('conv-referred').value,
        status: document.getElementById('conv-status').value,
        concern: document.getElementById('conv-concern').value.trim(),
        notes: 'Converted from contact enquiry ' + contactObj.id + '.',
        registrationDate: new Date().toISOString().split('T')[0]
      };

      db.add('patients', patientData);

      // Update source contact message to closed/processed status
      db.update('contacts', contactObj.id, {
        status: 'closed',
        internalNotes: (contactObj.internalNotes || '') + '\nConverted to Patient Record ' + nextPatientId + '.',
        updatedAt: new Date().toISOString()
      });

      closeModal();
      switchTab('patients');
      return true;
    }, 'Register Patient');
  }

  // ─── OPERATIONAL FORM MODALS (UI CONTROLS) ─────────────────────────────

  // 1. ADD / EDIT PATIENT MODAL
  function openAddPatientModal() {
    openPatientFormModal(null);
  }

  function openEditPatientModal(patientId) {
    openPatientFormModal(patientId);
  }

  function openPatientFormModal(patientId = null) {
    const isEdit = !!patientId;
    const p = isEdit ? db.get('patients').find(pt => pt.id === patientId) : null;
    const settings = db.get('settings');

    const nextId = isEdit ? p.id : 'PTN' + String(db.get('patients').length + 1).padStart(3, '0');

    const bodyHTML = `
      <form id="patient-form">
        <div class="form-grid">
          <div class="form-control-wrap">
            <label class="form-label-admin">Patient ID</label>
            <input type="text" class="form-input-admin" value="${nextId}" disabled style="background-color:#f1f5f9;">
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Full Name</label>
            <input type="text" id="p-name" class="form-input-admin" value="${isEdit ? p.name : ''}" placeholder="e.g. John Doe" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Gender</label>
            <select id="p-gender" class="form-select-admin" required>
              <option value="">Select Gender</option>
              <option value="Male" ${isEdit && p.gender === 'Male' ? 'selected' : ''}>Male</option>
              <option value="Female" ${isEdit && p.gender === 'Female' ? 'selected' : ''}>Female</option>
              <option value="Other" ${isEdit && p.gender === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Date of Birth</label>
            <input type="date" id="p-dob" class="form-input-admin" value="${isEdit ? p.dob : ''}" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Mobile Number</label>
            <input type="tel" id="p-mobile" class="form-input-admin" value="${isEdit ? p.mobile : ''}" placeholder="e.g. +91 98765 43210" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin">WhatsApp Number</label>
            <input type="tel" id="p-whatsapp" class="form-input-admin" value="${isEdit ? p.whatsapp : ''}" placeholder="e.g. +91 98765 43210">
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin">Email Address</label>
            <input type="email" id="p-email" class="form-input-admin" value="${isEdit ? p.email : ''}" placeholder="e.g. name@example.com">
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Referred By</label>
            <select id="p-referred" class="form-select-admin" required>
              <option value="">Select Referrer Source</option>
              ${settings.referralSources.map(ref => `
                <option value="${ref}" ${isEdit && p.referredBy === ref ? 'selected' : ''}>${ref}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Patient Category</label>
            <select id="p-category" class="form-select-admin" required>
              <option value="New" ${isEdit && p.category === 'New' ? 'selected' : ''}>New</option>
              <option value="Existing" ${isEdit && p.category === 'Existing' ? 'selected' : ''}>Existing</option>
              <option value="Child" ${isEdit && p.category === 'Child' ? 'selected' : ''}>Child</option>
              <option value="Adult" ${isEdit && p.category === 'Adult' ? 'selected' : ''}>Adult</option>
              <option value="Senior" ${isEdit && p.category === 'Senior' ? 'selected' : ''}>Senior</option>
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Case Status</label>
            <select id="p-status" class="form-select-admin" required>
              <option value="new" ${isEdit && p.status === 'new' ? 'selected' : ''}>New</option>
              <option value="active" ${isEdit && p.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="follow-up" ${isEdit && p.status === 'follow-up' ? 'selected' : ''}>Follow-up</option>
              <option value="completed" ${isEdit && p.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="closed" ${isEdit && p.status === 'closed' ? 'selected' : ''}>Closed</option>
              <option value="inactive" ${isEdit && p.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin">Address / City</label>
            <input type="text" id="p-address" class="form-input-admin" value="${isEdit ? p.address : ''}" placeholder="Enter physical address">
          </div>
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin required">Main Concern / Reason for Seeking Healing</label>
            <textarea id="p-concern" class="form-textarea-admin" required placeholder="Type health issue details...">${isEdit ? p.concern : ''}</textarea>
          </div>
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin">General Notes</label>
            <textarea id="p-notes" class="form-textarea-admin" placeholder="Type general notes...">${isEdit ? p.notes : ''}</textarea>
          </div>
        </div>
      </form>
    `;

    showModal(isEdit ? `Edit Patient — ${p.name}` : 'Register New Patient', bodyHTML, () => {
      const form = document.getElementById('patient-form');
      if (!form.reportValidity()) return false;

      // Age calculation
      const dobStr = document.getElementById('p-dob').value;
      const age = new Date().getFullYear() - new Date(dobStr).getFullYear();

      const patientData = {
        id: nextId,
        name: document.getElementById('p-name').value.trim(),
        gender: document.getElementById('p-gender').value,
        dob: dobStr,
        age: age,
        mobile: document.getElementById('p-mobile').value.trim(),
        whatsapp: document.getElementById('p-whatsapp').value.trim(),
        email: document.getElementById('p-email').value.trim(),
        address: document.getElementById('p-address').value.trim(),
        category: document.getElementById('p-category').value,
        referredBy: document.getElementById('p-referred').value,
        status: document.getElementById('p-status').value,
        concern: document.getElementById('p-concern').value.trim(),
        notes: document.getElementById('p-notes').value.trim(),
        registrationDate: isEdit ? p.registrationDate : new Date().toISOString().split('T')[0]
      };

      if (isEdit) {
        db.update('patients', patientId, patientData);
      } else {
        db.add('patients', patientData);
      }

      // Close and refresh
      closeModal();
      if (state.activePatientId) {
        openPatientProfile(state.activePatientId);
      } else {
        switchTab('patients');
      }
      return true;
    });
  }

  // 2. LOG HEALING SESSION MODAL
  function openLogSessionModal(patientId = null) {
    const patients = db.get('patients');
    const healers = db.get('healers');
    const protocols = db.get('protocols');

    let defaultPatientId = patientId || '';
    let defaultHealerId = '';
    let defaultProtocolId = '';
    let defaultSessionNumber = 1;

    // Prefill assignment details if valid patientId is provided
    if (patientId) {
      const asg = db.get('assignments').find(a => a.patientId === patientId && a.status === 'active');
      if (asg) {
        defaultHealerId = asg.primaryHealerId;
        defaultProtocolId = asg.protocolId;
      }
      // Deduce next session number
      const patSessions = db.get('sessions').filter(s => s.patientId === patientId && s.status === 'completed');
      defaultSessionNumber = patSessions.length + 1;
    }

    const bodyHTML = `
      <form id="session-form">
        <div class="form-grid">
          <div class="form-control-wrap">
            <label class="form-label-admin required">Patient</label>
            <select id="s-patient" class="form-select-admin" required ${patientId ? 'disabled' : ''}>
              <option value="">Select Patient</option>
              ${patients.map(p => `
                <option value="${p.id}" ${p.id === defaultPatientId ? 'selected' : ''}>${p.name} (${p.id})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Healer</label>
            <select id="s-healer" class="form-select-admin" required>
              <option value="">Select Healer</option>
              ${healers.map(h => `
                <option value="${h.id}" ${h.id === defaultHealerId ? 'selected' : ''}>${h.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Protocol Standard</label>
            <select id="s-protocol" class="form-select-admin" required>
              <option value="">Select Protocol</option>
              ${protocols.map(p => `
                <option value="${p.id}" ${p.id === defaultProtocolId ? 'selected' : ''}>${p.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Session Number</label>
            <input type="number" id="s-num" class="form-input-admin" value="${defaultSessionNumber}" min="1" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Date</label>
            <input type="date" id="s-date" class="form-input-admin" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Time Frame</label>
            <div style="display:flex; gap:10px;">
              <input type="time" id="s-start" class="form-input-admin" value="10:00" required>
              <input type="time" id="s-end" class="form-input-admin" value="11:00" required>
            </div>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Session Mode</label>
            <select id="s-mode" class="form-select-admin" required>
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Session Status</label>
            <select id="s-status" class="form-select-admin" required>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="no-show">No-show</option>
            </select>
          </div>
          
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin required">Healer Session Notes</label>
            <textarea id="s-notes" class="form-textarea-admin" required placeholder="Type healing observations, energy scans..."></textarea>
          </div>
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin">Patient Feedback</label>
            <textarea id="s-feedback" class="form-textarea-admin" placeholder="Type direct patient quote or subjective feeling..."></textarea>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Follow-up Required</label>
            <select id="s-follow" class="form-select-admin" required>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin">Next Scheduled Session Date</label>
            <input type="date" id="s-next-date" class="form-input-admin">
          </div>
        </div>
      </form>
    `;

    showModal('Log Healing Session Activity', bodyHTML, () => {
      const form = document.getElementById('session-form');
      if (!form.reportValidity()) return false;

      const pId = patientId || document.getElementById('s-patient').value;
      const sId = 'SES' + String(db.get('sessions').length + 1).padStart(3, '0');

      const session = {
        id: sId,
        patientId: pId,
        healerId: document.getElementById('s-healer').value,
        protocolId: document.getElementById('s-protocol').value,
        sessionNumber: parseInt(document.getElementById('s-num').value, 10),
        date: document.getElementById('s-date').value,
        startTime: document.getElementById('s-start').value,
        endTime: document.getElementById('s-end').value,
        mode: document.getElementById('s-mode').value,
        status: document.getElementById('s-status').value,
        healerNotes: document.getElementById('s-notes').value.trim(),
        patientFeedback: document.getElementById('s-feedback').value.trim(),
        followUp: document.getElementById('s-follow').value,
        nextSessionDate: document.getElementById('s-next-date').value
      };

      db.add('sessions', session);

      closeModal();
      if (state.activePatientId) {
        openPatientProfile(state.activePatientId);
      } else {
        switchTab('sessions');
      }
      return true;
    });
  }

  // 3. RECORD PAYMENT MODAL
  function openAddPaymentModal(patientId = null) {
    const patients = db.get('patients');
    const packages = db.get('packages');
    const user = getActiveUser();

    const bodyHTML = `
      <form id="payment-form">
        <div class="form-grid">
          <div class="form-control-wrap">
            <label class="form-label-admin required">Patient</label>
            <select id="p-pay-patient" class="form-select-admin" required ${patientId ? 'disabled' : ''}>
              <option value="">Select Patient</option>
              ${patients.map(p => `
                <option value="${p.id}" ${p.id === patientId ? 'selected' : ''}>${p.name} (${p.id})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Package / Service Variant</label>
            <select id="p-pay-package" class="form-select-admin" required>
              <option value="">Select Package</option>
              ${packages.map(p => `
                <option value="${p.id}">${p.name} (₹${p.price.toLocaleString()})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Amount Charged (₹)</label>
            <input type="number" id="p-pay-charged" class="form-input-admin" min="0" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Amount Received (₹)</label>
            <input type="number" id="p-pay-received" class="form-input-admin" min="0" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Payment Mode</label>
            <select id="p-pay-mode" class="form-select-admin" required>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Payment Date</label>
            <input type="date" id="p-pay-date" class="form-input-admin" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin">Transaction Reference Number / Notes</label>
            <input type="text" id="p-pay-notes" class="form-input-admin" placeholder="e.g. Txn ID: 62517882910">
          </div>
        </div>
      </form>
    `;

    showModal('Record Payment Transaction & Trigger Commissions', bodyHTML, () => {
      const form = document.getElementById('payment-form');
      if (!form.reportValidity()) return false;

      const pId = patientId || document.getElementById('p-pay-patient').value;
      const charged = parseInt(document.getElementById('p-pay-charged').value, 10);
      const received = parseInt(document.getElementById('p-pay-received').value, 10);
      const balance = charged - received;

      let status = 'pending';
      if (balance === 0) status = 'paid';
      else if (received > 0) status = 'partial';

      const payId = 'PAY' + String(db.get('payments').length + 1).padStart(3, '0');

      const payment = {
        id: payId,
        patientId: pId,
        packageId: document.getElementById('p-pay-package').value,
        amountCharged: charged,
        amountReceived: received,
        balance: balance,
        date: document.getElementById('p-pay-date').value,
        paymentMode: document.getElementById('p-pay-mode').value,
        status: status,
        collectedBy: user.name,
        notes: document.getElementById('p-pay-notes').value.trim()
      };

      // Trigger auto-calculated 25% commission ledger creation
      recordPaymentAndTriggerCommission(payment);

      closeModal();
      if (state.activePatientId) {
        openPatientProfile(state.activePatientId);
      } else {
        switchTab('payments');
      }
      return true;
    });

    // Auto-prefill package price upon selecting package option
    document.getElementById('p-pay-package').addEventListener('change', (e) => {
      const pkgId = e.target.value;
      const pkg = packages.find(pk => pk.id === pkgId);
      if (pkg) {
        document.getElementById('p-pay-charged').value = pkg.price;
        document.getElementById('p-pay-received').value = pkg.price;
      }
    });
  }

  // 4. ASSIGN HEALER / PROTOCOL MODAL
  function openAssignHealerModal(patientId = null) {
    const patients = db.get('patients');
    const healers = db.get('healers');
    const protocols = db.get('protocols');

    let activeAsg = null;
    if (patientId) {
      activeAsg = db.get('assignments').find(a => a.patientId === patientId && a.status === 'active');
    }

    const bodyHTML = `
      <form id="assignment-form">
        <div class="form-grid">
          <div class="form-control-wrap">
            <label class="form-label-admin required">Patient</label>
            <select id="a-patient" class="form-select-admin" required ${patientId ? 'disabled' : ''}>
              <option value="">Select Patient</option>
              ${patients.map(p => `
                <option value="${p.id}" ${p.id === patientId ? 'selected' : ''}>${p.name} (${p.id})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Primary Healer</label>
            <select id="a-healer" class="form-select-admin" required>
              <option value="">Select Primary Healer</option>
              ${healers.map(h => `
                <option value="${h.id}" ${activeAsg && activeAsg.primaryHealerId === h.id ? 'selected' : ''}>${h.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Protocol Standard</label>
            <select id="a-protocol" class="form-select-admin" required>
              <option value="">Select Protocol</option>
              ${protocols.map(pr => `
                <option value="${pr.id}" ${activeAsg && activeAsg.protocolId === pr.id ? 'selected' : ''}>${pr.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Assignment Priority</label>
            <select id="a-priority" class="form-select-admin" required>
              <option value="Normal" ${activeAsg && activeAsg.priority === 'Normal' ? 'selected' : ''}>Normal</option>
              <option value="High" ${activeAsg && activeAsg.priority === 'High' ? 'selected' : ''}>High Priority</option>
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Session Frequency Plan</label>
            <input type="text" id="a-freq" class="form-input-admin" value="${activeAsg ? activeAsg.frequency : '2 sessions / week'}" placeholder="e.g. 2 sessions / week" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Assignment Date</label>
            <input type="date" id="a-date" class="form-input-admin" value="${activeAsg ? activeAsg.date : new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin">Auxiliary Healers (Hold Ctrl/Cmd to select multiple)</label>
            <select id="a-aux" class="form-select-admin" multiple style="height:80px;">
              ${healers.map(h => `
                <option value="${h.id}" ${activeAsg && activeAsg.additionalHealers.includes(h.id) ? 'selected' : ''}>${h.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin">Assignment Instructions / Notes</label>
            <textarea id="a-notes" class="form-textarea-admin" placeholder="Type details...">${activeAsg ? activeAsg.notes : ''}</textarea>
          </div>
        </div>
      </form>
    `;

    showModal('Assign Primary Healer & Healing Protocol', bodyHTML, () => {
      const form = document.getElementById('assignment-form');
      if (!form.reportValidity()) return false;

      const pId = patientId || document.getElementById('a-patient').value;

      // Re-assign previous active assignments to re-assigned status
      const allAsg = db.get('assignments');
      allAsg.forEach((a, idx) => {
        if (a.patientId === pId && a.status === 'active') {
          allAsg[idx].status = 'reassigned';
        }
      });
      db.save('assignments', allAsg);

      // Create new assignment
      const nextAsgId = 'ASG' + String(allAsg.length + 1).padStart(3, '0');
      const auxSelected = Array.from(document.getElementById('a-aux').selectedOptions).map(opt => opt.value);

      const assignment = {
        id: nextAsgId,
        patientId: pId,
        primaryHealerId: document.getElementById('a-healer').value,
        additionalHealers: auxSelected,
        protocolId: document.getElementById('a-protocol').value,
        date: document.getElementById('a-date').value,
        frequency: document.getElementById('a-freq').value,
        priority: document.getElementById('a-priority').value,
        status: 'active',
        notes: document.getElementById('a-notes').value.trim()
      };

      db.add('assignments', assignment);

      // Update patient status to active
      const patient = db.get('patients').find(p => p.id === pId);
      if (patient && patient.status === 'new') {
        db.update('patients', pId, { status: 'active' });
      }

      closeModal();
      if (state.activePatientId) {
        openPatientProfile(state.activePatientId);
      } else {
        switchTab('assignments');
      }
      return true;
    });
  }

  // 5. VIEW SESSION NOTES MODAL
  function openSessionNotesModal(sessionId) {
    const s = db.get('sessions').find(ses => ses.id === sessionId);
    if (!s) return;

    const pat = db.get('patients').find(p => p.id === s.patientId)?.name || 'Unknown';
    const hlr = db.get('healers').find(h => h.id === s.healerId)?.name || 'Unknown';
    const prot = db.get('protocols').find(p => p.id === s.protocolId)?.name || 'None';

    const bodyHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="form-grid">
          <div>
            <span class="profile-detail-lbl">Patient</span>
            <strong>${pat}</strong>
          </div>
          <div>
            <span class="profile-detail-lbl">Administering Healer</span>
            <strong>${hlr}</strong>
          </div>
          <div>
            <span class="profile-detail-lbl">Protocol Standard</span>
            <strong>${prot}</strong>
          </div>
          <div>
            <span class="profile-detail-lbl">Session Info</span>
            <strong>Session #${s.sessionNumber} (${s.date})</strong>
          </div>
        </div>
        <div style="border-top:1px solid var(--border-color); padding-top:16px;">
          <span class="profile-detail-lbl">Healer Clinical Notes</span>
          <p style="font-size:0.9rem; color:var(--text-main); line-height:1.6; background-color:#f8fafc; padding:12px; border-radius:4px;">
            ${s.healerNotes}
          </p>
        </div>
        ${s.patientFeedback ? `
          <div>
            <span class="profile-detail-lbl">Patient Feedback & Subjective Feeling</span>
            <p style="font-size:0.9rem; color:var(--text-main); line-height:1.6; background-color:#f8fafc; padding:12px; border-radius:4px; font-style:italic;">
              &ldquo;${s.patientFeedback}&rdquo;
            </p>
          </div>
        ` : ''}
        <div class="form-grid">
          <div>
            <span class="profile-detail-lbl">Follow-up Required?</span>
            <strong>${s.followUp}</strong>
          </div>
          <div>
            <span class="profile-detail-lbl">Next Session Scheduled</span>
            <strong>${s.nextSessionDate || 'None'}</strong>
          </div>
        </div>
      </div>
    `;

    showModal(`Session #${s.sessionNumber} details — ${pat}`, bodyHTML, null, 'Close');
  }

  // 6. ADD / EDIT PROTOCOL MODAL
  function openProtocolModal(protocolId = null) {
    const isEdit = !!protocolId;
    const isSuperAdmin = state.currentUser.role === 'Super Admin';
    const p = isEdit ? db.get('protocols').find(pr => pr.id === protocolId) : null;
    const nextId = isEdit ? p.id : 'PRT' + String(db.get('protocols').length + 1).padStart(3, '0');

    const bodyHTML = `
      <form id="protocol-form">
        <div class="form-grid">
          <div class="form-control-wrap">
            <label class="form-label-admin">Protocol ID</label>
            <input type="text" class="form-input-admin" value="${nextId}" disabled style="background-color:#f1f5f9;">
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Protocol Name</label>
            <input type="text" id="pr-name" class="form-input-admin" value="${isEdit ? p.name : ''}" required ${!isSuperAdmin ? 'disabled' : ''}>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Category</label>
            <input type="text" id="pr-category" class="form-input-admin" value="${isEdit ? p.category : ''}" required ${!isSuperAdmin ? 'disabled' : ''}>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Status</label>
            <select id="pr-status" class="form-select-admin" required ${!isSuperAdmin ? 'disabled' : ''}>
              <option value="active" ${isEdit && p.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="inactive" ${isEdit && p.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Recommended Frequency</label>
            <input type="text" id="pr-freq" class="form-input-admin" value="${isEdit ? p.frequency : ''}" required ${!isSuperAdmin ? 'disabled' : ''}>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Expected Duration</label>
            <input type="text" id="pr-dur" class="form-input-admin" value="${isEdit ? p.duration : ''}" required ${!isSuperAdmin ? 'disabled' : ''}>
          </div>
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin required">Description</label>
            <textarea id="pr-desc" class="form-textarea-admin" required ${!isSuperAdmin ? 'disabled' : ''}>${isEdit ? p.description : ''}</textarea>
          </div>
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin required">Instructions / Steps</label>
            <textarea id="pr-steps" class="form-textarea-admin" style="min-height:120px;" required ${!isSuperAdmin ? 'disabled' : ''}>${isEdit ? p.steps : ''}</textarea>
          </div>
        </div>
      </form>
    `;

    showModal(isEdit ? `Protocol Standard — ${p.name}` : 'Create Protocol Standard', bodyHTML, isSuperAdmin ? () => {
      const form = document.getElementById('protocol-form');
      if (!form.reportValidity()) return false;

      const protocolData = {
        id: nextId,
        name: document.getElementById('pr-name').value.trim(),
        category: document.getElementById('pr-category').value.trim(),
        description: document.getElementById('pr-desc').value.trim(),
        steps: document.getElementById('pr-steps').value.trim(),
        frequency: document.getElementById('pr-freq').value.trim(),
        duration: document.getElementById('pr-dur').value.trim(),
        status: document.getElementById('pr-status').value,
        version: isEdit ? String((parseFloat(p.version) + 0.1).toFixed(1)) : '1.0',
        createdBy: isEdit ? p.createdBy : state.currentUser.name,
        updatedBy: state.currentUser.name
      };

      if (isEdit) {
        db.update('protocols', protocolId, protocolData);
      } else {
        db.add('protocols', protocolData);
      }

      closeModal();
      renderProtocols();
      return true;
    } : null, isSuperAdmin ? 'Save Protocol' : 'Close');
  }

  // 7. ADD / EDIT HEALER MODAL
  function openAddHealerModal() {
    openHealerFormModal(null);
  }

  function openEditHealerModal(healerId) {
    openHealerFormModal(healerId);
  }

  function openHealerFormModal(healerId = null) {
    const isEdit = !!healerId;
    const h = isEdit ? db.get('healers').find(hl => hl.id === healerId) : null;
    const nextId = isEdit ? h.id : 'HLR' + String(db.get('healers').length + 1).padStart(3, '0');
    const u = isEdit && h ? db.get('users').find(usr => usr.email.toLowerCase() === h.email.toLowerCase() || usr.username.toLowerCase() === h.email.toLowerCase()) : null;

    const bodyHTML = `
      <form id="healer-form">
        <div class="form-grid">
          <div class="form-control-wrap">
            <label class="form-label-admin">Healer ID</label>
            <input type="text" class="form-input-admin" value="${nextId}" disabled style="background-color:#f1f5f9;">
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Full Name</label>
            <input type="text" id="h-name" class="form-input-admin" value="${isEdit ? h.name : ''}" placeholder="e.g. Sarah Connor" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Mobile Number</label>
            <input type="tel" id="h-mobile" class="form-input-admin" value="${isEdit ? h.mobile : ''}" placeholder="e.g. +91 98765 43210" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Email Address</label>
            <input type="email" id="h-email" class="form-input-admin" value="${isEdit ? h.email : ''}" placeholder="e.g. sarah@healing.com" required>
          </div>
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin required">Specialization Areas (comma-separated)</label>
            <input type="text" id="h-spec" class="form-input-admin" value="${isEdit ? h.specialization : ''}" placeholder="e.g. Reiki, Kundalini Yoga Nidra, Breathwork" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Account Status</label>
            <select id="h-status" class="form-select-admin" required>
              <option value="active" ${isEdit && h.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="inactive" ${isEdit && h.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Portal Username</label>
            <input type="text" id="h-username" class="form-input-admin" value="${isEdit && u ? u.username : ''}" placeholder="e.g. sarah123" required>
          </div>
          <div class="form-control-wrap" style="position: relative;">
            <label class="form-label-admin required">Portal Password</label>
            <div style="position: relative; display: flex; align-items: center;">
              <input type="password" id="h-password" class="form-input-admin" value="${isEdit && u ? u.password : 'password'}" required style="padding-right: 40px; width: 100%;">
              <button type="button" id="btn-toggle-h-password" style="position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; padding: 0;">
                <svg id="svg-toggle-h-password" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </form>
    `;

    showModal(isEdit ? `Edit Healer Account — ${h.name}` : 'Register New Healer Account', bodyHTML, () => {
      const form = document.getElementById('healer-form');
      if (!form.reportValidity()) return false;

      const healerData = {
        id: nextId,
        name: document.getElementById('h-name').value.trim(),
        mobile: document.getElementById('h-mobile').value.trim(),
        email: document.getElementById('h-email').value.trim(),
        specialization: document.getElementById('h-spec').value.trim(),
        status: document.getElementById('h-status').value,
        dateJoined: isEdit ? h.dateJoined : new Date().toISOString().split('T')[0]
      };

      const usernameVal = document.getElementById('h-username').value.trim().toLowerCase();
      const passwordVal = document.getElementById('h-password').value;

      if (isEdit) {
        db.update('healers', healerId, healerData);
        if (u) {
          db.update('users', u.id, {
            name: healerData.name,
            username: usernameVal,
            password: passwordVal,
            mobile: healerData.mobile,
            email: healerData.email
          });
        }
      } else {
        db.add('healers', healerData);
        const uId = 'USR' + String(db.get('users').length + 1).padStart(3, '0');
        const user = {
          id: uId,
          name: healerData.name,
          username: usernameVal,
          password: passwordVal,
          role: 'Healer',
          status: 'active',
          mobile: healerData.mobile,
          email: healerData.email,
          dateCreated: new Date().toISOString().split('T')[0],
          lastLogin: ''
        };
        db.add('users', user);
      }

      closeModal();
      renderHealers();
      return true;
    });

    const toggleBtn = document.getElementById('btn-toggle-h-password');
    const passwordInput = document.getElementById('h-password');
    const passwordSvg = document.getElementById('svg-toggle-h-password');

    if (toggleBtn && passwordInput && passwordSvg) {
      toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        if (isPassword) {
          passwordSvg.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          `;
        } else {
          passwordSvg.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          `;
        }
      });
    }
  }

  // 8. EDIT ADMIN ACCOUNT MODAL
  function openAddUserModal(userId = null) {
    const isEdit = !!userId;
    const u = isEdit ? db.get('users').find(usr => usr.id === userId) : null;
    if (!u) return;

    const bodyHTML = `
      <form id="user-form">
        <div class="form-grid">
          <div class="form-control-wrap">
            <label class="form-label-admin">User ID</label>
            <input type="text" class="form-input-admin" value="${u.id}" disabled style="background-color:#f1f5f9;">
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Full Name</label>
            <input type="text" id="u-name" class="form-input-admin" value="${u.name}" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Login Username / Email</label>
            <input type="email" id="u-username" class="form-input-admin" value="${u.username}" disabled style="background-color:#f1f5f9;">
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Mobile Number</label>
            <input type="tel" id="u-mobile" class="form-input-admin" value="${u.mobile}" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Role Type</label>
            <input type="text" id="u-role" class="form-input-admin" value="${u.role} (Strict View-Only)" disabled style="background-color:#f1f5f9;">
          </div>
          <div class="form-control-wrap" style="position: relative;">
            <label class="form-label-admin required">Password (Reset if needed)</label>
            <div style="position: relative; display: flex; align-items: center;">
              <input type="password" id="u-password" class="form-input-admin" value="${u.password}" required style="padding-right: 40px; width: 100%;">
              <button type="button" id="btn-toggle-u-password" style="position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; padding: 0;">
                <svg id="svg-toggle-u-password" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </form>
    `;

    showModal(`Edit Admin Account — ${u.name}`, bodyHTML, () => {
      const form = document.getElementById('user-form');
      if (!form.reportValidity()) return false;

      const userData = {
        name: document.getElementById('u-name').value.trim(),
        mobile: document.getElementById('u-mobile').value.trim(),
        password: document.getElementById('u-password').value
      };

      db.update('users', userId, userData);

      closeModal();
      renderUsers();
      return true;
    });

    const toggleBtn = document.getElementById('btn-toggle-u-password');
    const passwordInput = document.getElementById('u-password');
    const passwordSvg = document.getElementById('svg-toggle-u-password');

    if (toggleBtn && passwordInput && passwordSvg) {
      toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        if (isPassword) {
          passwordSvg.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          `;
        } else {
          passwordSvg.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          `;
        }
      });
    }
  }

  // 9. ADD PACKAGE MODAL
  function openAddPackageModal() {
    const nextId = 'PKG' + String(db.get('packages').length + 1).padStart(3, '0');

    const bodyHTML = `
      <form id="package-form">
        <div class="form-grid">
          <div class="form-control-wrap">
            <label class="form-label-admin">Package ID</label>
            <input type="text" class="form-input-admin" value="${nextId}" disabled style="background-color:#f1f5f9;">
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Package Name</label>
            <input type="text" id="pk-name" class="form-input-admin" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Number of Sessions</label>
            <input type="number" id="pk-sessions" class="form-input-admin" min="1" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Price Point (₹)</label>
            <input type="number" id="pk-price" class="form-input-admin" min="0" required>
          </div>
          <div class="form-control-wrap">
            <label class="form-label-admin required">Validity Duration</label>
            <input type="text" id="pk-val" class="form-input-admin" placeholder="e.g. 60 Days" required>
          </div>
          <div class="form-control-wrap form-group-full">
            <label class="form-label-admin required">Description</label>
            <textarea id="pk-desc" class="form-textarea-admin" required></textarea>
          </div>
        </div>
      </form>
    `;

    showModal('Add Package / Service Option', bodyHTML, () => {
      const form = document.getElementById('package-form');
      if (!form.reportValidity()) return false;

      const pkg = {
        id: nextId,
        name: document.getElementById('pk-name').value.trim(),
        sessions: parseInt(document.getElementById('pk-sessions').value, 10),
        price: parseInt(document.getElementById('pk-price').value, 10),
        validity: document.getElementById('pk-val').value.trim(),
        description: document.getElementById('pk-desc').value.trim(),
        status: 'active'
      };

      db.add('packages', pkg);
      closeModal();
      renderPackages();
      return true;
    });
  }

  // ─── UTILITY MODAL DISPLAY WINDOWS ─────────────────────────────────────
  function showModal(title, bodyHTML, onConfirmCallback = null, confirmText = 'Save Changes') {
    // Clean old modals
    closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal-overlay';

    overlay.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <span class="modal-title">${title}</span>
          <button class="modal-close" id="btn-modal-close-times">&times;</button>
        </div>
        <div class="modal-body">
          ${bodyHTML}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary-admin" id="btn-modal-cancel">Cancel</button>
          ${onConfirmCallback ? `<button class="btn btn-primary-admin" id="btn-modal-confirm">${confirmText}</button>` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Event hooks
    document.getElementById('btn-modal-close-times').addEventListener('click', closeModal);
    document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);

    if (onConfirmCallback) {
      document.getElementById('btn-modal-confirm').addEventListener('click', () => {
        onConfirmCallback();
      });
    }
  }

  function closeModal() {
    const el = document.getElementById('active-modal-overlay');
    if (el) el.remove();
  }

  // ─── LOGIN PORTAL PAGE INITIATION ──────────────────────────────────────
  function renderLoginScreen() {
    document.body.innerHTML = `
      <div class="login-container">
        <div class="login-card">
          <div class="login-logo">
            <h1 style="color:var(--primary);">Universe Healing Haven</h1>
            <p>Clinical & Healer Operations Portal</p>
          </div>
          <form id="admin-login-form" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-control-wrap">
              <label class="form-label-admin required">Login Email / Username</label>
              <input type="email" id="login-email" class="form-input-admin" value="admin@healing.com" required>
            </div>
            
            <div class="form-control-wrap">
              <label class="form-label-admin required">Secure Password</label>
              <input type="password" id="login-password" class="form-input-admin" value="password" required>
            </div>

            <div id="login-error-alert" style="color:var(--danger); font-size:0.8rem; font-weight:600; display:none; text-align:center;"></div>
            
            <button type="submit" class="btn btn-primary-admin" style="height:44px; margin-top:8px;">Authenticate & Log In</button>
            <div style="text-align:center; font-size:0.75rem; color:var(--text-muted); margin-top:10px;">
              Forgot password? Contact Systems Admin support.
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('admin-login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('login-email').value;
      const p = document.getElementById('login-password').value;

      const res = login(u, p);
      if (res.success) {
        state.currentUser = res.user;
        renderAdminDashboardLayout();
      } else {
        const errorDiv = document.getElementById('login-error-alert');
        errorDiv.innerText = res.msg;
        errorDiv.style.display = 'block';
      }
    });
  }

  // ─── RENDER DASHBOARD LAYOUT POST-LOGIN ────────────────────────────────
  function renderAdminDashboardLayout() {
    const isSA = isSuperAdmin();

    document.body.innerHTML = `
      <div class="admin-layout">
        <!-- Sidebar Navigation -->
        <aside class="sidebar" id="app-sidebar">
          <div class="sidebar-header">
            <span class="sidebar-logo">Universe <span>Haven</span></span>
            <button class="sidebar-toggle-btn" id="btn-sidebar-close" style="color:#fff;">&times;</button>
          </div>
          
          <nav class="sidebar-menu">
            <div class="sidebar-group-title">OPERATIONS</div>
            <a class="sidebar-item active" data-tab="dashboard">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
              Dashboard Overview
            </a>
            <a class="sidebar-item" data-tab="patients">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Patient Management
            </a>
            <a class="sidebar-item" data-tab="healers">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Healers Directory
            </a>
            <a class="sidebar-item" data-tab="assignments">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M16 11l2 2 4-4"/></svg>
              Caseload Assignments
            </a>
            <a class="sidebar-item" data-tab="protocols">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Healing Protocols
            </a>
            <a class="sidebar-item" data-tab="sessions">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Sessions Log
            </a>
            
            <div class="sidebar-group-title">FINANCIALS & REFERRALS</div>
            <a class="sidebar-item" data-tab="packages">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              Packages / Services
            </a>
            <a class="sidebar-item" data-tab="payments">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Revenue Ledger
            </a>
            <a class="sidebar-item" data-tab="commissions">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Referral Commissions
            </a>
            
            <div class="sidebar-group-title">WEBSITE CONTENT</div>
            <a class="sidebar-item" data-tab="events">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Major Events CMS
            </a>
            <a class="sidebar-item" data-tab="contacts" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
              <div style="display:flex; align-items:center; gap:12px; min-width:0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Contact Messages</span>
              </div>
              <span class="badge-status new" id="sidebar-contacts-badge" style="display:none; padding:2px 6px; font-size:0.65rem; border-radius:10px; line-height:1; flex-shrink:0;">0</span>
            </a>

            <div class="sidebar-group-title">ANALYTICS & AUDIT</div>
            <a class="sidebar-item" data-tab="reports">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              BI Reports
            </a>
            <a class="sidebar-item" data-tab="logs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Audit Trail Logs
            </a>
            ${isSA ? `
            <a class="sidebar-item" data-tab="users">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Admin Accounts
            </a>
            ` : ''}
          </nav>
          
          <div class="sidebar-footer">
            <div class="sidebar-user">
              <div class="sidebar-user-avatar">${state.currentUser.name.charAt(0)}</div>
              <div class="sidebar-user-info">
                <span class="sidebar-user-name">${state.currentUser.name}</span>
                <span class="sidebar-user-role">${state.currentUser.role}</span>
              </div>
            </div>
            <button class="btn-logout" id="btn-sidebar-logout" title="Log Out from Portal">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </aside>

        <!-- Main Wrapper Panel -->
        <div class="main-wrapper">
          <header class="main-header">
            <button class="sidebar-toggle-btn" id="btn-sidebar-open" style="border:1px solid var(--border-color); border-radius:4px; padding:4px 8px;">&#9776;</button>
            <div class="header-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="global-header-patient-search" placeholder="Type Patient ID or Name to find Profile...">
            </div>
            
            <div class="header-actions">
              <button class="btn-icon" title="0 Notifications">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <div class="btn-icon-badge"></div>
              </button>
            </div>
          </header>
          
          <main class="main-content" id="main-content-panel">
            <!-- Loaded Tab Contents -->
          </main>
        </div>
      </div>
    `;

    // Toggle menu events
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        switchTab(item.dataset.tab);
        if (window.innerWidth <= 768) {
          document.getElementById('app-sidebar').classList.remove('open');
        }
      });
    });

    document.getElementById('btn-sidebar-logout').addEventListener('click', logout);

    // Sidebar Mobile Toggle Hooks
    document.getElementById('btn-sidebar-open').addEventListener('click', () => {
      document.getElementById('app-sidebar').classList.add('open');
    });

    document.getElementById('btn-sidebar-close').addEventListener('click', () => {
      document.getElementById('app-sidebar').classList.remove('open');
    });

    // Global search header query
    document.getElementById('global-header-patient-search').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (query.length >= 3) {
        // Show live search results inline or jump directly to profile if exact ID matched
        const match = db.get('patients').find(p => p.id.toLowerCase() === query || p.name.toLowerCase() === query);
        if (match) {
          openPatientProfile(match.id);
          e.target.value = '';
        }
      }
    });

    document.getElementById('global-header-patient-search').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.toLowerCase().trim();
        const match = db.get('patients').find(p => p.id.toLowerCase().includes(query) || p.name.toLowerCase().includes(query));
        if (match) {
          openPatientProfile(match.id);
          e.target.value = '';
        } else {
          alert(`No patient found matching: "${query}"`);
        }
      }
    });

    // Default load dashboard tab
    switchTab('dashboard');
    updateSidebarBadges();
  }

  function updateSidebarBadges() {
    const contacts = db.get('contacts') || [];
    const unread = contacts.filter(c => c.status === 'new').length;
    const badge = document.getElementById('sidebar-contacts-badge');
    if (badge) {
      if (unread > 0) {
        badge.innerText = unread;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  // ─── INITIAL BOOT LOGIC ────────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {
    const user = getActiveUser();
    if (user) {
      state.currentUser = user;
      renderAdminDashboardLayout();
    } else {
      renderLoginScreen();
    }
  });

})();
