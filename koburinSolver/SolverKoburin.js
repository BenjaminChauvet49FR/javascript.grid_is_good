function SolverKoburin(p_symbolGrid) {
	LoopSolver.call(this);
	this.construct(p_symbolGrid);
}

SolverKoburin.prototype = Object.create(LoopSolver.prototype);
SolverKoburin.prototype.constructor = SolverKoburin;

SolverKoburin.prototype.construct = function(p_numberGrid) {
    this.xLength = p_numberGrid[0].length;
	this.yLength = p_numberGrid.length;
	this.loopSolverConstruct(generateWallArray(this.xLength, this.yLength), {});
	this.activateClosedSpaces();
	this.setPuzzleSpecificMethods({
		setSpaceLinkedPSAtomicDos : setSpaceLinkedPSAtomicDosClosure(this),
		setSpaceClosedPSAtomicDos : setSpaceClosedPSAtomicDosClosure(this),
		setSpaceLinkedPSAtomicUndos : setSpaceLinkedPSAtomicUndosClosure(this),
		setSpaceClosedPSAtomicUndos : setSpaceClosedPSAtomicUndosClosure(this),
		setSpaceLinkedPSDeductions : setSpaceLinkedPSDeductionsClosure(this),
		setSpaceClosedPSDeductions : setSpaceClosedPSDeductionsClosure(this),
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsClosure(this)
	});
	// comparisonLoopEvents and copyLoopEventMethod defined in LoopSolver
	this.methodSetPass = {comparisonMethod : comparisonLoopEventsMethod, copyMethod : copyLoopEventMethod,  argumentToLabelMethod : namingCategoryClosure(this)};
	this.setMultipass = {numberPSCategories : 1, PSCategoryMethod : multiPassKoburinCategoryClosure(this), tolerateClosedSpaces : true, generatePassEventsMethod : generateEventsForSpaceClosure(this)}
	this.numericGrid = [];
	this.neighborsNumbersGrid = []; // All coordinates contained in this grid are coordinates of numeric spaces.
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		this.neighborsNumbersGrid.push([]);
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			this.neighborsNumbersGrid[iy].push([]);
		}
	}
	
	this.numericCoordinatesList = []; // List of coordinates of numeric spaces
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		this.numericGrid.push([]);
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			if (p_numberGrid[iy][ix] != null) {
				this.numericCoordinatesList.push({x : ix, y : iy});
				this.numericGrid[iy].push({number : p_numberGrid[iy][ix], notClosedYet : p_numberGrid[iy][ix], notLinkedYet : 4-p_numberGrid[iy][ix]});
				if (ix > 0) {
					this.neighborsNumbersGrid[iy][ix-1].push({x : ix, y : iy});
				}
				if (iy > 0) {
					this.neighborsNumbersGrid[iy-1][ix].push({x : ix, y : iy});
				}
				if (ix <= this.xLength-2) {
					this.neighborsNumbersGrid[iy][ix+1].push({x : ix, y : iy});
				} 
				if (iy <= this.yLength-2) {
					this.neighborsNumbersGrid[iy+1][ix].push({x : ix, y : iy});
				}
            } else {
				this.numericGrid[iy].push({number : null});
			}
		}
	}
	// In this puzzle, banning has an impact on numbers spaces
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			if (this.getNumber(ix, iy) != null) {
				this.banSpace(ix, iy);
			}
		}
	}
	// Clearing the space edges on the grid edges
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		if (this.getNumber(0, iy) != null) {
			this.numericGrid[iy][0].notLinkedYet--;
		}
		if (this.getNumber(this.xLength-1, iy) != null) {
			this.numericGrid[iy][this.xLength-1].notLinkedYet--;
		}
	}
	for (var ix = 0 ; ix < this.xLength ; ix++) {
		if (this.getNumber(ix, 0) != null) {
			this.numericGrid[0][ix].notLinkedYet--;
		}
		if (this.getNumber(ix, this.yLength-1) != null) {
			this.numericGrid[this.yLength-1][ix].notLinkedYet--;
		}
	}
}

// -------------------
// Getters and setters

SolverKoburin.prototype.getNumber = function(p_x, p_y) {
	return this.numericGrid[p_y][p_x].number;
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
	const generatedEvents = generateEventsForSpaceClosure(this)({x : p_x, y : p_y}); // Yeah, that method (returned by the closure) should have one single argument as it will be passed to multipass...
	this.passEvents(generatedEvents, this.methodSetDeductions, this.methodSetPass, {x : p_x, y : p_y}); 
}

SolverKoburin.prototype.quickStart = function() { //Warning : this quickstart assumes that the puzzle does not have white pearls in corners
	this.initiateQuickStart();
	this.numericCoordinatesList.forEach(space => {
		const list = this.testNumericSpace([], space.x, space.y);
		list.forEach(p_event => {
			this.tryToPutNewSpace(p_event.x, p_event.y, p_event.state);
		});
	});
	this.terminateQuickStart();
}

SolverKoburin.prototype.makeMultipass = function() {
	this.multiPass(this.methodSetDeductions, this.methodSetPass, this.setMultipass); 
}

// -------------------
// Atomic closures 

function setSpaceLinkedPSAtomicDosClosure(p_solver) {
	return function(p_space) {
		p_solver.neighborsNumbersGrid[p_space.y][p_space.x].forEach(neighborSpace => {
			p_solver.numericGrid[neighborSpace.y][neighborSpace.x].notLinkedYet--;
		});
	}
}

function setSpaceClosedPSAtomicDosClosure(p_solver) {
	return function(p_space) {
		p_solver.neighborsNumbersGrid[p_space.y][p_space.x].forEach(neighborSpace => {
			p_solver.numericGrid[neighborSpace.y][neighborSpace.x].notClosedYet--;
		});
	}
}

function setSpaceLinkedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		p_solver.neighborsNumbersGrid[p_space.y][p_space.x].forEach(neighborSpace => {
			p_solver.numericGrid[neighborSpace.y][neighborSpace.x].notLinkedYet++;
		});
	}
}

function setSpaceClosedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		p_solver.neighborsNumbersGrid[p_space.y][p_space.x].forEach(neighborSpace => {
			p_solver.numericGrid[neighborSpace.y][neighborSpace.x].notClosedYet++;
		});
	}
}

// -------------------
// Closure deduction

function setSpaceClosedPSDeductionsClosure(p_solver) {
	return function(p_listEvents, p_eventToApply) {
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		[LOOP_DIRECTION.LEFT, LOOP_DIRECTION.UP, LOOP_DIRECTION.RIGHT, LOOP_DIRECTION.DOWN].forEach(dir => {
			if (p_solver.neighborExists(x, y, dir) && !p_solver.isBanned(x+deltaX[dir], y+deltaY[dir])) {
				p_listEvents.push(new StateEvent(x+deltaX[dir], y+deltaY[dir], LOOP_STATE.LINKED));
			}
		});
		p_solver.neighborsNumbersGrid[y][x].forEach(space => {
			p_listEvents = p_solver.testNumericSpace(p_listEvents, space.x, space.y);
		});
		return p_listEvents;
	}
}

function setSpaceLinkedPSDeductionsClosure(p_solver) {
	return function(p_listEvents, p_eventToApply) {
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		p_solver.neighborsNumbersGrid[y][x].forEach(space => {
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
		const dx = p_eventToApply.linkX + deltaX[dir];
		const dy = p_eventToApply.linkY + deltaY[dir];
		if (this.getClosedEdges(x, y) == 2) {
			[LOOP_DIRECTION.LEFT, LOOP_DIRECTION.UP, LOOP_DIRECTION.RIGHT, LOOP_DIRECTION.DOWN].forEach(dir => {
				if (p_solver.neighborExists(x, y, dir) && p_solver.getLink(x, y, dir) != LOOP_STATE.CLOSED) {
					p_listEvents.push(new StateEvent(x+deltaX[dir], y+deltaY[dir], LOOP_STATE.LINKED));
				}
			});
		}
		if (this.getClosedEdges(dx, dy) == 2) {
			[LOOP_DIRECTION.LEFT, LOOP_DIRECTION.UP, LOOP_DIRECTION.RIGHT, LOOP_DIRECTION.DOWN].forEach(dir => {
				if (p_solver.neighborExists(dx, dy, dir) && p_solver.getLink(dx, dy, dir) != LOOP_STATE.CLOSED) {
					p_listEvents.push(new StateEvent(dx+deltaX[dir], dy+deltaY[dir], LOOP_STATE.LINKED));
				}
			});
		}
		return p_listEvents;
	}
}

// Precondition : p_x, p_y is a numeric space
SolverKoburin.prototype.testNumericSpace = function(p_listEvents, p_x, p_y) {
	if (this.numericGrid[p_y][p_x].notClosedYet == 0) {
		[LOOP_DIRECTION.LEFT, LOOP_DIRECTION.UP, LOOP_DIRECTION.RIGHT, LOOP_DIRECTION.DOWN].forEach(dir => {
			if (this.neighborExists(p_x, p_y, dir) && this.getLinkSpace(p_x+deltaX[dir], p_y+deltaY[dir], dir) != LOOP_STATE.CLOSED) {
				p_listEvents.push(new StateEvent(p_x+deltaX[dir], p_y+deltaY[dir], LOOP_STATE.LINKED));
			}
		});
	} else if (this.numericGrid[p_y][p_x].notLinkedYet == 0) {
		[LOOP_DIRECTION.LEFT, LOOP_DIRECTION.UP, LOOP_DIRECTION.RIGHT, LOOP_DIRECTION.DOWN].forEach(dir => {
			if (this.neighborExists(p_x, p_y, dir) && this.getLinkSpace(p_x+deltaX[dir], p_y+deltaY[dir], dir) != LOOP_STATE.LINKED) {
				p_listEvents.push(new StateEvent(p_x+deltaX[dir], p_y+deltaY[dir], LOOP_STATE.CLOSED));
			}
		});
	}
	return p_listEvents;
}

// -------------------
// Passing

generateEventsForSpaceClosure = function(p_solver) {
	return function(p_space) {
		if (p_solver.getNumber(p_space.x, p_space.y) != null) {
			var answer = [];
			if (p_space.x > 0) {
				answer.push([new StateEvent(p_space.x-1, p_space.y, LOOP_STATE.CLOSED),new StateEvent(p_space.x-1, p_space.y, LOOP_STATE.LINKED)]);
			}
			if (p_space.y > 0) {				
				answer.push([new StateEvent(p_space.x, p_space.y-1, LOOP_STATE.CLOSED),new StateEvent(p_space.x, p_space.y-1, LOOP_STATE.LINKED)]);
			}
			if (p_space.x <= p_solver.xLength-2) {
				answer.push([new StateEvent(p_space.x+1, p_space.y, LOOP_STATE.CLOSED),new StateEvent(p_space.x+1, p_space.y, LOOP_STATE.LINKED)]);
			}
			if (p_space.y <= p_solver.yLength-2) {	
				answer.push([new StateEvent(p_space.x, p_space.y+1, LOOP_STATE.CLOSED),new StateEvent(p_space.x, p_space.y+1, LOOP_STATE.LINKED)]);
			}
			return answer; // If the first events of the lists are applied in a glutton-algorithm style (here, closed in up and closed in left around a numeric space with value 2) are applied, the brackets are forgotten this is not a (list of list of events).
		} else {
			return p_solver.standardSpacePassEvents(p_space.x, p_space.y);
		}
		return [];
	}
}

function namingCategoryClosure(p_solver) { // TODO factorize with other solvers that pass spaces
	return function (p_space) {
		const x = p_space.x;
		const y = p_space.y;
		var answer = x+","+y;
		if (p_solver.getNumber(x,y) != null) {
			answer += " ("+p_solver.getNumber(x,y)+")";
		}
		return answer;
	}
}

// -------------------
// Multipass

multiPassKoburinCategoryClosure = function(p_solver) {
	return function (p_x, p_y) {
		if ((p_solver.getNumber(p_x, p_y) != null) && (p_solver.numericGrid[p_y][p_x].notClosedYet > 0)) {
			return 0;
		} else {
			return -1;
		}
	}
}

// -------------------
// Log of the numerical grid (copied on LoopSolver's other logOppositeEnd)

LoopSolver.prototype.logNumericGrid = function(p_xStart = 0, p_yStart = 0, p_xEnd, p_yEnd) {
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
			numeric = this.numericGrid[iy][ix];
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
