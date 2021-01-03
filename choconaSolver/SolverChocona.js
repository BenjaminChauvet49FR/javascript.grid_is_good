
const EVENTLIST_KIND = {HYPOTHESIS:"H",PASS:"P"};

function SolverChocona(p_wallArray,p_numberGrid){
	this.construct(p_wallArray,p_numberGrid);
}

SolverChocona.prototype.construct = function(p_wallArray, p_numberGrid) {
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.clusterInvolvedSolver = new ClusterInvolvedSolver(this.xLength, this.yLength);

	this.wallGrid = WallGrid_data(p_wallArray); 
	this.regionGrid = this.wallGrid.toRegionGrid();
	this.answerGrid = [];

	this.happenedEvents = [];
	var ix,iy;
	var lastRegionNumber = 0;
	
	// Initialize the required grids (notably answerGrid) and the number of regions
	for(iy = 0;iy < this.yLength;iy++){
		this.answerGrid.push([]);
		for(ix = 0;ix < this.xLength;ix++){
			lastRegionNumber = Math.max(this.regionGrid[iy][ix],lastRegionNumber);
			this.answerGrid[iy].push(CHOCONA.UNDECIDED);
		}
	}
	this.regionsNumber = lastRegionNumber+1;
	
	// Initialize data of regions
	var ir;
	this.regions = [];
	for(ir=0;ir<this.regionsNumber;ir++){
		this.regions.push({
			spaces : [],
			size : 0,
			forcedValue : NOT_FORCED,
			notPlacedYet : {}
		});
	}
	
	// Regions to be checked by the "3 or 4 open"
	this.checker3or4Open = {
		list : [],
		arrayPresence : []
	}
	for (ir = 0 ; ir < this.regionsNumber ; ir++) {
		this.checker3or4Open.arrayPresence.push(false);
	}
	
	// Now that region data are created : 
	// Initialize spaces by region
	var region;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			ir = this.regionGrid[iy][ix];
			region = this.regions[ir];
			region.spaces.push({x:ix,y:iy});
			if (p_numberGrid[iy][ix] && (p_numberGrid[iy][ix] != NOT_FORCED)) {
				region.forcedValue = p_numberGrid[iy][ix];
			}
		}
	}
	
	// Initialize datas dependant to region size (now that all region spaces are known) such as X to place
	// Also initialize regions sizes for shortcut
	for(ir = 0;ir<this.regionsNumber;ir++) {
		region = this.regions[ir];
		region.size = region.spaces.length;
		if (region.forcedValue != NOT_FORCED) {
			region.notPlacedYet = {YESs : region.forcedValue, NOs : region.size - region.forcedValue}
		}
	}
	
	//Note : grid not purified.
}

//--------------------------------

// Drawing methods
SolverChocona.prototype.getAnswer = function(p_x,p_y) {
	return this.answerGrid[p_y][p_x];
}

SolverChocona.prototype.getForcedValue = function(p_ir) {
	return this.regions[p_ir].forcedValue;
}

SolverChocona.prototype.getFirstSpace = function(p_ir) {
	return this.regions[p_ir].spaces[0];
}

//--------------------------------
SolverChocona.prototype.emitHypothesis = function(p_x,p_y,p_symbol){
	this.tryToPutNew(p_x,p_y,p_symbol);
}

//--------------------------------

SolverChocona.prototype.getRegionIndex = function(p_x, p_y) {
	return this.regionGrid[p_y][p_x];
}

SolverChocona.prototype.getRegion = function(p_x, p_y) {
	return this.regions[this.getRegionIndex(p_x, p_y)];
}

SolverChocona.prototype.putNew = function(p_x,p_y,p_symbol){
	if ((p_x < 0) || (p_y < 0) || (p_x >= this.xLength) || (p_y >= this.yLength) || (this.answerGrid[p_y][p_x] == p_symbol)){
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerGrid[p_y][p_x] != CHOCONA.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerGrid[p_y][p_x] = p_symbol;
	var ir = this.regionGrid[p_y][p_x];
	var region = this.regions[ir];
	if (region.notPlacedYet) {
		if (p_symbol == CHOCONA.YES) {
			region.notPlacedYet.YESs--;
		} else if (p_symbol == CHOCONA.NO) {
			region.notPlacedYet.NOs--;
		}
	}
	return EVENT_RESULT.SUCCESS;
}

SolverChocona.prototype.tryToPutNew = function (p_x, p_y, p_symbol) {
	// If we directly passed methods and not closures, we would be stuck because "this" would refer to the Window object which of course doesn't define the properties we want, e.g. the properties of the solvers.
	// All the methods pass the solver as a parameter because they can't be prototyped by it (problem of "undefined" things). 
	methodPack = new ApplyEventMethodNonAdjacentPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.clusterInvolvedSolver.tryToApply( SpaceEvent(p_x, p_y, p_symbol), methodPack);
}

applyEventClosure = function(p_solver) {
	return function(eventToApply) {
		if (eventToApply.failure) {
			return EVENT_RESULT.FAILURE;
		}
		return p_solver.putNew(eventToApply.x(), eventToApply.y(), eventToApply.symbol);
	}
}

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		var x = p_eventBeingApplied.x();
		var y = p_eventBeingApplied.y();
		var ir = p_solver.regionGrid[y][x];
		var region = p_solver.regions[ir];
		symbol = p_eventBeingApplied.symbol;
		p_solver.closeSquares(p_listEventsToApply, x, y);
		if (symbol == CHOCONA.NO) {	
			p_solver.alertRegionIfFullNOs(p_listEventsToApply, ir);
		} else {
			p_solver.alertRegionIfFullYESs(p_listEventsToApply, ir);
		}
		return p_listEventsToApply;
	}
}

// The alert on region "when the remaining spaces of a region must be closed/open to reach the numbers"
SolverChocona.prototype.alertRegionIfFullYESs = function(p_listEvents, p_indexRegion) {
	const region = this.regions[p_indexRegion];
	if (region.notPlacedYet) {
		return this.alertRegion(p_listEvents, region ,CHOCONA.NO, region.notPlacedYet.YESs, region.notPlacedYet.NOs);
	} else {
		return p_listEvents;
	}
}

SolverChocona.prototype.alertRegionIfFullNOs = function(p_listEvents, p_indexRegion) {
	const region = this.regions[p_indexRegion];
	if (region.notPlacedYet) {
		return this.alertRegion(p_listEvents, region ,CHOCONA.YES, region.notPlacedYet.NOs, region.notPlacedYet.YESs);
	} else {
		return p_listEvents;
	}
}

SolverChocona.prototype.alertRegion = function(p_listEvents, p_region, p_missingSymbol, p_testZeroNumber, p_missingNumber) {
	if (p_testZeroNumber == 0) {
		var xa,ya,alertSpace;
		var remaining = p_missingNumber
		for(var i = 0;i<p_region.size;i++){
			alertSpace = p_region.spaces[i];
			xa = alertSpace.x;
			ya = alertSpace.y;
			if (this.answerGrid[ya][xa] == CHOCONA.UNDECIDED) {
				p_listEvents.push(SpaceEvent(xa, ya, p_missingSymbol));
				/*remaining--;
				if (remaining == 0){
					break;
				}*/
			}
		}
	}
	return p_listEvents;
}

// for a space, test all 8 spaces around it if a 2x2 square is entirely defined
SolverChocona.prototype.closeSquares = function(p_listEvents, p_x, p_y) {
	const deltaXCircle = [-1,0,1,1,1,0,-1,-1];
	const deltaYCircle = [-1,-1,-1,0,1,1,1,0];
	for(var i = 0; i <= 7 ; i++) {
		this.testLastUndecided2x2(p_listEvents, p_x + deltaXCircle[i], p_y + deltaYCircle[i]);
	}
	return p_listEvents; 
}

SolverChocona.prototype.testLastUndecided2x2 = function(p_listEvents, p_x, p_y) {
	if (this.spaceExists(p_x, p_y) && this.getAnswer(p_x, p_y) == CHOCONA.UNDECIDED) {
		const notExtremeLeft = (this.leftExists(p_x));
		const notExtremeRight = (this.rightExists(p_x));
		const notExtremeUp = (this.upExists(p_y));
		const notExtremeDown = (this.downExists(p_y));
		conclusions = [CHOCONA.UNDECIDED, CHOCONA.UNDECIDED, CHOCONA.UNDECIDED, CHOCONA.UNDECIDED];
		if (notExtremeLeft) {
			if (notExtremeUp) {
				conclusions[0] = this.conclusionLastUndecided2x2(p_x-1, p_y-1, p_x, p_y);
			}
			if (notExtremeDown) {
				conclusions[1] = this.conclusionLastUndecided2x2(p_x-1, p_y+1, p_x, p_y);
			}
		}
		if (notExtremeRight) {
			if (notExtremeUp) {
				conclusions[2] = this.conclusionLastUndecided2x2(p_x+1, p_y-1, p_x, p_y);
			}
			if (notExtremeDown) {
				conclusions[3] = this.conclusionLastUndecided2x2(p_x+1, p_y+1, p_x, p_y);
			}
		}
		var result = conclusions[0];
		var ok = true;
		var i = 1;
		// All 4 conclusions can be UNDECIDED, YES or NO. There mustn't be both YES and NO among the 4, and if successful either YES or NO is chosen in priority over UNDECIDED.
		while (ok && i < 4) {
			ok = (result == CHOCONA.UNDECIDED) || (conclusions[i] == CHOCONA.UNDECIDED) || (conclusions[i] == result);
			if (conclusions[i] != CHOCONA.UNDECIDED) {
				result = conclusions[i];				
			}
			i++;
		}
		if (ok) {
			if (result != CHOCONA.UNDECIDED) {
				p_listEvents.push(SpaceEvent(p_x, p_y, result)); 
			}
		} else {
			p_listEvents.push({failure : true});
		}
	}
	return p_listEvents;
}

// Tests how should be filled the last square (x2, y2) in a 2x2 square from the remaining 3 ones (x1y1, x1y2, x2y1) (all 4 squares exist in the grid - the x2, y2 is in an unknown state)
SolverChocona.prototype.conclusionLastUndecided2x2 = function(p_x1, p_y1, p_x2, p_y2) {
	var count = 0;
	var atLeastOneUndecided = false; 
	var space1 = this.answerGrid[p_y1][p_x1];
	var space2 = this.answerGrid[p_y1][p_x2];
	var space3 = this.answerGrid[p_y2][p_x1];
	[space1, space2, space3].forEach(state => {// Possible optimization that involves removing "atLeastOneUndecided"
		if (state == CHOCONA.UNDECIDED) {
			//return CHOCONA.UNDECIDED; // A "=> expression" is NOT a good place to write a return that should be the return of the function.
			atLeastOneUndecided = true;
		}
		if (state == CHOCONA.YES) {
			count++;
		}
	});
	if (!atLeastOneUndecided) {
		if (count == 3) {
			return CHOCONA.YES;
		} else if (count == 2) {
			return CHOCONA.NO;
		}
	}
	return CHOCONA.UNDECIDED;
}


// Methods for safety check
SolverChocona.prototype.leftExists = function(p_x) {
	return p_x > 0;
}
SolverChocona.prototype.upExists = function(p_y) {
	return p_y > 0;
}
SolverChocona.prototype.rightExists = function(p_x) {
	return p_x <= this.xLength-2;
}
SolverChocona.prototype.downExists = function(p_y) {
	return p_y <= this.yLength-2;
}
SolverChocona.prototype.spaceExists = function(p_x, p_y) {
	return (p_x >= 0 && p_y >= 0 && p_x < this.xLength && p_y < this.yLength);
}

// --------------------
// Quick start 

/**
Used by outside !
*/
SolverChocona.prototype.quickStart = function(){
	var quickStartList = [];
	for (ir = 0; ir < this.regions.length ; ir ++) {
		quickStartList = this.alertRegionIfFullNOs(quickStartList, ir);
		quickStartList = this.alertRegionIfFullYESs(quickStartList, ir);
	};
	quickStartList.forEach(eventToApply => {
		this.tryToPutNew(eventToApply.x(), eventToApply.y(), eventToApply.symbol);
	});
}

//--------------------
// Undoing

function isSpaceEvent(p_event) {
	return p_event.symbol;
}

undoEventClosure = function(p_solver) {
	return function(eventToUndo) {
		if (!eventToUndo.failure) {
			const x = eventToUndo.x();
			const y = eventToUndo.y();
			const symbol = eventToUndo.symbol;
			var discardedSymbol = p_solver.answerGrid[y][x]; 
			p_solver.answerGrid[y][x] = CHOCONA.UNDECIDED;
			var ir = p_solver.regionGrid[y][x];
			var region = p_solver.regions[ir];
			if (region.notPlacedYet) {
				if (discardedSymbol == CHOCONA.YES) { // if (eventToUndo.symbol) is tested, the value of notPlacedYet is increased even if the space wasn't actually affected. Which leads to surprises when undoing. Oops...
					region.notPlacedYet.YESs++;
				} else if (discardedSymbol == CHOCONA.NO) {
					region.notPlacedYet.NOs++;
				}
			}
		}
	} 
}

// Generate covering events for "region pass".
SolverChocona.prototype.generateEventsForRegionPass = function(p_indexRegion) {
	var eventList = [];
	this.regions[p_indexRegion].spaces.forEach(space => {
		if (this.answerGrid[space.y][space.x] == CHOCONA.UNDECIDED) { // It would still be correct, albeit useless, to pass already filled spaces
			eventList.push([SpaceEvent(space.x, space.y, CHOCONA.YES), SpaceEvent(space.x, space.y, CHOCONA.NO)]);
		}			 
	});
	return eventList;
}


copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	if (p_event2.coorY > p_event1.coorY) {
		return -1;
	} else if (p_event2.coorY < p_event1.coorY) {
		return 1;
	} else if (p_event2.coorX > p_event1.coorX) {
		return -1;
	} else if (p_event2.coorX < p_event1.coorX) {
		return 1;
	} else {
		var c1 = (p_event1.symbol == CHOCONA.YES ? 1 : 0);
		var c2 = (p_event2.symbol == CHOCONA.YES ? 1 : 0); // Unstable : works because only "O" and "C" values are admitted
		return c1-c2;
	}
}

/**
Used by outside !
*/
SolverChocona.prototype.undoToLastHypothesis = function(){
	this.clusterInvolvedSolver.undoToLastHypothesis(undoEventClosure(this));
}

SolverChocona.prototype.passRegion = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	methodSet = new ApplyEventMethodNonAdjacentPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	methodTools = {comparisonMethod : comparison, copyMethod : copying};
	this.clusterInvolvedSolver.passEvents(generatedEvents, methodSet, methodTools); 
}