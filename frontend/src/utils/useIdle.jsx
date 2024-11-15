import { useState, useEffect } from 'react';

const useIdle = (timeout = 50000) => {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      setIsIdle(false);
      console.log('User is active');
      timer = setTimeout(() => {
        setIsIdle(true);
        console.log('User is idle');
      }, timeout);
    };

    const handleActivity = () => {
      resetTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    resetTimer();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [timeout]);

  return isIdle;
};

export default useIdle;