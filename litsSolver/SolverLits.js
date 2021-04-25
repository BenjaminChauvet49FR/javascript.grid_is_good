// Setup

function SolverLITS(p_wallArray) {
	GeneralSolver.call(this);
	this.construct(p_wallArray);
}

// Credits about heritage : https://developer.mozilla.org/fr/docs/Learn/JavaScript/Objects/Heritage

SolverLITS.prototype = Object.create(GeneralSolver.prototype);
SolverLITS.prototype.constructor = SolverLITS;

function DummySolver() {
	return new SolverLITS(generateWallArray(1, 1));
}

SolverLITS.prototype.construct = function(p_wallArray) {
	this.generalConstruct();
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.makeItGeographical(this.xLength, this.yLength);
	this.methodsSetDeductions = new ApplyEventMethodGeographicalPack( 
		applyEventClosure(this),
		deductionsClosure(this),
		adjacencyClosure(this),
		transformClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetMultiPass = {
		generatePassEventsMethod : generateEventsForRegionPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		skipPassMethod : skipPassClosure(this)
	};
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterClosure3or4Open(this), filterClosureNewlyClosed(this), filterClosure1or2Open(this)]);
	this.methodsSetPass = {comparisonMethod : comparison, copyMethod : copying}; // Warning : the argumentToLabelMethod is defined right before the pass in this solver

	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();
	var ix,iy;
	var lastRegionNumber = 0;
	// Below fields are for adjacency "all spaces with ... must form a orthogonally contiguous area"
	this.atLeastOneOpen = false;
	this.adjacencyLimitGrid = createAdjacencyLimitGrid(this.xLength, this.yLength);
    this.adjacencyLimitSpacesList = [];
	this.answerArray = generateValueArray(this.xLength, this.yLength, ADJACENCY.UNDECIDED);
	this.shapeArray = generateValueArray(this.xLength, this.yLength, LITS.UNDECIDED);
	this.proximitiesArray = generateValueArray(this.xLength, this.yLength, -1); // For checking distance of spaces in deductions
	const spacesByRegion = listSpacesByRegion(this.regionArray);
	this.regionsNumber = spacesByRegion.length;
	
	// Initialize data of regions
	var ir;
	this.regions = [];
	for(ir=0 ; ir < this.regionsNumber ; ir++) {
		this.regions.push({
			spaces : spacesByRegion[ir],
			neighborSpaces : [],
			openSpaces : [], // List of open spaces.
			size : spacesByRegion[ir].length,
			shape : LITS.UNDECIDED
		});
	}
	
	this.checker3or4Open = new CheckCollection(this.regionsNumber);
	this.checker1or2Open = new CheckCollection(this.regionsNumber);
	this.checkerNewlyClosed = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	
	this.checkClusterInRegion = new CheckCollectionDoubleEntry(this.xLength, this.yLength); // Only used in applyDeclarations1or2Open
	// Now that region data are created : 
	// Initialize spaces by region +  purify grid (the purification didn't occur earlier because 1) I decided to work on purification much after I built this space first, 2) because of this I already put everything for other arrays (shapeArray, proximitiesArray...)
	var region;
	for(iy = 0;iy < this.yLength;iy++) {
		for(ix = 0;ix < this.xLength;ix++) {
			if (this.regionArray[iy][ix] == WALLGRID.OUT_OF_REGIONS) { 
				this.addBannedSpace(ix, iy);
				this.answerArray[iy][ix] = ADJACENCY.NO;
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
		region.notPlacedYetClosed = region.size - 4;
		// No "notPlacedYet.OPENs" and "notPlacedYet.CLOSEDs" this time but a single variable instead because : 1) the OPENs is unneccessary, since it is always equal to 4-openSpaces.length (openSpaces added quite lately), 2) in LITS each region must have a check on remaining closed or open spaces, it is not optional for a region like in Heyawake.
		region.spaces.forEach(space => {
			x = space.x;
			y = space.y;
			KnownDirections.forEach(dir => {
				if (this.neighborExists(x, y, dir)) {
					dx = x + DeltaX[dir];
					dy = y + DeltaY[dir];
					if ((addedSpacesNeighborToRegion.add(dx, dy)) && (!this.isBanned(dx, dy)) && ((this.getRegionIndex(dx, dy) != ir))) {
						region.neighborSpaces.push({x : dx, y : dy});
					}
				}
			});
		});
		addedSpacesNeighborToRegion.clean();
	}
}

//--------------------------------

// Misc methods (may be used for drawing and intelligence)
SolverLITS.prototype.getAnswer = function(p_x, p_y) {
	return this.answerArray[p_y][p_x];
}

SolverLITS.prototype.getShape = function(p_x, p_y) {
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
		if (region.size == 4) {
			for (var i = 0; i <= 3 ; i++) {
				this.tryToPutNew(region.spaces[i].x, region.spaces[i].y, ADJACENCY.YES);
			}
		};
	});
	this.terminateQuickStart();
}

SolverLITS.prototype.passRegionAndAdjacentSpaces = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.regions[p_indexRegion].neighborSpaces.forEach(space => {
		if (this.answerArray[space.y][space.x] == ADJACENCY.UNDECIDED) { // It would still be correct, albeit useless, to pass already filled spaces
			generatedEvents.push([new SpaceEvent(space.x, space.y, ADJACENCY.YES), new SpaceEvent(space.x, space.y, ADJACENCY.NO)]);
		}	
	});
	this.passEvents(generatedEvents, this.methodsSetDeductions, this.methodsSetPass, p_indexRegion); 
}

SolverLITS.prototype.passRegion = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.methodsSetPass.argumentToLabelMethod = namingRegionClosure(this);
	this.passEvents(generatedEvents, this.methodsSetDeductions, this.methodsSetPass, p_indexRegion); 
}

SolverLITS.prototype.makeMultiPass = function() {
	this.methodsSetPass.argumentToLabelMethod = namingRegionClosure(this);
	this.multiPass(this.methodsSetDeductions, this.methodsSetPass, this.methodsSetMultiPass);
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
	if (this.answerArray[p_y][p_x] == p_symbol) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[p_y][p_x] != ADJACENCY.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerArray[p_y][p_x] = p_symbol;
	var ir = this.regionArray[p_y][p_x];
	var region = this.regions[ir];
	if (p_symbol == ADJACENCY.YES){
		region.openSpaces.push({x : p_x, y : p_y});
	} else if (p_symbol == ADJACENCY.NO){
		region.notPlacedYetClosed--;
	}
	return EVENT_RESULT.SUCCESS;
}

SolverLITS.prototype.putShape = function(p_x, p_y, p_shape) {
	if ((this.answerArray[p_y][p_x] == ADJACENCY.NO) || (this.shapeArray[p_y][p_x] == p_shape)) { // this.answerArray added after.
		return EVENT_RESULT.HARMLESS;
	}
	if (this.shapeArray[p_y][p_x] != LITS.UNDECIDED) { // It's VERY important to recall the meaning of this grid. This is the grid of "if the space is open, then it should contain this shape" shapes, not the grid of "this space must absolutely contain this shape" ! Like this, it could lead to the region 8 in puzzle LITS54 having a L-related space (in pink as I write this) in its bottom-left corner (deductible by a specific pass) despite that space being impossible to open (deductible by another specific pass)
		if (this.answerArray[p_y][p_x] == ADJACENCY.YES) {
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
			p_solver.answerArray[y][x] = ADJACENCY.UNDECIDED;
			var ir = p_solver.regionArray[y][x];
			var region = p_solver.regions[ir];
			if (symbol == ADJACENCY.YES){
				region.openSpaces.pop(); // This "pop" suggests that events are always undone in the order reverse they were done.
			} else if (symbol == ADJACENCY.NO){
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
	this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_symbol), this.methodsSetDeductions);
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
					p_listEventsToApply.push(new SpaceEvent(x, y, ADJACENCY.NO));
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
			if (symbol == ADJACENCY.NO) {	
				p_solver.checkerNewlyClosed.add(x, y);
				//Alert on region
				if (region.notPlacedYetClosed == 0) {
					p_listEventsToApply = p_solver.alertRegion(p_listEventsToApply,ir,ADJACENCY.YES, 4-region.openSpaces.length);			
				}
				if (region.openSpaces.length == 3) { // Now that a space is closed, maybe something new is found in that region.
					p_solver.checker3or4Open.add(ir);
				}
			} else { // Space is open
				// Alert on 2x2 areas
				// p_listEventsToApply = p_solver.alert2x2Areas(p_listEventsToApply, x, y); //TODO Buuut... what if I don't want to bring the pack with me ?
				p_listEventsToApply = p_solver.alert2x2Areas(p_listEventsToApply, p_solver.methodsSetDeductions, x, y); 
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
					p_listEventsToApply = p_solver.alertRegion(p_listEventsToApply,ir,ADJACENCY.NO,region.notPlacedYetClosed);			
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
			if (p_solver.answerArray[y][x] == ADJACENCY.YES) {
				p_listEventsToApply = p_solver.closeUpTo4NeighborsOrNotSameShapeWhileOpen(p_listEventsToApply, x, y, ir, shape);
				p_listEventsToApply.push(new ShapeRegionEvent(ir, shape));
			} else {
				var ok = true;
				KnownDirections.forEach(dir => {
					ok &= (p_solver.neighborExists(x, y, dir)) && (p_solver.answerArray[y + DeltaY[dir]][x + DeltaX[dir]] == ADJACENCY.YES) && p_solver.sameShapesNeighbors(x + DeltaX[dir], y + DeltaY[dir]);
				});
				if (ok) {
					p_listEventsToApply.push(new SpaceEvent(x, y, ADJACENCY.NO));
				}
			}
		}
		return p_listEventsToApply;
	}
}

SolverLITS.prototype.isNotClosed = function (p_x,p_y) {
	return (this.answerArray[p_y][p_x] != ADJACENCY.NO);
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
		if (this.answerArray[ya][xa] == ADJACENCY.UNDECIDED){
			p_listEvents.push(new SpaceEvent(xa, ya, p_missingSymbol));
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
	KnownDirections.forEach (dir => {
		if (this.distantNeighborExists(p_x, p_y, 2, dir) && 
		(this.regionArray[p_y + DeltaY[dir] * 2][p_x + DeltaX[dir] * 2] == p_ir) && 
		(this.answerArray[p_y + DeltaY[dir] * 2][p_x + DeltaX[dir] * 2] == ADJACENCY.YES)) {
			p_listEventsToApply.push(new SpaceEvent(p_x + DeltaX[dir] ,p_y + DeltaY[dir] ,ADJACENCY.YES));
		}
	});
	return p_listEventsToApply;
}

// Potentially close all 4 spaces (but not the space itself) as the space p_x, p_y is open
SolverLITS.prototype.closeUpTo4NeighborsOrNotSameShapeWhileOpen = function (p_listEventsToApply, p_x, p_y, p_ir, p_shape) {
	KnownDirections.forEach(dir => {
		if (this.neighborExists(p_x, p_y, dir)) {
			p_listEventsToApply = this.closeNeighborSpaceOrNotSameShape(p_listEventsToApply, p_x + DeltaX[dir], p_y + DeltaY[dir], p_ir, p_shape);
		}
	});
	return p_listEventsToApply;
}

// Close adjacent space if it is "same shape across region border" (the "home" space is known to be open)
SolverLITS.prototype.closeNeighborSpaceOrNotSameShape = function (p_listEventsToApply, p_xOther, p_yOther, p_ir, p_shape) {
	if (this.sameShapesNeighbors(p_xOther, p_yOther, p_ir, p_shape)) {
		p_listEventsToApply.push(new SpaceEvent(p_xOther, p_yOther, ADJACENCY.NO));
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
				shape = LITS.I; //eventsList = shape4(x1, y1, 1, 0, 2, 0, 3, 0, LITS.I);
			} else if (y1 <= this.yLength-2) {
				if (this.isOpenInRegion(x1+2, y1+1, p_indexRegion)) {
					shape = LITS.L; //eventsList = shape4(x1, y1, 1, 0, 2, 0, 2, 1, LITS.L);
				} else if (this.isOpenInRegion(x1+1, y1+1, p_indexRegion)) {
					shape = LITS.T; //eventsList = shape4(x1, y1, 1, 0, 2, 0, 1, 1, LITS.T);
				} else if (this.isOpenInRegion(x1, y1+1, p_indexRegion)) {
					shape = LITS.L; //eventsList = shape4(x1, y1, 1, 0, 2, 0, 0, 1, LITS.L);
				} 
			}
		} else if (this.isOpenInRegionAtDown(x1+1, y1+1, p_indexRegion)) { //10 11
			if (this.isOpenInRegionAtRight(x1+2, y1+1, p_indexRegion)) {
				shape = LITS.S; //eventsList = shape4(x1, y1, 1, 0, 1, 1, 2, 1, LITS.S);
			} else if (this.isOpenInRegionAtDown(x1+1, y1+2, p_indexRegion)) {
				shape = LITS.L; //eventsList = shape4(x1, y1, 1, 0, 1, 1, 1, 2, LITS.L);
			} 
		} else if (this.isOpenInRegionAtDown(x1, y1+1, p_indexRegion)) {// 10 01
			if (this.isOpenInRegionAtDown(x1, y1+2, p_indexRegion)) {
				shape = LITS.L; //eventsList = shape4(x1, y1, 1, 0, 0, 1, 0, 2, LITS.L);
			} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) {
				shape = LITS.S; //eventsList = shape4(x1, y1, 1, 0, 0, 1, -1, 1, LITS.S);
			}
		}
	} else if (this.isOpenInRegionAtDown(x1, y1+1, p_indexRegion)) { // 01
		if (this.isOpenInRegionAtRight(x1+1, y1+1, p_indexRegion)) { // 01 11
			if (this.isOpenInRegionAtRight(x1+2, y1+1, p_indexRegion)) {
				shape = LITS.L; //eventsList = shape4(x1, y1, 0, 1, 1, 1, 2, 1, LITS.L);
			} else if (this.isOpenInRegionAtDown(x1+1, y1+2, p_indexRegion)) { //TODO factoriser avec ci-dessous
				shape = LITS.S; //eventsList = shape4(x1, y1, 0, 1, 1, 1, 1, 2, LITS.S);
			} else if (this.isOpenInRegionAtDown(x1, y1+2, p_indexRegion)) {
				shape = LITS.T; //eventsList = shape4(x1, y1, 0, 1, 1, 1, 0, 2, LITS.T);
			} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) {
				shape = LITS.T; //eventsList = shape4(x1, y1, 0, 1, 1, 1, -1, 1, LITS.T);
			}
		} else if (this.isOpenInRegionAtDown(x1, y1+2, p_indexRegion)) { // 01 02
			if (this.isOpenInRegionAtRight(x1+1, y1+2, p_indexRegion)) {
				shape = LITS.L; //eventsList = shape4(x1, y1, 0, 1, 0, 2, 1, 2, LITS.L);
			} else if (this.isOpenInRegionAtDown(x1, y1+3, p_indexRegion)) {
				shape = LITS.I; //eventsList = shape4(x1, y1, 0, 1, 0, 2, 0, 3, LITS.I);
			} else if (this.isOpenInRegionAtLeft(x1-1, y1+2, p_indexRegion)) { // TODO factoriser avec ci-dessous
				shape = LITS.L; //eventsList = shape4(x1, y1, 0, 1, 0, 2, -1, 2, LITS.L);
			}  else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) {
				shape = LITS.T; //eventsList = shape4(x1, y1, 0, 1, 0, 2, -1, 1, LITS.T);
			}
		} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) { // 01 -11 
			if (this.isOpenInRegionAtDown(x1-1, y1+2, p_indexRegion)) {
				shape = LITS.S; //eventsList = shape4(x1, y1, 0, 1, -1, 1, -1, 2, LITS.S);
			} else if (this.isOpenInRegionAtLeft(x1-2, y1+1, p_indexRegion)) {
				shape = LITS.L; //eventsList = shape4(x1, y1, 0, 1, -1, 1, -2, 1, LITS.L);
			}
		}
	}
	
	if (shape == LITS.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	} else {
		p_eventsList.push(new ShapeRegionEvent(p_indexRegion, shape));
		return p_eventsList;
	}
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
		p_eventsList.push(new SpaceEvent(onlyShapeEvent.coorX, onlyShapeEvent.coorY, ADJACENCY.YES));
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
		if ((y >= 0) && (y < this.yLength) && (x >= 0) && (x < this.xLength) && (this.regionArray[y][x] == p_ir) && (this.answerArray[y][x] != ADJACENCY.NO)) {
			p_eventsList.push(new ShapeEvent(x, y, p_shape));
		}
	});
	return p_eventsList;
}

// Tests if the space coordinates are valid and contain a space open in region (even "atLeft, atRight..." test for (p_x, p_y) and not (p_x-1, p_y) nor (p_x+1, p_y) )
SolverLITS.prototype.isOpenInRegion = function(p_x, p_y, p_ir) {
	return (this.answerArray[p_y][p_x] == ADJACENCY.YES) && (this.regionArray[p_y][p_x] == p_ir);
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
	return (p_y <= this.yLength-1) && (this.isOpenInRegionAtRight(p_x, p_y, p_ir));
}

SolverLITS.prototype.isOpenInRegionAtDownLeft = function(p_x, p_y, p_ir) {
	return (p_y <= this.yLength-1) && (this.isOpenInRegionAtLeft(p_x, p_y, p_ir));
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
		KnownDirections.forEach(dir => {
			if (this.neighborExists(x, y, dir)) {
				listEvents = this.getNotClosedClusterInRegionAndCloseIfTooSmall(listEvents, x + DeltaX[dir], y + DeltaY[dir], ir);
			}
		});
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
				KnownDirections.forEach(dir => {
					if (this.neighborExists(x, y, dir)) {
						spacesToCheck = this.checkNotAddedNotClosedInRegion(spacesToCheck, x + DeltaX[dir], y + DeltaY[dir], p_ir);
					}
				});
			}
		}
	}
	
	if (spacesInCluster.length < 4) {
		spacesInCluster.forEach(space => {
			p_listEvents.push(new SpaceEvent(space.x, space.y, ADJACENCY.NO));
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
	this.proximitiesArray[p_y][p_x] = 3; // The central space is worth 3, then the proximities values will descend by one at each successive space, comparatively to lava flowing from a volcano...
	var spaceToPropagate;
	while (list_spacesToPropagate.length > 0) {
		// Propagate in each direction until all "non-closed spaces in the region that are close enough" have been visited
		spaceToPropagate = list_spacesToPropagate.pop();
		x = spaceToPropagate.x;
		y = spaceToPropagate.y;
		proximity = this.proximitiesArray[y][x];
		KnownDirections.forEach(dir => {
			if (this.neighborExists(x, y, dir)) {
				list_spacesToPropagate = this.updateSpacesToPropagate(list_spacesToPropagate, x + DeltaX[dir], y + DeltaY[dir], p_indexRegion, proximity);
			}
		});
	}
	
	// List events for non-visited spaces + clean visited spaces
	this.regions[p_indexRegion].spaces.forEach(space => {
		x = space.x;
		y = space.y;
		if (this.proximitiesArray[y][x] == -1) {
			p_listEvents.push(new SpaceEvent(x, y, ADJACENCY.NO));
		} else {
			this.proximitiesArray[y][x] = -1;	
		}
	});
	return p_listEvents;
}

// Test to propagate or not a space in a direction (left, up, right, down), whose coordinates have been passed by the above method
// By the way, no check for values of p_xx and p_yy as it is done above.
SolverLITS.prototype.updateSpacesToPropagate = function (p_listSpacesToPropagate, p_xx, p_yy, p_indexRegion, p_originalProximity){
	if ((this.regionArray[p_yy][p_xx] == p_indexRegion) && this.isNotClosed(p_xx,p_yy) && (this.proximitiesArray[p_yy][p_xx] < p_originalProximity-1)) {
		this.proximitiesArray[p_yy][p_xx] = p_originalProximity-1;
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
		if (this.answerArray[space.y][space.x] == ADJACENCY.UNDECIDED) { // It would still be correct, albeit useless, to pass already filled spaces
			eventList.push([new SpaceEvent(space.x, space.y, ADJACENCY.YES), new SpaceEvent(space.x, space.y, ADJACENCY.NO)]);
		}			 
	});
	return eventList;
}


copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	const kind1 = (isShapeRegionEvent(p_event1) ? 0 : (isSpaceEvent(p_event1) ? 1 : 2));
	const kind2 = (isShapeRegionEvent(p_event2) ? 0 : (isSpaceEvent(p_event2) ? 1 : 2));
	return commonComparisonMultiKinds([0, 1, 2], 
	[[p_event1.region, p_event1.shape], [p_event2.region, p_event2.shape], [p_event1.coorY, p_event1.coorX, p_event1.symbol], [p_event2.coorY, p_event2.coorX, p_event2.symbol], [p_event1.coorY, p_event1.coorX, p_event1.shape], [p_event2.coorY, p_event2.coorX, p_event2.shape]], kind1, kind2);
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