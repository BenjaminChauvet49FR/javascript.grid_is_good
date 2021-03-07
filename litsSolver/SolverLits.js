// Setup

const NOT_FORCED = -1; 
const NOT_RELEVANT = -1;
// const SPACE is used in the dad solver

function SolverLITS(p_wallArray) {
	GeneralSolver.call(this);
	this.construct(p_wallArray);
}

// Credits about heritage : https://developer.mozilla.org/fr/docs/Learn/JavaScript/Objects/Heritage

SolverLITS.prototype = Object.create(GeneralSolver.prototype);
SolverLITS.prototype.constructor = SolverLITS;

SolverLITS.prototype.construct = function(p_wallArray) {
	this.generalConstruct();
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.makeItGeographical(this.xLength, this.yLength);
	this.methodSet = new ApplyEventMethodGeographicalPack( 
		applyEventClosure(this),
		deductionsClosure(this),
		adjacencyClosure(this),
		transformClosure(this),
		undoEventClosure(this)
	);
	this.methodsMultiPass = {
		generatePassEventsMethod : generateEventsForRegionPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		skipPassMethod : skipPassClosure(this)
	};
	this.methodSet.addOneAbortAndFilters(abortClosure(this), [filterClosure3or4Open(this), filterClosureNewlyClosed(this), filterClosure1or2Open(this)]);
	this.methodTools = {comparisonMethod : comparison, copyMethod : copying}; // Warning : the argumentToLabelMethod is defined right before the pass in this solver

	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionGrid();
	this.answerArray = [];
	this.proximitiesGrid = [];
	this.shapeArray = [];
	var ix,iy;
	var lastRegionNumber = 0;
	// Below fields are for adjacency "all spaces with ... must form a orthogonally contiguous area"
	this.atLeastOneOpen = false;
	this.adjacencyLimitGrid = createAdjacencyLimitGrid(this.xLength, this.yLength);
    this.adjacencyLimitSpacesList = [];
	
	// Initialize the required grids (notably answerArray) and the number of regions
	for(iy = 0;iy < this.yLength;iy++){
		this.answerArray.push([]);
		this.proximitiesGrid.push([]);
		this.shapeArray.push([]);
		for(ix = 0;ix < this.xLength;ix++){
			lastRegionNumber = Math.max(this.regionArray[iy][ix],lastRegionNumber);
			this.answerArray[iy].push(SPACE.UNDECIDED);
			this.proximitiesGrid[iy].push(-1);
			this.shapeArray[iy].push(LITS.UNDECIDED);
		}
	}
	this.regionsNumber = lastRegionNumber+1;
	
	// Initialize data of regions
	var ir;
	this.regions = [];
	for(ir=0;ir<this.regionsNumber;ir++){
		this.regions.push({
			spaces : [],
			neighborSpaces : [],
			openSpaces : [], // List of open spaces. //TODO : Typescript "space" ? 
			size : 0,
			shape : LITS.UNDECIDED
		});
	}
	
	this.checker3or4Open = new CheckCollection(this.regionsNumber);
	this.checker1or2Open = new CheckCollection(this.regionsNumber);
	this.checkerNewlyClosed = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	
	this.checkClusterInRegion = new CheckCollectionDoubleEntry(this.xLength, this.yLength); // Only used in applyDeclarations1or2Open
	// Now that region data are created : 
	// Initialize spaces by region +  purify grid
	var region;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			ir = this.regionArray[iy][ix];
			if (this.regionArray[iy][ix] == WALLGRID.OUT_OF_REGIONS) { 
				this.answerArray[iy][ix] = SPACE.CLOSED;
			} else {
				region = this.regions[ir];
				region.spaces.push({x:ix,y:iy});
			}
		}
	}
	
	// Initialize datas dependant to region size (now that all region spaces are known) such as X to place
	// Also initialize regions sizes for shortcut
	const addedSpacesNeighborToRegion = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	var dx;
	var dy;
	for(ir = 0;ir<this.regionsNumber;ir++){
		region = this.regions[ir];
		region.size = region.spaces.length;
		region.notPlacedYetClosed = region.size - 4;
		// No "notPlacedYet.OPENs" and "notPlacedYet.CLOSEDs" this time but a single variable instead because : 1) the OPENs is unneccessary, since it is always equal to 4-openSpaces.length (openSpaces added quite lately), 2) in LITS each region must have a check on remaining closed or open spaces, it is not optional for a region like in Heyawake.
		region.spaces.forEach(space => {
			x = space.x;
			y = space.y;
			if (this.leftExists(x) && addedSpacesNeighborToRegion.add(x-1, y) && !this.isBanned(x-1, y) && (this.getRegionIndex(x-1, y) != ir)) { //TODO a "direction factorization" sure is necessary.
				region.neighborSpaces.push({x : x-1, y : y});
			}
			if (this.upExists(y) && addedSpacesNeighborToRegion.add(x, y-1) && !this.isBanned(x, y-1) && (this.getRegionIndex(x, y-1) != ir)) {
				region.neighborSpaces.push({x : x, y : y-1});
			}
			if (this.rightExists(x) && addedSpacesNeighborToRegion.add(x+1, y) && !this.isBanned(x+1, y) && (this.getRegionIndex(x+1, y) != ir)) {
				region.neighborSpaces.push({x : x+1, y : y});
			}
			if (this.downExists(y) && addedSpacesNeighborToRegion.add(x, y+1) && !this.isBanned(x, y+1) && (this.getRegionIndex(x, y+1) != ir)) {
				region.neighborSpaces.push({x : x, y : y+1});
			}
		});
		addedSpacesNeighborToRegion.clean();
	}
}

//--------------------------------

// Misc methods (may be used for drawing and intelligence)
SolverLITS.prototype.getAnswer = function(p_x,p_y){
	return this.answerArray[p_y][p_x];
}

SolverLITS.prototype.getShape = function(p_x,p_y){
	return this.shapeArray[p_y][p_x];
}

SolverLITS.prototype.getRegionIndex = function(p_x, p_y) {
	return this.regionArray[p_y][p_x];
}

SolverLITS.prototype.isBanned = function(p_x, p_y) {
	return this.regionArray[p_y][p_x] == WALLGRID.OUT_OF_REGIONS;
}

SolverLITS.prototype.getRegion = function(p_x, p_y) {
	return this.regions[this.getRegionIndex(p_x, p_y)];
}

function isSpaceEvent(p_event) {
	return p_event.symbol;
}

function isShapeRegionEvent(p_event) {
	return p_event.region || (p_event.region == 0);
}

SolverLITS.prototype.getFirstSpaceRegion = function(p_i) {
	return this.regions[p_i].spaces[0];
}

//--------------------------------

// Input methods
SolverLITS.prototype.emitHypothesis = function(p_x,p_y,p_symbol){
	this.tryToPutNew(p_x,p_y,p_symbol);
}

SolverLITS.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverLITS.prototype.quickStart = function() { 
	this.initiateQuickStart();
	this.regions.forEach(region => {
		if (region.size == 4){
			for (var i = 0; i <= 3 ; i++) {
				this.tryToPutNew(region.spaces[i].x, region.spaces[i].y, SPACE.OPEN);
			}
		};
	});
	this.terminateQuickStart();
}

SolverLITS.prototype.passRegionAndAdjacentSpaces = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.regions[p_indexRegion].neighborSpaces.forEach(space => {
		if (this.answerArray[space.y][space.x] == SPACE.UNDECIDED) { // It would still be correct, albeit useless, to pass already filled spaces
			generatedEvents.push([new SpaceEvent(space.x, space.y, SPACE.OPEN), new SpaceEvent(space.x, space.y, SPACE.CLOSED)]);
		}	
	});
	this.passEvents(generatedEvents, this.methodSet, this.methodTools, p_indexRegion); 
}

/*SolverLITS.prototype.passRegionAndAdjacents = function(p_indexRegion) {
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
			otherIR = this.regionArray[y][x-1];
			if (otherIR != p_indexRegion && !alreadyAddedRegions[otherIR]) {
				alreadyAddedRegions[otherIR] = true;
				addedRegions.push(otherIR);
			}
		}
		if (x <= this.xLength-2) {
			otherIR = this.regionArray[y][x+1];
			if (otherIR != p_indexRegion && !alreadyAddedRegions[otherIR]) {
				alreadyAddedRegions[otherIR] = true;
				addedRegions.push(otherIR);
			}
		}
		if (y > 0) {
			otherIR = this.regionArray[y-1][x];
			if (otherIR != p_indexRegion && !alreadyAddedRegions[otherIR]) {
				alreadyAddedRegions[otherIR] = true;
				addedRegions.push(otherIR);
			}
		}
		if (y <= this.yLength-2) {
			otherIR = this.regionArray[y+1][x];
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
	
	this.passEvents(generatedEvents, this.methodSet, this.methodTools, p_indexRegion); 
} */

SolverLITS.prototype.passRegion = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.methodTools.argumentToLabelMethod = namingRegionClosure(this);
	this.passEvents(generatedEvents, this.methodSet, this.methodTools, p_indexRegion); 
}

SolverLITS.prototype.makeMultiPass = function() {
	this.methodTools.argumentToLabelMethod = namingRegionClosure(this);
	this.multiPass(this.methodSet, this.methodTools, this.methodsMultiPass);
}

namingRegionClosure = function(p_solver) {
	return function (p_indexRegion) {
		return "Region "+ p_indexRegion + " (" + p_solver.getFirstSpaceRegion(p_indexRegion).x +" "+ p_solver.getFirstSpaceRegion(p_indexRegion).y + ")"; 
	}
}

namingRegionClosureAdj = function(p_solver) {
	return function (p_indexRegion) {
		return "Region+adj. "+ p_indexRegion + " (" + p_solver.getFirstSpaceRegion(p_indexRegion).x +" "+ p_solver.getFirstSpaceRegion(p_indexRegion).y + ")"; 
	}
}


//--------------------------------

// Doing and undoing
applyEventClosure = function(p_solver) {
	return function(p_eventToApply) {
		if (isShapeRegionEvent(p_eventToApply)) {
			return p_solver.putShapeRegion(p_eventToApply.region, p_eventToApply.shape);
		}
		if (isSpaceEvent(p_eventToApply)) {
			return p_solver.putNew(p_eventToApply.x(), p_eventToApply.y(), p_eventToApply.symbol);
		} 
		const result = p_solver.putShape(p_eventToApply.x(), p_eventToApply.y(), p_eventToApply.shape); // Returning this wasn't enough because of the definition of shapeArray. See this function implementation.
		if (result == "Special 2-shapes case") {
			p_eventToApply.nothingHappened = true;
			return EVENT_RESULT.SUCCESS;
		} else {
			return result;
		}
	}
}

SolverLITS.prototype.putNew = function(p_x,p_y,p_symbol){
	if ((p_x < 0) || (p_y < 0) || (p_x >= this.xLength) || (p_y >= this.yLength) || (this.answerArray[p_y][p_x] == p_symbol)){
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[p_y][p_x] != SPACE.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerArray[p_y][p_x] = p_symbol;
	var ir = this.regionArray[p_y][p_x];
	var region = this.regions[ir];
	if (p_symbol == SPACE.OPEN){
		region.openSpaces.push({x : p_x, y : p_y});
	} else if (p_symbol == SPACE.CLOSED){
		region.notPlacedYetClosed--;
	}
	return EVENT_RESULT.SUCCESS;
}

SolverLITS.prototype.putShape = function(p_x, p_y, p_shape) {
	if ((p_x < 0) || (p_y < 0) || (p_x >= this.xLength) || (p_y >= this.yLength) ||  (this.answerArray[p_y][p_x] == SPACE.CLOSED) || (this.shapeArray[p_y][p_x] == p_shape)) { // this.answerArray added after.
		return EVENT_RESULT.HARMLESS;
	}
	if (this.shapeArray[p_y][p_x] != LITS.UNDECIDED) { // It's VERY important to recall the meaning of this grid. This is the grid of "if the space is open, then it should contain this shape" shapes, not the grid of "this space must absolutely contain this shape" ! Like this, it could lead to the region 8 in puzzle LITS54 having a L-related space (in pink as I write this) in its bottom-left corner (deductible by a specific pass) despite that space being impossible to open (deductible by another specific pass)
		if (this.answerArray[p_y][p_x] == SPACE.OPEN) {
			return EVENT_RESULT.FAILURE; // If this space is open (it is !) it should contain 2 different shapes. Hence the mistake...			
		} else {
			return "Special 2-shapes case"; // If this space is open, it should contain 2 different shapes. Luckily it isn't. So you know what ? Nothing happened, this event isn't even worth mentioning, and therefore not worth cancelling either. It should be notified in the main applying event method.
		}
	}
	this.shapeArray[p_y][p_x] = p_shape;
	return EVENT_RESULT.SUCCESS;
}

SolverLITS.prototype.putShapeRegion = function(p_regionIndex, p_shape) {
	const region = this.regions[p_regionIndex];
	if (p_shape == region.shape) {
		return EVENT_RESULT.HARMLESS;
	} 
	if (region.shape != LITS.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	region.shape = p_shape;
	return EVENT_RESULT.SUCCESS;
}

undoEventClosure = function(p_solver) {
	return function(eventToUndo) {
		if (isSpaceEvent(eventToUndo)) {
			const x = eventToUndo.x(); //Décidément il y en a eu à faire, des changements de x en x() depuis qu'on a mis en commun les solvers de puzzles d'adjacences
			const y = eventToUndo.y();
			const symbol = eventToUndo.symbol;
			p_solver.answerArray[y][x] = SPACE.UNDECIDED;
			var ir = p_solver.regionArray[y][x];
			var region = p_solver.regions[ir];
			if (symbol == SPACE.OPEN){
				region.openSpaces.pop(); // This "pop" suggests that events are always undone in the order reverse they were done.
			} else if (symbol == SPACE.CLOSED){
				region.notPlacedYetClosed++;
			}
		} else if (isShapeRegionEvent(eventToUndo)) {
			p_solver.regions[eventToUndo.region].shape = LITS.UNDECIDED;
		} else {
			p_solver.shapeArray[eventToUndo.y()][eventToUndo.x()] = LITS.UNDECIDED;
		}
	}
}

//--------------------------------

// Central method
SolverLITS.prototype.tryToPutNew = function (p_x, p_y, p_symbol) {
	// If we directly passed methods and not closures, we would be stuck because "this" would refer to the Window object which of course doesn't define the properties we want, e.g. the properties of the solvers.
	// All the methods pass the solver as a parameter because they can't be prototyped by it (problem of "undefined" things). 
	this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_symbol), this.methodSet);
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
        switch (p_solver.answerArray[p_y][p_x]) {
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

// Deductions closure. Where intelligence begins !
deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		if (isShapeRegionEvent(p_eventBeingApplied)) {
			const shape = p_eventBeingApplied.shape;
			var x, y;
			p_solver.regions[p_eventBeingApplied.region].spaces.forEach(space => {
				x = space.x;
				y = space.y;
				if ((p_solver.shapeArray[y][x] != LITS.UNDECIDED) && (p_solver.shapeArray[y][x] != shape)) {
					p_listEventsToApply.push(new SpaceEvent(x, y, SPACE.CLOSED));
				} else {
					p_listEventsToApply.push(new ShapeEvent(x, y, shape));
				}
				// TODO : also close adjacent spaces that would be too curious. But there is still to put adjacent spaces.
			});
		} else if (isSpaceEvent(p_eventBeingApplied)) {
			const x = p_eventBeingApplied.x();
			const y = p_eventBeingApplied.y();
			const ir = p_solver.regionArray[y][x];
			const region = p_solver.regions[ir];
			symbol = p_eventBeingApplied.symbol;
			if (symbol == SPACE.CLOSED) {	
				p_solver.checkerNewlyClosed.add(x, y);
				//Alert on region
				if (region.notPlacedYetClosed == 0) {
					p_listEventsToApply = p_solver.alertRegion(p_listEventsToApply,ir,SPACE.OPEN, 4-region.openSpaces.length);			
				}
				if (region.openSpaces.length == 3) { // Now that a space is closed, maybe something new is found in that region.
					p_solver.checker3or4Open.add(ir);
				}
			} else { // Space is open
				// Alert on 2x2 areas
				p_listEventsToApply = p_solver.alert2x2Areas(p_listEventsToApply, x, y);
				// If there are 3 or 4 spaces open, mark the region as "to be checked in the filter". 
				if (region.openSpaces.length >= 3) {
					p_solver.checker3or4Open.add(ir);
				} else {
					p_solver.checker1or2Open.add(ir);
				}

				// If 2 spaces are open, in the same region, in the same row/column and they are 1 space apart, then : this space must be open AND belong to this region. Otherwise, this is an immediate failure !
				p_listEventsToApply = p_solver.fillOpenGaps(p_listEventsToApply, x, y, ir);
				
				//Alert on region
				if (region.openSpaces.length == 4){
					p_listEventsToApply = p_solver.alertRegion(p_listEventsToApply,ir,SPACE.CLOSED,region.notPlacedYetClosed);			
				}
				
				// Test the non-adjacency of same shapes + affect a shape to the region
				shape = p_solver.shapeArray[y][x];
				if (shape != LITS.UNDECIDED) {
					p_listEventsToApply = p_solver.closeUpTo4NeighborsOrNotSameShapeWhileOpen(p_listEventsToApply, x, y, ir, shape);
					p_listEventsToApply.push(new ShapeRegionEvent(ir, shape));
				}
			}
		} else {
			const x = p_eventBeingApplied.x();
			const y = p_eventBeingApplied.y();
			const ir = p_solver.regionArray[y][x];
			// A shape event : if 2 spaces across borders are affected the same shape, if either of them is open, close the other one. 
			shape = p_eventBeingApplied.shape;
			if (p_solver.answerArray[y][x] == SPACE.OPEN) {
				p_listEventsToApply = p_solver.closeUpTo4NeighborsOrNotSameShapeWhileOpen(p_listEventsToApply, x, y, ir, shape);
				p_listEventsToApply.push(new ShapeRegionEvent(ir, shape));
			} else if ((p_solver.leftExists(x) && (p_solver.answerArray[y][x-1] == SPACE.OPEN) && p_solver.sameShapesNeighbors(x-1, y, ir, shape) ) ||
				(p_solver.upExists(y) && (p_solver.answerArray[y-1][x] == SPACE.OPEN) && p_solver.sameShapesNeighbors(x, y-1, ir, shape)) ||
				(p_solver.rightExists(x) && (p_solver.answerArray[y][x+1] == SPACE.OPEN) && p_solver.sameShapesNeighbors(x+1, y, ir, shape)) ||
				(p_solver.downExists(y) && (p_solver.answerArray[y+1][x] == SPACE.OPEN) && p_solver.sameShapesNeighbors(x, y+1, ir, shape)) || 
				p_solver.shapeArray[y][x] != shape) {
					 // Close this space in either of these cases : 
					 //-there was already a different shape in this space (famous event that never happened) (if the space was open it would already have been spotted in the application part and failed)
					 //-there is already an adjacent space that is accross a border, that is open, and with the same shape 
				p_listEventsToApply.push(new SpaceEvent(x, y, SPACE.CLOSED));
			}
		}
		return p_listEventsToApply;
	}
}

// States whether the p_x, p_y space is occupied or not.
SolverLITS.prototype.isOccupied = function (p_x,p_y) {
	return (this.answerArray[p_y][p_x] == SPACE.OPEN);
}

SolverLITS.prototype.isNotClosed = function (p_x,p_y) {
	return (this.answerArray[p_y][p_x] != SPACE.CLOSED);
}

// If (x1, x2) is occupied, add event (x3, x4). Then, if (x3, x4) is occupied, add event (x1, x2)
SolverLITS.prototype.duelOccupation = function (p_listEvents, p_x1, p_y1, p_x2, p_y2) {
	if (this.answerArray[p_y1][p_x1] == SPACE.OPEN) {
		p_listEvents.push(new SpaceEvent(p_x2, p_y2, SPACE.CLOSED));
	}
	if (this.answerArray[p_y2][p_x2] == SPACE.OPEN) {
		p_listEvents.push(new SpaceEvent(p_x1, p_y1, SPACE.CLOSED));
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
				p_listEvents.push(new SpaceEvent(p_x-1, p_y, SPACE.CLOSED));
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
				p_listEvents.push(new SpaceEvent(p_x+1, p_y, SPACE.CLOSED));
			} 
		}
	}
	return p_listEvents;
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
		if (this.answerArray[ya][xa] == SPACE.UNDECIDED){
			p_listEvents.push(new SpaceEvent(xa,ya,p_missingSymbol));
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

SolverLITS.prototype.fillOpenGapOrNot = function(p_listEventsToApply, p_x, p_y, p_DeltaX, p_DeltaY, p_indexRegion) {
	if ((this.regionArray[p_y + p_DeltaY * 2][p_x + p_DeltaX * 2] == p_indexRegion) && (this.answerArray[p_y + p_DeltaY * 2][p_x + p_DeltaX * 2] == SPACE.OPEN)) {
		p_listEventsToApply.push(new SpaceEvent(p_x + p_DeltaX ,p_y + p_DeltaY ,SPACE.OPEN));
	}
	return p_listEventsToApply;
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
		p_listEventsToApply.push(new SpaceEvent(p_xOther, p_yOther, SPACE.CLOSED));
	}
	return p_listEventsToApply;
}

// Check if 2 spaces are affected same shape and are adjacent across borders (validity check already done)
SolverLITS.prototype.sameShapesNeighbors = function(p_xOther, p_yOther, p_ir, p_shape) {
	return (this.getRegionIndex(p_xOther, p_yOther) != p_ir) && (this.getShape(p_xOther, p_yOther) == p_shape);
}

// Abortion 
SolverLITS.prototype.cleanDeclarations3or4Open = function() {
	this.checker3or4Open.clean();
}

SolverLITS.prototype.cleanDeclarationsNewlyClosed = function() {
	this.checkerNewlyClosed.clean();
}

SolverLITS.prototype.cleanDeclarations1or2Open = function() {
	this.checker1or2Open.clean();
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
	this.cleanDeclarations3or4Open();
	return eventsList;
}

// When a region contains 4 open spaces
SolverLITS.prototype.eventsTetrominoIdentification = function(p_eventsList, p_indexRegion) {
	//var eventsList = []; //TODO erase these comments later, but somehow keep displayed the deltax and deltay.
	const firstSpace = getFirstLexicalOrderSpace(this.regions[p_indexRegion].openSpaces);
	const x1 = firstSpace.x;
	const y1 = firstSpace.y;
	var shape = LITS.UNDECIDED;
	if (this.isOpenInRegionAtRight(x1+1, y1, p_indexRegion)) { //10
		if (this.isOpenInRegionAtRight(x1+2, y1, p_indexRegion)) { //10 20
			if (this.isOpenInRegionAtRight(x1+3, y1, p_indexRegion)) {
				shape = LITS.I;//eventsList.push(new ShapeRegionEvent(p_indexRegion, LITS.L));//eventsList = shape4(x1, y1, 1, 0, 2, 0, 3, 0, LITS.I);
			} else if (y1 <= this.yLength-2) {
				if (this.isOpenInRegion(x1+2, y1+1, p_indexRegion)) {
					shape = LITS.L;//eventsList = shape4(x1, y1, 1, 0, 2, 0, 2, 1, LITS.L);
				} else if (this.isOpenInRegion(x1+1, y1+1, p_indexRegion)) {
					shape = LITS.T;//eventsList = shape4(x1, y1, 1, 0, 2, 0, 1, 1, LITS.T);
				} else if (this.isOpenInRegion(x1, y1+1, p_indexRegion)) {
					shape = LITS.L;//eventsList = shape4(x1, y1, 1, 0, 2, 0, 0, 1, LITS.L);
				} 
			}
		} else if (this.isOpenInRegionAtDown(x1+1, y1+1, p_indexRegion)) { //10 11
			if (this.isOpenInRegionAtRight(x1+2, y1+1, p_indexRegion)) {
				shape = LITS.S;//eventsList = shape4(x1, y1, 1, 0, 1, 1, 2, 1, LITS.S);
			} else if (this.isOpenInRegionAtDown(x1+1, y1+2, p_indexRegion)) {
				shape = LITS.L;//eventsList = shape4(x1, y1, 1, 0, 1, 1, 1, 2, LITS.L);
			} 
		} else if (this.isOpenInRegionAtDown(x1, y1+1, p_indexRegion)) {// 10 01
			if (this.isOpenInRegionAtDown(x1, y1+2, p_indexRegion)) {
				shape = LITS.L;//eventsList = shape4(x1, y1, 1, 0, 0, 1, 0, 2, LITS.L);
			} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) {
				shape = LITS.S;//eventsList = shape4(x1, y1, 1, 0, 0, 1, -1, 1, LITS.S);
			}
		}
	} else if (this.isOpenInRegionAtDown(x1, y1+1, p_indexRegion)) { // 01
		if (this.isOpenInRegionAtRight(x1+1, y1+1, p_indexRegion)) { // 01 11
			if (this.isOpenInRegionAtRight(x1+2, y1+1, p_indexRegion)) {
				shape = LITS.L;//eventsList = shape4(x1, y1, 0, 1, 1, 1, 2, 1, LITS.L);
			} else if (this.isOpenInRegionAtDown(x1+1, y1+2, p_indexRegion)) { //TODO factoriser avec ci-dessous
				shape = LITS.S;//eventsList = shape4(x1, y1, 0, 1, 1, 1, 1, 2, LITS.S);
			} else if (this.isOpenInRegionAtDown(x1, y1+2, p_indexRegion)) {
				shape = LITS.T;//eventsList = shape4(x1, y1, 0, 1, 1, 1, 0, 2, LITS.T);
			} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) {
				shape = LITS.T;//eventsList = shape4(x1, y1, 0, 1, 1, 1, -1, 1, LITS.T);
			}
		} else if (this.isOpenInRegionAtDown(x1, y1+2, p_indexRegion)) { // 01 02
			if (this.isOpenInRegionAtRight(x1+1, y1+2, p_indexRegion)) {
				shape = LITS.L;//eventsList = shape4(x1, y1, 0, 1, 0, 2, 1, 2, LITS.L);
			} else if (this.isOpenInRegionAtDown(x1, y1+3, p_indexRegion)) {
				shape = LITS.I;//eventsList = shape4(x1, y1, 0, 1, 0, 2, 0, 3, LITS.I);
			} else if (this.isOpenInRegionAtLeft(x1-1, y1+2, p_indexRegion)) { // TODO factoriser avec ci-dessous
				shape = LITS.L;//eventsList = shape4(x1, y1, 0, 1, 0, 2, -1, 2, LITS.L);
			}  else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) {
				shape = LITS.T;//eventsList = shape4(x1, y1, 0, 1, 0, 2, -1, 1, LITS.T);
			}
		} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) { // 01 -11 
			if (this.isOpenInRegionAtDown(x1-1, y1+2, p_indexRegion)) {
				shape = LITS.S;//eventsList = shape4(x1, y1, 0, 1, -1, 1, -1, 2, LITS.S);
			} else if (this.isOpenInRegionAtLeft(x1-2, y1+1, p_indexRegion)) {
				shape = LITS.L;//eventsList = shape4(x1, y1, 0, 1, -1, 1, -2, 1, LITS.L);
			}
		}
	}
	
	/*if (eventsList.length == 0) {
		return EVENT_RESULT.FAILURE;
	}
	else {
		Array.prototype.push.apply(p_eventsList, eventsList);
		return p_eventsList;
	}*/
	
	if (shape == LITS.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	} else {
		p_eventsList.push(new ShapeRegionEvent(p_indexRegion, shape));
		return p_eventsList;
	}
}

/*// Fills a region with the 4 spaces below
//SolverLITS.prototype.shape4 = function(p_indexRegion, p_shape) {
	 eventList = [];
	eventList.push(new ShapeEvent(p_x1, p_y1, p_form));
	eventList.push(new ShapeEvent(p_x1 + p_DeltaX1, p_y1 + p_DeltaY1, p_form));
	eventList.push(new ShapeEvent(p_x1 + p_DeltaX2, p_y1 + p_DeltaY2, p_form));
	eventList.push(new ShapeEvent(p_x1 + p_DeltaX3, p_y1 + p_DeltaY3, p_form));
	return eventList; 
	//return [new ShapeRegionEvent(p_indexRegion, p_shape)];
	
//}*/

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
const arrayOfEventsBy3SpaceConfig = [
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

const arrayOfSpaceDeltasBy3SpaceConfig = [ // List of space-deltas of spaces 2 and 3 from the first space of the config to obtain all the 3-space configs 
[],
[spaceDelta_10, spaceDelta_20],
[spaceDelta_01, spaceDelta_02],
[spaceDelta_10, spaceDelta_01],
[spaceDelta_10, spaceDelta_11],
[spaceDelta_M1, spaceDelta_01],
[spaceDelta_01, spaceDelta_11],
[spaceDelta_11, spaceDelta_21],
[spaceDelta_11, spaceDelta_12],
[spaceDelta_M1, spaceDelta_M2],
[spaceDelta_M1, spaceDelta_MM1],
[spaceDelta_10, spaceDelta_21],
[spaceDelta_01, spaceDelta_12],
[spaceDelta_01, spaceDelta_M2],
[spaceDelta_10, spaceDelta_M1]
];

/**
3 spaces are open - deduce events from it, e.g. placing shapes L,I,T,S for the 4th missing spaces. Also, if there is only one possible new space, make it open (the "4th deduction" will clear the work) and if there are at least 2 deductions with all the same shape, affect shapes to all 3 open spaces.
p_ix, p_iy : origin space (1st in lexical order), p_ir : region index,
p_identifiant : identifiant of the triplet of spaces. See text doc for list of shapes.
*/ 
SolverLITS.prototype.shapeFrom3Open = function(p_eventsList, p_x, p_y, p_ir, p_identifiant) {
	const eventsByConfig = arrayOfEventsBy3SpaceConfig[p_identifiant];
	
	const startingEventsLength = p_eventsList.length;
	var currentEventsLength = p_eventsList.length;
	p_eventsList = this.pushShapeEventsDelta(p_eventsList, p_x, p_y, p_ir, eventsByConfig[0], LITS.L);
	const noLFound = (p_eventsList.length == currentEventsLength);
	
	currentEventsLength = p_eventsList.length;
	p_eventsList = this.pushShapeEventsDelta(p_eventsList, p_x, p_y, p_ir, eventsByConfig[1], LITS.I);
	const noIFound = (p_eventsList.length == currentEventsLength);
	
	currentEventsLength = p_eventsList.length;
	p_eventsList = this.pushShapeEventsDelta(p_eventsList, p_x, p_y, p_ir, eventsByConfig[2], LITS.T);
	const noTFound = (p_eventsList.length == currentEventsLength);
	
	currentEventsLength = p_eventsList.length;
	p_eventsList = this.pushShapeEventsDelta(p_eventsList, p_x, p_y, p_ir, eventsByConfig[3], LITS.S);
	const noSFound = (p_eventsList.length == currentEventsLength);
	
	if (p_eventsList.length == startingEventsLength + 1) {
		// Only one event ! That means only one possibility of 4th open space ! 
		const onlyShapeEvent = p_eventsList[p_eventsList.length-1];
		p_eventsList.push(new SpaceEvent(onlyShapeEvent.coorX, onlyShapeEvent.coorY, SPACE.OPEN));
	} else if (noLFound && noIFound && noTFound) { //If only one shape is possible, place it in all 3 open spaces. If no shape is possible, failure.
		if (noSFound) {
			return EVENT_RESULT.FAILURE;
		} else {
			p_eventsList = this.affectShapes(p_eventsList, p_x, p_y, p_identifiant, LITS.S);
		}
	} else if (noSFound) {
		if (noLFound) {
			if (noIFound) {
				p_eventsList = this.affectShapes(p_eventsList, p_x, p_y, p_identifiant, LITS.T);
			} else if (noTFound) {
				p_eventsList = this.affectShapes(p_eventsList, p_x, p_y, p_identifiant, LITS.I);
			}
		} else if (noIFound && noTFound) {
			p_eventsList = this.affectShapes(p_eventsList, p_x, p_y, p_identifiant, LITS.L);
		}
	}

	return p_eventsList;
}

// TODO peut-on avoir un cas de figure où 2 cases peuvent être ouvertes, dans la même région, et avec des formes différentes ? Peut-être ai-je déjà traité ce cas de figure dans les déductions mais j'ai la flemme de vérifier...
// Add shape-affectation events where it can be useful among the "potential spaces" (e.g. not on closed spaces for instance)
SolverLITS.prototype.pushShapeEventsDelta = function (p_eventsList, p_x, p_y, p_ir, p_spaceDeltas, p_shape) {
	p_spaceDeltas.forEach(delta => {
		const x = p_x + delta.x;
		const y = p_y + delta.y;
		if ((y >= 0) && (y < this.yLength) && (x >= 0) && (x < this.xLength) && (this.regionArray[y][x] == p_ir) && (this.answerArray[y][x] != SPACE.CLOSED)) {
			p_eventsList.push(new ShapeEvent(x, y, p_shape));
		}
	});
	return p_eventsList;
}


SolverLITS.prototype.isOpenInRegion = function(p_x, p_y, p_ir) {
	return (this.answerArray[p_y][p_x] == SPACE.OPEN) && (this.regionArray[p_y][p_x] == p_ir);
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

// Fills all 3 spaces (one at x,y, the other 2 given by the "array of deltas by 3-spaces config") with shapes. Precondition : the 3 spaces are already open.
SolverLITS.prototype.affectShapes = function(p_eventsList, p_x, p_y, p_config, p_shape) {
	const spaceDeltas = arrayOfSpaceDeltasBy3SpaceConfig[p_config];
	p_eventsList.push(new ShapeEvent(p_x, p_y, p_shape));
	p_eventsList.push(new ShapeEvent(p_x+spaceDeltas[0].x, p_y+spaceDeltas[0].y, p_shape));
	p_eventsList.push(new ShapeEvent(p_x+spaceDeltas[1].x, p_y+spaceDeltas[1].y, p_shape));
	return p_eventsList;
}

// ---
// Second filter, a far easier-to-understand one :
// Detects clusters in regions of size < 4 and does nothing else ! (the pass will do the job (TM))
// checkClusterInRegion is used only in this function and the descending ones and is always cleaned before it returns, hence no cleans outside.
SolverLITS.prototype.applyDeclarationsNewlyClosed = function() {
	var listEvents = [];
	var x, y, ir; // TODO : we detect non-closed in-region clusters in their whole, so we can plan to do something about clusters with open spaces
	this.checkerNewlyClosed.list.forEach(space => {
		x = space.x;
		y = space.y;
		ir = this.regionArray[y][x];
		if (this.leftExists(x)) {
			listEvents = this.getNotClosedClusterInRegionAndCloseIfTooSmall(listEvents, x-1, y, ir);
		}
		if (this.upExists(y)) {
			listEvents = this.getNotClosedClusterInRegionAndCloseIfTooSmall(listEvents, x, y-1, ir);
		}
		if (this.rightExists(x)) {
			listEvents = this.getNotClosedClusterInRegionAndCloseIfTooSmall(listEvents, x+1, y, ir);
		}
		if (this.downExists(y)) {
			listEvents = this.getNotClosedClusterInRegionAndCloseIfTooSmall(listEvents, x, y+1, ir);
		}
	});
	this.checkClusterInRegion.clean();
	this.cleanDeclarationsNewlyClosed();
	return listEvents;
}

// Starting from p_x, p_y, tests if the space is not closed, has its "non-closed cluster in region" (checkClusterInRegion) not formed yet and forms it.
// Also adds closing events if a cluster is too small.
SolverLITS.prototype.getNotClosedClusterInRegionAndCloseIfTooSmall = function(p_listEvents, p_x, p_y, p_ir) {
	var spacesInCluster = [];
	if ((this.regionArray[p_y][p_x] == p_ir) && (this.isNotClosed(p_x, p_y))) {
		if (this.checkClusterInRegion.add(p_x, p_y)) {
			var spacesToCheck = [{x : p_x, y : p_y}];
			var x, y;
			while (spacesToCheck.length > 0) { 
				spaceChecked = spacesToCheck.pop();
				x = spaceChecked.x;
				y = spaceChecked.y;
				spacesInCluster.push({x : x, y : y});
				
				if (this.leftExists(x)) {
					spacesToCheck = this.checkNotAddedNotClosedInRegion(spacesToCheck, x-1, y, p_ir);
				}
				if (this.upExists(y)) {
					spacesToCheck = this.checkNotAddedNotClosedInRegion(spacesToCheck, x, y-1, p_ir);
				}
				if (this.rightExists(x)) {
					spacesToCheck = this.checkNotAddedNotClosedInRegion(spacesToCheck, x+1, y, p_ir);
				}
				if (this.downExists(y)) {
					spacesToCheck = this.checkNotAddedNotClosedInRegion(spacesToCheck, x, y+1, p_ir);
				}
			}
		}
	}
	
	if (spacesInCluster.length < 4) {
		spacesInCluster.forEach(space => {
			p_listEvents.push(new SpaceEvent(space.x, space.y, SPACE.CLOSED));
		});
	}
	return p_listEvents;
}

SolverLITS.prototype.checkNotAddedNotClosedInRegion = function (p_spacesToCheck, p_xx, p_yy, p_indexRegion) {
	if ((this.regionArray[p_yy][p_xx] == p_indexRegion) && this.isNotClosed(p_xx, p_yy)) {
		if (this.checkClusterInRegion.add(p_xx, p_yy)) {
			p_spacesToCheck.push({x : p_xx, y : p_yy});
		}
	}
	return p_spacesToCheck;
}

// Filters for distance (initially in deductions)

// Plan events to discard any space that is too far away (distance > 3) or separated by closed spaces : once the 1st space in a region is set open, all those that are too far away won't be legally set open.
					// If an open space is in a too small non-closed cluster, this leads to a situation where there are spaces left to reach the number of 4 and open-set events are planned on those same spaces : imminent failure, and everything will be undone.
SolverLITS.prototype.applyDeclarations1or2Open = function() {
	var eventsToApply = [];
	var region;
	this.checker1or2Open.list.forEach(ir => {
		region = this.regions[ir];
		if (region.notPlacedYetClosed > 0) {
			region.openSpaces.forEach(space => {
				eventsToApply = this.discriminateUnreachable(eventsToApply, space.x, space.y, ir);
			});
		}
	});
	this.cleanDeclarations1or2Open();
	return eventsToApply;
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
			p_listEvents.push(new SpaceEvent(x, y, SPACE.CLOSED));
		} else {
			this.proximitiesGrid[y][x] = -1;	
		}
	});
	return p_listEvents;
}

// Test to propagate or not a space in a direction (left, up, right, down), whose coordinates have been passed by the above method
// By the way, no check for values of p_xx and p_yy as it is done above.
SolverLITS.prototype.updateSpacesToPropagate = function (p_listSpacesToPropagate, p_xx, p_yy, p_indexRegion, p_originalProximity){
	if ((this.regionArray[p_yy][p_xx] == p_indexRegion) && this.isNotClosed(p_xx,p_yy) && (this.proximitiesGrid[p_yy][p_xx] < p_originalProximity-1)) {
		this.proximitiesGrid[p_yy][p_xx] = p_originalProximity-1;
		p_listSpacesToPropagate.push({x : p_xx, y : p_yy});
	}
	return p_listSpacesToPropagate;
}

// -------------------------------------------------
// Extra closures
abortClosure = function(p_solver) {
	return function() {
		p_solver.cleanDeclarations3or4Open();
		p_solver.cleanDeclarationsNewlyClosed();
		p_solver.cleanDeclarations1or2Open();
	}
}

filterClosure3or4Open = function(p_solver) {
	return function() {
		return p_solver.applyDeclarations3or4open();
	}
}

filterClosureNewlyClosed = function(p_solver) {
	return function() {
		return p_solver.applyDeclarationsNewlyClosed();
	}
}

filterClosure1or2Open = function(p_solver) {
	return function() {
		return p_solver.applyDeclarations1or2Open();
	}
}

// -------------------------------------------------
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
		if (this.answerArray[space.y][space.x] == SPACE.UNDECIDED) { // It would still be correct, albeit useless, to pass already filled spaces
			eventList.push([new SpaceEvent(space.x, space.y, SPACE.OPEN), new SpaceEvent(space.x, space.y, SPACE.CLOSED)]);
		}			 
	});
	return eventList;
}


copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	// Event kind
	const kind1 = (isShapeRegionEvent(p_event1) ? 0 : (isSpaceEvent(p_event1) ? 1 : 2));
	const kind2 = (isShapeRegionEvent(p_event2) ? 0 : (isSpaceEvent(p_event2) ? 1 : 2));
	if (kind1 != kind2) {
		return kind1 - kind2;
	}
	if (kind1 == 0) { // Both events are shapeRegion
		if (p_event1.region < p_event2.region) {
			return -1;
		} else if (p_event1.region > p_event2.region) {
			return 1;
		} else {
			return p_event1.shape - p_event2.shape;
		}
	}
	// Events are identical and not shapeRegion
	if (p_event2.coorY > p_event1.coorY) {
		return -1;
	} else if (p_event2.coorY < p_event1.coorY) {
		return 1;
	} else if (p_event2.coorX > p_event1.coorX) {
		return -1;
	} else if (p_event2.coorX < p_event1.coorX) {
		return 1;
	} else {
		if (kind1 == 2) {
			return p_event1.shape - p_event2.shape; // Unstable : works because "shape" values are numbers
		} else {
			var c1 = (p_event1.symbol == SPACE.OPEN ? 1 : 0);
			var c2 = (p_event2.symbol == SPACE.OPEN ? 1 : 0); // Unstable : works because only "O" and "C" values are admitted
			return c1-c2;
		}
	}
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var indexList = [];
		var values = [];
		for (var i = 0; i < p_solver.regions.length ; i++) {
			if (p_solver.regions[i].openSpaces.length < 4) {	
				indexList.push(i); 
				values.push(p_solver.uncertainity(i));
			} else {
				values.push(-1); // There MUST be one of these per region.
			}
		}
		indexList.sort(function(p_i1, p_i2) {
			return values[p_i1]-values[p_i2];
		});
		return indexList;
	}
}

// Les problèmes que j'ai pu rencontrer ne venaient pas de l'algorithme "passEvents" mais bel et bien des méthodes de comparaison et de copie (enfin surtout de comparaison). D'abord ne pas penser à comparer les "O" et "X" alors que c'était vital (on teste un évènement O et un évènement X qui ne peuvent être intersectés), et finalement ne plus penser à comparer les x. Oups...

SolverLITS.prototype.uncertainity = function(p_ir) {
	return this.regions[p_ir].notPlacedYetClosed - 3*this.regions[p_ir].openSpaces.length;
}

skipPassClosure = function(p_solver) {
	return function (p_indexRegion) {
		return p_solver.uncertainity(p_indexRegion) > 0; // Arbitrary value
	}
}