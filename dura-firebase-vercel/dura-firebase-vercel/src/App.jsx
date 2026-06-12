import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ClipboardList,
  Database,
  FileClock,
  LogOut,
  Printer,
  Bot as Robot,
  Save,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Wifi
} from 'lucide-react';
import {
  getBackendName,
  listCollection,
  login,
  logout,
  register,
  saveDocument,
  subscribeAuth,
  firebaseEnabled
} from './firebase.js';
import { branches, demoPatients, wards } from './demoData.js';
import {
  calculateDura,
  createDefaultScores,
  DURA_ITEMS,
  generateSummaryText,
  SCORE_OPTIONS,
  translateMock
} from './duraRules.js';

const nowForInput = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const tabs = [
  { id: 'dashboard', label: 'HEPS 入口', icon: Activity },
  { id: 'patients', label: 'NNS 病患清單', icon: UserRound },
  { id: 'assessment', label: 'DURA 評估', icon: ClipboardList },
  { id: 'history', label: '歷史紀錄', icon: FileClock },
  { id: 'robot', label: '行動機器人', icon: Robot }
];

function Badge({ tone = 'neutral', children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function LoginScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('nurse@dura.demo');
  const [password, setPassword] = useState('123456');
  const [displayName, setDisplayName] = useState('戴婕伊護理師');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'register') {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(firebaseEnabled
        ? `登入/註冊失敗：${err.message}`
        : '本機示範模式登入失敗，請重新整理後再試一次。'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-hero">
        <div className="logo-mark">D</div>
        <p className="eyebrow">HEPS / NNS / DURA</p>
        <h1>DURA 壓瘡危險性評估系統</h1>
        <p>
          依照系統分析圖轉成可操作網站：護理師登入、查詢住院病患、填寫 DURA 表單、
          自動計算風險、儲存紀錄、查詢歷史與列印評估表。
        </p>
        <div className="hero-grid">
          <div><ShieldCheck /> Firebase Auth 登入</div>
          <div><Database /> Firestore 紀錄儲存</div>
          <div><Wifi /> Vercel 前端部署</div>
        </div>
      </section>

      <form className="login-card" onSubmit={handleSubmit}>
        <h2>{mode === 'login' ? '護理師登入' : '建立護理師帳號'}</h2>
        <p className="muted">
          後端狀態：{getBackendName()}。第一次使用 Firebase 時請先切到「註冊」。
        </p>

        {mode === 'register' && (
          <label>
            顯示名稱
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
        )}

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          密碼
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </label>

        {error && <div className="alert danger">{error}</div>}

        <button className="primary" type="submit" disabled={loading}>
          {loading ? '處理中...' : mode === 'login' ? '登入系統' : '註冊並登入'}
        </button>
        <button type="button" className="ghost" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? '第一次使用？切換到註冊' : '已有帳號？切換到登入'}
        </button>
      </form>
    </main>
  );
}

function Header({ user, onLogout }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">DURA Pressure Ulcer Risk Assessment</p>
        <h1>DURA 壓瘡危險性評估系統</h1>
      </div>
      <div className="user-box">
        <div>
          <strong>{user?.displayName || '護理師'}</strong>
          <span>{user?.email || 'local demo'}</span>
        </div>
        <button className="icon-button" onClick={onLogout} title="登出"><LogOut size={18} /></button>
      </div>
    </header>
  );
}

function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">功能選單</div>
      {tabs.map(({ id, label, icon: Icon }) => (
        <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>
          <Icon size={18} /> {label}
        </button>
      ))}
      <div className="sidebar-note">
        <strong>系統流程</strong>
        <span>Access Portal → Login → HEPS → NNS → Patient List → DURA → Save / History / Print</span>
      </div>
    </aside>
  );
}

function Dashboard({ patients, records, selectedPatient, onSeed, seedLoading }) {
  const latest = records.slice().sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))[0];
  const riskCount = records.reduce((acc, item) => {
    acc[item.riskLevel] = (acc[item.riskLevel] || 0) + 1;
    return acc;
  }, {});

  return (
    <section className="content-grid">
      <div className="panel wide intro-panel">
        <Badge tone="info">HEPS 醫療企業入口網站</Badge>
        <h2>系統首頁</h2>
        <p>
          本網站把原本的 Use Case、Activity、Class、State、Sequence、Deployment Diagram 轉成可操作的網頁系統。
          你可以先建立示範病患，再依序進入 NNS 查詢病患、填寫 DURA 表單並將紀錄寫入 Firebase。
        </p>
        <div className="button-row">
          <button className="primary" onClick={onSeed} disabled={seedLoading}>
            {seedLoading ? '建立中...' : '建立 / 更新示範病患資料'}
          </button>
          <button className="ghost" onClick={() => window.print()}><Printer size={16} /> 列印目前頁面</button>
        </div>
      </div>

      <div className="stat-card">
        <span>住院病患</span>
        <strong>{patients.length}</strong>
        <small>Patient Data</small>
      </div>
      <div className="stat-card">
        <span>DURA 紀錄</span>
        <strong>{records.length}</strong>
        <small>DURA Records</small>
      </div>
      <div className="stat-card">
        <span>高風險紀錄</span>
        <strong>{riskCount['高風險'] || 0}</strong>
        <small>High Risk</small>
      </div>
      <div className="stat-card">
        <span>目前病患</span>
        <strong>{selectedPatient ? selectedPatient.bedNo : '未選擇'}</strong>
        <small>{selectedPatient ? selectedPatient.name : 'Select Patient'}</small>
      </div>

      <div className="panel">
        <h3>最近一次評估</h3>
        {latest ? (
          <div className="latest-card">
            <Badge tone={latest.riskTone}>{latest.riskLevel}</Badge>
            <strong>{latest.patientName} / {latest.bedNo}</strong>
            <span>DURA Score：{latest.totalScore}</span>
            <p>{latest.interpretation}</p>
          </div>
        ) : <p className="muted">尚未建立任何 DURA 評估紀錄。</p>}
      </div>

      <div className="panel">
        <h3>Deployment 對應</h3>
        <ul className="clean-list">
          <li><b>前端：</b>React + Vite，部署到 Vercel。</li>
          <li><b>後端：</b>Firebase Auth 管理登入，Firestore 儲存病患與評估紀錄。</li>
          <li><b>列印：</b>瀏覽器 print 模組模擬評估表列印。</li>
          <li><b>機器人：</b>服務對話、摘要、翻譯、藥物配送紀錄寫入 Firestore。</li>
        </ul>
      </div>
    </section>
  );
}

function PatientList({ patients, selectedPatient, setSelectedPatient }) {
  const [branch, setBranch] = useState('全部院區');
  const [ward, setWard] = useState('全部病房');
  const [keyword, setKeyword] = useState('');

  const filtered = patients.filter((patient) => {
    const branchOk = branch === '全部院區' || patient.branch === branch;
    const wardOk = ward === '全部病房' || patient.ward === ward;
    const text = `${patient.patientId} ${patient.name} ${patient.bedNo} ${patient.diagnosis}`;
    return branchOk && wardOk && text.toLowerCase().includes(keyword.toLowerCase());
  });

  return (
    <section className="panel wide">
      <div className="panel-heading">
        <div>
          <Badge tone="info">NNS 護理紀錄系統</Badge>
          <h2>查詢住院病患清單</h2>
        </div>
      </div>

      <div className="filters">
        <label>院區
          <select value={branch} onChange={(e) => setBranch(e.target.value)}>
            {branches.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>病房
          <select value={ward} onChange={(e) => setWard(e.target.value)}>
            {wards.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="search-field">關鍵字
          <div><Search size={16} /><input placeholder="姓名 / 病歷號 / 床號" value={keyword} onChange={(e) => setKeyword(e.target.value)} /></div>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">查無病患資料。請先到 HEPS 首頁建立示範病患，或調整查詢條件。</div>
      ) : (
        <div className="patient-grid">
          {filtered.map((patient) => (
            <button
              key={patient.id || patient.patientId}
              className={`patient-card ${selectedPatient?.patientId === patient.patientId ? 'selected' : ''}`}
              onClick={() => setSelectedPatient(patient)}
            >
              <div>
                <Badge tone={patient.status === '重症照護' ? 'danger' : 'neutral'}>{patient.status}</Badge>
                <h3>{patient.name}</h3>
                <p>{patient.gender} / {patient.age} 歲</p>
              </div>
              <dl>
                <div><dt>病歷號</dt><dd>{patient.patientId}</dd></div>
                <div><dt>院區病房</dt><dd>{patient.branch} / {patient.ward}</dd></div>
                <div><dt>床號</dt><dd>{patient.bedNo}</dd></div>
                <div><dt>診斷</dt><dd>{patient.diagnosis}</dd></div>
              </dl>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function Assessment({ user, selectedPatient, onSaved }) {
  const [recordDateTime, setRecordDateTime] = useState(nowForInput());
  const [scores, setScores] = useState(createDefaultScores());
  const [skinNote, setSkinNote] = useState('薦骨、足跟與耳後皮膚完整，需持續觀察受壓部位。');
  const [nurseName, setNurseName] = useState(user?.displayName || '護理師');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const result = useMemo(() => calculateDura(scores), [scores]);

  function updateScore(key, value) {
    setScores((prev) => ({ ...prev, [key]: Number(value) }));
  }

  async function saveRecord() {
    if (!selectedPatient) {
      setMessage('請先到「NNS 病患清單」選擇病患。');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        patientId: selectedPatient.patientId,
        patientName: selectedPatient.name,
        bedNo: selectedPatient.bedNo,
        branch: selectedPatient.branch,
        ward: selectedPatient.ward,
        recordDateTime,
        scores,
        totalScore: result.totalScore,
        riskLevel: result.riskLevel,
        riskTone: result.riskTone,
        interpretation: result.interpretation,
        preventionPlan: result.plan,
        skinNote,
        nurseName,
        createdBy: user?.uid || 'local-demo-user'
      };
      await saveDocument('duraRecords', payload);
      setMessage('DURA 評估紀錄已儲存成功。');
      onSaved?.();
    } catch (err) {
      setMessage(`儲存失敗：${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="content-grid assessment-grid">
      <div className="panel wide print-area">
        <div className="panel-heading">
          <div>
            <Badge tone="info">DURA 子系統</Badge>
            <h2>填寫 DURA 壓瘡風險評估表</h2>
          </div>
          <button className="ghost" onClick={() => window.print()}><Printer size={16} /> 列印評估表</button>
        </div>

        {!selectedPatient ? (
          <div className="alert warning">尚未選擇病患。請先到「NNS 病患清單」選擇病患後再填寫表單。</div>
        ) : (
          <div className="patient-summary">
            <div><span>病患</span><strong>{selectedPatient.name}</strong></div>
            <div><span>病歷號</span><strong>{selectedPatient.patientId}</strong></div>
            <div><span>床號</span><strong>{selectedPatient.bedNo}</strong></div>
            <div><span>病房</span><strong>{selectedPatient.branch} / {selectedPatient.ward}</strong></div>
          </div>
        )}

        <div className="form-row">
          <label>紀錄日期 / 時間
            <input type="datetime-local" value={recordDateTime} onChange={(e) => setRecordDateTime(e.target.value)} />
          </label>
          <label>評估護理師
            <input value={nurseName} onChange={(e) => setNurseName(e.target.value)} />
          </label>
        </div>

        <div className="score-list">
          {DURA_ITEMS.map((item) => (
            <div className="score-item" key={item.key}>
              <div>
                <h3>{item.label}</h3>
                <p>{item.help}</p>
              </div>
              <select value={scores[item.key]} onChange={(e) => updateScore(item.key, e.target.value)}>
                {SCORE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          ))}
        </div>

        <label>皮膚狀態與照護備註
          <textarea value={skinNote} onChange={(e) => setSkinNote(e.target.value)} rows={4} />
        </label>
      </div>

      <aside className="panel result-card">
        <Badge tone={result.riskTone}>{result.riskLevel}</Badge>
        <h2>DURA Score：{result.totalScore}</h2>
        <p>{result.interpretation}</p>
        <h3>系統建議處置</h3>
        <ul>
          {result.plan.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <div className="button-row vertical">
          <button className="primary" onClick={saveRecord} disabled={saving || !selectedPatient}>
            <Save size={16} /> {saving ? '儲存中...' : '儲存 DURA 紀錄'}
          </button>
          <button className="ghost" onClick={() => setScores(createDefaultScores())}>重設表單分數</button>
        </div>
        {message && <div className={`alert ${message.includes('失敗') || message.includes('請先') ? 'warning' : 'success'}`}>{message}</div>}
        <p className="muted small">此分數規則為課堂系統示範版，可依老師提供的正式 DURA 表單修改。</p>
      </aside>
    </section>
  );
}

function History({ records, selectedPatient }) {
  const [onlySelected, setOnlySelected] = useState(true);
  const visibleRecords = records
    .filter((record) => !onlySelected || !selectedPatient || record.patientId === selectedPatient.patientId)
    .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

  return (
    <section className="panel wide">
      <div className="panel-heading">
        <div>
          <Badge tone="info">DURA History</Badge>
          <h2>查詢 DURA 歷史紀錄</h2>
        </div>
        <label className="switch-row">
          <input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} />
          只顯示目前選擇病患
        </label>
      </div>

      {selectedPatient && (
        <div className="alert info">目前病患：{selectedPatient.name} / {selectedPatient.bedNo}</div>
      )}

      {visibleRecords.length === 0 ? (
        <div className="empty-state">尚無符合條件的 DURA 紀錄。</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>紀錄時間</th>
                <th>病患</th>
                <th>病房床號</th>
                <th>DURA Score</th>
                <th>風險結果</th>
                <th>護理師</th>
                <th>備註</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => (
                <tr key={record.id || `${record.patientId}-${record.createdAtMs}`}>
                  <td>{record.recordDateTime?.replace('T', ' ')}</td>
                  <td>{record.patientName}<br /><small>{record.patientId}</small></td>
                  <td>{record.ward}<br /><small>{record.bedNo}</small></td>
                  <td><strong>{record.totalScore}</strong></td>
                  <td><Badge tone={record.riskTone}>{record.riskLevel}</Badge></td>
                  <td>{record.nurseName}</td>
                  <td>{record.skinNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RobotPanel({ user, selectedPatient, onSaved }) {
  const [conversation, setConversation] = useState('病患表示右足跟有壓迫感，翻身後舒適度改善。家屬詢問是否需要更換軟墊。');
  const [translation, setTranslation] = useState('');
  const [summary, setSummary] = useState('');
  const [medicine, setMedicine] = useState('Acetaminophen 500mg');
  const [deliveryStatus, setDeliveryStatus] = useState('待配送');
  const [message, setMessage] = useState('');

  function generateAiResult() {
    setTranslation(translateMock(conversation));
    setSummary(generateSummaryText(conversation));
  }

  async function saveRobotRecord() {
    setMessage('');
    const patient = selectedPatient || {};
    try {
      const base = {
        patientId: patient.patientId || '未指定',
        patientName: patient.name || '未指定病患',
        bedNo: patient.bedNo || '-',
        createdBy: user?.uid || 'local-demo-user',
        nurseName: user?.displayName || '護理師'
      };
      const generatedSummary = summary || generateSummaryText(conversation);
      const generatedTranslation = translation || translateMock(conversation);

      await saveDocument('serviceRecords', {
        ...base,
        conversationContent: conversation,
        translatedContent: generatedTranslation,
        createdAtMs: Date.now()
      });
      await saveDocument('nursingSummaries', {
        ...base,
        summaryContent: generatedSummary,
        createdAtMs: Date.now()
      });
      await saveDocument('medicationDispatches', {
        ...base,
        medicationName: medicine,
        deliveryStatus,
        createdAtMs: Date.now()
      });
      setTranslation(generatedTranslation);
      setSummary(generatedSummary);
      setMessage('行動機器人服務紀錄、護理摘要與藥物配送資料已儲存。');
      onSaved?.();
    } catch (err) {
      setMessage(`儲存失敗：${err.message}`);
    }
  }

  return (
    <section className="content-grid robot-grid">
      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <Badge tone="info">Mobile Robot / GAI Backend</Badge>
            <h2>行動機器人輔助臨床照護</h2>
          </div>
        </div>
        <p className="muted">
          這裡把圖中的 Digital Twins Assistance、Auto Service Record、Auto Nurse Notes Summary、Auto Conversation Translation、Auto Medication Dispatch 做成可儲存的示範功能。
        </p>

        <label>自動記錄服務對話 ASR
          <textarea rows={6} value={conversation} onChange={(e) => setConversation(e.target.value)} />
        </label>

        <div className="form-row">
          <label>藥物名稱
            <input value={medicine} onChange={(e) => setMedicine(e.target.value)} />
          </label>
          <label>配送狀態
            <select value={deliveryStatus} onChange={(e) => setDeliveryStatus(e.target.value)}>
              <option>待配送</option>
              <option>配送中</option>
              <option>已送達</option>
              <option>需人工確認</option>
            </select>
          </label>
        </div>

        <div className="button-row">
          <button className="ghost" onClick={generateAiResult}><Robot size={16} /> 產生翻譯與護理摘要</button>
          <button className="primary" onClick={saveRobotRecord}><Save size={16} /> 儲存機器人紀錄</button>
        </div>
        {message && <div className={`alert ${message.includes('失敗') ? 'warning' : 'success'}`}>{message}</div>}
      </div>

      <div className="panel">
        <h3>ACT 自動語音翻譯</h3>
        <p className="output-box">{translation || '按下「產生翻譯與護理摘要」後顯示翻譯內容。'}</p>
      </div>
      <div className="panel">
        <h3>ANNS 自動護理摘要</h3>
        <p className="output-box">{summary || '按下「產生翻譯與護理摘要」後顯示摘要內容。'}</p>
      </div>
    </section>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);

  async function reloadData() {
    setLoading(true);
    try {
      const [patientDocs, recordDocs] = await Promise.all([
        listCollection('patients'),
        listCollection('duraRecords')
      ]);
      const normalizedPatients = patientDocs.map((item) => ({ ...item, patientId: item.patientId || item.id }));
      setPatients(normalizedPatients);
      setRecords(recordDocs);
      if (selectedPatient) {
        const fresh = normalizedPatients.find((item) => item.patientId === selectedPatient.patientId);
        if (fresh) setSelectedPatient(fresh);
      }
    } finally {
      setLoading(false);
    }
  }

  async function seedPatients() {
    setSeedLoading(true);
    try {
      await Promise.all(demoPatients.map((patient) => saveDocument('patients', patient, patient.patientId)));
      await reloadData();
    } finally {
      setSeedLoading(false);
    }
  }

  useEffect(() => {
    const unsub = subscribeAuth((currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (user) reloadData();
  }, [user]);

  if (!authReady) return <div className="loading-screen">載入系統中...</div>;
  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <Header user={user} onLogout={logout} />
      <div className="layout">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="main-content">
          <div className="system-status">
            <span>後端：{getBackendName()}</span>
            <span>{loading ? '資料同步中...' : '資料已同步'}</span>
            {selectedPatient && <span>目前病患：{selectedPatient.name} / {selectedPatient.bedNo}</span>}
          </div>

          {activeTab === 'dashboard' && (
            <Dashboard
              patients={patients}
              records={records}
              selectedPatient={selectedPatient}
              onSeed={seedPatients}
              seedLoading={seedLoading}
            />
          )}
          {activeTab === 'patients' && (
            <PatientList patients={patients} selectedPatient={selectedPatient} setSelectedPatient={(patient) => {
              setSelectedPatient(patient);
              setActiveTab('assessment');
            }} />
          )}
          {activeTab === 'assessment' && (
            <Assessment user={user} selectedPatient={selectedPatient} onSaved={reloadData} />
          )}
          {activeTab === 'history' && (
            <History records={records} selectedPatient={selectedPatient} />
          )}
          {activeTab === 'robot' && (
            <RobotPanel user={user} selectedPatient={selectedPatient} onSaved={reloadData} />
          )}
        </main>
      </div>
    </div>
  );
}
