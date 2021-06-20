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

	this.methodsSetPass = {
		comparisonMethod : comparison, 
		copyMethod : copying, 
		argumentToLabelMethod : namingCategoryClosure(this)};
	/*this.methodsSetMultiPass = {
		generatePassEventsMethod : generateEventsForRegionPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		skipPassMethod : skipPassClosure(this)
	};*/

	this.answerArray = [];
	for (var y = 0 ; y < this.yLength ; y++) {
		this.answerArray.push([]);
		for (var x = 0 ; x < this.xLength ; x++) {
			if (this.gridWall.getState(x, y)) {
				this.answerArray[y].push({blocked : true, value : null});
			} else if (p_numberArray[y][x] == null) {
				this.answerArray[y].push(new SpaceNumeric(this.minNumber, this.maxNumber));
				this.answerArray[y][x].blocked = false;
			} else {
				this.answerArray[y].push({blocked : true, value : p_numberArray[y][x]});
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
	
	var npy;
	var setSpaces;
	var freePos, takenNumbers;
	
	// Set of possibilities (must be done after purification !)
	for (var i = 0 ; i < p_sudokuMode.startSpaces.length ; i++) {
		ix = p_sudokuMode.startSpaces[i].x;
		iy = p_sudokuMode.startSpaces[i].y;
		for (var y = iy ; y < iy + this.gridLength ; y++) {			
			freePos = [];
			takenNumbers = [];
			for (var x = ix; x < ix + this.gridLength ; x++) {
				if (!this.answerArray[y][x].blocked) {
					freePos.push(x);
				} else {
					takenNumbers.push(this.answerArray[y][x].value);
				}
			}
			freePos.forEach(x => {
				takenNumbers.forEach(number => {
					this.answerArray[y][x].banIfNecessary(number);
				});
			});
		}
		for (var x = ix ; x < ix + this.gridLength ; x++) {			
			freePos = [];
			takenNumbers = [];
			for (var y = iy ; y < iy + this.gridLength ; y++) {
				if (!this.answerArray[y][x].blocked) {
					freePos.push(y);
				} else {
					takenNumbers.push(this.answerArray[y][x].value);					
				}
			}
			freePos.forEach(y => {
				takenNumbers.forEach(number => {
					this.answerArray[y][x].banIfNecessary(number);
				});
			});
		}		
		for (var ry = 0 ; ry < this.rowBlockNumber ; ry++) {
			for (var rx = 0 ; rx < this.columnBlockNumber ; rx++) {
				freePos = [];
				takenNumbers = [];
				iry = iy + ry * this.rowBlockHeight;
				irx = ix + rx * this.columnBlockWidth;
				for (var y = iry ; y < iry + this.rowBlockHeight ; y++) {
					for (var x = irx ; x < irx + this.columnBlockWidth ; x++) {
						if (!this.answerArray[y][x].blocked) {
							freePos.push({x : x, y : y});
						} else {
							takenNumbers.push(this.answerArray[y][x].value);					
						}
					}
				}
				freePos.forEach(coors => {
					takenNumbers.forEach(number => {
						this.answerArray[coors.y][coors.x].banIfNecessary(number);
					});
				});				
			}
		} 
	}
	
	// Setup of possibilities (only when all 'SpaceSetNumeric' have had their positions banned, and not before !) 
	for (var i = 0 ; i < p_sudokuMode.startSpaces.length ; i++) {
		ix = p_sudokuMode.startSpaces[i].x;
		iy = p_sudokuMode.startSpaces[i].y;
		this.grids.push({
			xOrigin : ix, yOrigin : iy,
			horizontalSets : [], verticalSets : [], regionalSets : []
		});
		for (var y = iy ; y < iy + this.gridLength ; y++) {	
			setSpaces = [];
			notPlacedYet = monoArray(this.gridLength, 1);
			for (var x = ix; x < ix + this.gridLength ; x++) {
				if (!this.answerArray[y][x].blocked) {
					setSpaces.push(this.answerArray[y][x]);
				} else {
					notPlacedYet[this.answerArray[y][x].value - this.minNumber]--; // In practice it's equal to 0 now
				}
			}
			this.grids[i].horizontalSets.push(new SpaceSetNumeric(setSpaces, notPlacedYet, this.minNumber, this.maxNumber));
		}
		for (var x = ix; x < ix + this.gridLength ; x++) {
			setSpaces = [];
			notPlacedYet = monoArray(this.gridLength, 1);
			for (var y = iy ; y < iy + this.gridLength ; y++) {			
				if (!this.answerArray[y][x].blocked) {
					setSpaces.push(this.answerArray[y][x]);
				} else {
					notPlacedYet[this.answerArray[y][x].value - this.minNumber]--;
				}
			}
			this.grids[i].verticalSets.push(new SpaceSetNumeric(setSpaces, notPlacedYet, this.minNumber, this.maxNumber));
		}	
		for (var ry = 0 ; ry < this.rowBlockNumber ; ry++) {
			this.grids[i].regionalSets.push([]);
			for (var rx = 0 ; rx < this.columnBlockNumber ; rx++) {
				notPlacedYet = monoArray(this.gridLength, 1);
				setSpaces = [];
				iry = iy + ry * this.rowBlockHeight;
				irx = ix + rx * this.columnBlockWidth;
				for (var y = iry ; y < iry + this.rowBlockHeight ; y++) {
					for (var x = irx ; x < irx + this.columnBlockWidth ; x++) {
						if (!this.answerArray[y][x].blocked) {
							setSpaces.push(this.answerArray[y][x]);
						} else {
							notPlacedYet[this.answerArray[y][x].value - this.minNumber]--;
						}
					}
				}	
				this.grids[i].regionalSets[ry].push(new SpaceSetNumeric(setSpaces, notPlacedYet, this.minNumber, this.maxNumber));
			}
		} 
	}
}

//--------------------------------
// Misc. methods

SolverSudoku.prototype.isBlocked = function(p_x, p_y) {
	return this.answerArray[p_y][p_x].blocked;
}

SolverSudoku.prototype.isVoid = function(p_x, p_y) {
	return this.answerArray[p_y][p_x].blocked && this.answerArray[p_y][p_x].value == null;
}

SolverSudoku.prototype.getFixedNumber = function(p_x, p_y) {
	if (this.answerArray[p_y][p_x].blocked) {
		return this.answerArray[p_y][p_x].value;
	}
	return null;
}

SolverSudoku.prototype.getNotFixedNumber = function(p_x, p_y) {
	if (!this.answerArray[p_y][p_x].blocked) {
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

//---

function monoArray(p_number, p_value) {
	var answer = [];
	for (var i = 0 ; i < p_number ; i++) {
		answer.push(p_value);
	}
	return answer;
}	// Note : this method could be moved outside of the solver

//--------------------------------
// Input methods

SolverSudoku.prototype.emitHypothesis = function(p_x, p_y, p_number) {
	return this.tryToApplyHypothesis(
		new SpaceAllowEvent(p_x, p_y, p_number, true),
		this.methodsSetDeductions
	)
}

SolverSudoku.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverSudoku.prototype.quickStart = function() {
	this.initiateQuickStart();
	this.performActualQuickStart();
	this.terminateQuickStart();
}

SolverSudoku.prototype.emitPassSelectedSpaces = function(p_coorsList) {
	const eventsForPass = this.generateEventsForSpacesList(p_coorsList);
	return this.passEvents(eventsForPass, this.methodsSetDeductions, this.methodsSetPass, {family : SUDOKU_PASS_CATEGORY.CUSTOM, numberSpaces : eventsForPass.length});
}

SolverSudoku.prototype.emitPassGrids = function(p_gridIndexes) {
	const generatedEvents = this.generateEventsForGrids(p_gridIndexes);
	this.passEvents(generatedEvents, this.methodsSetDeductions, this.methodsSetPass, {family : SUDOKU_PASS_CATEGORY.GRIDS, gridIndexes : p_gridIndexes}); 
}

SolverSudoku.prototype.makeTotalPass = function() {
	var generatedEvents = [];
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			if (!this.answerArray[y][x].blocked && this.getNotFixedNumber(x, y) == null) { 
				generatedEvents.push(this.oneSpaceEventsList(x, y));
			}
		}
	}
	this.passEvents(generatedEvents, this.methodsSetDeductions, this.methodsSetPass, {family : SUDOKU_PASS_CATEGORY.ALL}); 
}

//--------------------------------
// Doing and undoing

function applyEventClosure(p_solver) {
	return function(p_eventToApply) {
		const choice = p_eventToApply.choice;
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		const number = p_eventToApply.number;
		const fixedVal = p_solver.getFixedNumber(x, y);
		if (fixedVal) {
			if ((number == fixedVal) == choice) {
				return EVENT_RESULT.HARMLESS;
			}	else {
				return EVENT_RESULT.FAILURE;
			}
		}
		if (number > p_solver.answerArray[y][x].getMax()) {
			return choice ? EVENT_RESULT.FAILURE : EVENT_RESULT.HARMLESS;
		}
		const currentNumber = p_solver.getNotFixedNumber(x, y); 
		if (choice && (currentNumber != null) && (number != currentNumber)) {
			return EVENT_RESULT.FAILURE;
		}
		const currentState = (p_solver.answerArray[y][x].getState(number));
		if (currentState == SPACE_CHOICE.YES) {
			return choice ? EVENT_RESULT.HARMLESS : EVENT_RESULT.FAILURE;
		} else if (currentState == SPACE_CHOICE.NO) {
			return choice ? EVENT_RESULT.FAILURE : EVENT_RESULT.HARMLESS;
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
	return function(p_eventList, p_eventToApply) {
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		const number = p_eventToApply.number;
		if (p_eventToApply.choice) {

			// Ban events for all other values in this space
			for (var i = p_solver.minNumber ; i <= p_solver.maxNumber ; i++) {
				if (i != number) {
					p_eventList.push(new SpaceAllowEvent(x, y, i, false));
				};
			}
			// Ban events for this values in all other non-occupied spaces in this region / row / column
			p_solver.reactInRowRegionColumnGrids(x, y, 
				function(p_grid, p_xg, p_yg) {p_eventList = p_solver.banInRow(p_eventList, p_grid, p_xg, p_yg, number);},
				function(p_grid, p_xg, p_yg) {p_eventList = p_solver.banInColumn(p_eventList, p_grid, p_xg, p_yg, number);},
				function(p_grid, p_xg, p_yg) {p_eventList = p_solver.banInRegion(p_eventList, p_grid, p_xg, p_yg, number)}
			);
		} else {
			const last = p_solver.answerArray[y][x].getOneLeft();
			// Only one possibility left in this space
			if (last) {
				p_eventList.push(new SpaceAllowEvent(x, y, last, true));
			}
			// Only one possibility left in region / row / column ?
			p_solver.reactInRowRegionColumnGrids(x, y, 
				function(p_grid, p_xg, p_yg) { p_eventList = p_solver.alertOneLeftInRow(p_eventList, p_grid, p_yg, number)},
				function(p_grid, p_xg, p_yg) { p_eventList = p_solver.alertOneLeftInColumn(p_eventList, p_grid, p_xg, number)},
				function(p_grid, p_xg, p_yg) { p_eventList = p_solver.alertOneLeftInRegion(p_eventList, p_grid, p_xg, p_yg, number)}
			);
		}
		return p_eventList;
	}
}

SolverSudoku.prototype.banInRow = function(p_eventList, p_grid, p_xg, p_yg, p_number) {
	const y = p_yg + p_grid.yOrigin;
	const xOut = p_xg + p_grid.xOrigin;
	for (var x = p_grid.xOrigin ; x < p_grid.xOrigin + this.gridLength ; x++) {
		if (x != xOut) {
			p_eventList.push(new SpaceAllowEvent(x, y, p_number, false));
		}
	}
	return p_eventList;
}

SolverSudoku.prototype.banInColumn = function(p_eventList, p_grid, p_xg, p_yg, p_number) {
	const x = p_xg + p_grid.xOrigin;
	const yOut = p_yg + p_grid.yOrigin;
	for (var y = p_grid.yOrigin ; y < p_grid.yOrigin + this.gridLength ; y++) {
		if (y != yOut) {
			p_eventList.push(new SpaceAllowEvent(x, y, p_number, false));
		}
	}
	return p_eventList;
}

SolverSudoku.prototype.banInRegion = function(p_eventList, p_grid, p_xg, p_yg, p_number) {
	var xgStart = this.xBOinG(p_xg);
	var ygStart = this.yBOinG(p_yg);
	for (var yg = ygStart ; yg < ygStart + this.rowBlockHeight ; yg++) {
		for (var xg = xgStart ; xg < xgStart + this.columnBlockWidth ; xg++) {
			if (xg != p_xg || yg != p_yg) {
				p_eventList.push(new SpaceAllowEvent(xg + p_grid.xOrigin, yg + p_grid.yOrigin, p_number, false));
			}
		}
	}
	return p_eventList;
}

SolverSudoku.prototype.alertOneLeftInRow = function(p_eventList, p_grid, p_yg, p_number) {
	const y = p_yg + p_grid.yOrigin;
	const set = p_grid.horizontalSets[p_yg];
	if ((set.getNotBannedYet(p_number) == 0) && (set.getNotPlacedYet(p_number) > 0)) {
		var spaceCount = 0;
		for (var x = p_grid.xOrigin ; x < p_grid.xOrigin + this.gridLength ; x++) {
			if (!this.getFixedNumber(x, y) && this.answerArray[y][x].getState(p_number) == SPACE_CHOICE.UNDECIDED) {
				p_eventList.push(new SpaceAllowEvent(x, y, p_number, true));
				spaceCount++;			
			}
		}
		if (spaceCount != set.getNotPlacedYet(p_number)) {
			p_eventList.push(new FailureEvent());
		} 
	}
	return p_eventList;
}

SolverSudoku.prototype.alertOneLeftInColumn = function(p_eventList, p_grid, p_xg, p_number) {
	const x = p_xg + p_grid.xOrigin;
	const set = p_grid.verticalSets[p_xg];
	if ((set.getNotBannedYet(p_number) == 0) && (set.getNotPlacedYet(p_number) > 0)) {
		var spaceCount = 0;
		for (var y = p_grid.yOrigin ; y < p_grid.yOrigin + this.gridLength ; y++) {
			if (!this.getFixedNumber(x, y) && this.answerArray[y][x].getState(p_number) == SPACE_CHOICE.UNDECIDED) {
				p_eventList.push(new SpaceAllowEvent(x, y, p_number, true));
				spaceCount++;			
			}
		}
		if (spaceCount != set.getNotPlacedYet(p_number)) {
			p_eventList.push(new FailureEvent());
		} 
	}
	return p_eventList;
}

SolverSudoku.prototype.alertOneLeftInRegion = function(p_eventList, p_grid, p_xg, p_yg, p_number) {
	const set = this.getRegionalSetInGrid(p_grid, p_xg, p_yg);
	if ((set.getNotBannedYet(p_number) == 0) && (set.getNotPlacedYet(p_number) > 0)) {
		var spaceCount = 0;
		const yStart = this.yBOinG(p_yg) + p_grid.yOrigin;
		const xStart = this.xBOinG(p_xg) + p_grid.xOrigin;
		for (var y = yStart ; y < yStart + this.rowBlockHeight ; y++) {
			for (var x = xStart ; x < xStart + this.columnBlockWidth ; x++) {
				if (!this.getFixedNumber(x, y) && this.answerArray[y][x].getState(p_number) == SPACE_CHOICE.UNDECIDED) {
					p_eventList.push(new SpaceAllowEvent(x, y, p_number, true));
					spaceCount++;
				}
			}			
		}
		if (spaceCount != set.getNotPlacedYet(p_number)) {
			p_eventList.push(new FailureEvent());
		}
	}
	return p_eventList;
}

//--------------------------------
// Pass !

SolverSudoku.prototype.generateEventsForSpacesList = function(p_coorsList) {
	var answer = [];
	var x, y;
	p_coorsList.forEach(space => {
		x = space.x;
		y = space.y;
		if (!this.answerArray[y][x].blocked && this.getNotFixedNumber(x, y) == null) { 
			answer.push(this.oneSpaceEventsList(x, y));
		}			 
	});
	return answer;
}

SolverSudoku.prototype.generateEventsForGrids = function(p_indexes) {
	var answer = [];
	var grid;
	p_indexes.forEach(index => {
		grid = this.grids[index];
		for (var y = grid.yOrigin ; y < grid.yOrigin + this.gridLength ; y++) {
			for (var x = grid.xOrigin ; x < grid.xOrigin + this.gridLength ; x++) {
				if (this.sudokuBelongingArray[y][x][0] == index) {
					if (!this.answerArray[y][x].blocked && this.getNotFixedNumber(x, y) == null) {
						answer.push(this.oneSpaceEventsList(x, y));
					}
				}
			}
		}
	});
	return answer;
}

SolverSudoku.prototype.oneSpaceEventsList = function(p_x, p_y) {
	var eventsSpace = [];
	for (number = this.minNumber ; number <= this.maxNumber ; number++) {
		eventsSpace.push(new SpaceAllowEvent(p_x, p_y, number, true));
	}
	return eventsSpace;
}

function comparison(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.number, p_event1.choice],
	[p_event2.y, p_event2.x, p_event2.number, p_event2.choice]]);
}

function copying(p_event) {
	return p_event.copy();
}

namingCategoryClosure = function(p_solver) {
	return function(p_indexAndFamily) {
		const index = p_indexAndFamily.index;
		switch (p_indexAndFamily.family) {
			case SUDOKU_PASS_CATEGORY.CUSTOM : return "Selection " + p_indexAndFamily.numberSpaces + " space" + (p_indexAndFamily.numberSpaces > 1 ? "s" : ""); break;
			case SUDOKU_PASS_CATEGORY.GRIDS : return p_solver.gridIndexesToString(p_indexAndFamily.gridIndexes);
			case SUDOKU_PASS_CATEGORY.ALL : return "Everything";
			default : return "";
		}
	}
}

SolverSudoku.prototype.gridIndexesToString = function(p_gridIndexes) {
	var answer = "";
	var grid;
	p_gridIndexes.forEach(index => {
		grid = this.grids[index];		
		answer += "Grid " + index + " (" + grid.xOrigin + " " + grid.yOrigin + ")";
	});
	return answer;
}

//--------------------------------
// Quickstart

SolverSudoku.prototype.performActualQuickStart = function () {
	var justOne;
	var listSpaceEvents;
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			// One number possible in a space
			if (!this.isBlocked(x, y) && !this.answerArray[y][x].fixedValue) {
				justOne = this.answerArray[y][x].getOneLeft();
				if (justOne) {
					this.emitHypothesis(x, y, justOne, true);
				}
			}
		}
	}
	
	this.grids.forEach(grid => {
		listSpaceEvents = [];
		for (var number = this.minNumber ; number < this.maxNumber ; number++) {
			for (var yg = 0 ; yg < this.gridLength ; yg++) {
				listSpaceEvents = this.alertOneLeftInRow(listSpaceEvents, grid, yg, number);
			}
			for (var xg = 0 ; xg < this.gridLength ; xg++) {
				listSpaceEvents = this.alertOneLeftInColumn(listSpaceEvents, grid, xg, number);
			}
			for (var yr = 0 ; yr < this.gridLength ; yr += this.rowBlockHeight) {
				for (var xr = 0 ; xr < this.gridLength ; xr += this.columnBlockWidth) {
					listSpaceEvents = this.alertOneLeftInRegion(listSpaceEvents, grid, xr, yr, number);
				}
			}
		} 
		
		listSpaceEvents.forEach(event_ => {	
			this.tryToApplyHypothesis(event_, this.methodsSetDeductions);
		});
	});
}

//--------------------------------
// Log grid (uses encoding / decoding in base 64)

SolverSudoku.prototype.logGrid = function() {
	var val;
	for (var y = 0 ; y < this.yLength ; y++) {		
		var string = "";
		for (var x = 0 ; x < this.xLength ; x++) {
			if (this.isVoid(x, y)) {
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