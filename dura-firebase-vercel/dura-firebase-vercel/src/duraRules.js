export const DURA_ITEMS = [
  {
    key: 'sensory',
    label: '感覺知覺 / 意識狀態',
    help: '病患是否能感覺疼痛、壓迫並表達不適。'
  },
  {
    key: 'moisture',
    label: '皮膚濕度',
    help: '排汗、失禁、滲液造成皮膚潮濕的頻率。'
  },
  {
    key: 'activity',
    label: '活動能力',
    help: '能否下床、坐起、站立或走動。'
  },
  {
    key: 'mobility',
    label: '翻身 / 移動能力',
    help: '能否自行改變姿勢、減少局部受壓。'
  },
  {
    key: 'nutrition',
    label: '營養攝取狀況',
    help: '飲食、蛋白質攝取與體重變化情形。'
  },
  {
    key: 'friction',
    label: '摩擦與剪力',
    help: '移位、滑落、搬動時是否容易造成皮膚損傷。'
  },
  {
    key: 'devicePressure',
    label: '醫療管路 / 裝置壓迫',
    help: '氧氣管、導尿管、固定帶、監測貼片等是否造成壓迫。'
  }
];

export const SCORE_OPTIONS = [
  { value: 1, label: '1 分：非常差 / 高危險' },
  { value: 2, label: '2 分：偏差 / 需密切注意' },
  { value: 3, label: '3 分：普通 / 有部分風險' },
  { value: 4, label: '4 分：良好 / 低風險' }
];

export function createDefaultScores() {
  return DURA_ITEMS.reduce((acc, item) => {
    acc[item.key] = 3;
    return acc;
  }, {});
}

export function calculateDura(scores) {
  const totalScore = DURA_ITEMS.reduce((sum, item) => sum + Number(scores[item.key] || 0), 0);

  if (totalScore <= 12) {
    return {
      totalScore,
      riskLevel: '高風險',
      riskTone: 'danger',
      interpretation: '需要立即建立翻身、減壓與皮膚追蹤計畫。',
      plan: [
        '每 2 小時翻身並記錄姿位',
        '使用減壓床墊或軟墊保護骨突處',
        '每日檢查受壓部位皮膚顏色、溫度與完整性',
        '通知護理長或醫療團隊評估營養與傷口照護'
      ]
    };
  }

  if (totalScore <= 18) {
    return {
      totalScore,
      riskLevel: '中風險',
      riskTone: 'warning',
      interpretation: '已有明顯危險因子，需加強預防與交班提醒。',
      plan: [
        '每班至少檢查一次皮膚狀態',
        '鼓勵或協助病患定時變換姿勢',
        '保持皮膚乾燥並注意失禁照護',
        '追蹤營養攝取與活動能力變化'
      ]
    };
  }

  return {
    totalScore,
    riskLevel: '低風險',
    riskTone: 'success',
    interpretation: '目前壓瘡風險較低，仍需維持例行評估。',
    plan: [
      '維持每日例行皮膚檢查',
      '提醒病患適度活動與補充營養',
      '若病況改變，重新執行 DURA 評估'
    ]
  };
}

export function generateSummaryText(text) {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '尚未輸入服務對話內容。';
  const firstSentence = cleaned.split(/[。！？!?]/).filter(Boolean)[0] || cleaned;
  return `護理摘要：本次服務重點為「${firstSentence.slice(0, 80)}」。建議後續交班持續追蹤病患舒適度、皮膚受壓狀況、藥物配送確認與照護需求。`;
}

export function translateMock(text) {
  if (!text.trim()) return '尚未輸入可翻譯內容。';
  return `繁體中文翻譯示範：${text.trim()}`;
}
