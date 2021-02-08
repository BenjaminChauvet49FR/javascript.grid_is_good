function SolverEntryExit(p_wallArray) {
	LoopSolver.call(this);
	this.construct(p_wallArray);
}

SolverEntryExit.prototype = Object.create(LoopSolver.prototype);
SolverEntryExit.prototype.constructor = SolverEntryExit;

SolverEntryExit.prototype.construct = function(p_wallArray) {
	this.loopSolverConstruct(p_wallArray, {});
	this.activateClosedSpaces();
	this.setPuzzleSpecificMethods({
		PSQuickStart : quickStartClosure(this)
	});
	this.methodTools = {comparisonMethod : comparisonLoopEventsMethod, copyMethod : copyLoopEventMethod,  argumentToLabelMethod : namingCategoryClosure(this)};
	this.numberGrid = [];
	this.gridWall = WallGrid_data(p_wallArray);
	
	
	this.regionGrid = this.gridWall.toRegionGrid();

	// Initialize the number of regions
	var lastRegionNumber = 0;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			lastRegionNumber = Math.max(this.regionGrid[iy][ix],lastRegionNumber);
		}
	}
	this.regionsNumber = lastRegionNumber+1;
	
	var ir;
	this.regions = [];
	for(ir=0 ; ir<this.regionsNumber ; ir++) {
		this.regions.push({
			index : ir,
			spaces : [],
			size : 0,
			endSpaces : [] //Only in regions of size >= 2 : spaces that have only one neighbor in the same region
		});
	}
	
	// Now that region data are created : 
	// Initialize all spaces by data (region + declare all of 'em open)
	var region, ri;
	var countNeighborsInRegion;
	for(iy = 0 ; iy < this.yLength ; iy++) {
		for(ix = 0 ; ix < this.xLength ; ix++) {
			ir = this.regionGrid[iy][ix];
			region = this.regions[ir];
			region.spaces.push({x:ix,y:iy});
			if (!this.isBanned(ix, iy)) {
				this.setLinkSpace(ix, iy, LOOP_STATE.LINKED);
				countNeighborsInRegion = 0;
				ri = this.regionGrid[iy][ix];
				LoopKnownDirections.forEach(dir => {
					if (this.neighborExists(ix, iy, dir) && this.regionGrid[iy+DeltaY[dir]][ix+DeltaX[dir]] == ri) {
						countNeighborsInRegion++;
						// TODO : optimize this loop to stop at countNeighborsInRegion = 2
					}
				});
				if (countNeighborsInRegion == 1) {
					region.endSpaces.push({x : ix, y : iy});
				}
			}
			if (region.endSpaces.length == 3) {
				alert("Impossible puzzle : a region contains at least 3 dead end spaces");
			} // Note : should not happen if we try to resolve an already soluble puzzle
		}
	}
	// TODO : other management of banned spaces ?
	
	// Initialize datas dependant to region size (now that all region spaces are known) such as X to place
	// Also initialize regions sizes for shortcut
	for(ir = 0 ; ir < this.regionsNumber ; ir++) {
		this.regions[ir].size = this.regions[ir].spaces.length;
	}
	
	this.signalAllOpenSpaces();
	
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

SolverEntryExit.prototype.passSpace = function(p_x, p_y) {
	/*const generatedEvents = generateEventsForSpaceClosure(this)({x : p_x, y : p_y}); // Yeah, that method (returned by the closure) should have one single argument as it will be passed to multipass...
	this.passEvents(generatedEvents, this.methodSet, this.methodTools, {x : p_x, y : p_y});*/
	alert("To be done");
}

// -------------------
// Quickstart

quickStartClosure = function(p_solver) {
	return function() { 
		p_solver.initiateQuickStart("Entry exit");
		var eventsToApply = [];
		var ir;
		p_solver.regions.forEach(region => {
			if (region.endSpaces.length == 2) {
				eventsToApply = p_solver.buildPatrioticBorderNoEnds(eventsToApply, region);
			} else if (region.endSpaces.length == 1) {
				eventsToApply = p_solver.buildPatrioticBorderParity(eventsToApply, region, ix, iy);
			}
		});
		eventsToApply.forEach(event_ => {
			this.tryToApplyHypothesis(event_, this.methodSetDeductions);
		});
		p_solver.terminateQuickStart();
	}
}

/**
Adds closed link events to all spaces outside the bound of the region
*/
SolverEntryExit.prototype.buildPatrioticBorderNoEnds = function(p_eventsToApply, p_region) {
	var x,y;
	const ir = p_region.index;
	const xBan1 = p_region.endSpaces[0].x;
	const yBan1 = p_region.endSpaces[0].y;
	const xBan2 = p_region.endSpaces[1].x;
	const yBan2 = p_region.endSpaces[1].y;
	p_region.spaces.forEach(space => {
		x = space.x;
		y = space.y;
		if ( ((x != xBan1) || (y != yBan1)) && ((x != xBan2) || (y != yBan2)) ) {
			LoopKnownDirections.forEach(dir => {
				if (this.neighborExists(x, y, dir) && this.regionGrid[y+DeltaY[dir]][x+DeltaX[dir]] != ir) {
					p_eventsToApply.push(new LinkEvent(x, y, dir, LOOP_STATE.CLOSED));
				}
			});
		}
	});
	return p_eventsToApply;
}

SolverEntryExit.prototype.buildPatrioticBorderParity = function(p_eventsToApply, p_region, p_x, p_y) {
	const ir = p_region.index;
	const xEnd = p_region.endSpaces[0].x %2;
	const yEnd = p_region.endSpaces[0].y %2;
	const parityNumberSpaces = p_region.size % 2;
	p_region.spaces.forEach(space => {
		x = space.x;
		y = space.y;
		if ((x+xEnd+y+yEnd %2 == parityNumberSpaces) && ((x != xEnd) || (y != yEnd))) {
			LoopKnownDirections.forEach(dir => {
				if (this.neighborExists(x, y, dir) && this.regionGrid[y+DeltaY[dir]][x+DeltaX[dir]] != ir) {
					p_eventsToApply.push(new LinkEvent(x, y, dir, LOOP_STATE.CLOSED));
				}
			});
		}
	});
	return p_eventsToApply;
}

// -------------------
// Closures

/*function setEdgeLinkedEntryExitDeductionsClosure(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
		
	}
}*/

// -------------------
// Passing

function namingCategoryClosure(p_solver) {
	return function (p_space) {
		const x = p_space.x;
		const y = p_space.y;
		var answer = x+","+y;
		return answer;
	}
}



