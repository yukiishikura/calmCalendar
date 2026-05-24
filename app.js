// 日本の祝日判定関数 (振替休日、ハッピーマンデー、春分/秋分対応)
function getHoliday(year, month, day) {
  // 固定祝日
  if (month === 1 && day === 1) return "元日";
  if (month === 2 && day === 11) return "建国記念の日";
  if (month === 2 && day === 23) return "天皇誕生日";
  if (month === 4 && day === 29) return "昭和の日";
  if (month === 5 && day === 3) return "憲法記念日";
  if (month === 5 && day === 4) return "みどりの日";
  if (month === 5 && day === 5) return "こどもの日";
  if (month === 8 && day === 11) return "山の日";
  if (month === 11 && day === 3) return "文化の日";
  if (month === 11 && day === 23) return "勤労感謝の日";
  
  // ハッピーマンデー (第X月曜日)
  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay();
  if (dayOfWeek === 1) {
    const nth = Math.floor((day - 1) / 7) + 1;
    if (month === 1 && nth === 2) return "成人の日";
    if (month === 7 && nth === 3) return "海の日";
    if (month === 9 && nth === 3) return "敬老の日";
    if (month === 10 && nth === 2) return "スポーツの日";
  }

  // 春分の日・秋分の日の簡易計算
  if (month === 3) {
    const equinox = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
    if (day === equinox) return "春分の日";
  }
  if (month === 9) {
    const equinox = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
    if (day === equinox) return "秋分の日";
  }

  // 振替休日
  if (dayOfWeek !== 0) {
    const yesterday = new Date(year, month - 1, day - 1);
    const yName = getHoliday(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate());
    if (yName && yesterday.getDay() === 0 && !yName.includes("振替休日")) {
      return "振替休日";
    }
  }

  return null;
}

// --- 1. デフォルトのデモデータ ---
const DEFAULT_EVENTS = [
  {
    id: "welcome-1",
    title: "「Calm Calendar」を使い始める",
    date: getOffsetDateString(0), // 今日
    time: "10:00",
    note: "複数人向けのカレンダーアプリ。今日から予定をここに共有していきます。",
    createdBy: "user-a"
  }
];

// 補助関数: 今日からの相対日数の日付文字列を返す (YYYY-MM-DD)
function getOffsetDateString(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

// 招待コードのランダム生成関数 (CALM-XXXX-XXXX)
function generateRandomInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CALM-${p1}-${p2}`;
}

// --- 2. アプリケーション状態 (State) ---
let state = {
  isLoggedIn: false,
  isSynced: false,
  isLocalMode: false,
  currentUser: 'user-a',
  userAName: '縺ゅ↑縺・,
  userBName: '繝代・繝医リ繝ｼ',
  myInviteCode: '',
  syncCode: '',
  activeTab: 'calendar',
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  selectedDate: new Date().toISOString().split('T')[0],
  events: []
};

function isDefaultOrEmpty(name) {
  return !name || name === '\u30d1\u30fc\u30c8\u30ca\u30fc' || name === '\u3042\u306a\u305f';
}

// --- 3. データ永続化 (LocalStorage) ---
function loadStateFromStorage() {
  const storedEvents = localStorage.getItem('calm_events');
  if (storedEvents) {
    state.events = JSON.parse(storedEvents);
  } else {
    state.events = [...DEFAULT_EVENTS];
    saveEventsToStorage();
  }

  const storedUserAName = localStorage.getItem('calm_user_a_name');
  if (storedUserAName) state.userAName = storedUserAName;

  const storedUserBName = localStorage.getItem('calm_user_b_name');
  if (storedUserBName) state.userBName = storedUserBName;

  const storedLogin = localStorage.getItem('calm_is_logged_in');
  if (storedLogin === 'true') state.isLoggedIn = true;

  const storedUser = localStorage.getItem('calm_current_user');
  if (storedUser) state.currentUser = storedUser;

  const storedSynced = localStorage.getItem('calm_is_synced');
  if (storedSynced) state.isSynced = storedSynced === 'true';

  const storedMyCode = localStorage.getItem('calm_my_invite_code');
  if (storedMyCode) {
    state.myInviteCode = storedMyCode;
  } else {
    state.myInviteCode = generateRandomInviteCode();
    localStorage.setItem('calm_my_invite_code', state.myInviteCode);
  }

    const storedSyncCode = localStorage.getItem('calm_sync_code');
  if (storedSyncCode) state.syncCode = storedSyncCode;

  const storedLocalMode = localStorage.getItem('calm_is_local_mode');
  state.isLocalMode = storedLocalMode === 'true';
}

function saveEventsToStorage() {
  localStorage.setItem('calm_events', JSON.stringify(state.events));
}

function saveUserNamesToStorage() {
  localStorage.setItem('calm_user_a_name', state.userAName);
  localStorage.setItem('calm_user_b_name', state.userBName);
}

function saveLoginStatus() {
  localStorage.setItem('calm_is_logged_in', state.isLoggedIn ? 'true' : 'false');
  localStorage.setItem('calm_current_user', state.currentUser);
  saveSyncStatus();
}

function saveSyncStatus() {
  localStorage.setItem('calm_is_synced', state.isSynced ? 'true' : 'false');
  localStorage.setItem('calm_sync_code', state.syncCode);
  localStorage.setItem('calm_is_local_mode', state.isLocalMode ? 'true' : 'false');
}

// --- 4. サーバー同期 API 連携 ---

// サーバーからデータを取得する
async function fetchEventsFromServer() {
  if (!state.isSynced || !state.syncCode) return;

  let data = null;

  if (state.isLocalMode) {
    const localDataStr = localStorage.getItem(`calm_local_sync:${state.syncCode}`);
    if (localDataStr) {
      try {
        data = JSON.parse(localDataStr);
      } catch (e) {
        console.error('Failed to parse local sync data', e);
      }
    }
  } else {
    try {
      const res = await fetch(`/api/sync?code=${state.syncCode}`);
      if (res.status === 503 || res.status === 404) {
        console.warn('Database not configured or room missing on server. Switching to local emulation.');
        state.isLocalMode = true;
        saveSyncStatus();
        return fetchEventsFromServer();
      }
      if (!res.ok) throw new Error('Failed to fetch from server');
      data = await res.json();
    } catch (err) {
      console.error('Sync error (GET):', err);
      state.isLocalMode = true;
      saveSyncStatus();
      return fetchEventsFromServer();
    }
  }

  if (data) {
    if (!data.userAName && !data.userBName) {
      console.warn('Sync connection closed by partner.');
      state.isSynced = false;
      state.syncCode = '';
      state.isLocalMode = false;
      state.currentUser = 'user-a';
      state.events = state.events.filter(e => e.createdBy === 'user-a');
      state.userBName = '\u30d1\u30fc\u30c8\u30ca\u30fc';
      state.myInviteCode = generateRandomInviteCode();
      localStorage.setItem('calm_my_invite_code', state.myInviteCode);
      
      saveEventsToStorage();
      saveUserNamesToStorage();
      saveSyncStatus();
      saveLoginStatus();
      
      alert('\u30d1\u30fc\u30c8\u30ca\u30fc\u3068\u306e\u9023\u643a\u304c\u89e3\u9664\u3055\u308c\u307e\u3057\u305f\u3002');
      initAppView();
      return;
    }

    if (Array.isArray(data.events)) {
      state.events = data.events;
      
      if (state.currentUser === 'user-a') {
        if (data.userBName && !isDefaultOrEmpty(data.userBName)) {
          state.userBName = data.userBName;
        }
      } else {
        if (data.userAName && !isDefaultOrEmpty(data.userAName)) {
          state.userAName = data.userAName;
        }
      }

      saveEventsToStorage();
      saveUserNamesToStorage();
    }
  }
}

async function uploadEventsToServer() {
  if (!state.isSynced || !state.syncCode) return;

  const payload = {
    events: state.events,
    userAName: state.userAName,
    userBName: state.userBName
  };

  if (state.isLocalMode) {
    localStorage.setItem(`calm_local_sync:${state.syncCode}`, JSON.stringify(payload));
  } else {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: state.syncCode,
          data: payload
        })
      });
      if (res.status === 503) {
        console.warn('Database not configured. Bypassing upload, saving to local emulation.');
        state.isLocalMode = true;
        saveSyncStatus();
        localStorage.setItem(`calm_local_sync:${state.syncCode}`, JSON.stringify(payload));
        return;
      }
      if (!res.ok) throw new Error('Failed to upload to server');
    } catch (err) {
      console.error('Sync error (POST):', err);
      state.isLocalMode = true;
      saveSyncStatus();
      localStorage.setItem(`calm_local_sync:${state.syncCode}`, JSON.stringify(payload));
    }
  }
}

async function initializeRoomOnServer() {
  if (state.isSynced || !state.myInviteCode) return;

  const payload = {
    events: state.events,
    userAName: state.userAName,
    userBName: ''
  };

  localStorage.setItem(`calm_local_sync:${state.myInviteCode}`, JSON.stringify(payload));

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: state.myInviteCode,
        data: payload
      })
    });
    if (res.status === 503) {
      console.warn('Database not configured. API Room initialization bypassed.');
      return;
    }
  } catch (err) {
    console.error('Room init error (POST):', err);
  }
}

// --- 5. 繝ｦ繝ｼ繝・ぅ繝ｪ繝・ぅ & 陬懷勧髢｢謨ｰ --- ユーティリティ & 補助関数 ---
function getCurrentUserName() {
  return state.currentUser === 'user-a' ? state.userAName : state.userBName;
}

function getPartnerName() {
  return state.currentUser === 'user-a' ? state.userBName : state.userAName;
}

function getUserNameById(id) {
  return id === 'user-a' ? state.userAName : state.userBName;
}

// 日付フォーマット (例: 2026年5月23日(土))
function formatJapaneseDate(dateStr) {
  const d = new Date(dateStr);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${weekdays[d.getDay()]})`;
}

// --- 6. DOM 要素の参照 ---
const appEl = document.getElementById('app');
const bottomNavEl = document.getElementById('bottom-nav');
const modalContainerEl = document.getElementById('modal-container');
const modalBackdropEl = document.getElementById('modal-backdrop');
const modalContentEl = document.getElementById('modal-content');

// --- 7. モーダル制御 ---
function openModal(contentHtml) {
  modalContentEl.innerHTML = contentHtml;
  modalContainerEl.classList.remove('hidden');
  modalContainerEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // モーダル表示中は親スクロール無効化
  
  // イベント登録 (モーダル内)
  const closeBtn = modalContentEl.querySelector('.js-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
}

function closeModal() {
  modalContainerEl.classList.add('hidden');
  modalContainerEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

modalBackdropEl.addEventListener('click', closeModal);

// --- 8. 各画面のレンダリング (Render Screens) ---

// 8-1. ログイン画面
function renderLoginScreen() {
  bottomNavEl.classList.add('hidden');
  
  appEl.innerHTML = `
    <div class="screen-login fade-in">
      <div class="login-brand">
        <div class="login-logo">
          <img src="/assets/logo.png" alt="Calm Calendar ロゴ">
        </div>
        <h1 class="login-title" style="letter-spacing: 0.05em; font-size: 24px;">Calm Calendar</h1>
        <p class="login-subtitle">大切な人と予定を共有するカレンダー</p>
      </div>

      <div class="login-card">
        <p class="login-description" style="margin-bottom: var(--space-md);">
          無駄な機能を省いた少人数向け共有カレンダーです。
        </p>
        
        <form id="form-login-signup">
          <div class="form-group" style="margin-bottom: var(--space-md);">
            <label class="form-label" for="login-username">あなたの名前</label>
            <input class="form-input" type="text" id="login-username" placeholder="例: たろう" required maxlength="10" autofocus>
          </div>
          <button class="btn btn-primary" type="submit">カレンダーを始める</button>
        </form>
      </div>
    </div>
  `;

  // イベント登録
  document.getElementById('form-login-signup').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('login-username').value.trim();
    if (!name) return;

    state.isLoggedIn = true;
    state.currentUser = 'user-a';
    state.userAName = name;
    state.userBName = 'パートナー';
    state.isSynced = false;
    state.syncCode = '';

    // 初回コードがなければ生成
    if (!state.myInviteCode) {
      state.myInviteCode = generateRandomInviteCode();
      localStorage.setItem('calm_my_invite_code', state.myInviteCode);
    }

    saveUserNamesToStorage();
    saveSyncStatus();
    saveLoginStatus();
    
    // 新規開始時のため、LocalStorageをデフォルトのウェルカム予定1件のみでリセット
    state.events = [...DEFAULT_EVENTS];
    saveEventsToStorage();
    initializeRoomOnServer(); // サーバー上に部屋を作成

    initAppView();
  });
}

// 8-2. カレンダー画面 (メイン)
function renderCalendarScreen() {
  const { currentYear, currentMonth, selectedDate } = state;
  const monthName = `${currentYear}年 ${currentMonth + 1}月`;

  // カレンダー日付グリッドの計算
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 1日の曜日
  const lastDayDate = new Date(currentYear, currentMonth + 1, 0).getDate(); // 今月の最終日
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate(); // 先月の最終日

  let daysHtml = '';

  // 1. 前月の余った日付セルを埋める
  for (let i = firstDayIndex; i > 0; i--) {
    const day = prevMonthLastDay - i + 1;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    daysHtml += renderDayCell(day, dateStr, true);
  }

  // 2. 今月の日付セルを埋める
  for (let day = 1; day <= lastDayDate; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    daysHtml += renderDayCell(day, dateStr, false);
  }

  // 3. 翌月の余った日付セルを埋める (6行グリッド 42枠にする)
  const totalCells = 42;
  const renderedCells = firstDayIndex + lastDayDate;
  const nextMonthCells = totalCells - renderedCells;
  for (let day = 1; day <= nextMonthCells; day++) {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    daysHtml += renderDayCell(day, dateStr, true);
  }

  // 選択日の予定を取得
  let dayEvents = state.events.filter(e => {
    if (e.date !== selectedDate) return false;
    // 未同期状態のときは、自分以外の予定は除外する
    if (!state.isSynced && e.createdBy !== state.currentUser) return false;
    return true;
  });
  // 時間昇順でソート
  dayEvents.sort((a, b) => a.time.localeCompare(b.time));

  // 祝日チェック
  const [y, m, d] = selectedDate.split('-').map(Number);
  const holidayName = getHoliday(y, m, d);
  if (holidayName) {
    // 祝日予定を先頭にマージ
    dayEvents = [
      {
        id: `holiday-${selectedDate}`,
        title: holidayName,
        date: selectedDate,
        time: "",
        note: "国民の祝日です。",
        createdBy: "holiday",
        isHoliday: true
      },
      ...dayEvents
    ];
  }

  let eventsListHtml = '';
  if (dayEvents.length === 0) {
    eventsListHtml = `<div class="empty-state">この日に予定はありません</div>`;
  } else {
    eventsListHtml = `
      <div class="event-list">
        ${dayEvents.map(e => {
          const badgeClass = e.isHoliday ? 'holiday' : e.createdBy;
          const badgeName = e.isHoliday ? '祝日' : getUserNameById(e.createdBy);
          const timeText = e.isHoliday ? '終日' : (e.time ? e.time : '時間未定');
          return `
            <div class="event-item-card fade-in" data-event-id="${e.id}">
              <div class="event-item-info">
                <span class="event-item-time">${timeText}</span>
                <span class="event-item-title">${escapeHtml(e.title)}</span>
              </div>
              <div class="event-item-meta">
                <span class="user-badge ${badgeClass}">${badgeName}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  appEl.innerHTML = `
    <div class="fade-in">
      <!-- カレンダー上部ヘッダー -->
      <div class="calendar-header">
        <h2 class="calendar-title">${monthName}</h2>
        <div class="calendar-nav">
          <button class="btn-icon" id="btn-prev-month" aria-label="先月へ">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button class="btn-icon" id="btn-today" aria-label="今日へ">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
          <button class="btn-icon" id="btn-next-month" aria-label="翌月へ">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>

      <!-- 曜日表示 -->
      <div class="weekdays-grid">
        <div class="weekday-label">日</div>
        <div class="weekday-label">月</div>
        <div class="weekday-label">火</div>
        <div class="weekday-label">水</div>
        <div class="weekday-label">木</div>
        <div class="weekday-label">金</div>
        <div class="weekday-label">土</div>
      </div>

      <!-- カレンダーグリッド -->
      <div class="days-grid">
        ${daysHtml}
      </div>

      <!-- 選択日の予定一覧 -->
      <div class="selected-day-events">
        <h3 class="section-title">${formatJapaneseDate(selectedDate)}</h3>
        ${eventsListHtml}
      </div>
    </div>
  `;

  // イベントリスナーの登録
  registerCalendarEvents();
}

// カレンダーセルHTML生成の補助
function renderDayCell(day, dateStr, isOtherMonth) {
  const isSelected = dateStr === state.selectedDate;
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = dateStr === todayStr;
  
  // 祝日チェック
  const [y, m, d] = dateStr.split('-').map(Number);
  const holidayName = getHoliday(y, m, d);

  // 予定があるかチェック (未同期なら自分の予定のみ、または祝日)
  const hasEvent = state.events.some(e => {
    if (e.date !== dateStr) return false;
    if (!state.isSynced && e.createdBy !== state.currentUser) return false;
    return true;
  }) || !!holidayName;
  const dotHtml = hasEvent ? `<div class="event-dot"></div>` : '';

  const dObj = new Date(y, m - 1, d);
  const dayOfWeek = dObj.getDay();

  let classes = 'day-cell';
  if (isOtherMonth) classes += ' other-month';
  if (isSelected) classes += ' selected';
  if (isToday) classes += ' today';
  
  // 土・日・祝日のクラス付与
  if (holidayName) {
    classes += ' holiday';
  } else if (dayOfWeek === 6) {
    classes += ' saturday';
  } else if (dayOfWeek === 0) {
    classes += ' sunday';
  }

  return `
    <div class="${classes}" data-date="${dateStr}">
      <span class="day-number">${day}</span>
      ${dotHtml}
    </div>
  `;
}

// カレンダー用各種イベントの登録
function registerCalendarEvents() {
  // 日付セルクリック
  const cells = appEl.querySelectorAll('.day-cell');
  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      state.selectedDate = cell.getAttribute('data-date');
      renderCalendarScreen();
    });
  });

  // 先月・翌月・今日
  document.getElementById('btn-prev-month').addEventListener('click', () => {
    if (state.currentMonth === 0) {
      state.currentMonth = 11;
      state.currentYear -= 1;
    } else {
      state.currentMonth -= 1;
    }
    renderCalendarScreen();
  });

  document.getElementById('btn-next-month').addEventListener('click', () => {
    if (state.currentMonth === 11) {
      state.currentMonth = 0;
      state.currentYear += 1;
    } else {
      state.currentMonth += 1;
    }
    renderCalendarScreen();
  });

  document.getElementById('btn-today').addEventListener('click', () => {
    const today = new Date();
    state.currentYear = today.getFullYear();
    state.currentMonth = today.getMonth();
    state.selectedDate = today.toISOString().split('T')[0];
    renderCalendarScreen();
  });

  // 予定詳細の表示
  const eventCards = appEl.querySelectorAll('.event-item-card');
  eventCards.forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-event-id');
      showEventDetails(id);
    });
  });
}

// 7-3. 予定詳細モーダル
function showEventDetails(eventId) {
  let event;
  if (eventId.startsWith('holiday-')) {
    const dateStr = eventId.replace('holiday-', '');
    const [y, m, d] = dateStr.split('-').map(Number);
    const holidayName = getHoliday(y, m, d);
    if (holidayName) {
      event = {
        id: eventId,
        title: holidayName,
        date: dateStr,
        time: "",
        note: "国民の祝日です。",
        createdBy: "holiday",
        isHoliday: true
      };
    }
  } else {
    event = state.events.find(e => e.id === eventId);
  }

  if (!event) return;

  const badgeClass = event.isHoliday ? 'holiday' : event.createdBy;
  const badgeName = event.isHoliday ? '祝日' : getUserNameById(event.createdBy);
  const timeText = event.isHoliday ? '終日' : (event.time ? event.time : '時間未定');

  const buttonGroupHtml = event.isHoliday
    ? `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: var(--space-md) 0; border: 1px dashed var(--border-light); border-radius: var(--radius-md); background-color: var(--bg-card);">祝日の予定は編集・削除できません</div>`
    : `
      <div class="btn-group">
        <button class="btn btn-secondary" id="btn-edit-event">編集する</button>
        <button class="btn btn-danger" id="btn-delete-event">削除する</button>
      </div>
    `;

  const contentHtml = `
    <div class="modal-header">
      <h3 class="modal-title">予定の詳細</h3>
      <button class="btn-icon js-modal-close" aria-label="閉じる">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
    
    <div style="margin-bottom: var(--space-lg);">
      <h2 style="font-size: 20px; font-weight: 500; margin-bottom: var(--space-xs);">${escapeHtml(event.title)}</h2>
      <div class="detail-meta">
        <span>日時: ${formatJapaneseDate(event.date)} ${timeText}</span>
        <span>分類: <span class="user-badge ${badgeClass}">${badgeName}</span></span>
      </div>
    </div>

    <div class="detail-desc-box">
      ${event.note ? escapeHtml(event.note) : '<span style="color: var(--text-light); font-style: italic;">詳細はありません</span>'}
    </div>

    ${buttonGroupHtml}
  `;

  openModal(contentHtml);

  if (!event.isHoliday) {
    // イベント登録
    document.getElementById('btn-edit-event').addEventListener('click', () => {
      showEditEventForm(event);
    });

    document.getElementById('btn-delete-event').addEventListener('click', () => {
      if (confirm('この予定を削除してもよろしいですか？')) {
        state.events = state.events.filter(e => e.id !== eventId);
        saveEventsToStorage();
        if (state.isSynced) {
          uploadEventsToServer(); // サーバーと同期
        } else {
          initializeRoomOnServer(); // 未連携時は自分のデータを更新しておく
        }
        closeModal();
        renderCalendarScreen();
      }
    });
  }
}

// 8-4. 予定追加フォーム
function showAddEventForm() {
  const contentHtml = `
    <div class="modal-header">
      <h3 class="modal-title">新しい予定</h3>
      <button class="btn-icon js-modal-close" aria-label="閉じる">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>

    <form id="form-event">
      <div class="form-group">
        <label class="form-label" for="evt-title">件名</label>
        <input class="form-input" type="text" id="evt-title" required placeholder="例: カフェでお茶をする" autofocus>
      </div>

      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: var(--space-sm);">
        <div class="form-group">
          <label class="form-label" for="evt-date">\u65e5\u4ed8</label>
          <input class="form-input" type="date" id="evt-date" value="${state.selectedDate}" required style="padding: var(--space-md) var(--space-xs); min-width: 0;">
        </div>
        <div class="form-group">
          <label class="form-label">\u6642\u9593</label>
          <div style="display: flex; gap: var(--space-xs); align-items: center;">
            <select class="form-input" id="evt-time-hour" style="flex: 1; text-align: center; padding: var(--space-md) 0; padding-right: 4px; min-width: 0;">
              ${Array.from({length: 24}, (_, i) => String(i).padStart(2, '0')).map(h => `<option value="${h}" ${h === '12' ? 'selected' : ''}>${h}</option>`).join('')}
            </select>
            <span style="color: var(--text-muted);">:</span>
            <select class="form-input" id="evt-time-minute" style="flex: 1; text-align: center; padding: var(--space-md) 0; padding-right: 4px; min-width: 0;">
              <option value="00" selected>00</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="40">40</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="evt-note">メモ (任意)</label>
        <textarea class="form-input" id="evt-note" rows="3" placeholder="持ち物や場所など" style="resize: none;"></textarea>
      </div>

      <div class="btn-group">
        <button class="btn btn-primary" type="submit">保存する</button>
      </div>
    </form>
  `;

  openModal(contentHtml);

  // フォームサブミット
  document.getElementById('form-event').addEventListener('submit', (e) => {
    e.preventDefault();
    const newEvent = {
      id: 'evt-' + Date.now(),
      title: document.getElementById('evt-title').value,
      date: document.getElementById('evt-date').value,
      time: `${document.getElementById('evt-time-hour').value}:${document.getElementById('evt-time-minute').value}`,
      note: document.getElementById('evt-note').value,
      createdBy: state.currentUser
    };

    state.events.push(newEvent);
    saveEventsToStorage();
    if (state.isSynced) {
      uploadEventsToServer(); // サーバーと同期
    } else {
      initializeRoomOnServer(); // 未連携時は自分のデータを更新しておく
    }
    closeModal();
    // 予定を追加した日付を選択状態にする
    state.selectedDate = newEvent.date;
    const d = new Date(newEvent.date);
    state.currentYear = d.getFullYear();
    state.currentMonth = d.getMonth();
    
    renderCalendarScreen();
  });
}

// 8-5. 予定編集フォーム
function showEditEventForm(event) {
  let currentHour = '12';
  let currentMinute = '00';
  if (event.time) {
    const parts = event.time.split(':');
    if (parts.length === 2) {
      currentHour = parts[0];
      // 10分刻みに丸める (不正値対策)
      const m = Math.round(parseInt(parts[1], 10) / 10) * 10;
      currentMinute = String(m >= 60 ? 50 : m).padStart(2, '0');
    }
  }

  const contentHtml = `
    <div class="modal-header">
      <h3 class="modal-title">予定の編集</h3>
      <button class="btn-icon js-modal-close" aria-label="閉じる">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>

    <form id="form-event-edit">
      <div class="form-group">
        <label class="form-label" for="evt-edit-title">件名</label>
        <input class="form-input" type="text" id="evt-edit-title" value="${escapeHtml(event.title)}" required placeholder="例: カフェでお茶をする">
      </div>

      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: var(--space-sm);">
        <div class="form-group">
          <label class="form-label" for="evt-edit-date">\u65e5\u4ed8</label>
          <input class="form-input" type="date" id="evt-edit-date" value="${event.date}" required style="padding: var(--space-md) var(--space-xs); min-width: 0;">
        </div>
        <div class="form-group">
          <label class="form-label">\u6642\u9593</label>
          <div style="display: flex; gap: var(--space-xs); align-items: center;">
            <select class="form-input" id="evt-edit-time-hour" style="flex: 1; text-align: center; padding: var(--space-md) 0; padding-right: 4px; min-width: 0;">
              ${Array.from({length: 24}, (_, i) => String(i).padStart(2, '0')).map(h => `<option value="${h}" ${h === currentHour ? 'selected' : ''}>${h}</option>`).join('')}
            </select>
            <span style="color: var(--text-muted);">:</span>
            <select class="form-input" id="evt-edit-time-minute" style="flex: 1; text-align: center; padding: var(--space-md) 0; padding-right: 4px; min-width: 0;">
              ${['00', '10', '20', '30', '40', '50'].map(m => `<option value="${m}" ${m === currentMinute ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="evt-edit-note">メモ (任意)</label>
        <textarea class="form-input" id="evt-edit-note" rows="3" style="resize: none;" placeholder="持ち物や場所など">${escapeHtml(event.note || '')}</textarea>
      </div>

      <div class="btn-group">
        <button class="btn btn-primary" type="submit">変更を保存</button>
        <button class="btn btn-secondary js-modal-close" type="button">キャンセル</button>
      </div>
    </form>
  `;

  openModal(contentHtml);

  // フォームサブミット
  document.getElementById('form-event-edit').addEventListener('submit', (e) => {
    e.preventDefault();

    event.title = document.getElementById('evt-edit-title').value;
    event.date = document.getElementById('evt-edit-date').value;
    event.time = `${document.getElementById('evt-edit-time-hour').value}:${document.getElementById('evt-edit-time-minute').value}`;
    event.note = document.getElementById('evt-edit-note').value;

    saveEventsToStorage();
    if (state.isSynced) {
      uploadEventsToServer(); // サーバーと同期
    } else {
      initializeRoomOnServer(); // 未連携時は自分のデータを更新しておく
    }
    closeModal();
    // 編集した日付を選択状態にする
    state.selectedDate = event.date;
    const d = new Date(event.date);
    state.currentYear = d.getFullYear();
    state.currentMonth = d.getMonth();
    
    renderCalendarScreen();
  });
}

// 8-6. メンバー共有画面 (複数人共有)
function renderMembersScreen() {
  const code = state.myInviteCode; // 自分の招待コード

  // 招待ボックス (自分のコード表示) は連携状態に関わらず常に表示する
  const inviteBoxHtml = `
    <!-- 招待ボックス (自分のコード表示) -->
    <div class="invite-box" style="margin-bottom: var(--space-lg);">
      <h3 class="invite-title">新しいメンバーを招待</h3>
      <p class="invite-desc">パートナーや家族の端末で以下のコードを入力すると、カレンダーを同期できます。</p>
      <div class="invite-code-container">
        <input class="invite-code" type="text" value="${code}" readonly id="invite-code-text">
        <button class="btn-copy" id="btn-copy-code">コピー</button>
      </div>
    </div>
  `;

  let membersListHtml = '';
  let syncActionAreaHtml = '';

  // 1. 同期（接続中）状態のUI
  if (state.isSynced) {
    membersListHtml = `
      <!-- メンバーA -->
      <div class="member-card">
        <div class="member-avatar user-a">
          ${state.userAName.charAt(0)}
        </div>
        <div class="member-info">
          <span class="member-name">${state.userAName}</span>
          <span class="member-role">${state.currentUser === 'user-a' ? 'あなた' : 'パートナー'}</span>
        </div>
        ${state.currentUser === 'user-a' ? '<span class="pwa-badge">ログイン中</span>' : ''}
      </div>

      <!-- メンバーB -->
      <div class="member-card">
        <div class="member-avatar user-b">
          ${state.userBName.charAt(0)}
        </div>
        <div class="member-info">
          <span class="member-name">${state.userBName}</span>
          <span class="member-role">${state.currentUser === 'user-b' ? 'あなた' : 'パートナー'}</span>
        </div>
        ${state.currentUser === 'user-b' ? '<span class="pwa-badge">ログイン中</span>' : ''}
      </div>
    `;

    syncActionAreaHtml = `
      <!-- 連携ステータス表示 (同期コード入力欄は非表示) -->
      <div class="invite-box" style="margin-bottom: var(--space-lg); border-style: solid; border-color: var(--accent-color); background-color: #F8FAF6;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--accent-color); font-weight: 500; font-size: 14px; margin-bottom: var(--space-xs);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          パートナーと連携済みです
        </div>
        <p class="invite-desc" style="margin-bottom: var(--space-md);">
          Calm Calendarは1つの共有グループ専用カレンダーです。重複して他のカレンダーグループと接続することはできません。
        </p>
        <button class="btn btn-danger" id="btn-disconnect" style="padding: var(--space-sm); font-size: 12px; border-radius: var(--radius-sm);">
          連携を解除する
        </button>
      </div>

      <!-- 招待コードの発行 (共有中でも必要) -->
      ${inviteBoxHtml}
    `;
  } else {
    // 2. 未同期（未接続）状態のUI
    membersListHtml = `
      <!-- 自分自身のみ表示 -->
      <div class="member-card">
        <div class="member-avatar user-a">
          ${state.userAName.charAt(0)}
        </div>
        <div class="member-info">
          <span class="member-name">${state.userAName}</span>
          <span class="member-role">あなた (未接続)</span>
        </div>
        <span class="pwa-badge">ログイン中</span>
      </div>
    `;

    syncActionAreaHtml = `
      <!-- 招待コードの発行 -->
      ${inviteBoxHtml}

      <!-- 同期（コード入力）ボックス -->
      <div class="invite-box" style="margin-bottom: var(--space-xl);">
        <h3 class="invite-title">招待コードを入力して同期</h3>
        <p class="invite-desc">受け取った招待コードを入力すると、カレンダーが接続されます。</p>
        <form id="form-join-calendar" style="display: flex; gap: var(--space-xs); margin-top: var(--space-sm);">
          <input class="form-input" type="text" id="join-code-input" placeholder="例: CALM-XXXX-XXXX" required style="flex: 1; text-align: center; text-transform: uppercase; font-family: monospace; letter-spacing: 0.05em; padding: var(--space-sm);">
          <button class="btn btn-primary" type="submit" style="width: auto; padding: 0 var(--space-lg); white-space: nowrap;">同期</button>
        </form>
      </div>
    `;
  }

  appEl.innerHTML = `
    <div class="fade-in">
      <h2 style="font-size: 20px; font-weight: 500; margin-bottom: var(--space-lg); letter-spacing: 0.05em;">共有中のメンバー</h2>
      
      <div class="member-list" style="margin-bottom: var(--space-lg);">
        ${membersListHtml}
      </div>

      ${syncActionAreaHtml}
    </div>
  `;

  // 共通イベント登録 (招待コードコピーは常に存在する)
  const copyBtn = document.getElementById('btn-copy-code');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const copyText = document.getElementById('invite-code-text');
      copyText.select();
      copyText.setSelectionRange(0, 99999);
      
      navigator.clipboard.writeText(copyText.value).then(() => {
        copyBtn.innerText = 'コピー済';
        copyBtn.style.backgroundColor = '#7A8673';
        setTimeout(() => {
          copyBtn.innerText = 'コピー';
          copyBtn.style.backgroundColor = 'var(--accent-color)';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    });
  }

  // 連携中の場合のみのイベント
  if (state.isSynced) {
    document.getElementById('btn-disconnect').addEventListener('click', () => {
      if (confirm('\u30d1\u30fc\u30c8\u30ca\u30fc\u3068\u306e\u9023\u643a\u3092\u89e3\u9664\u3057\u307e\u3059\u304b\uff1f\uff08\u89e3\u9664\u3059\u308b\u3068\u30d1\u30fc\u30c8\u30ca\u30fc\u306e\u4e88\u5b9a\u306f\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u308a\u307e\u3059\uff09')) {
        const oldSyncCode = state.syncCode;
        const oldLocalMode = state.isLocalMode;

        state.isSynced = false;
        state.syncCode = '';
        state.isLocalMode = false;
        state.currentUser = 'user-a';
        
        state.events = state.events.filter(e => e.createdBy === 'user-a');
        state.userBName = '\u30d1\u30fc\u30c8\u30ca\u30fc';
        state.myInviteCode = generateRandomInviteCode();
        localStorage.setItem('calm_my_invite_code', state.myInviteCode);

        saveEventsToStorage();
        saveUserNamesToStorage();
        saveSyncStatus();
        saveLoginStatus();

        if (oldLocalMode) {
          localStorage.removeItem(`calm_local_sync:${oldSyncCode}`);
        } else {
          if (oldSyncCode) {
            fetch(`/api/sync?code=${oldSyncCode}`, { method: 'DELETE' }).catch(err => {
              console.error('Failed to delete sync room on server:', err);
            });
          }
        }

        renderMembersScreen();
      }
    });
  } else {
    const joinForm = document.getElementById('form-join-calendar');
    if (joinForm) {
      joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputCode = document.getElementById('join-code-input').value.trim().toUpperCase();
        if (!inputCode.startsWith('CALM-')) {
          alert('\u6b63\u3057\u3044\u62db\u5f85\u30b3\u30fc\u30c9\u306e\u5f62\u5f0f\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002');
          return;
        }

        if (inputCode === state.myInviteCode) {
          alert('\u81ea\u5206\u81ea\u8eab\u306e\u62db\u5f85\u30b3\u30fc\u30c9\u3092\u5165\u529b\u3059\u308b\u3053\u3068\u306f\u3067\u304d\u307e\u305b\u3093\u3002');
          return;
        }

        let isLocalFallback = false;
        let serverData = null;

        try {
          const res = await fetch(`/api/sync?code=${inputCode}`);
          if (res.status === 503 || res.status === 404) {
            isLocalFallback = true;
          } else if (!res.ok) {
            throw new Error('Server error');
          } else {
            serverData = await res.json();
          }
        } catch (error) {
          console.warn('Sync connection failed. Falling back to local simulation:', error);
          isLocalFallback = true;
        }

        if (isLocalFallback) {
          const localDataStr = localStorage.getItem(`calm_local_sync:${inputCode}`);
          if (localDataStr) {
            try {
              serverData = JSON.parse(localDataStr);
            } catch (e) {
              console.error('Failed to parse local sync data', e);
            }
          }
          state.isLocalMode = true;
        } else {
          state.isLocalMode = false;
        }

        try {
          state.isSynced = true;
          state.syncCode = inputCode;
          state.currentUser = 'user-b';

          const myName = state.userAName || '\u3042\u306a\u305f';

          if (serverData && serverData.userAName && !isDefaultOrEmpty(serverData.userAName)) {
            state.userAName = serverData.userAName; 
          } else {
            state.userAName = '\u30d1\u30fc\u30c8\u30ca\u30fc';
          }
          state.userBName = myName; 

          const serverEvents = (serverData && Array.isArray(serverData.events)) ? serverData.events : [];
          const mergedEvents = [...serverEvents];
          state.events.forEach(myEv => {
            if (!mergedEvents.some(se => se.id === myEv.id)) {
              myEv.createdBy = 'user-b';
              mergedEvents.push(myEv);
            }
          });
          state.events = mergedEvents;

          saveEventsToStorage();
          saveUserNamesToStorage();
          saveSyncStatus();
          saveLoginStatus();

          await uploadEventsToServer();

          alert(state.isLocalMode 
            ? '\u9023\u643a\u306b\u6210\u529f\u3057\u307e\u3057\u305f\uff01\uff08\u30b9\u30bf\u30f3\u30c9\u30a2\u30ed\u30f3\u30e2\u30fc\u30c9\u3067\u306e\u64ec\u4f3c\u540c\u671f\uff09' 
            : '\u9023\u643a\u306b\u6210\u529f\u3057\u307e\u3057\u305f\uff01\u30ab\u30ec\u30f3\u30c0\u30fc\u304c\u540c\u671f\u3055\u308c\u307e\u3057\u305f\u3002'
          );
          renderMembersScreen();
        } catch (error) {
          console.error(error);
          alert('\u540c\u671f\u51e6\u7406\u3067\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f\u3002\u30a4\u30f3\u30bf\u30fc\u306d\u30c3\u30c8\u9023\u643a\u3092\u7d39\u4ecb\u3057\u3001\u518d\u5ea6\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002');
        }
      });
    }
  }

// 8-7. 險ｭ螳夂判髱｢ 設定画面
function renderSettingsScreen() {
  appEl.innerHTML = `
    <div class="fade-in">
      <h2 style="font-size: 20px; font-weight: 500; margin-bottom: var(--space-lg); letter-spacing: 0.05em;">設定</h2>

      <div class="settings-list">
        <!-- プロフィール設定 -->
        <div class="settings-section">
          <h3 class="section-title">あなたの名前</h3>
          <div style="display: flex; gap: var(--space-sm);">
            <input class="form-input" type="text" id="setting-username" value="${getCurrentUserName()}" style="flex: 1;">
            <button class="btn btn-primary" id="btn-save-username" style="width: auto; padding: 0 var(--space-lg); flex-shrink: 0; white-space: nowrap;">保存</button>
          </div>
        </div>

        <!-- PWA設定/インストールについて -->
        <div class="settings-section mt-md">
          <h3 class="section-title">PWAについて</h3>
          <div class="settings-item" id="setting-pwa-info">
            <span class="settings-item-label">ホーム画面に追加する</span>
            <span class="pwa-badge">設定方法</span>
          </div>
        </div>

        <!-- データ・その他 -->
        <div class="settings-section mt-md">
          <h3 class="section-title">データとアカウント</h3>
          <div class="settings-item" id="btn-reset-demo">
            <span class="settings-item-label" style="color: var(--danger-color);">データの初期化</span>
            <span class="settings-item-val">初期状態に戻す</span>
          </div>
          <div class="settings-item" id="btn-logout" style="margin-top: 4px;">
            <span class="settings-item-label">ログアウト</span>
            <span class="settings-item-val">ログイン画面へ</span>
          </div>
        </div>

        <!-- アプリ情報 -->
        <div class="text-center mt-xl" style="padding: var(--space-lg) 0;">
          <p style="font-size: 11px; color: var(--text-light); letter-spacing: 0.1em;">Calm Calendar PWA v1.0.0</p>
          <p style="font-size: 10px; color: var(--text-light); margin-top: 4px;">余白のある時間の共有</p>
        </div>
      </div>
    </div>
  `;

  // イベント登録
  // 名前保存
  document.getElementById('btn-save-username').addEventListener('click', async () => {
    const newName = document.getElementById('setting-username').value.trim();
    if (!newName) return;
    
    if (state.currentUser === 'user-a') {
      state.userAName = newName;
      localStorage.setItem('calm_user_a_name', newName);
    } else {
      state.userBName = newName;
      localStorage.setItem('calm_user_b_name', newName);
    }
    saveUserNamesToStorage();
    if (state.isSynced) {
      await uploadEventsToServer(); // 名前変更をサーバーへ反映
    } else {
      await initializeRoomOnServer(); // 未連携時は自分のデータを更新しておく
    }
    alert('表示名を変更しました');
    renderSettingsScreen();
  });

  // PWAインストールガイドモーダル
  document.getElementById('setting-pwa-info').addEventListener('click', () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    let guideHtml = '';
    
    if (isIOS) {
      guideHtml = `
        <p class="login-description" style="text-align: left;">
          iOS端末（Safari）で「Calm Calendar」をホーム画面に追加するには：<br><br>
          1. ブラウザ下部の<strong>「共有ボタン（四角から矢印が飛び出たアイコン）」</strong>をタップします。<br>
          2. メニューを下へスクロールし、<strong>「ホーム画面に追加」</strong>を選択します。<br>
          3. 右上の<strong>「追加」</strong>をタップすると、アプリのようにアイコンがホーム画面に並びます。
        </p>
      `;
    } else {
      guideHtml = `
        <p class="login-description" style="text-align: left;">
          AndroidまたはPCブラウザ（Chromeなど）でホーム画面に追加するには：<br><br>
          1. ブラウザのメニュー（右上または右下の「︙」アイコン）をタップします。<br>
          2. <strong>「ホーム画面に追加」</strong> または <strong>「アプリをインストール」</strong> を選択します。<br>
          3. 画面の指示に従い追加すると、オフライン対応のアプリとして起動できるようになります。
        </p>
      `;
    }

    const contentHtml = `
      <div class="modal-header">
        <h3 class="modal-title">ホーム画面への追加方法</h3>
        <button class="btn-icon js-modal-close" aria-label="閉じる">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div style="margin-bottom: var(--space-lg);">
        ${guideHtml}
      </div>
      <button class="btn btn-primary js-modal-close">閉じる</button>
    `;
    openModal(contentHtml);
  });

  // データの初期化
  document.getElementById('btn-reset-demo').addEventListener('click', () => {
    if (confirm('予定データなどを初期状態に戻してもよろしいですか？（現在の予定はすべて消去されます）')) {
      // calm_ で始まるストレージを削除
      localStorage.removeItem('calm_events');
      localStorage.removeItem('calm_user_a_name');
      localStorage.removeItem('calm_user_b_name');
      localStorage.removeItem('calm_is_synced');
      localStorage.removeItem('calm_sync_code');
      localStorage.removeItem('calm_my_invite_code');

      state.userAName = 'あなた';
      state.userBName = 'パートナー';
      state.isSynced = false;
      state.syncCode = '';
      state.myInviteCode = generateRandomInviteCode();
      localStorage.setItem('calm_my_invite_code', state.myInviteCode);
      state.events = [...DEFAULT_EVENTS];
      
      saveEventsToStorage();
      saveUserNamesToStorage();
      saveSyncStatus();
      
      alert('初期化が完了しました。');
      renderSettingsScreen();
    }
  });

  // ログアウト
  document.getElementById('btn-logout').addEventListener('click', () => {
    if (confirm('ログアウトしますか？')) {
      state.isLoggedIn = false;
      saveLoginStatus();
      renderLoginScreen();
    }
  });
}

// --- 9. ルーティング & 表示制御 (Routing Control) ---

async function initAppView() {
  if (!state.isLoggedIn) {
    renderLoginScreen();
    return;
  }

  bottomNavEl.classList.remove('hidden');
  updateNavIndicator();

  // 現在のタブに応じて描画
  if (state.activeTab === 'calendar') {
    if (state.isSynced) {
      await fetchEventsFromServer(); // 描画前に最新の同期を行う
    }
    renderCalendarScreen();
  } else if (state.activeTab === 'members') {
    if (state.isSynced) {
      await fetchEventsFromServer();
    }
    renderMembersScreen();
  } else if (state.activeTab === 'settings') {
    renderSettingsScreen();
  }
}

// ナビゲーションバーのアクティブクラス更新
function updateNavIndicator() {
  const navItems = bottomNavEl.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
  });

  if (state.activeTab === 'calendar') {
    document.getElementById('nav-calendar').classList.add('active');
  } else if (state.activeTab === 'members') {
    document.getElementById('nav-members').classList.add('active');
  } else if (state.activeTab === 'settings') {
    document.getElementById('nav-settings').classList.add('active');
  }
}

// ナビゲーションバーのイベントバインド
document.getElementById('nav-calendar').addEventListener('click', async () => {
  state.activeTab = 'calendar';
  updateNavIndicator();
  if (state.isSynced) {
    await fetchEventsFromServer();
  }
  renderCalendarScreen();
});

document.getElementById('nav-members').addEventListener('click', async () => {
  state.activeTab = 'members';
  updateNavIndicator();
  if (state.isSynced) {
    await fetchEventsFromServer();
  }
  renderMembersScreen();
});

document.getElementById('nav-settings').addEventListener('click', () => {
  state.activeTab = 'settings';
  updateNavIndicator();
  renderSettingsScreen();
});

// HTMLエスケープ（セキュリティ対策）
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- 10. アプリ初期起動処理 ---
window.addEventListener('DOMContentLoaded', () => {
  loadStateFromStorage();

  // 予定追加ボタンのクリックイベントを1度だけ登録
  const addEventBtn = document.getElementById('btn-add-event');
  if (addEventBtn) {
    addEventBtn.addEventListener('click', showAddEventForm);
  }

  // 自動同期 (ポーリング: 15秒ごと)
    // Auto-sync polling every 5 seconds (Handles LocalStorage simulation + API sync)
  setInterval(async () => {
    if (!state.isLoggedIn) return;

    if (state.isSynced) {
      // Sync events and usernames when connected
      const oldEvents = JSON.stringify(state.events);
      const oldUserAName = state.userAName;
      const oldUserBName = state.userBName;
      
      await fetchEventsFromServer();
      
      const hasChanged = oldEvents !== JSON.stringify(state.events) || 
                         oldUserAName !== state.userAName || 
                         oldUserBName !== state.userBName;
                          
      if (hasChanged) {
        if (state.activeTab === 'calendar') {
          renderCalendarScreen();
        } else if (state.activeTab === 'members') {
          renderMembersScreen();
        }
      }
    } else {
      // Polling for incoming connection when not synced
      if (!state.myInviteCode) return;

      let data = null;

      // Check LocalStorage first (Local emulation)
      const localDataStr = localStorage.getItem(`calm_local_sync:${state.myInviteCode}`);
      if (localDataStr) {
        try {
          data = JSON.parse(localDataStr);
        } catch (e) {
          console.error(e);
        }
      }

      if (data && data.userBName && !isDefaultOrEmpty(data.userBName)) {
        // Detected partner info written to LocalStorage
        state.isSynced = true;
        state.syncCode = state.myInviteCode;
        state.isLocalMode = true;
        state.currentUser = 'user-a';
        state.userBName = data.userBName;
        state.events = data.events;
        
        saveEventsToStorage();
        saveUserNamesToStorage();
        saveSyncStatus();
        saveLoginStatus();
        
        await uploadEventsToServer();
        
        alert(`\u30d1\u30fc\u30c8\u30ca\u30fc\u300c${data.userBName}\u300d\u304c\u3042\u306a\u305f\u306e\u62db\u5f85\u30b3\u30fc\u30c9\u3092\u5165\u529b\u3057\u3001\u540c\u671f\u3055\u308c\u307e\u3057\u305f\uff01`);
        initAppView();
        return;
      }

      // Check server API (Production)
      try {
        const res = await fetch(`/api/sync?code=${state.myInviteCode}`);
        if (res.ok) {
          const apiData = await res.json();
          if (apiData && apiData.userBName && !isDefaultOrEmpty(apiData.userBName)) {
            state.isSynced = true;
            state.syncCode = state.myInviteCode;
            state.isLocalMode = false;
            state.currentUser = 'user-a';
            state.userBName = apiData.userBName;
            state.events = apiData.events;
            
            saveEventsToStorage();
            saveUserNamesToStorage();
            saveSyncStatus();
            saveLoginStatus();
            
            await uploadEventsToServer();
            
            alert(`\u30d1\u30fc\u30c8\u30ca\u30fc\u300c${apiData.userBName}\u300d\u304c\u3042\u306a\u305f\u306e\u62db\u5f85\u30b3\u30fc\u30c9\u3092\u5165\u529b\u3057\u3001\u540c\u671f\u3055\u308c\u307e\u3057\u305f\uff01`);
            initAppView();
          }
        }
      } catch (err) {
        // Ignore API errors in local environment
      }
    }
  }, 5000);

  if (state.isLoggedIn && !state.isSynced) {
    initializeRoomOnServer(); // 起動時に部屋データを確保
  }

  initAppView();
});

