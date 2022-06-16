// Initialization

function SolverTapa(p_combinationArray) {
	GeneralSolver.call(this);
	this.construct(p_combinationArray);
}

SolverTapa.prototype = Object.create(GeneralSolver.prototype);
SolverTapa.prototype.constructor = SolverTapa;

function DummySolver() {
	return new SolverTapa(generateSymbolArray(1, 1));
}

SolverTapa.prototype.construct = function(p_combinationArray) {
	this.generalConstruct();
	this.xLength = p_combinationArray[0].length;
	this.yLength = p_combinationArray.length;
	this.makeItGeographical(this.xLength, this.yLength, new ApplyEventMethodGeographicalPack( 
		applyEventClosure(this),
		deductionsClosure(this),
		adjacencyClosure(this),
		transformClosure(this),
		undoEventClosure(this)
	));
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterSpacesClosure(this)]);
	this.methodsSetPass = {
		comparisonMethod : comparison,
		copyMethod : copying,
		argumentToLabelMethod : namingCategoryPassClosure(this)
		};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForAroundSpacePassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this)
		//skipPassMethod : skipPassClosure(this)
	};	
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}

	this.checkerNewSpaces = new CheckCollectionDoubleEntry(this.xLength, this.yLength);

	this.answerArray = [];
	this.clueGrid = Grid_data(p_combinationArray);
	var ix, iy;
	
	this.neighboringClues = generateFunctionValueArray(this.xLength, this.yLength, function() {return []});
	this.answerArray = generateValueArray(this.xLength, this.yLength, ADJACENCY.UNDECIDED);
	this.numericSpacesCoorsList = []; // For quickstart and multipass (TODO : come back on this note !  sure, multipass ?)

	// Get informations from clue spaces + purify grid
	for(iy = 0;iy < this.yLength ; iy++) {
		for(ix = 0;ix < this.xLength ; ix++) {
			if (this.clueGrid.get(ix, iy) != null) {
				this.answerArray[iy][ix] = ADJACENCY.NO;
				this.numericSpacesCoorsList.push({x : ix, y : iy});
				this.existingNeighborsCoorsWithDiagonals(ix, iy).forEach(coors => {
					const x = coors.x;
					const y = coors.y;
					if (this.clueGrid.get(x, y) == null) {
						this.neighboringClues[y][x].push({x : ix, y : iy});
					}
				});
			} 
		}
	}
	this.declarationsOpenAndClosed();
}

//--------------------------------

// Misc. methods
SolverTapa.prototype.getAnswer = function(p_x, p_y) {
	return this.answerArray[p_y][p_x];
}

SolverTapa.prototype.isBanned = function(p_x, p_y) {
	return this.clueGrid.get(p_x, p_y) != null;
}

SolverTapa.prototype.isNumeric = function(p_x, p_y) {
	return this.clueGrid.get(p_x, p_y) != null;
}

//--------------------------------
// Misc. inner methods 

function testExistingCoordinate(coor, dir, xMax, yMax) {
	switch (dir) {
		case DIRECTION.LEFT : 
		case DIRECTION.UP : return coor >= 0; break;
		case DIRECTION.RIGHT : return coor < xMax; break;
		case DIRECTION.DOWN : return coor < yMax; break;
	}
}

//--------------------------------

// Input methods
SolverTapa.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	this.tryToApplyHypothesisSafe(new SpaceEvent(p_x, p_y, p_symbol));
}

SolverTapa.prototype.emitPass = function(p_x, p_y) {
	if (this.isNumeric(p_x, p_y)) {
		this.passEventsSafe(this.generateEventsForAroundSpacePass(p_x, p_y), {x : x, y : y});
	}
}

SolverTapa.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverTapa.prototype.makeQuickStart = function() {
	this.quickStart();
}

SolverTapa.prototype.makeMultiPass = function() {	
	this.multiPassSafe(this.methodsSetMultipass);
}

//--------------------------------
// Doing, undoing and transforming

// Offensive programming : the coordinates are assumed to be in limits
SolverTapa.prototype.putNew = function(p_x,p_y,p_symbol) {
	if (this.answerArray[p_y][p_x] == p_symbol) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[p_y][p_x] != ADJACENCY.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerArray[p_y][p_x] = p_symbol;	
	return EVENT_RESULT.SUCCESS;
}


applyEventClosure = function(p_solver) {
	return function(p_eventToApply) {
		return p_solver.putNew(p_eventToApply.x, p_eventToApply.y, p_eventToApply.symbol);
	}
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		const x = p_eventToUndo.x; 
		const y = p_eventToUndo.y;
		p_solver.answerArray[y][x] = ADJACENCY.UNDECIDED;
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
// Quickstart !

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvents = [{quickStartLabel : "Tapa"}];
		p_solver.numericSpacesCoorsList.forEach(coors => {
			p_solver.deductionsTapass(listQSEvents, coors.x, coors.y);
		});
		return listQSEvents;
	}
}

//--------------------------------
// Intelligence

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const symbol = p_eventBeingApplied.symbol;
		if (symbol == ADJACENCY.YES) {
			p_solver.deductionsAlert2x2Areas(p_listEventsToApply, p_solver.methodsSetDeductions, x, y); 
		} else {
			
		}
		p_solver.neighboringClues[y][x].forEach(coors => {
			p_solver.checkerNewSpaces.add(coors.x, coors.y);
		});
	}
}

// Filter & abort

function abortClosure(p_solver) {
	return function() {
		return p_solver.clean();
	}
}

SolverTapa.prototype.clean = function() {
	this.checkerNewSpaces.clean();
}

function filterSpacesClosure(p_solver) {
	return function() {
		var listEventsToApply = [];
		var i, coors;
		for (i = 0 ; i < p_solver.checkerNewSpaces.list.length ; i++) {
			coors = p_solver.checkerNewSpaces.list[i];
			p_solver.deductionsTapass(listEventsToApply, coors.x, coors.y);
			if (isFailed(listEventsToApply)) {
				return listEventsToApply;
			}
		};
		p_solver.clean();
		return listEventsToApply;
	}
}

// Fills the list with tapass deductions from the index space contained in p_x, p_y. (or return failure) (see SolverTapaAnnex for more uses)
// Convention : see SolverTapaAnnex.
SolverTapa.prototype.deductionsTapass = function(p_listEventsToApply, p_x, p_y) {
	var taparray = [];
	var tapaNumbers = [0, 0, 0, 0, 0]; 
	const clue = this.clueGrid.get(p_x, p_y);
	var c;
	for (var i = 0 ; i < clue.length ; i++) {
		c = clue.charAt(i);
		switch(c) {
			case '?' : tapaNumbers[0]++; break;
			case '1' : tapaNumbers[1]++; break;
			case '2' : tapaNumbers[2]++; break;
			case '3' : tapaNumbers[3]++; break;
			case '4' : tapaNumbers[4] = 4; break;
			case '5' : tapaNumbers[4] = 5; break;
			case '6' : tapaNumbers[4] = 6; break;
			case '7' : tapaNumbers[4] = 7; break;
			case '8' : tapaNumbers[4] = 8; break;
		}
	}
	
	var tapaDeltaX = [];
	var tapaDeltaY = [];
	var tapaCoors = [];
	switch (p_y) {
		case 0 : 
			switch(p_x) {
				case 0 : // Up left
					tapaDeltaX = [1, 1, 0];
					tapaDeltaY = [0, 1, 1]; 
				break;
				case this.xLength - 1 : // Up right
					tapaDeltaX = [0, -1, -1];
					tapaDeltaY = [1, 1, 0];
				break;
				default : // Up 
					tapaDeltaX = [1, 1, 0, -1, -1];
					tapaDeltaY = [0, 1, 1, 1, 0];
				break;
			}
		break;
		case this.yLength-1 :
			switch(p_x) {
				case 0 : // Down left
					tapaDeltaX = [0, 1, 1];
					tapaDeltaY = [-1, -1, 0]; 
				break;
				case this.xLength - 1 : // Down right
					tapaDeltaX = [-1, -1, 0];
					tapaDeltaY = [0, -1, -1];
				break;
				default : // Down
					tapaDeltaX = [-1, -1, 0, 1, 1];
					tapaDeltaY = [0, -1, -1, -1, 0];
				break;
			}
		break;
		default : 
			switch(p_x) {
				case 0 : // left
					tapaDeltaX = [0, 1, 1, 1, 0];
					tapaDeltaY = [-1, -1, 0, 1, 1]; 
				break;
				case this.xLength - 1 : // right
					tapaDeltaX = [0, -1, -1, -1, 0];
					tapaDeltaY = [1, 1, 0, -1, -1]; 
				break;
				default : // in-between
					tapaDeltaX = [0, 1, 1, 1, 0, -1, -1, -1];
					tapaDeltaY = [-1, -1, 0, 1, 1, 1, 0, -1]; 
				break;
			}
		break;
	}		
	var value;
	for (var i = 0 ; i < tapaDeltaX.length ; i++) {
		tapaCoors.push({x : p_x+tapaDeltaX[i], y : p_y+tapaDeltaY[i]});
		switch(this.answerArray[tapaCoors[i].y][tapaCoors[i].x]) {
			case ADJACENCY.NO : taparray.push(TAPASS.NO); break;
			case ADJACENCY.UNDECIDED : taparray.push(TAPASS.UNDECIDED); break;
			case ADJACENCY.YES : taparray.push(TAPASS.YES); break;
		}
	}
	
	// Now, the deductions !
	if (tapaCoors.length < 8) {
		taparray.push(TAPASS.NO); // Fictiounous "NO" space to symbolize edges of the grid
	}
	autoLogDebug("Coordinates tapass : " + p_x + " " + p_y);
	var tapassReturn = tapass(tapaNumbers, taparray);
	if (tapassReturn == DEDUCTIONS_RESULT.FAILURE) {
		p_listEventsToApply.push(new FailureEvent());
		return;
	} else if (tapassReturn != EVENT_RESULT.HARMLESS) {
		for (var i = 0 ; i < tapaCoors.length ; i++) {
			x = tapaCoors[i].x;
			y = tapaCoors[i].y;			
			switch(tapassReturn[i]) {
				case TAPASS.YES : p_listEventsToApply.push(new SpaceEvent(x, y, ADJACENCY.YES)); break;
				case TAPASS.NO : p_listEventsToApply.push(new SpaceEvent(x, y, ADJACENCY.NO)); break;
				default : break;
			}
		}
	}
}

// --------------------
// Passing

// Index strip must match the index of a strip WITHOUT UNION !
SolverTapa.prototype.generateEventsForAroundSpacePass = function(p_x, p_y) {
	var eventList = [];
	var x, y;
	this.existingNeighborsCoorsWithDiagonals(p_x, p_y).forEach(coors => {
		x = coors.x;
		y = coors.y;
		if (this.answerArray[y][x] == ADJACENCY.UNDECIDED) {
			eventList.push([new SpaceEvent(x, y, ADJACENCY.YES), new SpaceEvent(x, y, ADJACENCY.NO)]);	
		}
	});
	return eventList;
}

copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
		return commonComparison([[p_event1.y, p_event1.x, p_event1.symbol],
	[p_event2.y, p_event2.x, p_event2.symbol]]);
}


// -----
// Multipass

generateEventsForAroundSpacePassClosure = function(p_solver) {
	return function(p_coors) {
		return p_solver.generateEventsForAroundSpacePass(p_coors.x, p_coors.y);
	}
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		return p_solver.numericSpacesCoorsList;
		 // Sorting is for dummies
	}
}

namingCategoryPassClosure = function(p_solver) {
	return function (p_coors) {
		return "Pass around " + p_coors.x + " " + p_coors.y; 
	}
}