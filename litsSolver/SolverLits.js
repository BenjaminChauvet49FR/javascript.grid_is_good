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
	this.makeItGeographical(this.xLength, this.yLength, new ApplyEventMethodGeographicalPack( 
		applyEventClosure(this),
		deductionsClosure(this),
		adjacencyClosure(this),
		transformClosure(this),
		undoEventClosure(this)
	));
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForRegionPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		skipPassMethod : skipPassClosure(this)
	};
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterClosureNewlyOpen(this), filterClosureNewlyClosed(this)]);
	this.methodsSetPass = {comparisonMethod : comparison, copyMethod : copying}; // Warning : the argumentToLabelMethod is defined right before the pass in this solver
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}

	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();
	var ix,iy;
	var lastRegionNumber = 0;
	// Below fields are for adjacency "all spaces with ... must form a orthogonally contiguous area"
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
			shape : LITS.UNDECIDED,
			shapesSpaces : [[], [], [], []], // Forcing definition of LITS !
			shapesBanned : [false, false, false, false] // same
		});
	}
	
	this.checkerNewOpenRegions = new CheckCollection(this.regionsNumber);
	this.checkerNewlyClosed = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	
	this.checkClusterInRegion = new CheckCollectionDoubleEntry(this.xLength, this.yLength); // Only used in applyDeclarations1or2Open
	// Now that region data are created : 
	// Initialize spaces by region +  purify grid (the purification didn't occur earlier because 1) I decided to work on purification much after I built this space first, 2) because of this I already put everything for other arrays (shapeArray, proximitiesArray...)
	var region;
	for(iy = 0;iy < this.yLength;iy++) {
		for(ix = 0;ix < this.xLength;ix++) {
			if (this.regionArray[iy][ix] == WALLGRID.OUT_OF_REGIONS) { 
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
	this.declarationsOpenAndClosed();
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

SolverLITS.prototype.getFirstSpaceRegion = function(p_i) {
	return this.regions[p_i].spaces[0];
}

//--------------------------------
// Input methods

SolverLITS.prototype.emitHypothesis = function(p_x, p_y, p_symbol){
	this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_symbol));
}

SolverLITS.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverLITS.prototype.makeQuickStart = function() { 
	this.quickStart();
}

SolverLITS.prototype.passRegionAndAdjacentSpaces = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.regions[p_indexRegion].neighborSpaces.forEach(space => {
		if (this.answerArray[space.y][space.x] == ADJACENCY.UNDECIDED) { // It would still be correct, albeit useless, to pass already filled spaces
			generatedEvents.push([new SpaceEvent(space.x, space.y, ADJACENCY.YES), new SpaceEvent(space.x, space.y, ADJACENCY.NO)]);
		}	
	});
	this.passEvents(generatedEvents, p_indexRegion); 
}

SolverLITS.prototype.passRegion = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.methodsSetPass.argumentToLabelMethod = namingRegionClosure(this);
	this.passEvents(generatedEvents, p_indexRegion); 
}

SolverLITS.prototype.makeMultiPass = function() {
	this.methodsSetPass.argumentToLabelMethod = namingRegionClosure(this);
	this.multiPass(this.methodsSetMultipass);
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
		if (p_eventToApply.kind == KIND_EVENT.SHAPE) {
			return p_solver.putShape(p_eventToApply);
		}
		if (p_eventToApply.kind == KIND_EVENT.SHAPE_REGION) {
			return p_solver.putShapeRegion(p_eventToApply.region, p_eventToApply.shape);
		}
		if (p_eventToApply.kind == KIND_EVENT.SPACE) {
			return p_solver.putNew(p_eventToApply.x, p_eventToApply.y, p_eventToApply.symbol);
		} 
		return p_solver.banShapeRegion(p_eventToApply.region, p_eventToApply.shape);
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

SolverLITS.prototype.putShape = function(p_eventToApply) {
	const y = p_eventToApply.y;
	const x = p_eventToApply.x; 
	const shape = p_eventToApply.shape;
	
	if ((this.answerArray[y][x] == ADJACENCY.NO) || (this.shapeArray[y][x] == shape)) { // this.answerArray added after.
		return EVENT_RESULT.HARMLESS;
	}
	if (this.shapeArray[y][x] != LITS.UNDECIDED) { // It's VERY important to recall the meaning of this grid. This is the grid of "if the space is open, then it should contain this shape" shapes, not the grid of "this space must absolutely contain this shape" ! Like this, it could lead to the region 8 in puzzle LITS54 having a L-related space (in pink as I write this) in its bottom-left corner (deductible by a specific pass) despite that space being impossible to open (deductible by another specific pass)
		if (this.answerArray[y][x] == ADJACENCY.YES) {
			return EVENT_RESULT.FAILURE; // If this space is open (it is !) it should contain 2 different shapes. Hence the mistake...			
		} else {
			// If this space is open, it should contain 2 different shapes. Luckily it isn't. So you know what ? 
			// We'll pretend it was a closing event all along !
			p_eventToApply.evolveIntoSpaceEvent();
			this.answerArray[y][x] = ADJACENCY.NO;
			return EVENT_RESULT.SUCCESS;
		}
	}
	this.shapeArray[y][x] = shape;
	this.getRegion(x, y).shapesSpaces[shape].push({x : x, y : y});
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

SolverLITS.prototype.banShapeRegion = function(p_regionIndex, p_shape) {
	if (this.regions[p_regionIndex].shapesBanned[p_shape]) {
		return EVENT_RESULT.HARMLESS;
	}
	this.regions[p_regionIndex].shapesBanned[p_shape] = true;
	return EVENT_RESULT.SUCCESS;
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		if (p_eventToUndo.kind == KIND_EVENT.SPACE) {
			const x = p_eventToUndo.x;
			const y = p_eventToUndo.y;
			const symbol = p_eventToUndo.symbol;
			p_solver.answerArray[y][x] = ADJACENCY.UNDECIDED;
			var ir = p_solver.regionArray[y][x];
			var region = p_solver.regions[ir];
			if (symbol == ADJACENCY.YES){
				region.openSpaces.pop(); // This "pop" suggests that events are always undone in the order reverse they were done.
			} else if (symbol == ADJACENCY.NO){
				region.notPlacedYetClosed++;
			}
		} else if (p_eventToUndo.kind == KIND_EVENT.SHAPE_REGION) {
			p_solver.regions[p_eventToUndo.region].shape = LITS.UNDECIDED;
		} else if (p_eventToUndo.kind == KIND_EVENT.SHAPE) {
			p_solver.getRegion(p_eventToUndo.x, p_eventToUndo.y).shapesSpaces[p_eventToUndo.shape].pop();
			p_solver.shapeArray[p_eventToUndo.y][p_eventToUndo.x] = LITS.UNDECIDED;
		} else {
			p_solver.regions[p_eventToUndo.region].shapesBanned[p_eventToUndo.shape] = false;
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
		var listQSEvts = [{quickStartLabel : "LITS"}]
		p_solver.regions.forEach(region => {
			if (region.size == 4) {
				for (var i = 0; i <= 3 ; i++) {
					listQSEvts.push(new SpaceEvent(region.spaces[i].x, region.spaces[i].y, ADJACENCY.YES));
				}
			};
		});
		return listQSEvts;
	}
}

//--------------------------------
// Deductions

// Deductions closure. Where intelligence begins !
deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind == KIND_EVENT.SHAPE_REGION) {
			const shape = p_eventBeingApplied.shape;
			const ir = p_eventBeingApplied.region;
			// For each space, affect it a shape or close it
			var x, y, x2, y2, ir2;
			p_solver.regions[ir].spaces.forEach(coors => {
				x = coors.x;
				y = coors.y;
				if ((p_solver.shapeArray[y][x] != LITS.UNDECIDED) && (p_solver.shapeArray[y][x] != shape)) {
					p_listEventsToApply.push(new SpaceEvent(x, y, ADJACENCY.NO));
				} else {
					p_listEventsToApply.push(new ShapeEvent(x, y, shape));
				}
			}); 
			// For each open space in another region neighbour of one our spaces, ban this shape in that region
			p_solver.regions[ir].openSpaces.forEach(coors => {
				x = coors.x;
				y = coors.y;
				p_solver.existingNeighborsCoors(x, y).forEach(coors2 => {
					x2 = coors2.x;
					y2 = coors2.y;
					ir2 = p_solver.regionArray[y2][x2];
					if (ir2 != ir && (p_solver.answerArray[y2][x2] == ADJACENCY.YES)) {
						p_listEventsToApply.push(new BanShapeRegionEvent(ir2, shape));
					}
				});
			});
		} else if (p_eventBeingApplied.kind == KIND_EVENT.SPACE) {
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
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
					p_solver.checkerNewOpenRegions.add(ir); // Note : is everything okay ? I wrote " Est-ce ce qu'il faut ? "
				}
			} else { // Space is open
				p_solver.checkerNewOpenRegions.add(ir);
				
				// Alert on 2x2 areas
				p_listEventsToApply = p_solver.deductionsAlert2x2Areas(p_listEventsToApply, p_solver.methodsSetDeductions, x, y); 

				// If 2 spaces are open, in the same region, in the same row/column and they are 1 space apart, then : this space must be open AND belong to this region. Otherwise, this is an immediate failure !
				p_listEventsToApply = p_solver.fillOpenGaps(p_listEventsToApply, x, y, ir);
				
				//Alert on region
				if (region.openSpaces.length == 4) {
					p_listEventsToApply = p_solver.alertRegion(p_listEventsToApply,ir,ADJACENCY.NO,region.notPlacedYetClosed);			
				}
				
				// Test the non-adjacency of same shapes + affect a shape to the region
				shape = p_solver.shapeArray[y][x];
				if (shape != LITS.UNDECIDED) {
					p_listEventsToApply = p_solver.closeUpTo4NeighborsOrNotSameShapeWhileOpen(p_listEventsToApply, x, y, ir, shape);
					p_listEventsToApply.push(new ShapeRegionEvent(ir, shape));
				}
				
				// Ban a shape in this region if adjacent to another open space in a shape-affected region
				p_solver.existingNeighborsCoors(x, y).forEach(coors2 => {
					x2 = coors2.x;
					y2 = coors2.y;
					ir2 = p_solver.regionArray[y2][x2];
					if (ir2 != WALLGRID.OUT_OF_REGIONS) {						
						shapeIR2 = p_solver.regions[ir2].shape;
						if (ir2 != ir && (p_solver.answerArray[y2][x2] == ADJACENCY.YES) && shapeIR2 != LITS.UNDECIDED) {
							p_listEventsToApply.push(new BanShapeRegionEvent(ir, shapeIR2));
						}
					}
				});
			}
		} else if (p_eventBeingApplied.kind == KIND_EVENT.SHAPE) {
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			const ir = p_solver.regionArray[y][x];
			shape = p_eventBeingApplied.shape;
			// Shape banned in this region ? Close the space !
			if (p_solver.regions[ir].shapesBanned[shape]) {
				p_listEventsToApply.push(new SpaceEvent(x, y, ADJACENCY.NO));
			}
			// A shape event : if 2 spaces across borders are affected the same shape, if either of them is open, close the other one. 
			if (p_solver.answerArray[y][x] == ADJACENCY.YES) {
				p_listEventsToApply = p_solver.closeUpTo4NeighborsOrNotSameShapeWhileOpen(p_listEventsToApply, x, y, ir, shape);
				p_listEventsToApply.push(new ShapeRegionEvent(ir, shape));
			} 
		} else {
			// Shape banned from a region : close all spaces that should have gathered this shape
			const region = p_solver.regions[p_eventBeingApplied.region];
			region.shapesSpaces[p_eventBeingApplied.shape].forEach(coors => {
				p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, ADJACENCY.NO));
			});
		}
		return p_listEventsToApply;
	}
}

SolverLITS.prototype.isNotClosed = function (p_x,p_y) {
	return (this.answerArray[p_y][p_x] != ADJACENCY.NO);
}

// The classical "when the remaining spaces of a region must be closed/open to reach the numbers"
SolverLITS.prototype.alertRegion = function(p_listEvents, p_regionIndex, p_missingSymbol, p_missingNumber) {
	const region = this.regions[p_regionIndex];
	var xa,ya,alertSpace;
	var remaining = p_missingNumber
	for(var i = 0;i<region.size;i++) {
		alertSpace = region.spaces[i];
		xa = alertSpace.x;
		ya = alertSpace.y;
		if (this.answerArray[ya][xa] == ADJACENCY.UNDECIDED) {
			p_listEvents.push(new SpaceEvent(xa, ya, p_missingSymbol));
			remaining--;
			if (remaining == 0) {
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
	var xd, yd;
	this.existingNeighborsCoors(p_x, p_y).forEach(coors => {
		xd = coors.x;
		yd = coors.y;
		if ((this.getRegionIndex(xd, yd) != p_ir) && (this.getShape(xd, yd) == p_shape)) {
			p_listEventsToApply.push(new SpaceEvent(xd, yd, ADJACENCY.NO));
		}
	});
	return p_listEventsToApply;
}

// -------------
// Filters & abortions

filterClosureNewlyOpen = function(p_solver) {
	return function() {
		return p_solver.applyDeclarationsNewlyOpen();
	}
}

filterClosureNewlyClosed = function(p_solver) {
	return function() {
		return p_solver.applyDeclarationsNewlyClosed();
	}
}

abortClosure = function(p_solver) {
	return function() {
		p_solver.cleanDeclarationsNewOpenRegions();
		p_solver.cleanDeclarationsNewlyClosed();
	}
}

SolverLITS.prototype.cleanDeclarationsNewOpenRegions = function() {
	this.checkerNewOpenRegions.clean();
}

SolverLITS.prototype.cleanDeclarationsNewlyClosed = function() {
	this.checkerNewlyClosed.clean();
}

// Post-indiviual-events filter : for each region that has 3 or 4 spaces, apply the consequences... and clean the environment afterwards !
// Since it is a filter it must return FAILURE or a list of deducted events
SolverLITS.prototype.applyDeclarationsNewlyOpen = function() {
	var eventsList = [];

	for (var i = 0 ; i < this.checkerNewOpenRegions.list.length ; i++) { //Note : forEach doesn't allow simple returns
		indexRegion = this.checkerNewOpenRegions.list[i];
		if (4 == this.regions[indexRegion].openSpaces.length) {				
			eventsList = this.eventsTetrominoIdentification(eventsList, indexRegion);
		} else if (3 == this.regions[indexRegion].openSpaces.length) {				
			eventsList = this.eventsTripletPlacement(eventsList, indexRegion);
		} else {
			eventsList = this.applyDeclarations1or2Open(eventsList, indexRegion);
		}
		if (eventsList == EVENT_RESULT.FAILURE) {
			return EVENT_RESULT.FAILURE; 
		}
	};
	this.cleanDeclarationsNewOpenRegions();
	return eventsList;
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
SolverLITS.prototype.applyDeclarations1or2Open = function(p_eventsList, p_indexRegion) {
	var nbOpenSpaces;
	const region = this.regions[p_indexRegion];
	if (region.notPlacedYetClosed > 0) {
		region.openSpaces.forEach(space => {
			p_eventsList = this.discriminateUnreachable(p_eventsList, space.x, space.y, p_indexRegion);
		});
	}
	return p_eventsList;
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
	return commonComparisonMultiKinds([KIND_EVENT.SHAPE_REGION, KIND_EVENT.SPACE, KIND_EVENT.SHAPE, KIND_EVENT.BAN_SHAPE_REGION], 
	[[p_event1.region, p_event1.shape], [p_event2.region, p_event2.shape], 
	[p_event1.y, p_event1.x, p_event1.symbol], [p_event2.y, p_event2.x, p_event2.symbol], 
	[p_event1.y, p_event1.x, p_event1.shape], [p_event2.y, p_event2.x, p_event2.shape],
	[p_event1.region, p_event1.shape], [p_event2.region, p_event2.shape]], p_event1.kind, p_event2.kind);
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

// A quel moment doit-on bannir une forme d'une région ?
// Dès qu'une case ouverte de cette région est orthogonalement adjacente à une case ouverte d'une autre région ET ladite région a une forme déclarée !