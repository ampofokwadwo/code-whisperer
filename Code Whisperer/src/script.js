(function () {
	const STORAGE_KEY = 'code-whisperer:v1';
	const DEBOUNCE_MS = 300;

	const sample = {
		html: `<!-- Sample HTML -->\n<main class="container">\n  <h1 id="title">Hello, Code Whisperer</h1>\n  <button id="actionBtn">Click me</button>\n</main>\n<script src=\"script.js\"></script>`,
		css: `/* Sample CSS */\n*{box-sizing:border-box}\nbody{font-family:system-ui, sans-serif;background:#0b0b0b;color:#f5f5f5;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}\nmain{display:flex;flex-direction:column;align-items:center;gap:2rem}\n#actionBtn{width:220px;height:140px;background:#fff;color:#000;border-radius:4px;border:0;font-weight:600}`,
		js: `// Sample JS\nconst title = document.getElementById('title');\nconst button = document.getElementById('actionBtn');\nbutton?.addEventListener('click', () => { title.textContent = 'You clicked the button.'; });`
	};

	let htmlEl, cssEl, jsEl, preview, autoUpdate, runBtn, clearBtn;
	let previewTimeout = null;
	let saveTimeout = null;
	let toastTimeout = null;
	const TOAST_MS = 1200;

	function buildSrcDoc(h, c, j) {
		const safeHtml = h || '';
		const safeCss = c || '';
		const safeJs = j || '';
		return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${safeCss}</style></head><body>${safeHtml}<script>${safeJs}<\/script></body></html>`;
	}

	function updatePreview() {
		const srcdoc = buildSrcDoc(htmlEl.value, cssEl.value, jsEl.value);
		try {
			preview.srcdoc = srcdoc;
		} catch (e) {
			const blob = new Blob([srcdoc], { type: 'text/html' });
			const url = URL.createObjectURL(blob);
			preview.src = url;
			setTimeout(() => URL.revokeObjectURL(url), 1500);
		}
	}

	function schedulePreview() {
		if (!autoUpdate.checked) return;
		clearTimeout(previewTimeout);
		previewTimeout = setTimeout(updatePreview, DEBOUNCE_MS);
	}

	function saveState() {
		const state = { html: htmlEl.value, css: cssEl.value, js: jsEl.value, ts: Date.now() };
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
			showSavedToast();
		} catch (e) { /* ignore */ }
	}

	function showSavedToast() {
		const toast = document.getElementById('saveToast');
		if (!toast) return;
		toast.classList.add('visible');
		clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => toast.classList.remove('visible'), TOAST_MS);
	}

	function scheduleSave() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(saveState, 500);
	}

	function loadState() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const obj = JSON.parse(raw);
				htmlEl.value = obj.html || '';
				cssEl.value = obj.css || '';
				jsEl.value = obj.js || '';
				return;
			}
		} catch (e) { /* ignore parse errors */ }
		// Fallback sample
		htmlEl.value = sample.html;
		cssEl.value = sample.css;
		jsEl.value = sample.js;
	}

	function wireEvents() {
		htmlEl.addEventListener('input', () => { schedulePreview(); scheduleSave(); });
		cssEl.addEventListener('input', () => { schedulePreview(); scheduleSave(); });
		jsEl.addEventListener('input', () => { schedulePreview(); scheduleSave(); });

		runBtn.addEventListener('click', () => { updatePreview(); saveState(); });
		clearBtn.addEventListener('click', () => {
			htmlEl.value = '';
			cssEl.value = '';
			jsEl.value = '';
			try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
			updatePreview();
		});
	}

	document.addEventListener('DOMContentLoaded', () => {
		htmlEl = document.getElementById('html');
		cssEl = document.getElementById('css');
		jsEl = document.getElementById('js');
		preview = document.getElementById('preview');
		autoUpdate = document.getElementById('autoUpdate');
		runBtn = document.getElementById('runBtn');
		clearBtn = document.getElementById('clearBtn');

		loadState();
		wireEvents();
		// initial render
		if (autoUpdate?.checked) updatePreview();
	});
})();
