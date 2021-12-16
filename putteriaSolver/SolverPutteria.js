// Initialization
function SolverPutteria(p_wallArray, p_symbolArray) {
	GeneralSolver.call(this);
	this.construct(p_wallArray, p_symbolArray);
}

DummySolver = function() {
	return new SolverPutteria(generateWallArray(1, 1), [[null]]);
}
SolverPutteria.prototype = Object.create(GeneralSolver.prototype);
SolverPutteria.prototype.constructor = SolverPutteria;

SolverPutteria.prototype.construct = function(p_wallArray, p_symbolArray) {
	this.generalConstruct();
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.methodsSetDeductions = new ApplyEventMethodPack(
			applyEventClosure(this), 
			deductionsClosure(this),  
			undoEventClosure(this));
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterRegionsClosure(this)]);
	this.methodsSetPass = {
		comparisonMethod : comparison, 
		copyMethod : copying, 
		argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsSetMultiPass = {
		generatePassEventsMethod : generateEventsChoicesPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}

	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();
	this.regions = [];
	const spacesByRegion = listSpacesByRegion(this.regionArray);
	this.regionsNumber = spacesByRegion.length;
	
	// Empty region data
	var ir;
	this.regions = [];
	for(ir=0 ; ir < this.regionsNumber ; ir++) {
		this.regions.push({
			spaces : spacesByRegion[ir],
			size : spacesByRegion[ir].length,
			hasANumber : false
		});
	}
	
	this.answerArray = [];
	var x, y;
	for (y = 0 ; y < this.yLength ; y++) {
		this.answerArray.push([]);
		for (x = 0 ; x < this.xLength ; x++) {
			switch(p_symbolArray[y][x]) {
				case SYMBOL_ID.O : 
					this.answerArray[y].push(FILLING.YES); 
					this.getRegion(x, y).hasANumber = true;
				break;	
				case SYMBOL_ID.X : 
					this.answerArray[y].push(FILLING.NO); 
				break;
				default : 
					this.answerArray[y].push(FILLING.UNDECIDED); 
				break;
			}
			if (this.regionArray[y][x] == WALLGRID.OUT_OF_REGIONS) { // Purify
				this.answerArray[y][x] = FILLING.NO;
			}
		}
	}
	 
	this.nextNumberPositionArray = []; // Directions 0123 assumption
	this.sizesArray = []; 
	this.fixedArray = []; 
	for (y = 0 ; y < this.yLength ; y++) {
		this.nextNumberPositionArray.push([]);
		this.sizesArray.push([]);
		this.fixedArray.push([]);
		for (x = 0 ; x < this.xLength ; x++) {
			this.nextNumberPositionArray[y].push([null, null, null, null]);
			if (this.regionArray[y][x] == WALLGRID.OUT_OF_REGIONS) {
				// Hack with the assumption below : an out-of-regions spaces shouldn't be checked !
				this.sizesArray[y].push(1);
			} else {
				this.sizesArray[y].push(this.getRegion(x, y).size);
			}
			this.fixedArray[y].push(p_symbolArray[y][x] != null);
		}
	}
	var xStart, yStart;
	var previousXY, size;
	for (yStart = 0 ; yStart < this.yLength ; yStart++) {
		for (xStart = 0 ; xStart < this.xLength ; xStart++) {
			size = this.sizesArray[yStart][xStart];
			if (size != 1) { // Correct puzzle data assumption : supposes that a puzzle correctly has no more than one 1-space region per row/column (also see the hack above)
				if (this.nextNumberPositionArray[yStart][xStart][DIRECTION.LEFT] == null) {
					previousXY = xStart;
					y = yStart;
					for (x = xStart+1 ; x < this.xLength ; x++) {
						if (this.sizesArray[y][x] == size) {
							this.nextNumberPositionArray[y][x][DIRECTION.LEFT] = previousXY;
							this.nextNumberPositionArray[y][previousXY][DIRECTION.RIGHT] = x;
							previousXY = x;
						} 
					}
				}
				if (this.nextNumberPositionArray[yStart][xStart][DIRECTION.UP] == null) {
					previousXY = yStart;
					x = xStart;
					for (y = yStart+1 ; y < this.yLength ; y++) {
						if (this.sizesArray[y][x] == size) {
							this.nextNumberPositionArray[y][x][DIRECTION.UP] = previousXY;
							this.nextNumberPositionArray[previousXY][x][DIRECTION.DOWN] = y;
							previousXY = y;
						} 
					}
				}
			}
		}
	}

	// For multipass
	var allUnsortedDifferentSizesList = []; // List of all different existing sizes
	this.regions.forEach(region => {
		allUnsortedDifferentSizesList.push(region.size);
	});
	this.differentSizesList = sortUnicityList(allUnsortedDifferentSizesList, function(a, b) {return a == b}, function(a, b) {return a-b});
	this.regionsBySizes = [];
	for (var i = 0 ; i < this.differentSizesList.length ; i++) {
		this.regionsBySizes.push([]);
	}
	var index;
	for (var i = 0 ; i < this.regionsNumber ; i++) {
		index = getIndexInSortedArray(this.differentSizesList, allUnsortedDifferentSizesList[i]);
		this.regionsBySizes[index].push(i);
	};
	
	// Checker
	this.checkerRegionsNewX = new CheckCollection(this.regionsNumber);
}

//--------------------------------
// Getter method for draw

SolverPutteria.prototype.getXOrNumber = function(p_x, p_y) {
	switch(this.answerArray[p_y][p_x]) {
		case FILLING.YES : return this.sizesArray[p_y][p_x];
		case FILLING.NO : return (this.regionArray[p_y][p_x] != WALLGRID.OUT_OF_REGIONS) ? "X" : null;
		default : return null;
	}
}

SolverPutteria.prototype.isFixed = function(p_x, p_y) {
	return this.fixedArray[p_y][p_x];
}

//--------------------------------
// Getter

SolverPutteria.prototype.getRegion = function(p_x, p_y) {
	return this.regions[this.regionArray[p_y][p_x]];
}

//--------------------------------

// Input methods
SolverPutteria.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	return this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_symbol));
}

SolverPutteria.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverPutteria.prototype.makeQuickStart = function() {
	this.quickStart();
}

SolverPutteria.prototype.emitPassAllRegionsSize = function(p_x, p_y) {
	const size = this.getRegion(p_x, p_y).size;
	const generatedEvents = this.generateEventsChoicesForAllRegionsWithThisSize(size);
	this.passEvents(generatedEvents, this.methodsSetDeductions, this.methodsSetPass, size); 
}

SolverPutteria.prototype.makeMultiPass = function() {
	this.multiPass(this.methodsSetMultiPass);
}

//--------------------------------
// Doing and undoing

function applyEventClosure(p_solver) {
	return function(p_eventToApply) {
		const symbol = p_eventToApply.symbol;
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		if (p_solver.answerArray[y][x] == symbol) {			
			return EVENT_RESULT.HARMLESS;
		}
		if (p_solver.answerArray[y][x] != FILLING.UNDECIDED) {
			return EVENT_RESULT.FAILURE;
		}
		// Limit to only one number of region 
		if (symbol == FILLING.YES) {
			var region = p_solver.getRegion(x, y);
			if (region.hasANumber) {
				return EVENT_RESULT.FAILURE; 
			} else {
				region.hasANumber = true;
			}
		} else {
			p_solver.checkerRegionsNewX.add(p_solver.regionArray[y][x]);
		}
		p_solver.answerArray[y][x] = symbol;
		return EVENT_RESULT.SUCCESS;
	}
}

function undoEventClosure(p_solver) {
	return function(p_eventToUndo) {
		const symbol = p_eventToUndo.symbol;
		const x = p_eventToUndo.x;
		const y = p_eventToUndo.y;
		p_solver.answerArray[y][x] = FILLING.UNDECIDED;
		if (symbol == FILLING.YES) {
			p_solver.getRegion(x, y).hasANumber = false;
		}
	}
}

//--------------------------------
// Quickstart !

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvts = [{quickStartLabel : "Putteria"}];
		p_solver.regions.forEach(region => {
			if (region.size == 1) { // 1-sized regions (don't forget them)
				listQSEvts.push(new SpaceEvent(region.spaces[0].x, region.spaces[0].y, FILLING.YES));
			} else if (region.hasANumber) {
				// Completion & adjacency
				region.spaces.forEach(coors => {
					xx = coors.x;
					yy = coors.y;
					if (p_solver.answerArray[yy][xx] != FILLING.YES) { // Supposes that there is no more than one number per region at setup
						listQSEvts.push(new SpaceEvent(xx, yy, FILLING.NO));
					} else {
						p_solver.existingNeighborsCoors(xx, yy).forEach(coors2 => {
							listQSEvts.push(new SpaceEvent(coors2.x, coors2.y, FILLING.NO));
						});
						listQSEvts = p_solver.columnSameSizesFillingNoDeductions(listQSEvts, xx, yy);
						listQSEvts = p_solver.rowSameSizesFillingNoDeductions(listQSEvts, xx, yy);
					}
				});
			} else {
				// Only possibilities are in a row or a column
				listQSEvts = p_solver.checkXRegionsDeductions(listQSEvts, region); 
			}
		});
		return listQSEvts;
	}
}

//--------------------------------
// Deductions

function deductionsClosure(p_solver) {
	return function(p_futureEventsList, p_eventToApply) {
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		if (p_eventToApply.symbol == FILLING.YES) {
			// Adjacency
			p_solver.existingNeighborsCoorsDirections(x, y).forEach(coorsDir => {
				p_futureEventsList.push(new SpaceEvent(coorsDir.x, coorsDir.y, FILLING.NO)); 
			});
			// Row/column
			p_futureEventsList = p_solver.columnSameSizesFillingNoDeductions(p_futureEventsList, x, y);
			p_futureEventsList = p_solver.rowSameSizesFillingNoDeductions(p_futureEventsList, x, y);
			// Completion of region
			const region = p_solver.getRegion(x, y);
			region.spaces.forEach(coors => {
				xx = coors.x;
				yy = coors.y;
				if (xx != x || yy != y) {
					p_futureEventsList.push(new SpaceEvent(xx, yy, FILLING.NO));
				}
			});
		}
		return p_futureEventsList;
	}
}

SolverPutteria.prototype.columnSameSizesFillingNoDeductions = function(p_eventsList, p_x, p_y) { // Note : not "columnSameSizesXDeductions" to avoid confusion with coordinate X
	var y;
	[DIRECTION.UP, DIRECTION.DOWN].forEach(dir => {
		y = this.nextNumberPositionArray[p_y][p_x][dir];
		while(y != null) {
			p_eventsList.push(new SpaceEvent(p_x, y, FILLING.NO)); 
			y = this.nextNumberPositionArray[y][p_x][dir];
		}		
	});
	return p_eventsList;
}

SolverPutteria.prototype.rowSameSizesFillingNoDeductions = function(p_eventsList, p_x, p_y) {
	var x;
	[DIRECTION.LEFT, DIRECTION.RIGHT].forEach(dir => {
		x = this.nextNumberPositionArray[p_y][p_x][dir];
		while(x != null) {
			p_eventsList.push(new SpaceEvent(x, p_y, FILLING.NO)); 
			x = this.nextNumberPositionArray[p_y][x][dir];
		}		
	});
	return p_eventsList;
}


SolverPutteria.prototype.columnSameSizesFillingNoOutOfRegionDeductions = function(p_eventsList, p_x, p_y, p_ir) { // Note : C/C
	var y;
	[DIRECTION.UP, DIRECTION.DOWN].forEach(dir => {
		y = this.nextNumberPositionArray[p_y][p_x][dir];
		while(y != null) {
			if (this.regionArray[y][p_x] != p_ir) {				
				p_eventsList.push(new SpaceEvent(p_x, y, FILLING.NO)); 
			}
			y = this.nextNumberPositionArray[y][p_x][dir];
		}		
	});
	return p_eventsList;
}

SolverPutteria.prototype.rowSameSizesFillingNoOutOfRegionDeductions = function(p_eventsList, p_x, p_y, p_ir) {
	var x;
	[DIRECTION.LEFT, DIRECTION.RIGHT].forEach(dir => {
		x = this.nextNumberPositionArray[p_y][p_x][dir];
		while(x != null) {
			if (this.regionArray[p_y][x] != p_ir) {				
				p_eventsList.push(new SpaceEvent(x, p_y, FILLING.NO)); 
			}
			x = this.nextNumberPositionArray[p_y][x][dir];
		}		
	});
	return p_eventsList;
}	



// Checks in each region without a FILLING.YES the remaining undecided spaces. 
// None : failure. One : add an O ; more and they are in the same row/col : add X elsewhere !
// Used in QS (all deductions) and filter ; only for regions without a number. 
SolverPutteria.prototype.checkXRegionsDeductions = function(p_eventsList, p_region) {
	var xRemain = null;
	var yRemain = null;
	var xExample, yExample;
	for (var is = 0 ; is < p_region.spaces.length ; is++) {
		x = p_region.spaces[is].x;
		y = p_region.spaces[is].y;
		if (this.answerArray[y][x] == FILLING.UNDECIDED) {						
			if (xRemain != null && xRemain != x) {
				xRemain = -1;
			} 
			if (yRemain != null && yRemain != y) {
				yRemain = -1;
			}
			if (xRemain == null) {
				xRemain = x;
				yRemain = y;
				xExample = x;
				yExample = y;
			}
		}		
	}
	if (xRemain == null) {
		return EVENT_RESULT.FAILURE;
	}
	if (xRemain == -1) {
		if (yRemain != -1) {
			p_eventsList = this.rowSameSizesFillingNoOutOfRegionDeductions(p_eventsList, xExample, yRemain, this.regionArray[yRemain][xExample]);
		}
	} else {
		if (yRemain == -1) {
			p_eventsList = this.columnSameSizesFillingNoOutOfRegionDeductions(p_eventsList, xRemain, yExample, this.regionArray[yExample][xRemain]);
		} else {
			p_eventsList.push(new SpaceEvent(xRemain, yRemain, FILLING.YES));
		}
	}
	return p_eventsList;
}

// Filter & abort :

// This filter : only checks remaining undecided in regions
filterRegionsClosure = function(p_solver) {
	return function() {
		var p_eventsList = [];
		for (var i = 0 ; i < p_solver.checkerRegionsNewX.list.length ; i++) {
			region = p_solver.regions[p_solver.checkerRegionsNewX.list[i]];
			if (!region.hasANumber) {
				p_eventsList = p_solver.checkXRegionsDeductions(p_eventsList, region);
				if (p_eventsList == EVENT_RESULT.FAILURE) {
					return p_eventsList;
				}
			}
		}
		p_solver.cleanCheckerRegions();
		return p_eventsList;
	}
}

abortClosure = function(p_solver) {
	return function() {
		p_solver.cleanCheckerRegions();
	}
}

SolverPutteria.prototype.cleanCheckerRegions = function() {
	this.checkerRegionsNewX.clean();
}

// -----------------------
// Pass & multipass

// Pass events for all regions of a given size
SolverPutteria.prototype.generateEventsChoicesForAllRegionsWithThisSize = function(p_size) {
	var p_eventChoiceList = [];
	var elt;
	var indexes = this.regionsBySizes[getIndexInSortedArray(this.differentSizesList, p_size)];
	indexes.forEach(index => {
		if (!this.regions[index].hasANumber) {
			p_eventChoiceList.push(this.generateEventChoiceForRegion(index));
		};
	});
	return p_eventChoiceList;
}

// List of all undecided spaces of a region
SolverPutteria.prototype.generateEventChoiceForRegion = function(p_regIndex) {
	var p_eventChoice = [];
	this.regions[p_regIndex].spaces.forEach(coors => {
		if (this.answerArray[coors.y][coors.x] == FILLING.UNDECIDED) {
			p_eventChoice.push(new SpaceEvent(coors.x, coors.y, FILLING.YES));
		}
	});
	return p_eventChoice; 
}

function namingCategoryClosure(p_solver) {
	return function(p_sizes) {
		return "All regions with size " + p_sizes;
	}
}

function copying(p_event) {
	return p_event.copy();
}

function comparison(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.symbol], [p_event2.y, p_event2.x, p_event2.symbol]]);
}

function generateEventsChoicesPassClosure(p_solver) {
	return function(p_size) {
		return p_solver.generateEventsChoicesForAllRegionsWithThisSize(p_size);
	}
}

function orderedListPassArgumentsClosure(p_solver) {
	return function() {
		return p_solver.differentSizesList;
	}
}