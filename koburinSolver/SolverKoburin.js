function SolverKoburin(p_symbolGrid) {
	LoopSolver.call(this);
	this.construct(p_symbolGrid);
}

SolverKoburin.prototype = Object.create(LoopSolver.prototype);
SolverKoburin.prototype.constructor = SolverKoburin;

function DummySolver() {
	return new SolverKoburin(generateSymbolArray(1,1));
}

LOOP_PASS_CATEGORY.NUMBER_KOBURIN = -1;

SolverKoburin.prototype.emitPassSpace = function(p_x, p_y) {
	var passIndex;
	if (this.numericArray[p_y][p_x].number != null) {		
		passIndex = {passCategory : LOOP_PASS_CATEGORY.NUMBER_KOBURIN, x : p_x, y : p_y};
	} else {
		passIndex = {passCategory : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y};
	}
	return this.passLoop(passIndex);
}



SolverKoburin.prototype.construct = function(p_numberGrid) {
    this.xLength = p_numberGrid[0].length;
	this.yLength = p_numberGrid.length;
	this.loopSolverConstruct(generateWallArray(this.xLength, this.yLength), 
	{	setSpaceLinkedPSAtomicDos : setSpaceLinkedPSAtomicDosClosure(this),
		setSpaceClosedPSAtomicDos : setSpaceClosedPSAtomicDosClosure(this),
		setSpaceLinkedPSAtomicUndos : setSpaceLinkedPSAtomicUndosClosure(this),
		setSpaceClosedPSAtomicUndos : setSpaceClosedPSAtomicUndosClosure(this),
		setSpaceLinkedPSDeductions : setSpaceLinkedPSDeductionsClosure(this),
		setSpaceClosedPSDeductions : setSpaceClosedPSDeductionsClosure(this),
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsClosure(this),
		PSQuickStart : quickStartClosure(this),
		generateEventsForPassPS : generateEventsForSpaceClosureKoburin(this),
		orderedListPassArgumentsPS : startingOrderedListPassArgumentsKoburinClosure(this),
		namingCategoryPS : namingCategoryClosure(this),
		multipassPessimismPS : true,
		passDefineTodoPSMethod : function(p_categoryPass) {
			const x = p_categoryPass.x;
			const y = p_categoryPass.y;
			return (this.grid[y][x].state != LOOP_STATE.CLOSED && this.grid[y][x].chains.length != 2);
		}
	});
	this.declareClosedSpacesActing();
	this.numericArray = [];
	this.neighborsNumbersArray = []; // All coordinates contained in this grid are coordinates of numeric spaces.
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		this.neighborsNumbersArray.push([]);
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			this.neighborsNumbersArray[iy].push([]);
		}
	}
	
	
	this.numericCoordinatesList = []; // List of coordinates of numeric spaces
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		this.numericArray.push([]);
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			if (p_numberGrid[iy][ix] != null) {
				this.numericCoordinatesList.push({x : ix, y : iy});
				// Number of "notLinkedYet" restarted to avoid interferences with "this.banSpace"
				this.numericArray[iy].push({number : p_numberGrid[iy][ix], notClosedYet : p_numberGrid[iy][ix], notLinkedYet : -1});
				KnownDirections.forEach(dir => {
					if (this.neighborExists(ix, iy, dir)) {
						this.neighborsNumbersArray[iy + DeltaY[dir]][ix + DeltaX[dir]].push({x : ix, y : iy});
					}
				});
            } else {
				this.numericArray[iy].push({number : null});
			}
		}
	}
	
	// In this puzzle, banning requires to use neighborsNumbersArray and numericArray. Since only atomic events are performed (no check, no need for consistency) it's fine. 
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			if (this.getNumber(ix, iy) != null) {
				this.banSpace(ix, iy);
			}
		}
	}

	// Correctly giving the values to notClosedYet and notLinkedYet (as they were potentially screwed 
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			if (this.getNumber(ix, iy) != null) {
				this.numericArray[iy][ix].notClosedYet = this.getNumber(ix, iy);
				this.numericArray[iy][ix].notLinkedYet = 4 - this.getNumber(ix, iy);
				KnownDirections.forEach(dir => {
					if (!this.neighborExists(ix, iy, dir) || (this.getNumber(ix + DeltaX[dir], iy + DeltaY[dir]) != null)) {
						this.numericArray[iy][ix].notLinkedYet--;
					}
				});
			}
		}
	}
	
	// Note : Xs not managed... at all ! (e.g. not drawn either)
}

// -------------------
// Getters and setters

SolverKoburin.prototype.getNumber = function(p_x, p_y) {
	return this.numericArray[p_y][p_x].number;
}

// -------------------
// Input methods

SolverKoburin.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverKoburin.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverKoburin.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	this.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverKoburin.prototype.passSpace = function(p_x, p_y) {
	var passIndex;
	if (this.numericArray[p_y][p_x].number != null) {		
		passIndex = {passCategory : LOOP_PASS_CATEGORY.KOBURIN, x : p_x, y : p_y};
	} else {
		passIndex = {passCategory : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y};
	}
	return this.passLoop(passIndex); 
}

SolverKoburin.prototype.makeMultipass = function() {
	this.multipassLoop();
}

// -------------------
// Atomic closures 

function setSpaceLinkedPSAtomicDosClosure(p_solver) {
	return function(p_space) {
		p_solver.neighborsNumbersArray[p_space.y][p_space.x].forEach(neighborSpace => {
			p_solver.numericArray[neighborSpace.y][neighborSpace.x].notLinkedYet--;
		});
	}
}

function setSpaceClosedPSAtomicDosClosure(p_solver) {
	return function(p_space) {
		p_solver.neighborsNumbersArray[p_space.y][p_space.x].forEach(neighborSpace => {
			p_solver.numericArray[neighborSpace.y][neighborSpace.x].notClosedYet--;
		});
	}
}

function setSpaceLinkedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		p_solver.neighborsNumbersArray[p_space.y][p_space.x].forEach(neighborSpace => {
			p_solver.numericArray[neighborSpace.y][neighborSpace.x].notLinkedYet++;
		});
	}
}

function setSpaceClosedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		p_solver.neighborsNumbersArray[p_space.y][p_space.x].forEach(neighborSpace => {
			p_solver.numericArray[neighborSpace.y][neighborSpace.x].notClosedYet++;
		});
	}
}

// -------------------
// Closure deduction

function setSpaceClosedPSDeductionsClosure(p_solver) {
	return function(p_listEvents, p_eventToApply) {
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		KnownDirections.forEach(dir => {
			if (p_solver.neighborExists(x, y, dir) && !p_solver.isBanned(x+DeltaX[dir], y+DeltaY[dir])) {
				p_listEvents.push(new SpaceEvent(x+DeltaX[dir], y+DeltaY[dir], LOOP_STATE.LINKED));
			}
		});
		p_solver.neighborsNumbersArray[y][x].forEach(space => {
			p_listEvents = p_solver.testNumericSpace(p_listEvents, space.x, space.y);
		});
		return p_listEvents;
	}
}

function setSpaceLinkedPSDeductionsClosure(p_solver) {
	return function(p_listEvents, p_eventToApply) {
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		p_solver.neighborsNumbersArray[y][x].forEach(space => {
			p_listEvents = p_solver.testNumericSpace(p_listEvents, space.x, space.y);
		});
		return p_listEvents;
	}
}

function setEdgeClosedDeductionsClosure(p_solver) {
	return function(p_listEvents, p_eventToApply) {
		// If a space has only 2 "possible neighbors", these neighbors must be opened.
		const x = p_eventToApply.linkX;
		const y = p_eventToApply.linkY;
		const dir = p_eventToApply.direction;
		const dx = p_eventToApply.linkX + DeltaX[dir];
		const dy = p_eventToApply.linkY + DeltaY[dir];
		p_listEvents = p_solver.tryAndCloseBeforeAndAfter2Closed(p_listEvents, x, y);
		p_listEvents = p_solver.tryAndCloseBeforeAndAfter2Closed(p_listEvents, dx, dy);
		return p_listEvents;
	}
}

// Precondition : p_x, p_y is a numeric space
SolverKoburin.prototype.testNumericSpace = function(p_listEvents, p_x, p_y) {
	if (this.numericArray[p_y][p_x].notClosedYet == 0) {
		KnownDirections.forEach(dir => {
			if (this.neighborExists(p_x, p_y, dir) && this.getLinkSpace(p_x+DeltaX[dir], p_y+DeltaY[dir], dir) != LOOP_STATE.CLOSED) {
				p_listEvents.push(new SpaceEvent(p_x+DeltaX[dir], p_y+DeltaY[dir], LOOP_STATE.LINKED));
			}
		});
	} else if (this.numericArray[p_y][p_x].notLinkedYet == 0) {
		KnownDirections.forEach(dir => {
			if (this.neighborExists(p_x, p_y, dir) && this.getLinkSpace(p_x+DeltaX[dir], p_y+DeltaY[dir], dir) != LOOP_STATE.LINKED) {
				p_listEvents.push(new SpaceEvent(p_x+DeltaX[dir], p_y+DeltaY[dir], LOOP_STATE.CLOSED));
			}
		});
	}
	return p_listEvents;
}

// C/C from Solver Yajilin
SolverKoburin.prototype.tryAndCloseBeforeAndAfter2Closed = function(p_listEvents, p_x, p_y) {
	KnownDirections.forEach(dir => {
		if (this.getClosedEdges(p_x, p_y) == 2) {
			if (this.neighborExists(p_x, p_y, dir) && this.getLink(p_x, p_y, dir) != LOOP_STATE.CLOSED) {
				p_listEvents.push(new SpaceEvent(p_x + DeltaX[dir], p_y + DeltaY[dir], LOOP_STATE.LINKED));
			}
		}
	});
	return p_listEvents;
}

// -------------------
// Quickstart

quickStartClosure = function(p_solver) {
	return function() { 
		p_solver.initiateQuickStart("Koburin");
		var list = [];
		p_solver.numericCoordinatesList.forEach(space => {
			 list = p_solver.testNumericSpace(list, space.x, space.y);
		});
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			for (var x = 0 ; x < p_solver.xLength ; x++) {
				// Smartness of Koburin C/C from Yajilin
				if (!p_solver.isBanned(x, y)) {
					list = p_solver.tryAndCloseBeforeAndAfter2Closed(list, x, y);
				}
			}
		}
		list.forEach(p_event => {
			p_solver.tryToPutNewSpace(p_event.x, p_event.y, p_event.state);
		});
		p_solver.terminateQuickStart();
	}
}

// -------------------
// Passing & multipassing

generateEventsForSpaceClosureKoburin = function(p_solver) {
	return function(p_space) {
		if (p_solver.getNumber(p_space.x, p_space.y) != null) {
			var answer = [];
			KnownDirections.forEach(dir => {
				if (p_solver.neighborExists(p_space.x, p_space.y, dir)) {
					answer.push([new SpaceEvent(p_space.x + DeltaX[dir], p_space.y + DeltaY[dir], LOOP_STATE.CLOSED),
						new SpaceEvent(p_space.x + DeltaX[dir], p_space.y + DeltaY[dir], LOOP_STATE.LINKED)]);	
				}
			});
			return answer; // If the first events of the lists are applied in a glutton-algorithm style (here, closed in up and closed in left around a numeric space with value 2) are applied, the brackets are forgotten this is not a (list of list of events).
		} 
		return [];
	}
}


function startingOrderedListPassArgumentsKoburinClosure(p_solver) {
	return function() {
		return p_solver.numericCoordinatesList;
	}
}

function namingCategoryClosure(p_solver) {
	return function (p_passIndex) {
		const x = p_passIndex.x;
		const y = p_passIndex.y;
		return "(number " + p_solver.numericArray[y][x].number + ") " + x + "," + y ;
	}
}

// -------------------
// Log of the numerical grid (copied on LoopSolver's other logOppositeEnd)

LoopSolver.prototype.lognumericArray = function(p_xStart = 0, p_yStart = 0, p_xEnd, p_yEnd) {
	var answer = "\n";
	var numeric;
	var stringSpace;
	if (!p_xEnd) {
		p_xEnd = this.xLength;
	} 
	if (!p_yEnd) {
		p_yEnd = this.yLength;
	}
	for (var iy = p_yStart; iy < p_yEnd ; iy++) {
		for (var ix = p_xStart; ix < p_xEnd ; ix++) {
			numeric = this.numericArray[iy][ix];
			if (numeric.notLinkedYet || numeric.notLinkedYet == 0) {
				stringSpace = numeric.notClosedYet+" "+numeric.notLinkedYet;
			} else {
				stringSpace = "ND";
			}
			while(stringSpace.length < 5) {
				stringSpace+= " ";
			}
			answer+=stringSpace+"|";
		}
		answer+="\n";
	}
	console.log(answer);
}
