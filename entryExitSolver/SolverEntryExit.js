function SolverEntryExit(p_wallArray) {
	RegionLoopSolver.call(this);
	this.construct(p_wallArray);
}

SolverEntryExit.prototype = Object.create(RegionLoopSolver.prototype);
SolverEntryExit.prototype.constructor = SolverEntryExit;

function DummySolver() {
	return new SolverEntryExit(generateWallArray(1, 1));
}

SolverEntryExit.prototype.construct = function(p_wallArray) {
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.regionLoopSolverConstruct(p_wallArray, {		
		quickStartEventsPS : quickStartEventsClosure(this)
	})
	
	var region, ir;
	var severalNeighbors, direction;
	for(ir=0 ; ir < this.regions.length ; ir++) {
		this.regions[ir].endSpaces = [];
	};
	
	for(iy = 0 ; iy < this.yLength ; iy++) {
		for(ix = 0 ; ix < this.xLength ; ix++) {
			ir = this.regionArray[iy][ix];
			if (!this.isBanned(ix, iy)) {
				region = this.regions[ir];
				this.setLinkSpace(ix, iy, LOOP_STATE.LINKED);
				ir = this.regionArray[iy][ix];
				direction = DIRECTION.UNDECIDED;
				severalNeighbors = false;
				KnownDirections.forEach(dir => {
					if (this.neighborExists(ix, iy, dir) && this.regionArray[iy+DeltaY[dir]][ix+DeltaX[dir]] == ir) {
						if (direction != DIRECTION.UNDECIDED) {
							severalNeighbors = true;
						} else {
							direction = dir;	// TODO can it be optimized ? It is a forEach loop... (no way to break a forEach loop : https://stackoverflow.com/questions/2641347/short-circuit-array-foreach-like-calling-break )						
						}
					}
				});
				if (!severalNeighbors && (direction != DIRECTION.UNDECIDED)) {
					region.endSpaces.push({x : ix, y : iy, directionMyRegion : direction});
				}
				if (region.endSpaces.length == 3) {
					alert("Impossible puzzle : a region contains at least 3 dead end spaces");
				} // Note : should not happen if we try to resolve an already soluble puzzle
			}
		}
	}
	
	this.signalAllLinkedSpaces();
	
}

// -------------------
// Getters and setters

// -------------------
// Input methods

SolverEntryExit.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverEntryExit.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverEntryExit.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	this.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverEntryExit.prototype.emitPassRegionFromSpace = function(p_x, p_y) {
	const index = this.regionArray[p_y][p_x];
	if (index != WALLGRID.OUT_OF_REGIONS) {
		this.passLoop({category : LOOP_PASS_CATEGORY.REGION, index : index}); 
	}
}

SolverEntryExit.prototype.makeMultipass = function() {
	this.multipassLoop();
}

// -------------------
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function(p_listQSEvents) {
		p_listQSEvents.push({quickStartLabel : "Entry exit"});
		p_solver.regions.forEach(region => {
			if (region.endSpaces.length == 2) {
				p_solver.deductionsBuildPatrioticBorderNoEnds(p_listQSEvents, region);
			} else if (region.endSpaces.length == 1) {
				p_solver.deductionsBuildPatrioticBorderParity(p_listQSEvents, region);
			}
		});
	}
}

/**
Adds closed link events to all spaces outside the bound of the region
*/
SolverEntryExit.prototype.deductionsBuildPatrioticBorderNoEnds = function(p_listEventsToApply, p_region) {
	var x,y;
	const ir = p_region.index;
	const xEnd1 = p_region.endSpaces[0].x;
	const yEnd1 = p_region.endSpaces[0].y;
	const xEnd2 = p_region.endSpaces[1].x;
	const yEnd2 = p_region.endSpaces[1].y;
	p_region.spaces.forEach(space => {
		x = space.x;
		y = space.y;
		if ( ((x != xEnd1) || (y != yEnd1)) && ((x != xEnd2) || (y != yEnd2)) ) {
			this.otherRegionsDirectionsArray[y][x].forEach(dir => {
				p_listEventsToApply.push(new LinkEvent(x, y, dir, LOOP_STATE.CLOSED));
			});
		}
	});
	p_listEventsToApply.push(new LinkEvent(xEnd1, yEnd1, p_region.endSpaces[0].directionMyRegion, LOOP_STATE.LINKED)); 
	p_listEventsToApply.push(new LinkEvent(xEnd2, yEnd2, p_region.endSpaces[1].directionMyRegion, LOOP_STATE.LINKED));
}

SolverEntryExit.prototype.deductionsBuildPatrioticBorderParity = function(p_listEventsToApply, p_region) {
	const ir = p_region.index;
	const xEnd = p_region.endSpaces[0].x;
	const yEnd = p_region.endSpaces[0].y;
	const xEndMod2 = xEnd % 2;
	const yEndMod2 = yEnd % 2;
	const parityNumberSpaces = p_region.size % 2;
	p_region.spaces.forEach(space => {
		x = space.x;
		y = space.y;
		if (((x + xEndMod2 + y + yEndMod2) % 2 == parityNumberSpaces) && ((x != xEnd) || (y != yEnd))) {
			this.otherRegionsDirectionsArray[y][x].forEach(dir => {
				p_listEventsToApply.push(new LinkEvent(x, y, dir, LOOP_STATE.CLOSED));
			});
		}
	});
	p_listEventsToApply.push(new LinkEvent(xEnd, yEnd, p_region.endSpaces[0].directionMyRegion, LOOP_STATE.LINKED));
}