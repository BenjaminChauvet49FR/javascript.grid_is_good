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
	/*this.methodsSetPass = {
		comparisonMethod : comparison, 
		copyMethod : copying, 
		argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForRegionPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		skipPassMethod : skipPassClosure(this)
	};*/
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}
	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();
	this.regions = [];
	this.numbersArray = generateValueArray(this.xLength, this.yLength, null);
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
	
	// Data now that region spaces are known
	for(ir = 0 ; ir < this.regionsNumber ; ir++) {
		region = this.regions[ir];
		//region.size = region.spaces.length;
		for (is = 0 ; is < region.spaces.length ; is++) {
			x = region.spaces[is].x;
			y = region.spaces[is].y;
			if (p_numberArray[y][x] == null) {
				this.numbersArray[y][x] = new SpaceNumeric(1, region.size);
			} 
		}
	}
	
	// Purification ! (requires that non-fixed spaces are set) 
	for(ir = 0 ; ir < this.regionsNumber ; ir++) {
		region = this.regions[ir];
		for (is = 0 ; is < region.spaces.length ; is++) {
			x = region.spaces[is].x;
			y = region.spaces[is].y;
			fixedVal = p_numberArray[y][x];
			if (fixedVal != null) {
				this.numbersArray[y][x] = {fixedValue : p_numberArray[y][x]};
				region.spaces.forEach(space => {
					x2 = space.x;
					y2 = space.y;
					if (p_numberArray[y2][x2] == null) {
						this.numbersArray[y2][x2].ban(fixedVal);
					} 
				});
			}
		}
	}
	
	// Puzzle purification. Any conditional purification must be done after unconditional purification.
	// Hakyuu specific part : ripple effect (offensve programming : do not ban anything that doesn't respect the max of a space. Also, do not ban spaces of the region as they have already been banned and there are no success checks here.)
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			fixedVal = p_numberArray[y][x];
			if (fixedVal != null) {
				var xLimit = Math.max(0, x-fixedVal);
				for (var x2 = x-1; x2 >= xLimit ; x2--) {
					this.banIfNecessary(p_numberArray, x2, y, fixedVal);
				}
				xLimit = Math.min(this.xLength-1, x+fixedVal);
				for (var x2 = x+1; x2 <= xLimit ; x2++) {
					this.banIfNecessary(p_numberArray, x2, y, fixedVal);
				}
				var yLimit = Math.max(0, y-fixedVal);
				for (var y2 = y-1; y2 >= yLimit ; y2--) {
					this.banIfNecessary(p_numberArray, x, y2, fixedVal);
				}
				yLimit = Math.min(this.yLength-1, y+fixedVal);
				for (var y2 = y+1; y2 <= yLimit ; y2++) {
					this.banIfNecessary(p_numberArray, x, y2, fixedVal);
				}
			}
		}
	}
	
	// Filters for each region (after purification) 
	var notPlacedYet;
	var setupNumericSpaces;
	for(ir = 0 ; ir < this.regionsNumber ; ir++) {
		region = this.regions[ir];
		notPlacedYet = [];
		setupNumericSpaces = [];
		for (is = 0 ; is < region.spaces.length ; is++) {
			notPlacedYet.push(1); // One number expected per region !
		}
		for (is = 0 ; is < region.spaces.length ; is++) {
			x = region.spaces[is].x;
			y = region.spaces[is].y;
			const min = 1;
			fixedVal = p_numberArray[y][x]; // Remember, p_numberArray is an argument of the constructor.
			if (fixedVal != null) {
				notPlacedYet[fixedVal - min]--;
			} else {
				setupNumericSpaces.push(this.numbersArray[y][x]);
			}
		}
		region.possibilities = new SpaceSetNumeric(setupNumericSpaces, notPlacedYet, 1, region.size);
	}
}

SolverHakyuu.prototype.banIfNecessary = function(p_numberArray, p_x, p_y, p_fixedVal) {
	if ((p_numberArray[p_y][p_x] == null) && (p_fixedVal <= this.numbersArray[p_y][p_x].getMax())) {
		this.numbersArray[p_y][p_x].banIfNecessary(p_fixedVal);
	}
}

//--------------------------------
// Misc. methods

SolverHakyuu.prototype.getFixedNumber = function(p_x, p_y) {
	return this.numbersArray[p_y][p_x].fixedValue;
}

SolverHakyuu.prototype.getNotFixedNumber = function(p_x, p_y) {
	return this.numbersArray[p_y][p_x].getValue();
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
	this.tryToApplyHypothesis(new SpaceAllowEvent(p_x, p_y, p_number, true));
}

SolverHakyuu.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverHakyuu.prototype.passRegion = function(p_indexRegion) {
	//const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	//this.passEvents(generatedEvents, this.methodsSetDeductions, this.methodsSetPass, p_indexRegion, "Region "+p_indexRegion); 
}

SolverHakyuu.prototype.makeMultiPass = function() {
	//this.multiPass(this.methodsSetMultipass);
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
		const fixedVal = p_solver.getFixedNumber(x, y);
		if (fixedVal) {
			if ((number == fixedVal) == choice) {
				return EVENT_RESULT.HARMLESS;
			}	else {
				return EVENT_RESULT.FAILURE;
			}
		}
		if (number > p_solver.numbersArray[y][x].getMax()) {
			return choice ? EVENT_RESULT.FAILURE : EVENT_RESULT.HARMLESS;
		}
		const currentNumber = p_solver.getNotFixedNumber(x, y); 
		if (choice && (currentNumber != null) && (number != currentNumber)) {
			return EVENT_RESULT.FAILURE;
		}
		const currentState = (p_solver.numbersArray[y][x].getState(number));
		if (currentState == SPACE_CHOICE.YES) {
			return choice ? EVENT_RESULT.HARMLESS : EVENT_RESULT.FAILURE;
		} else if (currentState == SPACE_CHOICE.NO) {
			return choice ? EVENT_RESULT.FAILURE : EVENT_RESULT.HARMLESS;
		} 
		if (choice) {
			p_solver.numbersArray[y][x].choose(number);
			p_solver.getRegion(x, y).possibilities.warnPlaced(number);
		} else {
			p_solver.numbersArray[y][x].ban(number);
			p_solver.getRegion(x, y).possibilities.warnBanned(number);
		}
		return EVENT_RESULT.SUCCESS;
	}
}

function undoEventClosure(p_solver) {
	return function(p_eventToUndo) {
		if (p_eventToUndo.choice) {
			p_solver.numbersArray[p_eventToUndo.y][p_eventToUndo.x].unchoose(p_eventToUndo.number);
			p_solver.getRegion(p_eventToUndo.x, p_eventToUndo.y).possibilities.unwarnPlaced(p_eventToUndo.number);
		} else {
			p_solver.numbersArray[p_eventToUndo.y][p_eventToUndo.x].unban(p_eventToUndo.number);
			p_solver.getRegion(p_eventToUndo.x, p_eventToUndo.y).possibilities.unwarnBanned(p_eventToUndo.number);
		}
	}
}

//--------------------------------
// Deductions

function deductionsClosure(p_solver) {
	return function(p_eventList, p_eventToApply) {
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		const number = p_eventToApply.number;
		if (p_eventToApply.choice) {

			// Ban events for all other values in this space
			for (var i = p_solver.numbersArray[y][x].getMin() ; i <= p_solver.numbersArray[y][x].getMax() ; i++) {
				if (i != number) {
					p_eventList.push(new SpaceAllowEvent(x, y, i, false));
				};
			}
			// Ban events for this values in all other non-occupied spaces in this region
			p_solver.getRegion(x, y).spaces.forEach(space => {
				x2 = space.x;
				y2 = space.y;
				if (!p_solver.getFixedNumber(x2, y2) && ((x2 != x) || (y2 != y))) {
					p_eventList.push(new SpaceAllowEvent(x2, y2, number, false));
				} 
			});	
			// Ban left/up/right/down
			var xLimit = Math.max(0, x-number);
			for (var x2 = x-1; x2 >= xLimit ; x2--) {
				p_eventList.push(new SpaceAllowEvent(x2, y, number, false));
			}
			xLimit = Math.min(p_solver.xLength-1, x+number);
			for (var x2 = x+1; x2 <= xLimit ; x2++) {
				p_eventList.push(new SpaceAllowEvent(x2, y, number, false));
			}
			var yLimit = Math.max(0, y-number);
			for (var y2 = y-1; y2 >= yLimit ; y2--) {
				p_eventList.push(new SpaceAllowEvent(x, y2, number, false));
			}
			yLimit = Math.min(p_solver.yLength-1, y+number);
			for (var y2 = y+1; y2 <= yLimit ; y2++) {
				p_eventList.push(new SpaceAllowEvent(x, y2, number, false));
			}
		} else {
			const last = p_solver.numbersArray[y][x].getOneLeft();
			// Only one possibility left in this space
			if (last) {
				p_eventList.push(new SpaceAllowEvent(x, y, last, true));
			}
			// Only one possibility left in this space
			p_eventList = p_solver.alertOneLeftInRegion(p_eventList,  p_solver.getRegion(x, y), number);
			
		}
		return p_eventList;
	}
}

SolverHakyuu.prototype.alertOneLeftInRegion = function(p_eventList, p_region, p_number) {
	if ((p_region.possibilities.getNotBannedYet(p_number) == 0) && (p_region.possibilities.getNotPlacedYet(p_number) > 0)) {
		var x, y;
		var spaceCount = 0;
		p_region.spaces.forEach(space => {
			x = space.x;
			y = space.y;
			if (!this.getFixedNumber(x, y) && this.numbersArray[y][x].getState(p_number) == SPACE_CHOICE.UNDECIDED) {
				p_eventList.push(new SpaceAllowEvent(x, y, p_number, true));
				spaceCount++;
			}
		});
		if (spaceCount != p_region.possibilities.getNotPlacedYet(p_number)) {
			p_eventList.push(new FailureEvent());
		}
	}
	return p_eventList;
}

//--------------------------------
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvts = [{quickStartLabel : "Hakyuu"}];
		var justOne;
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			for (var x = 0 ; x < p_solver.xLength ; x++) {
				if (!p_solver.numbersArray[y][x].fixedValue) {
					justOne = p_solver.numbersArray[y][x].getOneLeft();
					if (justOne) {
						listQSEvts.push(new SpaceAllowEvent(x, y, justOne, true));
					}
				}
			}
		}
		p_solver.regions.forEach(region => {
			for (var nb = 1; nb <= region.size ; nb++) {
				listQSEvts = p_solver.alertOneLeftInRegion(listQSEvts, region, nb);
			}
		});
		return listQSEvts;
	}
}

