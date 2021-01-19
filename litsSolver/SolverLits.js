// AVERTISSEMENT : ce solveur utilise le "dad solver" et n'a pas d'équivalent autonome 
// Setup

const NOT_FORCED = -1; 
const NOT_RELEVANT = -1;
// const SPACE is used in the dad solver

const EVENTLIST_KIND = {HYPOTHESIS:"H",PASS:"P"};

function SolverLITS(p_wallArray,p_numberGrid){
	this.construct(p_wallArray,p_numberGrid);
}

SolverLITS.prototype.construct = function(p_wallArray,p_numberGrid){
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.generalSolver = new GeneralSolver();
	this.generalSolver.makeItGeographical(this.xLength, this.yLength);
	this.methodSet = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		adjacencyClosure(this),
		transformClosure(this),
		undoEventClosure(this)
	);
	this.methodSet.addAbortAndFilters(abortClosure(this), [filterClosure(this)]);
	this.methodTools = {comparisonMethod : comparison, copyMethod : copying};

	this.wallGrid = WallGrid_data(p_wallArray); 
	this.regionGrid = this.wallGrid.toRegionGrid();
	this.answerGrid = [];
	this.proximitiesGrid = [];
	this.shapeGrid = [];
	this.happenedEvents = [];
	var ix,iy;
	var lastRegionNumber = 0;
	// Below fields are for adjacency "all spaces with ... must form a orthogonally contiguous area"
	this.atLeastOneOpen = false;
	this.adjacencyLimitGrid = createAdjacencyLimitGrid(this.xLength, this.yLength);
    this.adjacencyLimitSpacesList = [];
	
	// Initialize the required grids (notably answerGrid) and the number of regions
	for(iy = 0;iy < this.yLength;iy++){
		this.answerGrid.push([]);
		this.proximitiesGrid.push([]);
		this.shapeGrid.push([]);
		for(ix = 0;ix < this.xLength;ix++){
			lastRegionNumber = Math.max(this.regionGrid[iy][ix],lastRegionNumber);
			this.answerGrid[iy].push(SPACE.UNDECIDED);
			this.proximitiesGrid[iy].push(-1);
			this.shapeGrid[iy].push(LITS.UNDECIDED);
		}
	}
	this.regionsNumber = lastRegionNumber+1;
	
	// Initialize data of regions
	var ir;
	this.regions = [];
	for(ir=0;ir<this.regionsNumber;ir++){
		this.regions.push({
			spaces : [],
			openSpaces : [], // List of open spaces. //TODO : Typescript "space" ? 
			size : 0
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
	// Initialize spaces by region + (TODO) affect possible shapes
	var region;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			ir = this.regionGrid[iy][ix];
			region = this.regions[ir];
			region.spaces.push({x:ix,y:iy});
		}
	}
	
	// Initialize datas dependant to region size (now that all region spaces are known) such as X to place
	// Also initialize regions sizes for shortcut
	for(ir = 0;ir<this.regionsNumber;ir++){
		region = this.regions[ir];
		region.size = region.spaces.length;
		region.notPlacedYetClosed = region.size - 4;
		/*region.notPlacedYet = {}
		region.notPlacedYet.OPENs : 4,
		region.notPlacedYet.CLOSEDs : region.size - 4;
		}*/
		// No "notPlacedYet" items this time but a single variable instead because : 1) the OPENs is unneccessary, since it is always equal to 4-openSpaces.length (openSpaces added quite lately), 2) in LITS each region must have a check on remaining closed or open spaces, it is not optional for a region like in Heyawake.
	}
	
	//Note : grid not purified.
}

//--------------------------------

// Misc methods (may be used for drawing and intelligence)
SolverLITS.prototype.getAnswer = function(p_x,p_y){
	return this.answerGrid[p_y][p_x];
}

SolverLITS.prototype.getShape = function(p_x,p_y){
	return this.shapeGrid[p_y][p_x];
}

SolverLITS.prototype.getRegionIndex = function(p_x, p_y) {
	return this.regionGrid[p_y][p_x];
}

SolverLITS.prototype.getRegion = function(p_x, p_y) {
	return this.regions[this.getRegionIndex(p_x, p_y)];
}

function isSpaceEvent(p_event) {
	return p_event.symbol;
}


//--------------------------------

// Input methods
SolverLITS.prototype.emitHypothesis = function(p_x,p_y,p_symbol){
	this.tryToPutNew(p_x,p_y,p_symbol);
}

SolverLITS.prototype.undoToLastHypothesis = function(){
	this.generalSolver.undoToLastHypothesis(undoEventClosure(this));
}

SolverLITS.prototype.quickStart = function(){
	this.regions.forEach(region => {
		if (region.size == 4){
			for (var i = 0; i <= 3 ; i++) {
				this.tryToPutNew(region.spaces[i].x, region.spaces[i].y, SPACE.OPEN);
			}
		};
	});
}

SolverLITS.prototype.passRegionAndAdjacents = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	var alreadyAddedRegions = [];
	var addedRegions = [];
	var x,y,otherIR;
	for (var i = 0; i < this.regions.size; i++) {
		alreadyAddedRegions.push(false);
	}
	this.regions[p_indexRegion].spaces.forEach(space => {
		x = space.x;
		y = space.y;
		if (x > 0) {
			otherIR = this.regionGrid[y][x-1];
			if (otherIR != p_indexRegion && !alreadyAddedRegions[otherIR]) {
				alreadyAddedRegions[otherIR] = true;
				addedRegions.push(otherIR);
			}
		}
		if (x <= this.xLength-2) {
			otherIR = this.regionGrid[y][x+1];
			if (otherIR != p_indexRegion && !alreadyAddedRegions[otherIR]) {
				alreadyAddedRegions[otherIR] = true;
				addedRegions.push(otherIR);
			}
		}
		if (y > 0) {
			otherIR = this.regionGrid[y-1][x];
			if (otherIR != p_indexRegion && !alreadyAddedRegions[otherIR]) {
				alreadyAddedRegions[otherIR] = true;
				addedRegions.push(otherIR);
			}
		}
		if (y <= this.yLength-2) {
			otherIR = this.regionGrid[y+1][x];
			if (otherIR != p_indexRegion && !alreadyAddedRegions[otherIR]) {
				alreadyAddedRegions[otherIR] = true;
				addedRegions.push(otherIR);
			}
		}
	});
	 
	addedRegions.forEach(ir => {
		var newList = this.generateEventsForRegionPass(ir);
		Array.prototype.push.apply(generatedEvents, newList);
	});
	
	this.generalSolver.passEvents(generatedEvents, this.methodSet, this.methodTools); 
} //TODO can be improved ?

SolverLITS.prototype.passRegion = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.generalSolver.passEvents(generatedEvents, this.methodSet, this.methodTools); 
}

SolverLITS.prototype.multiPass = function() {
	this.generalSolver.multiPass(
		generateEventsForRegionPassClosure(this),
		orderedListPassArgumentsMethodClosure(this), 
		this.methodSet, this.methodTools);
}

//--------------------------------

// Doing and undoing
applyEventClosure = function(p_solver) {
	return function(eventToApply) {
		if (isSpaceEvent(eventToApply)) {
			//console.log("Like a mistake ? "+eventToApply.x()+" "+eventToApply.y()); 551551
			return p_solver.putNew(eventToApply.x(), eventToApply.y(), eventToApply.symbol);
		} else {
			return p_solver.putShape(eventToApply.x(), eventToApply.y(), eventToApply.shape);
		}
	}
}

SolverLITS.prototype.putNew = function(p_x,p_y,p_symbol){
	if ((p_x < 0) || (p_y < 0) || (p_x >= this.xLength) || (p_y >= this.yLength) || (this.answerGrid[p_y][p_x] == p_symbol)){
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerGrid[p_y][p_x] != SPACE.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerGrid[p_y][p_x] = p_symbol;
	var ir = this.regionGrid[p_y][p_x];
	var region = this.regions[ir];
	if (p_symbol == SPACE.OPEN){
		region.openSpaces.push({x : p_x, y : p_y});
	} else if (p_symbol == SPACE.CLOSED){
		region.notPlacedYetClosed--;
	}
	return EVENT_RESULT.SUCCESS;
}

SolverLITS.prototype.putShape = function(p_x, p_y, p_shape) {
	if ((p_x < 0) || (p_y < 0) || (p_x >= this.xLength) || (p_y >= this.yLength) || (this.shapeGrid[p_y][p_x] == p_shape)){
		return EVENT_RESULT.HARMLESS;
	}
	if (this.shapeGrid[p_y][p_x] != LITS.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.shapeGrid[p_y][p_x] = p_shape;
	return EVENT_RESULT.SUCCESS;
}

undoEventClosure = function(p_solver) {
	return function(eventToUndo) {
		if (isSpaceEvent(eventToUndo)) {
			const x = eventToUndo.x(); //Décidément il y en a eu à faire, des changements de x en x() depuis qu'on a mis en commun les solvers de puzzles d'adjacences
			const y = eventToUndo.y();
			const symbol = eventToUndo.symbol;
			p_solver.answerGrid[y][x] = SPACE.UNDECIDED;
			var ir = p_solver.regionGrid[y][x];
			var region = p_solver.regions[ir];
			if (symbol == SPACE.OPEN){
				region.openSpaces.pop(); // This "pop" suggests that events are always undone in the order reverse they were done.
			} else if (symbol == SPACE.CLOSED){
				region.notPlacedYetClosed++;
			}
		} else {
			p_solver.shapeGrid[eventToUndo.y()][eventToUndo.x()] = LITS.UNDECIDED;
		}
	}
}

//--------------------------------

// Central method
SolverLITS.prototype.tryToPutNew = function (p_x, p_y, p_symbol) {
	// If we directly passed methods and not closures, we would be stuck because "this" would refer to the Window object which of course doesn't define the properties we want, e.g. the properties of the solvers.
	// All the methods pass the solver as a parameter because they can't be prototyped by it (problem of "undefined" things). 
	methodPack = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		adjacencyClosure(this),
		transformClosure(this),
		undoEventClosure(this)
	);
	methodPack.addAbortAndFilters(abortClosure(this), [filterClosure(this)]);
	this.generalSolver.tryToApplyHypothesis( SpaceEvent(p_x, p_y, p_symbol), methodPack);
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

// C'est ici que ça devient intéressant !
deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		var x = p_eventBeingApplied.x();
		var y = p_eventBeingApplied.y();
		var ir = p_solver.regionGrid[y][x];
		var region = p_solver.regions[ir];
		if (isSpaceEvent(p_eventBeingApplied)) {
			symbol = p_eventBeingApplied.symbol;
			if (symbol == SPACE.CLOSED) {	
				//Alert on region
				if (region.notPlacedYetClosed == 0) {
					p_listEventsToApply = p_solver.alertRegion(p_listEventsToApply,ir,SPACE.OPEN, 4-region.openSpaces.length);			
				}
			} else {
				// Alert on 2x2 areas
				p_listEventsToApply = p_solver.alert2x2Areas(p_listEventsToApply, x, y);
				// If there are 3 or 4 spaces open, mark the region as "to be checked in the filter". 
				if (region.openSpaces.length >= 3) {
					p_solver.declareRegion3or4open(ir);
				} else {
					// Plan events to discard any space that is too far away (distance > 3) or separated by closed spaces : once the 1st space in a region is set open, all those that are too far away won't be legally set open.
					// If an open space is in a too small non-closed cluster, this leads to a situation where there are spaces left to reach the number of 4 and open-set events are planned on those same spaces : imminent crash, this will be a failed attempt and everything will be undone.
					// One exception though : if the 4th open space of a region is put in a way that all 4 are not-contiguous at a distance of each other < 4, it may fail. Unless we perform a check, see below.
					if (region.notPlacedYetClosed > 0) {
						p_listEventsToApply = p_solver.discriminateUnreachable(p_listEventsToApply, x, y, ir);
					}
				}
				
				// If 2 spaces are open, in the same region, in the same row/column and they are 1 space apart, then : this space must be open AND belong to this region. Otherwise, this is an immediate failure !
				p_listEventsToApply = p_solver.fillOpenGaps(p_listEventsToApply, x, y, ir);
				
				//Alert on region
				if (region.openSpaces.length == 4){
					p_listEventsToApply = p_solver.alertRegion(p_listEventsToApply,ir,SPACE.CLOSED,region.notPlacedYetClosed);			
				}
				
				// Test the non-adjacency of same shapes
				shape = p_solver.shapeGrid[y][x];
				if (shape != LITS.UNDECIDED) {
					p_listEventsToApply = p_solver.closeUpTo4NeighborsOrNotSameShapeWhileOpen(p_listEventsToApply, x, y, ir, shape);
				}
			}
		} else {
			// A shape event : if 2 spaces are affected the same shape, if either of them is open, close the other one. 
			shape = p_eventBeingApplied.shape;
			if (p_solver.answerGrid[y][x] == SPACE.OPEN) {
				p_listEventsToApply = p_solver.closeUpTo4NeighborsOrNotSameShapeWhileOpen(p_listEventsToApply, x, y, ir, shape);
			} else if ((p_solver.leftExists(x) && (p_solver.answerGrid[y][x-1] == SPACE.OPEN) && p_solver.sameShapesNeighbors(x-1, y, ir, shape) ) ||
				(p_solver.upExists(y) && (p_solver.answerGrid[y-1][x] == SPACE.OPEN) && p_solver.sameShapesNeighbors(x, y-1, ir, shape)) ||
				(p_solver.rightExists(x) && (p_solver.answerGrid[y][x+1] == SPACE.OPEN) && p_solver.sameShapesNeighbors(x+1, y, ir, shape)) ||
				(p_solver.downExists(y) && (p_solver.answerGrid[y+1][x] == SPACE.OPEN) && p_solver.sameShapesNeighbors(x, y+1, ir, shape)) ) {
				p_listEventsToApply.push(SpaceEvent(x, y, SPACE.CLOSED));
			}
		}
		return p_listEventsToApply;
	}
}

// States whether the p_x, p_y space is occupied or not. (TODO : take banned spaces into account)
SolverLITS.prototype.isOccupied = function (p_x,p_y) {
	return (this.answerGrid[p_y][p_x] == SPACE.OPEN);
}

// TODO : take banned spaces into account
SolverLITS.prototype.isNotClosed = function (p_x,p_y) {
	return (this.answerGrid[p_y][p_x] != SPACE.CLOSED);
}

// If (x1, x2) is occupied, add event (x3, x4). Then, if (x3, x4) is occupied, add event (x1, x2)
SolverLITS.prototype.duelOccupation = function (p_listEvents, p_x1, p_y1, p_x2, p_y2) {
	if (this.answerGrid[p_y1][p_x1] == SPACE.OPEN) {
		p_listEvents.push(SpaceEvent(p_x2, p_y2, SPACE.CLOSED));
	}
	if (this.answerGrid[p_y2][p_x2] == SPACE.OPEN) {
		p_listEvents.push(SpaceEvent(p_x1, p_y1, SPACE.CLOSED));
	}
	return p_listEvents;
}

// We added an open space. Is it the 3rd out of 4 of any of the up to 4 2x2 areas it belongs to ?
SolverLITS.prototype.alert2x2Areas = function(p_listEvents, p_x, p_y) {
	if (p_x > 0) {
		if (this.isOccupied(p_x-1, p_y)) { // Left space occupied ? Check spaces above / below
			if (p_y > 0) {
				p_listEvents = this.duelOccupation(p_listEvents, p_x-1, p_y-1, p_x, p_y-1);
			}
			if (p_y <= this.yLength-2) {
				p_listEvents = this.duelOccupation(p_listEvents, p_x-1, p_y+1, p_x, p_y+1);
			}
		} else { // Left space unoccupied : check if spaces above/below are occupied.
			if (((p_y > 0) && (this.isOccupied(p_x-1, p_y-1)) && this.isOccupied(p_x, p_y-1)) ||
				((p_y <= this.yLength-2) && (this.isOccupied(p_x-1, p_y+1)) && this.isOccupied(p_x, p_y+1))) {
				p_listEvents.push(SpaceEvent(p_x-1, p_y, SPACE.CLOSED));
			} 
		}
	}
	if (p_x <= this.xLength-2) {
		if (this.isOccupied(p_x+1, p_y)) { // Right space occupied ? Check spaces above / below
			if (p_y > 0) {
				p_listEvents = this.duelOccupation(p_listEvents, p_x+1, p_y-1, p_x, p_y-1);
			}
			if (p_y <= this.yLength-2) {
				p_listEvents = this.duelOccupation(p_listEvents, p_x+1, p_y+1, p_x, p_y+1);
			}
		} else { // Right space unoccupied : check if spaces above/below are occupied.
			if (((p_y > 0) && (this.isOccupied(p_x+1, p_y-1)) && this.isOccupied(p_x, p_y-1)) ||
				((p_y <= this.yLength-2) && (this.isOccupied(p_x+1, p_y+1)) && this.isOccupied(p_x, p_y+1))) {
				p_listEvents.push(SpaceEvent(p_x+1, p_y, SPACE.CLOSED));
			} 
		}
	}
	return p_listEvents;
}

// List of closed events to declare closed all spaces that cannot be reached at a distance of 4 of the given (p_x, p_y) open space.
// Note : a non-closed (eg. open + undecided) cluster too small can remain for a while, and by default no event is placed to close such a cluster. But any attempt to try to put an open space into a too small cluster will lead to a failure !
// That is, unless a detector of too small non-closed clusters is made.
SolverLITS.prototype.discriminateUnreachable = function(p_listEvents, p_x, p_y, p_indexRegion) {
	var list_spacesToPropagate = [{x: p_x, y:p_y}];
	var x,y;
	this.proximitiesGrid[p_y][p_x] = 3; // The central space is worth 3, then the proximities values will descend by one at each successive space, comparatively to lava flowing from a volcano...
	var spaceToPropagate;
	while (list_spacesToPropagate.length > 0) {
		// Propagate in each direction until all "non-closed spaces in the region that are close enough" have been visited
		spaceToPropagate = list_spacesToPropagate.pop();
		x = spaceToPropagate.x;
		y = spaceToPropagate.y;
		proximity = this.proximitiesGrid[y][x];
		if (x > 0) {
			list_spacesToPropagate = this.updateSpacesToPropagate(list_spacesToPropagate, x-1, y, p_indexRegion, proximity);
		}
		if (x <= this.xLength-2) {
			list_spacesToPropagate = this.updateSpacesToPropagate(list_spacesToPropagate, x+1, y, p_indexRegion, proximity);
		}
		if (y > 0) {
			list_spacesToPropagate = this.updateSpacesToPropagate(list_spacesToPropagate, x, y-1, p_indexRegion, proximity);
		}
		if (y <= this.yLength-2) {
			list_spacesToPropagate = this.updateSpacesToPropagate(list_spacesToPropagate, x, y+1, p_indexRegion, proximity);
		}
	}
	
	// List events for non-visited spaces + clean visited spaces
	this.regions[p_indexRegion].spaces.forEach(space => {
		x = space.x;
		y = space.y;
		if (this.proximitiesGrid[y][x] == -1) {
			p_listEvents.push(SpaceEvent(x, y, SPACE.CLOSED));
		} else {
			this.proximitiesGrid[y][x] = -1;	
		}
	});
	return p_listEvents;
}

// Test to propagate or not a space in a direction (left, up, right, down), whose coordinates have been passed by the above method
// By the way, no check for values of p_xx and p_yy as it is done above.
SolverLITS.prototype.updateSpacesToPropagate = function (p_listSpacesToPropagate, p_xx, p_yy, p_indexRegion, p_originalProximity){
	if ((this.regionGrid[p_yy][p_xx] == p_indexRegion) && this.isNotClosed(p_xx,p_yy) && (this.proximitiesGrid[p_yy][p_xx] < p_originalProximity-1)) {
		this.proximitiesGrid[p_yy][p_xx] = p_originalProximity-1;
		p_listSpacesToPropagate.push({x : p_xx, y : p_yy});
	}
	return p_listSpacesToPropagate;
}

// The classical "when the remaining spaces of a region must be closed/open to reach the numbers"
SolverLITS.prototype.alertRegion = function(p_listEvents,p_regionIndex,p_missingSymbol,p_missingNumber) {
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

// Fill "open gaps", eg if 2 spaces in the same region are open and in the same row/column with 1 space in-between, that space must be filled.
// Note : this assumes the fact that the space in-between automatically belongs to the region. If the discrimination of unreachables has been correctly performed, a situation where the space in-between doesn't belong to the region shouldn't exist.
SolverLITS.prototype.fillOpenGaps = function(p_listEventsToApply, p_x, p_y, p_ir) {
	if (p_x >= 2) {
		p_listEventsToApply = this.fillOpenGapOrNot(p_listEventsToApply, p_x, p_y, -1, 0, p_ir);
	}
	if (p_y >= 2) {
		p_listEventsToApply = this.fillOpenGapOrNot(p_listEventsToApply, p_x, p_y, 0, -1, p_ir);
	}
	if (p_x <= this.xLength-3) {
		p_listEventsToApply = this.fillOpenGapOrNot(p_listEventsToApply, p_x, p_y, 1, 0, p_ir);
	}
	if (p_y <= this.yLength-3) {
		p_listEventsToApply = this.fillOpenGapOrNot(p_listEventsToApply, p_x, p_y, 0, 1, p_ir);
	}
	return p_listEventsToApply;
}

SolverLITS.prototype.fillOpenGapOrNot = function(p_listEventsToApply, p_x, p_y, p_deltaX, p_deltaY, p_indexRegion) {
	if ((this.regionGrid[p_y + p_deltaY * 2][p_x + p_deltaX * 2] == p_indexRegion) && (this.answerGrid[p_y + p_deltaY * 2][p_x + p_deltaX * 2] == SPACE.OPEN)) {
		p_listEventsToApply.push(SpaceEvent(p_x + p_deltaX ,p_y + p_deltaY ,SPACE.OPEN));
	}
	return p_listEventsToApply;
}

// Declare a region that should be checked in filter
SolverLITS.prototype.declareRegion3or4open = function(p_indexRegion) {
	if (! this.checker3or4Open.arrayPresence[p_indexRegion]) {
		this.checker3or4Open.arrayPresence[p_indexRegion] = true;
		this.checker3or4Open.list.push(p_indexRegion);
	}
}

// Potentially close all 4 spaces (but not the space itself) as the space p_x, p_y is open
SolverLITS.prototype.closeUpTo4NeighborsOrNotSameShapeWhileOpen = function (p_listEventsToApply, p_x, p_y, p_ir, p_shape) {
	if (p_x > 0) {
		p_listEventsToApply = this.closeNeighborSpaceOrNotSameShape(p_listEventsToApply, p_x-1, p_y, p_ir, p_shape);
	}
	if (p_y > 0) {
		p_listEventsToApply = this.closeNeighborSpaceOrNotSameShape(p_listEventsToApply, p_x, p_y-1, p_ir, p_shape);
	}
	if (p_x <= this.xLength - 2) {
		p_listEventsToApply = this.closeNeighborSpaceOrNotSameShape(p_listEventsToApply, p_x+1, p_y, p_ir, p_shape);
	}
	if (p_y <= this.yLength - 2) {
		p_listEventsToApply = this.closeNeighborSpaceOrNotSameShape(p_listEventsToApply, p_x, p_y+1, p_ir, p_shape);
	}
	return p_listEventsToApply;
}

// Close adjacent space if it is "same shape across region border" (the "home" space is known to be open)
SolverLITS.prototype.closeNeighborSpaceOrNotSameShape = function (p_listEventsToApply, p_xOther, p_yOther, p_ir, p_shape) {
	if (this.sameShapesNeighbors(p_xOther, p_yOther, p_ir, p_shape)) {
		p_listEventsToApply.push(SpaceEvent(p_xOther, p_yOther, SPACE.CLOSED));
	}
	return p_listEventsToApply;
}

// Check if 2 spaces are affected same shape and are adjacent across borders (validity check already done)
SolverLITS.prototype.sameShapesNeighbors = function(p_xOther, p_yOther, p_ir, p_shape) {
	return (this.getRegionIndex(p_xOther, p_yOther) != p_ir) && (this.getShape(p_xOther, p_yOther) == p_shape);
}

// Abortion 
SolverLITS.prototype.cleanDeclarations3or4open = function() {
	this.checker3or4Open.list.forEach( indexRegion => {
		this.checker3or4Open.arrayPresence[indexRegion] = false;
	});
	this.checker3or4Open.list = [];
}

// Post-indiviual-events filter : for each region that has 3 or 4 spaces, apply the consequences... and clean the environment afterwards !
// Since it is a filter it must return FAILURE or a list of deducted events
SolverLITS.prototype.applyDeclarations3or4open = function() {
	var eventsList = [];
		//this.checker3or4Open.list.forEach( indexRegion => { // Well, this was a ".forEach( indexRegion => {...} ) " but this contained a "return ..." 

	for (var i = 0 ; i < this.checker3or4Open.list.length ; i++) {
		indexRegion = this.checker3or4Open.list[i];
	 // Well, this was a ".forEach( indexRegion => {...} ) " but this contained a "return ..." 
		if (4 == this.regions[indexRegion].openSpaces.length) {				
			eventsList = this.eventsTetrominoIdentification(eventsList, indexRegion);
		} else if (3 == this.regions[indexRegion].openSpaces.length) {				
			eventsList = this.eventsTripletPlacement(eventsList, indexRegion);
		}
		if (eventsList == EVENT_RESULT.FAILURE) {
			return EVENT_RESULT.FAILURE; // 
		}
	};
	this.cleanDeclarations3or4open();
	return eventsList;
}

// When a region contains 4 open spaces
SolverLITS.prototype.eventsTetrominoIdentification = function(p_eventsList, p_indexRegion) {
	eventsList = [];
	firstSpace = getFirstLexicalOrderSpace(this.regions[p_indexRegion].openSpaces);
	x1 = firstSpace.x;
	y1 = firstSpace.y;
	if (this.isOpenInRegionAtRight(x1+1, y1, p_indexRegion)) { //10
		if (this.isOpenInRegionAtRight(x1+2, y1, p_indexRegion)) { //10 20
			if (this.isOpenInRegionAtRight(x1+3, y1, p_indexRegion)) {
				eventsList = shape4(x1, y1, 1, 0, 2, 0, 3, 0, LITS.I);
			} else if (y1 <= this.yLength-2) {
				if (this.isOpenInRegion(x1+2, y1+1, p_indexRegion)) {
					eventsList = shape4(x1, y1, 1, 0, 2, 0, 2, 1, LITS.L);
				} else if (this.isOpenInRegion(x1+1, y1+1, p_indexRegion)) {
					eventsList = shape4(x1, y1, 1, 0, 2, 0, 1, 1, LITS.T);
				} else if (this.isOpenInRegion(x1, y1+1, p_indexRegion)) {
					eventsList = shape4(x1, y1, 1, 0, 2, 0, 0, 1, LITS.L);
				} 
			}
		} else if (this.isOpenInRegionAtDown(x1+1, y1+1, p_indexRegion)) { //10 11
			if (this.isOpenInRegionAtRight(x1+2, y1+1, p_indexRegion)) {
				eventsList = shape4(x1, y1, 1, 0, 1, 1, 2, 1, LITS.S);
			} else if (this.isOpenInRegionAtDown(x1+1, y1+2, p_indexRegion)) {
				eventsList = shape4(x1, y1, 1, 0, 1, 1, 1, 2, LITS.L);
			} 
		} else if (this.isOpenInRegionAtDown(x1, y1+1, p_indexRegion)) {// 10 01
			if (this.isOpenInRegionAtDown(x1, y1+2, p_indexRegion)) {
				eventsList = shape4(x1, y1, 1, 0, 0, 1, 0, 2, LITS.L);
			} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) {
				eventsList = shape4(x1, y1, 1, 0, 0, 1, -1, 1, LITS.S);
			}
		}
	} else if (this.isOpenInRegionAtDown(x1, y1+1, p_indexRegion)) { // 01
		if (this.isOpenInRegionAtRight(x1+1, y1+1, p_indexRegion)) { // 01 11
			if (this.isOpenInRegionAtRight(x1+2, y1+1, p_indexRegion)) {
				eventsList = shape4(x1, y1, 0, 1, 1, 1, 2, 1, LITS.L);
			} else if (this.isOpenInRegionAtDown(x1+1, y1+2, p_indexRegion)) { //TODO factoriser avec ci-dessous
				eventsList = shape4(x1, y1, 0, 1, 1, 1, 1, 2, LITS.S);
			} else if (this.isOpenInRegionAtDown(x1, y1+2, p_indexRegion)) {
				eventsList = shape4(x1, y1, 0, 1, 1, 1, 0, 2, LITS.T);
			} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) {
				eventsList = shape4(x1, y1, 0, 1, 1, 1, -1, 1, LITS.T);
			}
		} else if (this.isOpenInRegionAtDown(x1, y1+2, p_indexRegion)) { // 01 02
			if (this.isOpenInRegionAtRight(x1+1, y1+2, p_indexRegion)) {
				eventsList = shape4(x1, y1, 0, 1, 0, 2, 1, 2, LITS.L);
			} else if (this.isOpenInRegionAtDown(x1, y1+3, p_indexRegion)) {
				eventsList = shape4(x1, y1, 0, 1, 0, 2, 0, 3, LITS.I);
			} else if (this.isOpenInRegionAtLeft(x1-1, y1+2, p_indexRegion)) { // TODO factoriser avec ci-dessous
				eventsList = shape4(x1, y1, 0, 1, 0, 2, -1, 2, LITS.L);
			}  else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) {
				eventsList = shape4(x1, y1, 0, 1, 0, 2, -1, 1, LITS.T);
			}
		} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) { // 01 -11 
			if (this.isOpenInRegionAtDown(x1-1, y1+2, p_indexRegion)) {
				eventsList = shape4(x1, y1, 0, 1, -1, 1, -1, 2, LITS.S);
			} else if (this.isOpenInRegionAtLeft(x1-2, y1+1, p_indexRegion)) {
				eventsList = shape4(x1, y1, 0, 1, -1, 1, -2, 1, LITS.L);
			}
		}
	}
	
	if (eventsList.length == 0) {
		return EVENT_RESULT.FAILURE;
	}
	else {
		Array.prototype.push.apply(p_eventsList, eventsList);
		return p_eventsList;
	}
}

// Fills a region with the 4 spaces below
shape4 = function(p_x1, p_y1, p_deltaX1, p_deltaY1, p_deltaX2, p_deltaY2, p_deltaX3, p_deltaY3, p_form) {
	eventList = [];
	eventList.push(new ShapeEvent(p_x1, p_y1, p_form));
	eventList.push(new ShapeEvent(p_x1 + p_deltaX1, p_y1 + p_deltaY1, p_form));
	eventList.push(new ShapeEvent(p_x1 + p_deltaX2, p_y1 + p_deltaY2, p_form));
	eventList.push(new ShapeEvent(p_x1 + p_deltaX3, p_y1 + p_deltaY3, p_form));
	return eventList;
}

// When a region contains 3 open spaces
SolverLITS.prototype.eventsTripletPlacement = function(p_eventsList, p_indexRegion) {
	const firstSpace = getFirstLexicalOrderSpace(this.regions[p_indexRegion].openSpaces);
	const x1 = firstSpace.x;
	const y1 = firstSpace.y;
	const beforeLength = p_eventsList.length;
	var ok = false;
	if (this.isOpenInRegionAtRight(x1+1, y1, p_indexRegion)) { //10
		if (this.isOpenInRegionAtRight(x1+2, y1, p_indexRegion)) { 
			p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 1);
			ok = true;
		} else if (y1 <= this.yLength-2) {
			if (this.isOpenInRegion(x1+2, y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 11);
				ok = true;
			} else if (this.isOpenInRegion(x1+1, y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 4);
				ok = true;
			} else if (this.isOpenInRegion(x1, y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 3);
				ok = true;
			} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 14);
				ok = true;
			}
		} 
	} else if (y1 <= this.yLength-2) {
		if (this.isOpenInRegion(x1, y1+1, p_indexRegion)) {  // 01
			if (this.isOpenInRegionAtRight(x1+1,y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 6);
				ok = true;
			} else if (this.isOpenInRegionAtDownRight(x1+1,y1+2, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 12);
				ok = true;
			} else if (this.isOpenInRegionAtDown(x1,y1+2, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 2);
				ok = true;
			} else if  (this.isOpenInRegionAtDownLeft(x1-1,y1+2, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 13);
				ok = true;
			} else if (this.isOpenInRegionAtLeft(x1-1,y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 5);
				ok = true;
			}
		} else if (this.isOpenInRegionAtRight(x1+1, y1+1, p_indexRegion)) { // 11
			if (this.isOpenInRegionAtRight(x1+2,y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 7);
				ok = true;
			} else if (this.isOpenInRegionAtDown(x1+1,y1+2, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 8);
				ok = true;
			}
		} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) { // -11
			if (this.isOpenInRegionAtDown(x1-1,y1+2,p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 9);
				ok = true;
			} else if (this.isOpenInRegionAtLeft(x1-2,y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 10);
				ok = true;
			}
		}
	}
	// No "new events" found ? 
	if (!ok) {
		return EVENT_RESULT.FAILURE;
	}		
	return p_eventsList;
}

const spaceDelta = {};
const spaceDelta_01 = {x:0, y:1};
const spaceDelta_02 = {x:0, y:2};
const spaceDelta_03 = {x:0, y:3};
const spaceDelta_10 = {x:1, y:0};
const spaceDelta_20 = {x:2, y:0};
const spaceDelta_30 = {x:3, y:0};
const spaceDelta_0M = {x:0, y:-1};
const spaceDelta_M0 = {x:-1, y:0};
const spaceDelta_11 = {x:1, y:1};
const spaceDelta_12 = {x:1, y:2};
const spaceDelta_21 = {x:2, y:1};
const spaceDelta_M1 = {x:-1, y:1};
const spaceDelta_1M = {x:1, y:-1};
const spaceDelta_M2 = {x:-1, y:2};
const spaceDelta_2M = {x:2, y:-1};
const spaceDelta_MM1 = {x:-2, y:1};


// For each of the configurations, give : list of L-placements, list of I-placements, list of T-placements, list of S-placements
const arrayOfEventsByConfig = [
[[],[],[],[]], // config 0, nonexistent (numerotation starts at 1)
[[spaceDelta_0M, spaceDelta_01, spaceDelta_2M, spaceDelta_21],  [spaceDelta_M0, spaceDelta_30], [spaceDelta_1M, spaceDelta_11],[]], // config 1 Ooo
[[spaceDelta_M0, spaceDelta_10, spaceDelta_M2, spaceDelta_12],  [spaceDelta_0M, spaceDelta_03], [spaceDelta_M1, spaceDelta_11],[]], //config 2 going down
[[spaceDelta_02, spaceDelta_20], [], [spaceDelta_M0, spaceDelta_0M], [spaceDelta_1M, spaceDelta_M1]], // Config 3 angle with legs DR
[[spaceDelta_M0, spaceDelta_12], [], [spaceDelta_1M, spaceDelta_20], [spaceDelta_0M, spaceDelta_21]], // Config 4 angle with legs DL
[[spaceDelta_0M, spaceDelta_MM1], [], [spaceDelta_11, spaceDelta_02], [spaceDelta_M2, spaceDelta_10]], // Config 5 : angle with legs LU
[[spaceDelta_0M, spaceDelta_21], [], [spaceDelta_M1, spaceDelta_02], [spaceDelta_12, spaceDelta_M0]], // Config 6 : angle with legs RU
[[spaceDelta_01], [], [], [spaceDelta_10]], // Config 7 : 1-then-2 right down
[[spaceDelta_10], [], [], [spaceDelta_01]], // Config 8 : 1-then-2 down right
[[spaceDelta_M0], [], [], [spaceDelta_01]], // Config 9 : 1-then-2 down left
[[spaceDelta_01], [], [], [spaceDelta_M0]], // Config 10 : 1-then-2 left down
[[spaceDelta_20], [], [], [spaceDelta_11]], // Config 11 : 2-then-1 right down
[[spaceDelta_02], [], [], [spaceDelta_11]], // Config 12 : 2-then-1 down right
[[spaceDelta_02], [], [], [spaceDelta_M1]], // Config 13 : 2-then-1 down left
[[spaceDelta_M0], [], [], [spaceDelta_01]] // Config 14 : 2-then-1 left down
];

/**
Creates events from 3 open spaces, closing any unneeded spaces and affecting shapes to spaces
p_ix, p_iy : origin space (1st in lexical order), p_ir : region index,
p_identifiant : identifiant of the triplet of spaces. See text doc for list of shapes.
*/
SolverLITS.prototype.shapeFrom3Open = function(p_eventsList, p_x, p_y, p_ir, p_identifiant) {
	const eventsByConfig = arrayOfEventsByConfig[p_identifiant];
	p_eventsList = this.pushShapeEventsDelta(p_eventsList, p_x, p_y, p_ir, eventsByConfig[0], LITS.L);
	p_eventsList = this.pushShapeEventsDelta(p_eventsList, p_x, p_y, p_ir, eventsByConfig[1], LITS.I);
	p_eventsList = this.pushShapeEventsDelta(p_eventsList, p_x, p_y, p_ir, eventsByConfig[2], LITS.T);
	p_eventsList = this.pushShapeEventsDelta(p_eventsList, p_x, p_y, p_ir, eventsByConfig[3], LITS.S);
	return p_eventsList;
}

SolverLITS.prototype.pushShapeEventsDelta = function (p_eventsList, p_x, p_y, p_ir, p_spaceDeltas, p_shape) {
	p_spaceDeltas.forEach(delta => {
		const x = p_x + delta.x;
		const y = p_y + delta.y;
		if ((y >= 0) && (y < this.yLength) && (x >= 0) && (x < this.xLength) && (this.regionGrid[y][x] == p_ir)) {
			p_eventsList.push(new ShapeEvent(x, y, p_shape));
		}
	});
	return p_eventsList;
}


SolverLITS.prototype.isOpenInRegion = function(p_x, p_y, p_ir) {
	return (this.answerGrid[p_y][p_x] == SPACE.OPEN) && (this.regionGrid[p_y][p_x] == p_ir);
}	

SolverLITS.prototype.isOpenInRegionAtLeft = function(p_x, p_y, p_ir) {
	return (p_x >= 0) && (this.isOpenInRegion(p_x, p_y, p_ir));
}
SolverLITS.prototype.isOpenInRegionAtRight = function(p_x, p_y, p_ir) {
	return (p_x <= this.xLength-1) && (this.isOpenInRegion(p_x, p_y, p_ir));
}
SolverLITS.prototype.isOpenInRegionAtDown = function(p_x, p_y, p_ir) {
	return (p_y <= this.yLength-1) && (this.isOpenInRegion(p_x, p_y, p_ir));
}

SolverLITS.prototype.isOpenInRegionAtDownRight = function(p_x, p_y, p_ir) {
	//return (p_y <= this.yLength-2) && (this.isOpenInRegionAtRight(p_x+1, p_y+1, p_ir));
	return (p_y <= this.yLength-1) && (this.isOpenInRegionAtRight(p_x, p_y, p_ir));
}

SolverLITS.prototype.isOpenInRegionAtDownLeft = function(p_x, p_y, p_ir) {
	//return (p_y <= this.yLength-2) && (this.isOpenInRegionAtLeft(p_x-1, p_y+1, p_ir));
	return (p_y <= this.yLength-1) && (this.isOpenInRegionAtRight(p_x, p_y, p_ir));
}



// Get first space in lexical order. Takes in argument a non-empty array of items with x,y properties.
function getFirstLexicalOrderSpace(p_spaceArray) {
	var answer = p_spaceArray[0];
	for (var i = 1; i < p_spaceArray.length ; i++) {
		if ((p_spaceArray[i].y < answer.y) || ((p_spaceArray[i].y == answer.y) && (p_spaceArray[i].x < answer.x))) {
			answer = p_spaceArray[i];
		}
	}
	return answer;
}

// Extra closures
abortClosure = function(solver) {
	return function() {
		solver.cleanDeclarations3or4open();
	}
}

filterClosure = function(solver) {
	return function() {
		return solver.applyDeclarations3or4open();
	}
}


// Methods for safety check
SolverLITS.prototype.leftExists = function(p_x) {
	return p_x > 0;
}
SolverLITS.prototype.upExists = function(p_y) {
	return p_y > 0;
}
SolverLITS.prototype.rightExists = function(p_x) {
	return p_x <= this.xLength-2;
}
SolverLITS.prototype.downExists = function(p_y) {
	return p_y <= this.yLength-2;
}

// --------------------
// Passing

generateEventsForRegionPassClosure = function(p_solver) {
	return function(p_indexRegion) {
		return p_solver.generateEventsForRegionPass(p_indexRegion);
	}
}

// Generate covering events for "region pass".
SolverLITS.prototype.generateEventsForRegionPass = function(p_indexRegion) {
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
	if (p_event1.shape && p_event2.symbol) {
		return -1;
	} else if (p_event2.shape && p_event1.symbol) {
		return 1;
	} else if (p_event2.coorY > p_event1.coorY) {
		return -1;
	} else if (p_event2.coorY < p_event1.coorY) {
		return 1;
	} else if (p_event2.coorX > p_event1.coorX) {
		return -1;
	} else if (p_event2.coorX < p_event1.coorX) {
		return 1;
	} else {
		if (p_event1.shape) {
			return p_event1.shape - p_event2.shape; // Unstable : works because "shape" values are numbers
		} else {
			var c1 = (p_event1.symbol == SPACE.OPEN ? 1 : 0);
			var c2 = (p_event2.symbol == SPACE.OPEN ? 1 : 0); // Unstable : works because only "O" and "C" values are admitted
			return c1-c2;
		}
	}
}

orderedListPassArgumentsMethodClosure = function(p_solver) {
	return function() {
		var indexList = [];
		for (var i = 0; i < p_solver.regions.length ; i++) {
			indexList.push(i); //TODO faire une meilleure liste
		}
		indexList.sort(function(p_i1, p_i2) {
			closed1 = p_solver.regions[p_i1].notPlacedYetClosed;
			closed2 = p_solver.regions[p_i2].notPlacedYetClosed;
			open1 = 4-p_solver.regions[p_i1].openSpaces.length;
			open2 = 4-p_solver.regions[p_i2].openSpaces.length;
			return (closed1-open1*3) - (closed2-open2*3);
		});
		return indexList;
	}
}

// Les problèmes que j'ai pu rencontrer ne venaient pas de l'algorithme "passEvents" mais bel et bien des méthodes de comparaison et de copie (enfin surtout de comparaison). D'abord ne pas penser à comparer les "O" et "X" alors que c'était vital (on teste un évènement O et un évènement X qui ne peuvent être intersectés), et finalement ne plus penser à comparer les x. Oups...