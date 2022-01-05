// Initialization

function SolverCanalView(p_numericXArray) {
	GeneralSolver.call(this);
	this.construct(p_numericXArray);
}

SolverCanalView.prototype = Object.create(GeneralSolver.prototype);
SolverCanalView.prototype.constructor = SolverCanalView;

function DummySolver() {
	return new SolverCanalView(generateSymbolArray(1, 1));
}

SolverCanalView.prototype.construct = function(p_numericXArray) {
	this.generalConstruct();
	this.xLength = p_numericXArray[0].length;
	this.yLength = p_numericXArray.length;
	this.makeItGeographical(this.xLength, this.yLength, new ApplyEventMethodGeographicalPack(
			applyEventClosure(this), 
			deductionsClosure(this), 
			adjacencyClosure(this), 
			transformClosure(this), 
			undoEventClosure(this)));
	this.methodsSetPass = {
		comparisonMethod : comparison, 
		copyMethod : copying, 
		argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForSpacePassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		//skipPassMethod : skipPassClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filtersUpdateMinsFromNewlyOpenSpacesClosure(this), filtersMinMaxClosure(this)]);


	this.answerArray = [];
	this.rangeGrid = Grid_data(p_numericXArray);
	var ix,iy;

	// Initialize answerArray purified
	for(iy = 0;iy < this.yLength ; iy++) {
		this.answerArray.push([]);
		for(ix = 0;ix < this.xLength ; ix++) {
			if (this.rangeGrid.get(ix, iy) != null) {
				this.answerArray[iy].push(ADJACENCY.NO);
			} else {
				this.answerArray[iy].push(ADJACENCY.UNDECIDED);
			}
		}
	}

	this.numericArray = [];
	this.rangedSpacesCoors = []; // Made public for drawing
	
	// Fully initialize numeric array & manage maxes in rows
	var ix, iy;
	var index, previousIndex;
	var lastNumericXInRow, x;
	for (iy = 0 ; iy < p_numericXArray.length ; iy++) {
		this.numericArray.push([]);
		lastNumericXInRow = null;
		previousIndex = null;
		for (ix = 0 ; ix < p_numericXArray[iy].length ; ix++) {
			if (p_numericXArray[iy][ix] != null) {
				this.answerArray[iy][ix] = ADJACENCY.NO;		
				this.numericArray[iy].push({
					number : parseInt(p_numericXArray[iy][ix], 10),
					mins : [0, 0, 0, 0],
					maxs : [ix, iy, this.xLength - ix - 1, this.yLength - iy - 1],
					backedMins : [[], [], [], []],
					backedMaxs : [[], [], [], []],
					index : this.rangedSpacesCoors.length
				});
				index = this.numericArray[iy][ix].index;

				if (lastNumericXInRow != null) {
					this.numericArray[iy][ix].maxs[DIRECTION.LEFT] = ix - lastNumericXInRow - 1;
					this.numericArray[iy][lastNumericXInRow].maxs[DIRECTION.RIGHT] = ix - lastNumericXInRow - 1;
					for (var x = lastNumericXInRow + 1 ; x < ix ; x++) {
						this.numericArray[iy][x].closestRanged[DIRECTION.RIGHT] = index;
						this.numericArray[iy][x].closestRanged[DIRECTION.LEFT] = previousIndex;
					}
				} else {
					for (var x = 0 ; x < ix ; x++) {
						this.numericArray[iy][x].closestRanged[DIRECTION.RIGHT] = index;
					}
				}
				this.rangedSpacesCoors.push({x : ix, y : iy});
				lastNumericXInRow = ix;
				previousIndex = index;
			} else {
				this.numericArray[iy].push({closestRanged : [null, null, null, null]});
			}
		}
		if (lastNumericXInRow != null) {
			for (var x = lastNumericXInRow + 1 ; x < this.xLength ; x++) {
				this.numericArray[iy][x].closestRanged[DIRECTION.LEFT] = previousIndex;
			}
		}
	}
	
	// Manage maxes and closest indexes in columns 
	var lastNumericYInCol, y;
	for (ix = 0 ; ix < this.xLength ; ix++) {
		lastNumericYInCol = null;
		previousIndex = null;
		for (iy = 0 ; iy < this.yLength ; iy++) {
			if (p_numericXArray[iy][ix] != null) {
				index = this.numericArray[iy][ix].index;
				if (lastNumericYInCol != null) {
					this.numericArray[iy][ix].maxs[DIRECTION.UP] = iy - lastNumericYInCol - 1;
					this.numericArray[lastNumericYInCol][ix].maxs[DIRECTION.DOWN] = iy - lastNumericYInCol - 1;
					for (var y = lastNumericYInCol + 1 ; y < iy ; y++) {
						this.numericArray[y][ix].closestRanged[DIRECTION.DOWN] = index;
						this.numericArray[y][ix].closestRanged[DIRECTION.UP] = previousIndex;
					}
				} else {
					for (var y = 0 ; y < iy ; y++) {
						this.numericArray[y][ix].closestRanged[DIRECTION.DOWN] = index;
					}
				}
				lastNumericYInCol = iy;
				previousIndex = index;
			}
		}
		if (lastNumericYInCol != null) {
			for (var y = lastNumericYInCol + 1 ; y < this.yLength ; y++) {
				this.numericArray[y][ix].closestRanged[DIRECTION.UP] = previousIndex;
			}
		}
	}
	
	// Refresh maxes
	var space, number;
	this.rangedSpacesCoors.forEach(coors => {
		x = coors.x;
		y = coors.y;
		space = this.numericArray[y][x];
		number = space.number;
		KnownDirections.forEach(dir => {
			space.maxs[dir] = Math.min(number, space.maxs[dir]);
		});
	});
	
	this.checkerNewlyOpenSpaces = new CheckCollection(this.rangedSpacesCoors.length);
	this.checkerUpdatedMinMax = new CheckCollection(this.rangedSpacesCoors.length);
	
	this.declarationsOpenAndClosed();
}

//--------------------------------

// Misc. methods
SolverCanalView.prototype.getAnswer = function(p_x, p_y) {
	return this.answerArray[p_y][p_x];
}

SolverCanalView.prototype.isBanned = function(p_x, p_y) {
	return this.rangeGrid.get(p_x, p_y) != null;
}

SolverCanalView.prototype.isNumeric = function(p_x, p_y) {
	const num = this.rangeGrid.get(p_x, p_y);
	return (num != null && num.charAt(0) != "X");
}

SolverCanalView.prototype.getNumber = function(p_x, p_y) {
	return this.rangeGrid.get(p_x, p_y);
}

//--------------------------------

// Input methods
SolverCanalView.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	if (!this.isBanned(p_x, p_y)) {
		this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_symbol));
	}
}

SolverCanalView.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverCanalView.prototype.makeQuickStart = function() {
	this.quickStart();
}

SolverCanalView.prototype.emitPassSpace = function(p_x, p_y) {
	const number = this.getNumber(p_x, p_y);
	if (number != null) {		
		const generatedEvents = this.generateEventsRangedDynamicPass(p_x, p_y, number);
		this.passEvents(generatedEvents, {x : p_x, y : p_y, number : number}); 
	} else {
		const generatedEvents = this.generateEventsSinglePass(p_x, p_y);
		this.passEvents(generatedEvents, {x : p_x, y : p_y}); 
	}
}

SolverCanalView.prototype.makeMultiPass = function() {
	this.multiPass(this.methodsSetMultipass);
}

//--------------------------------

// Doing, undoing and transforming

// Offensive programming : the coordinates are assumed to be in limits
SolverCanalView.prototype.applyFillSpace = function(p_x, p_y, p_symbol) {
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
		})
	}
	return EVENT_RESULT.SUCCESS;
}

SolverCanalView.prototype.applyRangeMin = function(p_x, p_y, p_direction, p_value) {
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

SolverCanalView.prototype.applyRangeMax = function(p_x, p_y, p_direction, p_value) {
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

applyEventClosure = function(p_solver) {
	return function(eventToApply) {
		switch (eventToApply.kind) {	
			case KIND_EVENT.SPACE :	return p_solver.applyFillSpace(eventToApply.x, eventToApply.y, eventToApply.symbol); break;
			case KIND_EVENT.RANGE_MIN : return p_solver.applyRangeMin(eventToApply.x, eventToApply.y, eventToApply.direction, eventToApply.min); break;
			case KIND_EVENT.RANGE_MAX : return p_solver.applyRangeMax(eventToApply.x, eventToApply.y, eventToApply.direction, eventToApply.max); break;
		}
	}
}

undoEventClosure = function(p_solver) {
	return function(eventToApply) {
		var x, y, index, symbol, numericSpace;
		switch(eventToApply.kind) {
			case KIND_EVENT.SPACE : 
				x = eventToApply.x; 
				y = eventToApply.y;
				symbol = eventToApply.symbol;
				p_solver.answerArray[y][x] = ADJACENCY.UNDECIDED; 
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
		}
	}
}

//-------------------------------- 
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvts = [{quickStartLabel : "Canal view"}];
		for (var i = 0 ; i < p_solver.rangedSpacesCoors.length ; i++) {
			listQSEvts = p_solver.deductionsSumsMinMax(listQSEvts, p_solver.rangedSpacesCoors[i].x, p_solver.rangedSpacesCoors[i].y);
		}
		return listQSEvts;
	}
}

//--------------------------------
// Exchanges solver and geographical

/**
Transforms a geographical deduction (see dedicated class GeographicalDeduction) into an appropriate event (SpaceEvent in our case)
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
// Intelligence
deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind == KIND_EVENT.SPACE) {			
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			const symbol = p_eventBeingApplied.symbol;
			if (symbol == ADJACENCY.YES) {
				p_listEventsToApply = p_solver.alert2x2Areas(p_listEventsToApply, p_solver.methodsSetDeductions, x, y); 
			} else {
				var xx, yy;
				KnownDirections.forEach(dir => {
					index = p_solver.numericArray[y][x].closestRanged[dir];
					if (index != null) {
						xx = p_solver.rangedSpacesCoors[index].x;
						yy = p_solver.rangedSpacesCoors[index].y;
						p_listEventsToApply.push (new MaxRangeEvent(xx, yy, OppositeDirection[dir], Math.abs(xx - x) + Math.abs(yy - y) - 1));
					}
				});
			}
		} else if (p_eventBeingApplied.kind == KIND_EVENT.RANGE_MAX) {
			// Test min == max
			const dir = p_eventBeingApplied.direction;
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			p_listEventsToApply = p_solver.deductionsTestMinEqualsMax(p_listEventsToApply, x, y, dir);
		} else if (p_eventBeingApplied.kind == KIND_EVENT.RANGE_MIN) {
			// Test min == max
			const dir = p_eventBeingApplied.direction;
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			p_listEventsToApply = p_solver.deductionsTestMinEqualsMax(p_listEventsToApply, x, y, dir);
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
		}
		return p_listEventsToApply;
	}
}


SolverCanalView.prototype.deductionsTestMinEqualsMax = function(p_listEventsToApply, p_x, p_y, p_direction) {
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

// Each space that has 'mins' that may have to be updated 
// For each space, for each direction, count the number of open spaces in that direction without an interruption and update mins as such
filtersUpdateMinsFromNewlyOpenSpacesClosure = function(p_solver) {
	return function() {
		var listEvents = [];
		var coors, space;
		p_solver.checkerNewlyOpenSpaces.list.forEach(index => {
			coors = p_solver.rangedSpacesCoors[index];
			x = coors.x;
			y = coors.y;
			space = p_solver.numericArray[y][x];
			KnownDirections.forEach(dir => {
				xx = x + (space.mins[dir] + 1) * DeltaX[dir];
				yy = y + (space.mins[dir] + 1) * DeltaY[dir];
				while (p_solver.testExistingCoordinates(xx, yy, dir) && p_solver.answerArray[yy][xx] == ADJACENCY.YES) {
					xx += DeltaX[dir];
					yy += DeltaY[dir];
				}
				xx -= DeltaX[dir];
				yy -= DeltaY[dir];
				listEvents.push(new MinRangeEvent(x, y, dir, Math.abs(xx - x) + Math.abs(yy - y) ));
			});
		});
		p_solver.clearNewlyOpenSpaces();
		return listEvents;
	}
}

SolverCanalView.prototype.clearNewlyOpenSpaces = function() {
	this.checkerNewlyOpenSpaces.clean();
}

// Around a given ranged space, sums of mins in 3 directions force the 4th max and vice-versa.
filtersMinMaxClosure = function(p_solver) {
	return function() {
		var listEventsToApply = [];
		var coors;
		p_solver.checkerUpdatedMinMax.list.forEach(index => {
			coors = p_solver.rangedSpacesCoors[index];
			listEventsToApply = p_solver.deductionsSumsMinMax(listEventsToApply, coors.x, coors.y);
		});
		p_solver.clearUpdatedMinMaxes();
		return listEventsToApply;
	}
}

SolverCanalView.prototype.deductionsSumsMinMax = function(p_listEventsToApply, p_x, p_y) {
	const space = this.numericArray[p_y][p_x];
	KnownDirections.forEach(dir => {
		otherValues = space.mins[TurningLeftDirection[dir]] + space.mins[OppositeDirection[dir]] + space.mins[TurningRightDirection[dir]];
		p_listEventsToApply.push(new MaxRangeEvent(p_x, p_y, dir, space.number - otherValues));
		otherValues = space.maxs[TurningLeftDirection[dir]] + space.maxs[OppositeDirection[dir]] + space.maxs[TurningRightDirection[dir]];
		p_listEventsToApply.push(new MinRangeEvent(p_x, p_y, dir, space.number - otherValues));
	});
	return p_listEventsToApply;
}


SolverCanalView.prototype.clearUpdatedMinMaxes = function() {
	this.checkerUpdatedMinMax.clean();
}

abortClosure = function(p_solver) {
	return function() {		
		p_solver.clearNewlyOpenSpaces();
		p_solver.clearUpdatedMinMaxes();
	}
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

SolverCanalView.prototype.generateEventsRangedDynamicPass = function(p_x, p_y, p_number) {
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

SolverCanalView.prototype.generateEventsSinglePass = function(p_x, p_y) {
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
	return commonComparisonMultiKinds([KIND_EVENT.SPACE, KIND_EVENT.RANGE_MIN, KIND_EVENT.RANGE_MAX], 
		[
		[p_event1.y, p_event1.x, p_event1.symbol], [p_event2.y, p_event2.x, p_event2.symbol],
		[p_event1.y, p_event1.x, p_event1.direction, p_event1.min], [p_event2.y, p_event2.x, p_event2.direction, p_event2.min],
		[p_event1.y, p_event1.x, p_event1.direction, p_event1.max], [p_event2.y, p_event2.x, p_event2.direction, p_event2.max],
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