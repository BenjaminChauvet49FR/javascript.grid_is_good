const NOT_FORCED = -1;

const TURNING = {
	YES : 2,
	NO : 1,
	UNDECIDED : 0
}

LOOP_PASS_CATEGORY.REGION_DETOUR = -1;

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
	this.loopSolverConstruct( 
	{	
		setEdgeLinkedPSDeductions : setEdgeLinkedDeductionsClosure(this),
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsClosure(this),
		otherPSAtomicUndos : otherAtomicUndosClosure(this),
		otherPSAtomicDos : otherAtomicDosClosure(this),
		otherPSDeductions : otherDeductionsClosure(this),
		quickStartEventsPS : quickStartEventsClosure(this),
		generateEventsForPassPS : generateEventsForSpaceClosure(this),
		orderedListPassArgumentsPS : startingOrderedListPassArgumentsDetourClosure(this),
		namingCategoryPS : namingCategoryClosure(this),
		comparisonPS : comparisonDetourMethod,
		multipassPessimismPS : true
	});

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
	
	// Puzzle with ALL open spaces AND since this is a wall grid puzzle, also purify out-of-region spaces
	this.signalAllOpenSpaces();
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			if (p_wallArray[iy][ix].state == WALLGRID.CLOSED) {
				this.banSpace(ix, iy);
			} else {
				this.setLinkSpace(ix, iy, LOOP_STATE.LINKED); // Note : no automatic deductions for open spaces (unlike closed ones where this is needed)
			}
		}
	}
}

// -------------------
// Getters and setters

// For drawer & logs
SolverDetour.prototype.expectedNumberInRegion = function(p_ir) {
	return this.regions[p_ir].expectedNumberOfTurningsInRegion;
}

// Region to be completed yet
SolverDetour.prototype.drawIfNotFullyLinkedRegion = function(p_x, p_y) { // TODO optimiazble
	var is = 0;
	const region = this.getRegionSafe(p_x, p_y);
	if (region != null && region.forcedValue) {
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

// For drawing only (unlike Regionalin this puzzle has no player-closed space)
SolverDetour.prototype.getRegionSafe = function(p_x, p_y) {	
	const ir = this.regionArray[p_y][p_x];
	if (ir != WALLGRID.OUT_OF_REGIONS) {
		return this.regions[ir];
	}
	return null;
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

SolverDetour.prototype.emitPassRegionOrSpace = function(p_x, p_y) {
	var passIndex;
	const index = this.regionArray[p_y][p_x];
	if (index != WALLGRID.OUT_OF_REGIONS) {
		if (this.getRegion(p_x, p_y).expectedNumberOfTurningsInRegion != NOT_FORCED) {		
			passIndex = {passCategory : LOOP_PASS_CATEGORY.REGION_DETOUR, index : index};
		} else {
			passIndex = {passCategory : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y};
		}
		return this.passLoop(passIndex);
	}
}

SolverDetour.prototype.makeMultipass = function() {
	this.multipassLoop();
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
			p_eventList = p_solver.twoLinksDeductions(p_eventList, x, y);
			p_eventList = p_solver.oneOpenLinkStateDeductions(p_eventList, x, y, OppositeDirection[dir]);
			p_eventList = p_solver.linkOpenIsClosedFacingDeductions(p_eventList, x, y, OppositeDirection[dir]);
		}
		const dx = x + DeltaX[dir];
		const dy = y + DeltaY[dir];
		if (p_solver.getRegion(dx, dy).forcedValue) {			
			p_eventList = p_solver.twoLinksDeductions(p_eventList, dx, dy);
			p_eventList = p_solver.oneOpenLinkStateDeductions(p_eventList, dx, dy, dir);
			p_eventList = p_solver.linkOpenIsClosedFacingDeductions(p_eventList, dx, dy, dir);
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
		p_eventList = p_solver.monoClosedLinkStateDeductions(p_eventList, x, y, OppositeDirection[dir]);
		p_eventList = p_solver.monoClosedLinkStateDeductions(p_eventList, dx, dy, dir);
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
				p_eventList = p_solver.fillingRegionDeductions(p_eventList, region, TURNING.NO);
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
				p_eventList = p_solver.fillingRegionDeductions(p_eventList, region, TURNING.YES);
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
SolverDetour.prototype.twoLinksDeductions = function(p_eventList, p_x, p_y) {
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
SolverDetour.prototype.oneOpenLinkStateDeductions = function(p_eventList, p_x, p_y, p_direction) {
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

SolverDetour.prototype.monoClosedLinkStateDeductions = function(p_eventList, p_x, p_y, p_direction) {
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
SolverDetour.prototype.linkOpenIsClosedFacingDeductions = function(p_eventList, p_x, p_y, p_facingDirection) {
	if (!this.neighborExists(p_x, p_y, p_facingDirection) || this.getLink(p_x, p_y, p_facingDirection) == LOOP_STATE.CLOSED) {
		p_eventList.push(new TurnEvent(p_x, p_y, TURNING.YES));
	}
	return p_eventList;
}

// Filling all undecided states in the region in turningArray.
closureSpace = function(p_solver) {return function(x, y) { return p_solver.turningArray[y][x] }}
closureEvent = function(p_value) {return function(x, y) { return new TurnEvent(x, y, p_value) }}
SolverDetour.prototype.fillingRegionDeductions = function(p_eventList, p_region, p_stateToFill) {
	return this.fillingSetSpaceDeductions(p_eventList, p_region.spaces,
	closureSpace(this), TURNING.UNDECIDED,
	closureEvent(p_stateToFill) );
}

// -------------------
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function(p_QSeventsList) {
		p_QSeventsList.push({quickStartLabel : "Detour"});
		p_solver.regions.forEach(region => {
			if (region.forcedValue) {				
				if (region.notPlacedStraightYet == 0) {
					p_solver.fillingRegionDeductions([], region, TURNING.YES).forEach(event_ => {
						p_QSeventsList.push(event_);
					});
				} else if (region.notPlacedTurningYet == 0) {
					p_solver.fillingRegionDeductions([], region, TURNING.NO).forEach(event_ => {
						p_QSeventsList.push(event_);
					});
				}
			}
		});	
		return p_QSeventsList;
	}
}

// -------------------
// Pass & multipass

generateEventsForSpaceClosure = function(p_solver) {
	return function(p_index) {
		return p_solver.passCurveVSStraightRegion(p_index.index);
	}
}

function startingOrderedListPassArgumentsDetourClosure(p_solver) {
	return function() {
		var answer = [];
		for (var i = 0 ; i < p_solver.regionsNumber ; i++) {
			if (p_solver.regions[i].notPlacedStraightYet) {				
				answer.push({passCategory : LOOP_PASS_CATEGORY.REGION_DETOUR, index : i});
			}
		}
		answer.sort(function(passIndex1, passIndex2) {
			const region1 = p_solver.regions[passIndex1.index]
			const region2 = p_solver.regions[passIndex2.index]
			const v1 = region1.notPlacedTurningYet * region1.notPlacedStraightYet;
			const v2 = region2.notPlacedTurningYet * region2.notPlacedStraightYet;
			const diff = v1 - v2;
			if (diff != 0) {
				return diff;
			}
			return passIndex1.index - passIndex2.index;
		});
		return answer;
	}
}

function namingCategoryClosure(p_solver) {
	return function (p_passIndex) {
		const region = p_solver.regions[p_passIndex.index];
		const regionSpace = region.spaces[0];
		return "Region " + p_passIndex.index + " (" + regionSpace.x + "," + regionSpace.y + " ind."+ region.expectedNumberOfTurningsInRegion + ")";
	}
}

SolverDetour.prototype.passCurveVSStraightRegion = function(p_index) {
	var answer = [];
	var x, y;
	this.regions[p_index].spaces.forEach(coors => {
		x = coors.x;
		y = coors.y;
		answer.push([new TurnEvent(x, y, TURNING.YES), new TurnEvent(x, y, TURNING.NO)]);
	});
	return answer;
}

comparisonDetourMethod = function(p_event1, p_event2) {
	return commonComparison([p_event1.y, p_event1.x, p_event1.turningState], [p_event2.y, p_event2.x, p_event2.turningState]);
}