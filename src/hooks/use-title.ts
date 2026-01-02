import { useEffect } from 'react';

export function useTitle(title?: string) {
  useEffect(() => {
    const baseTitle = 'RePrint';
    document.title = title ? `${title} | ${baseTitle}` : baseTitle;
  }, [title]);
}
