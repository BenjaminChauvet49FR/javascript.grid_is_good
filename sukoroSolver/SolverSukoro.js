const SUKORO_CLOSED_SPACE = 0;

// Initialization
function SolverSukoro(p_numberSymbolsArray) {
	GeneralSolver.call(this);
	this.construct(p_numberSymbolsArray);
}

DummySolver = function() {
	return new SolverSukoro([[null]]);
}
SolverSukoro.prototype = Object.create(GeneralSolver.prototype);
SolverSukoro.prototype.constructor = SolverSukoro;

SolverSukoro.prototype.construct = function(p_numberSymbolsArray) {
	this.generalConstruct();
	this.xLength = p_numberSymbolsArray[0].length;
	this.yLength = p_numberSymbolsArray.length;
	this.makeItGeographical(this.xLength, this.yLength, new ApplyEventMethodGeographicalPack( 
		applyEventClosure(this),
		deductionsClosure(this),
		adjacencyClosure(this),
		transformClosure(this),
		undoEventClosure(this)
	));
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterOnePossibleClosure(this), filterAffectedNeighborsClosure(this)]);
	this.methodsSetPass = {comparisonMethod : comparison, copyMethod : copying, argumentToLabelMethod : namingCategoryPassClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForSpacePassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		//skipPassMethod : skipPassClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this),
		searchSolutionMethod : searchClosure(this),
		isSolvedMethod : isSolvedClosure(this)
	}
	
	this.answerArray = [];
	this.fixedArray = [];
	this.fixedSpaces = [];
	// Definition of answerArray
	for (var y = 0; y < this.yLength ; y++) {
		this.answerArray.push([]);
		this.fixedArray.push([]);
		for (var x = 0 ; x < this.xLength ; x++) {
			this.answerArray[y].push(new SpaceNumeric(0, 4)); // High convention : SUKORO_CLOSED_SPACE = 0
			symbolOrNumber = p_numberSymbolsArray[y][x];
			if (symbolOrNumber != null) {
				this.fixedSpaces.push({x : x, y : y});
				if (symbolOrNumber == SYMBOL_ID.X) { // Totally blocking space
					this.fixedArray[y].push(SUKORO_CLOSED_SPACE); 
				} else { // Numeric spaces
					this.fixedArray[y].push(parseInt(symbolOrNumber, 10));
				}
			} else {
				this.fixedArray[y].push(null);
			}			
		}
	}
	
	// Meaning of numbers done in quick start !
	// Purification of adjacency done in quick start !
	
	this.checkerOnePossible = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	this.checkerMovedNeighbors = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	this.declarationsOpenAndClosed();
}

//--------------------------------
// Misc. methods

SolverSukoro.prototype.isBlocked = function(p_x, p_y) {
	return this.fixedArray[p_y][p_x] != null;
}

SolverSukoro.prototype.getFixedNumber = function(p_x, p_y) {
	return this.fixedArray[p_y][p_x];
}

SolverSukoro.prototype.getNotFixedNumber = function(p_x, p_y) {
	if (!this.isBlocked(p_x, p_y)) {
		return this.answerArray[p_y][p_x].getValue();
	}
	return null;
}

// Getter for drawing
SolverSukoro.prototype.isXSurroundedByNonX = function(p_x, p_y) {
	// High conventions : Directions 0123 assumption 
	var dir;
	for (var i = 0 ; i <= 3 ; i++) {
		dir = KnownDirections[i];
		if (this.neighborExists(p_x, p_y, dir) && this.methodsSetDeductions.adjacencyMethod(p_x + DeltaX[dir], p_y + DeltaY[dir]) != ADJACENCY.NO) {
			return false;
		}
	}
	return true;
}

//--------------------------------
// Input methods

SolverSukoro.prototype.emitHypothesis = function(p_x, p_y, p_adjacency) {
	return this.tryToApplyHypothesisSafe(new ChoiceEvent(p_x, p_y, SUKORO_CLOSED_SPACE, !p_adjacency));
}

SolverSukoro.prototype.emitHypothesisNumber = function(p_x, p_y, p_number) {
	return this.tryToApplyHypothesisSafe(new ChoiceEvent(p_x, p_y, p_number, true));
}

SolverSukoro.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverSukoro.prototype.makeQuickStart = function() {
	this.quickStart();
}

SolverSukoro.prototype.makeMultiPass = function() {	
	return this.multiPassSafe(this.methodsSetMultipass);
}

SolverSukoro.prototype.emitPassSpace = function(p_x, p_y) {
	return this.passEventsSafe(this.generateEventsForSpacePass({x : p_x, y : p_y}), {x : p_x, y : p_y});
}

SolverSukoro.prototype.makeResolution = function() { 
	this.resolve();
}

//--------------------------------
// Doing and undoing

function applyEventClosure(p_solver) {
	return function(p_eventToApply) {
		const choice = p_eventToApply.choice;
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		const number = p_eventToApply.number;
		const resultDo = testNumericSpaceChoice(p_solver.answerArray, x, y, number, choice);
		if (resultDo != EVENT_RESULT.SUCCESS) {
			return resultDo;
		}
		if (choice) {
			p_solver.answerArray[y][x].choose(number); 
		} else {
			p_solver.answerArray[y][x].ban(number);
			p_solver.checkerOnePossible.add(x, y);
		}
		p_solver.checkerMovedNeighbors.add(x, y);
		p_solver.existingNeighborsCoors(x, y).forEach(coors => {
			p_solver.checkerMovedNeighbors.add(coors.x, coors.y);
		});
		return EVENT_RESULT.SUCCESS;
	}
}

function undoEventClosure(p_solver) {
	return function(p_eventToUndo) {
		const x = p_eventToUndo.x;
		const y = p_eventToUndo.y;
		const number = p_eventToUndo.number;
		if (p_eventToUndo.choice) {
			p_solver.answerArray[y][x].unchoose(number);
		} else {
			p_solver.answerArray[y][x].unban(number);
		}
	}
}

//--------------------------------
// Deductions

function deductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const number = p_eventBeingApplied.number;
		if (p_eventBeingApplied.choice) {
			// Ban events for all other values in this space
			deductionsExcludeOthersNumeric(p_listEventsToApply, p_solver.answerArray, x, y, number); 
			// Adjacency ban !
			p_solver.deductionsBanAdjacentNeighbors(p_listEventsToApply, x, y, number);
		}
	}
}

SolverSukoro.prototype.deductionsBanAdjacentNeighbors = function(p_listEventsToApply, p_x, p_y, p_number) {
	if (p_number != SUKORO_CLOSED_SPACE) {	
		this.existingNeighborsCoors(p_x, p_y).forEach(coors => {
			p_listEventsToApply.push(new ChoiceEvent(coors.x, coors.y, p_number, false));
		});
	}
}

// Filters

function abortClosure(p_solver) {
	return function() {
		p_solver.checkerMovedNeighbors.clean();
		p_solver.checkerOnePossible.clean();
	}
}

function filterOnePossibleClosure(p_solver) {
	return function() {
		var listEventsToApply = [];
		var x, y, oneLeft, coors;
		for (var i = 0 ; i < p_solver.checkerOnePossible.list.length ; i++) {
			coors = p_solver.checkerOnePossible.list[i];
			x = coors.x;
			y = coors.y;
			deductionsTestOneLeft(listEventsToApply, p_solver.answerArray, x, y);
			if (p_solver.answerArray[y][x].noAvailableValue()) {
				listEventsToApply.push(new FailureEvent());
				return listEventsToApply; // Note : it may happen since unlike other solvers, when all but one values are possible for one space, the last one isn't made automatically possible before this filter, which may cause all values to be impossible at once. 
			}
		};
		p_solver.checkerOnePossible.clean();
		return listEventsToApply; 
	}
}

function filterAffectedNeighborsClosure(p_solver) {
	return function() {
		var listEventsToApply = [];
		var minOs, maxOs, val;
		var x, y, i;
		var ok = true;
		var j, coors;
		for (var j = 0 ; j < p_solver.checkerMovedNeighbors.list.length ; j++) {
			coors = p_solver.checkerMovedNeighbors.list[j];
			// Consistency with neighborhood
			x = coors.x;
			y = coors.y;
			minOs = 0;
			maxOs = 4;
			KnownDirections.forEach(dir => {
				if (p_solver.neighborExists(x, y, dir)) {
					switch(p_solver.methodsSetDeductions.adjacencyMethod(x + DeltaX[dir], y + DeltaY[dir])) {
						case ADJACENCY.YES : minOs++; break;
						case ADJACENCY.NO : maxOs--; break;
					}
				} else {
					maxOs--;
				}			
			});
			for (i = 1 ; i < minOs ; i++) {
				listEventsToApply.push(new ChoiceEvent(x, y, i, false));
			}
			for (i = maxOs+1 ; i <= 4 ; i++) {
				listEventsToApply.push(new ChoiceEvent(x, y, i, false));
			}
			val = p_solver.answerArray[y][x].getValue();
			if (val != null && val != SUKORO_CLOSED_SPACE) {
				if (minOs > val || maxOs < val) {
					ok = false;
				} 
				if (minOs == val) {
					p_solver.deductionsCompleteClosedAround(listEventsToApply, x, y, true);
				}
				if (maxOs == val) {
					p_solver.deductionsCompleteClosedAround(listEventsToApply, x, y, false);						
				}
			}
		};
		p_solver.checkerMovedNeighbors.clean();
	}
}

SolverSukoro.prototype.deductionsCompleteClosedAround = function(p_listEventsToApply, p_x, p_y, p_isClosed) {
	this.existingNeighborsCoors(p_x, p_y).forEach(coors => {
		if (this.answerArray[coors.y][coors.x].getState(SUKORO_CLOSED_SPACE) == SPACE_CHOICE.UNDECIDED) {
			p_listEventsToApply.push(new ChoiceEvent(coors.x, coors.y, SUKORO_CLOSED_SPACE, p_isClosed));
		}
	});
}

//--------------------------------
// Quickstart ! 

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvents = [{quickStartLabel : "Sukoro"}];
		p_solver.fixedSpaces.forEach(coors => {
			listQSEvents.push(new ChoiceEvent(coors.x, coors.y, p_solver.fixedArray[coors.y][coors.x], true));
		});
		return listQSEvents;
	}
}

//--------------------------------
// Exchanges solver and geographical

/**
Transforms a geographical deduction (see dedicated class GeographicalDeduction) into an appropriate event (SolveEvent in our case)
*/
transformClosure = function (p_solver) {
    return function (p_geographicalDeduction) {
		return new ChoiceEvent(p_geographicalDeduction.x, p_geographicalDeduction.y, SUKORO_CLOSED_SPACE, 
			p_geographicalDeduction.opening == ADJACENCY.NO);
    } 
};

adjacencyClosure = function (p_solver) {
    return function (p_x, p_y) {
		if (p_solver.answerArray[p_y][p_x].blocked) {
			return p_solver.value == SUKORO_CLOSED_SPACE ? ADJACENCY.NO : ADJACENCY.YES;
		}
        switch (p_solver.answerArray[p_y][p_x].getState(SUKORO_CLOSED_SPACE)) {
			case SPACE_CHOICE.YES : return ADJACENCY.NO; break;
			case SPACE_CHOICE.NO : return ADJACENCY.YES; break;
			default : return ADJACENCY.UNDECIDED; break;
        }
    }
}

// --------------------
// Pass and multipass

generateEventsForSpacePassClosure = function(p_solver) {
	return function(p_space) {
		return p_solver.generateEventsForSpacePass(p_space);
	}
}

SolverSukoro.prototype.generateEventsForSpacePass = function(p_space) {
	return [[new ChoiceEvent(p_space.x, p_space.y, SUKORO_CLOSED_SPACE, true), 
	new ChoiceEvent(p_space.x, p_space.y, SUKORO_CLOSED_SPACE, false)]];
}

namingCategoryPassClosure = function(p_solver) {
	return function (p_space) {
		return "Space (" + p_space.x + "," + p_space.y + ")"; 
	}
}

copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	return commonComparison([p_event1.y, p_event1.x, p_event1.number, p_event1.choice], [p_event2.y, p_event2.x, p_event2.number, p_event2.choice]);
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var listIndexesPass = [];
		for (var iy = 0 ; iy < p_solver.yLength ; iy++) {
			for (var ix = 0 ; ix < p_solver.xLength ; ix++) {
				if (p_solver.answerArray[iy][ix].getState(SUKORO_CLOSED_SPACE) == SPACE_CHOICE.UNDECIDED) {
					listIndexesPass.push({x : ix, y : iy});
				}
			}
		}
		return listIndexesPass;
	}
}

multipassDefineTodoClosure = function(p_solver) {
	return function(p_category) {
		const spaceInArray = p_solver.answerArray[p_category.y][p_category.x];
		return (spaceInArray.getState(SUKORO_CLOSED_SPACE) == SPACE_CHOICE.UNDECIDED);
	}
}

// --------------------
// Resolution

SolverSukoro.prototype.isSolved = function() {
	for (var x = 0; x < this.xLength ; x++) {
		for (var y = 0; y < this.yLength ; y++) {
			if (this.answerArray[y][x].getState(SUKORO_CLOSED_SPACE) == SPACE_CHOICE.UNDECIDED) {
				return false;
			}
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
		var mp = p_solver.multiPass(p_solver.methodsSetMultipass);
		if (mp == MULTIPASS_RESULT.FAILURE) {
			return RESOLUTION_RESULT.FAILURE;
		}			
		if (p_solver.isSolved()) {		
			return RESOLUTION_RESULT.SUCCESS;
		}		

		// Warning : not checked yet !
		// Find index with the most solutions
		var bestIndex = {nbD : -1};
		var nbDeductions;
		var event_;
		var resultDeds;
		for (solveX = 0 ; solveX < p_solver.xLength ; solveX++) { // x and y are somehow modified by tryToApplyHypothesis...
			for (solveY = 0 ; solveY < p_solver.yLength ; solveY++) {
				if (p_solver.answerArray[solveY][solveX].getState(SUKORO_CLOSED_SPACE) == SPACE_CHOICE.UNDECIDED) {
					[true, false].forEach(state => {
						event_ = new ChoiceEvent(solveX, solveY, SUKORO_CLOSED_SPACE, state);
						resultDeds = p_solver.tryToApplyHypothesis(event_); 
						if (resultDeds != DEDUCTIONS_RESULT.FAILURE) {							
							nbDeductions = p_solver.numberOfRelevantDeductionsSinceLastHypothesis();
							if (bestIndex.nbD < nbDeductions) {
								bestIndex = {nbD : nbDeductions , x : event_.x, y : event_.y}
							}
							p_solver.undoToLastHypothesis();
						}
					});	
				}
			}
		}
		
		// Naive, because we can with Sukoro !
		return p_solver.tryAllPossibilities(
			[new ChoiceEvent(bestIndex.x, bestIndex.y, SUKORO_CLOSED_SPACE, true), 
			new ChoiceEvent(bestIndex.x, bestIndex.y, SUKORO_CLOSED_SPACE, false)]
		);
	}
}

