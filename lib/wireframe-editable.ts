/**
 * Wraps wireframe HTML with editing + section highlight scripts.
 * - Text nodes become contenteditable on click
 * - Sections highlight on hover and post section name to parent
 * - Parent can send "arbo-highlight-section" to highlight a section
 * - Parent can send "arbo-scroll-to-section" to scroll to a section
 * - Changes are posted back to the parent via postMessage
 */
export function makeEditable(html: string): string {
  if (!html) return html

  const script = `
<style>
  [contenteditable="true"] {
    outline: 2px solid #F76B15 !important;
    outline-offset: 2px;
    border-radius: 3px;
  }
  .arbo-section-highlight {
    outline: 2px solid #8B5CF6 !important;
    outline-offset: -2px;
    border-radius: 4px;
    transition: outline-color 0.2s, background 0.2s;
  }
  .arbo-section-hover {
    outline: 1px dashed #9CA3AF !important;
    outline-offset: -1px;
    border-radius: 2px;
  }
  .arbo-section-pulse { animation: arbo-pulse 1.5s ease-out; }
  @keyframes arbo-pulse {
    0%   { outline-color: #8B5CF6; background: rgba(139,92,246,0.08); }
    100% { outline-color: transparent; background: transparent; }
  }
  * { cursor: default; }
  h1,h2,h3,h4,h5,h6,p,span,a,li,td,th,label,button,div[style*="font-size"] { cursor: text; }
</style>
<script>
(function() {
  function emit() {
    var pageEl = document.querySelector('[data-arbo-page-content]');
    var html = pageEl ? pageEl.innerHTML : document.body.innerHTML;
    window.parent.postMessage({ type: 'arbo-wireframe-edit', html: html }, '*');
  }

  var TEXT_TAGS = ['H1','H2','H3','H4','H5','H6','P','SPAN','A','LI','TD','TH','LABEL','BUTTON'];

  document.addEventListener('click', function(e) {
    var el = e.target;

    // Check if click is on a section — notify parent for comment mode
    var sectionEl = el;
    while (sectionEl && sectionEl !== document.body) {
      var secName = elementMap.get(sectionEl);
      if (secName) {
        window.parent.postMessage({ type: 'arbo-section-click', section: secName }, '*');
        break;
      }
      sectionEl = sectionEl.parentElement;
    }

    // Text editing
    while (el && el !== document.body) {
      if (TEXT_TAGS.indexOf(el.tagName) !== -1 ||
          (el.childNodes.length <= 3 && el.textContent.trim().length > 0 && el.children.length === 0)) {
        el.contentEditable = 'true';
        el.focus();
        el.addEventListener('blur', function handler() {
          this.contentEditable = 'false';
          this.removeEventListener('blur', handler);
          emit();
        });
        return;
      }
      el = el.parentElement;
    }
  });

  // ─── Section detection ───
  var sectionMap = {};
  var elementMap = new WeakMap();

  function detectSections() {
    sectionMap = {};
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT, null, false);
    var comment;
    while (comment = walker.nextNode()) {
      var text = comment.textContent.trim();
      if (!text || text.length > 50) continue;
      var el = comment.nextSibling;
      while (el && el.nodeType !== 1) el = el.nextSibling;
      if (el && el.nodeType === 1) {
        sectionMap[text] = el;
        elementMap.set(el, text);
      }
    }
    var names = Object.keys(sectionMap);
    if (names.length > 0) {
      window.parent.postMessage({ type: 'arbo-sections-detected', sections: names }, '*');
    }
  }

  detectSections();
  setTimeout(detectSections, 500);

  document.addEventListener('mouseover', function(e) {
    var el = e.target;
    while (el && el !== document.body) {
      var name = elementMap.get(el);
      if (name) {
        var prev = document.querySelector('.arbo-section-hover');
        if (prev && prev !== el) prev.classList.remove('arbo-section-hover');
        el.classList.add('arbo-section-hover');
        window.parent.postMessage({ type: 'arbo-section-hover', section: name }, '*');
        return;
      }
      el = el.parentElement;
    }
  });

  document.addEventListener('mouseout', function(e) {
    if (e.target && e.target.classList) e.target.classList.remove('arbo-section-hover');
    var related = e.relatedTarget;
    if (!related || related === document.body || related === document.documentElement)
      window.parent.postMessage({ type: 'arbo-section-hover', section: null }, '*');
  });

  window.addEventListener('message', function(e) {
    var data = e.data;
    if (!data || !data.type) return;

    if (data.type === 'arbo-highlight-section') {
      document.querySelectorAll('.arbo-section-highlight').forEach(function(el) {
        el.classList.remove('arbo-section-highlight');
      });
      if (data.section && sectionMap[data.section]) {
        sectionMap[data.section].classList.add('arbo-section-highlight');
      }
    }

    if (data.type === 'arbo-scroll-to-section') {
      if (data.section && sectionMap[data.section]) {
        var el = sectionMap[data.section];
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('arbo-section-pulse', 'arbo-section-highlight');
        setTimeout(function() {
          el.classList.remove('arbo-section-pulse', 'arbo-section-highlight');
        }, 1500);
      }
    }

    if (data.type === 'arbo-re-detect') detectSections();
  });
})();
<\/script>`

  if (html.includes('</body>')) return html.replace('</body>', script + '\n</body>')
  return html + script
}
