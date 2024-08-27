import React, { useState, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

const BOARD_SIZE = 20;
const SNAKE_INITIAL_POSITION = [{ x: rnd(), y: rnd() }];
const INITIAL_DIRECTION = { x: rnd2(), y: rnd2() };

function rnd(){
    return Math.floor(Math.random() * 20);
}

function rnd2(){
    return Math.floor(Math.random() * 2);
}

function SnakeGame() {
    const [snake, setSnake] = useState(SNAKE_INITIAL_POSITION);
    const [opponentSnake, setOpponentSnake] = useState([]);
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
            const gameState = JSON.parse(lastMessage.data);

            // Update opponent's snake position
            if (gameState.Players.length > 1) {
                const [otherPlayer] = gameState.Players.filter(p => p.Body[0].x !== snake[0].x || p.Body[0].y !== snake[0].y);
                setOpponentSnake(otherPlayer.Body);
            }
        }
    }, [lastMessage]);

    useEffect(() => {
        gameAreaRef.current.focus();
    }, []);

    function moveSnake() {
        const newSnake = [...snake];
        const head = newSnake[newSnake.length - 1];
        const newHead = {
            x: head.x + direction.x,
            y: head.y + direction.y,
        };

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
        console.log(JSON.stringify({ Body: newSnake }));
        sendMessage(JSON.stringify({ Body: newSnake }));
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
                                backgroundColor:
                                    snake.some(s => s.x === x && s.y === y)
                                        ? 'green'
                                        : opponentSnake.some(s => s.x === x && s.y === y)
                                            ? 'blue'
                                            : food.x === x && food.y === y
                                                ? 'red'
                                                : 'white',
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

export default SnakeGame;
