// Initialization

const NOT_FORCED = -1; 

function SolverKuromasu(p_wallArray, p_isCorral) {
	GeneralSolver.call(this);
	this.construct(p_wallArray, p_isCorral);
}

SolverKuromasu.prototype = Object.create(GeneralSolver.prototype);
SolverKuromasu.prototype.constructor = SolverKuromasu;

function DummySolver() {
	return new SolverKuromasu([[null]]);
}

SolverKuromasu.prototype.construct = function(p_numbersXArray, p_isCorral) {
	this.generalConstruct();
	this.xLength = p_numbersXArray[0].length;
	this.yLength = p_numbersXArray.length;
	this.isCorral = p_isCorral;
	this.methodsSetPass = {
		comparisonMethod : comparison, 
		copyMethod : copying, 
		argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsSetMultiPass = {
		generatePassEventsMethod : generateEventsForSpacePassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		//skipPassMethod : skipPassClosure(this)
	};
	this.makeItGeographical(this.xLength, this.yLength, new ApplyEventMethodGeographicalPack(
			applyEventClosure(this), 
			deductionsClosure(this), 
			adjacencyClosure(this), 
			transformClosure(this), 
			undoEventClosure(this)));

	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filtersUpdateMinsFromNewlyOpenSpaces(this), filtersMinMaxClosure(this), filterCorralClosure(this)]);
	// Note : may be optimized with adding the last filter depending on this.isCorral

	this.answerArray = generateValueArray(this.xLength, this.yLength, ADJACENCY.UNDECIDED);
	this.closedAdjacentOutsideArray = generateValueArray(this.xLength, this.yLength, false);
	this.numericArray = [];
	this.rangedSpacesCoors =  [];
	
	var ix, iy;
	for (iy = 0 ; iy < p_numbersXArray.length ; iy++) {
		this.numericArray.push([]);
		for (ix = 0 ; ix < p_numbersXArray[iy].length ; ix++) {
			if (p_numbersXArray[iy][ix] != null) {
				this.answerArray[iy][ix] = ADJACENCY.YES;
				this.numericArray[iy].push({
					number : parseInt(p_numbersXArray[iy][ix], 10),
					closestRanged : [null, null, null, null], // Index of closed space other than itself. Rather than coordinates, indexes are fine, since we don't have to separate x and y
					mins : [0, 0, 0, 0],
					maxs : [0, 0, 0, 0],
					backedMins : [[], [], [], []],
					backedMaxs : [[], [], [], []],
					bounds : [false, false, false, false],
					index : this.rangedSpacesCoors.length
				});				
				this.rangedSpacesCoors.push({x : ix, y : iy});
			} else {
				this.numericArray[iy].push({
					number : null,
					closestRanged : [null, null, null, null]
				});
			}
		}
	}
	
	var x, y, odir;
	// Define closest left/up/right/down
	// Setup maxs relative to edges (but not relative to numbers too close : it will be the job of Quickstart !)
	// And setup mins if several numbers in a row are put. 
	// And make binds as well.
	for (var i = 0 ; i < this.rangedSpacesCoors.length ; i++) {
		ix = this.rangedSpacesCoors[i].x;
		iy = this.rangedSpacesCoors[i].y;
		[DIRECTION.LEFT, DIRECTION.RIGHT].forEach(dir => {
			odir = OppositeDirection[dir];
			y = iy;
			// Closest
			x = ix + DeltaX[dir];
			while(this.testExistingCoordinate(x, dir) && this.getNumber(x, y) == null) {
				this.numericArray[y][x].closestRanged[odir] = i;
				x += DeltaX[dir];
			}
			if (this.testExistingCoordinate(x, dir)) {
				this.numericArray[y][x].closestRanged[odir] = i;
			}
			// Mins
			x = ix + DeltaX[dir];
			while(this.testExistingCoordinate(x, dir) && this.getNumber(x, y) != null) {
				this.numericArray[iy][ix].mins[dir]++;
				this.numericArray[y][x].bounds[odir] = true; // Will also be set to true the opposite way
				x += DeltaX[dir];
			}
		});
		[DIRECTION.UP, DIRECTION.DOWN].forEach(dir => {
			odir = OppositeDirection[dir];
			x = ix;
			// Closest
			y = iy + DeltaY[dir];
			while(this.testExistingCoordinate(y, dir) && this.getNumber(x, y) == null) {
				this.numericArray[y][x].closestRanged[odir] = i;
				y += DeltaY[dir];
			}
			if (this.testExistingCoordinate(y, dir)) {
				this.numericArray[y][x].closestRanged[odir] = i;
			}
			// Mins
			y = iy + DeltaY[dir];
			while(this.testExistingCoordinate(y, dir) && this.getNumber(x, y) != null) {
				this.numericArray[iy][ix].mins[dir]++;
				this.numericArray[y][x].bounds[odir] = true; // Will also be set to true the opposite way
				y += DeltaY[dir];
			}
		});
		
		this.numericArray[iy][ix].maxs[DIRECTION.LEFT] = ix;
		this.numericArray[iy][ix].maxs[DIRECTION.UP] = iy;
		this.numericArray[iy][ix].maxs[DIRECTION.RIGHT] = this.xLength - ix - 1;
		this.numericArray[iy][ix].maxs[DIRECTION.DOWN] = this.yLength - iy - 1;
	}
	
	this.checkerNewlyOpenSpaces = new CheckCollection(this.rangedSpacesCoors.length);
	this.checkerUpdatedMinMax = new CheckCollection(this.rangedSpacesCoors.length);
	if (this.isCorral) {		
		this.checkerAdjacencyNewlyOpen = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
		this.checkerAdjacencyClustersFreeClosed = new CheckCollectionDoubleEntryGeneric(this.xLength, this.yLength, null);
	}
	
	this.declarationsOpenAndClosed();
}

//--------------------------------

// Misc. methods
SolverKuromasu.prototype.getAnswer = function(p_x, p_y) {
	return this.answerArray[p_y][p_x];
}

SolverKuromasu.prototype.getNumber = function(p_x, p_y) {
	return this.numericArray[p_y][p_x].number;
}

function distanceAligned(coors1, coors2) {
	return Math.abs(coors2.y - coors1.y) + Math.abs(coors2.x - coors1.x);
}

SolverKuromasu.prototype.getRangedSpace = function(p_index) {
	const coors = this.rangedSpacesCoors[p_index];
	return this.numericArray[coors.y][coors.x];
}

//--------------------------------

// Input methods
SolverKuromasu.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	this.tryToPutNew(p_x, p_y, p_symbol);
}

SolverKuromasu.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverKuromasu.prototype.quickStart = function() {
	this.initiateQuickStart();
	var space;
	var listEvents;
	// TODO more can be done
	
	// For each ranged space, apply a min ranged event equal to the space itself (it should add a good part, if not all, of ranged spaces into the filters)
	this.rangedSpacesCoors.forEach(coors => {
		space = this.numericArray[coors.y][coors.x];
		KnownDirections.forEach(dir => {
			this.tryToApplyHypothesis(new MinRangeEvent(coors.x, coors.y, dir, space.number));
		});
	});
	// Mins and maxes
	var listEvents;
	for (var i = 0 ; i < this.rangedSpacesCoors.length ; i++) {
		listEvents = this.deductionsSumsMinMax([], this.rangedSpacesCoors[i].x, this.rangedSpacesCoors[i].y);
		listEvents.forEach(event_ => {this.tryToApplyHypothesis(event_) } );
	}
	this.terminateQuickStart();
}

SolverKuromasu.prototype.emitPassSpace = function(p_x, p_y) {
	const number = this.getNumber(p_x, p_y);
	if (number != null) {		
		const generatedEvents = this.generateEventsRangedDynamicPass(p_x, p_y, number);
		this.passEvents(generatedEvents, this.methodsSetDeductions, this.methodsSetPass, {x : p_x, y : p_y, number : number}); 
	} else {
		const generatedEvents = this.generateEventsSinglePass(p_x, p_y);
		this.passEvents(generatedEvents, this.methodsSetDeductions, this.methodsSetPass, {x : p_x, y : p_y}); 
	}
}

SolverKuromasu.prototype.makeMultiPass = function() {
	this.multiPass(this.methodsSetMultiPass);
}

//--------------------------------

// Central method

SolverKuromasu.prototype.tryToPutNew = function (p_x, p_y, p_symbol) {
	this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_symbol));
}

//--------------------------------

// Doing and undoing
SolverKuromasu.prototype.applyFillSpace = function(p_x, p_y, p_symbol) {
	if (this.answerArray[p_y][p_x] == p_symbol) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[p_y][p_x] != ADJACENCY.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerArray[p_y][p_x] = p_symbol;
	if (p_symbol == ADJACENCY.YES) {
		var index;
		KnownDirections.forEach(dir => {
			index = this.numericArray[p_y][p_x].closestRanged[dir];
			if (index != null) {				
				this.checkerNewlyOpenSpaces.add(index);
			}
		});
		if (this.isCorral) {
			this.existingNeighborsCoorsDirections(p_x, p_y).forEach(coorsDir => {
				this.checkerAdjacencyNewlyOpen.add(coorsDir.x, coorsDir.y);
			});
		}
	}
	return EVENT_RESULT.SUCCESS;
}

SolverKuromasu.prototype.applyRangeMin = function(p_x, p_y, p_direction, p_value) {
	const numericSpace = this.numericArray[p_y][p_x]
	if (p_value > numericSpace.maxs[p_direction]) {
		return EVENT_RESULT.FAILURE;
	}
	const formerMin = numericSpace.mins[p_direction];
	if (formerMin != null && p_value <= formerMin) {
		return EVENT_RESULT.HARMLESS;
	} 
	numericSpace.backedMins[p_direction].push(formerMin);
	numericSpace.mins[p_direction] = p_value;
	this.checkerUpdatedMinMax.add(numericSpace.index);
	return EVENT_RESULT.SUCCESS;
}

SolverKuromasu.prototype.applyRangeMax = function(p_x, p_y, p_direction, p_value) {
	const numericSpace = this.numericArray[p_y][p_x];
	if (p_value < numericSpace.mins[p_direction]) {
		return EVENT_RESULT.FAILURE;
	}
	const formerMax = numericSpace.maxs[p_direction];
	if (formerMax != null && p_value >= formerMax) {
		return EVENT_RESULT.HARMLESS;
	} 
	numericSpace.backedMaxs[p_direction].push(formerMax); // Even a "null" value is stored, but when undoing it will be popped
	numericSpace.maxs[p_direction] = p_value;
	this.checkerUpdatedMinMax.add(numericSpace.index);
	return EVENT_RESULT.SUCCESS;
}

SolverKuromasu.prototype.applyBindSpaces = function(p_x, p_y, p_direction) { // Note : I was about to make this event symetrical (e.g. also create) but then it would have been troublesome with copying/comparing events
	const numericSpace = this.numericArray[p_y][p_x];
	if (numericSpace.bounds[p_direction]) {
		return EVENT_RESULT.HARMLESS;
	} else {
		numericSpace.bounds[p_direction] = true;
		return EVENT_RESULT.SUCCESS;
	}
}

SolverKuromasu.prototype.applyClosedAdjacentOutsideArray = function(p_x, p_y) {
	if (!this.closedAdjacentOutsideArray[p_y][p_x]) {
		this.closedAdjacentOutsideArray[p_y][p_x] = true;
		return EVENT_RESULT.SUCCESS;
	}
	return EVENT_RESULT.HARMLESS;
}

applyEventClosure = function(p_solver) {
	return function(eventToApply) {
		switch (eventToApply.kind) {	
			case KIND_EVENT.SPACE :	return p_solver.applyFillSpace(eventToApply.x(), eventToApply.y(), eventToApply.symbol); break;
			case KIND_EVENT.RANGE_MIN : return p_solver.applyRangeMin(eventToApply.x, eventToApply.y, eventToApply.direction, eventToApply.min); break;
			case KIND_EVENT.RANGE_MAX : return p_solver.applyRangeMax(eventToApply.x, eventToApply.y, eventToApply.direction, eventToApply.max); break;
			case KIND_EVENT.BIND : return p_solver.applyBindSpaces(eventToApply.x, eventToApply.y, eventToApply.direction); break;
			case KIND_EVENT.CLOSED_ADJACENT_OUTSIDE : return p_solver.applyClosedAdjacentOutsideArray(eventToApply.x, eventToApply.y); break;
		}
	}
}

undoEventClosure = function(p_solver) {
	return function(eventToApply) {
		var x, y, index, symbol, numericSpace;
		switch(eventToApply.kind) {
			case KIND_EVENT.SPACE : 
				x = eventToApply.x(); 
				y = eventToApply.y();
				symbol = eventToApply.symbol;
				p_solver.answerArray[y][x] = ADJACENCY.UNDECIDED; 
			break;
			case KIND_EVENT.CLOSED_ADJACENT_OUTSIDE : 
				p_solver.closedAdjacentOutsideArray[eventToApply.y][eventToApply.x] = false;
			break;
			case KIND_EVENT.RANGE_MIN : 
				dir = eventToApply.direction;
				numericSpace = p_solver.numericArray[eventToApply.y][eventToApply.x];
				numericSpace.mins[dir] = numericSpace.backedMins[dir].pop();
			break;
			case KIND_EVENT.RANGE_MAX : 
				dir = eventToApply.direction;
				numericSpace = p_solver.numericArray[eventToApply.y][eventToApply.x];
				numericSpace.maxs[dir] = numericSpace.backedMaxs[dir].pop();
			break;
			case KIND_EVENT.BIND : 
				numericSpace = p_solver.numericArray[eventToApply.y][eventToApply.x];
				numericSpace.bounds[eventToApply.direction] = false;
			break; 
		}
	}
}

//--------------------------------
// Exchanges solver and geographical

/**
Transforms a geographical deduction (see dedicated class GeographicalDeduction) into an appropriate event (SolveEvent in our case)
*/
transformClosure = function (p_solver) {
    return function (p_geographicalDeduction) {
		return new SpaceEvent(p_geographicalDeduction.x, p_geographicalDeduction.y, p_geographicalDeduction.opening);
    }
};

adjacencyClosure = function (p_solver) {
    return function (p_x, p_y) {
        return p_solver.answerArray[p_y][p_x];
    }
}

//--------------------------------
// Deductions

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const kind = p_eventBeingApplied.kind;
		if (kind == KIND_EVENT.SPACE) {
			var x = p_eventBeingApplied.x();
			var y = p_eventBeingApplied.y();
			symbol = p_eventBeingApplied.symbol;

			if (symbol == ADJACENCY.NO) {
				if (!p_solver.isCorral) {
					// Not corral : close adjacent spaces
					p_solver.existingNeighborsCoorsDirections(x, y).forEach(coors => {
						p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, ADJACENCY.YES));
					});
				} else {
					// Corral : make sure there is no 2x2 square in checkerboard
					p_listEventsToApply = p_solver.deductionsNoCheckers(p_listEventsToApply, x, y,  ADJACENCY.NO);
					// Free closed spaces ?
					KnownDirections.forEach(dir => {
						if (!p_solver.neighborExists(x, y, dir) || p_solver.closedAdjacentOutsideArray[y + DeltaY[dir]][x + DeltaX[dir]] == true) {
							p_listEventsToApply.push(new ClosedAdjacentOutsideEvent(x, y));
						}
					});
				}
				// Transfer max to left/up/right/down if relevant without caring if bound or not (warning : lots of redundant events created)
				var index;
				var coors;
				KnownDirections.forEach(dir => {
					index = p_solver.numericArray[y][x].closestRanged[dir];
					while (index != null) {						
						coors = p_solver.rangedSpacesCoors[index];
						p_listEventsToApply.push(new MaxRangeEvent(coors.x, coors.y, OppositeDirection[dir], Math.abs(x - coors.x) + Math.abs(y - coors.y) - 1));
						index = p_solver.numericArray[coors.y][coors.x].closestRanged[dir];
					}
				});
			} else {
				// should be warned about min to left/up/right/down, so... work will be in filter
				// Corral : make sure there is no 2x2 square in checkerboard
				if (p_solver.isCorral) {
					p_listEventsToApply = p_solver.deductionsNoCheckers(p_listEventsToApply, x, y, ADJACENCY.YES);
				}
			}
		} else if (kind == KIND_EVENT.RANGE_MAX) {
			// If max == min in that direction : add a closed space 
			const dir = p_eventBeingApplied.direction;
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			p_listEventsToApply = p_solver.deductionsTestMinEqualsMax(p_listEventsToApply, x, y, dir);
			// Synchronize max in bind orientation
			p_listEventsToApply = p_solver.deductionsTestBindSynchronizeMinMax(p_listEventsToApply, x, y, dir, dir, false);
			p_listEventsToApply = p_solver.deductionsTestBindSynchronizeMinMax(p_listEventsToApply, x, y, OppositeDirection[dir], dir, false);
		} else if (kind == KIND_EVENT.RANGE_MIN) {
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			const dir = p_eventBeingApplied.direction;
			// If max == min in that direction : add a closed space 
			p_listEventsToApply = p_solver.deductionsTestMinEqualsMax(p_listEventsToApply, x, y, dir);
			// Synchronize min in bind orientation
			p_listEventsToApply = p_solver.deductionsTestBindSynchronizeMinMax(p_listEventsToApply, x, y, dir, dir, true);
			p_listEventsToApply = p_solver.deductionsTestBindSynchronizeMinMax(p_listEventsToApply, x, y, OppositeDirection[dir], dir, true);
			// Add open spaces
			const backedMins = p_solver.numericArray[y][x].backedMins[dir];
			const formerMin = backedMins[backedMins.length-1];
			const newMin = p_eventBeingApplied.min;
			var xx = x + formerMin * DeltaX[dir];
			var yy = y + formerMin * DeltaY[dir];
			for (var i = formerMin + 1 ; i <= newMin ; i++) {
				xx += DeltaX[dir];
				yy += DeltaY[dir];
				p_listEventsToApply.push(new SpaceEvent(xx, yy, ADJACENCY.YES));
			}
			// If min reaches in that direction, bind the spaces
			const index2 = p_solver.numericArray[y][x].closestRanged[dir];
			if (index2 != null) {
				const coors2 = p_solver.rangedSpacesCoors[index2];
				if (distanceAligned(coors2, {x : x, y : y}) <= newMin) {
					p_listEventsToApply.push(new BindEvent(x, y, dir));
				}
			}
		} else if (kind == KIND_EVENT.BIND) {
			// Create symetrical event
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			const dir = p_eventBeingApplied.direction;
			const space1 = p_solver.numericArray[y][x];
			const index2 = space1.closestRanged[dir]; // Cannot be null since the bind has already been done !
			const coors2 = p_solver.rangedSpacesCoors[index2]; 
			p_listEventsToApply.push(new BindEvent(coors2.x, coors2.y, OppositeDirection[dir]));
			// Synchronize max and mins in that direction
			p_listEventsToApply.push(new MinRangeEvent(coors2.x, coors2.y, dir, space1.mins[dir] - differenceAlignedCoordinates(dir, coors2, {x : x, y : y})));
			p_listEventsToApply.push(new MaxRangeEvent(coors2.x, coors2.y, dir, space1.maxs[dir] - differenceAlignedCoordinates(dir, coors2, {x : x, y : y}))); // Mins and maxes in the opposite direction will also be synchronized because of symmetry
		} else if (kind == KIND_EVENT.CLOSED_ADJACENT_OUTSIDE) {
			var x, y;
			p_solver.existingNeighborsCoorsDirections(p_eventBeingApplied.x, p_eventBeingApplied.y).forEach(coors => {
				x = coors.x;
				y = coors.y;
				if (p_solver.answerArray[y][x] == ADJACENCY.NO) {
					p_listEventsToApply.push(new ClosedAdjacentOutsideEvent(x, y));
				}
			});
		}
		return p_listEventsToApply;
	}
}

// Make sure there is no checkerboard of open/closed spaces in a 2x2 square. Here, the up to 4 (2x2) squares around p_x, p_y ; that space is known.
SolverKuromasu.prototype.deductionsNoCheckers = function(p_listEventsToApply, p_x, p_y, p_centralOpening) {
	var dir, dirOrtho, xx, yy;
	var index;
	var coorsSquare;
	var resolvedAdjacency;
	this.existingNeighborsCoorsDirections(p_x, p_y).forEach(coorsDir => {
		dir = coorsDir.direction;
		dirOrtho = TurningRightDirection[dir];
		if (this.neighborExists(coorsDir.x, coorsDir.y, dirOrtho)) {
			xx = p_x + DeltaX[dir] + DeltaX[dirOrtho];
			yy = p_y + DeltaY[dir] + DeltaY[dirOrtho];
			index = 0;
			coorsSquare = [null, {x : xx, y : p_y}, {x : xx, y : yy}, {x : p_x, y : yy}]; // Three other coors of the 2x2 square
			valuedSpaces = [p_centralOpening, this.answerArray[p_y][xx], this.answerArray[yy][xx], this.answerArray[yy][p_x]];
			if (valuedSpaces[0] == valuedSpaces[2]) {
				if (valuedSpaces[1] != valuedSpaces[0] && valuedSpaces[1] != ADJACENCY.UNDECIDED) {
					index = 3;
					resolvedAdjacency = valuedSpaces[0];
				} else if (valuedSpaces[3] != valuedSpaces[0] && valuedSpaces[3] != ADJACENCY.UNDECIDED) {
					index = 1;
					resolvedAdjacency = valuedSpaces[0];
				}
			}
			if (valuedSpaces[1] == valuedSpaces[3] && valuedSpaces[1] != ADJACENCY.UNDECIDED) {
				if (valuedSpaces[1] != valuedSpaces[0]) {
					index = 2;
					resolvedAdjacency = valuedSpaces[1];
				}
			}
			if (index != 0) {
				p_listEventsToApply.push(new SpaceEvent(coorsSquare[index].x, coorsSquare[index].y, resolvedAdjacency));
			}
		}
	});
	return p_listEventsToApply;
}

// Test if 2 spaces are bound in a given direction (directionBound). If so, create events to synchronize the mins/maxes in directionMinMax (may be the same or opposite to directionBound).
// Whether it's min or max is defined by last parameter p_isMin
SolverKuromasu.prototype.deductionsTestBindSynchronizeMinMax = function(p_listEventsToApply, p_x, p_y, p_directionBound, p_directionMinMax, p_isMin) {
	const space = this.numericArray[p_y][p_x];
	if (space.bounds[p_directionBound]) {
		const index2 = space.closestRanged[p_directionBound];
		const coors2 = this.rangedSpacesCoors[index2];
		const delta = differenceAlignedCoordinates(p_directionMinMax, coors2, {x : p_x, y : p_y});
		if (p_isMin) {
			const value = space.mins[p_directionMinMax];
			p_listEventsToApply.push(new MinRangeEvent(coors2.x, coors2.y, p_directionMinMax, value - delta));
		} else {
			const value = space.maxs[p_directionMinMax];
			p_listEventsToApply.push(new MaxRangeEvent(coors2.x, coors2.y, p_directionMinMax, value - delta));			
		}
	}
	return p_listEventsToApply;
}

// Positive difference between two aligned coordinates, with p_coors2 looking at p_coors1 in p_direction (e.g if p_direction == LEFT, then we may have (0, 0) and (3, 0) as p_coors1 and p_coors2)
differenceAlignedCoordinates = function(p_direction, p_coorsLooked, p_coorsLooking) {
	switch(p_direction) {
		case DIRECTION.LEFT : return p_coorsLooking.x - p_coorsLooked.x; break;
		case DIRECTION.UP : return p_coorsLooking.y - p_coorsLooked.y; break;
		case DIRECTION.RIGHT : return p_coorsLooked.x - p_coorsLooking.x; break;
		case DIRECTION.DOWN : return p_coorsLooked.y - p_coorsLooking.y; break;
	}
}

SolverKuromasu.prototype.deductionsTestMinEqualsMax = function(p_listEventsToApply, p_x, p_y, p_direction) {
	const space = this.numericArray[p_y][p_x];
	const min = space.mins[p_direction];
	const max = space.maxs[p_direction];
	if (min == max) {
		const x = p_x + DeltaX[p_direction] * (min + 1);
		const y = p_y + DeltaY[p_direction] * (min + 1);
		if (this.testExistingCoordinates(x, y, p_direction)) {
			p_listEventsToApply.push(new SpaceEvent(x, y, ADJACENCY.NO));
		}
	}
	return p_listEventsToApply;
}

// ----------
// Filters

// Each space that has 'mins' that may have to be updated 
// For each space, for each direction, count the number of open spaces in that direction without an interruption and update mins as such
filtersUpdateMinsFromNewlyOpenSpaces = function(p_solver) {
	return function() {
		var listEvents = [];
		var coors, space, delta;
		p_solver.checkerNewlyOpenSpaces.list.forEach(index => {
			coors = p_solver.rangedSpacesCoors[index];
			x = coors.x;
			y = coors.y;
			space = p_solver.numericArray[y][x];
			KnownDirections.forEach(dir => {
				delta = space.mins[dir] + 1;
				xx = x + space.mins[dir] * DeltaX[dir];
				yy = y + space.mins[dir] * DeltaY[dir];
				while (p_solver.testExistingCoordinates(xx, yy, dir) && p_solver.answerArray[yy][xx] == ADJACENCY.YES) {
					xx += DeltaX[dir];
					yy += DeltaY[dir];
				}
				xx -= DeltaX[dir];
				yy -= DeltaY[dir];
				listEvents.push(new MinRangeEvent(x, y, dir, Math.abs(xx - x) + Math.abs(yy - y)));
			});
		});
		p_solver.clearNewlyOpenSpaces();
		return listEvents;
	}
}

SolverKuromasu.prototype.clearNewlyOpenSpaces = function() {
	this.checkerNewlyOpenSpaces.clean();
}

filtersMinMaxClosure = function(p_solver) {
	return function() {
		var listEventsToApply = [];
		/* For each numeric space with an updated min/max :
		Specify a max if the sum of 3 mins in all other directions impose it ; 
		same with a min and 3 maxes */
		var coors;
		p_solver.checkerUpdatedMinMax.list.forEach(index => {
			coors = p_solver.rangedSpacesCoors[index];
			listEventsToApply = p_solver.deductionsSumsMinMax(listEventsToApply, coors.x, coors.y);
		});
		p_solver.clearUpdatedMinMaxes();
		// TODO do the same with bound spaces ?
		return listEventsToApply;
		// Si cette case est liée (ou si une liaison a eu lieu entre 2 cases) :
		// 3 mins dans l'orientation perpendiculaire à la liaison => forcer le 4e max
		// 1 max et 1 min opposés sur une case, et 1 max sur l'autre case => mettre un min en face 
		// Si dans le sens opposé à la liaison c'est pas null, lier.
	}
}

SolverKuromasu.prototype.deductionsSumsMinMax = function(p_listEventsToApply, p_x, p_y) {
	const space = this.numericArray[p_y][p_x];
	KnownDirections.forEach(dir => {
		otherValues = space.mins[TurningLeftDirection[dir]] + space.mins[OppositeDirection[dir]] + space.mins[TurningRightDirection[dir]];
		p_listEventsToApply.push(new MaxRangeEvent(p_x, p_y, dir, space.number - 1 - otherValues));
		otherValues = space.maxs[TurningLeftDirection[dir]] + space.maxs[OppositeDirection[dir]] + space.maxs[TurningRightDirection[dir]];
		p_listEventsToApply.push(new MinRangeEvent(p_x, p_y, dir, space.number - 1 - otherValues));
	});
	return p_listEventsToApply;
}


SolverKuromasu.prototype.clearUpdatedMinMaxes = function() {
	this.checkerUpdatedMinMax.clean();
}

abortClosure = function(p_solver) {
	return function() {		
		p_solver.clearNewlyOpenSpaces();
		p_solver.clearUpdatedMinMaxes();
	}
}

filterCorralClosure = function(p_solver) {
	return function() {
		if (!p_solver.isCorral) {
			return [];
		} else {
			// Pour chaque nouvelle case 'adjacente à une case nouvellement ouverte' et non-ouverte elle-même : vérifier si aucun cluster de cases non-ouvertes alentour n'est enfermé (emprisonné dans des cases ouvertes) en délimitant la recherche aux cases fermées en contact extérieur.
			// Si un groupe de cases indéterminées n'accède pas à l'extérieur, ouvrir entièrement le groupe OU déclarer un échec. 
			// Ne pas arrêter de fouiller le groupe (on ne doit pas re-fouiller les cases plusieurs fois)
			// Si le groupe possède au moins une case fermée : pour une case fermée libre : faire un tour des cases façon ceinture à l'intérieur en excluant les "cases ouvertes sur l'extérieur".
			// cf. "turningLeftArray" dans AdjacencyCheck
			var answer = [];
			var toAddToCluster = [];
			var theCluster = [];
			var x, y, xx, yy, adjacentFreeCoorsDir, foundClosed, alreadyFoundAPreviousCluster;
			var coors;
			var coorsIn;
			for(var i = 0 ; i < p_solver.checkerAdjacencyNewlyOpen.list.length ; i++) {
				coorsIn = p_solver.checkerAdjacencyNewlyOpen.list[i];
				// First, examinate the cluster of (undecided or (closed & non free) spaces). It may be adjacent to a free space (adjacentFreeCoorsDir) and/or contain a closed space (foundClosed).
				if (p_solver.isSpaceDiggableClusterFreeClosed(coorsIn.x, coorsIn.y) && p_solver.checkerAdjacencyClustersFreeClosed.array[coorsIn.y][coorsIn.x] == null) {
					toAddToCluster = [coorsIn];
				} else {
					toAddToCluster = []; // List of new spaces to be added to cluster (coors enter and leave)
				} 
				adjacentFreeCoorsDir = null;
				foundClosed = false; // True if we already found a previous cluster
				theCluster = []; // Overall coordinates of cluster of spaces
				alreadyFoundAPreviousCluster = false;
				while(toAddToCluster.length > 0 && !alreadyFoundAPreviousCluster && (!foundClosed || adjacentFreeCoorsDir == null)) { 
					// We have to interrupt the cluster digging if we found no closed space AND we didn't find any free space
					// We also have to interrupt the cluster if we fall on another previously completed cluster
					coors = toAddToCluster.pop();
					x = coors.x;
					y = coors.y;
					p_solver.checkerAdjacencyClustersFreeClosed.addGeneric(x, y, i);
					theCluster.push({x : x, y : y});
					p_solver.existingNeighborsCoorsDirections(x, y).forEach(coorsDir => {
						xx = coorsDir.x;
						yy = coorsDir.y;
						dir = coorsDir.direction;
						if (p_solver.checkerAdjacencyClustersFreeClosed.array[yy][xx] == null) {
							if (p_solver.isSpaceDiggableClusterFreeClosed(xx, yy)) {
								toAddToCluster.push({x : xx, y : yy});
							} 
						} else if (p_solver.checkerAdjacencyClustersFreeClosed.array[yy][xx] != i) {
							alreadyFoundAPreviousCluster = true;
						}
						
						if (p_solver.closedAdjacentOutsideArray[yy][xx]) { // We noticed an adjacent closed free space
							adjacentFreeCoorsDir = {x : x, y : y, direction : dir};
						}
						if (p_solver.answerArray[yy][xx] == ADJACENCY.NO) {
							foundClosed = true;
						}
					});
					if (x == 0) { // gimme some freedom
						adjacentFreeCoorsDir = {x : x, y : y, direction : DIRECTION.LEFT};
					} else if (y == 0) {
						adjacentFreeCoorsDir = {x : x, y : y, direction : DIRECTION.UP};
					} else if (x == p_solver.xLength - 1) {
						adjacentFreeCoorsDir = {x : x, y : y, direction : DIRECTION.RIGHT};
					} else if (y == p_solver.yLength - 1) {
						adjacentFreeCoorsDir = {x : x, y : y, direction : DIRECTION.DOWN};
					}
				}
				if (adjacentFreeCoorsDir == null && !alreadyFoundAPreviousCluster) {
					if (foundClosed) {
						answer = EVENT_RESULT.FAILURE;
					} else {
						theCluster.forEach(coors2 => {
							answer.push(new SpaceEvent(coors2.x, coors2.y, ADJACENCY.YES));
						});
					}
				}
				if (answer == EVENT_RESULT.FAILURE) {
					break;
				}
			};
			p_solver.checkerAdjacencyClustersFreeClosed.clean();
			p_solver.checkerAdjacencyNewlyOpen.clean();
			return answer;
		}
	}
}

SolverKuromasu.prototype.isSpaceDiggableClusterFreeClosed = function(p_x, p_y) {
	return (this.answerArray[p_y][p_x] != ADJACENCY.YES && !this.closedAdjacentOutsideArray[p_y][p_x]);
}

// --------------------
// Passing

generateEventsForSpacePassClosure = function(p_solver) {
	return function(p_index) {
		const x = p_index.x;
		const y = p_index.y;
		const number = p_index.number;
		if (number != null) {
			return p_solver.generateEventsRangedDynamicPass(x, y, number);
		} else {
			return p_solver.generateEventsSinglePass(x, y);
		}
	}
}

SolverKuromasu.prototype.generateEventsRangedDynamicPass = function(p_x, p_y, p_number) {
	var answer = [];
	var x, y;
	KnownDirections.forEach(dir => {
		x = p_x + DeltaX[dir];
		y = p_y + DeltaY[dir];
		i = 1;
		while (this.testExistingCoordinates(x, y, dir) && this.answerArray[y][x] != ADJACENCY.NO && i < p_number) {
			if (this.answerArray[y][x] == ADJACENCY.UNDECIDED) {
				answer.push(eventsForOneSpacePass(x, y));
			}
			x += DeltaX[dir];
			y += DeltaY[dir];
			i++; // Without "i < p_number" we could have ~30 spaces tested at once and it seems a lot. TODO improve this !
		}
	});
	return answer;
}

SolverKuromasu.prototype.generateEventsSinglePass = function(p_x, p_y) {
	return [eventsForOneSpacePass(p_x, p_y)];
}

function eventsForOneSpacePass(p_x, p_y) {
	return [new SpaceEvent(p_x, p_y, ADJACENCY.YES), new SpaceEvent(p_x, p_y, ADJACENCY.NO)];
}

copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	const k1 = p_event1.kind; 
	const k2 = p_event2.kind;
	return commonComparisonMultiKinds([KIND_EVENT.SPACE, KIND_EVENT.RANGE_MIN, KIND_EVENT.RANGE_MAX, KIND_EVENT.BIND, KIND_EVENT.CLOSED_ADJACENT_OUTSIDE], 
		[
		[p_event1.coorY, p_event1.coorX, p_event1.symbol], [p_event2.coorY, p_event2.coorX, p_event2.symbol],
		[p_event1.y, p_event1.x, p_event1.direction, p_event1.min], [p_event2.y, p_event2.x, p_event2.direction, p_event2.min],
		[p_event1.y, p_event1.x, p_event1.direction, p_event1.max], [p_event2.y, p_event2.x, p_event2.direction, p_event2.max],
		[p_event1.y, p_event1.x, p_event1.direction], [p_event2.y, p_event2.x, p_event2.direction],
		[p_event1.y, p_event1.x], [p_event2.y, p_event2.x]
		], k1, k2);
}

namingCategoryClosure = function(p_solver) {
	return function(p_index) {
		if (p_index.number != null) {
			return "Dynamic from " + p_index.x + "," + p_index.y + " (" + p_index.number + ")"; 
		} else {
			return "Single " + p_index.x + "," + p_index.y;
		}
	}
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var indexList = [];
		p_solver.rangedSpacesCoors.forEach(coors => {
			indexList.push({x : coors.x, y : coors.y, number : p_solver.numericArray[coors.y][coors.x].number});
		}); // Note : nothing for indexed spaces
		return indexList;
	}
}