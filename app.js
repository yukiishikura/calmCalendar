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
    id: "demo-1",
    title: "「Calm Calendar」を使い始める",
    date: getOffsetDateString(-2), // 2日前
    time: "10:00",
    note: "複数人向けのカレンダーアプリ。今日から予定をここに共有していきます。",
    createdBy: "user-a"
  },
  {
    id: "demo-2",
    title: "ふたりで晩ごはん",
    date: getOffsetDateString(0), // 今日
    time: "19:00",
    note: "駅前の和食屋さんで晩ごはん。お互い無理のない時間に合流しましょう。",
    createdBy: "user-b"
  },
  {
    id: "demo-3",
    title: "週末の静かなカフェ散策",
    date: getOffsetDateString(2), // 2日後
    time: "14:00",
    note: "Notionのような余白があるカフェを見つけたので、一緒に行ってみませんか？本を持っていこう。",
    createdBy: "user-a"
  },
  {
    id: "demo-4",
    title: "美術館の特別展へ行く",
    date: getOffsetDateString(8), // 8日後
    time: "11:00",
    note: "セージグリーンがテーマの現代アート展。チケットは事前予約済みです。",
    createdBy: "user-b"
  }
];

// 補助関数: 今日からの相対日数の日付文字列を返す (YYYY-MM-DD)
function getOffsetDateString(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

// --- 2. アプリケーション状態 (State) ---
let state = {
  isLoggedIn: false,
  isSynced: true, // デフォルトは連携済み (あなた & はるか)
  currentUser: 'user-a', // 'user-a' (あなた) or 'user-b' (パートナー)
  userAName: 'あなた',
  userBName: 'はるか',
  activeTab: 'calendar', // 'calendar' | 'members' | 'settings'
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(), // 0-11
  selectedDate: new Date().toISOString().split('T')[0],
  events: []
};

// --- 3. データ永続化 (LocalStorage) ---
function loadStateFromStorage() {
  const storedEvents = localStorage.getItem('awai_events');
  if (storedEvents) {
    state.events = JSON.parse(storedEvents);
  } else {
    state.events = [...DEFAULT_EVENTS];
    saveEventsToStorage();
  }

  const storedUserAName = localStorage.getItem('awai_user_a_name');
  if (storedUserAName) state.userAName = storedUserAName;

  const storedUserBName = localStorage.getItem('awai_user_b_name');
  if (storedUserBName) state.userBName = storedUserBName;

  const storedLogin = localStorage.getItem('awai_is_logged_in');
  if (storedLogin === 'true') state.isLoggedIn = true;

  const storedUser = localStorage.getItem('awai_current_user');
  if (storedUser) state.currentUser = storedUser;

  const storedSynced = localStorage.getItem('calm_is_synced');
  if (storedSynced) {
    state.isSynced = storedSynced === 'true';
  } else {
    state.isSynced = true; // デフォルト
  }
}

function saveEventsToStorage() {
  localStorage.setItem('awai_events', JSON.stringify(state.events));
}

function saveUserNamesToStorage() {
  localStorage.setItem('awai_user_a_name', state.userAName);
  localStorage.setItem('awai_user_b_name', state.userBName);
}

function saveLoginStatus() {
  localStorage.setItem('awai_is_logged_in', state.isLoggedIn ? 'true' : 'false');
  localStorage.setItem('awai_current_user', state.currentUser);
  saveSyncStatus();
}

function saveSyncStatus() {
  localStorage.setItem('calm_is_synced', state.isSynced ? 'true' : 'false');
}

// --- 4. ユーティリティ & 補助関数 ---
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

// --- 5. DOM 要素の参照 ---
const appEl = document.getElementById('app');
const bottomNavEl = document.getElementById('bottom-nav');
const modalContainerEl = document.getElementById('modal-container');
const modalBackdropEl = document.getElementById('modal-backdrop');
const modalContentEl = document.getElementById('modal-content');

// --- 6. モーダル制御 ---
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

// --- 7. 各画面のレンダリング (Render Screens) ---

// 7-1. ログイン画面
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
        <p class="login-description">
          無駄な機能を省いた少人数向け共有カレンダーです。
        </p>
        
        <div class="btn-group">
          <button class="btn btn-primary" id="btn-login-a">「${state.userAName}」として入る</button>
          <button class="btn btn-secondary" id="btn-login-b">パートナー「${state.userBName}」として入る</button>
        </div>
      </div>
    </div>
  `;

  // イベント登録
  document.getElementById('btn-login-a').addEventListener('click', () => {
    state.isLoggedIn = true;
    state.currentUser = 'user-a';
    saveLoginStatus();
    initAppView();
  });

  document.getElementById('btn-login-b').addEventListener('click', () => {
    state.isLoggedIn = true;
    state.currentUser = 'user-b';
    saveLoginStatus();
    initAppView();
  });
}

// 7-2. カレンダー画面 (メイン)
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
    // 未同期状態のときは、パートナー(user-b)が作った予定は除外する
    if (!state.isSynced && e.createdBy === 'user-b') return false;
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
    if (!state.isSynced && e.createdBy === 'user-b') return false;
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
        closeModal();
        renderCalendarScreen();
      }
    });
  }
}

// 7-4. 予定追加フォーム
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

      <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label" for="evt-date">日付</label>
          <input class="form-input" type="date" id="evt-date" value="${state.selectedDate}" required>
        </div>
        <div class="form-group">
          <label class="form-label">時間</label>
          <div style="display: flex; gap: var(--space-xs); align-items: center;">
            <select class="form-input" id="evt-time-hour" style="flex: 1; text-align: center; padding-right: 8px;">
              ${Array.from({length: 24}, (_, i) => String(i).padStart(2, '0')).map(h => `<option value="${h}" ${h === '12' ? 'selected' : ''}>${h}</option>`).join('')}
            </select>
            <span style="color: var(--text-muted);">:</span>
            <select class="form-input" id="evt-time-minute" style="flex: 1; text-align: center; padding-right: 8px;">
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
    closeModal();
    // 予定を追加した日付を選択状態にする
    state.selectedDate = newEvent.date;
    const d = new Date(newEvent.date);
    state.currentYear = d.getFullYear();
    state.currentMonth = d.getMonth();
    
    renderCalendarScreen();
  });
}

// 7-5. 予定編集フォーム
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

      <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label" for="evt-edit-date">日付</label>
          <input class="form-input" type="date" id="evt-edit-date" value="${event.date}" required>
        </div>
        <div class="form-group">
          <label class="form-label">時間</label>
          <div style="display: flex; gap: var(--space-xs); align-items: center;">
            <select class="form-input" id="evt-edit-time-hour" style="flex: 1; text-align: center; padding-right: 8px;">
              ${Array.from({length: 24}, (_, i) => String(i).padStart(2, '0')).map(h => `<option value="${h}" ${h === currentHour ? 'selected' : ''}>${h}</option>`).join('')}
            </select>
            <span style="color: var(--text-muted);">:</span>
            <select class="form-input" id="evt-edit-time-minute" style="flex: 1; text-align: center; padding-right: 8px;">
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
    closeModal();
    // 編集した日付を選択状態にする
    state.selectedDate = event.date;
    const d = new Date(event.date);
    state.currentYear = d.getFullYear();
    state.currentMonth = d.getMonth();
    
    renderCalendarScreen();
  });
}

// 7-6. メンバー共有画面 (複数人共有)
function renderMembersScreen() {
  const code = 'CALM-7781-LOVE'; // デモ用の共有コード

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
          連携を解除する (デモ用)
        </button>
      </div>

      <!-- 招待コードの発行 (共有中でも必要) -->
      ${inviteBoxHtml}

      <!-- デモ用のシミュレーション機能 -->
      <div class="login-card" style="margin-bottom: var(--space-xl);">
        <h3 class="section-title">デモ: ユーザーの切り替え</h3>
        <p class="login-description">
          現在は「<strong>${getCurrentUserName()}</strong>」としてログインしています。パートナーが登録した予定をシミュレートするには、ユーザーを切り替えてください。
        </p>
        <button class="btn btn-secondary" id="btn-toggle-user">
          「${getPartnerName()}」に切り替える
        </button>
      </div>
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
          <input class="form-input" type="text" id="join-code-input" placeholder="例: CALM-7781-LOVE" required style="flex: 1; text-align: center; text-transform: uppercase; font-family: monospace; letter-spacing: 0.05em; padding: var(--space-sm);">
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
    document.getElementById('btn-toggle-user').addEventListener('click', () => {
      state.currentUser = state.currentUser === 'user-a' ? 'user-b' : 'user-a';
      saveLoginStatus();
      renderMembersScreen();
    });

    document.getElementById('btn-disconnect').addEventListener('click', () => {
      if (confirm('パートナーとの連携を解除しますか？（解除するとパートナーの予定は表示されなくなります）')) {
        state.isSynced = false;
        state.currentUser = 'user-a'; // 自分のアカウントに戻す
        saveSyncStatus();
        saveLoginStatus();
        renderMembersScreen();
      }
    });
  } else {
    // 未連携の場合のみのイベント
    const joinForm = document.getElementById('form-join-calendar');
    if (joinForm) {
      joinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputCode = document.getElementById('join-code-input').value.trim().toUpperCase();
        if (inputCode === code) {
          state.isSynced = true;
          saveSyncStatus();
          alert('接続に成功しました！カレンダーが最新の状態に同期されました。');
          renderMembersScreen();
        } else {
          alert('コードが正しくありません。再度ご確認ください。');
        }
      });
    }
  }
}

// 7-7. 設定画面
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
            <span class="settings-item-label" style="color: var(--danger-color);">デモデータの初期化</span>
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
  document.getElementById('btn-save-username').addEventListener('click', () => {
    const newName = document.getElementById('setting-username').value.trim();
    if (!newName) return;
    
    if (state.currentUser === 'user-a') {
      state.userAName = newName;
    } else {
      state.userBName = newName;
    }
    saveUserNamesToStorage();
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

  // デモデータの初期化
  document.getElementById('btn-reset-demo').addEventListener('click', () => {
    if (confirm('予定データなどを初期状態に戻してもよろしいですか？（現在の予定はすべて消去されます）')) {
      localStorage.removeItem('awai_events');
      localStorage.removeItem('awai_user_a_name');
      localStorage.removeItem('awai_user_b_name');
      state.userAName = 'あなた';
      state.userBName = 'はるか';
      state.events = [...DEFAULT_EVENTS];
      saveEventsToStorage();
      saveUserNamesToStorage();
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

// --- 8. ルーティング & 表示制御 (Routing Control) ---

function initAppView() {
  if (!state.isLoggedIn) {
    renderLoginScreen();
    return;
  }

  bottomNavEl.classList.remove('hidden');
  updateNavIndicator();

  // 現在のタブに応じて描画
  if (state.activeTab === 'calendar') {
    renderCalendarScreen();
  } else if (state.activeTab === 'members') {
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
document.getElementById('nav-calendar').addEventListener('click', () => {
  state.activeTab = 'calendar';
  updateNavIndicator();
  renderCalendarScreen();
});

document.getElementById('nav-members').addEventListener('click', () => {
  state.activeTab = 'members';
  updateNavIndicator();
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

// --- 9. アプリ初期起動処理 ---
window.addEventListener('DOMContentLoaded', () => {
  loadStateFromStorage();

  // 予定追加ボタンのクリックイベントを1度だけ登録
  const addEventBtn = document.getElementById('btn-add-event');
  if (addEventBtn) {
    addEventBtn.addEventListener('click', showAddEventForm);
  }

  initAppView();
});
