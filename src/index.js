import React from 'react';
import ReactDOM from 'react-dom';
import './game.css';

const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

function Square(props) {
    return (
        <button className="square" onClick={props.onClick}>
            {props.value}
        </button>
    );
}

class Board extends React.Component {
    renderSquare(i) {
        return (
            <Square
                value={this.props.squares[i]}
                onClick={() => this.props.onClick(i)}
            />
        );
    }

    render() {
        return (
            <div>
                <div className="board-row">
                    {this.renderSquare(0)}
                    {this.renderSquare(1)}
                    {this.renderSquare(2)}
                </div>
                <div className="board-row">
                    {this.renderSquare(3)}
                    {this.renderSquare(4)}
                    {this.renderSquare(5)}
                </div>
                <div className="board-row">
                    {this.renderSquare(6)}
                    {this.renderSquare(7)}
                    {this.renderSquare(8)}
                </div>
            </div>
        );
    }
}

let w0 = 1;
let w1 = 1;
let w2 = 0;

let lastSquares = null;

/**
 * @return {number}
 * V: 目标函数
 * x1: 受到威胁的边的数量
 * x2: 占中优势
 */
function V(x1, x2) {
    return w0 + w1 * x1 + w2 * x2;
}

function learn(estimateScore, newSquares) {
    let actualScore = estimateScore;

    let winner = calculateWinner(newSquares);
    if (winner === 'X') {
        actualScore = 100;
    }
    if (winner === 'O') {
        actualScore = -100;
    }
    if (winner === null && newSquares.filter(s => s === null).length === 0) {
        actualScore = 0;
    }

    let diff = estimateScore - actualScore;
    if (diff !== 0) {
        w0 = w0 + 0.1 * diff * w0;
        w1 = w1 + 0.1 * diff * w1;
        w2 = w2 + 0.1 * diff * w2;

        console.log('w0 = ', w0, 'w1 = ', w1, 'w2 = ', w2)
    }
    return estimateScore;
}

function calculateScore(newSquares) {
    let x2 = newSquares[4] === 'X' ? 1 : -1;

    let x1 = 0;
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];

        if ((a === 'O' && b === 'O' && c === null) ||
            (a === 'O' && b === null && c === 'O') ||
            (a === null && b === 'O' && c === 'O')) {
            x1 += 1;
        }
    }

    return V(x1, x2);
}

function generateBoards(squares, nullIndice) {
    let result = [];

    for (let i = 0; i < nullIndice.length; i++) {
        let newSquares = squares.slice(0);
        newSquares[nullIndice[i]] = 'X';

        result.push({squares: newSquares, score: calculateScore(newSquares), index: nullIndice[i]})
    }

    return result;
}

function selectBestScore(squares, nullIndice) {
    let boards = generateBoards(squares, nullIndice);

    let maxScore = -Infinity;
    let bestChoice = -1;
    let bestSquares = null;
    for (let i = 0; i < boards.length; i++) {
        const {score, index, squares} = boards[i]
        if (score > maxScore) {
            maxScore = score;
            bestChoice = index;
            bestSquares = squares;
        }
    }

    if (bestSquares !== null) {
        lastSquares = bestSquares;
    }

    learn(maxScore, lastSquares);

    return bestChoice;
}

function aiNextSteps(squares) {
    let nullIndice = [];

    for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) {
            nullIndice.push(i)
        }
    }

    if (nullIndice.length < 1) {
        alert('没有可以走的空位了')
    }

    return selectBestScore(squares, nullIndice);
}

class Index extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            history: [
                {
                    squares: Array(9).fill(null)
                }
            ],
            stepNumber: 0,
            xIsNext: true,
            w0: w0,
            w1: w1,
            w2: w2
        };
    }

    componentDidMount() {
        this.handleClick(aiNextSteps(this.state.history[0].squares))
    }

    handleClick(i) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        if (calculateWinner(squares) || squares[i]) {
            return;
        }
        squares[i] = this.state.xIsNext ? "X" : "O";
        this.setState({
            history: history.concat([
                {
                    squares: squares
                }
            ]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext
        }, () => {
            if (this.state.xIsNext) {
                this.handleClick(aiNextSteps(squares));
                this.forceUpdate();
            }
        });
    }

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0
        });
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const winner = calculateWinner(current.squares);

        const moves = history.map((step, move) => {
            const desc = move ?
                'Go to move #' + move :
                'Go to game start';
            return (
                <li key={move}>
                    <button onClick={() => this.jumpTo(move)}>{desc}</button>
                </li>
            );
        });

        let status;
        if (winner) {
            status = "Winner: " + winner;
        } else {
            status = "Next player: " + (this.state.xIsNext ? "X" : "O");
        }

        return (
            <div className="game">
                <div className="game-board">
                    <Board
                        squares={current.squares}
                        onClick={i => this.handleClick(i)}
                    />
                </div>
                <div className="game-info">
                    <div>{status}</div>
                    <ol>{moves}</ol>
                </div>
            </div>
        );
    }
}

// ========================================

ReactDOM.render(<Index/>, document.getElementById("root"));

function calculateWinner(squares) {
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}
