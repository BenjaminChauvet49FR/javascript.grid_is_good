// ----------------------------------------
// Constants also used for drawing

const LOOP_STATE = {LINKED : 2, CLOSED : 1, UNDECIDED : 0};
const LoopStateLabel = ["-", "X", "O"];
const LOOP_EVENT = {LINK : "L", STATE : "S", COMPOUND_LINK : "CL"}

// ----------------------------------------

function SpaceEvent(p_x, p_y, p_state) {
	this.kind = LOOP_EVENT.STATE;
	this.x = p_x;
	this.y = p_y;
	this.state = p_state;
}

SpaceEvent.prototype.copy = function() {
	return new SpaceEvent(this.x, this.y, this.state);
}

SpaceEvent.prototype.toString = function(){	
	return "["+LoopStateLabel[this.state]+" "+this.x+","+this.y+"]";
}

function LinkEvent(p_x, p_y, p_direction, p_state) {
	this.kind = LOOP_EVENT.LINK;
	this.state = p_state;
	this.linkX = p_x;
	this.linkY = p_y;
	this.direction = p_direction;
}

LinkEvent.prototype.copy = function() {
	const answer = new LinkEvent(this.linkX, this.linkY, this.directon, this.state);
	answer.direction = this.direction; // TODO complètement con, mais sinon on peut avoir des "undefined" après recopie...
	return answer;
}

LinkEvent.prototype.toString = function(){	
	return "["+"L"+LoopStateLabel[this.state]+" "+this.linkX+","+this.linkY+" "+this.direction+"]";
}

LinkEvent.prototype.dual = function () {
	return new LinkEvent(this.linkX + DeltaX[this.direction], this.linkY + DeltaY[this.direction], OppositeDirection[this.direction], this.state);
}

shouldBeLoggedEvent = function(p_event) {
	return (p_event.kind == LOOP_EVENT.LINK || shouldBeLoggedLoopSolverEvent(p_event));
}

// ---

shouldBeLoggedLoopSolverEvent = function(p_event) {
	return false;
}