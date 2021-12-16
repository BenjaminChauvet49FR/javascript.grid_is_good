// Note : to solve this proble, I adopted a laziness policy : most deductions that could have been done by, well, deductions, but that can be done by pass as well are NOT done by pass.
// Deductions only contain : 
// -Rule deductions to make sure a space is standard (not two black quarters as you wish)
// -Rule deductions for straight rectangles (as soon as a white triangle is backed to a black, the white one belongs to a straight rectangle + the 2x2 square completion rule... see below)
// -Rule deductions for numbers
// -Smart deduction (?) : forcing a diamond to appear when a black and a white quarter are near each other in the same space 
// - Rebound deduction && slide deduction (see below)
// - Some deductions that involve two blacks

const NOT_FORCED = -1;
const SHAKASHAKA = {
	WHITE : 0, BLACK : 2, UNDECIDED : 1
}

const SHAKASHAKA_PASS_CATEGORY = { 
	SPACE : 'S',
	NUMERIC : 'N'
}

// Setup

function SolverShakashaka(p_numberSymbolArray) {
	GeneralSolver.call(this);
	this.construct(p_numberSymbolArray);
}

SolverShakashaka.prototype = Object.create(GeneralSolver.prototype);
DummySolver = function() {
	return new SolverShakashaka([[null]]);
}

SolverShakashaka.prototype.constructor = SolverShakashaka;

SolverShakashaka.prototype.construct = function(p_numberSymbolArray) {
	this.generalConstruct();
	this.xLength = p_numberSymbolArray[0].length;
	this.yLength = p_numberSymbolArray.length;
	
	this.methodsSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetPass = {comparisonMethod : compareSolveEvents, copyMethod : copying, argumentToLabelMethod : namingSetClosure(this)};
	this.methodsSetMultiPass = {
		generatePassEventsMethod : generateEventsForSpacePassClosure(this), 
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this), 
		passTodoMethod : multipassDefineTodoClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}

	this.answerArray = [];
	this.numericArray = [];
	this.setsAroundNumericSpaces = [];
	var symbolOrNumber, number;
	this.straightnessArray = generateValueArray(this.xLength, this.yLength, false); // To determine spaces that would belong to a straight rectangle !
	
	// Initialize answerArray and numericArray
	for(iy = 0 ; iy < this.yLength ; iy++) {
		this.answerArray.push([]);
		this.numericArray.push([]);
		for(ix = 0 ; ix < this.xLength ; ix++) {
			symbolOrNumber = p_numberSymbolArray[iy][ix];
			if (symbolOrNumber != null) {
				this.answerArray[iy].push([SHAKASHAKA.BLACK, SHAKASHAKA.BLACK, SHAKASHAKA.BLACK, SHAKASHAKA.BLACK]); // Optional but I kinda like this
				if (symbolOrNumber == "X") {
					this.numericArray[iy].push({blocked : true, value : NOT_FORCED});
				} else {
					number = parseInt(symbolOrNumber, 10);
					this.numericArray[iy].push({blocked : true, value : number, notPlacedBlacksYet : number, notPlacedWhitesYet : 4 - number, indexSetNumeric : -1}); // indexSetNumeric : for pass.
				}
			} else {
				this.answerArray[iy].push([SHAKASHAKA.UNDECIDED, SHAKASHAKA.UNDECIDED, SHAKASHAKA.UNDECIDED, SHAKASHAKA.UNDECIDED]); // Note : nature of directions = numbers from 0 to 3
				this.numericArray[iy].push({blocked : false, value : NOT_FORCED});
			}
		}
	}
	
	var xx, yy;
	// Initialize numericArray
	for(iy = 0 ; iy < this.yLength ; iy++) {
		for(ix = 0 ; ix < this.xLength ; ix++) {
			if (this.numericArray[iy][ix].notPlacedWhitesYet) { // Assumes that the puzzle is valid and notPlacedWhitesYet >= 0 and if it is equal to 0 there's nothing to be done
				KnownDirections.forEach(dir => {
					if (!this.neighborExists(ix, iy, dir) || (this.numericArray[iy + DeltaY[dir]][ix + DeltaX[dir]].blocked)) {
						this.numericArray[iy][ix].notPlacedWhitesYet--;
					} 
				});
			}
		}	
	}
}

//--------------------------------

// Misc methods (may be used for drawing and intelligence)
SolverShakashaka.prototype.isBlockedSpace = function(p_x, p_y) { 
	return this.numericArray[p_y][p_x].blocked;
}

SolverShakashaka.prototype.getNumericValue = function(p_x, p_y) {
	const spaceInfos = this.numericArray[p_y][p_x];
	if (!spaceInfos.blocked) {
		return null;
	} else {
		const val = spaceInfos.value;
		return (val == NOT_FORCED ? null : val);
	}
	return this.getNumericValueFromSpace();
}

SolverShakashaka.prototype.getAnswer = function(p_x, p_y, p_dir) {
	return this.answerArray[p_y][p_x][p_dir];
}

SolverShakashaka.prototype.getNeighborTriangle = function(p_x, p_y, p_dirPosTriangle, p_dirOrientTriangle) {
	return this.answerArray[p_y + DeltaY[p_dirPosTriangle]][p_x + DeltaX[p_dirPosTriangle]][p_dirOrientTriangle];
}

//--------------
// Input

SolverShakashaka.prototype.emitHypothesis = function(p_x, p_y, p_dir, p_symbol) {
	return this.tryToApplyHypothesis(new TriangleEvent(p_x, p_y, p_dir, p_symbol));
}

SolverShakashaka.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverShakashaka.prototype.makeQuickStart = function() {
	this.quickStart();
}

SolverShakashaka.prototype.emitPassSpace = function(p_x, p_y) {
	const space = this.numericArray[p_y][p_x];
	if (space.value != NOT_FORCED) {
		generatedEvents = this.generateEventsAroundNumericSpace(p_x, p_y);
		this.passEvents(generatedEvents, {passCategory : SHAKASHAKA_PASS_CATEGORY.NUMERIC, x : p_x, y : p_y}); // Note : pass categories not undispensables, given that everything revolves around spaces...
	} else {
		generatedEvents = this.generateEventsInSpace(p_x, p_y);
		this.passEvents(generatedEvents, {passCategory : SHAKASHAKA_PASS_CATEGORY.SPACE, x : p_x, y : p_y});
	}
}

SolverShakashaka.prototype.makeMultiPass = function() {
	this.multiPass(this.methodsSetMultiPass);
}

//--------------------------------
// Doing and undoing

applyEventClosure = function(p_solver) {
	return function(p_solveEvent) {
		if (p_solveEvent.kind == TRIANGLE_KIND) {			
			return p_solver.putNew(p_solveEvent.x,p_solveEvent.y, p_solveEvent.direction, p_solveEvent.symbol);
		} else {
			if (p_solver.straightnessArray[p_solveEvent.y][p_solveEvent.x]) {
				return EVENT_RESULT.HARMLESS;
			} else {
				p_solver.straightnessArray[p_solveEvent.y][p_solveEvent.x] = true;
				return EVENT_RESULT.SUCCESS;
			}
		}
	}
}

SolverShakashaka.prototype.putNew = function(p_x, p_y, p_dir, p_symbol) {
	const y = p_y;
	const x = p_x;
	const dir = p_dir;
	const symbol = p_symbol; // Rewritten parameters to ease copy-pastes with undoing method below
	if (symbol == this.answerArray[y][x][dir]) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[y][x][dir] != SHAKASHAKA.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerArray[y][x][dir] = symbol;
	const dx = x + DeltaX[dir];
	const dy = y + DeltaY[dir];
	if (this.neighborExists(x, y, dir) && this.numericArray[dy][dx].value) {		
		if (symbol == SHAKASHAKA.BLACK) {
			this.numericArray[dy][dx].notPlacedBlacksYet--;
		} else {
			this.numericArray[dy][dx].notPlacedWhitesYet--;
		}
	}
	return EVENT_RESULT.SUCCESS;
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		p_solver.undoSymbolEvent(p_eventToUndo);
	}
}

SolverShakashaka.prototype.undoSymbolEvent = function(p_event) {
	if (p_event.kind == TRIANGLE_KIND) {		
		const x = p_event.x;
		const y = p_event.y;
		const dir = p_event.direction;
		const symbol = this.answerArray[y][x][dir];
		this.answerArray[y][x][dir] = SHAKASHAKA.UNDECIDED;
		const dx = x + DeltaX[dir];
		const dy = y + DeltaY[dir];
		if (this.neighborExists(x, y, dir) && this.numericArray[dy][dx].value != NOT_FORCED) {		
			if (symbol == SHAKASHAKA.BLACK) {
				this.numericArray[dy][dx].notPlacedBlacksYet++;
			} else {
				this.numericArray[dy][dx].notPlacedWhitesYet++;
			}
		}
	} else {
		this.straightnessArray[p_event.y][p_event.x] = false;
	}
}


//-------------------------------- 
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvts = [{quickStartLabel : "Shakashaka"}];
		var space;
		var spaceInfos;
		for (var iy = 0 ; iy < p_solver.yLength ; iy++) {
			for (var ix = 0 ; ix < p_solver.xLength ; ix++) {
				if (p_solver.isBlockedSpace(ix, iy)) {
					// Triangles opposite to walls
					p_solver.existingNeighborsCoorsDirections(ix, iy).forEach(coorsDir => {
						if (!p_solver.isBlockedSpace(coorsDir.x, coorsDir.y)) {						
							listQSEvts.push(new TriangleEvent(coorsDir.x, coorsDir.y, coorsDir.direction, SHAKASHAKA.WHITE));
						}
					});
					// Numeric space
					if (p_solver.numericArray[iy][ix].value != NOT_FORCED) {
						if (p_solver.numericArray[iy][ix].notPlacedWhitesYet == 0) {
							listQSEvts = p_solver.aroundSpaceNumericDeductions(listQSEvts, ix, iy, SHAKASHAKA.BLACK);
						}
						if (p_solver.numericArray[iy][ix].notPlacedBlacksYet == 0) {
							listQSEvts = p_solver.aroundSpaceNumericDeductions(listQSEvts, ix, iy, SHAKASHAKA.WHITE);
						}
					}
				}				
			}
		}
		for (var iy = 0 ; iy < p_solver.yLength ; iy++) {
			if (!p_solver.isBlockedSpace(0, iy)) {
				listQSEvts.push(new TriangleEvent(0, iy, DIRECTION.RIGHT, SHAKASHAKA.WHITE));
			} 
			if (!p_solver.isBlockedSpace(p_solver.xLength-1, iy)) {
				listQSEvts.push(new TriangleEvent(p_solver.xLength-1, iy, DIRECTION.LEFT, SHAKASHAKA.WHITE));			
			}
		}
		for (var ix = 0 ; ix < p_solver.xLength ; ix++) {
			if (!p_solver.isBlockedSpace(ix, 0)) {
				listQSEvts.push(new TriangleEvent(ix, 0, DIRECTION.DOWN, SHAKASHAKA.WHITE));
			} 
			if (!p_solver.isBlockedSpace(ix, p_solver.yLength-1)) {
				listQSEvts.push(new TriangleEvent(ix, p_solver.yLength-1, DIRECTION.UP, SHAKASHAKA.WHITE));			
			}
		}
		return listQSEvts;
	}
}

//-------------------------------- 
// Deductions

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind == TRIANGLE_KIND) {			
			//Put symbol into space
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			const dir = p_eventBeingApplied.direction;
			const symbol = p_eventBeingApplied.symbol;
			const odir = OppositeDirection[dir];
			const clockwiseDir = TurningRightDirection[dir]; // "Clockwise" from the center. Hence the "clockwise" from up is right
			const counterClockwiseDir = TurningLeftDirection[dir];
			const pressX = x + DeltaX[dir]; // Press = translation of "Appuyer", as the triangle "presses" onto another space
			const pressY = y + DeltaY[dir];
			if (symbol == SHAKASHAKA.WHITE) {
				// Numeric deductions
				if (p_solver.neighborExists(x, y, dir)) { 
					if (p_solver.numericArray[pressY][pressX].value != NOT_FORCED && p_solver.numericArray[pressY][pressX].notPlacedWhitesYet == 0) {
						p_listEventsToApply = p_solver.aroundSpaceNumericDeductions(p_listEventsToApply, pressX, pressY, SHAKASHAKA.BLACK);
					}
				}
				if (p_solver.answerArray[y][x][odir] == SHAKASHAKA.WHITE) { // Two opposite are white : whole space is white.
					p_listEventsToApply.push(new TriangleEvent(x, y, clockwiseDir, SHAKASHAKA.WHITE));
					p_listEventsToApply.push(new TriangleEvent(x, y, counterClockwiseDir, SHAKASHAKA.WHITE));
				}
				// Black and white in adjacent directions on the same space
				if (p_solver.answerArray[y][x][clockwiseDir] == SHAKASHAKA.BLACK) {
					p_listEventsToApply = p_solver.blackWithWhiteCounterClockwiseDeductions(p_listEventsToApply, x, y, clockwiseDir);
				}
				if (p_solver.answerArray[y][x][counterClockwiseDir] == SHAKASHAKA.BLACK) {					
					p_listEventsToApply = p_solver.blackWithWhiteClockwiseDeductions(p_listEventsToApply, x, y, counterClockwiseDir);
				}
				// Aside a white in the same direction to make a diamond slide
				var xBlack, yBlack;
				var ok = true;
				[clockwiseDir, counterClockwiseDir].forEach(blackDir => {
					if (p_solver.neighborExists(x, y, blackDir)) {				
						xBlack = x + DeltaX[blackDir];
						yBlack = y + DeltaY[blackDir];
						if ((p_solver.answerArray[yBlack][xBlack][dir] == SHAKASHAKA.BLACK) && p_solver.answerArray[yBlack][xBlack][OppositeDirection[blackDir]] == SHAKASHAKA.WHITE) {
							if (!p_solver.neighborExists(x, y, dir)) {
								p_listEventsToApply.push(new FailureEvent());
								ok = false;
							}
							p_listEventsToApply = p_solver.slideDeductions(p_listEventsToApply, xBlack, yBlack, dir, OppositeDirection[blackDir]);
						}
					}
				});
				if (!ok) {
					return p_listEventsToApply;
				}
				// Continuity from a straight rectangle or birth of a straight space
				if ( (!p_solver.neighborExists(x, y, dir)) || p_solver.straightnessArray[pressY][pressX] || p_solver.getNeighborTriangle(x, y, dir, OppositeDirection[dir]) == SHAKASHAKA.BLACK) {						
					p_listEventsToApply.push(new StraightSpaceEvent(x, y)); 
				}
			} else {
				p_listEventsToApply.push(new TriangleEvent(x, y, odir, SHAKASHAKA.WHITE)); // Opposite direction in the same space
				// Numeric deductions
				if (p_solver.neighborExists(x, y, dir)) { 
					if (p_solver.numericArray[pressY][pressX].value != NOT_FORCED && p_solver.numericArray[pressY][pressX].notPlacedBlacksYet == 0) {
						p_listEventsToApply = p_solver.aroundSpaceNumericDeductions(p_listEventsToApply, pressX, pressY, SHAKASHAKA.WHITE);
					}
				}
				if (p_solver.neighborExists(x, y, dir) && !p_solver.isBlockedSpace(pressX, pressY, dir)) { // Behind the triangle
					p_listEventsToApply.push(new TriangleEvent(pressX, pressY, dir, SHAKASHAKA.WHITE));
				}
				// Black and white in adjacent directions on the same space
				if (p_solver.answerArray[y][x][clockwiseDir] == SHAKASHAKA.WHITE) {
					p_listEventsToApply = p_solver.blackWithWhiteClockwiseDeductions(p_listEventsToApply, x, y, dir);
				}
				if (p_solver.answerArray[y][x][counterClockwiseDir] == SHAKASHAKA.WHITE) {					
					p_listEventsToApply = p_solver.blackWithWhiteCounterClockwiseDeductions(p_listEventsToApply, x, y, dir);
				}
				// Two blacks : 
				// Black source AND black facing in a side space (space to its left/right)
				[clockwiseDir, counterClockwiseDir].forEach(turningDir => {				
					if (p_solver.neighborExists(x, y, turningDir)) {
						if (p_solver.answerArray[y + DeltaY[turningDir]][x + DeltaX[turningDir]][odir] == SHAKASHAKA.BLACK) {
							p_listEventsToApply = p_solver.blackWithBlackAheadSideDeductions(p_listEventsToApply, x, y, dir, turningDir); // Benefits from the fact banned spaces are all "blackened"
						} 
					}
				});
			}
			return p_listEventsToApply;
		} else { // Straight space !
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			p_listEventsToApply.push(new TriangleEvent(x, y, DIRECTION.UP, SHAKASHAKA.WHITE));
			p_listEventsToApply.push(new TriangleEvent(x, y, DIRECTION.DOWN, SHAKASHAKA.WHITE));
			p_solver.existingNeighborsDirections(x, y).forEach(dir => {
				if (p_solver.getNeighborTriangle(x, y, dir, OppositeDirection[dir]) == SHAKASHAKA.WHITE) {
					p_listEventsToApply.push(new StraightSpaceEvent(x + DeltaX[dir], y + DeltaY[dir]));
				}
			});
			// Rectangle completion
			if (x > 0) {
				if (y > 0) {
					p_listEventsToApply = p_solver.straightRectangleCompletionDeductions(p_listEventsToApply, x, y, x-1, y-1);
				}
				if (y <= p_solver.yLength - 2) {
					p_listEventsToApply = p_solver.straightRectangleCompletionDeductions(p_listEventsToApply, x, y, x-1, y+1);
				}
			}
			if (x <= p_solver.xLength - 2) {
				if (y > 0) {
					p_listEventsToApply = p_solver.straightRectangleCompletionDeductions(p_listEventsToApply, x, y, x+1, y-1);					
				}
				if (y <= p_solver.yLength - 2) {
					p_listEventsToApply = p_solver.straightRectangleCompletionDeductions(p_listEventsToApply, x, y, x+1, y+1);
				}
			}
			return p_listEventsToApply;
		}
	}
}

// Numeric deductions
SolverShakashaka.prototype.aroundSpaceNumericDeductions = function(p_listEventsToApply, p_x, p_y, p_colorToFill) {
	this.existingNeighborsDirections(p_x, p_y).forEach(dir => {
		if (this.getNeighborTriangle(p_x, p_y, dir, OppositeDirection[dir]) == SHAKASHAKA.UNDECIDED) {
			p_listEventsToApply.push(new TriangleEvent(p_x + DeltaX[dir], p_y + DeltaY[dir], OppositeDirection[dir], p_colorToFill));
		}
	});
	return p_listEventsToApply;
}

// A black near to a white
// p_dir = direction of the white space quarter
SolverShakashaka.prototype.blackWithWhiteClockwiseDeductions = function(p_listEventsToApply, p_x, p_y, p_dir) {
	return this.blackWithWhiteTurningDeductions(p_listEventsToApply, p_x, p_y, p_dir, TurningRightDirection[p_dir]);
}

SolverShakashaka.prototype.blackWithWhiteCounterClockwiseDeductions = function(p_listEventsToApply, p_x, p_y, p_dir) {
	return this.blackWithWhiteTurningDeductions(p_listEventsToApply, p_x, p_y, p_dir, TurningLeftDirection[p_dir]);
}

SolverShakashaka.prototype.blackWithWhiteTurningDeductions = function(p_listEventsToApply, p_x, p_y, p_dirSource, p_dirTurn) {
	const odir = OppositeDirection[p_dirSource];
	if (!this.neighborExists(p_x, p_y, p_dirTurn) || !(this.neighborExists(p_x, p_y, odir))) {		
		p_listEventsToApply.push(new FailureEvent());
		return p_listEventsToApply;
	}
	const dirTurn3 = OppositeDirection[p_dirTurn];
	const xTurn = p_x + DeltaX[p_dirTurn];
	const yTurn = p_y + DeltaY[p_dirTurn];
	const xTurnOp = xTurn + DeltaX[odir];
	const yTurnOp = yTurn + DeltaY[odir];
	const xTurn3 = p_x + DeltaX[odir];
	const yTurn3 = p_y + DeltaY[odir];
	// Slide deduction : if the triangle in the same direction of the black source triangle on the side of the white one is white, another diamond ! (forced by one triangle)
	if (this.answerArray[yTurn][xTurn][p_dirSource] == SHAKASHAKA.WHITE) {
		if (!this.neighborExists(p_x, p_y, p_dirSource)) {
			p_listEventsToApply.push(new FailureEvent());
			return p_listEventsToApply;
		}
		p_listEventsToApply = this.slideDeductions(p_listEventsToApply, p_x, p_y, p_dirSource, p_dirTurn);
	}
		
	
	// Diamond + completion deductions
	p_listEventsToApply.push(new TriangleEvent(xTurn, yTurn, dirTurn3, SHAKASHAKA.WHITE));
	p_listEventsToApply.push(new TriangleEvent(xTurn, yTurn, odir, SHAKASHAKA.WHITE));
	p_listEventsToApply.push(new TriangleEvent(xTurnOp, yTurnOp, p_dirSource, SHAKASHAKA.WHITE));
	p_listEventsToApply.push(new TriangleEvent(xTurnOp, yTurnOp, dirTurn3, SHAKASHAKA.WHITE));
	p_listEventsToApply.push(new TriangleEvent(xTurn3, yTurn3, p_dirTurn, SHAKASHAKA.WHITE));
	p_listEventsToApply.push(new TriangleEvent(xTurn3, yTurn3, p_dirSource, SHAKASHAKA.WHITE));
	p_listEventsToApply.push(new TriangleEvent(p_x, p_y, odir, SHAKASHAKA.WHITE));
	p_listEventsToApply.push(new TriangleEvent(p_x, p_y, dirTurn3, SHAKASHAKA.BLACK)); 
	// Rebound deductions : if side space of the direction of the space is either non-existent or already black : needs a rebound
	if (!this.neighborExists(p_x, p_y, p_dirSource) || this.answerArray[yTurn + DeltaY[p_dirSource]][xTurn + DeltaX[p_dirSource]][odir] == SHAKASHAKA.BLACK) {
		p_listEventsToApply.push(new TriangleEvent(xTurn, yTurn, p_dirSource, SHAKASHAKA.BLACK));
	}
	return p_listEventsToApply;
}

// Two blacks facing each other with one which is sided from the other one :
// p_dir = triangle source
SolverShakashaka.prototype.blackWithBlackAheadSideDeductions = function(p_listEventsToApply, p_x, p_y, p_dir, p_dirTurning) {
	p_listEventsToApply.push(new TriangleEvent(p_x + DeltaX[p_dirTurning], p_y + DeltaY[p_dirTurning], OppositeDirection[p_dirTurning], SHAKASHAKA.BLACK));
	p_listEventsToApply.push(new TriangleEvent(p_x, p_y, p_dirTurning, SHAKASHAKA.BLACK));
	return p_listEventsToApply;
}

// Prerequistes (all checked) : 
// Black in (p_xBlack, p_yBlack, p_dirBlack)
// White in (p_xBlack, p_yBlack, p_dirWhite)
// White in ((p_xBlack, p_yBlack) + Delta(p_dirBlack), p_dirBlack)
// Existing neighbor (p_xBlack, p_yBlack, p_dirBlack) otherwise failure !
// Then the diamond already formed must slide
SolverShakashaka.prototype.slideDeductions = function(p_listEventsToApply, p_xBlack, p_yBlack, p_dirBlack, p_dirWhite) {
	const remoteX = p_xBlack + DeltaX[p_dirBlack] + DeltaX[p_dirWhite];
	const remoteY = p_yBlack + DeltaY[p_dirBlack] + DeltaY[p_dirWhite];
	p_listEventsToApply.push(new TriangleEvent(remoteX, remoteY, p_dirBlack, SHAKASHAKA.BLACK));
	p_listEventsToApply.push(new TriangleEvent(remoteX, remoteY, OppositeDirection[p_dirWhite], SHAKASHAKA.BLACK)); // If not for laziness, this event would have been made useless
	return p_listEventsToApply;
}

// If 3 spaces are "straight" in the (p_x1, p_y1 -> p_x2, p_y2) set of spaces which is supposed to be an existing 2x2 square : fill the 4th.
SolverShakashaka.prototype.straightRectangleCompletionDeductions = function(p_listEventsToApply, p_x1, p_y1, p_x2, p_y2) {
	const xArray = [p_x1, p_x1, p_x2, p_x2];
	const yArray = [p_y1, p_y2, p_y1, p_y2];
	var ai = -1; // ai for answer index
	for (var i = 0 ; i <= 3 ; i++) {
		if (!this.straightnessArray[yArray[i]][xArray[i]]) {
			if (ai >= 0) {
				ai = -2;
				break;
			}
			if (ai == -1) {
				ai = i;
			}
		}
	}
	if (ai >= 0) {
		p_listEventsToApply.push(new StraightSpaceEvent(xArray[ai], yArray[ai]));
	}
	return p_listEventsToApply;
}

// ---------------------
// Pass methods
	
SolverShakashaka.prototype.generateEventsAroundNumericSpace = function(p_x, p_y) {
	var answer = [];
	this.existingNeighborsCoorsDirections(p_x, p_y).forEach(coorsDir => {
		answer.push(
		[new TriangleEvent(coorsDir.x, coorsDir.y, OppositeDirection[coorsDir.direction], SHAKASHAKA.BLACK), 
		new TriangleEvent(coorsDir.x, coorsDir.y, OppositeDirection[coorsDir.direction], SHAKASHAKA.WHITE)]
		);
	});
	return answer;
}

SolverShakashaka.prototype.generateEventsInSpace = function(p_x, p_y) {
	var answer = [];
	answer.push([new TriangleEvent(p_x, p_y, DIRECTION.UP, SHAKASHAKA.BLACK), new TriangleEvent(p_x, p_y, DIRECTION.UP, SHAKASHAKA.WHITE)]);
	answer.push([new TriangleEvent(p_x, p_y, DIRECTION.LEFT, SHAKASHAKA.BLACK), new TriangleEvent(p_x, p_y, DIRECTION.LEFT, SHAKASHAKA.WHITE)]);
	answer.push([new TriangleEvent(p_x, p_y, DIRECTION.RIGHT, SHAKASHAKA.BLACK), new TriangleEvent(p_x, p_y, DIRECTION.RIGHT, SHAKASHAKA.WHITE)]);
	return answer;
}

function compareSolveEvents(p_event1, p_event2) {
	return commonComparisonMultiKinds([TRIANGLE_KIND, STRAIGHT_SPACE_KIND], 
		[
		[p_event1.y, p_event1.x, p_event1.direction, p_event1.symbol], [p_event2.y, p_event2.x, p_event2.direction, p_event2.symbol],
		[p_event1.y, p_event1.x], [p_event2.y, p_event2.x]
		], p_event1.kind, p_event2.kind);
}

function copying(p_event) {
	return p_event.copy();
}

function namingSetClosure(p_solver) {
	return function(p_index) {
		switch(p_index.passCategory) {
			case SHAKASHAKA_PASS_CATEGORY.SPACE : return "Std.space " + p_index.x + "," + p_index.y; break; 
			case SHAKASHAKA_PASS_CATEGORY.NUMERIC : return "Around num.space "+ p_index.x + "," + p_index.y; break;
		}
	}
}

// ---------------------
// Multipass methods

generateEventsForSpacePassClosure = function(p_solver) {
	return function(p_index) {
		if (p_index.passCategory == SHAKASHAKA_PASS_CATEGORY.NUMERIC) {
			return p_solver.generateEventsAroundNumericSpace(p_index.x, p_index.y);
		} else {
			return p_solver.generateEventsInSpace(p_index.x, p_index.y);
		}
	}
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var answer = [];
		for (var iy = 0 ; iy < p_solver.yLength ; iy++) {
			for (var ix = 0 ; ix < p_solver.xLength ; ix++) {
				if (p_solver.numericArray[iy][ix].value != NOT_FORCED) {
					answer.push({passCategory : SHAKASHAKA_PASS_CATEGORY.NUMERIC, x : ix, y : iy});
				} else if (!p_solver.numericArray[iy][ix].blocked) {
					answer.push({passCategory : SHAKASHAKA_PASS_CATEGORY.SPACE, x : ix, y : iy});
				}
			}
		}
		return answer;
	}
}

multipassDefineTodoClosure = function(p_solver) {
	return function(p_index) {
		if (p_index.passCategory == SHAKASHAKA_PASS_CATEGORY.NUMERIC) {
			return (p_solver.numericArray.notPlacedBlacksYet > 0);
		} else {
			var space = p_solver.answerArray[p_index.y][p_index.x];
			return (space[DIRECTION.LEFT] == SHAKASHAKA.UNDECIDED || space[DIRECTION.UP] == SHAKASHAKA.UNDECIDED || space[DIRECTION.RIGHT] == SHAKASHAKA.UNDECIDED);
		}
	}
}