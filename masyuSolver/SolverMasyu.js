function SolverMasyu(p_symbolGrid) {
	this.construct(p_symbolGrid);
}

SolverMasyu.prototype.construct = function(p_symbolGrid) {
	this.loopSolver = new LoopSolver();
    this.xLength = p_symbolGrid[0].length;
	this.yLength = p_symbolGrid.length;
	this.loopSolver.construct(generateWallArray(this.xLength, this.yLength), {});
	this.loopSolver.setPuzzleSpecificMethods({
		setEdgeLinkedPSDeductions : setEdgeLinkedDeductionsClosure(this),
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsClosure(this)
	});
	this.pearlGrid = [];
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		this.pearlGrid.push([]);
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			if (p_symbolGrid[iy][ix] == SYMBOL_ID.WHITE) {
                this.pearlGrid[iy].push(PEARL.WHITE);
				this.loopSolver.setLinkSpace(ix, iy, LOOP_STATE.LINKED);
            } else if (p_symbolGrid[iy][ix] == SYMBOL_ID.BLACK) {
                this.pearlGrid[iy].push(PEARL.BLACK);
            } else {
                this.pearlGrid[iy].push(PEARL.EMPTY);
            }
		}
	}
}

// -------------------
// Getters and setters

SolverMasyu.prototype.getPearl = function(p_x, p_y) {
	return this.pearlGrid[p_y][p_x];
}

// -------------------
// Input methods

SolverMasyu.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.loopSolver.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverMasyu.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.loopSolver.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverMasyu.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	this.loopSolver.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverMasyu.prototype.undoToLastHypothesis = function() {
	this.loopSolver.undoToLastHypothesis();
}

// -------------------
// Closures

setEdgeLinkedDeductionsClosure = function(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
		x = p_eventBeingApplied.linkX;
		y = p_eventBeingApplied.linkY;
		dir = p_eventBeingApplied.direction;
		dx = p_eventBeingApplied.dual().linkX;
		dy = p_eventBeingApplied.dual().linkY;
		fwdX = dx+deltaX[dir]; // The space forward the link (remember : a link is considered, not a space)
		fwdY = dy+deltaY[dir];
		bwdX = x-deltaX[dir]; // The space when going backward the link 
		bwdY = y-deltaY[dir];

		ddir = p_eventBeingApplied.dual().direction;
		odir = oppositeDirection[dir];
		p_eventList = p_solver.testWhitePearlSpace(p_eventList, x, y, dir, LOOP_STATE.LINKED); // Test white pearl here
		p_eventList = p_solver.testWhitePearlSpace(p_eventList, dx, dy, ddir, LOOP_STATE.LINKED); // Test white pearl on next space
		if (p_solver.loopSolver.neighborExists(dx, dy, dir) && p_solver.pearlGrid[fwdY][fwdX] == PEARL.WHITE) { // Test white spaces 2 spaces forward
			p_eventList = p_solver.testExpansionWhitePearlSpace(p_eventList, fwdX, fwdY, odir);
		}
		if (p_solver.loopSolver.neighborExists(x, y, odir) && p_solver.pearlGrid[bwdY][bwdX] == PEARL.WHITE) { // Test white spaces in the space behind
			p_eventList = p_solver.testExpansionWhitePearlSpace(p_eventList, bwdX, bwdY, dir);
		}
		return p_eventList;
	}
}
setEdgeClosedDeductionsClosure = function(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
		x = p_eventBeingApplied.linkX;
		y = p_eventBeingApplied.linkY;
		dir = p_eventBeingApplied.direction;
		dx = p_eventBeingApplied.dual().linkX;
		dy = p_eventBeingApplied.dual().linkY;
		ddir = p_eventBeingApplied.dual().direction;
		p_eventList = p_solver.testWhitePearlSpace(p_eventList, x, y, dir, LOOP_STATE.CLOSED);
		p_eventList = p_solver.testWhitePearlSpace(p_eventList, dx, dy, ddir, LOOP_STATE.CLOSED);
		return p_eventList;
	}
}

// Test if we are on a white pearl space and make a link of the same state accordingly
SolverMasyu.prototype.testWhitePearlSpace = function(p_eventList, p_x, p_y, p_dir, p_state) {
	if (this.pearlGrid[p_y][p_x] == PEARL.WHITE) {
		if (!this.loopSolver.neighborExists(p_x, p_y, oppositeDirection[p_dir])) {
			if (p_state == LOOP_STATE.LINKED) {
				p_eventList.push(new FailureEvent());
			}
		} else {
			if (p_state == LOOP_STATE.LINKED) {
				p_eventList = this.testExpansionWhitePearlSpace(p_eventList, p_x, p_y, p_dir);
			}			
			p_eventList.push(new LinkEvent(p_x, p_y, oppositeDirection[p_dir], p_state));
		}
	}
	return p_eventList;
}

// Prerequistes : p_x, p_y = coordinates of a white space + we are making deductions of a linked link. Tests if the pearl is taken into a loop of at least 3 adjacent spaces in the direction.
SolverMasyu.prototype.testExpansionWhitePearlSpace = function(p_eventList, p_x, p_y, p_dir) {
	const bx = p_x-deltaX[p_dir];
	const by = p_y-deltaY[p_dir];
	const x = p_x; // b = "backward", f = "forward"
	const y = p_y;
	const fx = p_x+deltaX[p_dir];
	const fy = p_y+deltaY[p_dir];
	const antiDir = oppositeDirection[p_dir];
	if (this.loopSolver.neighborExists(bx, by, antiDir) &&
	    this.loopSolver.neighborExists(fx, fy, p_dir) && 
		this.loopSolver.getLink(x, y, antiDir) == LOOP_STATE.LINKED &&
		this.loopSolver.getLink(x, y, p_dir) == LOOP_STATE.LINKED ) {
		if (this.loopSolver.getLink(bx, by, antiDir) == LOOP_STATE.LINKED) {
			p_eventList.push(new LinkEvent(fx, fy, p_dir, LOOP_STATE.CLOSED));
		} else if (this.loopSolver.getLink(fx, fy, p_dir) == LOOP_STATE.LINKED) {
			p_eventList.push(new LinkEvent(bx, by, antiDir, LOOP_STATE.CLOSED));
		}
	}
	return p_eventList;
}


