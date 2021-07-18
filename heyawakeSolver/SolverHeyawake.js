// Initialization

const NOT_FORCED = -1; 

const HEYAWAKE_PASS_CATEGORY = {
	SINGLE_REGION : 0,
	BLOCK_REGION : 1
}

function SolverHeyawake(p_wallArray, p_indications) {
	GeneralSolver.call(this);
	this.construct(p_wallArray, p_indications);
}

SolverHeyawake.prototype = Object.create(GeneralSolver.prototype);
SolverHeyawake.prototype.constructor = SolverHeyawake;

function DummySolver() {
	return new SolverHeyawake(generateWallArray(1, 1), []);
}

SolverHeyawake.prototype.construct = function(p_wallArray, p_indications) {
	this.generalConstruct();
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.makeItGeographical(this.xLength, this.yLength);
	this.methodsSetDeductions = new ApplyEventMethodGeographicalPack(
			applyEventClosure(this), 
			deductionsClosure(this), 
			adjacencyClosure(this), 
			transformClosure(this), 
			undoEventClosure(this));
	this.methodsSetPass = {
		comparisonMethod : comparison, 
		copyMethod : copying, 
		argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsSetMultiPass = {
		generatePassEventsMethod : generateEventsForRegionPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		skipPassMethod : skipPassClosure(this)
	};

	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();
	this.answerArray = generateValueArray(this.xLength, this.yLength, ADJACENCY.UNDECIDED);
	this.stripesArray = generateFunctionValueArray(this.xLength, this.yLength, function() {
		return {horizontal : [], vertical : []}
	});
	this.horizontalStripes = [];
	this.verticalStripes = [];
	var ix,iy;
	var lastRegionNumber = 0;
	
	const spacesByRegion = listSpacesByRegion(this.regionArray);
	this.regionsNumber = spacesByRegion.length;

	// Blantly initialize data of regions
	var ir;
	this.regions = [];
	for(ir=0 ; ir < this.regionsNumber ; ir++) {
		this.regions.push({
			spaces : spacesByRegion[ir],
			expectedNumberOfClosedsInRegion : NOT_FORCED,
			notPlacedYet : null,
			size : spacesByRegion[ir].length,
			horizontalInnerStripesIndexes : [],
			verticalInnerStripesIndexes : [] 
		});
	}
	
	var region;
	p_indications.forEach(indic => {
		region = this.regions[indic.index];
		region.expectedNumberOfClosedsInRegion = indic.value;
		region.notPlacedYet = {CLOSEDs : indic.value};
	});
	
	// Initialize numbers of Xs to place 
	for(ir = 0 ; ir < this.regionsNumber ; ir++) {
		region = this.regions[ir];
		if (region.notPlacedYet != null) {
			region.notPlacedYet.OPENs = region.size-region.notPlacedYet.CLOSEDs;
		} else {
			region.notDecidedYet = region.size; // Alternative to regions that are not forced, for multipass purposes.
		}
	}
	
	//And now, the stripes for Heyawake ! (ie the series of contiguous aligned spaces that cross 2 borders)
	var endStrip;
	var indexStrip;
	for(iy = 0;iy < this.yLength ; iy++) {
		for(ix = 0;ix < this.xLength ; ix++) {
			//If it has a right boundary, draw an horizontal band to the right boundary if it exists.
			if (this.gridWall.getWallR(ix, iy) == WALLGRID.CLOSED) {
				endStrip = ix+1;
				while (endStrip < this.xLength-1 && this.gridWall.getState(endStrip+1, iy) != WALLGRID.CLOSED && this.gridWall.getWallR(endStrip, iy) != WALLGRID.CLOSED){
					endStrip++;
				}
				endStrip++; 
				//Right now, endStrip corresponds to "the right of a boundary" or "a banned/out-of-bounds space"
				if (endStrip < this.xLength && this.gridWall.getState(endStrip, iy) != WALLGRID.CLOSED) {
					//We met a true region boundary ? Fine, to work now !
					irInner = this.regionArray[iy][ix+1]; //Region of the inner grid
					indexStrip = this.horizontalStripes.length;
					this.regions[irInner].horizontalInnerStripesIndexes.push(indexStrip);
					this.stripesArray[iy][ix].horizontal.push(indexStrip);
					this.stripesArray[iy][endStrip].horizontal.push(indexStrip);
					for(var ix2 = ix+1; ix2 < endStrip ; ix2++){
						this.stripesArray[iy][ix2].horizontal.push(indexStrip);
					}
					this.horizontalStripes.push({row : iy, xStart : ix, xEnd : endStrip, UNDEFs: endStrip-ix+1, CLOSEDs:0});
				}
			}
			//Same down.
			if (this.gridWall.getWallD(ix, iy) == WALLGRID.CLOSED) {
				endStrip = iy+1;
				while (endStrip < this.yLength-1 && this.gridWall.getState(ix, endStrip + 1) != WALLGRID.CLOSED && this.gridWall.getWallD(ix, endStrip) != WALLGRID.CLOSED) {
					endStrip++;
				}
				endStrip++; 
				// ... "the bottom of a boundary" ... "a banned/out-of-bounds space"
				if (endStrip < this.yLength && this.gridWall.getState(ix,endStrip) != WALLGRID.CLOSED) {
					irInner = this.regionArray[iy+1][ix]; 
					indexStrip = this.verticalStripes.length;
					this.regions[irInner].verticalInnerStripesIndexes.push(indexStrip);
					this.stripesArray[iy][ix].vertical.push(indexStrip);
					this.stripesArray[endStrip][ix].vertical.push(indexStrip);
					for(var iy2 = iy+1; iy2 < endStrip ; iy2++){
						this.stripesArray[iy2][ix].vertical.push(indexStrip);
					}
					this.verticalStripes.push({column : ix, yStart : iy, yEnd : endStrip, UNDEFs: endStrip-iy+1, CLOSEDs:0});
				}
			}
		}
	}
	
	//Note : grid not purified. (if there are banned spaces)
	
	// For general pass
	bordersTriangle = getBordersTriangle(this.regionArray, this.regionsNumber);
	this.adjacencyWithIndics = [];
	for (var ir = 0 ; ir < this.regionsNumber ; ir++) {
		this.adjacencyWithIndics.push([]);
		if (this.regions[ir].expectedNumberOfClosedsInRegion != NOT_FORCED) {			
			for (var is = 0 ; is < ir ; is++) {
				if(bordersTriangle[ir][is].length > 0 && this.regions[is].expectedNumberOfClosedsInRegion != NOT_FORCED) {
					this.adjacencyWithIndics[ir].push(is);
					this.adjacencyWithIndics[is].push(ir);
				}					
			}
		}
	}
	this.checkerAdjacencyRegionsTotal = new CheckCollection(this.regionsNumber);
}

//--------------------------------

// Misc. methods

SolverHeyawake.prototype.expectedNumberInRegion = function(p_ir) {
	return this.regions[p_ir].expectedNumberOfClosedsInRegion;
}

SolverHeyawake.prototype.getSpaceCoordinates = function(p_indexRegion, p_indexSpace) {
	return this.regions[p_indexRegion].spaces[p_indexSpace];
}

SolverHeyawake.prototype.getAnswer = function(p_x, p_y) {
	return this.answerArray[p_y][p_x];
}

SolverHeyawake.prototype.getRegionIndex = function(p_x, p_y) {
	return this.regionArray[p_y][p_x];
}

SolverHeyawake.prototype.getFirstSpaceRegion = function(p_ir) {
	return this.regions[p_ir].spaces[0];
}

//--------------------------------

// Misc. inner methods 

SolverHeyawake.prototype.warnPlacedHorizontalStrip = function(p_index, p_symbol) {
	this.modifyHorizontalStrip(p_index, p_symbol, -1);
}

SolverHeyawake.prototype.warnPlacedVerticalStrip = function(p_index, p_symbol) {
	this.modifyVerticalStrip(p_index, p_symbol, -1);
}

SolverHeyawake.prototype.warnUnplacedHorizontalStrip = function(p_index, p_symbol) {
	this.modifyHorizontalStrip(p_index, p_symbol, 1);
}

SolverHeyawake.prototype.warnUnplacedVerticalStrip = function(p_index, p_symbol) {
	this.modifyVerticalStrip(p_index, p_symbol, 1);
}

SolverHeyawake.prototype.modifyHorizontalStrip = function(p_index, p_symbol, p_modify) {
	this.horizontalStripes[p_index].UNDEFs += p_modify;
	if (p_symbol == ADJACENCY.NO) {
		this.horizontalStripes[p_index].CLOSEDs += p_modify;
	}
}

SolverHeyawake.prototype.modifyVerticalStrip = function(p_index, p_symbol, p_modify) {
	this.verticalStripes[p_index].UNDEFs += p_modify;
	if (p_symbol == ADJACENCY.NO) {
		this.verticalStripes[p_index].CLOSEDs += p_modify;
	}
}

//--------------------------------

// Input methods
SolverHeyawake.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	this.tryToPutNew(p_x, p_y, p_symbol);
}

SolverHeyawake.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverHeyawake.prototype.quickStart = function() {
	this.initiateQuickStart();
	this.regions.forEach(region => {
		if (region.size == 1 && region.notPlacedYet != null && region.notPlacedYet.CLOSEDs == 1){
			this.tryToPutNew(region.spaces[0].x, region.spaces[0].y, ADJACENCY.NO);
		};
		if (region.notPlacedYet != null && region.notPlacedYet.CLOSEDs == 0){
			region.spaces.forEach(space => {
				this.tryToPutNew(space.x, space.y, ADJACENCY.YES);
			});
		}
	});
	this.terminateQuickStart();
}

SolverHeyawake.prototype.emitPassRegion = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	const index = {category : HEYAWAKE_PASS_CATEGORY, value : p_indexRegion};
	this.passEvents(generatedEvents, this.methodsSetDeductions, this.methodsSetPass, index); 
}

SolverHeyawake.prototype.emitSmartPassRegion = function(p_indexRegion) {
	this.smartPassRegion(p_indexRegion);
}

SolverHeyawake.prototype.makeMultiPass = function() {
	this.multiPass(this.methodsSetDeductions, this.methodsSetPass, this.methodsSetMultiPass);
}

SolverHeyawake.prototype.smartPassRegion = function(p_indexRegion) {
	const indexes = this.findTightRegionsAdjacentFromRegion(p_indexRegion);
	const generatedEvents = this.generateEventsForRegionSmartPass(indexes);
	const indexGroup = {category : HEYAWAKE_PASS_CATEGORY.BLOCK_REGION, value : indexes};
	this.passEvents(generatedEvents, this.methodsSetDeductions, this.methodsSetPass, indexGroup);
}

//--------------------------------

// Central method

SolverHeyawake.prototype.tryToPutNew = function (p_x, p_y, p_symbol) {
	// If we directly passed methods and not closures, we would be stuck because "this" would refer to the Window object which of course doesn't define the properties we want, e.g. the properties of the solvers.
	// All the methods pass the solver as a parameter because they can't be prototyped by it (problem of "undefined" things). 
	this.tryToApplyHypothesis(
		new SpaceEvent(p_x, p_y, p_symbol),
		this.methodsSetDeductions
	);
}

//--------------------------------

// Doing and undoing
SolverHeyawake.prototype.putNew = function(p_x, p_y, p_symbol) {
	if (this.answerArray[p_y][p_x] == p_symbol) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[p_y][p_x] != ADJACENCY.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerArray[p_y][p_x] = p_symbol;
	var ir = this.regionArray[p_y][p_x];
	var region = this.regions[ir];
	if (region.notPlacedYet != null) {
		if (p_symbol == ADJACENCY.YES) {
			region.notPlacedYet.OPENs--;
		} else if (p_symbol == ADJACENCY.NO) {
			region.notPlacedYet.CLOSEDs--;
		}
	} else {
		region.notDecidedYet--;
	}
	const stripSpace = this.stripesArray[p_y][p_x];
	stripSpace.horizontal.forEach(index => {		
		this.warnPlacedHorizontalStrip(index, p_symbol);
	});
	stripSpace.vertical.forEach(index => {		
		this.warnPlacedVerticalStrip(index, p_symbol);
	});
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
		p_solver.answerArray[y][x] = ADJACENCY.UNDECIDED;
		var ir = p_solver.regionArray[y][x];
		var region = p_solver.regions[ir];
		if (region.notPlacedYet != null) {
			if (symbol == ADJACENCY.YES) {
				region.notPlacedYet.OPENs++;
			} else if (symbol == ADJACENCY.NO) {
				region.notPlacedYet.CLOSEDs++;
			}
		} else {
			region.notDecidedYet++;
		}
		const stripSpace = p_solver.stripesArray[y][x];
		stripSpace.horizontal.forEach(index => {		
			p_solver.warnUnplacedHorizontalStrip(index, symbol);
		});
		stripSpace.vertical.forEach(index => {		
			p_solver.warnUnplacedVerticalStrip(index, symbol);
		});
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
// Deductions

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		var x = p_eventBeingApplied.x();
		var y = p_eventBeingApplied.y();
		var ir = p_solver.regionArray[y][x];
		var region = p_solver.regions[ir];
		symbol = p_eventBeingApplied.symbol;
		if (symbol == ADJACENCY.NO) {
			p_solver.existingNeighborsCoorsDirections(x, y).forEach(coors => {
				p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, ADJACENCY.YES));
			});
			//Alert on region
			if (region.notPlacedYet != null && region.notPlacedYet.CLOSEDs == 0) {
				p_listEventsToApply = p_solver.alertRegionDeductions(p_listEventsToApply, ir, ADJACENCY.YES, region.notPlacedYet.OPENs);			
			}			
		} else {
			stripSpace = p_solver.stripesArray[y][x];
			stripSpace.horizontal.forEach(index => {	
				p_listEventsToApply = p_solver.testAlertHorizontalStripDeductions(p_listEventsToApply, index);
			});
			stripSpace.vertical.forEach(index => {		
				p_listEventsToApply = p_solver.testAlertVerticalStripDeductions(p_listEventsToApply, index);
			});
			//Alert on region
			if (region.notPlacedYet != null && region.notPlacedYet.OPENs == 0){
				p_listEventsToApply = p_solver.alertRegionDeductions(p_listEventsToApply, ir, ADJACENCY.NO, region.notPlacedYet.CLOSEDs);			
			}
		}
		return p_listEventsToApply;
	}
}

// Classic logical verifications 
SolverHeyawake.prototype.testAlertHorizontalStripDeductions = function(p_eventsList, p_index) {
	if (this.horizontalStripes[p_index].CLOSEDs == 0 && this.horizontalStripes[p_index].UNDEFs == 1) {
		const y = this.horizontalStripes[p_index].row;
		var ix = this.horizontalStripes[p_index].xStart;
		while(this.answerArray[y][ix] == ADJACENCY.YES) {
			ix++;
		}
		p_eventsList.push(new SpaceEvent(ix, y, ADJACENCY.NO));
	}
	return p_eventsList;
}

SolverHeyawake.prototype.testAlertVerticalStripDeductions = function(p_eventsList, p_index) {
	if (this.verticalStripes[p_index].CLOSEDs == 0 && this.verticalStripes[p_index].UNDEFs == 1) {
		const x = this.verticalStripes[p_index].column;
		var iy = this.verticalStripes[p_index].yStart;
		while(this.answerArray[iy][x] == ADJACENCY.YES){
			iy++;
		}
		p_eventsList.push(new SpaceEvent(x, iy, ADJACENCY.NO));
	}
	return p_eventsList;
}

SolverHeyawake.prototype.alertRegionDeductions = function(p_listEvents, p_regionIndex, p_missingSymbol, p_missingNumber) {
	const region = this.regions[p_regionIndex];
	var xa,ya,alertSpace;
	var remaining = p_missingNumber
	for(var i = 0 ; i < region.size ; i++) {
		alertSpace = region.spaces[i];
		xa = alertSpace.x;
		ya = alertSpace.y;
		if (this.answerArray[ya][xa] == ADJACENCY.UNDECIDED) {
			p_listEvents.push(new SpaceEvent(xa, ya, p_missingSymbol));
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
	return function(p_index) {
		switch(p_index.category) {
			case HEYAWAKE_PASS_CATEGORY.SINGLE_REGION : 
				return p_solver.generateEventsForRegionPass(p_index.value);
			case HEYAWAKE_PASS_CATEGORY.BLOCK_REGION :
				return p_solver.generateEventsForRegionSmartPass(p_index.value);
		}
	}
}

// Generate covering events for "region pass".
SolverHeyawake.prototype.generateEventsForRegionPass = function(p_indexRegion) {
	var eventList = [];
	this.regions[p_indexRegion].spaces.forEach(space => {
		if (this.answerArray[space.y][space.x] == ADJACENCY.UNDECIDED) { // It would still be correct, albeit useless, to pass already filled spaces
			eventList.push([new SpaceEvent(space.x, space.y, ADJACENCY.YES), new SpaceEvent(space.x, space.y, ADJACENCY.NO)]);
		}			 
	});
	return eventList;
}

SolverHeyawake.prototype.generateEventsForRegionSmartPass = function(p_listIndexes) {
	var eventList = [];
	p_listIndexes.forEach(index => {
		eventList = eventList.concat(this.generateEventsForRegionPass(index));
	});
	return eventList;
}

copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	return commonComparison([[p_event1.coorY, p_event1.coorX, p_event1.symbol], [p_event2.coorY, p_event2.coorX, p_event2.symbol]]);
}

// Pass region and propagate to adjacent tight regions (number of closed spaces expected && remaining number of closed spaces >= remaining number of open spaces)
// Should a region be without indication, it is checked alone. //551551 can be changed !
SolverHeyawake.prototype.findTightRegionsAdjacentFromRegion = function(p_indexRegion) {
	var listRegionsToPass = [];
	var waitingIndexes = [p_indexRegion];
	var index, npy;
	var checkerAdjacencyRegions = new CheckCollection(this.regionsNumber);
	checkerAdjacencyRegions.add(p_indexRegion);
	this.checkerAdjacencyRegionsTotal.add(p_indexRegion);
	npy = this.regions[p_indexRegion].notPlacedYet;
	if (npy == null || (npy.OPENs > npy.CLOSEDs)) {
		return [p_indexRegion];
	}
	while (waitingIndexes.length > 0) {
		index = waitingIndexes.pop();
		npy = this.regions[index].notPlacedYet;
		if (npy.OPENs > 0 && npy.OPENs <= npy.CLOSEDs) {
			this.checkerAdjacencyRegionsTotal.add(index);
			listRegionsToPass.push(index);
			this.adjacencyWithIndics[index].forEach(i => {
				if (checkerAdjacencyRegions.add(i)) {
					waitingIndexes.push(i);
				}
			});
		}
	}
	checkerAdjacencyRegions.clean();
	return listRegionsToPass;
}

// --------------------
// Multipass

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var indexList = [];
		var valueList = []; 
		var indexPass;
		p_solver.checkerAdjacencyRegionsTotal.clean();
		for (var i = 0; i < p_solver.regions.length ; i++) {
			if ((p_solver.regions[i].notDecidedYet && p_solver.regions[i].notDecidedYet > 0) ||
			(p_solver.regions[i].notPlacedYet && p_solver.regions[i].notPlacedYet.CLOSEDs > 0) && !p_solver.checkerAdjacencyRegionsTotal.array[i]) {
				const listIndexes = p_solver.findTightRegionsAdjacentFromRegion(i);
				if (listIndexes.length == 1) {
					indexPass = {category : HEYAWAKE_PASS_CATEGORY.SINGLE_REGION, value : i};
				} else {
					indexPass = {category : HEYAWAKE_PASS_CATEGORY.BLOCK_REGION, value : listIndexes};
				}
				indexList.push(indexPass); 
				valueList.push(p_solver.incertainity(indexPass));
			} else {
				valueList.push(-1); // There MUST be one of these per region.
			}
		}
		indexList.sort(function(p_index1, p_index2) {
			const val1 = valueList[p_index1.value] - valueList[p_index2.value];
			if (val1 == 0) {
				return p_index1.value - p_index2.value;
			} else {
				return val1;
			}
		});
		return indexList;
	}
}

namingCategoryClosure = function(p_solver) {
	return function(p_index) {
		switch(p_index.category) {
			case HEYAWAKE_PASS_CATEGORY.SINGLE_REGION : 
				return "Region "+ p_index.value + " (" + p_solver.getFirstSpaceRegion(p_index.value).x +" "+ p_solver.getFirstSpaceRegion(p_index.value).y + ")"; break;
			case HEYAWAKE_PASS_CATEGORY.BLOCK_REGION :
				return "Multi-region " + p_solver.reportIndexes(p_index.value); break;
		}
	}
}

// Index of several passed regions
SolverHeyawake.prototype.reportIndexes = function(p_listIndexes) {
	var answer = "[";
	var space = "";
	p_listIndexes.forEach(index => {
		answer += space + index + " (" + this.getFirstSpaceRegion(index).x + "," + this.getFirstSpaceRegion(index).y + ")";
		space = " ";
	});
	return answer + "]";
}

SolverHeyawake.prototype.incertainity = function(p_index) { // Can go below 0. The more it is, the more "uncertain" the region is. Arbitrary measurement.
	if (p_index.category == HEYAWAKE_PASS_CATEGORY.BLOCK_REGION) {
		return 500;
	} 
	const region = this.regions[p_index.value];
	if (region.notPlacedYet) {
		const closeds = region.notPlacedYet.CLOSEDs;
		const total = closeds + region.notPlacedYet.OPENs;
		var answer = 1;
		for (var i = total-closeds+1 ; i <= total; i++) {
			answer *= i;
		} 			
		for (var i = 2; i <= closeds; i++) {
			answer /= i;
		}
		// answer = C (closeds, total)
		// Now, privilege regions that have closed than opened.
		answer *= (region.notPlacedYet.OPENs*99 - region.notPlacedYet.CLOSEDs * 100);
		answer /= 100;
		return answer;// C(closeds, total)
	} else {
		// No Os and Xs. Skip it if possible.
		return 500 + 32768 + region.notDecidedYet;
	}
}

skipPassClosure = function(p_solver) {
	return function (p_index) {
		return p_solver.incertainity(p_index) > 500; // Arbitrary value
	}
}