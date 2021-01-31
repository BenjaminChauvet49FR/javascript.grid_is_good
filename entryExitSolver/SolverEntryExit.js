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
		// "closures this..."
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
			spaces : [],
			size : 0
		});
	}
	
	// Now that region data are created : 
	// Initialize all spaces by data (region + declare all of 'em open)
	var region;
	for(iy = 0 ; iy < this.yLength ; iy++) {
		for(ix = 0 ; ix < this.xLength ; ix++) {
			ir = this.regionGrid[iy][ix];
			region = this.regions[ir];
			region.spaces.push({x:ix,y:iy});
			if (!this.isBanned(ix, iy)) {
				this.setLinkSpace(ix, iy, LOOP_STATE.LINKED);
			}
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
	const generatedEvents = generateEventsForSpaceClosure(this)({x : p_x, y : p_y}); // Yeah, that method (returned by the closure) should have one single argument as it will be passed to multipass...
	this.passEvents(generatedEvents, this.methodSet, this.methodTools, {x : p_x, y : p_y}); 
}

SolverEntryExit.prototype.quickStart = function() {
	alert("To be defined");
}

// -------------------
// Closures

// Deductions to be done...

function namingCategoryClosure(p_solver) {
	return function (p_space) {
		const x = p_space.x;
		const y = p_space.y;
		var answer = x+","+y;
		return answer;
	}
}


