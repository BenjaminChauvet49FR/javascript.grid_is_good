const NOT_FORCED = -1;

LOOP_PASS_CATEGORY.REGION_REGIONALIN = -1;

function SolverRegionalin(p_wallGrid, p_regionIndications) {
	LoopSolver.call(this);
	this.construct(p_wallGrid, p_regionIndications);
}

SolverRegionalin.prototype = Object.create(LoopSolver.prototype);
SolverRegionalin.prototype.constructor = SolverRegionalin;

function DummySolver() {
	return new SolverRegionalin(generateWallArray(1,1), []);
}

SolverRegionalin.prototype.construct = function(p_wallArray, p_regionIndications) {
    this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	
	this.loopSolverConstruct( 
	{	
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsClosure(this),
		setSpaceClosedPSDeductions : setSpaceClosedPSDeductionsClosure(this),
		setSpaceLinkedPSDeductions : setSpaceLinkedPSDeductionsClosure(this),
		setSpaceLinkedPSAtomicDos : setSpaceLinkedPSAtomicDosClosure(this),
		setSpaceClosedPSAtomicDos : setSpaceClosedPSAtomicDosClosure(this),
		setSpaceLinkedPSAtomicUndos : setSpaceLinkedPSAtomicUndosClosure(this),
		setSpaceClosedPSAtomicUndos : setSpaceClosedPSAtomicUndosClosure(this),
		quickStartEventsPS : quickStartEventsClosure(this),
		generateEventsForPassPS : generateEventsForSpaceClosure(this),
		orderedListPassArgumentsPS : startingOrderedListPassArgumentsRegionalinClosure(this),
		namingCategoryPS : namingCategoryClosure(this),
		multipassPessimismPS : true,
		passDefineTodoPSMethod : function(p_categoryPass) {
			return true;
		}
	});
	
	this.setResolution.searchSolutionMethod = loopNaiveSearchClosure(this);

	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();

	this.declareClosedSpacesActing();
	const spacesByRegion = listSpacesByRegion(this.regionArray);
	this.regionsNumber = spacesByRegion.length;
	this.regions = [];
	for (var ir = 0 ; ir < this.regionsNumber ; ir++) {
		this.regions.push({
			spaces : spacesByRegion[ir],
			size : spacesByRegion[ir].length,
			number : NOT_FORCED,
		});
	}
		
	p_regionIndications.forEach(indic => {
		region = this.regions[indic.index];
		region.notClosedYet = indic.value;
		region.notLinkedYet = region.size - indic.value;
		region.number = indic.value;
	});
	
	// Purification (this is a wall grid puzzle)
	for (y = 0 ; y < this.yLength ; y++) {
		for (x = 0 ; x < this.xLength ; x++) {
			if (p_wallArray[y][x].state == WALLGRID.CLOSED) {
				this.banSpace(x, y);
			}
		}
	}
}

// -------------------
// Getters and setters

// For drawer & logs
SolverRegionalin.prototype.expectedNumberInRegion = function(p_ir) {
	return this.regions[p_ir].number;
}

SolverRegionalin.prototype.getSpaceCoordinates = function(p_ir, p_is) {
	return this.regions[p_ir].spaces[p_is];
}

SolverRegionalin.prototype.getTurning = function(p_x, p_y) {
	return this.turningArray[p_y][p_x];
}

// For intelligence (among others)
SolverRegionalin.prototype.getRegion = function(p_x, p_y) {	
	return this.regions[this.regionArray[p_y][p_x]];
}

// In setup... and deductions. You don't want to open a blocked space next to a closed one !
SolverRegionalin.prototype.getRegionSafe = function(p_x, p_y) {	
	const ir = this.regionArray[p_y][p_x];
	if (ir != WALLGRID.OUT_OF_REGIONS) {
		return this.regions[ir];
	}
	return null;
}

// -------------------
// Input methods

SolverRegionalin.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverRegionalin.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverRegionalin.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	this.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverRegionalin.prototype.emitPassRegionOrSpace = function(p_x, p_y) {
	var passIndex;
	if (this.getRegion(p_x, p_y).expectedNumberOfTurningsInRegion != NOT_FORCED) { 		
		passIndex = {passCategory : LOOP_PASS_CATEGORY.REGION_REGIONALIN, index : this.regionArray[p_y][p_x]};
	} else {
		passIndex = {passCategory : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y};
	}
	return this.passLoop(passIndex);
}

SolverRegionalin.prototype.makeMultipass = function() {
	this.multipassLoop();
}

// -------------------
// Atomic closures 

function setSpaceLinkedPSAtomicDosClosure(p_solver) { 
	return function(p_space) {
		const region = p_solver.getRegion(p_space.x, p_space.y);
		if (region.value != NOT_FORCED) {
			region.notLinkedYet--;
		}
	}
}

function setSpaceClosedPSAtomicDosClosure(p_solver) { // Same problem as country road : region index may be important in closedPSAtomicDos
	return function(p_space) {
		const region = p_solver.getRegionSafe(p_space.x, p_space.y);
		if (region != null && region.value != NOT_FORCED) {
			region.notClosedYet--;
		}
	}
}

function setSpaceLinkedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		const region = p_solver.getRegion(p_space.x, p_space.y);
		if (region.value != NOT_FORCED) {
			region.notLinkedYet++;
		}
	}
}

function setSpaceClosedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		const region = p_solver.getRegion(p_space.x, p_space.y);
		if (region.value != NOT_FORCED) {
			region.notClosedYet++;
		}
	}
}


// -------------------
// Deduction closures
function setSpaceClosedPSDeductionsClosure(p_solver) {
	return function(p_listEvents, p_eventToApply) {
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		p_solver.existingNeighborsCoors(x, y).forEach(coors => {
			if (p_solver.getRegionSafe(coors.x, coors.y) != null) {				
				p_listEvents.push(new SpaceEvent(coors.x, coors.y, LOOP_STATE.LINKED));
			}
		});
		const region = p_solver.getRegion(x, y);
		if (region.number != NOT_FORCED && region.notClosedYet == 0) {			
			p_listEvents = p_solver.fillingRegionDeductions(p_listEvents, region, LOOP_STATE.LINKED);
		}
		return p_listEvents;
	}
}

function setSpaceLinkedPSDeductionsClosure(p_solver) {
	return function(p_listEvents, p_eventToApply) {
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		const region = p_solver.getRegion(x, y);
		if (region.number != NOT_FORCED && region.notLinkedYet == 0) {			
			p_listEvents = p_solver.fillingRegionDeductions(p_listEvents, region, LOOP_STATE.CLOSED);
		}
		return p_listEvents;
	}
}

// Smartness from Yajilin and Koburin copy-pasted !
function setEdgeClosedDeductionsClosure(p_solver) {
	return function(p_listEvents, p_eventToApply) {
		const x = p_eventToApply.linkX;
		const y = p_eventToApply.linkY;
		const dir = p_eventToApply.direction;
		const dx = p_eventToApply.linkX + DeltaX[dir];
		const dy = p_eventToApply.linkY + DeltaY[dir];
		p_listEvents = p_solver.tryAndCloseBeforeAndAfter2ClosedDeductions(p_listEvents, x, y); 
		p_listEvents = p_solver.tryAndCloseBeforeAndAfter2ClosedDeductions(p_listEvents, dx, dy);
		return p_listEvents;
	}
}

SolverRegionalin.prototype.tryAndCloseBeforeAndAfter2ClosedDeductions = function(p_listEvents, p_x, p_y) {
	KnownDirections.forEach(dir => {
		if (this.getClosedEdges(p_x, p_y) == 2) {
			if (this.neighborExists(p_x, p_y, dir) && this.getLink(p_x, p_y, dir) != LOOP_STATE.CLOSED) {
				p_listEvents.push(new SpaceEvent(p_x + DeltaX[dir], p_y + DeltaY[dir], LOOP_STATE.LINKED));
			}
		}
	});
	return p_listEvents;
}

SolverRegionalin.prototype.fillingRegionDeductions = function(p_eventsList, p_region, p_stateToFillWith) {
	p_region.spaces.forEach(coors => {
		if (this.getLinkSpace(coors.x, coors.y) == LOOP_STATE.UNDECIDED) {
			p_eventsList.push(new SpaceEvent(coors.x, coors.y, p_stateToFillWith));
		}
	});
	return p_eventsList;
}

// -------------------
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function(p_QSeventsList) {
		p_QSeventsList.push({quickStartLabel : "Regionalin"});
		p_solver.regions.forEach(region => {
			if (region.number != NOT_FORCED) {				
				if (region.notClosedYet == 0) {
					p_solver.fillingRegionDeductions([], region, LOOP_STATE.LINKED).forEach(event_ => { 
						p_QSeventsList.push(event_);
					}); 
				} else if (region.notLinkedYet == 0) {
					p_solver.fillingRegionDeductions([], region, LOOP_STATE.CLOSED).forEach(event_ => {
						p_QSeventsList.push(event_);
					});
				}
			}
		}); 
		
		// Smartness
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			for (var x = 0 ; x < p_solver.xLength ; x++) {
				if (!p_solver.isBanned(x, y)) {
					p_QSeventsList = p_solver.tryAndCloseBeforeAndAfter2ClosedDeductions(p_QSeventsList, x, y);
				}
			}
		}
		
		return p_QSeventsList;
	}
}

// -------------------
// Pass & multipass

generateEventsForSpaceClosure = function(p_solver) {
	return function(p_index) {
		return p_solver.passLinkedVSNotLinkedRegion(p_index.index);
	}
}

// Note : order this in a soon future... (when performing solutions)
function startingOrderedListPassArgumentsRegionalinClosure(p_solver) {
	return function() {
		var answer = [];
		for (var i = 0 ; i < p_solver.regionsNumber ; i++) {
			if (p_solver.regions[i].notClosedYet) {				
				answer.push({passCategory : LOOP_PASS_CATEGORY.REGION_REGIONALIN, index : i}); 
			}
		}
		answer.sort(function(passIndex1, passIndex2) {
			const region1 = p_solver.regions[passIndex1.index]
			const region2 = p_solver.regions[passIndex2.index]
			const v1 = region1.notLinkedYet * region1.notClosedYet;
			const v2 = region2.notLinkedYet * region2.notClosedYet;
			const diff = v1 - v2;
			if (diff != 0) {
				return diff;
			}
			return passIndex1.index - passIndex2.index;
		});
		return answer;
	}
}

function namingCategoryClosure(p_solver) {
	return function (p_passIndex) {
		const regionSpace = p_solver.regions[p_passIndex.index].spaces[0];
		return "Region " + p_passIndex.index + " (" + regionSpace.x + "," + regionSpace.y + ")"; 
	}
}

SolverRegionalin.prototype.passLinkedVSNotLinkedRegion = function(p_index) {
	var answer = [];
	var x, y;
	this.regions[p_index].spaces.forEach(coors => {
		x = coors.x;
		y = coors.y;
		answer.push([new SpaceEvent(x, y, LOOP_STATE.CLOSED), new SpaceEvent(x, y, LOOP_STATE.LINKED)]);
	});
	return answer;
}