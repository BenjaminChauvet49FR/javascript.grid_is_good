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

	this.gridAstres = Grid_data(p_symbolsArray);
	// Affecting regions
	this.regions.forEach(region => {
		region.astre = ASTRE.UNDECIDED;
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

SolverMoonsun.prototype.getAstre = function(p_index) {
	return this.regions[p_index].astre;
}

SolverMoonsun.prototype.getAstreSpace = function(p_x, p_y) {
	switch(this.gridAstres.get(p_x, p_y)) {
		case SYMBOL_ID.MOON : return ASTRE.MOON; break;
		case SYMBOL_ID.SUN : return ASTRE.SUN; break;
		default : return ASTRE.UNDECIDED; break;
	}
}

SolverMoonsun.prototype.getOppositeAstreSpace = function(p_x, p_y) {
	switch(this.gridAstres.get(p_x, p_y)) {
		case SYMBOL_ID.MOON : return ASTRE.SUN; break;
		case SYMBOL_ID.SUN : return ASTRE.MOON; break;
		default : return ASTRE.UNDECIDED; break;
	}
}

function oppositeAstre(p_astre) {
	switch (p_astre) {
		case ASTRE.SUN : return ASTRE.MOON; break;
		case ASTRE.MOON : return ASTRE.SUN; break;
		default : return ASTRE.UNDECIDED; break;
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

// Only other events are AstreEvents
function otherAtomicDosClosure(p_solver) {
	return function(p_event) {
		const newAstre = p_event.astre;
		const oldAstre = p_solver.regions[p_event.index].astre;
		if (oldAstre == newAstre) {
			return EVENT_RESULT.HARMLESS;
		} else if (oldAstre != ASTRE.UNDECIDED) {
			return EVENT_RESULT.FAILURE;
		}
		p_solver.regions[p_event.index].astre = newAstre;
		return EVENT_RESULT.SUCCESS;
	}
}

function otherAtomicUndosClosure(p_solver) {
	return function(p_event) {
		p_solver.regions[p_event.index].astre = ASTRE.UNDECIDED;
	}
}

// -------------------
// Deductions

setSpaceLinkedDeductionsClosure = function(p_solver) {
	return function(p_listEvents, p_eventBeingApplied) {
		// If space is moon / sun : set region to moon / sun
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const astre = p_solver.getAstreSpace(x, y);
		if (astre != ASTRE.UNDECIDED) {
			p_listEvents.push(new AstreEvent(p_solver.regionArray[y][x], astre));
		}
		return p_listEvents;
	}	
}

setSpaceClosedDeductionsClosure = function(p_solver) {
	return function(p_listEvents, p_eventBeingApplied) {
		// If space is moon / sun : set region to sun / moon
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const astre = p_solver.getAstreSpace(x, y);
		if (astre != ASTRE.UNDECIDED) {
			p_listEvents.push(new AstreEvent(p_solver.regionArray[y][x], oppositeAstre(astre)));
		}
		return p_listEvents;
	}
}

setBorderLinkedDeductionsClosure = function(p_solver) {
	return function(p_listEvents, p_index1, p_index2) {
		switch (p_solver.getAstre(p_index1)) {
			case ASTRE.MOON : p_listEvents.push(new AstreEvent(p_index2, ASTRE.SUN)); break;
			case ASTRE.SUN : p_listEvents.push(new AstreEvent(p_index2, ASTRE.MOON)); break;
		}
		switch (p_solver.getAstre(p_index2)) {
			case ASTRE.MOON : p_listEvents.push(new AstreEvent(p_index1, ASTRE.SUN)); break;
			case ASTRE.SUN : p_listEvents.push(new AstreEvent(p_index1, ASTRE.MOON)); break;
		}
		return p_listEvents;
	}	
}

otherDeductionsClosure = function(p_solver) {
	// Must be an astre event
	return function(p_listEvents, p_eventBeingApplied) {
		const region = p_solver.regions[p_eventBeingApplied.index];
		myAstre = p_eventBeingApplied.astre;
		otherAstre = oppositeAstre(myAstre);
		moonState = (myAstre == ASTRE.MOON ? LOOP_STATE.LINKED : LOOP_STATE.CLOSED);
		sunState = (myAstre == ASTRE.SUN ? LOOP_STATE.LINKED : LOOP_STATE.CLOSED);
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
				p_listEvents.push(new AstreEvent(neighborIndex, otherAstre));
			} 
			if (p_solver.getAstre(neighborIndex) == myAstre) {
				p_listEvents.push(new RegionJunctionEvent(neighborIndex, p_eventBeingApplied.index, BORDER_STATE.CLOSED));
			}
		});
		// For each region space, for each direction adjacent, check if it has the same astre as the region. If yes, place a wall between them.
		region.spaces.forEach(coors => {
			x = coors.x;
			y = coors.y;
			p_solver.otherRegionsDirectionsArray[y][x].forEach(dir => {
				if (p_solver.getAstreSpace(x + DeltaX[dir], y + DeltaY[dir]) == myAstre) {
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
				p_QSeventsList.push(new AstreEvent(i, ASTRE.MOON));
			} else if (p_solver.regions[i].moonCoors.length == 0) {
				p_QSeventsList.push(new AstreEvent(i, ASTRE.SUN));
			}
		}
		var x, y, astre1, astre2, wall;
		// Close links between spaces (with different astres and within the same region) OR (with same astres and within different regions)
		// Note : doesn't take banned spaces into account !
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			for (var x = 0 ; x < p_solver.xLength ; x++) {
				[DIRECTION.RIGHT, DIRECTION.DOWN].forEach(dir => {
					if (p_solver.neighborExists(x, y, dir)) {
						astre1 = p_solver.gridAstres.get(x, y);
						if (astre1 != null) {
							astre2 = p_solver.gridAstres.get(x + DeltaX[dir], y + DeltaY[dir]);
							if (astre2 != null) {
								wall = p_solver.gridWall.getWall(x, y, dir);
								if ((astre1 == astre2) == (wall == WALLGRID.CLOSED)) { 
									// Same astres but different regions OR different astres but same regions
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
		// If it's not an already treated event then it's an astre event
		return commonComparison([p_event1.index, p_event1.astre], [p_event2.index, p_event2.astre]);
	}
}