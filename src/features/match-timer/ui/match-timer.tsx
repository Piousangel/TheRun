'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';

export function MatchTimer() {
  const [timeInSeconds, setTimeInSeconds] = useState(10 * 60); // 10 minutes default
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime, setInitialTime] = useState(10 * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeInSeconds((prev) => {
          if (prev <= 0) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeInSeconds(initialTime);
  };

  const handleAddMinute = () => {
    if (!isRunning) {
      const newTime = initialTime + 60;
      setInitialTime(newTime);
      setTimeInSeconds(newTime);
    }
  };

  const handleSubtractMinute = () => {
    if (!isRunning && initialTime > 60) {
      const newTime = initialTime - 60;
      setInitialTime(newTime);
      setTimeInSeconds(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((initialTime - timeInSeconds) / initialTime) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">경기 타이머</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer display */}
        <div className="relative">
          <div className="text-6xl font-bold text-center text-primary mb-2">
            {formatTime(timeInSeconds)}
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Time adjustment (only when stopped) */}
        {!isRunning && timeInSeconds === initialTime && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSubtractMinute}
              disabled={initialTime <= 60}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[80px] text-center">
              {Math.floor(initialTime / 60)}분 설정
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddMinute}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={handlePlayPause}
            size="lg"
            className="flex-1 max-w-[200px]"
          >
            {isRunning ? (
              <>
                <Pause className="mr-2 h-5 w-5" />
                일시정지
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                시작
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        {/* Status indicator */}
        <div className="text-center text-sm text-muted-foreground">
          {timeInSeconds === 0 && '⏰ 경기 종료!'}
          {isRunning && timeInSeconds > 0 && '⚽ 경기 진행 중'}
          {!isRunning && timeInSeconds > 0 && timeInSeconds < initialTime && '⏸️ 일시정지'}
          {!isRunning && timeInSeconds === initialTime && '⏱️ 준비'}
        </div>
      </CardContent>
    </Card>
  );
}
