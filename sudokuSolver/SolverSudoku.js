const SUDOKU_VOID = -1;

const SUDOKU_PASS_CATEGORY = {
	CUSTOM : 1,
	GRIDS : 2,
	ALL : 3
};

// Initialization
function SolverSudoku(p_sudokuMode, p_numberArray) {
	GeneralSolver.call(this);
	this.construct(p_sudokuMode, p_numberArray);
}

DummySolver = function() {
	return new SolverSudoku(SUDOKU_MODE.CLASSIC_9x9, generateValueArray(9, 9, null));
}
SolverSudoku.prototype = Object.create(GeneralSolver.prototype);
SolverSudoku.prototype.constructor = SolverSudoku;

SolverSudoku.prototype.construct = function(p_sudokuMode, p_numberArray) {
	this.generalConstruct();
	this.xLength = p_sudokuMode.xTotalLength;
	this.yLength = p_sudokuMode.yTotalLength;
	this.methodsSetDeductions = new ApplyEventMethodPack(
			applyEventClosure(this), 
			deductionsClosure(this),  
			undoEventClosure(this));
	this.gridWall = getSudokuWallGrid(p_sudokuMode);
	this.minNumber = p_sudokuMode.min;
	this.maxNumber = p_sudokuMode.max;
	this.crossingoverGridIndexes = p_sudokuMode.crossingoverGridIndexes;

	this.methodsSetPass = {
		comparisonMethod : comparison, 
		copyMethod : copying, 
		argumentToLabelMethod : namingCategoryPassClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForGridsClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		//skipPassMethod : skipPassClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}
	
	this.answerArray = [];
	this.fixedNumbersArray = [];
	this.fixedNumbersList = [];
	for (var y = 0 ; y < this.yLength ; y++) {
		this.answerArray.push([]);
		this.fixedNumbersArray.push([]);
		for (var x = 0 ; x < this.xLength ; x++) {
			if (this.gridWall.getState(x, y)) {
				this.answerArray[y].push(null);
				this.fixedNumbersArray[y].push(null);
			} else if (p_numberArray[y][x] == null) {
				this.answerArray[y].push(new SpaceNumeric(this.minNumber, this.maxNumber));
				this.fixedNumbersArray[y].push(null);
			} else {
				this.answerArray[y].push(new SpaceNumeric(this.minNumber, this.maxNumber));
				this.fixedNumbersArray[y].push(p_numberArray[y][x]);
				this.fixedNumbersList.push({x : x, y : y});
			} 
		}
	}
	
	// All grids are supposed identical in shape and size, which is why the below parameters (gridLength etc...) aren't bound to grids.
	this.grids = []; 
	this.sudokuBelongingArray = generateFunctionValueArray(this.xLength, this.yLength, function() {return []});
	this.gridLength = getGridLength(p_sudokuMode.gridInfos);
	this.rowBlockNumber = p_sudokuMode.gridInfos.rowBlockNumber;
	this.columnBlockNumber = p_sudokuMode.gridInfos.columnBlockNumber;
	this.rowBlockHeight = p_sudokuMode.gridInfos.rowBlockHeight;
	this.columnBlockWidth = p_sudokuMode.gridInfos.columnBlockWidth;
	for (var i = 0 ; i < p_sudokuMode.startSpaces.length ; i++) {
		ix = p_sudokuMode.startSpaces[i].x;
		iy = p_sudokuMode.startSpaces[i].y;
		for (var y = iy ; y < iy + this.gridLength ; y++) {			
			for (var x = ix; x < ix + this.gridLength ; x++) {
				this.sudokuBelongingArray[y][x].push(i);
			}
		}
	};
	
	// Setup of possibilities (only when all 'NumericSpacesSetAccountant' have had their positions banned, and not before !) 
	for (var i = 0 ; i < p_sudokuMode.startSpaces.length ; i++) {
		ix = p_sudokuMode.startSpaces[i].x;
		iy = p_sudokuMode.startSpaces[i].y;
		this.grids.push({
			xOrigin : ix, yOrigin : iy,
			horizontalSets : [], verticalSets : [], regionalSets : []
		});
		for (var y = iy ; y < iy + this.gridLength ; y++) {	
			this.grids[i].horizontalSets.push(new NumericSpacesSetAccountant(monoArray(this.gridLength, 1), this.minNumber, this.maxNumber, this.gridLength));
		}
		for (var x = ix; x < ix + this.gridLength ; x++) {
			this.grids[i].verticalSets.push(new NumericSpacesSetAccountant(monoArray(this.gridLength, 1), this.minNumber, this.maxNumber, this.gridLength));
		}	
		for (var ry = 0 ; ry < this.rowBlockNumber ; ry++) {
			this.grids[i].regionalSets.push([]);
			for (var rx = 0 ; rx < this.columnBlockNumber ; rx++) {				
				this.grids[i].regionalSets[ry].push(new NumericSpacesSetAccountant(monoArray(this.gridLength, 1), this.minNumber, this.maxNumber, this.gridLength));
			}
		} 
	}
}

//--------------------------------
// Misc. methods

SolverSudoku.prototype.isBlocked = function(p_x, p_y) {
	return this.fixedNumbersArray[p_y][p_x] != null;
}

SolverSudoku.prototype.getFixedNumber = function(p_x, p_y) {
	return this.fixedNumbersArray[p_y][p_x];
}

SolverSudoku.prototype.isBanned = function(p_x, p_y) {
	return this.answerArray[p_y][p_x] == null;
}

SolverSudoku.prototype.getNotFixedNumber = function(p_x, p_y) {
	if (!this.isBanned(p_x, p_y)) { // Note : required test, for drawing !
		return this.answerArray[p_y][p_x].getValue();
	}
	return null;
}

SolverSudoku.prototype.getGridIndexes = function(p_x, p_y) {
	return this.sudokuBelongingArray[p_y][p_x];
}

SolverSudoku.prototype.yBOinG = function(p_yg) { // Block origin in grid
	return Math.floor(p_yg / this.rowBlockHeight) * this.rowBlockHeight;
}

SolverSudoku.prototype.xBOinG = function(p_xg) {
	return Math.floor(p_xg / this.columnBlockWidth) * this.columnBlockWidth;
}

SolverSudoku.prototype.getRegionalSetInGrid = function(p_grid, p_xg, p_yg) {
	return p_grid.regionalSets[Math.floor(p_yg / this.rowBlockHeight)][Math.floor(p_xg / this.columnBlockWidth)];
}

SolverSudoku.prototype.reactInRowRegionColumnGrids = function(p_x, p_y, p_methodInGridRow, p_methodInGridColumn, p_methodInGridRegion) {
	this.sudokuBelongingArray[p_y][p_x].forEach(gridIndex => {
		grid = this.grids[gridIndex];
		xg = p_x - grid.xOrigin;
		yg = p_y - grid.yOrigin;
		p_methodInGridRow(grid, xg, yg);
		p_methodInGridColumn(grid, xg, yg);
		p_methodInGridRegion(grid, xg, yg);
	});
}

//--------------------------------

function monoArray(p_number, p_value) {
	var resultMA = [];
	for (var i = 0 ; i < p_number ; i++) {
		resultMA.push(p_value);
	}
	return resultMA;
}	// Note : this method could be moved outside of the solver

//--------------------------------
// Input methods

SolverSudoku.prototype.emitHypothesis = function(p_x, p_y, p_number) {
	return this.tryToApplyHypothesisSafe(new ChoiceEvent(p_x, p_y, p_number, true));
}

SolverSudoku.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverSudoku.prototype.makeQuickStart = function() {
	this.quickStart();
}

SolverSudoku.prototype.makeMultipass = function() {
	this.multiPassSafe(this.methodsSetMultipass);
}

SolverSudoku.prototype.emitPassSelectedSpaces = function(p_coorsList) {
	const listPassNow = this.generateEventsForSpacesList(p_coorsList);
	return this.passEventsSafe(listPassNow, {family : SUDOKU_PASS_CATEGORY.CUSTOM, numberSpaces : listPassNow.length});
}

SolverSudoku.prototype.emitPassGrids = function(p_gridIndexes) {
	const listPassNow = this.generateEventsForGrids(p_gridIndexes);
	this.passEventsSafe(listPassNow, {family : SUDOKU_PASS_CATEGORY.GRIDS, gridIndexes : p_gridIndexes}); 
}

SolverSudoku.prototype.makeTotalPass = function() {
	var listPassNow = [];
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			if (!this.isBanned(x, y) && this.answerArray[y][x].getValue() == null) { 
				listPassNow.push(this.oneSpaceEventsList(x, y));
			}
		}
	}
	this.passEventsSafe(listPassNow, {family : SUDOKU_PASS_CATEGORY.ALL}); 
}

//--------------------------------
// Doing and undoing

function applyEventClosure(p_solver) {
	return function(p_eventToApply) {
		const choice = p_eventToApply.choice;
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		const number = p_eventToApply.number;
		const resultDo = testNumericSpaceChoice(p_solver.answerArray, x, y, number, choice);
		if (resultDo != EVENT_RESULT.SUCCESS) {
			return resultDo;
		}
		if (choice) {
			p_solver.answerArray[y][x].choose(number);
			p_solver.reactInRowRegionColumnGrids(x, y, 
				function(p_grid, p_xg, p_yg) {p_grid.horizontalSets[p_yg].warnPlaced(number)},
				function(p_grid, p_xg, p_yg) {p_grid.verticalSets[p_xg].warnPlaced(number)},
				function(p_grid, p_xg, p_yg) {solver.getRegionalSetInGrid(p_grid, p_xg, p_yg).warnPlaced(number)}
			);
		} else {
			p_solver.answerArray[y][x].ban(number);
			p_solver.reactInRowRegionColumnGrids(x, y, 
				function(p_grid, p_xg, p_yg) {p_grid.horizontalSets[p_yg].warnBanned(number)},
				function(p_grid, p_xg, p_yg) {p_grid.verticalSets[p_xg].warnBanned(number)},
				function(p_grid, p_xg, p_yg) {solver.getRegionalSetInGrid(p_grid, p_xg, p_yg).warnBanned(number)}
			);
		}
		return EVENT_RESULT.SUCCESS;
	}
}

function undoEventClosure(p_solver) {
	return function(p_eventToUndo) {
		const x = p_eventToUndo.x;
		const y = p_eventToUndo.y;
		const number = p_eventToUndo.number;
		if (p_eventToUndo.choice) {
			p_solver.answerArray[y][x].unchoose(number);
			p_solver.reactInRowRegionColumnGrids(x, y, 
				function(p_grid, p_xg, p_yg) {p_grid.horizontalSets[p_yg].unwarnPlaced(number)},
				function(p_grid, p_xg, p_yg) {p_grid.verticalSets[p_xg].unwarnPlaced(number)},
				function(p_grid, p_xg, p_yg) {solver.getRegionalSetInGrid(p_grid, p_xg, p_yg).unwarnPlaced(number)}
			);
		} else {
			p_solver.answerArray[y][x].unban(number);
			p_solver.reactInRowRegionColumnGrids(x, y, 
				function(p_grid, p_xg, p_yg) {p_grid.horizontalSets[p_yg].unwarnBanned(number)},
				function(p_grid, p_xg, p_yg) {p_grid.verticalSets[p_xg].unwarnBanned(number)},
				function(p_grid, p_xg, p_yg) {solver.getRegionalSetInGrid(p_grid, p_xg, p_yg).unwarnBanned(number)}
			);
		}
	}
}

//--------------------------------
// Deductions

function deductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const number = p_eventBeingApplied.number;
		if (p_eventBeingApplied.choice) {
			// Ban events for all other values in this space
			deductionsExcludeOthersNumeric(p_listEventsToApply, p_solver.answerArray, x, y, number);
			// Ban events for this values in all other non-occupied spaces in this region / row / column
			p_solver.reactInRowRegionColumnGrids(x, y, 
				function(p_grid, p_xg, p_yg) {p_solver.deductionsBanInRow(p_listEventsToApply, p_grid, p_xg, p_yg, number);},
				function(p_grid, p_xg, p_yg) {p_solver.deductionsBanInColumn(p_listEventsToApply, p_grid, p_xg, p_yg, number);},
				function(p_grid, p_xg, p_yg) {p_solver.deductionsBanInRegion(p_listEventsToApply, p_grid, p_xg, p_yg, number)}
			);
		} else {
			deductionsTestOneLeft(p_listEventsToApply, p_solver.answerArray, x, y);
			// Only one possibility left in region / row / column ?
			p_solver.reactInRowRegionColumnGrids(x, y, 
				function(p_grid, p_xg, p_yg) {p_solver.deductionsAlertOneLeftInRow(p_listEventsToApply, p_grid, p_yg, number)},
				function(p_grid, p_xg, p_yg) {p_solver.deductionsAlertOneLeftInColumn(p_listEventsToApply, p_grid, p_xg, number)},
				function(p_grid, p_xg, p_yg) {p_solver.deductionsAlertOneLeftInRegion(p_listEventsToApply, p_grid, p_xg, p_yg, number)}
			);
		}
	}
}

SolverSudoku.prototype.deductionsBanInRow = function(p_listEventsToApply, p_grid, p_xg, p_yg, p_number) {
	const y = p_yg + p_grid.yOrigin;
	const xOut = p_xg + p_grid.xOrigin;
	for (var x = p_grid.xOrigin ; x < p_grid.xOrigin + this.gridLength ; x++) {
		if (x != xOut) {
			p_listEventsToApply.push(new ChoiceEvent(x, y, p_number, false));
		}
	}
}

SolverSudoku.prototype.deductionsBanInColumn = function(p_listEventsToApply, p_grid, p_xg, p_yg, p_number) {
	const x = p_xg + p_grid.xOrigin;
	const yOut = p_yg + p_grid.yOrigin;
	for (var y = p_grid.yOrigin ; y < p_grid.yOrigin + this.gridLength ; y++) {
		if (y != yOut) {
			p_listEventsToApply.push(new ChoiceEvent(x, y, p_number, false));
		}
	}
}

SolverSudoku.prototype.deductionsBanInRegion = function(p_listEventsToApply, p_grid, p_xg, p_yg, p_number) {
	var xgStart = this.xBOinG(p_xg);
	var ygStart = this.yBOinG(p_yg);
	for (var yg = ygStart ; yg < ygStart + this.rowBlockHeight ; yg++) {
		for (var xg = xgStart ; xg < xgStart + this.columnBlockWidth ; xg++) {
			if (xg != p_xg || yg != p_yg) {
				p_listEventsToApply.push(new ChoiceEvent(xg + p_grid.xOrigin, yg + p_grid.yOrigin, p_number, false));
			}
		}
	}
}

SolverSudoku.prototype.deductionsAlertOneLeftInRow = function(p_listEventsToApply, p_grid, p_yg, p_number) {
	const y = p_yg + p_grid.yOrigin;
	const set = p_grid.horizontalSets[p_yg];
	if ((set.getNotBannedYet(p_number) == 0) && (set.getNotPlacedYet(p_number) > 0)) {
		var spaceCount = 0;
		for (var x = p_grid.xOrigin ; x < p_grid.xOrigin + this.gridLength ; x++) {
			if (this.answerArray[y][x].getState(p_number) == SPACE_CHOICE.UNDECIDED) {
				p_listEventsToApply.push(new ChoiceEvent(x, y, p_number, true));
				spaceCount++;			
			}
		}
		if (spaceCount != set.getNotPlacedYet(p_number)) {
			p_listEventsToApply.push(new FailureEvent());
		} 
	}
}

SolverSudoku.prototype.deductionsAlertOneLeftInColumn = function(p_listEventsToApply, p_grid, p_xg, p_number) {
	const x = p_xg + p_grid.xOrigin;
	const set = p_grid.verticalSets[p_xg];
	if ((set.getNotBannedYet(p_number) == 0) && (set.getNotPlacedYet(p_number) > 0)) {
		var spaceCount = 0;
		for (var y = p_grid.yOrigin ; y < p_grid.yOrigin + this.gridLength ; y++) {
			if (this.answerArray[y][x].getState(p_number) == SPACE_CHOICE.UNDECIDED) {
				p_listEventsToApply.push(new ChoiceEvent(x, y, p_number, true));
				spaceCount++;			
			}
		}
		if (spaceCount != set.getNotPlacedYet(p_number)) {
			p_listEventsToApply.push(new FailureEvent());
		} 
	}
}

SolverSudoku.prototype.deductionsAlertOneLeftInRegion = function(p_listEventsToApply, p_grid, p_xg, p_yg, p_number) {
	const set = this.getRegionalSetInGrid(p_grid, p_xg, p_yg);
	if ((set.getNotBannedYet(p_number) == 0) && (set.getNotPlacedYet(p_number) > 0)) {
		var spaceCount = 0;
		const yStart = this.yBOinG(p_yg) + p_grid.yOrigin;
		const xStart = this.xBOinG(p_xg) + p_grid.xOrigin;
		for (var y = yStart ; y < yStart + this.rowBlockHeight ; y++) {
			for (var x = xStart ; x < xStart + this.columnBlockWidth ; x++) {
				if (this.answerArray[y][x].getState(p_number) == SPACE_CHOICE.UNDECIDED) {
					p_listEventsToApply.push(new ChoiceEvent(x, y, p_number, true));
					spaceCount++;
				}
			}			
		}
		if (spaceCount != set.getNotPlacedYet(p_number)) {
			p_listEventsToApply.push(new FailureEvent());
		}
	}
}

//--------------------------------
// Pass !

SolverSudoku.prototype.generateEventsForSpacesList = function(p_coorsList) {
	var listPass = [];
	var x, y;
	p_coorsList.forEach(space => {
		x = space.x;
		y = space.y;
		if (this.getNotFixedNumber(x, y) == null) { 
			listPass.push(this.oneSpaceEventsList(x, y));
		}			 
	});
	return listPass;
}

function generateEventsForGridsClosure(p_solver) {
	return function(p_indexes) {
		return p_solver.generateEventsForGrids(p_indexes.gridIndexes);
	}
}

SolverSudoku.prototype.generateEventsForGrids = function(p_indexes) {
	var listPass = [];
	var grid;
	p_indexes.forEach(index => {
		grid = this.grids[index];
		for (var y = grid.yOrigin ; y < grid.yOrigin + this.gridLength ; y++) {
			for (var x = grid.xOrigin ; x < grid.xOrigin + this.gridLength ; x++) {
				if (this.sudokuBelongingArray[y][x][0] == index) {
					if (this.getNotFixedNumber(x, y) == null) {
						listPass.push(this.oneSpaceEventsList(x, y));
					}
				}
			}
		}
	});
	return listPass;
}

SolverSudoku.prototype.oneSpaceEventsList = function(p_x, p_y) {
	var listEventsChoice = [];
	for (number = this.minNumber ; number <= this.maxNumber ; number++) {
		listEventsChoice.push(new ChoiceEvent(p_x, p_y, number, true));
	}
	return listEventsChoice;
}

function comparison(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.number, p_event1.choice],
	[p_event2.y, p_event2.x, p_event2.number, p_event2.choice]]);
}

function copying(p_event) {
	return p_event.copy();
}

namingCategoryPassClosure = function(p_solver) {
	return function(p_indexPass) {
		const index = p_indexPass.index;
		switch (p_indexPass.family) {
			case SUDOKU_PASS_CATEGORY.CUSTOM : return "Selection " + p_indexPass.numberSpaces + " space" + (p_indexPass.numberSpaces > 1 ? "s" : ""); break;
			case SUDOKU_PASS_CATEGORY.GRIDS : return p_solver.gridIndexesToString(p_indexPass.gridIndexes);
			case SUDOKU_PASS_CATEGORY.ALL : return "Everything";
			default : return "";
		}
	}
}

SolverSudoku.prototype.gridIndexesToString = function(p_gridIndexes) {
	var nameCatPass = "";
	var grid;
	p_gridIndexes.forEach(index => {
		grid = this.grids[index];		
		nameCatPass += "Grid " + index + " (" + grid.xOrigin + " " + grid.yOrigin + ")";
	});
	return nameCatPass;
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var listIndexesPass = [];
		p_solver.crossingoverGridIndexes.forEach(list => {
			listIndexesPass.push({family : SUDOKU_PASS_CATEGORY.GRIDS, gridIndexes : list});
		});
		return listIndexesPass;
	}
}

//--------------------------------
// Quickstart !

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvents = [{quickStartLabel : "Sudoku"}];
		p_solver.fixedNumbersList.forEach(coors => {
			listQSEvents.push(new ChoiceEvent(coors.x, coors.y, p_solver.fixedNumbersArray[coors.y][coors.x], true));
		});
		return listQSEvents;
	}
}

//--------------------------------
// Log grid (uses encoding / decoding in base 64)

SolverSudoku.prototype.logGrid = function() {
	var val;
	for (var y = 0 ; y < this.yLength ; y++) {		
		var string = "";
		for (var x = 0 ; x < this.xLength ; x++) {
			if (this.isBanned(x, y)) {
				string += NOT_ENCODED_VALUE;
			} else if (this.isBlocked(x, y)) {
				string += encode64ToCharacter(this.getFixedNumber(x, y));
			} else {
				val = this.getNotFixedNumber(x, y);
				if (val != null) {							
					string += encode64ToCharacter(this.getNotFixedNumber(x, y));				
				} else {
					string += "-";
				}
			}
		}
		console.log(string);
	}
}