const NOT_FORCED = -1;

const TURNING = {
	YES : 2,
	NO : 1,
	UNDECIDED : 0
}

function SolverDetour(p_wallGrid, p_regionIndications) {
	LoopSolver.call(this);
	this.construct(p_wallGrid, p_regionIndications);
}

SolverDetour.prototype = Object.create(LoopSolver.prototype);
SolverDetour.prototype.constructor = SolverDetour;

function DummySolver() {
	return new SolverDetour(generateWallArray(1,1), []);
}

SolverDetour.prototype.construct = function(p_wallArray, p_regionIndications) {
    this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.loopSolverConstruct(generateWallArray(this.xLength, this.yLength), 
	{	
		setEdgeLinkedPSDeductions : setEdgeLinkedDeductionsClosure(this),
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsClosure(this),
		otherPSAtomicUndos : otherAtomicUndosClosure(this),
		otherPSAtomicDos : otherAtomicDosClosure(this),
		otherPSDeductions : otherDeductionsClosure(this),
		PSQuickStart : quickStartClosure(this)
	});
	// comparisonLoopEvents and copyLoopEventMethod defined in LoopSolver
	//this.methodSetPass = {comparisonMethod : comparisonLoopEventsMethod, copyMethod : copyLoopEventMethod,  argumentToLabelMethod : namingCategoryClosure(this)};
	//this.setMultipass = {numberPSCategories : 1, PSCategoryMethod : multiPassKoburinCategoryClosure(this), tolerateClosedSpaces : true, generatePassEventsMethod : generateEventsForSpaceClosure(this)}
	
	// Puzzle with ALL open spaces
	this.signalAllOpenSpaces();
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			// TODO : banned spaces not taken into consideraiton
			this.setLinkSpace(ix, iy, LOOP_STATE.LINKED); // Note : no automatic deductions for puzzles
		}
	}

	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();
	const spacesByRegion = listSpacesByRegion(this.regionArray);
	this.regionsNumber = spacesByRegion.length;
	this.regions = [];
	for (var ir = 0 ; ir < this.regionsNumber ; ir++) {
		this.regions.push({
			spaces : spacesByRegion[ir],
			size : spacesByRegion[ir].length,
			forcedValue : false,
			expectedNumberOfTurningsInRegion : NOT_FORCED
		});
	}
	
	this.turningArray = generateValueArray(this.xLength, this.yLength, TURNING.UNDECIDED);
	
	p_regionIndications.forEach(indic => {
		region = this.regions[indic.index];
		region.forcedValue = true;
		region.notPlacedTurningYet = indic.value;
		region.notPlacedStraightYet = region.size - indic.value;
		region.expectedNumberOfTurningsInRegion = indic.value;
	});
}

// -------------------
// Getters and setters

// For drawer & logs
SolverDetour.prototype.expectedNumberInRegion = function(p_ir) {
	return this.regions[p_ir].expectedNumberOfTurningsInRegion;
}

/*SolverDetour.prototype.spacesToBeFoundInRegionYet = function(p_x, p_y) {
	return (this.getRegion(p_x, p_y).forcedValue && this.getRegion(p_x, p_y).notPlacedStraightYet > 0);
}*/

// Region to be completed yet
SolverDetour.prototype.drawIfNotFullyLinkedRegion = function(p_x, p_y) { // TODO optimiazble
	var is = 0;
	const region = this.getRegion(p_x, p_y);
	if (region.forcedValue) {
		while(is < region.size) {
			if (this.getLinkedEdges(region.spaces[is].x, region.spaces[is].y) != 2) {
				return true;
			}
			is ++;
		}
	}
	return false;
}

SolverDetour.prototype.getSpaceCoordinates = function(p_ir, p_is) {
	return this.regions[p_ir].spaces[p_is];
}

SolverDetour.prototype.getTurning = function(p_x, p_y) {
	return this.turningArray[p_y][p_x];
}

// For intelligence (among others)
SolverDetour.prototype.getRegion = function(p_x, p_y) {
	return this.regions[this.regionArray[p_y][p_x]];
}

// -------------------
// Input methods

SolverDetour.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverDetour.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverDetour.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	//this.tryToPutNewSpace(p_x, p_y, p_state); TODO scrap this unless it's used for space
}

SolverDetour.prototype.passSpace = function(p_x, p_y) {
	//const generatedEvents = generateEventsForSpaceClosure(this)({x : p_x, y : p_y}); // Yeah, that method (returned by the closure) should have one single argument as it will be passed to multipass...
	//this.passEvents(generatedEvents, this.methodSetDeductions, this.methodSetPass, {x : p_x, y : p_y}); 
}

SolverDetour.prototype.makeMultipass = function() {
	//this.multiPass(this.methodSetDeductions, this.methodSetPass, this.setMultipass); 
}

// -------------------
// Atomic closures 

// Args : x, y, state
function otherAtomicDosClosure(p_solver) {
	return function(p_event) {
		const x = p_event.x;
		const y = p_event.y;
		const tState = p_event.turningState;
		const oldState = p_solver.turningArray[y][x];
		if (oldState == tState) {
			return EVENT_RESULT.HARMLESS;
		}
		if (oldState != TURNING.UNDECIDED) {
			return EVENT_RESULT.FAILURE;
		}
		const region = p_solver.getRegion(x, y);
		if (region.forcedValue) {			
			if (tState == TURNING.YES) {
				region.notPlacedTurningYet--;
			} else {
				region.notPlacedStraightYet--;
			}
		}
		p_solver.turningArray[y][x] = tState;
		return EVENT_RESULT.SUCCESS;
	}
}

function otherAtomicUndosClosure(p_solver) {
	return function(p_event) {
		const x = p_event.x;
		const y = p_event.y;
		const region = p_solver.getRegion(x, y);
		const tState = p_event.turningState;
		if (region.forcedValue) {
			if (tState == TURNING.YES) {
				region.notPlacedTurningYet++;
			} else {
				region.notPlacedStraightYet++;
			}
		}
		p_solver.turningArray[y][x] = TURNING.UNDECIDED;
	}
}

// -------------------
// Deduction closures
function setEdgeLinkedDeductionsClosure(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
		const x = p_eventBeingApplied.linkX;
		const y = p_eventBeingApplied.linkY;
		const dir = p_eventBeingApplied.direction;
		if (p_solver.getRegion(x, y).forcedValue) {			
			p_eventList = p_solver.deductions2Links(p_eventList, x, y);
			p_eventList = p_solver.deductions1OpenLinkState(p_eventList, x, y, OppositeDirection[dir]);
			p_eventList = p_solver.deductionsLinkOpenIsClosedFacing(p_eventList, x, y, OppositeDirection[dir]);
		}
		const dx = x + DeltaX[dir];
		const dy = y + DeltaY[dir];
		if (p_solver.getRegion(dx, dy).forcedValue) {			
			p_eventList = p_solver.deductions2Links(p_eventList, dx, dy);
			p_eventList = p_solver.deductions1OpenLinkState(p_eventList, dx, dy, dir);
			p_eventList = p_solver.deductionsLinkOpenIsClosedFacing(p_eventList, dx, dy, dir);
		}
		return p_eventList;
	}
}

function setEdgeClosedDeductionsClosure(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
		const x = p_eventBeingApplied.linkX;
		const y = p_eventBeingApplied.linkY;
		const dir = p_eventBeingApplied.direction;
		const dx = x + DeltaX[dir];
		const dy = y + DeltaY[dir];
		p_eventList = p_solver.deductions1ClosedLinkState(p_eventList, x, y, OppositeDirection[dir]);
		p_eventList = p_solver.deductions1ClosedLinkState(p_eventList, dx, dy, dir);
		return p_eventList;
	}
}

function otherDeductionsClosure(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const region = p_solver.getRegion(x, y);
		if (p_eventBeingApplied.turningState == TURNING.YES) { // Supposed to turn
			if (region.forcedValue && region.notPlacedTurningYet == 0) {				
				p_eventList = p_solver.deductionsFillingRegion(p_eventList, region, TURNING.NO);
			}
			KnownDirections.forEach(dir => {
				if (!p_solver.neighborExists(x, y, dir) || p_solver.getLink(x, y, dir) == LOOP_STATE.CLOSED) {
					if (p_solver.neighborExists(x, y, OppositeDirection[dir])) {					
						p_eventList.push(new LinkEvent(x, y, OppositeDirection[dir], LOOP_STATE.LINKED));
					}
				}
				if (p_solver.neighborExists(x, y, dir) && p_solver.getLink(x, y, dir) == LOOP_STATE.LINKED) { // Deductions from turning/straight state and closed link are great, but let's not forget about linked links too...
					if (p_solver.neighborExists(x, y, OppositeDirection[dir])) {
						p_eventList.push(new LinkEvent(x, y, OppositeDirection[dir], LOOP_STATE.CLOSED));
					}
				}
			});
		} else { // Straight line
			if (region.forcedValue && region.notPlacedStraightYet == 0) {				
				p_eventList = p_solver.deductionsFillingRegion(p_eventList, region, TURNING.YES);
			}
			KnownDirections.forEach(dir => {
				if (!p_solver.neighborExists(x, y, dir) || p_solver.getLink(x, y, dir) == LOOP_STATE.CLOSED) {
					if (p_solver.neighborExists(x, y, OppositeDirection[dir])) {
						p_eventList.push(new LinkEvent(x, y, OppositeDirection[dir], LOOP_STATE.CLOSED));
					}
				}
				if (p_solver.neighborExists(x, y, dir) && p_solver.getLink(x, y, dir) == LOOP_STATE.LINKED) {
					if (p_solver.neighborExists(x, y, OppositeDirection[dir])) {
						p_eventList.push(new LinkEvent(x, y, OppositeDirection[dir], LOOP_STATE.LINKED));
					}
				}
			});
		}
		return p_eventList;
	}
}

// Check if the space has 2 links and if so, performs deductions on turningArray
SolverDetour.prototype.deductions2Links = function(p_eventList, p_x, p_y) {
	if (this.getLinkedEdges(p_x, p_y) == 2) {
		const dir1 = this.grid[p_y][p_x].chains[0];
		const dir2 = this.grid[p_y][p_x].chains[1];
		if (dir1 == OppositeDirection[dir2]) {
			p_eventList.push(new TurnEvent(p_x, p_y, TURNING.NO));
		} else {
			p_eventList.push(new TurnEvent(p_x, p_y, TURNING.YES));
		}
	}
	return p_eventList;
}

// When a link has been opened/closed at the direction OPPOSITE TO p_direction
SolverDetour.prototype.deductions1OpenLinkState = function(p_eventList, p_x, p_y, p_direction) {
	if (this.neighborExists(p_x, p_y, p_direction)) {
		if (this.turningArray[p_y][p_x] == TURNING.YES) {
			p_eventList.push(new LinkEvent(p_x, p_y, p_direction, LOOP_STATE.CLOSED));
		}	
		if (this.turningArray[p_y][p_x] == TURNING.NO) {
			p_eventList.push(new LinkEvent(p_x, p_y, p_direction, LOOP_STATE.LINKED));
		}
	}
	return p_eventList;
}

SolverDetour.prototype.deductions1ClosedLinkState = function(p_eventList, p_x, p_y, p_direction) {
	if (this.neighborExists(p_x, p_y, p_direction)) {
		if (this.turningArray[p_y][p_x] == TURNING.YES) {
			p_eventList.push(new LinkEvent(p_x, p_y, p_direction, LOOP_STATE.LINKED));
		}	
		if (this.turningArray[p_y][p_x] == TURNING.NO) {
			p_eventList.push(new LinkEvent(p_x, p_y, p_direction, LOOP_STATE.CLOSED));
		}
	}
	return p_eventList;
}

// Edge is linked. Is facing direction closed ? If yes, space is turning !
SolverDetour.prototype.deductionsLinkOpenIsClosedFacing = function(p_eventList, p_x, p_y, p_facingDirection) {
	if (!this.neighborExists(p_x, p_y, p_facingDirection) || this.getLink(p_x, p_y, p_facingDirection) == LOOP_STATE.CLOSED) {
		p_eventList.push(new TurnEvent(p_x, p_y, TURNING.YES));
	}
	return p_eventList;
}

// Filling all undecided states in the region in turningArray.
closureSpace = function(p_solver) {return function(x, y) { return p_solver.turningArray[y][x] }}
closureEvent = function(p_value) {return function(x, y) { return new TurnEvent(x, y, p_value) }}
SolverDetour.prototype.deductionsFillingRegion = function(p_eventList, p_region, p_stateToFill) {
	return this.deductionsFillingSetSpace(p_eventList, p_region.spaces,
	closureSpace(this), TURNING.UNDECIDED,
	closureEvent(p_stateToFill) );
}

// -------------------
// Quickstart

quickStartClosure = function(p_solver) {
	return function() { 
		p_solver.initiateQuickStart("Detour");
		p_solver.regions.forEach(region => {
			if (region.forcedValue) {				
				if (region.notPlacedStraightYet == 0) {
					p_solver.deductionsFillingRegion([], region, TURNING.YES).forEach(event_ => {
						p_solver.tryToApplyHypothesis(event_, p_solver.methodSetDeductions);
					});
				} else if (region.notPlacedTurningYet == 0) {
					p_solver.deductionsFillingRegion([], region, TURNING.NO).forEach(event_ => {
						p_solver.tryToApplyHypothesis(event_, p_solver.methodSetDeductions);
					});
				}
			}
		});
		p_solver.terminateQuickStart();
	}
}

// -------------------
// Passing

/*generateEventsForSpaceClosure = function(p_solver) {
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
		} else {
			return p_solver.standardSpacePassEvents(p_space.x, p_space.y);
		}
		return [];
	}
}*/

function namingCategoryClosure(p_solver) { // TODO factorize with other solvers that pass spaces
	return function (p_space) {
		/*const x = p_space.x;
		const y = p_space.y;
		var answer = x+","+y;
		if (p_solver.getNumber(x,y) != null) {
			answer += " ("+p_solver.getNumber(x,y)+")";
		}
		return answer;*/
		return "";
	}
}
/*
// -------------------
// Multipass

multiPassKoburinCategoryClosure = function(p_solver) {
	return function (p_x, p_y) {
		if ((p_solver.getNumber(p_x, p_y) != null) && (p_solver.numericArray[p_y][p_x].notClosedYet > 0)) {
			return 0;
		} else {
			return -1;
		}
	}
} */

// -------------------

// Log of the numerical grid
// TODO (see LoopSolver's other logOppositeEnd or Koburin's)