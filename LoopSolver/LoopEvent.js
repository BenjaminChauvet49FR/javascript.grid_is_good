// ----------------------------------------
// Constants also used for drawing

const LOOP_STATE = {LINKED : 2, CLOSED : 1, UNDECIDED : 0};
const LOOP_DIRECTION = {LEFT : "l", UP : "u", RIGHT : "r", DOWN : "d", UNDECIDED: "-"};
const LOOP_EVENT = {LINK : "L", STATE : "S"}

// ----------------------------------------

const deltaX = {
	l: -1,
	u: 0,
	r: 1,
	d: 0
}

const deltaY = {
	l: 0,
	u: -1,
	r: 0,
	d: 1
}

const oppositeDirection = {
	l: LOOP_DIRECTION.RIGHT,
	u: LOOP_DIRECTION.DOWN,
	r: LOOP_DIRECTION.LEFT,
	d: LOOP_DIRECTION.UP
}

// ----------------------------------------

function StateEvent(p_x, p_y, p_state) {
	this.kind = LOOP_EVENT.STATE;
	this.x = p_x;
	this.y = p_y;
	this.state = p_state;
}

StateEvent.prototype.toString = function(){	
	return "["+this.state+" "+this.x+","+this.y+"]";
}

function LinkEvent(p_x, p_y, p_direction, p_state) {
	this.kind = LOOP_EVENT.LINK;
	this.state = p_state;
	this.linkX = p_x;
	this.linkY = p_y;
	this.direction = p_direction;
}

LinkEvent.prototype.toString = function(){	
	return "["+"L"+this.state+" "+this.linkX+","+this.linkY+" "+this.direction+"]";
}

LinkEvent.prototype.dual = function () {
	return new LinkEvent(this.linkX + deltaX[this.direction], this.linkY + deltaY[this.direction], oppositeDirection[this.direction], this.state);
}

