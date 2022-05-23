// ----------------------------------------
// Constants also used for drawing

const LOOP_STATE = {LINKED : 2, CLOSED : 1, UNDECIDED : 0};
const LoopStateLabel = ["-", "X", "O"];
const OppositeLoopState = [0, 2, 1];
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

SpaceEvent.prototype.toLogString = function(){	
	return "[S"+LoopStateLabel[this.state]+" "+this.x+","+this.y+"]";
}

function LinkEvent(p_x, p_y, p_direction, p_state) {
	this.kind = LOOP_EVENT.LINK;
	this.state = p_state;
	this.linkX = p_x;
	this.linkY = p_y;
	this.direction = p_direction;
}

LinkEvent.prototype.copy = function() {
	const result = new LinkEvent(this.linkX, this.linkY, this.directon, this.state);
	result.direction = this.direction; // TODO complètement con, mais sinon on peut avoir des "undefined" après recopie...
	return result; 

}

LinkEvent.prototype.toLogString = function(){	
	return "[L"+LoopStateLabel[this.state]+" "+this.linkX+","+this.linkY+" "+LabelDirection[this.direction]+"]";
}

LinkEvent.prototype.dual = function () {
	return new LinkEvent(this.linkX + DeltaX[this.direction], this.linkY + DeltaY[this.direction], OppositeDirection[this.direction], this.state);
}

// ---

function CompoundLinkEvent(p_x, p_y, p_dir1, p_dir2, p_state) {
	this.kind = LOOP_EVENT.COMPOUND_LINK;
	this.state = p_state;
	this.linkX = p_x;
	this.linkY = p_y;
	this.direction1 = p_dir1;
	this.direction2 = p_dir2;
	markCompoundEvent(this);
}

CompoundLinkEvent.prototype.toLogString = function() {
	return "";
}

// ---

shouldBeLoggedEvent = function(p_event) {
	return (p_event.kind == LOOP_EVENT.LINK || shouldBeLoggedLoopSolverEvent(p_event));
}

// ---

shouldBeLoggedLoopSolverEvent = function(p_event) {
	return false;
}