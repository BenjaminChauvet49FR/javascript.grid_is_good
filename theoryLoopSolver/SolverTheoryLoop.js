SolverTheoryLoop.prototype = Object.create(LoopSolver.prototype);

function SolverTheoryLoop(p_symbolGrid) {
	LoopSolver.call(this);
	this.construct(p_symbolGrid);
}

SolverTheoryLoop.prototype.constructor = SolverTheoryLoop;

function DummySolver() {
	return new SolverTheoryLoop(generateWallArray(1, 1));
}

SolverTheoryLoop.prototype.construct = function(p_symbolGrid) {
	this.loopSolverConstruct(generateWallArray(p_symbolGrid.length, p_symbolGrid[0].length), {});
}

// -------------------
// Input methods

SolverTheoryLoop.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverTheoryLoop.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverTheoryLoop.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	this.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverTheoryLoop.prototype.undo = function() {
	this.undoToLastHypothesis();
}