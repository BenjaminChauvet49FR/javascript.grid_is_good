const NOT_FORCED = -1;

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

SolverKoburin.prototype.construct = function(p_numberGrid) {
    this.xLength = p_numberGrid[0].length;
	this.yLength = p_numberGrid.length;
	this.loopSolverConstruct( 
	{	setSpaceLinkedPSAtomicDos : setSpaceLinkedPSAtomicDosClosure(this),
		setSpaceClosedPSAtomicDos : setSpaceClosedPSAtomicDosClosure(this),
		setSpaceLinkedPSAtomicUndos : setSpaceLinkedPSAtomicUndosClosure(this),
		setSpaceClosedPSAtomicUndos : setSpaceClosedPSAtomicUndosClosure(this),
		setSpaceLinkedPSDeductions : setSpaceLinkedPSDeductionsClosure(this),
		setSpaceClosedPSDeductions : setSpaceClosedPSDeductionsClosure(this),
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsClosure(this),
		quickStartEventsPS : quickStartEventsClosure(this),
		generateEventsForPassPS : generateEventsForAroundSpacePassClosureKoburin(this),
		orderedListPassArgumentsPS : startingOrderedListPassArgumentsKoburinClosure(this),
		namingCategoryPS : namingCategoryPassClosure(this),
		multipassPessimismPS : true,
		passDefineTodoPSMethod : function(p_categoryPass) {
			return (this.numericArray[p_categoryPass.y][p_categoryPass.x].notLinkedYet != 0);
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
	
	var numberXNull;
	this.numericCoordinatesList = []; // List of coordinates of numeric spaces ; also public for drawing
	// Big warning : somehow modified in multipass by adding args events, which forced me to revise 
	this.xCoordinatesList = []; // public for drawing
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		this.numericArray.push([]);
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			numberXNull = p_numberGrid[iy][ix];
			if (numberXNull != null) {
				if (isNaN(numberXNull)) {
					this.numericArray[iy].push({number : NOT_FORCED});
					this.xCoordinatesList.push({x : ix, y : iy});
				} else {
					this.numericCoordinatesList.push({x : ix, y : iy});
					// Number of "notLinkedYet" restarted to avoid interferences with "this.banSpace"
					this.numericArray[iy].push({number : parseInt(numberXNull, 10), notClosedYet : p_numberGrid[iy][ix], notLinkedYet : -1});
					KnownDirections.forEach(dir => {
						if (this.neighborExists(ix, iy, dir)) {
							this.neighborsNumbersArray[iy + DeltaY[dir]][ix + DeltaX[dir]].push({x : ix, y : iy});
						}
					});
				}
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

	// Correctly giving the values to notClosedYet and notLinkedYet (as they were potentially screwed by ban)
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			numberXNull = this.getNumber(ix, iy);
			if (numberXNull != null && numberXNull != NOT_FORCED) {
				this.numericArray[iy][ix].notClosedYet = numberXNull;
				this.numericArray[iy][ix].notLinkedYet = 4 - numberXNull;
				KnownDirections.forEach(dir => {
					if (!this.neighborExists(ix, iy, dir) || (this.getNumber(ix + DeltaX[dir], iy + DeltaY[dir]) != null)) {
						this.numericArray[iy][ix].notLinkedYet--;
					}
				});
			}
		}
	}
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

SolverKoburin.prototype.emitPassSpace = function(p_x, p_y) {
	var indexPass;
	const number = this.numericArray[p_y][p_x].number;
	if (number != null && number != NOT_FORCED) {		
		indexPass = {passCategory : LOOP_PASS_CATEGORY.NUMBER_KOBURIN, x : p_x, y : p_y};
	} else {
		indexPass = {passCategory : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y};
	}
	return this.passLoop(indexPass);
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
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		KnownDirections.forEach(dir => {
			if (p_solver.neighborExists(x, y, dir) && !p_solver.isBanned(x+DeltaX[dir], y+DeltaY[dir])) {
				p_listEventsToApply.push(new SpaceEvent(x+DeltaX[dir], y+DeltaY[dir], LOOP_STATE.LINKED));
			}
		});
		p_solver.neighborsNumbersArray[y][x].forEach(space => {
			p_solver.deductionsTestNumericSpace(p_listEventsToApply, space.x, space.y);
		});
	}
}

function setSpaceLinkedPSDeductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		p_solver.neighborsNumbersArray[y][x].forEach(space => {
			p_solver.deductionsTestNumericSpace(p_listEventsToApply, space.x, space.y);
		});
	}
}

function setEdgeClosedDeductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		// If a space has only 2 "possible neighbors", these neighbors must be linked.
		const x = p_eventBeingApplied.linkX;
		const y = p_eventBeingApplied.linkY;
		const dir = p_eventBeingApplied.direction;
		const dx = p_eventBeingApplied.linkX + DeltaX[dir];
		const dy = p_eventBeingApplied.linkY + DeltaY[dir];
		p_solver.deductionsTryAndCloseBeforeAndAfter2Closed(p_listEventsToApply, x, y);
		p_solver.deductionsTryAndCloseBeforeAndAfter2Closed(p_listEventsToApply, dx, dy);
	}
}

// Precondition : p_x, p_y is a numeric space
SolverKoburin.prototype.deductionsTestNumericSpace = function(p_listEventsToApply, p_x, p_y) {
	if (this.numericArray[p_y][p_x].notClosedYet == 0) {			
		this.existingNeighborsCoors(p_x, p_y).forEach(coors => {
			if (this.getLinkSpace(coors.x, coors.y) != LOOP_STATE.CLOSED) {
				p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, LOOP_STATE.LINKED));
			}
		});
	} else if (this.numericArray[p_y][p_x].notLinkedYet == 0) {
		this.existingNeighborsCoors(p_x, p_y).forEach(coors => {
			if (this.getLinkSpace(coors.x, coors.y) != LOOP_STATE.LINKED) {
				p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, LOOP_STATE.CLOSED));
			}
		});
	}
}

// -------------------
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function(p_listQSEvents) {
		p_listQSEvents.push({quickStartLabel : "Koburin"});
		p_solver.numericCoordinatesList.forEach(space => {
			 p_solver.deductionsTestNumericSpace(p_listQSEvents, space.x, space.y);
		});
		p_solver.deductionsQSBeforeAndAfter2Closed(p_listQSEvents);
	}
}

// -------------------
// Passing & multipassing

generateEventsForAroundSpacePassClosureKoburin = function(p_solver) {
	return function(p_space) {
		var listPass = []; // If the first events of the lists are applied in a glutton-algorithm style (here, closed in up and closed in left around a numeric space with value 2) are applied, the brackets are forgotten this is not a (list of list of events).
		if (p_solver.getNumber(p_space.x, p_space.y) != null && p_solver.getNumber(p_space.x, p_space.y) != NOT_FORCED) {
			p_solver.existingNeighborsCoors(p_space.x, p_space.y).forEach(coors => {
				listPass.push([new SpaceEvent(coors.x, coors.y, LOOP_STATE.CLOSED),
						new SpaceEvent(coors.x, coors.y, LOOP_STATE.LINKED)]);
			});
		} 
		return listPass;
	}
}


function startingOrderedListPassArgumentsKoburinClosure(p_solver) {
	return function() {
		return copyCoordinatesList(p_solver.numericCoordinatesList);
	}
}

function namingCategoryPassClosure(p_solver) {
	return function (p_indexPass) {
		const x = p_indexPass.x;
		const y = p_indexPass.y;
		return x + "," + y + " (number " + p_solver.numericArray[y][x].number + ")";
	}
}