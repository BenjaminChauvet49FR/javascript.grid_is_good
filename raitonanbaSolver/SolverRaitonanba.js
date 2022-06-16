// ---------------------
// Setup

function SolverRaitonanba(p_symbolArray) {
	GeneralSolver.call(this);
	this.construct(p_symbolArray);
}

SolverRaitonanba.prototype = Object.create(GeneralSolver.prototype);
SolverRaitonanba.prototype.constructor = SolverRaitonanba;

function DummySolver() {
	return new SolverRaitonanba(generateSymbolArray(1, 1));
}

SolverRaitonanba.prototype.construct = function(p_symbolArray) { 
	this.generalConstruct();
	this.xyLength = p_symbolArray[0].length;
	this.xLength = this.xyLength;
	this.yLength = this.xyLength;
	this.methodsSetDeductions = new ApplyEventMethodPack(
			applyEventClosure(this), 
			deductionsClosure(this),  
			undoEventClosure(this));
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterRowsColumnsClosure(this)]);
	this.methodsSetPass = {
		comparisonMethod : comparing, 
		copyMethod : copying, 
		argumentToLabelMethod : namingCategoryPassClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForRowColumnPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		// skipPassMethod : skipPassClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}
	this.answerArray = generateValueArray(this.xLength, this.yLength, null);
	this.numericArray = generateValueArray(this.xLength, this.yLength, null); 
	
	this.numericSpacesList = [];
	this.xNumericPerRows = [];
	this.yNumericPerColumns = [];
	var i, x, y;
	for (i = 0 ; i < this.xyLength ; i++) {
		this.xNumericPerRows.push([]);
		this.yNumericPerColumns.push([]); 
	}
	for(var y = 0 ; y < this.xyLength ; y++) {
		for(var x = 0 ; x < this.xyLength ; x++) {
			this.answerArray[y][x] = new SpaceNumeric(0, 2);
			if (p_symbolArray[y][x] != null) {
				this.numericArray[y][x] = {number : p_symbolArray[y][x], lights : [LIGHT.UNDECIDED, LIGHT.UNDECIDED]}; // High convention : Orientations 01 assumption
				this.numericSpacesList.push({x : x, y : y});
				this.xNumericPerRows[y].push(x);
				this.yNumericPerColumns[x].push(y);
			} else {
				this.numericArray[y][x] = {number : null}
			}
		}
	}
	
	this.possibilitiesColumns = [];
	this.possibilitiesRows = [];
	this.xLightInRow = [];
	this.xBlockInRow = [];
	this.yLightInColumn = [];
	this.yBlockInColumn = [];
	for(i = 0 ; i < this.xyLength ; i++) {
		this.possibilitiesColumns.push(new NumericSpacesSetAccountant([this.xyLength-2, 1, 1], 0, 2, this.xyLength));
		this.possibilitiesRows.push(new NumericSpacesSetAccountant([this.xyLength-2, 1, 1], 0, 2, this.xyLength));
		this.xLightInRow.push(null);
		this.xBlockInRow.push(null);
		this.yLightInColumn.push(null);
		this.yBlockInColumn.push(null);
	}
	
	this.checkerColumns = new CheckCollection(this.xyLength);
	this.checkerRows = new CheckCollection(this.xyLength);
}

//----------------------
// Misc methods (may be used for drawing and intelligence)

SolverRaitonanba.prototype.getAnswer = function(p_x, p_y) {return this.answerArray[p_y][p_x].getValue();}
SolverRaitonanba.prototype.getNumber = function(p_x, p_y) {return this.numericArray[p_y][p_x].number;}
SolverRaitonanba.prototype.getHorizontalLightSpan = function(p_y) {
	const xL = this.xLightInRow[p_y];
	const xB = this.xBlockInRow[p_y];
	if (xL != null && xB != null) {
		if (xB > xL) {
			return {xMin : 0, xMax : xB-1}
		} else {
			return {xMin : xB+1, xMax : this.xyLength-1}
		}
	} else {
		return null;
	}
}
SolverRaitonanba.prototype.getVerticalLightSpan = function(p_x) {
	const yL = this.yLightInColumn[p_x];
	const yB = this.yBlockInColumn[p_x];
	if (yL != null && yB != null) {
		if (yB > yL) {
			return {yMin : 0, yMax : yB-1}
		} else {
			return {yMin : yB+1, yMax : this.xyLength-1}
		}
	} else {
		return null;
	}
}

SolverRaitonanba.prototype.getLightsHorizontal = function(p_x, p_y) {
	return this.numericArray[p_y][p_x].lights[ORIENTATION.HORIZONTAL];
}

SolverRaitonanba.prototype.getLightsVertical = function(p_x, p_y) {
	return this.numericArray[p_y][p_x].lights[ORIENTATION.VERTICAL];
} 

//------------------
// Input methods 

SolverRaitonanba.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	this.tryToApplyHypothesisSafe(new ChoiceEvent(p_x, p_y, p_symbol, true));
}

SolverRaitonanba.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverRaitonanba.prototype.emitPassRowColumn = function(p_x, p_y) {
	const listPassNow = this.generateEventsForRowColumnPass(p_x, p_y);
	this.passEventsSafe(listPassNow, {x : p_x, y : p_y}); 
}

SolverRaitonanba.prototype.makeTotalPass = function() {
	const listPassNow = this.generateTotalPassEventsMethod();
	return this.passEventsSafe(listPassNow, new PassCategoryTotal(listPassNow.length));
}

SolverRaitonanba.prototype.makeMultiPass = function() {	
	this.multiPassSafe(this.methodsSetMultipass);
}
 
SolverRaitonanba.prototype.makeQuickStart = function() { 
	this.quickStart();
}

SolverRaitonanba.prototype.makeResolution = function() { 
	this.resolve();
}

//------------------
// Doing and undoing

applyEventClosure = function(p_solver) {
	return function(p_eventToApply) {
		if (p_eventToApply.kind == CHOICE_EVENT_KIND) {
			const choice = p_eventToApply.choice;
			const x = p_eventToApply.x;
			const y = p_eventToApply.y;
			const number = p_eventToApply.getSymbol();
			const resultDo = testNumericSpaceChoice(p_solver.answerArray, x, y, number, choice); 
			if (resultDo != EVENT_RESULT.SUCCESS) {
				return resultDo;
			}
			if (choice) {
				if (number == RAITONANBA.BLOCK) {
					if (p_solver.xBlockInRow[y] != null || p_solver.yBlockInColumn[x] != null) {
						return EVENT_RESULT.FAILURE;
					}
					p_solver.xBlockInRow[y] = x;
					p_solver.yBlockInColumn[x] = y;
				}
				if (number == RAITONANBA.LIGHT) {
					if (p_solver.xLightInRow[y] != null || p_solver.yLightInColumn[x] != null) {
						return EVENT_RESULT.FAILURE;
					}
					p_solver.xLightInRow[y] = x;
					p_solver.yLightInColumn[x] = y;
				}
				p_solver.answerArray[y][x].choose(number);
				p_solver.possibilitiesColumns[x].warnPlaced(number);
				p_solver.possibilitiesRows[y].warnPlaced(number);
				p_solver.checkerColumns.add(x);
				p_solver.checkerRows.add(y);
			} else {
				p_solver.answerArray[y][x].ban(number);
				p_solver.possibilitiesColumns[x].warnBanned(number);
				p_solver.possibilitiesRows[y].warnBanned(number);
			}
			return EVENT_RESULT.SUCCESS;	
		} else {
			// Offensive : x and y must be coors of a numeric space
			const x = p_eventToApply.x;
			const y = p_eventToApply.y;
			const orientation = p_eventToApply.orientation;
			const light = p_eventToApply.light;
			if (p_solver.numericArray[y][x].lights[orientation] != LIGHT.UNDECIDED) { 
				return (p_solver.numericArray[y][x].lights[orientation] == light ? EVENT_RESULT.HARMLESS : EVENT_RESULT.FAILURE);
			}
			p_solver.numericArray[y][x].lights[orientation] = light;
			p_solver.checkerColumns.add(x);
			p_solver.checkerRows.add(y);
			return EVENT_RESULT.SUCCESS;
		}
	}
}

/**
When you want to remove a symbol from a space !
*/
undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		if (p_eventToUndo.kind == CHOICE_EVENT_KIND) {
			const symbol = p_eventToUndo.getSymbol();
			const x = p_eventToUndo.x;
			const y = p_eventToUndo.y;
			if (p_eventToUndo.choice) {
				p_solver.answerArray[y][x].unchoose(symbol);
				p_solver.possibilitiesColumns[x].unwarnPlaced(symbol);
				p_solver.possibilitiesRows[y].unwarnPlaced(symbol);
				if (symbol == RAITONANBA.BLOCK) {
					p_solver.xBlockInRow[y] = null;
					p_solver.yBlockInColumn[x] = null;
				}
				if (symbol == RAITONANBA.LIGHT) {
					p_solver.xLightInRow[y] = null;
					p_solver.yLightInColumn[x] = null;
				}
			} else {
				p_solver.answerArray[y][x].unban(symbol);
				p_solver.possibilitiesColumns[x].unwarnBanned(symbol);
				p_solver.possibilitiesRows[y].unwarnBanned(symbol);
			}			
		} else {
			p_solver.numericArray[p_eventToUndo.y][p_eventToUndo.x].lights[p_eventToUndo.orientation] = LIGHT.UNDECIDED;
		}
	}
}

//--------------------------------
// Intelligence

closureSpace = function(p_solver) { return function(p_x, p_y) {return p_solver.answerArray[p_y][p_x]}}
closureEvent = function(p_state) { return function(p_x, p_y) {return new SpaceEvent(p_x, p_y, p_state)}}

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind == CHOICE_EVENT_KIND) {			
			x = p_eventBeingApplied.x;
			y = p_eventBeingApplied.y;
			symbol = p_eventBeingApplied.getSymbol();
			if (p_eventBeingApplied.choice) {
				deductionsExcludeOthersNumeric(p_listEventsToApply, p_solver.answerArray, x, y, symbol);
				deductionsAlertAllPlacedInColumn(p_listEventsToApply, p_solver.possibilitiesColumns[x], symbol, x, p_solver.answerArray);
				deductionsAlertAllPlacedInRow(p_listEventsToApply, p_solver.possibilitiesRows[y], symbol, y, p_solver.answerArray);
			} else {
				deductionsTestOneLeft(p_listEventsToApply, p_solver.answerArray, x, y);
				deductionsAlertAllBannedInColumn(p_listEventsToApply, p_solver.possibilitiesColumns[x], symbol, x, p_solver.answerArray);
				deductionsAlertAllBannedInRow(p_listEventsToApply, p_solver.possibilitiesRows[y], symbol, y, p_solver.answerArray);
			}
		} else {
			x = p_eventBeingApplied.x;
			y = p_eventBeingApplied.y;
			if (p_solver.numericArray[y][x].number == 1) {
				p_listEventsToApply.push(new LightOrientationEvent(x, y, OrthogonalOrientationDirection[p_eventBeingApplied.orientation], 
					p_eventBeingApplied.light == LIGHT.NO ? LIGHT.YES : LIGHT.NO));
			}
		}
	}
}

// Filters
abortClosure = function(p_solver) {
	return function() {
		p_solver.cleanLines();
	}
}

SolverRaitonanba.prototype.cleanLines = function() {
	this.checkerColumns.clean();
	this.checkerRows.clean();	
}

filterRowsColumnsClosure = function(p_solver) {
	return function() {
		var listEventsToApply = [];
		var x, y, iix, iiy;
		for (iix = 0 ; iix < p_solver.checkerColumns.list.length ; iix++) {
			x = p_solver.checkerColumns.list[iix];
			for (iiy = 0 ; iiy < p_solver.yNumericPerColumns[x].length ; iiy++) {
				y = p_solver.yNumericPerColumns[x][iiy];
				p_solver.deductionsCheckColumn(listEventsToApply, x, y);
			}
		}
		for (iiy = 0 ; iiy < p_solver.checkerRows.list.length ; iiy++) {
			y = p_solver.checkerRows.list[iiy];
			for (iix = 0 ; iix < p_solver.xNumericPerRows[y].length ; iix++) {
				x = p_solver.xNumericPerRows[y][iix];
				p_solver.deductionsCheckRow(listEventsToApply, x, y);
			}
		}
		p_solver.cleanLines();
		return listEventsToApply;
	}
}

// p_x, p_y = coordinates of a numeric space
SolverRaitonanba.prototype.deductionsCheckColumn = function(p_listEventsToApply, p_x, p_y) {
	const yB = this.yBlockInColumn[p_x];
	const yL = this.yLightInColumn[p_x];
	const lighted = this.numericArray[p_y][p_x].lights[ORIENTATION.VERTICAL];
	var light;
	// Note : very sub-optimized. Solving is correct, but mistakes will be noticed only onto events.
	if (yL != null) {
		if (yB != null) { // Light and block placed. Determine light on digit.
			if (yL > yB) {
				if (yB > p_y) {
					light = LIGHT.NO;
				} else {
					light = LIGHT.YES;
				}
			} else {
				if (p_y > yB) {
					light = LIGHT.NO;
				} else {
					light = LIGHT.YES;
				}
			}
			p_listEventsToApply.push(new LightOrientationEvent(p_x, p_y, ORIENTATION.VERTICAL, light));
		} 
		if (lighted == LIGHT.YES) {
			// Light placed, space lighted vertically. Ban blocks where it is not. 
			if (yL > p_y) { // --y---L---
				deductionsBanPartOfColumn(p_listEventsToApply, p_x, p_y+1, yL-1, RAITONANBA.BLOCK);
			} else { // --L---y---
				deductionsBanPartOfColumn(p_listEventsToApply, p_x, yL+1, p_y-1, RAITONANBA.BLOCK);
			}
		}
		if (lighted == LIGHT.NO) {
			if (yL > p_y) { // --y---L---
				deductionsBanPartOfColumn(p_listEventsToApply, p_x, 0, p_y-1, RAITONANBA.BLOCK);
				deductionsBanPartOfColumn(p_listEventsToApply, p_x, yL+1, this.xyLength-1, RAITONANBA.BLOCK);
			} else { // --L---y---
				deductionsBanPartOfColumn(p_listEventsToApply, p_x, 0, yL-1, RAITONANBA.BLOCK);
				deductionsBanPartOfColumn(p_listEventsToApply, p_x, p_y+1, this.xyLength-1, RAITONANBA.BLOCK);
			}
		}
	}
	if (yB != null) {
		// Block placed. 
		if (lighted == LIGHT.YES) {
			if (yB > p_y) { // --y---B---
				deductionsBanPartOfColumn(p_listEventsToApply, p_x, yB+1, this.xyLength-1, RAITONANBA.LIGHT);
			} else { // --B---y---
				deductionsBanPartOfColumn(p_listEventsToApply, p_x, 0, yB-1, RAITONANBA.LIGHT);
			}
		}
		if (lighted == LIGHT.NO) {
			if (yB > p_y) { // --y---B---
				deductionsBanPartOfColumn(p_listEventsToApply, p_x, 0, yB-1, RAITONANBA.LIGHT);
			} else { // --B---y---
				deductionsBanPartOfColumn(p_listEventsToApply, p_x, yB+1, this.xyLength-1, RAITONANBA.LIGHT);
			}
		}
	}

	// Where block is banned, starting from a numeric space
	var y = p_y-1;				
	while (y >= 0 && this.answerArray[y][p_x].getState(RAITONANBA.BLOCK) == SPACE_CHOICE.NO) {
		y--;
	}
	if (y >= 0) {
		this.deductionsFirstUnblockedSpaceFromNumber(p_listEventsToApply, lighted, p_x, p_y, p_x, y, ORIENTATION.VERTICAL);
	}
	y = p_y+1;
	while (y < this.xyLength && this.answerArray[y][p_x].getState(RAITONANBA.BLOCK) == SPACE_CHOICE.NO) {
		y++;
	}
	if (y < this.xyLength) {
		this.deductionsFirstUnblockedSpaceFromNumber(p_listEventsToApply, lighted, p_x, p_y, p_x, y, ORIENTATION.VERTICAL);
	}	
}

deductionsBanPartOfColumn = function(p_listEventsToApply, p_x, p_yMin, p_yMax, p_symbolToBan) {
	for (var y = p_yMin ; y <= p_yMax ; y++) {
		p_listEventsToApply.push(new ChoiceEvent(p_x, y, p_symbolToBan, false));
	}
}

SolverRaitonanba.prototype.deductionsCheckRow = function(p_listEventsToApply, p_x, p_y) {
	const xB = this.xBlockInRow[p_y];
	const xL = this.xLightInRow[p_y];
	const lighted = this.numericArray[p_y][p_x].lights[ORIENTATION.HORIZONTAL];
	var light;
	if (xL != null) {
		if (xB != null) { // Light and block placed. Determine light on digit.
			if (xL > xB) {
				if (xB > p_x) {
					light = LIGHT.NO;
				} else {
					light = LIGHT.YES;
				}
			} else {
				if (p_x > xB) {
					light = LIGHT.NO;
				} else {
					light = LIGHT.YES;
				}
			}
			p_listEventsToApply.push(new LightOrientationEvent(p_x, p_y, ORIENTATION.HORIZONTAL, light));
		} 
		if (lighted == LIGHT.YES) {
			// Light placed, space lighted vertically. Ban blocks where it is not. 
			if (xL > p_x) { // --x---L---
				deductionsBanPartOfRow(p_listEventsToApply, p_x+1, xL-1, p_y, RAITONANBA.BLOCK);
			} else { // --L---x---
				deductionsBanPartOfRow(p_listEventsToApply, xL+1, p_x-1, p_y, RAITONANBA.BLOCK);
			}
		}
		if (lighted == LIGHT.NO) {
			if (xL > p_x) { // --x---L---
				deductionsBanPartOfRow(p_listEventsToApply, 0, p_x-1, p_y, RAITONANBA.BLOCK);
				deductionsBanPartOfRow(p_listEventsToApply, xL+1, this.xyLength-1, p_y, RAITONANBA.BLOCK);
			} else { // --L---x---
				deductionsBanPartOfRow(p_listEventsToApply, 0, xL-1, p_y, RAITONANBA.BLOCK);
				deductionsBanPartOfRow(p_listEventsToApply, p_x+1, this.xyLength-1, p_y, RAITONANBA.BLOCK);
			}
		}
	}
	if (xB != null) {
		// Block placed. 
		if (lighted == LIGHT.YES) {
			if (xB > p_x) { // --x---B---
				deductionsBanPartOfRow(p_listEventsToApply, xB+1, this.xyLength-1, p_y, RAITONANBA.LIGHT);
			} else { // --B---x---
				deductionsBanPartOfRow(p_listEventsToApply, 0, xB-1, p_y, RAITONANBA.LIGHT);
			}
		}
		if (lighted == LIGHT.NO) {
			if (xB > p_x) { // --x---B---
				deductionsBanPartOfRow(p_listEventsToApply, 0, xB-1, p_y, RAITONANBA.LIGHT);
			} else { // --B---x---
				deductionsBanPartOfRow(p_listEventsToApply, xB+1, this.xyLength-1, p_y, RAITONANBA.LIGHT);
			}
		}
	}
	
	// Where block is banned, starting from a numeric space
	var x = p_x-1;				
	while (x >= 0 && this.answerArray[p_y][x].getState(RAITONANBA.BLOCK) == SPACE_CHOICE.NO) {
		x--;
	}
	if (x >= 0) {
		this.deductionsFirstUnblockedSpaceFromNumber(p_listEventsToApply, lighted, p_x, p_y, x, p_y, ORIENTATION.HORIZONTAL);
	}
	x = p_x+1;
	while (x < this.xyLength && this.answerArray[p_y][x].getState(RAITONANBA.BLOCK) == SPACE_CHOICE.NO) {
		x++;
	}
	if (x < this.xyLength) {
		this.deductionsFirstUnblockedSpaceFromNumber(p_listEventsToApply, lighted, p_x, p_y, x, p_y, ORIENTATION.HORIZONTAL);
	}
}

deductionsBanPartOfRow = function(p_listEventsToApply, p_xMin, p_xMax, p_y, p_symbolToBan) {
	for (var x = p_xMin ; x <= p_xMax ; x++) {
		p_listEventsToApply.push(new ChoiceEvent(x, p_y, p_symbolToBan, false));
	}
}

// Target is first space where block is not banned starting from (source) coors. What to do ?  
SolverRaitonanba.prototype.deductionsFirstUnblockedSpaceFromNumber = function(p_listEventsToApply, p_isLighted, p_xSource, p_ySource, p_xTarget, p_yTarget, p_orientation) {
	if (p_isLighted == LIGHT.NO) {
		p_listEventsToApply.push(new ChoiceEvent(p_xTarget, p_yTarget, RAITONANBA.LIGHT, false));
	}
	if (this.answerArray[p_yTarget][p_xTarget].getState(RAITONANBA.LIGHT) == SPACE_CHOICE.YES) {
		p_listEventsToApply.push(new LightOrientationEvent(p_xSource, p_ySource, p_orientation, LIGHT.YES));
	}
}

//------------------
// Passing

generateEventsForRowColumnPassClosure = function(p_solver) {
	return function(p_indexPass) { 
		if (hasTotalPass(p_indexPass)) {
			return p_solver.generateTotalPassEventsMethod();
		}
		return p_solver.generateEventsForRowColumnPass(p_indexPass.x, p_indexPass.y);
	}
}

SolverRaitonanba.prototype.generateEventsForRowColumnPass = function(p_x, p_y) {
	var listPass = [];
	for (var i = 0 ; i < this.xyLength ; i++) {
		this.testAndGenerateEventsForOneSpace(listPass, p_x, i);
		this.testAndGenerateEventsForOneSpace(listPass, i, p_y);
	}
	
	return listPass;
}

SolverRaitonanba.prototype.generateTotalPassEventsMethod = function() {
	var listPass = []; 
	for (y = 0 ; y < this.yLength ; y++) {
		for (x = 0 ; x < this.xLength ; x++) {
			this.testAndGenerateEventsForOneSpace(listPass, x, y);
		}
	}
	return listPass;
}

SolverRaitonanba.prototype.testAndGenerateEventsForOneSpace = function(p_listPass, p_x, p_y) {
	if (this.answerArray[p_y][p_x].getValue() == null) {				
		p_listPass.push([new ChoiceEvent(p_x, p_y, RAITONANBA.LIGHT, true), new ChoiceEvent(p_x, p_y, RAITONANBA.BLOCK, true), new ChoiceEvent(p_x, p_y, RAITONANBA.X, true)]);
	}
} 

copying = function(p_event) {
	return p_event.copy();
}

comparing = function(p_event1, p_event2) {
	return commonComparison( 
		[[p_event1.y, p_event1.x, p_event1.getSymbol(), p_event1.choice], [p_event2.y, p_event2.x, p_event2.getSymbol(), p_event2.choice]]);
}


orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		return listCoordinatesPassRowColumnWithGCD(function(p_x, p_y) {
			return p_solver.answerArray[p_y][p_x].getValue() == null
		}, p_solver.xyLength, p_solver.xyLength);
	}
}

namingCategoryPassClosure = function(p_solver) {
	return function(p_indexPass) { 
		if (hasTotalPass(p_indexPass)) {
			return "Total pass ! Nb.spaces : " + p_indexPass.numberSpaces;
		}
		return "Col/row " + p_indexPass.x + "," + p_indexPass.y;
	}
}

//--------------
// Quickstart and resolution

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvents = [{quickStartLabel : "Raitonanba"}];
		var x, y, number;
		p_solver.numericSpacesList.forEach(coors => {
			x = coors.x;
			y = coors.y;
			number = p_solver.getNumber(x, y);
			if (number != null) { 
				listQSEvents.push(new ChoiceEvent(x, y, RAITONANBA.X, true));
				if (number == 0) {
					listQSEvents.push(new LightOrientationEvent(x, y, ORIENTATION.HORIZONTAL, LIGHT.NO));
					listQSEvents.push(new LightOrientationEvent(x, y, ORIENTATION.VERTICAL, LIGHT.NO));
				} 
				if (number == 2) {
					listQSEvents.push(new LightOrientationEvent(x, y, ORIENTATION.HORIZONTAL, LIGHT.YES));
					listQSEvents.push(new LightOrientationEvent(x, y, ORIENTATION.VERTICAL, LIGHT.YES));					
				}
			}
		});
		return listQSEvents;
	}
}

SolverRaitonanba.prototype.isSolved = function() {
	for (var y = 0 ; y < this.yLength ; y++) {
		if (this.xLightInRow[y] == null || this.xBlockInRow[y] == null) {
			return false;
		}
	}
	return true;
}

function isSolvedClosure(p_solver) {
	return function() {
		return p_solver.isSolved();
	}
}

function searchClosure(p_solver) {
	return function() {
		// TODO
	}
}