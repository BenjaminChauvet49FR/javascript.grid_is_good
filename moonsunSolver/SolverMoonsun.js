// Setup

SolverMoonsun.prototype = Object.create(RegionLoopSolver.prototype);

function SolverMoonsun(p_wallArray, p_symbolsArray) {
	RegionLoopSolver.call(this);
	this.construct(p_wallArray, p_symbolsArray);
}

SolverMoonsun.prototype.constructor = SolverMoonsun;

function DummySolver() {	
	return new SolverMoonsun(generateWallArray(1, 1), [[null]]);
}

SolverMoonsun.prototype.construct = function(p_wallArray, p_symbolsArray) {
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;		
	this.regionLoopSolverConstruct(p_wallArray, {
		otherPSAtomicDos : otherAtomicDosClosure(this),
		otherPSAtomicUndos : otherAtomicUndosClosure(this),
		setSpaceClosedPSDeductions : setSpaceClosedDeductionsClosure(this),
		setSpaceLinkedPSDeductions : setSpaceLinkedDeductionsClosure(this),
		setBorderLinkedPSDeductions : setBorderLinkedDeductionsClosure(this),
		otherPSDeductions : otherDeductionsClosure(this),
		quickStartEventsPS : quickStartEventsClosure(this),
		comparisonPS : comparisonMoonsunEventsClosure(this)
	});

	this.gridLuminaries = Grid_data(p_symbolsArray);
	// Affecting regions
	this.regions.forEach(region => {
		region.luminary = LUMINARY.UNDECIDED;
		region.moonCoors = [];
		region.sunCoors = [];
	});
	
	var x, y;
	for (y = 0 ; y < this.yLength ; y++) {
		for (x = 0 ; x < this.xLength ; x++) {
			switch (p_symbolsArray[y][x]) {
				case (SYMBOL_ID.MOON) : this.regions[this.regionArray[y][x]].moonCoors.push({x : x, y : y}); break;
				case (SYMBOL_ID.SUN) : this.regions[this.regionArray[y][x]].sunCoors.push({x : x, y : y});  break;
			}
		}
	}
	
}

// -------------------
// Getters

SolverMoonsun.prototype.getLuminary = function(p_index) {
	return this.regions[p_index].luminary;
}

SolverMoonsun.prototype.getLuminarySpace = function(p_x, p_y) {
	switch(this.gridLuminaries.get(p_x, p_y)) {
		case SYMBOL_ID.MOON : return LUMINARY.MOON; break;
		case SYMBOL_ID.SUN : return LUMINARY.SUN; break;
		default : return LUMINARY.UNDECIDED; break;
	}
}

SolverMoonsun.prototype.getOppositeLuminarySpace = function(p_x, p_y) {
	switch(this.gridLuminaries.get(p_x, p_y)) {
		case SYMBOL_ID.MOON : return LUMINARY.SUN; break;
		case SYMBOL_ID.SUN : return LUMINARY.MOON; break;
		default : return LUMINARY.UNDECIDED; break;
	}
}

function oppositeLuminary(p_luminary) {
	switch (p_luminary) {
		case LUMINARY.SUN : return LUMINARY.MOON; break;
		case LUMINARY.MOON : return LUMINARY.SUN; break;
		default : return LUMINARY.UNDECIDED; break;
	}
}

// -------------------
// Input methods

SolverMoonsun.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverMoonsun.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverMoonsun.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	this.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverMoonsun.prototype.emitPassRegionFromSpace = function(p_x, p_y) {
	const index = this.regionArray[p_y][p_x];
	if (index != WALLGRID.OUT_OF_REGIONS) {
		this.passLoop({passCategory : LOOP_PASS_CATEGORY.REGION, index : index}); 
	}
}

SolverMoonsun.prototype.makeMultipass = function() {
	this.multipassLoop();
}

// -------------------
// Doing & undoing

// Only other events are LuminaryEvents
function otherAtomicDosClosure(p_solver) {
	return function(p_event) {
		const newLuminary = p_event.luminary;
		const oldLuminary = p_solver.regions[p_event.index].luminary;
		if (oldLuminary == newLuminary) {
			return EVENT_RESULT.HARMLESS;
		} else if (oldLuminary != LUMINARY.UNDECIDED) {
			return EVENT_RESULT.FAILURE;
		}
		p_solver.regions[p_event.index].luminary = newLuminary;
		return EVENT_RESULT.SUCCESS;
	}
}

function otherAtomicUndosClosure(p_solver) {
	return function(p_event) {
		p_solver.regions[p_event.index].luminary = LUMINARY.UNDECIDED;
	}
}

// -------------------
// Deductions

setSpaceLinkedDeductionsClosure = function(p_solver) {
	return function(p_listEvents, p_eventBeingApplied) {
		// If space is moon / sun : set region to moon / sun
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const luminary = p_solver.getLuminarySpace(x, y);
		if (luminary != LUMINARY.UNDECIDED) {
			p_listEvents.push(new LuminaryEvent(p_solver.regionArray[y][x], luminary));
		}
		return p_listEvents;
	}	
}

setSpaceClosedDeductionsClosure = function(p_solver) {
	return function(p_listEvents, p_eventBeingApplied) {
		// If space is moon / sun : set region to sun / moon
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const luminary = p_solver.getLuminarySpace(x, y);
		if (luminary != LUMINARY.UNDECIDED) {
			p_listEvents.push(new LuminaryEvent(p_solver.regionArray[y][x], oppositeLuminary(luminary)));
		}
		return p_listEvents;
	}
}

setBorderLinkedDeductionsClosure = function(p_solver) {
	return function(p_listEvents, p_index1, p_index2) {
		switch (p_solver.getLuminary(p_index1)) {
			case LUMINARY.MOON : p_listEvents.push(new LuminaryEvent(p_index2, LUMINARY.SUN)); break;
			case LUMINARY.SUN : p_listEvents.push(new LuminaryEvent(p_index2, LUMINARY.MOON)); break;
		}
		switch (p_solver.getLuminary(p_index2)) {
			case LUMINARY.MOON : p_listEvents.push(new LuminaryEvent(p_index1, LUMINARY.SUN)); break;
			case LUMINARY.SUN : p_listEvents.push(new LuminaryEvent(p_index1, LUMINARY.MOON)); break;
		}
		return p_listEvents;
	}	
}

otherDeductionsClosure = function(p_solver) {
	// Must be a luminary event
	return function(p_listEvents, p_eventBeingApplied) {
		const region = p_solver.regions[p_eventBeingApplied.index];
		myLuminary = p_eventBeingApplied.luminary;
		otherLuminary = oppositeLuminary(myLuminary);
		moonState = (myLuminary == LUMINARY.MOON ? LOOP_STATE.LINKED : LOOP_STATE.CLOSED);
		sunState = (myLuminary == LUMINARY.SUN ? LOOP_STATE.LINKED : LOOP_STATE.CLOSED);
		region.moonCoors.forEach(coors => {
			p_listEvents.push(new SpaceEvent(coors.x, coors.y, moonState));
		});
		region.sunCoors.forEach(coors => {
			p_listEvents.push(new SpaceEvent(coors.x, coors.y, sunState));
		});
		var borderState;
		region.neighboringRegions.forEach(neighborIndex => {
			borderState = p_solver.getBorder(p_eventBeingApplied.index, neighborIndex).state;
			if (borderState == BORDER_STATE.LINKED) {
				p_listEvents.push(new LuminaryEvent(neighborIndex, otherLuminary));
			} 
			if (p_solver.getLuminary(neighborIndex) == myLuminary) {
				p_listEvents.push(new RegionJunctionEvent(neighborIndex, p_eventBeingApplied.index, BORDER_STATE.CLOSED));
			}
		});
		// For each region space, for each direction adjacent, check if it has the same luminary as the region. If yes, place a wall between them.
		region.spaces.forEach(coors => {
			x = coors.x;
			y = coors.y;
			p_solver.otherRegionsDirectionsArray[y][x].forEach(dir => {
				if (p_solver.getLuminarySpace(x + DeltaX[dir], y + DeltaY[dir]) == myLuminary) {
					p_listEvents.push(new LinkEvent(x, y, dir, LOOP_STATE.CLOSED));
				}
			});
		});
		return p_listEvents;
	}
}

// -----------
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function(p_QSeventsList) {
		p_QSeventsList.push({quickStartLabel : "Moonsun"});
		for (var i = 0 ; i < p_solver.regions.length ; i++) {
			if (p_solver.regions[i].sunCoors.length == 0) {
				p_QSeventsList.push(new LuminaryEvent(i, LUMINARY.MOON));
			} else if (p_solver.regions[i].moonCoors.length == 0) {
				p_QSeventsList.push(new LuminaryEvent(i, LUMINARY.SUN));
			}
		}
		var x, y, luminary1, luminary2, wall;
		// Close links between spaces (with different luminaries and within the same region) OR (with same luminaries and within different regions)
		// Note : doesn't take banned spaces into account !
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			for (var x = 0 ; x < p_solver.xLength ; x++) {
				[DIRECTION.RIGHT, DIRECTION.DOWN].forEach(dir => {
					if (p_solver.neighborExists(x, y, dir)) {
						luminary1 = p_solver.gridLuminaries.get(x, y);
						if (luminary1 != null) {
							luminary2 = p_solver.gridLuminaries.get(x + DeltaX[dir], y + DeltaY[dir]);
							if (luminary2 != null) {
								wall = p_solver.gridWall.getWall(x, y, dir);
								if ((luminary1 == luminary2) == (wall == WALLGRID.CLOSED)) { 
									// Same luminaries but different regions OR different luminaries but same regions
									p_QSeventsList.push(new LinkEvent(x, y, dir, LOOP_STATE.CLOSED));
								} 
							}
						}
					}
				})
			}
		}		
		return p_QSeventsList;
	}
}

// -------------
// Pass

comparisonMoonsunEventsClosure = function(p_methodPS) {
	return function(p_event1, p_event2) {
		// If it's not an already treated event then it's a luminary event
		return commonComparison([p_event1.index, p_event1.luminary], [p_event2.index, p_event2.luminary]);
	}
}