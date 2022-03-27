const FENCE_EVENT_KIND = 'kf';

const FENCE_STATE = {OPEN : 2, CLOSED : 1, UNDECIDED : 0}
const LabelFenceState = ["-", "C", "O"];
const OppositeFenceState = [0, 2, 1];

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
	// Constants
	this.DeltaXFromRDSpacePoint = [0, 0, 1, 0]; // Direction_0123 assumption !
	this.DeltaYFromRDSpacePoint = [0, 0, 0, 1]; 
	this.DirectionFenceFromRDSpacePoint = [DIRECTION.DOWN, DIRECTION.RIGHT, DIRECTION.DOWN, DIRECTION.RIGHT]; 
	
	// Specific to this object
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

// Neither method is safe ! 
FencesGrid.prototype.isFenceSurelyOpen = function(p_x, p_y, p_direction) {
	switch(p_direction) {
		case DIRECTION.RIGHT : return (p_x < this.xLength-1) && (this.getFenceRight(p_x, p_y) == FENCE_STATE.OPEN); break;
		case DIRECTION.DOWN : return (p_y < this.yLength-1) && (this.getFenceDown(p_x, p_y) == FENCE_STATE.OPEN); break;
		case DIRECTION.LEFT : return (p_x > 0) && (this.getFenceLeft(p_x, p_y) == FENCE_STATE.OPEN); break;
		case DIRECTION.UP : return (p_y > 0) && (this.getFenceUp(p_x, p_y) == FENCE_STATE.OPEN); break;
		default : autoLogFail("isFenceSurelyOpen returned an undefined result ! ");
	}	
}

// This one, a closed is considered even if the end is met. 
FencesGrid.prototype.isFenceRatherClosed = function(p_x, p_y, p_direction) {
	switch(p_direction) {
		case DIRECTION.RIGHT : return (p_x == this.xLength-1) || (this.getFenceRight(p_x, p_y) == FENCE_STATE.CLOSED); break;
		case DIRECTION.DOWN : return (p_y == this.yLength-1) || (this.getFenceDown(p_x, p_y) == FENCE_STATE.CLOSED); break;
		case DIRECTION.LEFT : return (p_x == 0) || (this.getFenceLeft(p_x, p_y) == FENCE_STATE.CLOSED); break;
		case DIRECTION.UP : return (p_y == 0) || (this.getFenceUp(p_x, p_y) == FENCE_STATE.CLOSED); break;
		default : autoLogFail("isFenceRatherClosed returned an undefined result ! ");
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

// From a fence, forces regionalism around points at the extremity of the fence (not at edges) so there cannot be 3 open fences and the 4th closed.
// Note that it cannot guarantee that a fence between two spaces that belong to the same region, thanks to other fences that are open, is open. It will be the responsibility of the solver.
FencesGrid.prototype.forceRegionalismDeductions = function(p_eventList, p_xSpace, p_ySpace, p_directionFence) {
	var x1 = null;
	var x2 = null;
	var y1, y2;
	
	switch(p_directionFence) {
		case DIRECTION.LEFT : case DIRECTION.RIGHT : // x1, y1 up the fence. x2, y2 down the fence.
			const x = (p_directionFence == DIRECTION.LEFT ? p_xSpace-1 : p_xSpace);
			if (p_ySpace > 0) {
				x1 = x;
				y1 = p_ySpace-1;
			}
			if (p_ySpace <= this.yLength-2) {
				x2 = x;
				y2 = p_ySpace;
			}
		break;
		case DIRECTION.UP : case DIRECTION.DOWN :  // x1, y1 left the fence. x2, y2 right the fence.
			const y = (p_directionFence == DIRECTION.UP ? p_ySpace-1 : p_ySpace);
			if (p_xSpace > 0) {
				x1 = p_xSpace-1;
				y1 = y;
			}
			if (p_xSpace <= this.xLength-2) {
				x2 = p_xSpace;
				y2 = y;
			}
		break;
	}
	if (x1 != null) {		
		p_eventList = this.forceRegionalismRDPointDeductions(p_eventList, x1, y1);
	}
	if (x2 != null) {		
		p_eventList = this.forceRegionalismRDPointDeductions(p_eventList, x2, y2);
	}
	return p_eventList;
}

// Forces the creation of new fences events so that regions are created.
// Preconditions : p_xRight, p_yDown is inside the grid.
FencesGrid.prototype.forceRegionalismRDPointDeductions = function(p_eventList, p_xRight, p_yDown) {
	const stateLeftPoint = this.getFenceDown(p_xRight, p_yDown);
	const stateUpPoint = this.getFenceRight(p_xRight, p_yDown);
	const stateRightPoint = this.getFenceDown(p_xRight + 1, p_yDown);
	const stateDownPoint = this.getFenceRight(p_xRight, p_yDown + 1);
	if (stateLeftPoint == FENCE_STATE.OPEN) {
		if (stateRightPoint == FENCE_STATE.OPEN) {
			if (stateUpPoint != FENCE_STATE.UNDECIDED) {
				p_eventList.push(this.FenceEventFromPoint(p_xRight, p_yDown, DIRECTION.DOWN, stateUpPoint));
			}
			if (stateDownPoint != FENCE_STATE.UNDECIDED) {
				p_eventList.push(this.FenceEventFromPoint(p_xRight, p_yDown, DIRECTION.UP, stateDownPoint));
			}
		} else if (stateRightPoint == FENCE_STATE.CLOSED) {
			if (stateUpPoint == FENCE_STATE.OPEN) {
				p_eventList.push(this.FenceEventFromPoint(p_xRight, p_yDown, DIRECTION.DOWN, FENCE_STATE.CLOSED));
			}
			if (stateDownPoint == FENCE_STATE.OPEN) {
				p_eventList.push(this.FenceEventFromPoint(p_xRight, p_yDown, DIRECTION.UP, FENCE_STATE.CLOSED));
			}
		} else if (stateUpPoint == FENCE_STATE.OPEN) {
			if (stateDownPoint != FENCE_STATE.UNDECIDED) {				
				p_eventList.push(this.FenceEventFromPoint(p_xRight, p_yDown, DIRECTION.RIGHT, stateDownPoint));
			}
		} else if (stateUpPoint == FENCE_STATE.CLOSED && stateDownPoint == FENCE_STATE.OPEN) {
			p_eventList.push(this.FenceEventFromPoint(p_xRight, p_yDown, DIRECTION.RIGHT, FENCE_STATE.CLOSED));
		}
	} else if (stateLeftPoint == FENCE_STATE.CLOSED) {
		if (stateRightPoint == FENCE_STATE.OPEN) {
			if (stateUpPoint == FENCE_STATE.OPEN) {
				p_eventList.push(this.FenceEventFromPoint(p_xRight, p_yDown, DIRECTION.DOWN, FENCE_STATE.CLOSED));
			}
			if (stateDownPoint == FENCE_STATE.OPEN) {
				p_eventList.push(this.FenceEventFromPoint(p_xRight, p_yDown, DIRECTION.UP, FENCE_STATE.CLOSED));
			}
		} else if (stateRightPoint == FENCE_STATE.CLOSED) {
			
		} else if ((stateUpPoint == FENCE_STATE.OPEN) && (stateDownPoint == FENCE_STATE.OPEN)) {
			p_eventList.push(this.FenceEventFromPoint(p_xRight, p_yDown, DIRECTION.RIGHT, FENCE_STATE.CLOSED));
		}
	} else { // left point fence is unknown, it may be decided only if 3 others are known 
		if (stateUpPoint == FENCE_STATE.OPEN) {
			if (stateDownPoint == FENCE_STATE.OPEN && stateRightPoint != FENCE_STATE.UNDECIDED) {
				p_eventList.push(this.FenceEventFromPoint(p_xRight, p_yDown, DIRECTION.LEFT, stateRightPoint));
			} else if (stateDownPoint == FENCE_STATE.CLOSED && stateRightPoint == FENCE_STATE.OPEN) {
				p_eventList.push(this.FenceEventFromPoint(p_xRight, p_yDown, DIRECTION.LEFT, FENCE_STATE.CLOSED));
			}
		} else if (stateUpPoint == FENCE_STATE.CLOSED && stateRightPoint == FENCE_STATE.OPEN && stateDownPoint == FENCE_STATE.OPEN) {
			p_eventList.push(this.FenceEventFromPoint(p_xRight, p_yDown, DIRECTION.LEFT, FENCE_STATE.CLOSED));
		}
	}
	return p_eventList;
}

FencesGrid.prototype.FenceEventFromPoint = function(p_xRight, p_yRight, p_direction, p_state) {
	return new FenceEvent(p_xRight + this.DeltaXFromRDSpacePoint[p_direction], p_yRight + this.DeltaYFromRDSpacePoint[p_direction], this.DirectionFenceFromRDSpacePoint[p_direction], p_state);
}	

// ---------
// About exploiting open fences

// Affects checker so that all spaces in "needs clean spaces" + the clusters of open spaces accessible from them are added to the list of the checker (and its array as well) and only these spaces.
// Note : Checker does NOT have to be cleared if we don't want job to be done on some space. However, this function needs to make sure that spaces are clean to the checker. 
// After the function, the list of the checker may contain some spaces twice (risks of cleanOne). Hope it doesn't need to be run afterwards !
FencesGrid.prototype.addAccessibleSpacesToSetSpaces = function(p_checker, p_spaces, p_needsCleanSpaces) {
	var remainingSpaces = p_spaces;
	var x,y;
	if (p_needsCleanSpaces) {		
		p_spaces.forEach(coors => { 
			p_checker.cleanOne(coors.x, coors.y);
		});
	}
	while (remainingSpaces.length > 0) { 
		coors = remainingSpaces.pop();
		x = coors.x;
		y = coors.y;
		if (p_checker.add(x, y)) {
			existingNeighborsDirections(x, y, this.xLength, this.yLength).forEach(dir => {
				if (this.getFence(x, y, dir) == FENCE_STATE.OPEN) {
					remainingSpaces.push({x : x + DeltaX[dir], y : y + DeltaY[dir]});
				}
			});
		}
	};
}

FencesGrid.prototype.getUnknownFencesChecker = function(p_spacesChecker) {
	return this.getUnknownFencesPrivate(p_spacesChecker.list, p_spacesChecker.array);
}

// Gets unknown fences within and outside the checker selection
FencesGrid.prototype.getUnknownFencesPrivate = function(p_list, p_array) {
	var fencesList = [];
	var x, y;
	p_list.forEach(coors => {
		x = coors.x;
		y = coors.y;
		if (x <= this.xLength-2 && this.getFenceRight(x, y) == FENCE_STATE.UNDECIDED) {
			fencesList.push({x : x, y : y, direction : DIRECTION.RIGHT});
		}
		if (y <= this.yLength-2 && this.getFenceDown(x, y) == FENCE_STATE.UNDECIDED) {
			fencesList.push({x : x, y : y, direction : DIRECTION.DOWN});
		}
		if (x > 0 && !(p_array[y][x-1]) && this.getFenceLeft(x, y) == FENCE_STATE.UNDECIDED) {
			fencesList.push({x : x, y : y, direction : DIRECTION.LEFT});
		}
		if (y > 0 && !(p_array[y-1][x]) && this.getFenceUp(x, y) == FENCE_STATE.UNDECIDED) {
			fencesList.push({x : x, y : y, direction : DIRECTION.UP});
		}
	});
	return fencesList;
}

// ---------
// Returns the pass events for one fence (has to be stored into one array)
// The fence is supposed to exist and to be undecided.

FencesGrid.prototype.getPassEventsForOneFence = function(p_x, p_y, p_dir) {
	return [new FenceEvent(p_x, p_y, p_dir, FENCE_STATE.OPEN), new FenceEvent(p_x, p_y, p_dir, FENCE_STATE.CLOSED)];
}

FencesGrid.prototype.getFencePassEventsForSpacesList = function(p_coorsList, p_coorsArray) {
	var answer = [];
	this.getUnknownFencesPrivate(p_coorsList, p_coorsArray).forEach(fence => {
		answer.push(this.getPassEventsForOneFence(fence.x, fence.y, fence.direction));
	});
	return answer;
}

// ---------
// Solving

// Naive method
FencesGrid.prototype.isComplete = function() {
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength-1 ; x++) {
			if (this.fenceArray[y][x].right == FENCE_STATE.UNDECIDED) {
				return false;
			}
		}
	}
	for (var y = 0 ; y < this.yLength-1 ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			if (this.fenceArray[y][x].down == FENCE_STATE.UNDECIDED) {
				return false;
			}
		}
	}
	return true;
}

// Naive research of the 'best' fence
// Note : must be used after multipass, AND this must be a multipass that covers all fences. (so applying either a fence right or a fence down won't hurt the solving process)
function searchBestFenceForSolutionSearch(p_solver, p_fencesGrid) { 
	// Find index with the most solutions
	var bestIndex = {nbD : -1};
	var nbDeductions;
	var event_;
	var result;
	for (solveX = 0 ; solveX < p_solver.xLength-1 ; solveX++) { // x and y are somehow modified by tryToApplyHypothesis...
		for (solveY = 0 ; solveY < p_solver.yLength ; solveY++) {
			if (p_fencesGrid.getFenceRight(solveX, solveY) == FENCE_STATE.UNDECIDED) {
				[FENCE_STATE.OPEN, FENCE_STATE.CLOSED].forEach(state => {
					event_ = new FenceEvent(solveX, solveY, DIRECTION.RIGHT, state);
					result = p_solver.tryToApplyHypothesis(event_); 				
					nbDeductions = p_solver.numberOfRelevantDeductionsSinceLastHypothesis();
					if (bestIndex.nbD < nbDeductions) {
						bestIndex = {nbD : nbDeductions , x : event_.fenceX, y : event_.fenceY, direction : DIRECTION.RIGHT}
					}
					p_solver.undoToLastHypothesis();
				});	
			}
		}
	}
	for (solveX = 0 ; solveX < p_solver.xLength ; solveX++) { // x and y are somehow modified by tryToApplyHypothesis...
		for (solveY = 0 ; solveY < p_solver.yLength-1 ; solveY++) {
			if (p_solver.answerFencesGrid.getFenceDown(solveX, solveY) == FENCE_STATE.UNDECIDED) {
				[FENCE_STATE.OPEN, FENCE_STATE.CLOSED].forEach(state => {
					event_ = new FenceEvent(solveX, solveY, DIRECTION.DOWN, state);
					result = p_solver.tryToApplyHypothesis(event_); 				
					nbDeductions = p_solver.numberOfRelevantDeductionsSinceLastHypothesis();
					if (bestIndex.nbD < nbDeductions) {
						bestIndex = {nbD : nbDeductions , x : event_.fenceX, y : event_.fenceY, direction : DIRECTION.DOWN}
					}
					p_solver.undoToLastHypothesis();
				});	
			}
		}
	}
	return p_solver.tryAllPossibilities(
		[new FenceEvent(bestIndex.x, bestIndex.y, bestIndex.direction, FENCE_STATE.OPEN), 
		new FenceEvent(bestIndex.x, bestIndex.y, bestIndex.direction, FENCE_STATE.CLOSED)]
	);
}

// ---------
// Interfacing 

FenceEvent.prototype.toLogString = function() {	
	return "[" + "F" + LabelFenceState[this.state] + " " + this.fenceX + "," + this.fenceY + " " + LabelDirection[this.direction] + "]";
}