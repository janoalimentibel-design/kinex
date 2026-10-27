// Iconos SVG heredados de A2.8 (I_CHK, I_CARET).
export function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 6" />
    </svg>
  );
}

export function IconCaret() {
  return (
    <svg className="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconChevron({ direction }: { direction: 'left' | 'right' }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={direction === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} /></svg>;
}

export function IconNavigation({ name }: { name: string }) {
  const paths: Record<string, string> = {
    today: 'M3 10l9-7 9 7v11h-6v-7H9v7H3z',
    lib: 'M4 4h4v16H4zM10 4h4v16h-4zM16 5l4-1 3 15-4 1z',
    hist: 'M4 3v17h17M8 15l4-5 4 2 5-7',
    plan: 'M4 5h16v16H4zM4 10h16M8 3v4m8-4v4M8 14h2m4 0h2m-8 4h2',
    requests: 'M4 20l1-5L16 4l4 4L9 19zM13 7l4 4M4 21h17',
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}
