/**
 * Styles for the bilingual nodes injected into the PAGE's real DOM (not the
 * selection card's Shadow DOM). Namespaced under .bt-bilingual and defended
 * against page CSS with !important on the few critical properties. Injected once;
 * removed on teardown.
 */
export const PAGE_TRANSLATE_STYLE_ID = 'bt-page-translate-style';

export const PAGE_TRANSLATE_CSS = `
.bt-bilingual {
  display: block !important;
  margin: 4px 0 8px 0 !important;
  padding: 0 !important;
  color: inherit !important;
  opacity: 0.82 !important;
  font-size: inherit !important;
  line-height: 1.5 !important;
  border: none !important;
  background: none !important;
}
.bt-source-hidden { display: none !important; }
.bt-bilingual.bt-translation-only { opacity: 1 !important; margin: 0 0 8px 0 !important; }
.bt-bilingual-loading {
  display: inline-block !important;
  min-width: 64px;
  height: 0.7em;
  border-radius: 3px;
  background: linear-gradient(90deg, rgba(127,127,127,0.18) 25%, rgba(127,127,127,0.32) 37%, rgba(127,127,127,0.18) 63%);
  background-size: 400% 100%;
  animation: bt-shimmer 1.2s ease-in-out infinite;
}
@keyframes bt-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
.bt-bilingual-error {
  color: #dc2626 !important;
  font-size: 0.85em !important;
  cursor: pointer;
}
.bt-bilingual-error:hover { text-decoration: underline; }
`;
