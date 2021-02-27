// This solver is "light" : it provides only some "ready-to-use" properties functions, and not a whole set like LoopSolver is.
// Note that it is not robust at all, for it does not contain any practical function related to apply or undo, nor deduction. 

SolverFences.prototype = Object.create(GeneralSolver.prototype);

function SolverFences(p_xLength, p_yLength) {
	GeneralSolver.call(this);
}

SolverFences.prototype.constructor = SolverFences;

SolverFences.prototype.constructLightFences = function(p_xLength, p_yLength) {
	this.generalConstruct();
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

SolverFences.prototype.getFenceRight = function(p_x, p_y) {
	return this.fenceArray[p_y][p_x].right;
}

SolverFences.prototype.getFenceDown = function(p_x, p_y) {
	return this.fenceArray[p_y][p_x].down;
}

SolverFences.prototype.getFenceLeft = function(p_x, p_y) {
	return this.fenceArray[p_y][p_x-1].right;
}

SolverFences.prototype.getFenceUp = function(p_x, p_y) {
	return this.fenceArray[p_y-1][p_x].down;
}

SolverFences.prototype.getFence = function(p_x, p_y, p_direction) {
	switch(p_direction) {
		case DIRECTION.RIGHT : return this.getFenceRight(p_x, p_y); break;
		case DIRECTION.DOWN : return this.getFenceDown(p_x, p_y); break;
		case DIRECTION.LEFT : return this.getFenceLeft(p_x, p_y); break;
		case DIRECTION.UP : return this.getFenceUp(p_x, p_y); break;
		default : autoLogFail("getFence returned an undefined result ! ");
	}
}

SolverFences.prototype.setFenceRight = function(p_x, p_y, p_state) {
	this.fenceArray[p_y][p_x].right = p_state;
}

SolverFences.prototype.setFenceDown = function(p_x, p_y, p_state) {
	this.fenceArray[p_y][p_x].down = p_state;
}

SolverFences.prototype.setFenceLeft = function(p_x, p_y, p_state) {
	this.fenceArray[p_y][p_x-1].right = p_state;
}

SolverFences.prototype.setFenceUp = function(p_x, p_y, p_state) {
	this.fenceArray[p_y-1][p_x].down = p_state;
}

SolverFences.prototype.setFence = function(p_x, p_y, p_direction, p_state) {
	switch(p_direction) {
		case DIRECTION.RIGHT : this.setFenceRight(p_x, p_y, p_state); break;
		case DIRECTION.DOWN : this.setFenceDown(p_x, p_y, p_state); break;
		case DIRECTION.LEFT : this.setFenceLeft(p_x, p_y, p_state); break;
		case DIRECTION.UP : this.setFenceUp(p_x, p_y, p_state); break;
		default : autoLogFail("getFence returned an undefined result ! ");
	}
}

SolverFences.prototype.neighborExists = function(p_x, p_y, p_dir) {
	switch(p_dir) {
		case DIRECTION.RIGHT : return p_x <= this.xLength-2; break;
		case DIRECTION.DOWN : return p_y <= this.yLength-2; break;
		case DIRECTION.LEFT : return p_x > 0; break;
		case DIRECTION.UP : return p_y > 0; break;
		default : autoLogFail("neighborExists returned an undefined result ! ");
	}
}

// Closures for drawing
function getFenceRightClosure(p_solver) {
	return function(p_x, p_y) {
		return p_solver.getFenceRight(p_x, p_y);
	} // A "this" would be window
}

function getFenceDownClosure(p_solver) {
	return function(p_x, p_y) {
		return p_solver.getFenceDown(p_x, p_y);
	}
}

// ----------------
// Deductions methods

/**
Open fence : declare closed fences around in order to create a strip.
*/
SolverFences.prototype.stripBuild = function(p_eventList, p_x, p_y, p_dx, p_dy, p_dir) {
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
SolverFences.prototype.avoidCrossBuild = function(p_eventList, p_x, p_y, p_dx, p_dy, p_dir) { // Can be exported ?
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