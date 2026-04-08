"use client";

import { useEffect, useMemo, useState } from "react";

interface BootSequenceProps {
  children: React.ReactNode;
}

const LINES = [
  "[OK] kernel modules loaded",
  "[OK] encrypted layers active",
  "[RUN] threat database syncing",
  "[RUN] neural net weights fetching",
  "[RUN] awaiting final handshake",
];

export default function BootSequence({ children }: BootSequenceProps) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const progressId = setInterval(() => {
      setProgress((value) => {
        if (value >= 98) return value;
        return Math.min(98, value + Math.max(2, Math.floor(Math.random() * 9)));
      });
    }, 150);

    const doneId = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
      }, 350);
    }, 2500);

    return () => {
      clearInterval(progressId);
      clearTimeout(doneId);
    };
  }, []);

  const signalStrength = useMemo(() => Math.max(1, Math.ceil(progress / 25)), [progress]);

  if (!loading) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[200] boot-overlay">
          <div className="boot-grid" />
          <div className="boot-scanline" />

          <div className="boot-center">
            <div className="boot-core-wrap">
              <div className="boot-block block-a" />
              <div className="boot-block block-b" />
              <div className="boot-core">
                <div className="boot-core-inner" />
              </div>
            </div>

            <h1 className="boot-title">INITIALIZING SENTINEL CORE...</h1>
            <p className="boot-subtitle">NODE_ID: 0XF82A_B3A | LOCATION: ORBITAL_STATION_ALPHA</p>

            <div className="boot-progress-wrap">
              <div className="boot-progress-head">
                <span>SYSTEM_INTEGRITY_INDEX</span>
                <span>{progress}%</span>
              </div>
              <div className="boot-progress-track">
                <div className="boot-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="boot-log-panel">
            <p className="boot-log-title">SYSTEM_DIAGNOSTICS_v6</p>
            {LINES.map((line) => (
              <p key={line} className="boot-log-line">{line}</p>
            ))}
            <div className="boot-log-foot">
              <span>X-89_SENTINEL</span>
              <span>{(98 + progress / 50).toFixed(4)}%</span>
            </div>
          </div>

          <div className="boot-signal-panel">
            <div className="boot-signal-visual" />
            <p className="boot-signal-label">SIGNAL_STRENGTH</p>
            <div className="boot-bars">
              {Array.from({ length: 4 }).map((_, index) => (
                <span
                  key={index}
                  className={index < signalStrength ? "boot-bar on" : "boot-bar"}
                />
              ))}
            </div>
          </div>
    </div>
  );
}
