import { useEffect, useState } from 'react';
import { COPY } from './copy.js';

export function currentCopy(ctx) {
  const active = ctx.locale?.getLocale?.().active || 'en';
  return String(active).toLowerCase().startsWith('zh') ? COPY.zh : COPY.en;
}

export function useCopy(ctx) {
  const [copy, setCopy] = useState(() => currentCopy(ctx));
  useEffect(() => {
    if (!ctx.locale?.subscribe) return undefined;
    return ctx.locale.subscribe(() => setCopy(currentCopy(ctx)));
  }, [ctx]);
  return copy;
}
