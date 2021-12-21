SolverYajikabe.prototype.constructManual = function() {
	this.methodsSetDeductionsManual = {
		applyEventMethod : applyManualClosure(this),
		undoEventMethod : undoManualClosure(this),
		areOppositeEventsMethod : areOppositeEventsMethod
	}
}

// Precondition : coorX, coorY of the event not banned !
function applyManualClosure(p_solver) {
	return function(p_event) {
		const former = p_solver.answerArray[p_event.coorY][p_event.coorX];
		if (former == p_event.symbol) {
			if (former == ADJACENCY.UNDECIDED) {
				return EVENT_RESULT.HARMLESS;
			}
			p_event.symbol = ADJACENCY.UNDECIDED;
		} 			
		p_solver.answerArray[p_event.coorY][p_event.coorX] = p_event.symbol;
		p_event.formerSymbol = former;
		return EVENT_RESULT.SUCCESS;
	}
}

function areOppositeEventsMethod(p_newEvent, p_previousEvent) {
	return p_newEvent.coorX == p_previousEvent.coorX && p_newEvent.coorY == p_previousEvent.coorY && p_newEvent.symbol == p_previousEvent.formerSymbol;
}

function undoManualClosure(p_solver) {
	return function(p_event) {
		p_solver.answerArray[p_event.coorY][p_event.coorX] = p_event.formerSymbol;
	}
}

// Input
SolverYajikabe.prototype.emitMove = function(p_x, p_y, p_symbol) {
	if (!this.isBanned(p_x, p_y)) {
		this.tryToApplyHypothesisManual(new SpaceEvent(p_x, p_y, p_symbol));
	}
}

