// Right now : supposes that all grids from all sudokus are identical in size and shape of regions and that all regions are rectangles with identical widths and heights.
// Anyway, this model allows imbricated sudokus such as Samurai, Shogun... and likely Sudokus where only spaces but not whole regions overlap.

const classic3x3infos = {
	columnBlockWidth : 3,
	rowBlockHeight : 3,
	columnBlockNumber : 3,
	rowBlockNumber : 3
}

const SUDOKU_MODE = {
	CLASSIC_9x9 : {
		label : 'Unique (9x9)',
		savedId : '9',
		gridInfos : classic3x3infos, // Information for ONE grid. Constraint : number of columns * their size = number of rows * their length = (max - min + 1)
		xTotalLength : 9, // Total length in spaces 
		yTotalLength : 9,
		startSpaces : [{x : 0, y : 0}],
		crossingoverGridIndexes : [[0]],
		min : 1,
		max : 9
	},
	BUTTERFLY_SUDOKU : {
		label : 'Butterfly',
		savedId : 'bf',
		gridInfos : classic3x3infos, 
		xTotalLength : 12,
		yTotalLength : 12,
		startSpaces : [{x : 0, y : 0}, {x : 3, y : 0}, {x : 0, y : 3}, {x : 3, y : 3}],
		crossingoverGridIndexes : [[0,1,2,3]], // For multipass. Gives the indexes of crossing overgrids that should go to multipass. According to the same order as in the startSpaces list.
		min : 1,
		max : 9
	},
	CLASSIC_12x12 : {
		label : 'Unique (12x12)',
		savedId : 'CH', // C = 12 in base 64, H for horizontal
		gridInfos : {
			columnBlockWidth : 4,
			rowBlockHeight : 3,
			columnBlockNumber : 3,
			rowBlockNumber : 4
		},
		xTotalLength : 12,
		yTotalLength : 12,
		startSpaces : [{x : 0, y : 0}],
		crossingoverGridIndexes : [[0]],
		min : 1,
		max : 12
	},
	CLASSIC_16x16 : {
		label : 'Unique (16x16)',
		savedId : 'g', // g = 16 in base 64
		gridInfos : {
			columnBlockWidth : 4,
			rowBlockHeight : 4,
			columnBlockNumber : 4,
			rowBlockNumber : 4
		},
		xTotalLength : 16,
		yTotalLength : 16,
		startSpaces : [{x : 0, y : 0}],
		crossingoverGridIndexes : [[0]],
		min : 1,
		max : 16
	},
	SAMURAI : {
		label : 'Samurai',
		savedId : 'sa', // like 'samurai'
		gridInfos : classic3x3infos, 
		xTotalLength : 21,  
		yTotalLength : 21,
		startSpaces : [{x : 0, y : 0}, {x : 12, y : 0}, {x : 6, y : 6}, {x : 0, y : 12}, {x : 12, y : 12}],
		crossingoverGridIndexes : [[0, 2], [1, 2], [2, 3], [2, 4]],
		min : 1,
		max : 9
	},
	SHOGUN : {
		label : 'Shogun',
		savedId : 'sh', // like 'shogun'
		gridInfos : classic3x3infos, 
		columnWidth : 3,
		rowHeight : 3,
		xTotalLength : 45,  
		yTotalLength : 21,
		startSpaces : [{x : 0, y : 0}, {x : 0, y : 12}, {x : 6, y : 6}, 
						{x : 12, y : 0}, {x : 12, y : 12}, {x : 18, y : 6}, 
						{x : 24, y : 0}, {x : 24, y : 12}, {x : 30, y : 6},
						{x : 36, y : 0}, {x : 36, y : 12}],
		crossingoverGridIndexes : [[0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6], [5, 7], [6, 8], [7, 8], [8, 9], [8, 10]],						
		min : 1,
		max : 9
	}
}

/** 
Returns a wallGrid for drawing (not optimal to draw like a bland Sudoku grid but very easy to code once drawWallGrid is done)
*/ 
function getSudokuWallGrid(p_sudokuMode) {
	const cw = p_sudokuMode.gridInfos.columnBlockWidth;
	const rh = p_sudokuMode.gridInfos.rowBlockHeight;
	const cg = p_sudokuMode.gridInfos.columnBlockNumber;
	const rg = p_sudokuMode.gridInfos.rowBlockNumber;
	const xTotalLength = p_sudokuMode.xTotalLength;
	const yTotalLength = p_sudokuMode.yTotalLength;
	const xGridLength = cw * cg; // Note ; xGridLength && yGridLength should be equal in fact...
	const yGridLength = rh * rg;
	var answer = WallGrid_dim(xTotalLength, yTotalLength);
	
	// Close all spaces by default (unless no grid needs to be closed)
	if (xTotalLength != xGridLength && yTotalLength != yGridLength) {
		for (var y = 0 ; y < yTotalLength ; y++) {
			for (var x = 0 ; x < xTotalLength ; x++) {
				answer.setState(x, y, WALLGRID.CLOSED);
			}
		}
		
		p_sudokuMode.startSpaces.forEach(coors => {
			const xOrigin = coors.x;
			const yOrigin = coors.y;
			for (var x = 0 ; x < xGridLength ; x++) {
				for (var y = 0 ; y < yGridLength ; y++) {
					answer.setState(x + xOrigin, y + yOrigin, WALLGRID.OPEN);
				}
			}
		});
	}
	
	// Set walls
	p_sudokuMode.startSpaces.forEach(coors => {
		const xOrigin = coors.x;
		const yOrigin = coors.y; 
		for (var x = xOrigin + cw ; x < xOrigin + xGridLength ; x += cw) {
			for (var y = yOrigin ; y < yOrigin + yGridLength ; y++) {
				answer.setWallL(x, y, WALLGRID.CLOSED);
			}
		}

		for (var y = yOrigin + rh ; y < yOrigin + yGridLength ; y += rh) {
			for (var x = xOrigin ; x < xOrigin + xGridLength ; x++) {
				answer.setWallU(x, y, WALLGRID.CLOSED);
			}
		}		
	});
	return answer;
}

function sudokuPuzzleName(p_name, p_sudokuMode) {
	return p_name + "_" + p_sudokuMode.savedId + "_"
}

function getSudokuIdFromLabel(p_sudokuComboboxValue) {
	var answer = null;
	Object.keys(SUDOKU_MODE).forEach(id => {
		if (p_sudokuComboboxValue == SUDOKU_MODE[id].label) {
			answer = SUDOKU_MODE[id];
		}
	});
	return answer;
}

function getGridLength(p_gridInfos) {
	return p_gridInfos.columnBlockWidth * p_gridInfos.columnBlockNumber;
}

// ---------
// Front / back separation
// ---------

// Credits : https://stackoverflow.com/questions/8674618/adding-options-to-select-with-javascript
function fillSudokuSelectCombobox(p_combobox) {
	var i = 0;
	Object.keys(SUDOKU_MODE).forEach(id => {
		var opt = document.createElement('option');
		opt.value = SUDOKU_MODE[id].label;
		opt.innerHTML = SUDOKU_MODE[id].label;
		p_combobox.appendChild(opt);
	});
}