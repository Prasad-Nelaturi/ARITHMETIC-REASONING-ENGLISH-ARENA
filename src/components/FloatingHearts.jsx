import React, { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'

const FloatingHearts = () => {
    const [hearts, setHearts] = useState([])

    useEffect(() => {
        const interval = setInterval(() => {
            const heart = {
                id: Date.now() + Math.random(),
                left: 5 + Math.random() * 90,
                size: 14 + Math.random() * 16,
                duration: 5 + Math.random() * 4,
                drift: -50 + Math.random() * 100,
                rotation: -20 + Math.random() * 40,
            }

            setHearts((prev) => [...prev, heart])

            setTimeout(() => {
                setHearts((prev) =>
                    prev.filter((h) => h.id !== heart.id)
                )
            }, heart.duration * 1000)
        }, 900)

        return () => clearInterval(interval)
    }, [])

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 0,
            }}
        >
            <style>
                {`
                    @keyframes smoothHeartFloat {
                        0% {
                            transform:
                                translate3d(0, 0, 0)
                                rotate(0deg)
                                scale(0.6);
                            opacity: 0;
                        }

                        12% {
                            opacity: 0.55;
                        }

                        45% {
                            transform:
                                translate3d(var(--drift-half), -45vh, 0)
                                rotate(var(--rotation-half))
                                scale(1);
                            opacity: 0.6;
                        }

                        75% {
                            opacity: 0.35;
                        }

                        100% {
                            transform:
                                translate3d(var(--drift), -105vh, 0)
                                rotate(var(--rotation))
                                scale(0.75);
                            opacity: 0;
                        }
                    }
                `}
            </style>

            {hearts.map((heart) => (
                <Heart
                    key={heart.id}
                    size={heart.size}
                    strokeWidth={1.8}
                    style={{
                        position: 'absolute',
                        left: `${heart.left}%`,
                        bottom: '-40px',

                        color: '#ef4444',

                        '--drift': `${heart.drift}px`,
                        '--drift-half': `${heart.drift / 2}px`,
                        '--rotation': `${heart.rotation}deg`,
                        '--rotation-half': `${heart.rotation / 2}deg`,

                        animation: `
                            smoothHeartFloat
                            ${heart.duration}s
                            ease-out
                            forwards
                        `,

                        filter:
                            'drop-shadow(0 2px 5px rgba(239, 68, 68, 0.18))',
                    }}
                />
            ))}
        </div>
    )
}

export default FloatingHearts
