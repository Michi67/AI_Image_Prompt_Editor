/*
  AI Image Prompt Editor - script.js
  Copyright (c) 2025 Michihiro.Takagi
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

// script.js

const selectionArea = document.getElementById('selection-area');
const promptList = document.getElementById('prompt-list');
const negativeList = document.getElementById('negative-list');
const promptOutput = document.getElementById('prompt-output');
const negativeOutput = document.getElementById('negative-output');
const copyPromptBtn = document.getElementById('copy-prompt-btn');
const resetPromptBtn = document.getElementById('reset-prompt-btn');
const copyNegativeBtn = document.getElementById('copy-negative-btn');
const resetNegativeBtn = document.getElementById('reset-negative-btn');
const promptSelectionArea = document.getElementById('prompt-selection-area');
const negativeSelectionArea = document.getElementById('negative-selection-area');

function setErrorMessage(msg) {
  // エラーメッセージはコンソールに出力（必要に応じてUIに統合可能）
  if (msg) {
    console.log('Info:', msg);
  }
}

// 強調・弱化レベル定義
const EMPHASIS_MIN = 1.0;
const EMPHASIS_MAX = 2.0;
const EMPHASIS_STEP = 0.2;

// 選択中キーワード管理
let selectedPromptKeywords = [];
let selectedNegativeKeywords = [];

// キーワードの一意識別用ID生成
function keywordId(category, key) {
  return `${category}__${key}`;
}

// JSONデータ読み込み＆UI生成
function clearKeywordSelection() {
  // 各エリアの子要素（h2以外）を削除
  Array.from(promptSelectionArea.children).forEach(child => {
    if (child.tagName !== 'H2') promptSelectionArea.removeChild(child);
  });
  Array.from(negativeSelectionArea.children).forEach(child => {
    if (child.tagName !== 'H2') negativeSelectionArea.removeChild(child);
  });
  // 既存のカテゴリも削除
  document.querySelectorAll('#prompt-selection-area .category').forEach(e => e.remove());
  document.querySelectorAll('#negative-selection-area .category').forEach(e => e.remove());
}

function loadKeywordsFromData(data, settings = null) {
  window._keywordsDataCache = data; // データをキャッシュ
  clearKeywordSelection();
  selectedPromptKeywords = [];
  selectedNegativeKeywords = [];
  document.querySelectorAll('#selection-area input[type="checkbox"]').forEach(cb => cb.checked = false);
  createKeywordSelection(data.prompt, 'prompt', promptSelectionArea);
  createKeywordSelection(data.negative_prompt, 'negative_prompt', negativeSelectionArea);
  
  // 設定情報を適用
  if (settings) {
    // desc表示状態を適用
    if (typeof settings.showDesc === 'boolean') {
      showDesc = settings.showDesc;
      const showDescCheckbox = document.getElementById('show-desc-checkbox');
      if (showDescCheckbox) {
        showDescCheckbox.checked = showDesc;
      }
    }
    
    // チェック状態を適用
    if (settings.checkedKeywords) {
      // プロンプトキーワードのチェック状態を復元
      if (settings.checkedKeywords.prompt) {
        settings.checkedKeywords.prompt.forEach(item => {
          const id = keywordId(item.category, item.key);
          const cb = document.getElementById(id);
          if (cb) {
            cb.checked = true;
            // selectedPromptKeywordsにも追加
            const desc = getKeywordDesc(item.key, item.category, 'prompt');
            selectedPromptKeywords.push({
              id,
              key: item.key,
              category: item.category,
              type: 'prompt',
              emphasisType: 'normal',
              emphasisValue: 1.0,
              desc: desc || ''
            });
          }
        });
      }
      
      // ネガティブプロンプトキーワードのチェック状態を復元
      if (settings.checkedKeywords.negative_prompt) {
        settings.checkedKeywords.negative_prompt.forEach(item => {
          const id = keywordId(item.category, item.key);
          const cb = document.getElementById(id);
          if (cb) {
            cb.checked = true;
            // selectedNegativeKeywordsにも追加
            const desc = getKeywordDesc(item.key, item.category, 'negative_prompt');
            selectedNegativeKeywords.push({
              id,
              key: item.key,
              category: item.category,
              type: 'negative_prompt',
              emphasisType: 'normal',
              emphasisValue: 1.0,
              desc: desc || ''
            });
          }
        });
      }
    }
  } else {
    // 設定情報がない場合は初期状態にリセット
    showDesc = false;
    const showDescCheckbox = document.getElementById('show-desc-checkbox');
    if (showDescCheckbox) {
      showDescCheckbox.checked = false;
    }
  }
  
  renderOutputLists();
  
  // カテゴリのドラッグアンドドロップを初期化
  initializeCategorySortable();
  
  // desc表示状態を更新
  updateDescVisibility();
}



function createKeywordSelection(categories, type, targetArea) {
  categories.forEach(cat => {
    const catDiv = document.createElement('div');
    catDiv.className = 'category';
    catDiv.dataset.category = cat.category;
    catDiv.dataset.type = type;
    
    const title = document.createElement('div');
    title.className = 'category-title';
    title.textContent = cat.category;
    
    const desc = document.createElement('div');
    desc.className = 'category-desc';
    desc.textContent = cat.description;
    desc.style.display = 'block'; // カテゴリの説明は常に表示
    
    const list = document.createElement('div');
    list.className = 'keywords-list';
    cat.keywords.forEach(kw => {
      const item = document.createElement('label');
      item.className = 'keyword-item';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.category = cat.category;
      checkbox.dataset.key = kw.key;
      checkbox.dataset.type = type;
      checkbox.id = keywordId(cat.category, kw.key);
      checkbox.addEventListener('change', onKeywordToggle);
      // keyラベル
      const keySpan = document.createElement('span');
      keySpan.textContent = kw.key;
      keySpan.className = 'keyword-key-label';
      keySpan.style.cursor = 'pointer';
      keySpan.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        const input = document.createElement('input');
        input.type = 'text';
        input.value = keySpan.textContent;
        input.style.width = '8em';
        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', function(ev) {
          if (ev.key === 'Enter') input.blur();
        });
        keySpan.replaceWith(input);
        input.focus();
        function finishEdit() {
          const newKey = input.value.trim();
          if (newKey && newKey !== kw.key) {
            // window._keywordsDataCacheのkeyを更新
            let data = window._keywordsDataCache;
            let arr = type === 'prompt' ? data.prompt : data.negative_prompt;
            let catObj = arr.find(c => c.category === cat.category);
            if (catObj) {
              let kwObj = catObj.keywords.find(k => k.key === kw.key);
              if (kwObj) kwObj.key = newKey;
            }
            // selectedPromptKeywords/selectedNegativeKeywordsの古いkeyの要素を削除し、新しいkeyの要素を追加
            let selArr = type === 'prompt' ? selectedPromptKeywords : selectedNegativeKeywords;
            const oldKey = kw.key;
            const oldId = keywordId(cat.category, oldKey);
            // descも再取得
            let newDesc = '';
            if (catObj) {
              let kwObj = catObj.keywords.find(k2 => k2.key === newKey);
              if (kwObj) newDesc = kwObj.desc;
            }
            // 削除
            selArr = selArr.filter(k => !(k.key === oldKey && k.category === cat.category));
            // 追加
            selArr.push({
              id: keywordId(cat.category, newKey),
              key: newKey,
              category: cat.category,
              type: type,
              emphasisType: 'normal',
              emphasisValue: 1.0,
              desc: newDesc
            });
            if (type === 'prompt') {
              selectedPromptKeywords = selArr.slice();
            } else {
              selectedNegativeKeywords = selArr.slice();
            }
            // チェックボックスIDも更新
            checkbox.dataset.key = newKey;
            checkbox.id = keywordId(cat.category, newKey);
            // 編集後に存在しないものをリストから除外
            function existsInKeywordsData(type, k) {
              let data = window._keywordsDataCache;
              let arr = type === 'prompt' ? data.prompt : data.negative_prompt;
              let catObj = arr.find(c => c.category === k.category);
              if (!catObj) return false;
              return catObj.keywords.some(kw => kw.key === k.key);
            }
            if (type === 'prompt') {
              selectedPromptKeywords = selectedPromptKeywords.filter(k => existsInKeywordsData('prompt', k));
            } else {
              selectedNegativeKeywords = selectedNegativeKeywords.filter(k => existsInKeywordsData('negative_prompt', k));
            }
            // 再描画
            renderOutputLists();
          }
          // spanに戻す
          input.replaceWith(keySpan);
          keySpan.textContent = input.value;
        }
      });
      // descラベル
      const descSpan = document.createElement('span');
      descSpan.textContent = `（${kw.desc}）`;
      descSpan.className = 'keyword-desc-label';
      descSpan.style.color = '#888';
      descSpan.style.cursor = 'pointer';
      descSpan.style.display = showDesc ? 'inline' : 'none';
      descSpan.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        const textarea = document.createElement('textarea');
        textarea.value = kw.desc;
        textarea.rows = 1;
        textarea.style.width = '10em';
        textarea.addEventListener('blur', finishEdit);
        textarea.addEventListener('keydown', function(ev) {
          if (ev.key === 'Enter') textarea.blur();
        });
        descSpan.replaceWith(textarea);
        textarea.focus();
        function finishEdit() {
          const newDesc = textarea.value.trim();
          if (newDesc !== kw.desc) {
            // window._keywordsDataCacheのdescを更新
            let data = window._keywordsDataCache;
            let arr = type === 'prompt' ? data.prompt : data.negative_prompt;
            let catObj = arr.find(c => c.category === cat.category);
            if (catObj) {
              let kwObj = catObj.keywords.find(k => k.key === kw.key);
              if (kwObj) kwObj.desc = newDesc;
            }
            // selectedPromptKeywords/selectedNegativeKeywordsも更新
            let selArr = type === 'prompt' ? selectedPromptKeywords : selectedNegativeKeywords;
            selArr.forEach(k => {
              if (k.key === kw.key && k.category === cat.category) {
                k.desc = newDesc;
              }
            });
            // 編集後に存在しないものをリストから除外
            function existsInKeywordsData(type, k) {
              let data = window._keywordsDataCache;
              let arr = type === 'prompt' ? data.prompt : data.negative_prompt;
              let catObj = arr.find(c => c.category === k.category);
              if (!catObj) return false;
              return catObj.keywords.some(kw => kw.key === k.key);
            }
            if (type === 'prompt') {
              selectedPromptKeywords = selectedPromptKeywords.filter(k => existsInKeywordsData('prompt', k));
            } else {
              selectedNegativeKeywords = selectedNegativeKeywords.filter(k => existsInKeywordsData('negative_prompt', k));
            }
            // 再描画
            renderOutputLists();
          }
          // spanに戻す
          textarea.replaceWith(descSpan);
          descSpan.textContent = `（${textarea.value}）`;
        }
      });
      item.appendChild(checkbox);
      item.appendChild(keySpan);
      item.appendChild(descSpan);
      list.appendChild(item);
    });
    catDiv.appendChild(title);
    catDiv.appendChild(desc);
    catDiv.appendChild(list);
    targetArea.appendChild(catDiv);
  });
}

function onKeywordToggle(e) {
  const checkbox = e.target;
  const id = keywordId(checkbox.dataset.category, checkbox.dataset.key);
  const type = checkbox.dataset.type;
  let arr = type === 'prompt' ? selectedPromptKeywords : selectedNegativeKeywords;
  if (checkbox.checked) {
    // descをwindow._keywordsDataCacheから取得
    let desc = '';
    let data = window._keywordsDataCache;
    if (data) {
      let arrData = type === 'prompt' ? data.prompt : data.negative_prompt;
      let cat = arrData.find(c => c.category === checkbox.dataset.category);
      if (cat) {
        let kw = cat.keywords.find(k => k.key === checkbox.dataset.key);
        if (kw) desc = kw.desc || '';
      }
    }
    arr.push({
      id,
      key: checkbox.dataset.key,
      category: checkbox.dataset.category,
      type: checkbox.dataset.type,
      emphasisType: 'normal', // 'normal'|'strong'|'weak'
      emphasisValue: 1.0,
      desc
    });
  } else {
    arr = arr.filter(k => k.id !== id);
  }
  if (type === 'prompt') selectedPromptKeywords = arr;
  else selectedNegativeKeywords = arr;
  renderOutputLists();
}
function renderOutputLists() {
  // プロンプト
  renderOutputList(promptList, selectedPromptKeywords, 'prompt');
  // ネガティブ
  renderOutputList(negativeList, selectedNegativeKeywords, 'negative');
  updatePromptOutput();
  updateNegativeOutput();
}
function renderOutputList(listElem, arr, type) {
  listElem.innerHTML = '';
  arr.forEach((kw, idx) => {
    const li = document.createElement('li');
    li.dataset.id = kw.id;
    // キーワード表示
    const kwSpan = document.createElement('span');
    kwSpan.textContent = formatEmphasis(kw);
    // 日本語説明
    const descText = getKeywordDesc(kw.key, kw.category, type);
    const descSpan = document.createElement('span');
    descSpan.className = 'list-desc';
    descSpan.textContent = descText ? `（${descText}）` : '';
    descSpan.style.display = showDesc ? 'inline' : 'none';
    // 削除ボタン
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Delete';
    removeBtn.title = 'Remove from list';
    removeBtn.addEventListener('click', () => {
      if (type === 'prompt') {
        selectedPromptKeywords = selectedPromptKeywords.filter(k => k.id !== kw.id);
      } else {
        selectedNegativeKeywords = selectedNegativeKeywords.filter(k => k.id !== kw.id);
      }
      // チェックボックスも外す
      const cb = document.getElementById(kw.id);
      if (cb) cb.checked = false;
      renderOutputLists();
    });
    // 強調・弱化コントロール
    const weightDiv = document.createElement('div');
    weightDiv.className = 'weight-controls';
    const minusBtn = document.createElement('button');
    minusBtn.className = 'weight-btn';
    minusBtn.textContent = '－';
    minusBtn.title = 'Decrease/Weaken';
    // ボタンの有効/無効制御
    minusBtn.disabled = (kw.emphasisType === 'strong' && kw.emphasisValue <= EMPHASIS_MIN) || (kw.emphasisType === 'weak' && kw.emphasisValue >= EMPHASIS_MAX);
    minusBtn.addEventListener('click', () => {
      if (kw.emphasisType === 'normal') {
        // 通常→弱化1.0
        kw.emphasisType = 'weak';
        kw.emphasisValue = EMPHASIS_MIN;
      } else if (kw.emphasisType === 'strong') {
        // 強化倍率ダウン
        if (kw.emphasisValue > EMPHASIS_MIN) {
          kw.emphasisValue = Math.max(EMPHASIS_MIN, Math.round((kw.emphasisValue - EMPHASIS_STEP) * 10) / 10);
          if (kw.emphasisValue <= EMPHASIS_MIN) {
            kw.emphasisType = 'normal';
            kw.emphasisValue = EMPHASIS_MIN;
          }
        } else if (kw.emphasisValue === EMPHASIS_MIN) {
          // 強化1.0で「－」→通常
          kw.emphasisType = 'normal';
          kw.emphasisValue = EMPHASIS_MIN;
        }
      } else if (kw.emphasisType === 'weak') {
        // 弱化倍率アップ
        if (kw.emphasisValue < EMPHASIS_MAX) {
          kw.emphasisValue = Math.min(EMPHASIS_MAX, Math.round((kw.emphasisValue + EMPHASIS_STEP) * 10) / 10);
        }
      }
      renderOutputLists();
    });
    const plusBtn = document.createElement('button');
    plusBtn.className = 'weight-btn';
    plusBtn.textContent = '＋';
    plusBtn.title = 'Increase/Strengthen';
    // ボタンの有効/無効制御
    plusBtn.disabled = (kw.emphasisType === 'strong' && kw.emphasisValue >= EMPHASIS_MAX) || (kw.emphasisType === 'weak' && kw.emphasisValue <= EMPHASIS_MIN);
    plusBtn.addEventListener('click', () => {
      if (kw.emphasisType === 'normal') {
        // 通常→強化1.0
        kw.emphasisType = 'strong';
        kw.emphasisValue = EMPHASIS_MIN;
      } else if (kw.emphasisType === 'strong') {
        // 強化倍率アップ
        if (kw.emphasisValue < EMPHASIS_MAX) {
          kw.emphasisValue = Math.min(EMPHASIS_MAX, Math.round((kw.emphasisValue + EMPHASIS_STEP) * 10) / 10);
        }
      } else if (kw.emphasisType === 'weak') {
        // 弱化倍率ダウン
        if (kw.emphasisValue > EMPHASIS_MIN) {
          kw.emphasisValue = Math.max(EMPHASIS_MIN, Math.round((kw.emphasisValue - EMPHASIS_STEP) * 10) / 10);
          if (kw.emphasisValue <= EMPHASIS_MIN) {
            kw.emphasisType = 'normal';
            kw.emphasisValue = EMPHASIS_MIN;
          }
        } else if (kw.emphasisValue === EMPHASIS_MIN) {
          // 弱化1.0で「＋」→通常
          kw.emphasisType = 'normal';
          kw.emphasisValue = EMPHASIS_MIN;
        }
      }
      renderOutputLists();
    });
    weightDiv.appendChild(minusBtn);
    weightDiv.appendChild(plusBtn);
    li.appendChild(kwSpan);
    li.appendChild(descSpan);
    li.appendChild(removeBtn);
    li.appendChild(weightDiv);
    listElem.appendChild(li);
  });
}
// 強調・弱化の表示フォーマット
function formatEmphasis(kw) {
  if (kw.emphasisType === 'normal') return kw.key;
  if (kw.emphasisType === 'strong') {
    if (kw.emphasisValue === 1.0) return `(${kw.key})`;
    return `(${kw.key}:${kw.emphasisValue.toFixed(1)})`;
  }
  if (kw.emphasisType === 'weak') {
    if (kw.emphasisValue === 1.0) return `[${kw.key}]`;
    return `[${kw.key}:${kw.emphasisValue.toFixed(1)}]`;
  }
  return kw.key;
}

function getKeywordDesc(key, category, type) {
  // dataを参照してdescを取得
  let data = window._keywordsDataCache;
  if (!data) return '';
  let arr = type === 'prompt' ? data.prompt : data.negative_prompt;
  for (const cat of arr) {
    if (cat.category === category) {
      const found = cat.keywords.find(k => k.key === key);
      if (found) return found.desc;
    }
  }
  return '';
}

// --- カテゴリdescription取得ヘルパー ---
function getCategoryDescription(type, category) {
  let dataArr = type === 'prompt' ? (window._keywordsDataCache?.prompt || []) : (window._keywordsDataCache?.negative_prompt || []);
  let cat = dataArr.find(c => c.category === category);
  return cat ? cat.description || '' : '';
}

// SortableJSによる並び替え
new Sortable(promptList, {
  animation: 150,
  onEnd: function (evt) {
    if (evt.oldIndex !== evt.newIndex) {
      const moved = selectedPromptKeywords.splice(evt.oldIndex, 1)[0];
      selectedPromptKeywords.splice(evt.newIndex, 0, moved);
      renderOutputLists();
    }
  }
});
new Sortable(negativeList, {
  animation: 150,
  onEnd: function (evt) {
    if (evt.oldIndex !== evt.newIndex) {
      const moved = selectedNegativeKeywords.splice(evt.oldIndex, 1)[0];
      selectedNegativeKeywords.splice(evt.newIndex, 0, moved);
      renderOutputLists();
    }
  }
});
function updatePromptOutput() {
  const prompt = selectedPromptKeywords.map(kw => formatEmphasis(kw)).join(', ');
  promptOutput.value = prompt;
}
function updateNegativeOutput() {
  const prompt = selectedNegativeKeywords.map(kw => formatEmphasis(kw)).join(', ');
  negativeOutput.value = prompt;
}

// --- copy/resetボタンのイベントリスナー ---
copyPromptBtn.addEventListener('click', () => {
  promptOutput.select();
  document.execCommand('copy');
  copyPromptBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyPromptBtn.textContent = 'Copy';
  }, 1200);
});
resetPromptBtn.addEventListener('click', () => {
  selectedPromptKeywords = [];
  document.querySelectorAll('#selection-area input[type="checkbox"][data-type="prompt"]').forEach(cb => cb.checked = false);
  renderOutputLists();
});
copyNegativeBtn.addEventListener('click', () => {
  negativeOutput.select();
  document.execCommand('copy');
  copyNegativeBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyNegativeBtn.textContent = 'Copy';
  }, 1200);
});
resetNegativeBtn.addEventListener('click', () => {
  selectedNegativeKeywords = [];
  document.querySelectorAll('#selection-area input[type="checkbox"][data-type="negative_prompt"]').forEach(cb => cb.checked = false);
  renderOutputLists();
});

// 新しいUI要素の取得
const loadKeywordsBtn = document.getElementById('load-keywords-btn');
const keywordsFileInput = document.getElementById('keywords-file-input');
const loadPresetsBtn = document.getElementById('load-presets-btn');
const presetsFileInput = document.getElementById('presets-file-input');
const savePresetsBtn = document.getElementById('save-presets-btn');
const saveKeywordsBtn = document.getElementById('save-keywords-btn');


// --- Add Keyword モーダルUI制御 ---
const addKeywordBtn = document.getElementById('add-keyword-btn');
const addKeywordModal = document.getElementById('add-keyword-modal');
const closeAddKeywordModal = document.getElementById('close-add-keyword-modal');
const addKeywordForm = document.getElementById('add-keyword-form');
const addKeywordType = document.getElementById('add-keyword-type');
const addKeywordCategory = document.getElementById('add-keyword-category');
const addKeywordCategoryList = document.getElementById('add-keyword-category-list');
const addKeywordDescription = document.getElementById('add-keyword-description');
const addKeywordKey = document.getElementById('add-keyword-key');
const addKeywordDesc = document.getElementById('add-keyword-desc');
const addKeywordCount = document.getElementById('add-keyword-count');

// 同時作成数プルダウン初期化
addKeywordCount.innerHTML = '';
for (let i = 1; i <= 20; i++) {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = i;
  addKeywordCount.appendChild(opt);
}

// カテゴリリスト初期化
function updateAddKeywordCategoryList() {
  addKeywordCategoryList.innerHTML = '';
  const type = addKeywordType.value;
  let data = window._keywordsDataCache;
  if (!data) return;
  let arr = type === 'prompt' ? data.prompt : data.negative_prompt;
  const cats = arr.map(c => c.category);
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    addKeywordCategoryList.appendChild(opt);
  });
}
addKeywordType.addEventListener('change', updateAddKeywordCategoryList);

// モーダル表示
addKeywordBtn.addEventListener('click', () => {
  addKeywordModal.classList.add('show');
  addKeywordType.value = 'prompt';
  addKeywordCategory.value = '';
  addKeywordDescription.value = '';
  addKeywordKey.value = '';
  addKeywordDesc.value = '';
  addKeywordCount.value = '1';
  updateAddKeywordCategoryList();
});
// モーダル閉じる
closeAddKeywordModal.addEventListener('click', () => {
  addKeywordModal.classList.remove('show');
  // transformをリセット
  const modalContent = addKeywordModal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.transform = 'translate3d(0, 0, 0)';
  }
});
// モーダル外クリックで閉じる
addKeywordModal.addEventListener('mousedown', (e) => {
  if (e.target === addKeywordModal) {
    addKeywordModal.classList.remove('show');
    // transformをリセット
    const modalContent = addKeywordModal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.style.transform = 'translate3d(0, 0, 0)';
    }
  }
});

// Addボタンの機能実装
addKeywordForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const type = addKeywordType.value;
  const category = addKeywordCategory.value.trim();
  const description = addKeywordDescription.value.trim();
  const key = addKeywordKey.value.trim();
  const desc = addKeywordDesc.value.trim();
  const count = parseInt(addKeywordCount.value);
  
  // 必須項目のチェック
  if (!category || !key) {
    setErrorMessage('Category and Key are required.');
    return;
  }
  
  // データキャッシュの確認
  let data = window._keywordsDataCache;
  if (!data) {
    data = { prompt: [], negative_prompt: [] };
    window._keywordsDataCache = data;
  }
  
  // カテゴリとキーワードの追加
  let arr = type === 'prompt' ? data.prompt : data.negative_prompt;
  let catObj = arr.find(c => c.category === category);
  let isNewCategory = false;
  
  if (!catObj) {
    // 新カテゴリ作成
    catObj = { category: category, description: description, keywords: [] };
    arr.push(catObj);
    isNewCategory = true;
  } else if (description && catObj.description !== description) {
    // 既存カテゴリのdescription更新
    catObj.description = description;
  }
  
  // キーワード追加（複数作成対応）
  for (let i = 0; i < count; i++) {
    let newKey = key;
    if (count > 1 && i > 0) {
      newKey = `${key}_${i + 1}`;
    }
    
    // 重複チェック
    let existingKeyword = catObj.keywords.find(k => k.key === newKey);
    if (existingKeyword) {
      setErrorMessage(`Keyword "${newKey}" already exists in category "${category}".`);
      return;
    }
    
    // キーワード追加
    const newKeyword = { key: newKey, desc: desc };
    catObj.keywords.push(newKeyword);
  }
  
  // UI更新
  if (isNewCategory) {
    // 新カテゴリの場合は全体を再描画
    if (type === 'prompt') {
      createKeywordSelection([catObj], 'prompt', promptSelectionArea);
    } else {
      createKeywordSelection([catObj], 'negative_prompt', negativeSelectionArea);
    }
  } else {
    // 既存カテゴリの場合はキーワードリストに追加
    const area = type === 'prompt' ? promptSelectionArea : negativeSelectionArea;
    const catDivs = area.querySelectorAll('.category');
    for (const catDiv of catDivs) {
      const title = catDiv.querySelector('.category-title');
      if (title && title.textContent === category) {
        const list = catDiv.querySelector('.keywords-list');
        if (list) {
          // 新しく追加されたキーワードをUIに追加
          for (let i = 0; i < count; i++) {
            let newKey = key;
            if (count > 1 && i > 0) {
              newKey = `${key}_${i + 1}`;
            }
            
            const item = document.createElement('label');
            item.className = 'keyword-item';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.category = category;
            checkbox.dataset.key = newKey;
            checkbox.dataset.type = type;
            checkbox.id = keywordId(category, newKey);
            checkbox.addEventListener('change', onKeywordToggle);
            
            const keySpan = document.createElement('span');
            keySpan.textContent = newKey;
            const descSpan = document.createElement('span');
            descSpan.textContent = '（' + (desc || '') + '）';
            descSpan.style.color = '#888';
            
            item.appendChild(checkbox);
            item.appendChild(keySpan);
            item.appendChild(descSpan);
            list.appendChild(item);
          }
          break;
        }
      }
    }
  }
  
  // フォームをリセットしてモーダルを閉じる
  addKeywordForm.reset();
  addKeywordModal.classList.remove('show');
  setErrorMessage(`Added ${count} keyword(s) to category "${category}".`);
});

// --- キーワードファイル読込 ---
loadKeywordsBtn.addEventListener('click', () => {
  keywordsFileInput.value = '';
  keywordsFileInput.click();
});
keywordsFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const data = JSON.parse(ev.target.result);
      
      // 設定情報を分離
      let settings = null;
      let keywordsData = data;
      
      if (data.settings) {
        settings = data.settings;
        keywordsData = {
          prompt: data.prompt || [],
          negative_prompt: data.negative_prompt || []
        };
      }
      
      loadKeywordsFromData(keywordsData, settings);
      setErrorMessage('Keyword data loaded');
    } catch (err) {
      setErrorMessage('Failed to load JSON file: ' + err);
    }
  };
  reader.readAsText(file, 'utf-8');
});

// --- プリセットファイル読込 ---
loadPresetsBtn.addEventListener('click', () => {
  presetsFileInput.value = '';
  presetsFileInput.click();
});
presetsFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setErrorMessage('Invalid preset file format.');
        return;
      }
      // prompt/negative配列のkeyを反映
      let data = window._keywordsDataCache;
      if (!data) {
        // 空のデータを自動生成
        data = { prompt: [], negative_prompt: [] };
        window._keywordsDataCache = data;
      }
      function findKeywordObj(key, type) {
        const arr = type === 'prompt' ? data.prompt : data.negative_prompt;
        for (const cat of arr) {
          for (const kw of cat.keywords) {
            if (kw.key === key) {
              return { category: cat.category, key: kw.key };
            }
          }
        }
        return null;
      }
      // --- カテゴリdescription取得ヘルパー ---
      function getCategoryDescription(type, category) {
        let arr = type === 'prompt' ? selectedPromptKeywords : selectedNegativeKeywords;
        // 既存データから取得
        let dataArr = type === 'prompt' ? (window._keywordsDataCache?.prompt || []) : (window._keywordsDataCache?.negative_prompt || []);
        let cat = dataArr.find(c => c.category === category);
        return cat ? cat.description || '' : '';
      }
      // カテゴリ取得・追加ヘルパー
      function ensureCategoryAndKeyword(type, category, key, description, desc) {
        let arr = type === 'prompt' ? data.prompt : data.negative_prompt;
        let catObj = arr.find(c => c.category === category);
        let isNewCategory = false;
        if (!catObj) {
          // カテゴリ新規作成
          catObj = { category: category, description: description || '', keywords: [] };
          arr.push(catObj);
          isNewCategory = true;
        } else if (description && catObj.description !== description) {
          // 既存カテゴリのdescriptionも上書き
          catObj.description = description;
        }
        let kwObj = catObj.keywords.find(k => k.key === key);
        let isNewKeyword = false;
        if (!kwObj) {
          // キーワード新規作成
          kwObj = { key: key, desc: desc || '' };
          catObj.keywords.push(kwObj);
          isNewKeyword = true;
        } else if (typeof desc === 'string' && kwObj.desc !== desc) {
          // 既存キーワードのdescも上書き
          kwObj.desc = desc;
        }
        // 画面にも即時反映
        if (isNewCategory) {
          // 新カテゴリごと描画
          if (type === 'prompt') {
            createKeywordSelection([catObj], 'prompt', promptSelectionArea);
          } else {
            createKeywordSelection([catObj], 'negative_prompt', negativeSelectionArea);
          }
        } else if (isNewKeyword) {
          // 既存カテゴリのキーワードリストにだけ追加
          // カテゴリdivを探してリストに追加
          const area = type === 'prompt' ? promptSelectionArea : negativeSelectionArea;
          const catDivs = area.querySelectorAll('.category');
          for (const catDiv of catDivs) {
            const title = catDiv.querySelector('.category-title');
            if (title && title.textContent === category) {
              const list = catDiv.querySelector('.keywords-list');
              if (list) {
                // createKeywordSelectionのキーワード部分だけ再利用
                const item = document.createElement('label');
                item.className = 'keyword-item';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.dataset.category = category;
                checkbox.dataset.key = key;
                checkbox.dataset.type = type;
                checkbox.id = keywordId(category, key);
                checkbox.addEventListener('change', onKeywordToggle);
                const keySpan = document.createElement('span');
                keySpan.textContent = key;
                const descSpan = document.createElement('span');
                descSpan.textContent = '（' + (desc || '') + '）';
                descSpan.className = 'keyword-desc-label';
                descSpan.style.color = '#888';
                descSpan.style.display = showDesc ? 'inline' : 'none';
                item.appendChild(checkbox);
                item.appendChild(keySpan);
                item.appendChild(descSpan);
                list.appendChild(item);
                break;
              }
            }
          }
        }
        return { category: catObj.category, key: kwObj.key };
      }
      let notFoundPrompt = [];
      let notFoundNegative = [];
      selectedPromptKeywords = [];
      selectedNegativeKeywords = [];
      // prompt
      if (Array.isArray(parsed.prompt)) {
        for (const item of parsed.prompt) {
          // 旧形式（keyのみ）と新形式（オブジェクト）両対応
          let key, emphasisType, emphasisValue, category, description, desc;
          if (typeof item === 'string') {
            key = item;
            emphasisType = 'normal';
            emphasisValue = 1.0;
            category = '';
            description = '';
            desc = '';
          } else if (typeof item === 'object' && item.key) {
            key = item.key;
            emphasisType = item.emphasisType || 'normal';
            emphasisValue = typeof item.emphasisValue === 'number' ? item.emphasisValue : 1.0;
            category = item.category || '';
            description = item.description || '';
            desc = item.desc || '';
          } else {
            continue;
          }
          let found = findKeywordObj(key, 'prompt');
          if (!found && category) {
            // データに存在しない場合はcategory情報を元に追加
            found = ensureCategoryAndKeyword('prompt', category, key, description, desc);
          } else if (found && category) {
            // 既存カテゴリ・キーワードのdescription/descも上書き
            ensureCategoryAndKeyword('prompt', category, key, description, desc);
          }
          if (found) {
            selectedPromptKeywords.push({
              id: keywordId(found.category, found.key),
              key: found.key,
              category: found.category,
              type: 'prompt',
              emphasisType,
              emphasisValue,
              desc
            });
            const cb = document.getElementById(keywordId(found.category, found.key));
            if (cb) cb.checked = true;
          } else {
            notFoundPrompt.push(key);
          }
        }
      }
      // negative
      if (Array.isArray(parsed.negative)) {
        for (const item of parsed.negative) {
          let key, emphasisType, emphasisValue, category, description, desc;
          if (typeof item === 'string') {
            key = item;
            emphasisType = 'normal';
            emphasisValue = 1.0;
            category = '';
            description = '';
            desc = '';
          } else if (typeof item === 'object' && item.key) {
            key = item.key;
            emphasisType = item.emphasisType || 'normal';
            emphasisValue = typeof item.emphasisValue === 'number' ? item.emphasisValue : 1.0;
            category = item.category || '';
            description = item.description || '';
            desc = item.desc || '';
          } else {
            continue;
          }
          let found = findKeywordObj(key, 'negative_prompt');
          if (!found && category) {
            found = ensureCategoryAndKeyword('negative_prompt', category, key, description, desc);
          } else if (found && category) {
            ensureCategoryAndKeyword('negative_prompt', category, key, description, desc);
          }
          if (found) {
            selectedNegativeKeywords.push({
              id: keywordId(found.category, found.key),
              key: found.key,
              category: found.category,
              type: 'negative_prompt',
              emphasisType,
              emphasisValue,
              desc
            });
            const cb = document.getElementById(keywordId(found.category, found.key));
            if (cb) cb.checked = true;
          } else {
            notFoundNegative.push(key);
          }
        }
      }
      renderOutputLists();
      
      // desc表示状態を更新
      updateDescVisibility();
      
      if (notFoundPrompt.length > 0 || notFoundNegative.length > 0) {
        setErrorMessage('Some keywords in the preset were not found and skipped: ' + [...notFoundPrompt, ...notFoundNegative].join(', '));
      } else {
        setErrorMessage('Preset keywords applied.');
      }
    } catch (err) {
      setErrorMessage('Failed to load presets: ' + err);
    }
  };
  reader.readAsText(file, 'utf-8');
});

// --- プリセットファイル保存 ---
savePresetsBtn.addEventListener('click', () => {
  try {
    // 選択中のkeyのみを保存（emphasisType, emphasisValue, descも含める）
    const presetData = {
      prompt: selectedPromptKeywords.map(k => ({
        key: k.key,
        category: k.category,
        description: getCategoryDescription('prompt', k.category),
        desc: k.desc || '',
        emphasisType: k.emphasisType,
        emphasisValue: k.emphasisValue
      })),
      negative: selectedNegativeKeywords.map(k => ({
        key: k.key,
        category: k.category,
        description: getCategoryDescription('negative', k.category),
        desc: k.desc || '',
        emphasisType: k.emphasisType,
        emphasisValue: k.emphasisValue
      }))
    };
    const json = JSON.stringify(presetData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    // 日時付きファイル名を生成
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const filename = `presets_${y}${m}${d}_${hh}${mm}${ss}.json`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    setErrorMessage('Presets saved');
  } catch (err) {
    setErrorMessage('Failed to save presets: ' + err);
  }
});

// --- キーワードファイル保存 ---
saveKeywordsBtn.addEventListener('click', () => {
  try {
    // 全キーワードデータを保存
    const keywordsData = window._keywordsDataCache;
    if (!keywordsData) {
      setErrorMessage('No keyword data loaded.');
      return;
    }
    
    // 現在のチェック状態を取得
    const checkedKeywords = {
      prompt: [],
      negative_prompt: []
    };
    
    // プロンプトキーワードのチェック状態を取得
    document.querySelectorAll('#prompt-selection-area input[type="checkbox"]:checked').forEach(cb => {
      checkedKeywords.prompt.push({
        category: cb.dataset.category,
        key: cb.dataset.key
      });
    });
    
    // ネガティブプロンプトキーワードのチェック状態を取得
    document.querySelectorAll('#negative-selection-area input[type="checkbox"]:checked').forEach(cb => {
      checkedKeywords.negative_prompt.push({
        category: cb.dataset.category,
        key: cb.dataset.key
      });
    });
    
    // プロパティ順・key/descのみ抽出
    function sortKeywordsData(data) {
      function sortCategory(cat) {
        return {
          category: cat.category,
          description: cat.description,
          keywords: cat.keywords.map(k => ({ key: k.key, desc: k.desc }))
        };
      }
      return {
        prompt: (data.prompt || []).map(sortCategory),
        negative_prompt: (data.negative_prompt || []).map(sortCategory)
      };
    }
    
    const sortedData = sortKeywordsData(keywordsData);
    
    // 保存データにチェック状態とdesc表示状態を追加
    const saveData = {
      ...sortedData,
      settings: {
        showDesc: showDesc,
        checkedKeywords: checkedKeywords
      }
    };
    
    const json = JSON.stringify(saveData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    // 日時付きファイル名
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const filename = `keywords_${y}${m}${d}_${hh}${mm}${ss}.json`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 100);
    setErrorMessage('Keywords saved');
  } catch (err) {
    setErrorMessage('Failed to save keywords: ' + err);
  }
});

// --- プリセット管理 ---
// function loadPresetsIntoSelect() { ... } // ←不要なので削除


// --- 既存のlocalStorage関連ロジック・変数・イベントリスナーは削除してください ---
// 初期化
renderOutputLists(); 

// --- キーワード削除機能 ---
const delKeywordBtn = document.getElementById('del-keyword-btn');
const delKeywordModal = document.getElementById('del-keyword-modal');
const closeDelModal = document.getElementById('close-del-modal');
const delKeywordForm = document.getElementById('del-keyword-form');
const delKeywordType = document.getElementById('del-keyword-type');
const delKeywordCategory = document.getElementById('del-keyword-category');
const delKeywordList = document.getElementById('del-keyword-list');
const delKeywordSubmit = document.getElementById('del-keyword-submit');

const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const closeConfirmModal = document.getElementById('close-confirm-modal');
const deleteConfirmMessage = document.getElementById('delete-confirm-message');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

// 削除モーダルを開く
delKeywordBtn.addEventListener('click', () => {
  if (!window._keywordsDataCache) {
    setErrorMessage('No keyword data loaded. Please load keywords first.');
    return;
  }
  delKeywordModal.classList.add('show');
  updateDelKeywordCategoryList();
});

// 削除モーダルを閉じる
closeDelModal.addEventListener('click', () => {
  delKeywordModal.classList.remove('show');
  // モーダルの状態をリセット
  delKeywordType.value = '';
  delKeywordCategory.value = '';
  delKeywordList.innerHTML = '';
  // transformをリセット
  const modalContent = delKeywordModal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.transform = 'translate3d(0, 0, 0)';
  }
});

// 削除確認モーダルを閉じる
closeConfirmModal.addEventListener('click', () => {
  deleteConfirmModal.classList.remove('show');
  // transformをリセット
  const modalContent = deleteConfirmModal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.transform = 'translate3d(0, 0, 0)';
  }
});

cancelDeleteBtn.addEventListener('click', () => {
  deleteConfirmModal.classList.remove('show');
  // transformをリセット
  const modalContent = deleteConfirmModal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.transform = 'translate3d(0, 0, 0)';
  }
});

// タイプ選択時にカテゴリリストを更新
delKeywordType.addEventListener('change', () => {
  updateDelKeywordCategoryList();
  delKeywordCategory.value = '';
  delKeywordList.innerHTML = '';
});

// カテゴリ選択時にキーワードリストを表示
delKeywordCategory.addEventListener('change', () => {
  displayDelKeywordList();
});

// カテゴリリストを更新
function updateDelKeywordCategoryList() {
  const type = delKeywordType.value;
  if (!type || !window._keywordsDataCache) return;
  
  const categories = window._keywordsDataCache[type] || [];
  delKeywordCategory.innerHTML = '<option value="">Select category...</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.category;
    option.textContent = cat.category;
    delKeywordCategory.appendChild(option);
  });
}

// キーワードリストを表示
function displayDelKeywordList() {
  const type = delKeywordType.value;
  const category = delKeywordCategory.value;
  
  if (!type || !category || !window._keywordsDataCache) return;
  
  const categories = window._keywordsDataCache[type] || [];
  const categoryData = categories.find(cat => cat.category === category);
  
  if (!categoryData) return;
  
  delKeywordList.innerHTML = '';
  
  categoryData.keywords.forEach(kw => {
    const item = document.createElement('label');
    item.className = 'keyword-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.key = kw.key;
    checkbox.dataset.category = category;
    checkbox.dataset.type = type;
    
    const keySpan = document.createElement('span');
    keySpan.textContent = kw.key;
    keySpan.className = 'keyword-key-label';
    
    const descSpan = document.createElement('span');
    descSpan.textContent = kw.desc || '';
    descSpan.className = 'keyword-desc-label';
    
    item.appendChild(checkbox);
    item.appendChild(keySpan);
    item.appendChild(descSpan);
    delKeywordList.appendChild(item);
  });
}

// 削除実行
delKeywordSubmit.addEventListener('click', () => {
  const type = delKeywordType.value;
  const category = delKeywordCategory.value;
  
  if (!type || !category) {
    setErrorMessage('Please select both type and category.');
    return;
  }
  
  const checkedKeywords = Array.from(delKeywordList.querySelectorAll('input[type="checkbox"]:checked'))
    .map(cb => ({
      key: cb.dataset.key,
      category: cb.dataset.category,
      type: cb.dataset.type
    }));
  
  if (checkedKeywords.length === 0) {
    setErrorMessage('Please select at least one keyword to delete.');
    return;
  }
  
  // 確認メッセージを表示
  const keywordNames = checkedKeywords.map(kw => kw.key).join(', ');
  deleteConfirmMessage.innerHTML = `
    <strong>Are you sure you want to delete the following keywords?</strong><br><br>
    <strong>Type:</strong> ${type === 'prompt' ? 'Prompt' : 'Negative Prompt'}<br>
    <strong>Category:</strong> ${category}<br>
    <strong>Keywords:</strong> ${keywordNames}<br><br>
    <em>This action cannot be undone.</em>
  `;
  
  // 確認モーダルを表示
  deleteConfirmModal.classList.add('show');
  
  // 削除実行ボタンのイベントリスナーを設定
  const handleConfirmDelete = () => {
    try {
      deleteKeywords(checkedKeywords);
      // 削除が成功した場合のみモーダルを閉じる
      setTimeout(() => {
        deleteConfirmModal.classList.remove('show');
        delKeywordModal.classList.remove('show');
        
        // モーダルの状態をリセット
        delKeywordType.value = '';
        delKeywordCategory.value = '';
        delKeywordList.innerHTML = '';
        
        // transformをリセット
        const confirmModalContent = deleteConfirmModal.querySelector('.modal-content');
        const delModalContent = delKeywordModal.querySelector('.modal-content');
        if (confirmModalContent) {
          confirmModalContent.style.transform = 'translate3d(0, 0, 0)';
        }
        if (delModalContent) {
          delModalContent.style.transform = 'translate3d(0, 0, 0)';
        }
        
        // イベントリスナーを削除
        confirmDeleteBtn.removeEventListener('click', handleConfirmDelete);
      }, 100);
    } catch (error) {
      // エラーが発生した場合でも両方のモーダルを閉じる
      setTimeout(() => {
        deleteConfirmModal.classList.remove('show');
        delKeywordModal.classList.remove('show');
        
        // モーダルの状態をリセット
        delKeywordType.value = '';
        delKeywordCategory.value = '';
        delKeywordList.innerHTML = '';
        
        // transformをリセット
        const confirmModalContent = deleteConfirmModal.querySelector('.modal-content');
        const delModalContent = delKeywordModal.querySelector('.modal-content');
        if (confirmModalContent) {
          confirmModalContent.style.transform = 'translate3d(0, 0, 0)';
        }
        if (delModalContent) {
          delModalContent.style.transform = 'translate3d(0, 0, 0)';
        }
        // イベントリスナーを削除
        confirmDeleteBtn.removeEventListener('click', handleConfirmDelete);
      }, 100);
    }
  };
  
  // 既存のイベントリスナーを削除してから新しいものを追加
  confirmDeleteBtn.removeEventListener('click', handleConfirmDelete);
  confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
});

// キーワードを削除
function deleteKeywords(keywordsToDelete) {
  if (!window._keywordsDataCache) {
    throw new Error('No keyword data loaded');
  }
  
  const data = window._keywordsDataCache;
  let deletedCount = 0;
  
  keywordsToDelete.forEach(kw => {
    const type = kw.type;
    const category = kw.category;
    const key = kw.key;
    
    // データから削除
    const categories = data[type] || [];
    const categoryIndex = categories.findIndex(cat => cat.category === category);
    
    if (categoryIndex !== -1) {
      const categoryData = categories[categoryIndex];
      const keywordIndex = categoryData.keywords.findIndex(k => k.key === key);
      
      if (keywordIndex !== -1) {
        categoryData.keywords.splice(keywordIndex, 1);
        deletedCount++;
        
        // カテゴリが空になった場合は削除
        if (categoryData.keywords.length === 0) {
          categories.splice(categoryIndex, 1);
        }
      }
    }
    
    // 選択中のキーワードからも削除
    if (type === 'prompt') {
      selectedPromptKeywords = selectedPromptKeywords.filter(k => 
        !(k.key === key && k.category === category)
      );
    } else {
      selectedNegativeKeywords = selectedNegativeKeywords.filter(k => 
        !(k.key === key && k.category === category)
      );
    }
  });
  
  if (deletedCount === 0) {
    throw new Error('No keywords were found to delete');
  }
  
  // UIを再描画
  clearKeywordSelection();
  createKeywordSelection(data.prompt, 'prompt', promptSelectionArea);
  createKeywordSelection(data.negative_prompt, 'negative_prompt', negativeSelectionArea);
  renderOutputLists();
  
  // カテゴリのドラッグアンドドロップを再初期化
  initializeCategorySortable();
  
  setErrorMessage(`Deleted ${deletedCount} keyword(s) successfully.`);
}

// モーダル外クリックで閉じる
window.addEventListener('click', (e) => {
  if (e.target === delKeywordModal) {
    delKeywordModal.classList.remove('show');
    // モーダルの状態をリセット
    delKeywordType.value = '';
    delKeywordCategory.value = '';
    delKeywordList.innerHTML = '';
    // transformをリセット
    const modalContent = delKeywordModal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.style.transform = 'translate3d(0, 0, 0)';
    }
  }
  if (e.target === deleteConfirmModal) {
    deleteConfirmModal.classList.remove('show');
    // transformをリセット
    const modalContent = deleteConfirmModal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.style.transform = 'translate3d(0, 0, 0)';
    }
  }
});

// カテゴリのドラッグアンドドロップ機能を初期化
function initializeCategorySortable() {
  // Prompt Keywords エリアのカテゴリをソート可能にする
  const promptSelectionArea = document.getElementById('prompt-selection-area');
  if (promptSelectionArea) {
    new Sortable(promptSelectionArea, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      filter: 'h2', // h2要素（タイトル）は除外
      draggable: '.category', // カテゴリ要素のみドラッグ可能
      onEnd: function(evt) {
        updateCategoryOrder('prompt');
      }
    });
  }
  
  // Negative Prompt Keywords エリアのカテゴリをソート可能にする
  const negativeSelectionArea = document.getElementById('negative-selection-area');
  if (negativeSelectionArea) {
    new Sortable(negativeSelectionArea, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      filter: 'h2', // h2要素（タイトル）は除外
      draggable: '.category', // カテゴリ要素のみドラッグ可能
      onEnd: function(evt) {
        updateCategoryOrder('negative_prompt');
      }
    });
  }
}

// カテゴリの順序を更新
function updateCategoryOrder(type) {
  const area = type === 'prompt' ? '#prompt-selection-area' : '#negative-selection-area';
  const categories = Array.from(document.querySelectorAll(`${area} .category`));
  
  // 新しい順序でカテゴリ名を取得
  const newOrder = categories.map(cat => cat.dataset.category);
  
  // データキャッシュの順序を更新
  if (window._keywordsDataCache && window._keywordsDataCache[type]) {
    const originalData = window._keywordsDataCache[type];
    const reorderedData = [];
    
    newOrder.forEach(categoryName => {
      const categoryData = originalData.find(cat => cat.category === categoryName);
      if (categoryData) {
        reorderedData.push(categoryData);
      }
    });
    
    window._keywordsDataCache[type] = reorderedData;
  }
}

// desc表示切り替え機能
let showDesc = false; // 初期値はオフ（キーワードのdescのみ非表示）

// チェックボックスのイベントリスナーを設定
document.addEventListener('DOMContentLoaded', function() {
  const showDescCheckbox = document.getElementById('show-desc-checkbox');
  if (showDescCheckbox) {
    showDescCheckbox.addEventListener('change', function() {
      showDesc = this.checked;
      updateDescVisibility();
    });
  }
  
  // モーダルのドラッグ機能を初期化
  initializeModalDrag();
});

// desc表示/非表示を更新
function updateDescVisibility() {
  // カテゴリの説明は常に表示（チェックボックスに関係なく）
  const categoryDescs = document.querySelectorAll('.category-desc');
  categoryDescs.forEach(desc => {
    desc.style.display = 'block';
  });
  
  // キーワードの説明を更新
  const keywordDescs = document.querySelectorAll('.keyword-desc-label');
  keywordDescs.forEach(desc => {
    desc.style.display = showDesc ? 'inline' : 'none';
  });
  
  // リストの説明を更新
  const listDescs = document.querySelectorAll('.list-desc');
  listDescs.forEach(desc => {
    desc.style.display = showDesc ? 'inline' : 'none';
  });
}

// モーダルのドラッグ機能を初期化
function initializeModalDrag() {
  const modals = document.querySelectorAll('.modal');
  
  modals.forEach(modal => {
    const modalContent = modal.querySelector('.modal-content');
    const dragHandle = modal.querySelector('.modal-drag-handle');
    
    if (!modalContent || !dragHandle) return;
    
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
    
    function dragStart(e) {
      if (e.type === "touchstart") {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
      } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
      }
      
      if (e.target === dragHandle) {
        isDragging = true;
      }
    }
    
    function dragEnd(e) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    }
    
    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        
        if (e.type === "touchmove") {
          currentX = e.touches[0].clientX - initialX;
          currentY = e.touches[0].clientY - initialY;
        } else {
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
        }
        
        xOffset = currentX;
        yOffset = currentY;
        
        setTranslate(currentX, currentY, modalContent);
      }
    }
    
    // イベントリスナーを追加
    dragHandle.addEventListener("mousedown", dragStart);
    dragHandle.addEventListener("touchstart", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("touchmove", drag);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("touchend", dragEnd);
  });
}

 