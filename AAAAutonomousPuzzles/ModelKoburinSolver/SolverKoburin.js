function SolverKoburin(p_numberGrid) {
	this.construct(p_numberGrid);
}

SolverKoburin.prototype.construct = function(p_numberGrid) {
	this.loopSolver = new LoopSolver();
    this.xLength = p_numberGrid[0].length;
	this.yLength = p_numberGrid.length;
	this.loopSolver.construct(generateWallArray(this.xLength, this.yLength), {});
	this.loopSolver.setPuzzleSpecificMethods({
		setSpaceClosedPSDeductions : setSpaceClosedPSDeductionsClosure(this)
	});
	// comparisonLoopEvents and copyLoopEventMethod defined in LoopSolver
	this.methodTools = {comparisonMethod : comparisonLoopEventsMethod, copyMethod : copyLoopEventMethod,  argumentToLabelMethod : namingCategoryClosure(this)};
	this.numberGrid = [];
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		this.numberGrid.push([]);
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			if (p_numberGrid[iy][ix] != null) {
				this.loopSolver.banSpace(ix, iy);
            } 
			this.numberGrid[iy].push(p_numberGrid[iy][ix]);
		}
	}
}

// -------------------
// Getters and setters

SolverKoburin.prototype.getNumber = function(p_x, p_y) {
	return this.numberGrid[p_y][p_x];
}

// -------------------
// Input methods

SolverKoburin.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.loopSolver.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverKoburin.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.loopSolver.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverKoburin.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	this.loopSolver.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverKoburin.prototype.undoToLastHypothesis = function() {
	this.loopSolver.undoToLastHypothesis();
}

SolverKoburin.prototype.passSpace = function(p_x, p_y) {
	const generatedEvents = generateEventsForSpaceClosure(this)({x : p_x, y : p_y}); // Yeah, that method (returned by the closure) should have one single argument as it will be passed to multipass...
	this.loopSolver.generalSolver.passEvents(generatedEvents, this.loopSolver.methodSet, this.methodTools, {x : p_x, y : p_y}); 
}

SolverKoburin.prototype.quickStart = function() { //Warning : this quickstart assumes that the puzzle does not have white pearls in corners
	alert("To be defined");
}

// -------------------
// Closures

function setSpaceClosedPSDeductionsClosure(p_solver) {
	return function(p_listEvents, p_eventToApply) {
		return p_listEvents;
	}
}

// -------------------
// Passing

/* generateEventsForSpaceClosure = function(p_solver) {
	return function(p_space) {
		switch (p_solver.pearlGrid[p_space.y][p_space.x]) {
			case PEARL.WHITE : return generateWhitePearlPassEvents(p_space.x, p_space.y); break;
			case PEARL.BLACK : return generateBlackPearlPassEvents(p_space.x, p_space.y); break;
		}
		return [];
	}
}

// Precondition : the space has a white pearl and is not on the edge of fields...
function generateWhitePearlPassEvents (p_x, p_y) {
	return [[new LinkEvent(p_x, p_y, LOOP_DIRECTION.RIGHT, LOOP_STATE.LINKED), new LinkEvent(p_x, p_y, LOOP_DIRECTION.DOWN, LOOP_STATE.LINKED)]];
} 

// Precondition : the space has a black pearl and is not on the edge nor one space away from the edge of fields...
function generateBlackPearlPassEvents (p_x, p_y) {
	var answer = [];
	return [[new CompoundCornerLinkEvent(p_x, p_y, LOOP_DIRECTION.RIGHT, LOOP_DIRECTION.DOWN, LOOP_STATE.LINKED), 
			 new CompoundCornerLinkEvent(p_x, p_y, LOOP_DIRECTION.LEFT, LOOP_DIRECTION.DOWN, LOOP_STATE.LINKED), 
			 new CompoundCornerLinkEvent(p_x, p_y, LOOP_DIRECTION.LEFT, LOOP_DIRECTION.UP, LOOP_STATE.LINKED), 
			 new CompoundCornerLinkEvent(p_x, p_y, LOOP_DIRECTION.RIGHT, LOOP_DIRECTION.UP, LOOP_STATE.LINKED)]];
	return answer;
}*/

function namingCategoryClosure(p_solver) {
	return function (p_space) {
		const x = p_space.x;
		const y = p_space.y;
		var answer = x+","+y;
		return answer;
	}
}


