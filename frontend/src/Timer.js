import React, { useState, useEffect } from "react";
import './Timer.css'


export default function Timer({ isActive, duration, onTimeUp }) {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {

        let interval;
        if (isActive && timeLeft > 0) {

            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }

        if (timeLeft <= 0 && isActive) {
            onTimeUp();
            setTimeLeft(0);
            clearInterval(interval);
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, onTimeUp]);

    return <div className="timer">Time left: {timeLeft} seconds</div>;
}
