// ----------------------------------------
// Constants also used for drawing

const LOOP_STATE = {LINKED : 2, CLOSED : 1, UNDECIDED : 0};
const LOOP_DIRECTION = {LEFT : "l", UP : "u", RIGHT : "r", DOWN : "d", UNDECIDED: "-"};
const LOOP_EVENT = {LINK : "L", STATE : "S", COMPOUND_LINK : "CL"}

// ----------------------------------------

const DeltaX = {
	l: -1,
	u: 0,
	r: 1,
	d: 0
}

const DeltaY = {
	l: 0,
	u: -1,
	r: 0,
	d: 1
}

const OppositeDirection = {
	l: LOOP_DIRECTION.RIGHT,
	u: LOOP_DIRECTION.DOWN,
	r: LOOP_DIRECTION.LEFT,
	d: LOOP_DIRECTION.UP
}

const TurningRightDirection = {
	l: LOOP_DIRECTION.UP,
	u: LOOP_DIRECTION.RIGHT,
	r: LOOP_DIRECTION.DOWN,
	d: LOOP_DIRECTION.LEFT
}

const TurningLeftDirection = {
	l: LOOP_DIRECTION.DOWN,
	u: LOOP_DIRECTION.LEFT,
	r: LOOP_DIRECTION.UP,
	d: LOOP_DIRECTION.RIGHT
}

const LoopKnownDirections = [LOOP_DIRECTION.LEFT, LOOP_DIRECTION.UP, LOOP_DIRECTION.RIGHT, LOOP_DIRECTION.DOWN];

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
	return "["+this.state+" "+this.x+","+this.y+"]";
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
	return "["+"L"+this.state+" "+this.linkX+","+this.linkY+" "+this.direction+"]";
}

LinkEvent.prototype.dual = function () {
	return new LinkEvent(this.linkX + DeltaX[this.direction], this.linkY + DeltaY[this.direction], OppositeDirection[this.direction], this.state);
}