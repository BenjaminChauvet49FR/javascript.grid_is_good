function SolverTheoryLoop() {
	this.xLength = 10;
	this.yLength = 10;
	this.loopSolver = new LoopSolver();
    this.loopSolver.construct(generateWallArray(10,10), {});
}

// -------------------
// Input methods

SolverTheoryLoop.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.loopSolver.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverTheoryLoop.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.loopSolver.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverTheoryLoop.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	this.loopSolver.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverTheoryLoop.prototype.undoToLastHypothesis = function() {
	this.loopSolver.undoToLastHypothesis();
}