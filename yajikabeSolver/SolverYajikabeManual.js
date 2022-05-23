SolverYajikabe.prototype.constructManual = function() {
	this.methodsSetDeductionsManual = {
		applyEventMethod : applyManualClosure(this),
		undoEventMethod : undoManualClosure(this),
		areOppositeEventsMethod : areOppositeEventsMethod
	}
}

// Precondition : x, y of the event not banned !
function applyManualClosure(p_solver) {
	return function(p_eventToApply) {
		const former = p_solver.answerArray[p_eventToApply.y][p_eventToApply.x];
		if (former == p_eventToApply.symbol) {
			if (former == ADJACENCY.UNDECIDED) {
				return EVENT_RESULT.HARMLESS;
			}
			p_eventToApply.symbol = ADJACENCY.UNDECIDED;
		} 			
		p_solver.answerArray[p_eventToApply.y][p_eventToApply.x] = p_eventToApply.symbol;
		p_eventToApply.formerSymbol = former;
		return EVENT_RESULT.SUCCESS;
	}
}

function areOppositeEventsMethod(p_newEvent, p_previousEvent) {
	return p_newEvent.x == p_previousEvent.x && p_newEvent.y == p_previousEvent.y && p_newEvent.symbol == p_previousEvent.formerSymbol;
}

function undoManualClosure(p_solver) {
	return function(p_eventToUndo) {
		p_solver.answerArray[p_eventToUndo.y][p_eventToUndo.x] = p_eventToUndo.formerSymbol;
	}
}

// Input
SolverYajikabe.prototype.emitMove = function(p_x, p_y, p_symbol) {
	if (!this.isBanned(p_x, p_y)) {
		this.tryToApplyHypothesisManual(new SpaceEvent(p_x, p_y, p_symbol));
	}
}

