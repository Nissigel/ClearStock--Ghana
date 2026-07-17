import { useEffect, useState } from 'react';

/**
 * True once a request has been running long enough to look broken.
 *
 * The backend sleeps when idle and takes up to a minute to boot, so the first
 * call after a quiet spell is genuinely slow. Screens use this to explain the
 * wait instead of leaving the user staring at a spinner.
 */
export const useSlowRequestHint = (
  isLoading: boolean,
  delayMs = 6000
): boolean => {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsSlow(false);
      return;
    }
    const timer = setTimeout(() => setIsSlow(true), delayMs);
    return () => clearTimeout(timer);
  }, [isLoading, delayMs]);

  return isSlow;
};
