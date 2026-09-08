lucide.createIcons();

if (!localStorage.getItem('luau_editor_v2_7_init')) {
  localStorage.removeItem('luau_editor_files');
  localStorage.removeItem('luau_active_file');
  localStorage.setItem('luau_editor_v2_7_init', 'true');
}

let files = JSON.parse(localStorage.getItem('luau_editor_files')) || [
  { id: '1', name: 'print.luau', content: 'print("Hello, world!")' },
  { id: '2', name: 'script.luau', content: 'local function bla()\n    print("oi")\nend' }
];

let activeFileId = localStorage.getItem('luau_active_file') || files[0].id;
let isUpdatingEditor = false;

let editor = CodeMirror.fromTextArea(document.getElementById("code-editor"), {
  mode: "lua",
  theme: "dracula",
  lineNumbers: true,
  autoCloseBrackets: false, 
  matchBrackets: true,
  styleActiveLine: true,
  indentUnit: 4,
  tabSize: 4,
  indentWithTabs: false,
  lineWrapping: true,
  extraKeys: {
    "Tab": function(cm) {
      if (cm.somethingSelected()) {
        cm.indentSelection("add");
      } else {
        cm.replaceSelection("    ", "end");
      }
    }
  }
});

// Autocompletar de símbolos com o cursor travado exatamente no meio
const pairs = {
  '(': ')',
  '{': '}',
  '[': ']',
  '"': '"',
  "'": "'"
};

editor.on("beforeChange", function(cm, change) {
  if (isUpdatingEditor) return;
  
  if (change.origin === "+input" && change.text.length === 1 && change.text[0].length === 1) {
    let char = change.text[0];
    if (pairs[char]) {
      let closing = pairs[char];
      let pos = change.from;
      
      change.update(change.from, change.to, [char + closing]);
      
      setTimeout(() => {
        isUpdatingEditor = true;
        cm.setCursor({ line: pos.line, ch: pos.ch + 1 });
        isUpdatingEditor = false;
      }, 0);
    }
  }
});

function loadActiveFile() {
  let file = files.find(f => f.id === activeFileId) || files[0];
  if (!file) return;
  
  activeFileId = file.id;
  isUpdatingEditor = true;
  editor.setValue(file.content);
  isUpdatingEditor = false;

  document.getElementById('current-file-title').textContent = file.name;
  
  renderTabs();
  renderFileList();
  localStorage.setItem('luau_active_file', activeFileId);
}

editor.on("change", () => {
  if (isUpdatingEditor) return;
  let file = files.find(f => f.id === activeFileId);
  if (file) {
    file.content = editor.getValue();
    localStorage.setItem('luau_editor_files', JSON.stringify(files));
  }
});

function renderTabs() {
  const container = document.getElementById('tabs-bar');
  container.innerHTML = '';

  files.forEach(file => {
    const isActive = file.id === activeFileId;
    const tab = document.createElement('div');
    tab.className = `tab ${isActive ? 'active' : ''}`;
    
    tab.innerHTML = `
      <span>${file.name}</span>
      <span class="tab-close" data-id="${file.id}">✕</span>
    `;

    tab.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-close')) {
        e.stopPropagation();
        closeFile(file.id);
        return;
      }
      activeFileId = file.id;
      loadActiveFile();
    });

    container.appendChild(tab);
  });
}

function renderFileList() {
  const list = document.getElementById('file-list');
  list.innerHTML = '';

  files.forEach(file => {
    const isActive = file.id === activeFileId;
    const item = document.createElement('div');
    item.className = `file-item ${isActive ? 'active' : ''}`;

    item.innerHTML = `
      <div class="file-info">
        <i data-lucide="file-code"></i>
        <span>${file.name}</span>
      </div>
    `;

    item.addEventListener('click', () => {
      activeFileId = file.id;
      loadActiveFile();
      toggleSidebar(false);
    });

    list.appendChild(item);
  });
  lucide.createIcons();
}

function showCustomAlert(message) {
  let oldModal = document.getElementById('custom-alert-modal');
  if (oldModal) oldModal.remove();

  const modalHtml = `
    <div id="custom-alert-modal" class="modal-overlay">
      <div class="modal-card" style="max-width: 260px; text-align: center;">
        <div class="modal-body" style="padding: 20px 16px; font-size: 13px; color: #f8f8f2;">
          ${message}
        </div>
        <div class="modal-footer" style="justify-content: center; padding: 10px;">
          <button id="btn-alert-ok" class="btn-primary" style="width: 100%; justify-content: center;">OK</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  document.getElementById('btn-alert-ok').onclick = () => {
    document.getElementById('custom-alert-modal').remove();
  };
}

const newFileModal = document.getElementById('new-file-modal');
const newFileNameInput = document.getElementById('new-file-name-input');

document.getElementById('btn-new-file').addEventListener('click', () => {
  newFileNameInput.value = "script.luau";
  newFileModal.classList.remove('hidden');
  setTimeout(() => newFileNameInput.focus(), 50);
});

document.getElementById('close-new-file').addEventListener('click', () => newFileModal.classList.add('hidden'));
document.getElementById('btn-cancel-new').addEventListener('click', () => newFileModal.classList.add('hidden'));

document.getElementById('btn-confirm-new').addEventListener('click', () => {
  let name = newFileNameInput.value.trim();
  if (!name) return;
  if (!name.endsWith('.luau') && !name.endsWith('.lua')) name += '.luau';

  const newFile = {
    id: Date.now().toString(),
    name: name,
    content: `-- ${name}\n`
  };

  files.push(newFile);
  activeFileId = newFile.id;
  localStorage.setItem('luau_editor_files', JSON.stringify(files));
  newFileModal.classList.add('hidden');
  loadActiveFile();
  toggleSidebar(false);
});

function closeFile(id) {
  if (files.length === 1) {
    showCustomAlert("Você precisa manter pelo menos um arquivo aberto.");
    return;
  }
  files = files.filter(f => f.id !== id);
  if (activeFileId === id) activeFileId = files[0].id;
  localStorage.setItem('luau_editor_files', JSON.stringify(files));
  loadActiveFile();
}

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

function toggleSidebar(open) {
  if (open) {
    sidebar.classList.add('open');
    overlay.classList.add('show');
  } else {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  }
}

document.getElementById('btn-menu').addEventListener('click', () => toggleSidebar(true));
overlay.addEventListener('click', () => toggleSidebar(false));

document.getElementById('btn-copy').addEventListener('click', () => {
  navigator.clipboard.writeText(editor.getValue()).then(() => {
    const btn = document.getElementById('btn-copy');
    btn.innerHTML = `<i data-lucide="check"></i><span>Copiado!</span>`;
    lucide.createIcons();
    setTimeout(() => {
      btn.innerHTML = `<i data-lucide="copy"></i><span>Copiar</span>`;
      lucide.createIcons();
    }, 2000);
  });
});

document.getElementById('btn-undo').addEventListener('click', () => editor.undo());
document.getElementById('btn-redo').addEventListener('click', () => editor.redo());

const modal = document.getElementById('settings-modal');
document.getElementById('btn-settings').addEventListener('click', () => modal.classList.remove('hidden'));
document.getElementById('close-settings').addEventListener('click', () => modal.classList.add('hidden'));

const fontSizeRange = document.getElementById('font-size-range');
const fontSizeVal = document.getElementById('font-size-val');
fontSizeRange.addEventListener('input', (e) => {
  const size = e.target.value + 'px';
  fontSizeVal.textContent = size;
  document.querySelector('.CodeMirror').style.fontSize = size;
  editor.refresh();
});

document.getElementById('linenumbers-toggle').addEventListener('change', (e) => {
  editor.setOption("lineNumbers", e.target.checked);
});

document.getElementById('btn-delete-current').addEventListener('click', () => {
  if (files.length <= 1) {
    showCustomAlert("Você não pode excluir o último arquivo.");
    return;
  }
  modal.classList.add('hidden');
  closeFile(activeFileId);
});

loadActiveFile();
