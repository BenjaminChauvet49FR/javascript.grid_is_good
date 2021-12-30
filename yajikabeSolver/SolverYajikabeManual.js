SolverYajikabe.prototype.constructManual = function() {
	this.methodsSetDeductionsManual = {
		applyEventMethod : applyManualClosure(this),
		undoEventMethod : undoManualClosure(this),
		areOppositeEventsMethod : areOppositeEventsMethod
	}
}

// Precondition : x, y of the event not banned !
function applyManualClosure(p_solver) {
	return function(p_event) {
		const former = p_solver.answerArray[p_event.y][p_event.x];
		if (former == p_event.symbol) {
			if (former == ADJACENCY.UNDECIDED) {
				return EVENT_RESULT.HARMLESS;
			}
			p_event.symbol = ADJACENCY.UNDECIDED;
		} 			
		p_solver.answerArray[p_event.y][p_event.x] = p_event.symbol;
		p_event.formerSymbol = former;
		return EVENT_RESULT.SUCCESS;
	}
}

function areOppositeEventsMethod(p_newEvent, p_previousEvent) {
	return p_newEvent.x == p_previousEvent.x && p_newEvent.y == p_previousEvent.y && p_newEvent.symbol == p_previousEvent.formerSymbol;
}

function undoManualClosure(p_solver) {
	return function(p_event) {
		p_solver.answerArray[p_event.y][p_event.x] = p_event.formerSymbol;
	}
}

// Input
SolverYajikabe.prototype.emitMove = function(p_x, p_y, p_symbol) {
	if (!this.isBanned(p_x, p_y)) {
		this.tryToApplyHypothesisManual(new SpaceEvent(p_x, p_y, p_symbol));
	}
}

