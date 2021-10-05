const FENCE_STATE = {OPEN : 2, CLOSED : 1, UNDECIDED : 0}
const LabelFenceState = ["-", "C", "O"];
const FENCE_EVENT_KIND = 'Fence'

function FenceEvent(p_x, p_y, p_direction, p_state) {
	this.kind = FENCE_EVENT_KIND;
	this.state = p_state;
	this.fenceX = p_x;
	this.fenceY = p_y;
	this.direction = p_direction;
}

FenceEvent.prototype.standardFenceCopy = function() {
	switch(this.direction) {
		case DIRECTION.LEFT : return new FenceEvent(this.fenceX - 1, this.fenceY, DIRECTION.RIGHT, this.state); break;
		case DIRECTION.UP : return new FenceEvent(this.fenceX, this.fenceY - 1, DIRECTION.DOWN, this.state); break;
		default : return new FenceEvent(this.fenceX, this.fenceY, this.direction, this.state); break;
	}
}

function standardFenceComparison(p_event1, p_event2) {
	const p_event1bis = p_event1.standardFenceCopy();
	const p_event2bis = p_event2.standardFenceCopy();
	return commonComparison([[p_event1bis.fenceY, p_event1bis.fenceX, p_event1bis.direction, p_event1bis.state], [p_event2bis.fenceY, p_event2bis.fenceX, p_event2bis.direction, p_event2bis.state]]);
}

// ==================================================================

function FencesGrid(p_xLength, p_yLength) {
	this.xLength = p_xLength;
	this.yLength = p_yLength;
	this.fenceArray = [];
	for (var y = 0; y < this.yLength; y++) {
		this.fenceArray.push([]);
		for (var x = 0 ; x < this.xLength ; x++) {
			this.fenceArray[y].push({
				right : FENCE_STATE.UNDECIDED,
				down : FENCE_STATE.UNDECIDED
			});
		}
	}
}

// ----------------
// Getters

FencesGrid.prototype.getFenceRight = function(p_x, p_y) {
	return this.fenceArray[p_y][p_x].right;
}

FencesGrid.prototype.getFenceDown = function(p_x, p_y) {
	return this.fenceArray[p_y][p_x].down;
}

FencesGrid.prototype.getFenceLeft = function(p_x, p_y) {
	return this.fenceArray[p_y][p_x-1].right;
}

FencesGrid.prototype.getFenceUp = function(p_x, p_y) {
	return this.fenceArray[p_y-1][p_x].down;
}

FencesGrid.prototype.getFence = function(p_x, p_y, p_direction) {
	switch(p_direction) {
		case DIRECTION.RIGHT : return this.getFenceRight(p_x, p_y); break;
		case DIRECTION.DOWN : return this.getFenceDown(p_x, p_y); break;
		case DIRECTION.LEFT : return this.getFenceLeft(p_x, p_y); break;
		case DIRECTION.UP : return this.getFenceUp(p_x, p_y); break;
		default : autoLogFail("getFence returned an undefined result ! ");
	}
}

FencesGrid.prototype.setFenceRight = function(p_x, p_y, p_state) {
	this.fenceArray[p_y][p_x].right = p_state;
}

FencesGrid.prototype.setFenceDown = function(p_x, p_y, p_state) {
	this.fenceArray[p_y][p_x].down = p_state;
}

FencesGrid.prototype.setFenceLeft = function(p_x, p_y, p_state) {
	this.fenceArray[p_y][p_x-1].right = p_state;
}

FencesGrid.prototype.setFenceUp = function(p_x, p_y, p_state) {
	this.fenceArray[p_y-1][p_x].down = p_state;
}

FencesGrid.prototype.setFence = function(p_x, p_y, p_direction, p_state) {
	switch(p_direction) {
		case DIRECTION.RIGHT : this.setFenceRight(p_x, p_y, p_state); break;
		case DIRECTION.DOWN : this.setFenceDown(p_x, p_y, p_state); break;
		case DIRECTION.LEFT : this.setFenceLeft(p_x, p_y, p_state); break;
		case DIRECTION.UP : this.setFenceUp(p_x, p_y, p_state); break;
		default : autoLogFail("getFence returned an undefined result ! ");
	}
}

// Closures for drawing
function getFenceRightClosure(p_grid) {
	return function(p_x, p_y) {
		return p_grid.getFenceRight(p_x, p_y);
	} // A "this" would be window
}

function getFenceDownClosure(p_grid) {
	return function(p_x, p_y) {
		return p_grid.getFenceDown(p_x, p_y);
	}
}

// ----------------
// Deductions methods for solvers

/**
Open fence : declare closed fences around in order to create a strip.
*/
FencesGrid.prototype.stripBuild = function(p_eventList, p_x, p_y, p_dx, p_dy, p_dir) {
	if ((p_dir == DIRECTION.UP) || (p_dir == DIRECTION.DOWN)) {
		if (p_x > 0) {
			p_eventList.push(new FenceEvent(p_x, p_y, DIRECTION.LEFT, FENCE_STATE.CLOSED));
			p_eventList.push(new FenceEvent(p_x, p_dy, DIRECTION.LEFT, FENCE_STATE.CLOSED));
		}
		if (p_x <= this.xLength - 2) {
			p_eventList.push(new FenceEvent(p_x, p_y, DIRECTION.RIGHT, FENCE_STATE.CLOSED));
			p_eventList.push(new FenceEvent(p_x, p_dy, DIRECTION.RIGHT, FENCE_STATE.CLOSED));
		}
	}
	if ((p_dir == DIRECTION.LEFT) || (p_dir == DIRECTION.RIGHT)) {
		if (p_y > 0) {
			p_eventList.push(new FenceEvent(p_x, p_y, DIRECTION.UP, FENCE_STATE.CLOSED));
			p_eventList.push(new FenceEvent(p_dx, p_y, DIRECTION.UP, FENCE_STATE.CLOSED));
		}
		if (p_y <= this.yLength - 2) {
			p_eventList.push(new FenceEvent(p_x, p_y, DIRECTION.DOWN, FENCE_STATE.CLOSED));
			p_eventList.push(new FenceEvent(p_dx, p_y, DIRECTION.DOWN, FENCE_STATE.CLOSED));
		}
	}
	return p_eventList;
}

/**
Closed fence : When up to 3 fences may meet at a given point and the fence (x,y,dir) just got closed
*/
FencesGrid.prototype.avoidCrossBuildDeductions = function(p_eventList, p_x, p_y, p_dx, p_dy, p_dir) { // Can be exported ?
	if ((p_dir == DIRECTION.UP) || (p_dir == DIRECTION.DOWN)) {
		if (p_x > 0) { // Check cross left
			const state1 = this.getFenceLeft(p_x, p_y) == FENCE_STATE.CLOSED;
			const state2 = this.getFenceLeft(p_x, p_dy) == FENCE_STATE.CLOSED;
			if (state1 == state2) {
				if (state1) { // 1 and 2
					p_eventList.push(new FenceEvent(p_x-1, p_y, p_dir, FENCE_STATE.OPEN));
				}
			} else if (this.getFence(p_x-1, p_y, p_dir) == FENCE_STATE.CLOSED) {
				if (state1) { // 1 and opposite
					p_eventList.push(new FenceEvent(p_x, p_dy, DIRECTION.LEFT, FENCE_STATE.OPEN));
				} else { // 2 and opposite
					p_eventList.push(new FenceEvent(p_x, p_y, DIRECTION.LEFT, FENCE_STATE.OPEN));
				}
			}
		}
		
		if (p_x <= this.xLength - 2) { // Check cross right
			const state1 = this.getFenceRight(p_x, p_y) == FENCE_STATE.CLOSED;
			const state2 = this.getFenceRight(p_x, p_dy) == FENCE_STATE.CLOSED;
			if (state1 == state2) {
				if (state1) { // 1 and 2
					p_eventList.push(new FenceEvent(p_x+1, p_y, p_dir, FENCE_STATE.OPEN));
				}
			} else if (this.getFence(p_x+1, p_y, p_dir) == FENCE_STATE.CLOSED) {
				if (state1) { // 1 and opposite
					p_eventList.push(new FenceEvent(p_x, p_dy, DIRECTION.RIGHT, FENCE_STATE.OPEN));
				} else { // 2 and opposite
					p_eventList.push(new FenceEvent(p_x, p_y, DIRECTION.RIGHT, FENCE_STATE.OPEN));
				}
			}
		}
	} else {
		if (p_y > 0) { // Check cross up
			const state1 = this.getFenceUp(p_x, p_y) == FENCE_STATE.CLOSED;
			const state2 = this.getFenceUp(p_dx, p_y) == FENCE_STATE.CLOSED;
			if (state1 == state2) {
				if (state1) { // 1 and 2
					p_eventList.push(new FenceEvent(p_x, p_y-1, p_dir, FENCE_STATE.OPEN));
				}
			} else if (this.getFence(p_x, p_y-1, p_dir) == FENCE_STATE.CLOSED) {
				if (state1) { // 1 and opposite
					p_eventList.push(new FenceEvent(p_dx, p_y, DIRECTION.UP, FENCE_STATE.OPEN));
				} else { // 2 and opposite
					p_eventList.push(new FenceEvent(p_x, p_y, DIRECTION.UP, FENCE_STATE.OPEN));
				}
			}
		}
		
		if (p_y <= this.yLength - 2) { // Check cross down
			const state1 = this.getFenceDown(p_x, p_y) == FENCE_STATE.CLOSED;
			const state2 = this.getFenceDown(p_dx, p_y) == FENCE_STATE.CLOSED;
			if (state1 == state2) {
				if (state1) { // 1 and 2
					p_eventList.push(new FenceEvent(p_x, p_y+1, p_dir, FENCE_STATE.OPEN));
				}
			} else if (this.getFence(p_x, p_y+1, p_dir) == FENCE_STATE.CLOSED) {
				if (state1) { // 1 and opposite
					p_eventList.push(new FenceEvent(p_dx, p_y, DIRECTION.DOWN, FENCE_STATE.OPEN));
				} else { // 2 and opposite
					p_eventList.push(new FenceEvent(p_x, p_y, DIRECTION.DOWN, FENCE_STATE.OPEN));
				}
			}
		}
	}
	return p_eventList;
}

// ---------
// Interfacing 

FenceEvent.prototype.toLogString = function() {	
	return "[" + "F" + LabelFenceState[this.state] + " " + this.fenceX + "," + this.fenceY + " " + LabelDirection[this.direction] + "]";
}