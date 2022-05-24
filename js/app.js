'use strict'

var WALL = 'WALL';
var FLOOR = 'FLOOR';
var BALL = 'BALL';
var GAMER = 'GAMER';
var GLUE = 'GLUE';

var GAMER_IMG = '<img src="img/gamer.png" />';
var BALL_IMG = '<img src="img/ball.png" />';
var GLUE_IMG = '<img src="img/glue.png" />';

var COLLECTING_AUDIO = new Audio('sounds/collect.mp3');

var gBoard;
var gGamerPos;
var gBallsOnBoard;
var gBallIntervalId;
var gGlueIntervalId;
var gScore;
var gIsGamerMoving;

function initGame() {
	gIsGamerMoving = true;
	gGamerPos = { i: 2, j: 9 };
	gBoard = buildBoard();
	gScore = 0;
	gBallIntervalId = setInterval(addBall, 3000)
	gGlueIntervalId = setInterval(addGlue, 5000)
	renderBoard(gBoard);
	renderScore();

	var elWinnerMsg = document.querySelector('.winner');
	var elLoserMsg = document.querySelector('.loser');
	var elRestartButton = document.querySelector('.restart-button');
	elWinnerMsg.style.display = 'none';
	elLoserMsg.style.display = 'none';
	elRestartButton.style.display = 'none';
	elRestartButton.disabled = true;
}


function buildBoard() {
	// Create the Matrix
	var board = createMat(10, 12)


	// Put FLOOR everywhere and WALL at edges
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[0].length; j++) {
			// Put FLOOR in a regular cell
			var cell = { type: FLOOR, gameElement: null };

			// Place Walls at edges
			if (i === 0 || i === board.length - 1 || j === 0 || j === board[0].length - 1) {
				cell.type = WALL;
			}

			// Add passages:
			if (i === Math.floor(board.length / 2) || j === Math.floor(board[0].length / 2)) {
				cell.type = FLOOR;
			}

			// Add created cell to The game board
			board[i][j] = cell;
		}
	}

	// Place the gamer at selected position
	board[gGamerPos.i][gGamerPos.j].gameElement = GAMER;

	// Place the Balls (currently randomly chosen positions)
	board[3][8].gameElement = BALL;
	board[7][4].gameElement = BALL;
	gBallsOnBoard = 2;

	console.log(board);
	return board;
}

// Render the board to an HTML table
function renderBoard(board) {

	var strHTML = '';
	for (var i = 0; i < board.length; i++) {
		strHTML += '<tr>\n';
		for (var j = 0; j < board[0].length; j++) {
			var currCell = board[i][j];

			var cellClass = getClassName({ i: i, j: j })

			// TODO - change to short if statement
			if (currCell.type === FLOOR) cellClass += ' floor';
			else if (currCell.type === WALL) cellClass += ' wall';

			//TODO - Change To template string
			strHTML += '\t<td class="cell ' + cellClass +
				'"  onclick="moveTo(' + i + ',' + j + ')" >\n';

			// TODO - change to switch case statement
			if (currCell.gameElement === GAMER) {
				strHTML += GAMER_IMG;
			} else if (currCell.gameElement === BALL) {
				strHTML += BALL_IMG;
			}

			strHTML += '\t</td>\n';
		}
		strHTML += '</tr>\n';
	}

	console.log('strHTML is:');
	console.log(strHTML);
	var elBoard = document.querySelector('.board');
	elBoard.innerHTML = strHTML;
}

// Move the player to a specific location
function moveTo(i, j) {
	if (!gIsGamerMoving) return;

	var targetCell = gBoard[i][j];
	if (targetCell.type === WALL) return;

	// Calculate distance to make sure we are moving to a neighbor cell
	var iAbsDiff = Math.abs(i - gGamerPos.i);
	var jAbsDiff = Math.abs(j - gGamerPos.j);

	// If the clicked Cell is one of the four allowed
	if ((iAbsDiff % (gBoard.length - 2) === 1 && jAbsDiff === 0) || (jAbsDiff % (gBoard[0].length - 2) === 1 && iAbsDiff === 0)) {

		if (targetCell.gameElement === BALL) {
			//Data Model:
			gScore++;
			gBallsOnBoard--;
			//Dom: 
			renderScore();

			COLLECTING_AUDIO.play();

			console.log('Collecting!');
		}

		if (targetCell.gameElement === GLUE) {
			gIsGamerMoving = false;
			setTimeout(function () { gIsGamerMoving = true }, 3000);
		}

		// MOVING from current position
		// Model:
		gBoard[gGamerPos.i][gGamerPos.j].gameElement = null;
		// Dom:
		renderCell(gGamerPos, '');

		// MOVING to selected position
		// Model:
		gGamerPos.i = i;
		gGamerPos.j = j;
		gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
		// DOM:
		renderCell(gGamerPos, GAMER_IMG);
		if (gBallsOnBoard === 0) endGame();

	} // else console.log('TOO FAR', iAbsDiff, jAbsDiff);

}

function addBall() {
	var emptyCell = getRndEmptyCellLocation();
	gBoard[emptyCell.i][emptyCell.j].gameElement = BALL;
	gBallsOnBoard++;
	renderCell(emptyCell, BALL_IMG);
}

function addGlue() {
	var emptyCell = getRndEmptyCellLocation();
	gBoard[emptyCell.i][emptyCell.j].gameElement = GLUE;
	renderCell(emptyCell, GLUE_IMG);
	setTimeout(removeGlue, 3000, emptyCell);
}

function removeGlue(location) {
	var currCell = gBoard[location.i][location.j];
	if (currCell.gameElement === GLUE) {
		currCell.gameElement = null;
		renderCell(location, null);
	}
}


function getRndEmptyCellLocation() {
	var emptyCells = [];
	for (var i = 0; i < gBoard.length; i++) {
		for (var j = 0; j < gBoard[0].length; j++) {
			if (gBoard[i][j].type === FLOOR && !gBoard[i][j].gameElement) {
				emptyCells.push({ i, j });
			}
		}
	}

	if (emptyCells.length > 0) {
		var rndIdx = getRandomIntExclusive(0, emptyCells.length);
		return emptyCells[rndIdx];
	}

	return endGame();
}

// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
	var cellSelector = '.' + getClassName(location)
	var elCell = document.querySelector(cellSelector);
	elCell.innerHTML = value;
}

function renderScore() {
	var elScore = document.querySelector('.score-board span');
	elScore.innerText = gScore;
}

function endGame() {
	gIsGamerMoving = false;
	var elMsg;
	var elRestartButton = document.querySelector('.restart-button');
	clearInterval(gBallIntervalId);
	clearInterval(gGlueIntervalId);
	if (gBallsOnBoard === 0) {
		// REMOVING from current position
		// Model:
		gBoard[gGamerPos.i][gGamerPos.j].gameElement = null;
		// Dom:
		renderCell(gGamerPos, '');

		gGamerPos = null;
		elMsg = document.querySelector('.winner');
		elMsg.style.display = 'block';
	} else {
		elMsg = document.querySelector('.loser');
		elMsg.style.display = 'block';
	}

	elRestartButton.style.display = 'block';
	elRestartButton.disabled = false;
}

// Move the player by keyboard arrows
function handleKey(event) {

	var i = gGamerPos.i;
	var j = gGamerPos.j;

	var h = gBoard.length; // h -> gBoard height
	var w = gBoard[0].length; // w -> gBoard wigth

	switch (event.key) {
		case 'ArrowLeft':
			moveTo(i, positiveModulo(j - 1, w));
			break;
		case 'ArrowRight':
			moveTo(i, positiveModulo(j + 1, w));
			break;
		case 'ArrowUp':
			moveTo(positiveModulo(i - 1, h), j);
			break;
		case 'ArrowDown':
			moveTo(positiveModulo(i + 1, h), j);
			break;

	}

}

// Returns the class name for a specific cell
function getClassName(location) {
	var cellClass = 'cell-' + location.i + '-' + location.j;
	return cellClass;
}

