/* E248 App (refactored, modular) */
(() => {
  'use strict';

  // Config
  const ROWS = 31;
  const COLUMNS = 8;
  const TOTAL = ROWS * COLUMNS;
  const MAX_CHARS = 24;

  // Layout measurements (cm)
  const PAGE_WIDTH_CM = 21;
  const PAGE_SIDE_MARGIN_CM = 1.1; // left/right margin each
  const CONTENT_WIDTH_CM = 18.6; // tuned to avoid printer non-printable areas
  const COL_W_CM = 2;
  const COL_GAP_CM = 0.4; // required gap
  const ROW_H_CM = 0.9;

  // compute content width required for grid (columns + internal gaps)
  function computeContentWidthCm() {
    return (COLUMNS * COL_W_CM) + ((COLUMNS - 1) * COL_GAP_CM); // 8*2 + 7*0.4 = 18.8
  }




  // Cached DOM nodes
  const nodes = {};
  // saved page styles for print restore
  let _savedPageStyles = null;

  function $(id) {
    return document.getElementById(id);
  }

  function q(sel) {
    return document.querySelector(sel);
  }

  // Initialization
  function init() {
    // cache elements
    nodes.modeSelect = $('modeSelect');
    nodes.dateInputs = $('dateInputs');
    nodes.mfd = $('mfd');
    nodes.expYears = $('expYears');
    nodes.expGroup = $('expGroup');
    nodes.lotGroup = $('lotGroup');
    nodes.lotNumber = $('lotNumber');

    nodes.customTextLabel = $('customTextLabel');
    nodes.customLine1 = $('customLine1');
    nodes.customLine2 = $('customLine2');
    nodes.customLine3 = $('customLine3');
    nodes.counter1 = $('counter1');
    nodes.counter2 = $('counter2');
    nodes.counter3 = $('counter3');

    // New Controls
    nodes.fontSelect = $('fontSelect');
    nodes.singlePreview = $('singlePreview');

    nodes.printBtn = $('printBtn');
    nodes.downloadPdfBtn = $('downloadPdfBtn');
    nodes.grid = $('grid');

    // wire events
    nodes.modeSelect?.addEventListener('change', updateMode);

    // Listen to new Font Select
    nodes.fontSelect?.addEventListener('change', generate);

    // Listen to Weight (Radio buttons)
    document.querySelectorAll('input[name="weight"]').forEach(r => r.addEventListener('change', generate));

    nodes.mfd?.addEventListener('change', generate);
    nodes.expYears?.addEventListener('change', generate);
    nodes.lotNumber?.addEventListener('input', generate);
    
    // Listen to Custom Line inputs
    nodes.customLine1?.addEventListener('input', () => {
      updateCounter();
      generate();
    });
    nodes.customLine2?.addEventListener('input', () => {
      updateCounter();
      generate();
    });
    nodes.customLine3?.addEventListener('input', () => {
      updateCounter();
      generate();
    });

    // ... (existing listeners)

    nodes.printBtn && nodes.printBtn.addEventListener('click', () => { window.print(); });
    nodes.downloadPdfBtn && nodes.downloadPdfBtn.addEventListener('click', () => { generate(); downloadPdf(); });

    // keyboard shortcut
    document.addEventListener('keydown', (e) => {
      const isTyping = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); window.print(); }
    });

    // initial date
    if (nodes.mfd && !nodes.mfd.value) {
      nodes.mfd.valueAsDate = new Date();
    }

    // Wrap generate in a debounce to prevent excessive rendering
    const debouncedGenerate = debounce(generate, 50);

    // Re-wire events to use debounced version
    nodes.modeSelect?.addEventListener('change', updateMode);
    nodes.fontSelect?.addEventListener('change', generate); // Font/Mode change can be immediate
    document.querySelectorAll('input[name="weight"]').forEach(r => r.addEventListener('change', generate));

    nodes.mfd?.addEventListener('change', debouncedGenerate);
    nodes.expYears?.addEventListener('change', debouncedGenerate);
    nodes.lotNumber?.addEventListener('input', () => {
      validateLotNumber();
      debouncedGenerate();
    });

    // Initial state
    updateMode();
    updateCounter();
    generate();

    // responsive preview
    updatePreviewScale();
    window.addEventListener('resize', debounce(updatePreviewScale, 150));
  }


  function updateCounter() {
    if (nodes.counter1) nodes.counter1.textContent = (nodes.customLine1?.value || '').length;
    if (nodes.counter2) nodes.counter2.textContent = (nodes.customLine2?.value || '').length;
    if (nodes.counter3) nodes.counter3.textContent = (nodes.customLine3?.value || '').length;
  }

  function validateCustomText() {
    // Legacy function - no longer needed with maxlength on inputs
    // Kept for compatibility
  }

  function validateLotNumber() {
    if (!nodes.lotNumber) return;

    let val = nodes.lotNumber.value;

    // 1. Remove non-numeric characters
    val = val.replace(/\D/g, '');

    // 2. Handle range
    if (val !== '') {
      let num = parseInt(val, 10);
      if (num > 99) num = 99;
      if (num < 1 && val.length > 0) num = 1;
      val = String(num);
    }

    // Update if changed
    if (nodes.lotNumber.value !== val) {
      nodes.lotNumber.value = val;
    }
  }

  function updateMode() {
    const mode = nodes.modeSelect.value;
    // Toggle visibility
    if (mode === 'custom') {
      if (nodes.dateInputs) nodes.dateInputs.style.display = 'none';
      if (nodes.customTextLabel) nodes.customTextLabel.style.display = 'block';
    } else {
      // Date modes
      if (nodes.dateInputs) nodes.dateInputs.style.display = 'block';
      if (nodes.customTextLabel) nodes.customTextLabel.style.display = 'none';

      // Show/Hide EXP input
      const showExp = (mode === 'mfd_exp' || mode === 'mfd_exp_lot');
      if (nodes.expGroup) nodes.expGroup.style.display = showExp ? 'block' : 'none';

      // Show/Hide Lot input
      const showLot = (mode === 'mfd_exp_lot');
      if (nodes.lotGroup) nodes.lotGroup.style.display = showLot ? 'block' : 'none';
    }
    generate();
  }

  function generate() {
    if (!nodes.grid) return;

    const mode = nodes.modeSelect?.value || 'mfd_only'; // Default changed to mfd_only? Or keep mfd_exp? Menu order: 1=mfd_only.

    // Get Font & Weight
    const font = nodes.fontSelect?.value || 'helvetica'; // Default Helvetica
    const weight = document.querySelector('input[name="weight"]:checked')?.value || 'semibold';

    let content = [];
    let isCustom = false;

    if (mode === 'custom') {
      isCustom = true;
      const line1 = nodes.customLine1?.value || '';
      const line2 = nodes.customLine2?.value || '';
      const line3 = nodes.customLine3?.value || '';
      // Only include non-empty lines
      if (line1) content.push(line1);
      if (line2) content.push(line2);
      if (line3) content.push(line3);
    } else {
      // Date Modes
      const mfdInput = nodes.mfd.value;
      if (!mfdInput) {
        updateGrid([], font, weight, isCustom);
        return;
      }

      // Parse Date
      const mfdDate = parseDate(mfdInput);
      if (!mfdDate) { updateGrid([], font, weight, isCustom); return; }

      // Format: DD.MM.YY (e.g. 03.02.26)
      const fmt = (d) => {
        if (!d) return '';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2); // 2 digit year
        return `${day}.${month}.${year}`;
      };

      const mfdStr = fmt(mfdDate);
      content.push({ key: 'MFD', val: mfdStr });

      // EXP
      if (mode === 'mfd_exp' || mode === 'mfd_exp_lot') {
        const years = parseInt(nodes.expYears.value || '3', 10);
        const expDate = addYears(mfdDate, years);
        content.push({ key: 'EXP', val: fmt(expDate) });
      }

      // Lot
      if (mode === 'mfd_exp_lot') {
        let lotVal = parseInt(nodes.lotNumber?.value || '1', 10);

        // Clamp 1-99
        if (isNaN(lotVal) || lotVal < 1) lotVal = 1;
        if (lotVal > 99) lotVal = 99;

        // Ensure input field reflects the clamped value if it was out of bounds
        if (nodes.lotNumber && nodes.lotNumber.value !== String(lotVal) && nodes.lotNumber.value !== '') {
          // Only update if not empty to allow backspacing
        }

        const yy = String(mfdDate.getFullYear()).slice(-2);
        const mm = String(mfdDate.getMonth() + 1).padStart(2, '0');
        const xx = String(lotVal).padStart(2, '0');

        const lotStr = `${yy}${mm}-${xx}`;
        content.push({ key: 'LOT', val: lotStr });
      }
    }

    updateGrid(content, font, weight, isCustom);
  }

  function updateGrid(content, font, weight, isCustom) {
    if (!nodes.grid) return;

    const count = content.length;
    const fontClass = `font-${font || 'helvetica'}`;
    const weightClass = `fw-${weight || 'semibold'}`;
    const linesClass = `lines-${count}`;

    // 1. Generate Label HTML String
    let labelHtml = '';
    if (isCustom) {
      labelHtml = content.join('<br>');
    } else {
      labelHtml = '<div class="label-grid-wrapper">' +
        content.map(row => `
          <div class="label-row">
            <span class="label-key">${row.key}</span>
            <span class="label-val">${row.val}</span>
          </div>`).join('') +
        '</div>';
    }

    const fullLabelClass = `label ${fontClass} ${weightClass} ${linesClass}`;
    const singleLabelHtml = `<div class="${fullLabelClass}">${labelHtml}</div>`;

    // 2. Update Single Preview (below menu)
    if (nodes.singlePreview) {
      nodes.singlePreview.innerHTML = singleLabelHtml;

      // Apply same DPI calibration to single preview container
      const singleContainer = document.getElementById('singlePreviewContainer');
      if (singleContainer) {
        const dpr = window.devicePixelRatio || 1;
        let calibration = 1;
        if (dpr >= 2) {
          calibration = 1.15; // 4K
        } else if (dpr >= 1) {
          calibration = 0.95; // 2K
        }
        singleContainer.style.transform = `scale(${calibration})`;
        singleContainer.style.transformOrigin = 'center';
      }
    }

    // 3. Update Grid (A4) - Optimized string builder
    // Building a single massive string and setting innerHTML once is much faster than 248 appends
    const fullGridHtml = new Array(TOTAL).fill(singleLabelHtml).join('');
    nodes.grid.innerHTML = fullGridHtml;

    // Sync grid styles
    nodes.grid.style.gridTemplateColumns = `repeat(${COLUMNS}, ${COL_W_CM}cm)`;
    nodes.grid.style.gridTemplateRows = `repeat(${ROWS}, ${ROW_H_CM}cm)`;
    nodes.grid.style.gap = `0 ${COL_GAP_CM}cm`;

    updatePreviewScale();
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function parseDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function addYears(date, years) {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  }

  // Helper: get MFD date as YYYYMMDD for filename, or 'nomfd' if missing
  function getMfdForFilename() {
    const mfdVal = $('mfd')?.value;
    const mfdDate = mfdVal ? parseDate(mfdVal) : null;
    if (!mfdDate) return 'nomfd';
    const yyyy = mfdDate.getFullYear();
    const mm = String(mfdDate.getMonth() + 1).padStart(2, '0');
    const dd = String(mfdDate.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }

  // Make filename: [downloadYYYYMMDD]-E248-[MFDYYYYMMDD].pdf
  function makeFilename() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `${yyyy}${mm}${dd}`;
    const mfdPart = getMfdForFilename();
    return `${prefix}-E248-${mfdPart}.pdf`;
  }



  // ---- Preview scaling (responsive) ----
  function getPxPerCm() {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    el.style.width = '1cm';
    document.body.appendChild(el);
    const px = el.getBoundingClientRect().width || 37.8;
    document.body.removeChild(el);
    return px;
  }

  function updatePreviewScale() {
    const page = q('.page');
    const wrapper = q('.preview-wrapper') || (page ? page.parentElement : null);
    if (!wrapper || !page) return;

    const pxPerCm = getPxPerCm();
    // scale based on full A4 width so the preview shows full page including margins
    const requiredPx = PAGE_WIDTH_CM * pxPerCm;

    // available width for container
    const avail = wrapper.clientWidth;

    // DPI-based calibration
    // 2K displays (dpr=1): typically show ~1cm too large, scale down to 0.95
    // 4K displays (dpr=2): typically show smaller, scale up by ~1.15x
    const dpr = window.devicePixelRatio || 1;
    let calibration = 1;
    if (dpr >= 2) {
      // High DPI (4K, Retina) - scale up to match physical size
      calibration = 1.15;
    } else if (dpr >= 1) {
      // Standard DPI (2K, 1080p) - scale down slightly to correct oversizing
      calibration = 0.95;
    }

    // Calculate scale: fit to container, apply calibration, cap at calibrated value
    let baseScale = avail / requiredPx;
    let scale = Math.min(baseScale, calibration);
    scale = Math.max(scale, 0.25); // Minimum scale

    page.style.transform = `scale(${scale})`;
    page.style.transformOrigin = 'top center';

    // Fix layout whitespace: Apply negative margin to account for scaling
    // 29.7cm is the full height of A4
    const fullHeightPx = 29.7 * pxPerCm;
    const scaledHeightPx = fullHeightPx * scale;
    const heightDiff = fullHeightPx - scaledHeightPx;
    page.style.marginBottom = `-${heightDiff}px`;

    // ensure the page width visually matches A4
    page.style.width = `${PAGE_WIDTH_CM}cm`;
    // keep preview padding for on-screen display (1cm top, 1.1cm sides)
    page.style.paddingTop = '1cm';
    page.style.paddingLeft = '1.1cm';
    page.style.paddingRight = '1.1cm';
  }

  // make sure the latest preview is generated for printing
  generate();

  // Note: Styles are now handled by print.css with !important to ensure correct A4 layout
  // We no longer manually manipulate styles here to avoid conflicts.

  function handleAfterPrint() {
    // restore responsive preview scale
    updatePreviewScale();
  }

  // Export current page to A4 PDF using text (not image) - matches preview exactly
  function downloadPdf() {
    const pageEl = q('.page');
    const gridEl = q('.grid');
    
    // Wait for jsPDF to load - try multiple times
    const waitForjsPDF = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        const checkjsPDF = () => {
          attempts++;
          // Cloudflare UMD bundle puts it in window.jspdf.jsPDF
          let jsPDFLib = null;
          
          if (window.jspdf && window.jspdf.jsPDF) {
            jsPDFLib = window.jspdf.jsPDF;
          } else if (window.jsPDF && window.jsPDF.jsPDF) {
            jsPDFLib = window.jsPDF.jsPDF;
          } else if (typeof window.jsPDF === 'function') {
            jsPDFLib = window.jsPDF;
          } else if (typeof jsPDF !== 'undefined' && typeof jsPDF === 'function') {
            jsPDFLib = jsPDF;
          }
          
          if (jsPDFLib) {
            resolve(jsPDFLib);
          } else if (attempts < maxAttempts) {
            setTimeout(checkjsPDF, 100);
          } else {
            console.error('jsPDF check failed after ' + attempts + ' attempts. window.jspdf:', window.jspdf, 'window.jsPDF:', window.jsPDF);
            reject(new Error('jsPDF library failed to load after 5 seconds'));
          }
        };
        
        checkjsPDF();
      });
    };
    
    if (!pageEl || !gridEl) {
      alert('Page element not found.');
      return;
    }

    // Try to get PDF library
    waitForjsPDF().then((jsPDFLib) => {
      const filename = makeFilename();
      
      // Get current font settings from form
      const fontFamily = nodes.fontSelect?.value || 'helvetica';
      const fontWeight = document.querySelector('input[name="weight"]:checked')?.value || 'semibold';
      
      // Map font families to PDF fonts
      const fontMap = {
        'helvetica': 'Helvetica',
        'arial': 'Arial',
        'inter': 'Helvetica',
        'roboto': 'Helvetica',
        'sf': 'Helvetica'
      };
      const pdfFont = fontMap[fontFamily] || 'Helvetica';
      
      // Map font weights
      const fontStyleMap = {
        'regular': 'normal',
        'semibold': 'bold',
        'bold': 'bold'
      };
      const pdfFontStyle = fontStyleMap[fontWeight] || 'bold';
      
      try {
        // Create PDF (A4: 21cm x 29.7cm)
        const pdf = new jsPDFLib({ unit: 'cm', format: 'a4', orientation: 'portrait' });
        pdf.setFont(pdfFont, pdfFontStyle);
        pdf.setFontSize(7);
        
        // Get all labels and their positions
        const labels = gridEl.querySelectorAll('.label');
        let labelIndex = 0;
        
        // Grid layout constants (must match style.css)
        const colW = 2;
        const rowH = 0.9;
        const colGap = 0.4;
        const pageLeftMargin = 1.1;
        const pageTopMargin = 1;
        
        // Calculate positions for each label
        labels.forEach((label) => {
          const text = label.textContent.trim();
          if (!text) return; // skip empty labels
          
          // Calculate row and column from label index
          const col = labelIndex % COLUMNS;
          const row = Math.floor(labelIndex / COLUMNS);
          
          // Calculate actual position in cm
          const x = pageLeftMargin + (col * (colW + colGap));
          const y = pageTopMargin + (row * rowH) + rowH / 2; // center vertically in cell
          
          // Add text to PDF - centered in the label cell
          pdf.text(text, x + colW / 2, y, { align: 'center', baseline: 'middle' });
          
          labelIndex++;
        });
        
        // Save PDF
        pdf.save(filename);
      } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF: ' + error.message);
      }
    }).catch((error) => {
      console.error('PDF library error:', error);
      alert('PDF generator library not loaded. Please refresh the page and try again.');
    });
  }

  // run
  document.addEventListener('DOMContentLoaded', init);
})();