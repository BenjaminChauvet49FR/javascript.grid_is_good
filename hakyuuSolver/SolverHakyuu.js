// Initialization
function SolverHakyuu(p_wallArray, p_numberArray) {
	GeneralSolver.call(this);
	this.construct(p_wallArray, p_numberArray);
}

DummySolver = function() {
	return new SolverHakyuu(generateWallArray(1, 1), [[null]]);
}
SolverHakyuu.prototype = Object.create(GeneralSolver.prototype);
SolverHakyuu.prototype.constructor = SolverHakyuu;

SolverHakyuu.prototype.construct = function(p_wallArray, p_numberArray) {
	this.generalConstruct();
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.methodsSetDeductions = new ApplyEventMethodPack(
			applyEventClosure(this), 
			deductionsClosure(this),  
			undoEventClosure(this));
	this.methodsSetPass = {
		comparisonMethod : comparison, 
		copyMethod : copying, 
		argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForRegionPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		// skipPassMethod : skipPassClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}
	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();
	this.regions = [];
	this.answerArray = generateValueArray(this.xLength, this.yLength, null);
	this.fixedArray = generateValueArray(this.xLength, this.yLength, null);
	const spacesByRegion = listSpacesByRegion(this.regionArray);
	this.regionsNumber = spacesByRegion.length;
	
	// Empty region data
	var ir;
	this.regions = [];
	for(ir=0 ; ir < this.regionsNumber ; ir++) {
		this.regions.push({
			spaces : spacesByRegion[ir],
			size : spacesByRegion[ir].length,
			possibilities : null
		});
	}
	
	this.numericSpacesList = [];
	// Data now that region spaces are known
	// Warning : out-of-bound regions not handled.
	for(ir = 0 ; ir < this.regionsNumber ; ir++) {
		region = this.regions[ir];
		//region.size = region.spaces.length;
		for (is = 0 ; is < region.spaces.length ; is++) {
			x = region.spaces[is].x;
			y = region.spaces[is].y;
			this.answerArray[y][x] = new SpaceNumeric(1, region.size);
			if (p_numberArray[y][x] != null) {
				this.fixedArray[y][x] = p_numberArray[y][x];
				this.numericSpacesList.push({x : x, y : y});
			} 
		}
	}
	var notPlacedYet;
	for(ir = 0 ; ir < this.regionsNumber ; ir++) {
		region = this.regions[ir];
		notPlacedYet = [];
		for (is = 0 ; is < region.spaces.length ; is++) {
			notPlacedYet.push(1); // One number expected per region !
		}
		region.possibilities = new NumericSpacesSetAccountant(notPlacedYet, 1, region.size, region.size)
	}	
}

SolverHakyuu.prototype.banIfNecessary = function(p_numberArray, p_x, p_y, p_fixedVal) {
	if ((p_numberArray[p_y][p_x] == null) && (p_fixedVal <= this.answerArray[p_y][p_x].getMax())) {
		this.answerArray[p_y][p_x].banIfNecessary(p_fixedVal);
	}
}

//--------------------------------
// Misc. methods

SolverHakyuu.prototype.getFirstSpaceRegion = function(p_index) {
	return this.regions[p_index].spaces[0];
}

SolverHakyuu.prototype.getFixedNumber = function(p_x, p_y) {
	return this.fixedArray[p_y][p_x];
}

SolverHakyuu.prototype.getNotFixedNumber = function(p_x, p_y) {
	return this.answerArray[p_y][p_x].getValue();
}

SolverHakyuu.prototype.getNumber = function(p_x, p_y) {
	return this.answerArray[p_y][p_x].getValue();
}

SolverHakyuu.prototype.getRegion = function(p_x, p_y) {
	return this.regions[this.getRegionIndex(p_x, p_y)];
}

SolverHakyuu.prototype.getRegionIndex = function(p_x, p_y) {
	return this.regionArray[p_y][p_x];
}

//--------------------------------

// Input methods
SolverHakyuu.prototype.emitHypothesis = function(p_x, p_y, p_number){
	this.tryToApplyHypothesisSafe(new ChoiceEvent(p_x, p_y, p_number, true));
}

SolverHakyuu.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverHakyuu.prototype.passRegion = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(this.regions[p_indexRegion]);
	this.passEventsSafe(generatedEvents, p_indexRegion); 
}

SolverHakyuu.prototype.makeMultiPass = function() {
	this.multiPassSafe(this.methodsSetMultipass);
}

SolverHakyuu.prototype.makeQuickStart = function () {
	this.quickStart();
}

//--------------------------------
// Doing and undoing

function applyEventClosure(p_solver) {
	return function(p_eventToApply) {
		const choice = p_eventToApply.choice;
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		const number = p_eventToApply.number;
		const answer = testNumericSpaceChoice(p_solver.answerArray, x, y, number, choice);
		if (answer != EVENT_RESULT.SUCCESS) {
			return answer;
		}
		if (choice) {
			p_solver.answerArray[y][x].choose(number);
			p_solver.getRegion(x, y).possibilities.warnPlaced(number);
		} else {
			p_solver.answerArray[y][x].ban(number);
			p_solver.getRegion(x, y).possibilities.warnBanned(number);
		}
		return EVENT_RESULT.SUCCESS;
	}
}

function undoEventClosure(p_solver) {
	return function(p_eventToUndo) {
		if (p_eventToUndo.choice) {
			p_solver.answerArray[p_eventToUndo.y][p_eventToUndo.x].unchoose(p_eventToUndo.number);
			p_solver.getRegion(p_eventToUndo.x, p_eventToUndo.y).possibilities.unwarnPlaced(p_eventToUndo.number);
		} else {
			p_solver.answerArray[p_eventToUndo.y][p_eventToUndo.x].unban(p_eventToUndo.number);
			p_solver.getRegion(p_eventToUndo.x, p_eventToUndo.y).possibilities.unwarnBanned(p_eventToUndo.number);
		}
	}
}

//--------------------------------
// Deductions

function deductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventToApply) {
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		const number = p_eventToApply.number;
		if (p_eventToApply.choice) {
			
			// Ban events for all other values in this space
			p_listEventsToApply = deductionsExcludeOthersNumeric(p_listEventsToApply, p_solver.answerArray, x, y, number);
			// Ban events for this values in all other non-occupied spaces in this region
			p_listEventsToApply = deductionsAlertNoneLeftInSpaceSet(p_listEventsToApply, p_solver.getRegion(x, y).possibilities, number, p_solver.getRegion(x, y).spaces, p_solver.answerArray);
			
			// Ban left/up/right/down
			var xLimit = Math.max(0, x-number);
			for (var x2 = x-1; x2 >= xLimit ; x2--) {
				p_listEventsToApply.push(new ChoiceEvent(x2, y, number, false));
			}
			xLimit = Math.min(p_solver.xLength-1, x+number);
			for (var x2 = x+1; x2 <= xLimit ; x2++) {
				p_listEventsToApply.push(new ChoiceEvent(x2, y, number, false));
			}
			var yLimit = Math.max(0, y-number);
			for (var y2 = y-1; y2 >= yLimit ; y2--) {
				p_listEventsToApply.push(new ChoiceEvent(x, y2, number, false));
			}
			yLimit = Math.min(p_solver.yLength-1, y+number);
			for (var y2 = y+1; y2 <= yLimit ; y2++) {
				p_listEventsToApply.push(new ChoiceEvent(x, y2, number, false));
			}
		} else {
			p_listEventsToApply = deductionsTestOneLeft(p_listEventsToApply, p_solver.answerArray, x, y);
			p_listEventsToApply = deductionsAlertRemainingPossibilitiesInSpaceSet(p_listEventsToApply, p_solver.getRegion(x, y).possibilities, number, p_solver.getRegion(x, y).spaces, p_solver.answerArray);
		}
		return p_listEventsToApply;
	}
}

//--------------------------------
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvts = [{quickStartLabel : "Hakyuu"}];
		var x, y;
		p_solver.numericSpacesList.forEach(coors => {			
			x = coors.x;
			y = coors.y;
			listQSEvts.push(new ChoiceEvent(x, y, p_solver.fixedArray[y][x], true));			
		});
		// Note : considering all fixed numbers as choice events is great for code smoothing, up to and including in QS... just don't remove everything
		var coors;
		p_solver.regions.forEach(region => {
			if (region.size == 1) {
				coors = region.spaces[0];
				listQSEvts.push(new ChoiceEvent(coors.x, coors.y, 1, true));
			}
		});
		return listQSEvts;
	}
}

//--------------------------------
// Pass !

SolverHakyuu.prototype.generateEventsForRegionPass = function(p_region) {
	var answer = [];
	var x, y;
	p_region.spaces.forEach(space => {
		x = space.x;
		y = space.y;
		if (this.getNotFixedNumber(x, y) == null) { 
			answer.push(this.oneSpaceEventsList(x, y, p_region.size));
		}			 
	});
	return answer;
}

function generateEventsForRegionPassClosure(p_solver) {
	return function(p_index) {
		return p_solver.generateEventsForRegionPass(p_solver.regions[p_index]);
	}
}

SolverHakyuu.prototype.oneSpaceEventsList = function(p_x, p_y, p_upTo) {
	var eventsSpace = [];
	for (number = 1 ; number <= p_upTo ; number++) {
		eventsSpace.push(new ChoiceEvent(p_x, p_y, number, true));
	}
	return eventsSpace;
}

function comparison(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.number, p_event1.choice],
	[p_event2.y, p_event2.x, p_event2.number, p_event2.choice]]);
} // Note : I could have factorized the comparison method for choice, but I didn't.

function copying(p_event) {
	return p_event.copy();
}

// Note : Factorize
namingCategoryClosure = function(p_solver) {
	return function(p_index) {
		return "Region "+ p_index + " (" + p_solver.getFirstSpaceRegion(p_index).x +","+ p_solver.getFirstSpaceRegion(p_index).y + ")"; 
	}
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var answer = [];
		for (var i = 0 ; i < p_solver.regionsNumber ; i++) {
			answer.push(i);
		}
		return answer;
	}
}