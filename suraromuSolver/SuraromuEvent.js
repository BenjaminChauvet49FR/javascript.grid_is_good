const GATE_NUMBER_EVENT = "GN";
const GATE_BIND_EVENT = "GB";
const TAKE_TWO_EVENT = "T2";

// Of course, the difference lies between id of a gate (predetermined at setup) and its number (to be found for resolution)

function GateNumberEvent(p_gateID, p_number) {
	this.kind = GATE_NUMBER_EVENT;
	this.number = p_number;
	this.id = p_gateID;
}

GateNumberEvent.prototype.copy = function() {
	return new GateNumberEvent(this.id, this.number);
}

GateNumberEvent.prototype.toLogString = function(p_solver) {
	const gate = p_solver.gatesList[this.id];
	return "[Gate id " + this.id + " " + logGate(gate) + " number " + this.number + "]";
}

function GateBindEvent(p_id1, p_id2) {
	this.kind = GATE_BIND_EVENT;
	this.id1 = p_id1;
	this.id2 = p_id2;
	this.outOfPass = true;
}

GateBindEvent.prototype.toLogString = function(p_solver) {
	return "[Gate binds " + logGate(p_solver.gatesList[this.id1]) + " and " + logGate(p_solver.gatesList[this.id2]) + "]";
}

function TakeTwoEvent(p_id, p_numberCenter, p_numberDelta) {
	this.kind = TAKE_TWO_EVENT;
	this.id = p_id;
	this.center = p_numberCenter;
	this.delta = p_numberDelta;
	this.outOfPass = true;
}

TakeTwoEvent.prototype.toLogString = function(p_solver) {
	if (this.center == 0) {
		return "[Taketwo " + logGate(p_solver.gatesList[this.id]) + " numbers " + (p_solver.gatesNumber-this.delta) + "," + (this.delta) + "]";
	} else {		
		return "[Taketwo " + logGate(p_solver.gatesList[this.id]) + " numbers " + (this.center-this.delta) + "," + (this.center+this.delta) + "]";
	}
}

function logGate(p_gate) {
	if (isHorizontalGate(p_gate)) {
		return "(" + (p_gate.xMin + "-" + p_gate.xMax + "," + p_gate.y) + ")";
	}
	if (isVerticalGate(p_gate)) {
		return "(" + (p_gate.x + "," + p_gate.yMin + "-" + p_gate.yMax) + ")";
	}
	return "(SP " + p_gate.x + "," + p_gate.y + ")";
}

shouldBeLoggedLoopSolverEvent = function(p_event) {
	return p_event.kind == GATE_NUMBER_EVENT;
}