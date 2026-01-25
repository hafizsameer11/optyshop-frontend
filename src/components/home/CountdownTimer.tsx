import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endsAt: string;
  initialCountdown?: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  onExpire?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ endsAt, initialCountdown, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: initialCountdown?.hours || 0,
    minutes: initialCountdown?.minutes || 0,
    seconds: initialCountdown?.seconds || 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(endsAt);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt, onExpire]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex space-x-2 md:space-x-4">
      <div className="flex flex-col items-center">
        <div className="bg-emerald-100 text-emerald-800 font-bold text-xl md:text-2xl p-2 rounded-lg shadow-md min-w-[45px] md:min-w-[60px] text-center border border-emerald-200">
          {formatNumber(timeLeft.hours)}
        </div>
        <span className="text-[10px] md:text-xs uppercase mt-1 font-medium text-emerald-600">Hours</span>
      </div>
      <div className="text-emerald-200 text-xl md:text-2xl font-bold self-center -mt-4">:</div>
      <div className="flex flex-col items-center">
        <div className="bg-emerald-100 text-emerald-800 font-bold text-xl md:text-2xl p-2 rounded-lg shadow-md min-w-[45px] md:min-w-[60px] text-center border border-emerald-200">
          {formatNumber(timeLeft.minutes)}
        </div>
        <span className="text-[10px] md:text-xs uppercase mt-1 font-medium text-emerald-600">Mins</span>
      </div>
      <div className="text-emerald-200 text-xl md:text-2xl font-bold self-center -mt-4">:</div>
      <div className="flex flex-col items-center">
        <div className="bg-emerald-100 text-emerald-800 font-bold text-xl md:text-2xl p-2 rounded-lg shadow-md min-w-[45px] md:min-w-[60px] text-center border border-emerald-200">
          {formatNumber(timeLeft.seconds)}
        </div>
        <span className="text-[10px] md:text-xs uppercase mt-1 font-medium text-emerald-600">Secs</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
