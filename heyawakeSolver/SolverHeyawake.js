// Initialization

const NOT_FORCED = -1; 
const NOT_RELEVANT = -1;
// const SPACE is used in the main solver

const EVENTLIST_KIND = {HYPOTHESIS:"H",PASS:"P"};

function SolverHeyawake(p_wallArray,p_numberGrid){
	this.construct(p_wallArray,p_numberGrid);
}

SolverHeyawake.prototype.construct = function(p_wallArray,p_numberGrid){
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.generalSolver = new GeneralSolver();
	this.generalSolver.makeItGeographical(this.xLength, this.yLength);
	this.methodSet = new ApplyEventMethodPack(
			applyEventClosure(this), 
			deductionsClosure(this), 
			adjacencyClosure(this), 
			transformClosure(this), 
			undoEventClosure(this));
	this.methodTools = {comparisonMethod : comparison, copyMethod : copying};

	this.wallGrid = WallGrid_data(p_wallArray); 
	this.regionGrid = this.wallGrid.toRegionGrid();
	this.answerGrid = [];
	this.stripGrid = [];
	this.horizontalStripes = [];
	this.verticalStripes = [];
	this.happenedEvents = [];
	var ix,iy;
	var lastRegionNumber = 0;

	// Initialize the required grids (notably answerGrid) and the number of regions
	for(iy = 0;iy < this.yLength;iy++){
		this.answerGrid.push([]);
		this.stripGrid.push([]);
		for(ix = 0;ix < this.xLength;ix++){
			lastRegionNumber = Math.max(this.regionGrid[iy][ix],lastRegionNumber);
			this.answerGrid[iy].push(SPACE.UNDECIDED);
			this.stripGrid[iy].push({leftMost:NOT_RELEVANT,horizIn:NOT_RELEVANT,rightMost:NOT_RELEVANT,topMost:NOT_RELEVANT,vertIn:NOT_RELEVANT,bottomMost:NOT_RELEVANT});
		}
	}
	this.regionsNumber = lastRegionNumber+1;
	
	// Blantly initialize data of regions
	var ir;
	this.regions = [];
	for(ir=0;ir<this.regionsNumber;ir++){
		this.regions.push({
			spaces : [],
			expectedNumberOfOsInRegion : NOT_FORCED,
			notPlacedYet : null,
			size : 0,
			horizontalInnerStripesIndexes : [],
			verticalInnerStripesIndexes : [] 
		});
	}
	
	// Now that region data are created : 
	// Initialize spaces by region + for those with a value, numbers of Os to place in notPlaced yet
	var number, region;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			ir = this.regionGrid[iy][ix];
			number = p_numberGrid[iy][ix];
			region = this.regions[ir];
			region.spaces.push({x:ix,y:iy});
			if (number != null){
				region.expectedNumberOfOsInRegion = number;
				region.notPlacedYet = {CLOSEDs : number};
			}
		}
	}
	
	// Initialize numbers of Xs to place (now that all region spaces are known)
	// Also initialize regions sizes for shortcut
	for(ir = 0;ir<this.regionsNumber;ir++){
		region = this.regions[ir];
		region.size = region.spaces.length;
		if (region.notPlacedYet != null){
			region.notPlacedYet.OPENs = region.size-region.notPlacedYet.CLOSEDs;
		}
	}
	
	//And now, the stripes for Heyawake ! (ie the smallest series of contiguous aligned spaces that cross 2 borders)
	var endStrip;
	var indexStrip;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			//If it has a right boundary, draw an horizontal band to the right boundary if it exists.
			if (this.wallGrid.getWallR(ix,iy) == WALLGRID.CLOSED){
				endStrip = ix+1;
				while (endStrip < this.xLength-1 && this.wallGrid.getState(endStrip+1,iy) != WALLGRID.CLOSED && this.wallGrid.getWallR(endStrip,iy) != WALLGRID.CLOSED){
					endStrip++;
				}
				endStrip++; 
				//Right now, endStrip corresponds to "the right of a boundary" or "a banned/out-of-bounds space"
				if (endStrip < this.xLength && this.wallGrid.getState(endStrip,iy) != WALLGRID.CLOSED){
					//We met a true region boundary ? Fine, to work now !
					irInner = this.regionGrid[iy][ix+1]; //Region of the inner grid
					indexStrip = this.horizontalStripes.length;
					this.regions[irInner].horizontalInnerStripesIndexes.push(indexStrip);
					this.stripGrid[iy][ix].leftMost = indexStrip;
					this.stripGrid[iy][endStrip].rightMost = indexStrip;
					for(var ix2 = ix+1; ix2 < endStrip ; ix2++){
						this.stripGrid[iy][ix2].horizIn = indexStrip;
					}
					this.horizontalStripes.push({row:iy,xStart:ix,xEnd:endStrip, UNDEFs: endStrip-ix+1, CLOSEDs:0});
				}
			}
			//Same down.
			if (this.wallGrid.getWallD(ix,iy) == WALLGRID.CLOSED){
				endStrip = iy+1;
				while (endStrip < this.yLength-1 && this.wallGrid.getState(ix,endStrip+1) != WALLGRID.CLOSED && this.wallGrid.getWallD(ix,endStrip) != WALLGRID.CLOSED){
					endStrip++;
				}
				endStrip++; 
				// ... "the bottom of a boundary" ... "a banned/out-of-bounds space"
				if (endStrip < this.yLength && this.wallGrid.getState(ix,endStrip) != WALLGRID.CLOSED){
					irInner = this.regionGrid[iy+1][ix]; 
					indexStrip = this.verticalStripes.length;
					this.regions[irInner].verticalInnerStripesIndexes.push(indexStrip);
					this.stripGrid[iy][ix].topMost = indexStrip;
					this.stripGrid[endStrip][ix].bottomMost = indexStrip;
					for(var iy2 = iy+1; iy2 < endStrip ; iy2++){
						this.stripGrid[iy2][ix].vertIn = indexStrip;
					}
					this.verticalStripes.push({column:ix,yStart:iy,yEnd:endStrip, UNDEFs: endStrip-iy+1, CLOSEDs:0});
				}
			}
		}
	}
	
	//Note : grid not purified.
}

//--------------------------------

// Misc. methods
SolverHeyawake.prototype.expectedNumberInRegion = function(ir){
	return this.regions[ir].expectedNumberOfOsInRegion;
}

SolverHeyawake.prototype.getSpaceCoordinates = function(p_indexRegion,p_indexSpace){
	return this.regions[p_indexRegion].spaces[p_indexSpace];
}

SolverHeyawake.prototype.getAnswer = function(p_x,p_y){
	return this.answerGrid[p_y][p_x];
}

SolverHeyawake.prototype.getRegionIndex = function(p_x,p_y){
	return this.regionGrid[p_y][p_x];
}

//--------------------------------

// Misc. inner methods 

SolverHeyawake.prototype.lowerHorizontalStrip = function(p_index,p_symbol){
	this.modifyHorizontalStrip(p_index,p_symbol,-1);
}

SolverHeyawake.prototype.lowerVerticalStrip = function(p_index,p_symbol){
	this.modifyVerticalStrip(p_index,p_symbol,-1);
}

SolverHeyawake.prototype.raiseHorizontalStrip = function(p_index,p_symbol){
	this.modifyHorizontalStrip(p_index,p_symbol,1);
}

SolverHeyawake.prototype.raiseVerticalStrip = function(p_index,p_symbol){
	this.modifyVerticalStrip(p_index,p_symbol,1);
}

SolverHeyawake.prototype.modifyHorizontalStrip = function(p_index,p_symbol,p_modify){
	if (p_index != NOT_RELEVANT){
		this.horizontalStripes[p_index].UNDEFs += p_modify;
		if (p_symbol == SPACE.CLOSED){
			this.horizontalStripes[p_index].CLOSEDs += p_modify;
		}
	}
}

SolverHeyawake.prototype.modifyVerticalStrip = function(p_index,p_symbol,p_modify){
	if (p_index != NOT_RELEVANT){
		this.verticalStripes[p_index].UNDEFs  += p_modify;
		if (p_symbol == SPACE.CLOSED){
			this.verticalStripes[p_index].CLOSEDs += p_modify;
		}
	}
}

//--------------------------------

// Input methods
SolverHeyawake.prototype.emitHypothesis = function(p_x,p_y,p_symbol){
	this.tryToPutNew(p_x,p_y,p_symbol);
}

SolverHeyawake.prototype.undoToLastHypothesis = function(){
	this.generalSolver.undoToLastHypothesis(undoEventClosure(this));
}

SolverHeyawake.prototype.quickStart = function(){
	this.regions.forEach(region => {
		if (region.size == 1 && region.notPlacedYet != null && region.notPlacedYet.CLOSEDs == 1){
			this.tryToPutNew(region.spaces[0].x,region.spaces[0].y,SPACE.CLOSED);
		};
		if (region.notPlacedYet != null && region.notPlacedYet.CLOSEDs == 0){
			region.spaces.forEach(space => {
				this.tryToPutNew(space.x,space.y,SPACE.OPEN);
			});
		}
	});
}

SolverHeyawake.prototype.passRegion = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.generalSolver.passEvents(generatedEvents, this.methodSet, this.methodTools, p_indexRegion, "Region "+p_indexRegion); 
}

SolverHeyawake.prototype.multiPass = function() {
	this.generalSolver.multiPass(
		generateEventsForRegionPassClosure(this),
		orderedListPassArgumentsMethodClosure(this), 
		this.methodSet, this.methodTools);
}

//--------------------------------

// Central method

SolverHeyawake.prototype.tryToPutNew = function (p_x, p_y, p_symbol) {
	// If we directly passed methods and not closures, we would be stuck because "this" would refer to the Window object which of course doesn't define the properties we want, e.g. the properties of the solvers.
	// All the methods pass the solver as a parameter because they can't be prototyped by it (problem of "undefined" things). 
	this.generalSolver.tryToApplyHypothesis(
		SpaceEvent(p_x, p_y, p_symbol),
		this.methodSet
	);
}

//--------------------------------

// Doing, undoing and transforming
SolverHeyawake.prototype.putNew = function(p_x,p_y,p_symbol){
	if ((p_x < 0) || (p_y < 0) || (p_x >= this.xLength) || (p_y >= this.yLength) || (this.answerGrid[p_y][p_x] == p_symbol)){
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerGrid[p_y][p_x] != SPACE.UNDECIDED){
		return EVENT_RESULT.FAILURE;
	}
	this.answerGrid[p_y][p_x] = p_symbol;
	var ir = this.regionGrid[p_y][p_x];
	var region = this.regions[ir];
	if (region.notPlacedYet != null){
		if (p_symbol == SPACE.OPEN){
			region.notPlacedYet.OPENs--;
		} else if (p_symbol == SPACE.CLOSED){
			region.notPlacedYet.CLOSEDs--;
		}
	}
	const stripSpace = this.stripGrid[p_y][p_x];
	this.lowerHorizontalStrip(stripSpace.leftMost,p_symbol);
	this.lowerHorizontalStrip(stripSpace.horizIn,p_symbol);
	this.lowerHorizontalStrip(stripSpace.rightMost,p_symbol);	
	this.lowerVerticalStrip(stripSpace.topMost,p_symbol);
	this.lowerVerticalStrip(stripSpace.vertIn,p_symbol);
	this.lowerVerticalStrip(stripSpace.bottomMost,p_symbol);
	return EVENT_RESULT.SUCCESS;
}


applyEventClosure = function(p_solver) {
	return function(eventToApply) {
		return p_solver.putNew(eventToApply.x(), eventToApply.y(), eventToApply.symbol);
	}
}

undoEventClosure = function(p_solver) {
	return function(eventToApply) {
		const x = eventToApply.x(); //Décidément il y en a eu à faire, des changements de x en x() depuis qu'on a mis en commun les solvers de puzzles d'adjacences
		const y = eventToApply.y();
		const symbol = eventToApply.symbol;
		p_solver.answerGrid[y][x] = SPACE.UNDECIDED;
		var ir = p_solver.regionGrid[y][x];
		var region = p_solver.regions[ir];
		if (region.notPlacedYet != null){
			if (symbol == SPACE.OPEN){
				region.notPlacedYet.OPENs++;
			} else if (symbol == SPACE.CLOSED){
				region.notPlacedYet.CLOSEDs++;
			}
		}
		const stripSpace = p_solver.stripGrid[y][x];
		p_solver.raiseHorizontalStrip(stripSpace.leftMost,symbol);
		p_solver.raiseHorizontalStrip(stripSpace.horizIn,symbol);
		p_solver.raiseHorizontalStrip(stripSpace.rightMost,symbol);	
		p_solver.raiseVerticalStrip(stripSpace.topMost,symbol);
		p_solver.raiseVerticalStrip(stripSpace.vertIn,symbol);
		p_solver.raiseVerticalStrip(stripSpace.bottomMost,symbol);
	}
}

//--------------------------------

// Exchanges solver and geographical

/**
Transforms a geographical deduction (see dedicated class GeographicalDeduction) into an appropriate event (SolveEvent in our case)
*/
transformClosure = function (p_solver) {
    return function (p_geographicalDeduction) {
		return SpaceEvent(p_geographicalDeduction.x, p_geographicalDeduction.y, p_geographicalDeduction.opening);
    }
};

adjacencyClosure = function (p_solver) {
    return function (p_x, p_y) {
        switch (p_solver.answerGrid[p_y][p_x]) {
        case SPACE.OPEN:
            return ADJACENCY.YES;
            break;
        case SPACE.CLOSED:
            return ADJACENCY.NO;
            break;
        default:
            return ADJACENCY.UNDEFINED;
            break;
        }
    }
}

//--------------------------------
// Intelligence
deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		var x = p_eventBeingApplied.x();
		var y = p_eventBeingApplied.y();
		var ir = p_solver.regionGrid[y][x];
		var region = p_solver.regions[ir];
		symbol = p_eventBeingApplied.symbol;
		if (symbol == SPACE.CLOSED) {
			p_listEventsToApply.push(SpaceEvent(x,y-1,SPACE.OPEN));
			p_listEventsToApply.push(SpaceEvent(x,y+1,SPACE.OPEN));
			p_listEventsToApply.push(SpaceEvent(x-1,y,SPACE.OPEN));
			p_listEventsToApply.push(SpaceEvent(x+1,y,SPACE.OPEN));	
			//Alert on region
			if (region.notPlacedYet != null && region.notPlacedYet.CLOSEDs == 0){
				p_listEventsToApply = p_solver.alertRegion(p_listEventsToApply,ir,SPACE.OPEN,region.notPlacedYet.OPENs);			
			}			
		} else {
			stripSpace = p_solver.stripGrid[y][x];
			p_listEventsToApply = p_solver.testAlertHorizontalStrip(p_listEventsToApply,stripSpace.leftMost);
			p_listEventsToApply = p_solver.testAlertHorizontalStrip(p_listEventsToApply,stripSpace.horizIn);
			p_listEventsToApply = p_solver.testAlertHorizontalStrip(p_listEventsToApply,stripSpace.rightMost);
			p_listEventsToApply = p_solver.testAlertVerticalStrip(p_listEventsToApply,stripSpace.topMost);
			p_listEventsToApply = p_solver.testAlertVerticalStrip(p_listEventsToApply,stripSpace.vertIn);
			p_listEventsToApply = p_solver.testAlertVerticalStrip(p_listEventsToApply,stripSpace.bottomMost);
			//Alert on region
			if (region.notPlacedYet != null && region.notPlacedYet.OPENs == 0){
				p_listEventsToApply = p_solver.alertRegion(p_listEventsToApply,ir,SPACE.CLOSED,region.notPlacedYet.CLOSEDs);			
			}
		}
		return p_listEventsToApply;
	}
}

// Classic logical verifications 
SolverHeyawake.prototype.testAlertHorizontalStrip = function(p_eventsList,p_index){
	if (p_index != NOT_RELEVANT && this.horizontalStripes[p_index].CLOSEDs == 0 && this.horizontalStripes[p_index].UNDEFs == 1){
		const y = this.horizontalStripes[p_index].row;
		var ix = this.horizontalStripes[p_index].xStart;
		while(this.answerGrid[y][ix] == SPACE.OPEN){
			ix++;
		}
		p_eventsList.push(SpaceEvent(ix,y,SPACE.CLOSED));
	}
	return p_eventsList;
}

SolverHeyawake.prototype.testAlertVerticalStrip = function(p_eventsList,p_index){
	if (p_index != NOT_RELEVANT && this.verticalStripes[p_index].CLOSEDs == 0 && this.verticalStripes[p_index].UNDEFs == 1){
		const x = this.verticalStripes[p_index].column;
		var iy = this.verticalStripes[p_index].yStart;
		while(this.answerGrid[iy][x] == SPACE.OPEN){
			iy++;
		}
		p_eventsList.push(SpaceEvent(x,iy,SPACE.CLOSED));
	}
	return p_eventsList;
}

SolverHeyawake.prototype.alertRegion = function(p_listEvents,p_regionIndex,p_missingSymbol,p_missingNumber){
	const region = this.regions[p_regionIndex];
	var xa,ya,alertSpace;
	var remaining = p_missingNumber
	for(var i = 0;i<region.size;i++){
		alertSpace = region.spaces[i];
		xa = alertSpace.x;
		ya = alertSpace.y;
		if (this.answerGrid[ya][xa] == SPACE.UNDECIDED){
			p_listEvents.push(SpaceEvent(xa,ya,p_missingSymbol));
			remaining--;
			if (remaining == 0){
				break;
			}
		}
	}
	return p_listEvents;
}

// --------------------
// Passing

generateEventsForRegionPassClosure = function(p_solver) {
	return function(p_indexRegion) {
		return p_solver.generateEventsForRegionPass(p_indexRegion);
	}
}

// Generate covering events for "region pass".
SolverHeyawake.prototype.generateEventsForRegionPass = function(p_indexRegion) {
	var eventList = [];
	this.regions[p_indexRegion].spaces.forEach(space => {
		if (this.answerGrid[space.y][space.x] == SPACE.UNDECIDED) { // It would still be correct, albeit useless, to pass already filled spaces
			eventList.push([SpaceEvent(space.x, space.y, SPACE.OPEN), SpaceEvent(space.x, space.y, SPACE.CLOSED)]);
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
		var c1 = (p_event1.symbol == SPACE.OPEN ? 1 : 0);
		var c2 = (p_event2.symbol == SPACE.OPEN ? 1 : 0); // Unstable : works because only "O" and "C" values are admitted
		return c1-c2;
	}
}

orderedListPassArgumentsMethodClosure = function(p_solver) {
	return function() {
		var indexList = [];
		for (var i = 0; i < p_solver.regions.length ; i++) {
			indexList.push(i); //TODO faire une meilleure liste
		}
		/*indexList.sort(function(p_i1, p_i2) {
			closed1 = p_solver.regions[p_i1].notPlacedYetClosed;
			closed2 = p_solver.regions[p_i2].notPlacedYetClosed;
			open1 = 4-p_solver.regions[p_i1].openSpaces.length;
			open2 = 4-p_solver.regions[p_i2].openSpaces.length;
			return (closed1-open1*3) - (closed2-open2*3);
		});*/ //TODO
		return indexList;
	}
}