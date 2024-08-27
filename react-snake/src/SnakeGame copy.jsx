import React, { useState, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

const BOARD_SIZE = 20;
const SNAKE_INITIAL_POSITION = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: 1 };

function SnakeGame2() {
    const [snake, setSnake] = useState(SNAKE_INITIAL_POSITION);
    const [food, setFood] = useState(generateFood());
    const [direction, setDirection] = useState(INITIAL_DIRECTION);
    const { sendMessage, lastMessage, readyState } = useWebSocket('ws://localhost:5267/ws');
    const gameAreaRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(moveSnake, 100);
        return () => clearInterval(interval);
    }, [snake, direction]);

    useEffect(() => {
        if (lastMessage !== null) {
            // Handle incoming messages (e.g., opponent moves)
            console.log(lastMessage.data);
        }
    }, [lastMessage]);

    useEffect(() => {
        // Focus the game area to capture key presses
        gameAreaRef.current.focus();
    }, []);

    function moveSnake() {
        const newSnake = [...snake];
        const head = newSnake[newSnake.length - 1];
        const newHead = {
            x: head.x + direction.x,
            y: head.y + direction.y,
        };

        // Handle collision with walls or self
        if (
            newHead.x < 0 ||
            newHead.x >= BOARD_SIZE ||
            newHead.y < 0 ||
            newHead.y >= BOARD_SIZE ||
            newSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
        ) {
            alert("Game Over!");
            setSnake(SNAKE_INITIAL_POSITION);
            setDirection(INITIAL_DIRECTION);
            return;
        }

        newSnake.push(newHead);
        if (newHead.x === food.x && newHead.y === food.y) {
            setFood(generateFood());
        } else {
            newSnake.shift();
        }
        setSnake(newSnake);

        // Send new snake position to server
        sendMessage(JSON.stringify(newSnake));
    }

    function generateFood() {
        return {
            x: Math.floor(Math.random() * BOARD_SIZE),
            y: Math.floor(Math.random() * BOARD_SIZE),
        };
    }

    function handleKeyPress(e) {
        switch (e.key) {
            case 'ArrowUp':
                if (direction.y === 0) setDirection({ x: 0, y: -1 });
                break;
            case 'ArrowDown':
                if (direction.y === 0) setDirection({ x: 0, y: 1 });
                break;
            case 'ArrowLeft':
                if (direction.x === 0) setDirection({ x: -1, y: 0 });
                break;
            case 'ArrowRight':
                if (direction.x === 0) setDirection({ x: 1, y: 0 });
                break;
            default:
                break;
        }
    }

    return (
        <div
            ref={gameAreaRef}
            onKeyDown={handleKeyPress}
            tabIndex="0"
            style={{ outline: 'none' }}
        >
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${BOARD_SIZE}, 20px)`,
                gridTemplateRows: `repeat(${BOARD_SIZE}, 20px)`,
            }}>
                {[...Array(BOARD_SIZE)].map((_, y) =>
                    [...Array(BOARD_SIZE)].map((_, x) =>
                        <div
                            key={`${x}-${y}`}
                            style={{
                                width: 20,
                                height: 20,
                                backgroundColor: snake.some(s => s.x === x && s.y === y) ? 'green' : (food.x === x && food.y === y ? 'red' : 'white'),
                                border: '1px solid black',
                            }}
                        />
                    )
                )}
            </div>
            <div>
                WebSocket status: {ReadyState[readyState]}
            </div>
        </div>
    );
}

export default SnakeGame2;
