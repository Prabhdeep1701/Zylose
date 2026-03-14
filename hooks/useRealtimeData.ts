"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseRealtimeDataOptions<T> {
  generator: () => T;
  interval?: number;
  enabled?: boolean;
}

export function useRealtimeData<T>({
  generator,
  interval = 3000,
  enabled = true,
}: UseRealtimeDataOptions<T>) {
  const [data, setData] = useState<T>(() => generator());
  const [tick, setTick] = useState(0);
  const genRef = useRef(generator);
  genRef.current = generator;

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      setData(genRef.current());
      setTick(t => t + 1);
    }, interval);
    return () => clearInterval(id);
  }, [interval, enabled]);

  const refresh = useCallback(() => {
    setData(genRef.current());
    setTick(t => t + 1);
  }, []);

  return { data, tick, refresh };
}
