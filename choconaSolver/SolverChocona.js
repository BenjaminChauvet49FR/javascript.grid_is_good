const NOT_FORCED = -1;

// Setup
function SolverChocona(p_wallArray, p_indications) {
	GeneralSolver.call(this);
	this.construct(p_wallArray, p_indications);
}

function DummySolver() {	
	return new SolverChocona(generateWallArray(1, 1), []);
}

SolverChocona.prototype = Object.create(GeneralSolver.prototype);
SolverChocona.prototype.constructor = SolverChocona;

SolverChocona.prototype.construct = function(p_wallArray, p_indications) {
	this.generalConstruct();

	this.methodsSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetPass = {comparisonMethod : comparison, copyMethod : copying, argumentToLabelMethod : namingCategoryPassClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForRegionPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		skipPassMethod : skipPassClosure(this)
	};
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;

	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();
	this.answerArray = generateValueArray(this.xLength, this.yLength, FILLING.UNDECIDED);

	var ix,iy;
	var lastRegionNumber = 0;
	const spacesByRegion = listSpacesByRegion(this.regionArray);
	this.regionsNumber = spacesByRegion.length;
		
	// Initialize data of regions
	var ir;
	this.regions = [];
	for(ir = 0 ; ir < this.regionsNumber ; ir++){
		this.regions.push({
			spaces : spacesByRegion[ir],
			size : spacesByRegion[ir].length,
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
	
	// Give indications in each region
	p_indications.forEach(indic => {
		this.regions[indic.index].forcedValue = indic.value;
	});
	
	var region;
	// Initialize datas dependant to region size (now that all region spaces are known) such as X to place
	// Also initialize regions sizes for shortcut
	for(ir = 0 ; ir < this.regionsNumber ; ir++) {
		region = this.regions[ir];
		if (region.forcedValue != NOT_FORCED) {
			region.notPlacedYet = {YESs : region.forcedValue, NOs : region.size - region.forcedValue}
		}
	}
	
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}
	//Note : grid not purified.
}

//--------------------------------

// Misc methods (may be used for drawing and intelligence)
SolverChocona.prototype.getAnswer = function(p_x,p_y) {
	return this.answerArray[p_y][p_x];
}

SolverChocona.prototype.getForcedValue = function(p_ir) {
	return this.regions[p_ir].forcedValue;
}

SolverChocona.prototype.getFirstSpaceRegion = function(p_ir) {
	return this.regions[p_ir].spaces[0];
}

SolverChocona.prototype.getRegionIndex = function(p_x, p_y) {
	return this.regionArray[p_y][p_x];
}

SolverChocona.prototype.getRegion = function(p_x, p_y) {
	return this.regions[this.getRegionIndex(p_x, p_y)];
}

//--------------------------------

// Input methods
SolverChocona.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	this.tryToApplyHypothesisSafe(new SpaceEvent(p_x, p_y, p_symbol));
}

SolverChocona.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverChocona.prototype.passRegion = function(p_indexRegion) {
	const listPassNow = this.generateEventsForRegionPass(p_indexRegion);
	this.passEventsSafe(listPassNow, p_indexRegion); 
}

SolverChocona.prototype.makeMultiPass = function() {	
	this.multiPassSafe(this.methodsSetMultipass);
}

SolverChocona.prototype.makeQuickStart = function() {
	this.quickStart();
}

//--------------------------------

// Doing and undoing
SolverChocona.prototype.putNew = function(p_x,p_y,p_symbol){
	if (this.answerArray[p_y][p_x] == p_symbol) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[p_y][p_x] != FILLING.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerArray[p_y][p_x] = p_symbol;
	var ir = this.regionArray[p_y][p_x];
	var region = this.regions[ir];
	if (region.notPlacedYet) {
		if (p_symbol == FILLING.YES) {
			region.notPlacedYet.YESs--;
		} else if (p_symbol == FILLING.NO) {
			region.notPlacedYet.NOs--;
		}
	}
	return EVENT_RESULT.SUCCESS;
}


applyEventClosure = function(p_solver) {
	return function(p_eventToApply) {
		return p_solver.putNew(p_eventToApply.x, p_eventToApply.y, p_eventToApply.symbol);
	}
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		if (!p_eventToUndo.failure) {
			const x = p_eventToUndo.x;
			const y = p_eventToUndo.y;
			const symbol = p_eventToUndo.symbol;
			var discardedSymbol = p_solver.answerArray[y][x]; 
			p_solver.answerArray[y][x] = FILLING.UNDECIDED;
			var ir = p_solver.regionArray[y][x];
			var region = p_solver.regions[ir];
			if (region.notPlacedYet) {
				if (discardedSymbol == FILLING.YES) { // if (p_eventToUndo.symbol) is tested, the value of notPlacedYet is increased even if the space wasn't actually affected. Which leads to surprises when undoing. Oops...
					region.notPlacedYet.YESs++;
				} else if (discardedSymbol == FILLING.NO) {
					region.notPlacedYet.NOs++;
				}
			}
		}
	} 
}

function isSpaceEvent(p_event) {
	return p_event.symbol;
}

//--------------------------------
// Quickstart !

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvents = [{quickStartLabel : "Chocona"}];
		for (ir = 0; ir < p_solver.regions.length ; ir ++) {
			p_solver.deductionsRegionIfFullNOs(listQSEvents, ir);
			p_solver.deductionsRegionIfFullYESs(listQSEvents, ir);
		};
		return listQSEvents;
	}
}

//--------------------------------
// Deductions

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		var x = p_eventBeingApplied.x;
		var y = p_eventBeingApplied.y;
		var ir = p_solver.regionArray[y][x];
		var region = p_solver.regions[ir];
		symbol = p_eventBeingApplied.symbol;
		p_solver.existingNeighborsCoorsWithDiagonals(x, y).forEach(coors => {		
			p_solver.deductionsLastUndecided2x2ForRectangle(p_listEventsToApply, coors.x, coors.y, FILLING.UNDECIDED, FILLING.NO, FILLING.YES, answerValueClosure(p_solver.answerArray), methodEventForSpaceFill);
		});
		if (symbol == FILLING.NO) {	
			p_solver.deductionsRegionIfFullNOs(p_listEventsToApply, ir);
		} else {
			p_solver.deductionsRegionIfFullYESs(p_listEventsToApply, ir);
		}
	}
}

// The alert on region "when the remaining spaces of a region must be closed/open to reach the numbers"
SolverChocona.prototype.deductionsRegionIfFullYESs = function(p_listEventsToApply, p_indexRegion) {
	const region = this.regions[p_indexRegion];
	if (region.notPlacedYet) {
		this.deductionsFillingRegion(p_listEventsToApply, region ,FILLING.NO, region.notPlacedYet.YESs, region.notPlacedYet.NOs);
	}
}

SolverChocona.prototype.deductionsRegionIfFullNOs = function(p_listEventsToApply, p_indexRegion) {
	const region = this.regions[p_indexRegion];
	if (region.notPlacedYet) {
		this.deductionsFillingRegion(p_listEventsToApply, region ,FILLING.YES, region.notPlacedYet.NOs, region.notPlacedYet.YESs);
	} 
}

SolverChocona.prototype.deductionsFillingRegion = function(p_listEventsToApply, p_region, p_missingSymbol, p_testZeroNumber, p_missingNumber) {
	if (p_testZeroNumber == 0) {
		var xa,ya,alertSpace;
		var remaining = p_missingNumber
		for(var i = 0;i<p_region.size;i++){
			alertSpace = p_region.spaces[i];
			xa = alertSpace.x;
			ya = alertSpace.y;
			if (this.answerArray[ya][xa] == FILLING.UNDECIDED) {
				p_listEventsToApply.push(new SpaceEvent(xa, ya, p_missingSymbol));
				remaining--;
				if (remaining == 0) {
					break;
				}
			}
		}
	}
}

// For deductions too

answerValueClosure = function(p_array) { 
	return function(p_x, p_y) {
		return p_array[p_y][p_x];
	}
}

methodEventForSpaceFill = function(p_x, p_y, p_value) {
	return new SpaceEvent(p_x, p_y, p_value);
}

//--------------------
// Passing and multipassing

// Generate covering events for "region pass".
SolverChocona.prototype.generateEventsForRegionPass = function(p_indexRegion) {
	var eventList = [];
	this.regions[p_indexRegion].spaces.forEach(space => {
		if (this.answerArray[space.y][space.x] == FILLING.UNDECIDED) { // It would still be correct, albeit useless, to pass already filled spaces
			eventList.push([new SpaceEvent(space.x, space.y, FILLING.YES), new SpaceEvent(space.x, space.y, FILLING.NO)]);
		}			 
	});
	return eventList;
}

generateEventsForRegionPassClosure = function(p_solver) {
	return function(p_indexRegion) {
		return p_solver.generateEventsForRegionPass(p_indexRegion);
	}
}

copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.symbol],
	[p_event2.y, p_event2.x, p_event2.symbol]]);
}

namingCategoryPassClosure = function(p_solver) {
	return function (p_indexRegion) {
		return "Region "+ p_indexRegion + " (" + p_solver.getFirstSpaceRegion(p_indexRegion).x +" "+ p_solver.getFirstSpaceRegion(p_indexRegion).y + ")"; 
	}
}

orderedListPassArgumentsClosure = function(p_solver) { // I don't dare to factorize these methods
	return function() {
		var listIndexesPass = [];
		var values = [];
		for (var i = 0; i < p_solver.regions.length ; i++) {
			listIndexesPass.push(i);
			if (p_solver.regions[i].notPlacedYet.YESs && p_solver.regions[i].notPlacedYet.YESs > 0) {
				values.push(p_solver.uncertainity(i));
			} else {
				values.push(p_solver.regions[i].size); 
			}
		}
		listIndexesPass.sort(function(p_i1, p_i2) {
			const v1 = values[p_i1];
			const v2 = values[p_i2]; 
			const det1 = (p_solver.regions[p_i1].notPlacedYet.YESs);
			const det2 = (p_solver.regions[p_i2].notPlacedYet.YESs);
			if ((det1 && det2) || (!det1 && !det2)) {
				return v1 - v2;
			} else {
				if (det1 && !det2) {
					return -1;
				} else {
					return 1;
				}
			}
			return values[p_i1]-values[p_i2];
		});
		return listIndexesPass;
	}
}

SolverChocona.prototype.uncertainity = function(p_ir) {
	// "yes among total" is a definitive choice here ! By the way, only numbered regions are concerned.
	const nos = this.regions[p_ir].notPlacedYet.NOs;
	const yess = this.regions[p_ir].notPlacedYet.YESs;
	var resultUncertain = 1;
	for (var i = nos+1 ; i <= (nos + yess); i++) {
		resultUncertain *= i;
	} 			
	for (var i = 2; i <= yess; i++) {
		resultUncertain /= i;
	}
	return resultUncertain;
}

skipPassClosure = function(p_solver) {
	return function (p_indexRegion) {
		if (p_solver.regions[p_indexRegion].notPlacedYet)
			return true;
		else
			return false;
	}
}