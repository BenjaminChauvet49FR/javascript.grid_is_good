SolverCountryRoad.prototype = Object.create(RegionLoopSolver.prototype);

function SolverCountryRoad(p_wallArray, p_indications) {
	RegionLoopSolver.call(this);
	this.construct(p_wallArray, p_indications);
}

SolverCountryRoad.prototype.constructor = SolverCountryRoad;

function DummySolver() {	
	return new SolverCountryRoad(generateWallArray(1,1), []);
}

SolverCountryRoad.prototype.construct = function(p_wallArray, p_indications) {
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.regionLoopSolverConstruct(p_wallArray, {
		setSpaceLinkedPSDeductions : setSpaceLinkedDeductionsClosure(this),
		setSpaceClosedPSDeductions : setSpaceClosedDeductionsClosure(this),
		setSpaceClosedPSAtomicDos : setSpaceClosedDosClosure(this),
		setSpaceLinkedPSAtomicDos : setSpaceLinkedDosClosure(this),
		setSpaceClosedPSAtomicUndos : setSpaceClosedUndosClosure(this),
		setSpaceLinkedPSAtomicUndos : setSpaceLinkedUndosClosure(this),
		PSQuickStart : quickStartClosure(this)
	});
	
	this.declareClosedSpacesActing(); 
	
	// Affecting regions
	this.regions.forEach(region => {
		forcedValue : null
	});
	p_indications.forEach(indic => {
		this.regions[indic.index].forcedValue = indic.value;
	});
	
	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();
	for(iy = 0;iy < this.yLength;iy++) {
		for(ix = 0;ix < this.xLength;ix++) {
			ir = this.regionArray[iy][ix];
			if (ir != WALLGRID.OUT_OF_REGIONS) {				
				region = this.regions[ir];
				if (region.forcedValue != null) {
					region.spacesNotLinkedYet = region.forcedValue;
					region.spacesNotClosedYet = region.size - region.forcedValue;
				} 
			}
		}
	}
}

// -------------------
// Getters

SolverCountryRoad.prototype.expectedNumberInRegion = function(p_ir) {
	return this.regions[p_ir].forcedValue;
}

// -------------------
// Input methods

SolverCountryRoad.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverCountryRoad.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverCountryRoad.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	this.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverCountryRoad.prototype.emitPassRegionFromSpace = function(p_x, p_y) {
	const index = this.regionArray[p_y][p_x];
	if (index != WALLGRID.OUT_OF_REGIONS) {
		this.passLoop({passCategory : LOOP_PASS_CATEGORY.REGION, index : index}); 
	}
}

SolverCountryRoad.prototype.makeMultipass = function() {
	this.multipassLoop();
}

// -------------------
// Doing & undoing

setSpaceClosedDosClosure = function(p_solver) {
	return function(p_space) {
		const ir = p_solver.getRegionIndex(p_space.x, p_space.y);
		if (ir != WALLGRID.OUT_OF_REGIONS) {			
			p_solver.regions[ir].spacesNotClosedYet--;
		}
	}
}

setSpaceLinkedDosClosure = function(p_solver) {
	return function(p_space) {
		const ir = p_solver.getRegionIndex(p_space.x, p_space.y);
		p_solver.regions[ir].spacesNotLinkedYet--;
	}
}

setSpaceClosedUndosClosure = function(p_solver) {
	return function(p_space) {
		const ir = p_solver.getRegionIndex(p_space.x, p_space.y);
		p_solver.regions[ir].spacesNotClosedYet++;
	}
}

setSpaceLinkedUndosClosure = function(p_solver) {
	return function(p_space) {
		const ir = p_solver.getRegionIndex(p_space.x, p_space.y);
		p_solver.regions[ir].spacesNotLinkedYet++;
	}
}

// -------------------
// Deductions

setSpaceLinkedDeductionsClosure = function(p_solver) {
	return function(p_listEvents, p_eventBeingApplied) {
		p_listEvents = p_solver.alertLinkedSpacesRegion(p_listEvents, p_solver.getRegionIndex(p_eventBeingApplied.x, p_eventBeingApplied.y));
		return p_listEvents;
	}	
}

setSpaceClosedDeductionsClosure = function(p_solver) {
	return function(p_listEvents, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		var dir;
		p_solver.otherRegionsDirectionsArray[y][x].forEach(dir => {
			p_listEvents.push(new SpaceEvent(x + DeltaX[dir], y + DeltaY[dir], LOOP_STATE.LINKED));
		});
		p_listEvents = p_solver.alertClosedSpacesRegion(p_listEvents, p_solver.getRegionIndex(x, y));
		return p_listEvents;
	}
}

SolverCountryRoad.prototype.alertLinkedSpacesRegion = function(p_listEvents, p_index) {
	const region = this.regions[p_index];
	var space, eventsYetToPlace;
	if (region.forcedValue && (region.spacesNotLinkedYet == 0)) {
		for (var i = 0 ; i < region.spaces.length ; i++) {
			space = region.spaces[i];
			eventsYetToPlace = region.spacesNotClosedYet;
			if (this.getLinkSpace(space.x, space.y) == LOOP_STATE.UNDECIDED) {
				eventsYetToPlace--;
				p_listEvents.push(new SpaceEvent(space.x, space.y, LOOP_STATE.CLOSED));
			}
		}
	}
	return p_listEvents;
}

// Copied over the above method !
SolverCountryRoad.prototype.alertClosedSpacesRegion = function(p_listEvents, p_index) {
	const region = this.regions[p_index];
	var space, eventsYetToPlace;
	if (region.forcedValue && (region.spacesNotClosedYet == 0)) {
		for (var i = 0 ; i < region.spaces.length ; i++) {
			space = region.spaces[i];
			eventsYetToPlace = region.spacesNotLinkedYet;
			if (this.getLinkSpace(space.x, space.y) == LOOP_STATE.UNDECIDED) {
				eventsYetToPlace--;
				p_listEvents.push(new SpaceEvent(space.x, space.y, LOOP_STATE.LINKED));
			}
		}
	}
	return p_listEvents;
}

// -----------
// Quickstart

quickStartClosure = function(p_solver) {
	return function() {
		p_solver.initiateQuickStart("Country road");
		var events = [];
		for (var i = 0; i < p_solver.regions.length ; i++) {
			events = p_solver.alertClosedSpacesRegion(events, i);
		}
		events.forEach(event_ => {
			p_solver.tryToApplyHypothesis(event_);
		});
		p_solver.terminateQuickStart();
	}
}

// -----------
// Passing

// Note : unlike Detour and Regionalin, this is a regional-loop puzzle. So loging on a region pass will cause to use the upper pass, missing the upper index. Too bad...