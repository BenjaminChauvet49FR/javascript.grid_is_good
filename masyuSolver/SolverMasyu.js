function SolverMasyu(p_symbolGrid) {
	this.construct(p_symbolGrid);
}

SolverMasyu.prototype.construct = function(p_symbolGrid) {
	this.loopSolver = new LoopSolver();
    this.xLength = p_symbolGrid[0].length;
	this.yLength = p_symbolGrid.length;
	this.loopSolver.construct(generateWallArray(this.xLength, this.yLength), {});
	this.pearlGrid = [];
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		this.pearlGrid.push([]);
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			if (p_symbolGrid[iy][ix] == SYMBOL_ID.WHITE) {
                this.pearlGrid[iy].push(PEARL.WHITE);
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