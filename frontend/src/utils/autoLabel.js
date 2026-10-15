// Accessibility (WCAG): jin input/select/textarea par label ya aria-label nahi hai,
// unhein automatically aria-label de deta hai (label text, section ka title, ya placeholder se).

const clean = (text) =>
  String(text || '')
    .replace(/[^\p{L}\p{N}\s().,'/:-]/gu, '') // emoji hatao
    .replace(/\s+/g, ' ')
    .trim();

const guessLabel = (el) => {
  // 1) Pichla <label> sibling (jaise Goals/Profile pages)
  const prev = el.previousElementSibling;
  if (prev && prev.tagName === 'LABEL' && clean(prev.textContent)) return clean(prev.textContent);

  // 2) Settings/Goals row ka heading (<strong>)
  const rowTitle = el.closest('.settings-row')?.querySelector('strong');
  if (rowTitle && clean(rowTitle.textContent)) return clean(rowTitle.textContent);

  // 3) Placeholder
  const placeholder = clean(el.getAttribute('placeholder'));
  if (placeholder) return placeholder;

  // 4) Type ke hisab se
  if (el.tagName === 'SELECT') {
    const options = [...el.options].slice(0, 3).map((o) => clean(o.textContent)).filter(Boolean);
    return options.length ? `Select option (${options.join(', ')})` : 'Select option';
  }
  if (el.type === 'date') return 'Date';
  if (el.type === 'time') return 'Time';
  if (el.type === 'number') return 'Number';
  return el.getAttribute('name') || 'Input';
};

const labelAll = () => {
  document.querySelectorAll('input, select, textarea').forEach((el) => {
    if (['hidden', 'submit', 'button'].includes(el.type)) return;
    if (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) return;
    if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return;
    const wrapper = el.closest('label');
    if (wrapper && clean(wrapper.textContent)) return; // label ke andar text hai
    el.setAttribute('aria-label', guessLabel(el));
  });
};

// App.jsx se ek baar chalayen; page badalne par naye inputs ko bhi label deta rehta hai
export const startAutoLabel = () => {
  let scheduled = false;
  const run = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      labelAll();
    });
  };
  run();
  const observer = new MutationObserver(run);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
};