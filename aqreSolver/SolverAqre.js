// Initialization

const NOT_FORCED = -1; 

const AQRE_PASS_CATEGORY = {
	REGION : 0,
	ROW : 1,
	COLUMN : 2,
	CUSTOM : 3
} 
// Very empty puzzles : numbers 14, 26, 28
// Can be solved by selective pass : 11 (lotsa 1-spaces regions with 0 and 1) (Solved within a few seconds by solver)
// Can be solved by passing the first 4 columns (contain regions) : 15. (solved quite quickly by solver)
// Can be solved when specific regions of size 1 are passed : 49 (solved quite quickly by solver)
// How about passing an empty region ?

function SolverAqre(p_wallArray, p_indications) {
	GeneralSolver.call(this);
	this.construct(p_wallArray, p_indications);
}

SolverAqre.prototype = Object.create(GeneralSolver.prototype);
SolverAqre.prototype.constructor = SolverAqre;

function DummySolver() {
	return new SolverAqre(generateWallArray(1, 1), []);
}

SolverAqre.prototype.construct = function(p_wallArray, p_indications) {
	this.generalConstruct();
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.methodsSetPass = {
		comparisonMethod : comparison, 
		copyMethod : copying, 
		argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForRegionPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		skipPassMethod : skipPassClosure(this)
	};
	this.makeItGeographical(this.xLength, this.yLength, new ApplyEventMethodGeographicalPack(
			applyEventClosure(this), 
			deductionsClosure(this), 
			adjacencyClosure(this), 
			transformClosure(this), 
			undoEventClosure(this)));
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterTODOStripesClosure(this)]);
	
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this),
		searchSolutionMethod : searchClosure(this),
		isSolvedMethod : isSolvedClosure(this)
	}

	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();
	this.answerArray = generateValueArray(this.xLength, this.yLength, ADJACENCY.UNDECIDED);
	this.stripesArray = generateFunctionValueArray(this.xLength, this.yLength, function() {
		return {horizontal : [], vertical : []}
	});
	this.horizontalStripes = [];
	this.verticalStripes = [];
	var ix,iy;
	var lastRegionNumber = 0;
	
	const spacesByRegion = listSpacesByRegion(this.regionArray);
	this.regionsNumber = spacesByRegion.length;

	// Blantly initialize data of regions
	var ir;
	this.regions = [];
	for(ir=0 ; ir < this.regionsNumber ; ir++) {
		this.regions.push({
			spaces : spacesByRegion[ir],
			expectedNumberOfClosedsInRegion : NOT_FORCED,
			notPlacedYet : null,
			size : spacesByRegion[ir].length
		});
	}
	
	var region;
	p_indications.forEach(indic => {
		region = this.regions[indic.index];
		region.expectedNumberOfClosedsInRegion = indic.value;
		region.notPlacedYet = {OPENs : indic.value};
	});
	
	// Initialize numbers of Xs to place 
	for(ir = 0 ; ir < this.regionsNumber ; ir++) {
		region = this.regions[ir];
		if (region.notPlacedYet != null) {
			region.notPlacedYet.CLOSEDs = region.size-region.notPlacedYet.OPENs;
		} else {
			region.notDecidedYet = region.size; // Alternative to regions that are not forced, for multipass and solvers purposes.
		}
	}

	//Note : grid not purified. (if there are banned spaces)
	
	this.declarationsOpenAndClosed();
}

//--------------------------------

// Misc. methods

SolverAqre.prototype.expectedNumberInRegion = function(p_ir) {
	return this.regions[p_ir].expectedNumberOfClosedsInRegion;
}

SolverAqre.prototype.getSpaceCoordinates = function(p_indexRegion, p_indexSpace) {
	return this.regions[p_indexRegion].spaces[p_indexSpace];
}

SolverAqre.prototype.getAnswer = function(p_x, p_y) {
	return this.answerArray[p_y][p_x];
}

SolverAqre.prototype.getRegionIndex = function(p_x, p_y) {
	return this.regionArray[p_y][p_x];
}

SolverAqre.prototype.getFirstSpaceRegion = function(p_ir) {
	return this.regions[p_ir].spaces[0];
}

SolverAqre.prototype.getRegionSpacesFromSpace = function(p_x, p_y) {
	return this.regions[this.regionArray[p_y][p_x]].spaces;
} // Array of {x, y} items

//--------------------------------
// Input methods

SolverAqre.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_symbol));
}

SolverAqre.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverAqre.prototype.makeQuickStart = function() {
	this.quickStart();
}

SolverAqre.prototype.emitPassRegion = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	const index = {category : AQRE_PASS_CATEGORY.REGION, value : p_indexRegion};
	this.passEvents(generatedEvents, index); 
}

SolverAqre.prototype.emitPassRow = function(p_y) {
	const generatedEvents = this.generateEventsForRowPass(p_y);
	const index = {category : AQRE_PASS_CATEGORY.ROW, y : p_y};
	this.passEvents(generatedEvents, index); 
}

SolverAqre.prototype.emitPassColumn = function(p_x) {
	const generatedEvents = this.generateEventsForColumnPass(p_x);
	const index = {category : AQRE_PASS_CATEGORY.COLUMN, x : p_x};
	this.passEvents(generatedEvents, index); 
}

SolverAqre.prototype.makeMultiPass = function() {
	this.multiPass(this.methodsSetMultipass);
}

SolverAqre.prototype.passSelectedSpaces = function(p_coorsList) {
	const eventsForPass = this.generateEventsForSpacesList(p_coorsList);
	return this.passEvents(eventsForPass, {family : AQRE_PASS_CATEGORY.CUSTOM, numberSpaces : eventsForPass.length});
}

SolverAqre.prototype.makeResolution = function() { 
	this.resolve();
}

//--------------------------------
// Doing and undoing

SolverAqre.prototype.putNew = function(p_x, p_y, p_symbol) {
	if (this.answerArray[p_y][p_x] == p_symbol) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[p_y][p_x] != ADJACENCY.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerArray[p_y][p_x] = p_symbol;
	var ir = this.regionArray[p_y][p_x];
	var region = this.regions[ir];
	if (region.notPlacedYet != null) {
		if (p_symbol == ADJACENCY.YES) {
			region.notPlacedYet.OPENs--;
		} else if (p_symbol == ADJACENCY.NO) {
			region.notPlacedYet.CLOSEDs--;
		}
	} else {
		region.notDecidedYet--;
	}
	return EVENT_RESULT.SUCCESS;
}


applyEventClosure = function(p_solver) {
	return function(eventToApply) {
		return p_solver.putNew(eventToApply.x, eventToApply.y, eventToApply.symbol);
	}
}

undoEventClosure = function(p_solver) {
	return function(eventToApply) {
		const x = eventToApply.x;
		const y = eventToApply.y;
		const symbol = eventToApply.symbol;
		p_solver.answerArray[y][x] = ADJACENCY.UNDECIDED;
		var ir = p_solver.regionArray[y][x];
		var region = p_solver.regions[ir];
		if (region.notPlacedYet != null) {
			if (symbol == ADJACENCY.YES) {
				region.notPlacedYet.OPENs++;
			} else if (symbol == ADJACENCY.NO) {
				region.notPlacedYet.CLOSEDs++;
			}
		} else {
			region.notDecidedYet++;
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
// Quickstart !

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvts = [{quickStartLabel  :"Aqre"}]
		
		p_solver.regions.forEach(region => {
			if (region.notPlacedYet != null) {
				if (region.notPlacedYet.CLOSEDs == 0) {
					region.spaces.forEach(space => {
						listQSEvts.push(new SpaceEvent(space.x, space.y, ADJACENCY.YES));
					});
				}
				if (region.notPlacedYet.OPENs == 0) {
					region.spaces.forEach(space => {
						listQSEvts.push(new SpaceEvent(space.x, space.y, ADJACENCY.NO));
					});
				}
			}			
		});
		return listQSEvts;
	}
}

//--------------------------------
// Deductions

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const ir = p_solver.regionArray[y][x];
		const region = p_solver.regions[ir];
		const symbol = p_eventBeingApplied.symbol;
		if (symbol == ADJACENCY.NO) {
			//Alert on region
			if (region.notPlacedYet != null && region.notPlacedYet.CLOSEDs == 0) {
				p_listEventsToApply = p_solver.alertRegionDeductions(p_listEventsToApply, ir, ADJACENCY.YES, region.notPlacedYet.OPENs);			
			}
			// Strip searching
			p_listEventsToApply = p_solver.stripDeductions(p_listEventsToApply, x, y, ADJACENCY.NO, ADJACENCY.YES);
		} else {
			//Alert on region
			if (region.notPlacedYet != null && region.notPlacedYet.OPENs == 0) {
				p_listEventsToApply = p_solver.alertRegionDeductions(p_listEventsToApply, ir, ADJACENCY.NO, region.notPlacedYet.CLOSEDs);			
			}
			p_listEventsToApply = p_solver.stripDeductions(p_listEventsToApply, x, y, ADJACENCY.YES, ADJACENCY.NO);
		}
		return p_listEventsToApply;
	}
}

SolverAqre.prototype.alertRegionDeductions = function(p_listEvents, p_regionIndex, p_missingSymbol, p_missingNumber) {
	const region = this.regions[p_regionIndex];
	var xa,ya,alertSpace;
	var remaining = p_missingNumber
	for(var i = 0 ; i < region.size ; i++) {
		alertSpace = region.spaces[i];
		xa = alertSpace.x;
		ya = alertSpace.y;
		if (this.answerArray[ya][xa] == ADJACENCY.UNDECIDED) {
			p_listEvents.push(new SpaceEvent(xa, ya, p_missingSymbol));
			remaining--;
			if (remaining == 0){
				break;
			}
		}
	}
	return p_listEvents;
}

SolverAqre.prototype.stripDeductions = function(p_listEventsToApply, p_x, p_y, p_newState, p_fillingState) {
	// Horizontal : look from (3 spaces to the left) to (3 spaces to the right) (within grid boundaries, of course) : if among 4 consecutive spaces there are three 'newState', fill the 4th one
	var counterTotal = 0;
	var counterNewState = 0;
	var lastNotNewStateCoor = null;
	for (var x = Math.max(0, p_x-3) ; x <= Math.min(this.xLength-1, p_x+3) ; x++) {
		if (this.answerArray[p_y][x] == p_newState) {
			counterNewState++;
		} else {
			lastNotNewStateCoor = x;
		}
		if (counterNewState == 3 && lastNotNewStateCoor != null) {
			p_listEventsToApply.push(new SpaceEvent(lastNotNewStateCoor, p_y, p_fillingState));
		}
		if (counterNewState == 4) {
			p_listEventsToApply.push(new FailureEvent());
			return p_listEventsToApply;
		}
		if (counterTotal >= 3) {
			if (this.answerArray[p_y][x-3] == p_newState) {
				counterNewState--;
			}
		} else {
			counterTotal++;
		}
	}
	// Same vertically
	counterTotal = 0;
	counterNewState = 0;
	lastNotNewStateCoor = null;
	for (var y = Math.max(0, p_y-3) ; y <= Math.min(this.yLength-1, p_y+3) ; y++) {
		if (this.answerArray[y][p_x] == p_newState) {
			counterNewState++;
		} else {
			lastNotNewStateCoor = y;
		}
		if (counterNewState == 3 && lastNotNewStateCoor != null) {
			p_listEventsToApply.push(new SpaceEvent(p_x, lastNotNewStateCoor, p_fillingState));
		}
		if (counterNewState == 4) {
			p_listEventsToApply.push(new FailureEvent());
			return p_listEventsToApply;
		}
		if (counterTotal >= 3) {
			if (this.answerArray[y-3][p_x] == p_newState) {
				counterNewState--;
			}
		} else {
			counterTotal++;
		}
	}
	
	return p_listEventsToApply;
}


function filterTODOStripesClosure(p_solver) {
	return function() {
		var answer = [];
		p_solver.cleanTODO();
		return answer; // Yup... this is "to do".
	}
}

function abortClosure(p_solver) {
	return function() {
		p_solver.cleanTODO();
	}
}

SolverAqre.prototype.cleanTODO = function() {

}

// --------------------
// Passing

generateEventsForRegionPassClosure = function(p_solver) {
	return function(p_index) {
		switch(p_index.category) {
			case AQRE_PASS_CATEGORY.REGION : 
				return p_solver.generateEventsForRegionPass(p_index.value);
			case AQRE_PASS_CATEGORY.ROW : 
				return p_solver.generateEventsForRowPass(p_index.y);
			case AQRE_PASS_CATEGORY.COLUMN : 
				return p_solver.generateEventsForColumnPass(p_index.x);
		}
	}
}

// Generate covering events for "region pass".
SolverAqre.prototype.generateEventsForRegionPass = function(p_indexRegion) {
	var choiceList = [];
	this.regions[p_indexRegion].spaces.forEach(space => {
		this.addChoiceIfUndecided(choiceList, space.x, space.y);			 
	});
	return choiceList;
}

SolverAqre.prototype.generateEventsForRowPass = function(p_y) {
	var choiceList = [];
	for (var x = 0 ; x < this.xLength ; x++) {
		this.addChoiceIfUndecided(choiceList, x, p_y);
	}
	return choiceList;
}

SolverAqre.prototype.generateEventsForColumnPass = function(p_x) {
	var choiceList = [];
	for (var y = 0 ; y < this.yLength ; y++) {
		this.addChoiceIfUndecided(choiceList, p_x, y);
	}
	return choiceList;
}

SolverAqre.prototype.addChoiceIfUndecided = function(p_choiceList, p_x, p_y) {
	if (this.answerArray[p_y][p_x] == ADJACENCY.UNDECIDED) { // It would still be correct, albeit useless, to pass already filled spaces
		const region = this.regions[this.getRegionIndex(p_x, p_y)];
		if (region.notPlacedYet != null && region.notPlacedYet.YES < region.notPlacedYet.NO) {
			p_choiceList.push([new SpaceEvent(p_x, p_y, ADJACENCY.YES), new SpaceEvent(p_x, p_y, ADJACENCY.NO)]);
		} else {			
			p_choiceList.push([new SpaceEvent(p_x, p_y, ADJACENCY.NO), new SpaceEvent(p_x, p_y, ADJACENCY.YES)]);
		}
	}
}

SolverAqre.prototype.generateEventsForSpacesList = function(p_coorsList) {
	var answer = [];
	p_coorsList.forEach(space => {
		this.addChoiceIfUndecided(answer, space.x, space.y)
	});
	return answer;
}

copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.symbol], [p_event2.y, p_event2.x, p_event2.symbol]]);
}

// --------------------
// Multipass

// Note : incertainity can be improved if incertain spaces are counted in real time. Also we can do one pass of answerArray rather than counting each row and then each column.
orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var indexList = [];
		var incertainity;
		for (var i = 0; i < p_solver.regions.length ; i++) {
			if (p_solver.regions[i].notPlacedYet) {
				incertainity = p_solver.incertainityRegion(i);
				if (incertainity <= 25) {					
					indexList.push({category : AQRE_PASS_CATEGORY.REGION, value : i, 
						incertainity : incertainity});
				}
			} 
		}
		for (var x = 0 ; x < p_solver.xLength ; x++) {
			indexList.push({category : AQRE_PASS_CATEGORY.COLUMN, x : x,
				incertainity : p_solver.incertainityColumn(x)});
		}
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			indexList.push({category : AQRE_PASS_CATEGORY.ROW, y : y,
				incertainity : p_solver.incertainityRow(y)});
		}
		indexList.sort(function(p_index1, p_index2) {
			return p_index1.incertainity - p_index2.incertainity;
		}); 
		return indexList;
	}
}

SolverAqre.prototype.incertainityRegion = function(p_ir) { 
	const region = this.regions[p_ir];
	return Math.min(region.notPlacedYet.OPENs, region.notPlacedYet.CLOSEDs);	
}

SolverAqre.prototype.incertainityRow = function(p_y) { 
	var answer = 0;
	for (var x = 0 ; x < this.xLength ; x++) {
		if (this.answerArray[p_y][x] == ADJACENCY.UNDECIDED) {
			answer++;
		}
	}
	return answer;
}

SolverAqre.prototype.incertainityColumn = function(p_x) { 
	var answer = 0;
	for (var y = 0 ; y < this.yLength ; y++) {
		if (this.answerArray[y][p_x] == ADJACENCY.UNDECIDED) {
			answer++;
		}
	}
	return answer;
}

skipPassClosure = function(p_solver) {
	return function (p_index) {
		return p_solver.incertainity > 20; // Arbitrary value !
	}
}

namingCategoryClosure = function(p_solver) {
	return function(p_index) {
		switch(p_index.category) {
			case AQRE_PASS_CATEGORY.REGION : 
				return "Region "+ p_index.value + " (" + p_solver.getFirstSpaceRegion(p_index.value).x +" "+ p_solver.getFirstSpaceRegion(p_index.value).y + ")"; break;
			case AQRE_PASS_CATEGORY.ROW : return "Row " + p_index.y; break;
			case AQRE_PASS_CATEGORY.COLUMN : return "Column " + p_index.x; break;
			case AQRE_PASS_CATEGORY.CUSTOM : return "Selection " + p_index.numberSpaces + " space" + (p_indexAndFamily.numberSpaces > 1 ? "s" : ""); break;
			
		} 
	}
}

// --------------------
// Resolution

SolverAqre.prototype.isSolved = function() {
	// Quick check
	for (var i = 0 ; i < this.regions.length ; i++) {
		if ((this.regions[i].notDecidedYet && this.regions[i].notDecidedYet > 0) ||
			(this.regions[i].notPlacedYet && this.regions[i].notPlacedYet.CLOSEDs > 0)) {
			return false;
		} 
	};
	return true;
}

function isSolvedClosure(p_solver) {
	return function() {
		return p_solver.isSolved();
	}
}

function searchClosure(p_solver) { // Kinda identical to Heyawake as this is written
	return function() {
		var mp = p_solver.multiPass(p_solver.methodsSetMultipass);
		if (mp == MULTIPASS_RESULT.FAILURE) {
			return RESOLUTION_RESULT.FAILURE;
		}			
		if (p_solver.isSolved()) {		
			return RESOLUTION_RESULT.SUCCESS;
		}		
		
		// Find index with the most solutions
		var bestIndex = {nbD : -1};
		var nbDeductions;
		var event_;
		var solveResultEvt;
		for (solveX = 0 ; solveX < p_solver.xLength ; solveX++) { // x and y are somehow modified by tryToApplyHypothesis...
			for (solveY = 0 ; solveY < p_solver.yLength ; solveY++) {
				if (p_solver.answerArray[solveY][solveX] == ADJACENCY.UNDECIDED) {
					[ADJACENCY.YES, ADJACENCY.NO].forEach(value => {
						event_ = new SpaceEvent(solveX, solveY, value);
						solveResultEvt = p_solver.tryToApplyHypothesis(event_); 
						if (solveResultEvt == DEDUCTIONS_RESULT.SUCCESS) {
							nbDeductions = p_solver.numberOfRelevantDeductionsSinceLastHypothesis();
							if (bestIndex.nbD < nbDeductions) {
								bestIndex = {nbD : nbDeductions , evt : event_.copy()}
							}
							p_solver.undoToLastHypothesis();
						}
					});	
				}
			}
		}
		
		// Naive recursion !
		return p_solver.tryAllPossibilities([new SpaceEvent(bestIndex.evt.x, bestIndex.evt.y, ADJACENCY.YES), new SpaceEvent(bestIndex.evt.x, bestIndex.evt.y, ADJACENCY.NO)]);
	} 
} 

