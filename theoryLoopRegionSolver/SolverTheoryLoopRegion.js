SolverTheoryLoopRegion.prototype = Object.create(RegionLoopSolver.prototype);

function SolverTheoryLoopRegion(p_wallArray) {
	RegionLoopSolver.call(this);
	this.construct(p_wallArray);
}

SolverTheoryLoopRegion.prototype.constructor = SolverTheoryLoopRegion;

SolverTheoryLoopRegion.prototype.construct = function(p_wallArray) {
	this.regionLoopSolverConstruct(p_wallArray, {});
}



// -------------------
// Input methods

SolverTheoryLoopRegion.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverTheoryLoopRegion.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverTheoryLoopRegion.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	this.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverTheoryLoopRegion.prototype.undo = function() {
	this.undoToLastHypothesis();
}