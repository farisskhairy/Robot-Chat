'use client'; // Required for Next.js 13+ App Router

import React, { useState, useEffect } from 'react';
import styles from './RobotFace.module.css';

const RobotFace = ({ expression = 'neutral' }) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // LOGIC: The Autonomous Blink Reflex
  useEffect(() => {
    let timeoutId;

    const blinkLoop = () => {
      // 1. Close Eyes
      setIsBlinking(true);

      // 2. Open Eyes after 150ms
      setTimeout(() => {
        setIsBlinking(false);

        // 3. Schedule next blink (Random time between 2s and 6s)
        const nextBlink = Math.random() * 4000 + 2000;
        timeoutId = setTimeout(blinkLoop, nextBlink);
      }, 150);
    };

    // Start the loop
    timeoutId = setTimeout(blinkLoop, 3000);

    // Cleanup on unmount
    return () => clearTimeout(timeoutId);
  }, []);

  // Combine external expression + internal blink state
  // If blinking, force 'blink' class. Otherwise use the prop.
  const currentClass = isBlinking ? styles.blink : styles[expression] || styles.neutral;

  return (
    <div className={styles.faceContainer}>
      <div className={`${styles.head} ${currentClass}`}>
        <div className={styles.eye}></div>
        <div className={styles.eye}></div>
      </div>
    </div>
  );
};

export default RobotFace;