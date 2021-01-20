// Setup

function LoopSolver() {
	
}

// "PS" seen in all names stand for "puzzle specific".
LoopSolver.prototype.setPuzzleSpecificMethods = function(p_packMethods) {
	this.setSpaceClosedPSAtomicDos = p_packMethods.setSpaceClosedPSAtomicDos;
	if (!this.setSpaceClosedPSAtomicDos) {
		this.setSpaceClosedPSAtomicDos = function(p_space) {} ;
	}
	this.setSpaceLinkedPSAtomicDos = p_packMethods.setSpaceLinkedPSAtomicDos;
	if (!this.setSpaceLinkedPSAtomicDos) {
		this.setSpaceLinkedPSAtomicDos = function(p_space) {} ;
	}
	this.setEdgeClosedPSAtomicDos = p_packMethods.setEdgeClosedPSAtomicDos;
	if (!this.setEdgeClosedPSAtomicDos) {
		this.setEdgeClosedPSAtomicDos = function(p_5args) {} ; // x, y, otherX, otherY, direction (from x,y to otherX,otherY)
	}
	this.setEdgeLinkedPSAtomicDos = p_packMethods.setEdgeLinkedPSAtomicDos;
	if (!this.setEdgeLinkedPSAtomicDos) {
		this.setEdgeLinkedPSAtomicDos = function(p_7args) {} ; // x, y, otherX, otherY, direction (from x,y to otherX,otherY), end1, end2 (may be useless)
	}
	this.otherPSAtomicDos = p_packMethods.otherPSAtomicDos;
	if (!this.otherPSAtomicDos) {
		this.otherPSAtomicDos = function(p_event) {} ;
	}
	
	this.setSpaceClosedPSAtomicUndos = p_packMethods.setSpaceClosedPSAtomicUndos;
	if (!this.setSpaceClosedPSAtomicUndos) {
		this.setSpaceClosedPSAtomicUndos = function(p_space) {} ;
	}
	this.setSpaceLinkedPSAtomicUndos = p_packMethods.setSpaceLinkedPSAtomicUndos;
	if (!this.setSpaceLinkedPSAtomicUndos) {
		this.setSpaceLinkedPSAtomicUndos = function(p_space) {} ;
	}
	this.setEdgeClosedPSAtomicUndos = p_packMethods.setEdgeClosedPSAtomicUndos;
	if (!this.setEdgeClosedPSAtomicUndos) {
		this.setEdgeClosedPSAtomicUndos = function(p_5args) {} ; // x, y, otherX, otherY
	}
	this.setEdgeLinkedPSAtomicUndos = p_packMethods.setEdgeLinkedPSAtomicUndos;
	if (!this.setEdgeLinkedPSAtomicUndos) {
		this.setEdgeLinkedPSAtomicUndos = function(p_4args) {} ; // x, y, otherX, otherY
	}
	this.otherPSAtomicUndos = p_packMethods.otherPSAtomicUndos;
	if (!this.otherPSAtomicUndos) {
		this.otherPSAtomicUndos = function(p_event) {} ;
	}
	
	this.setSpaceClosedPSDeductions = p_packMethods.setSpaceClosedPSDeductions;
	if (!this.setSpaceClosedPSDeductions) {
		this.setSpaceClosedPSDeductions = function(p_eventList, p_eventBeingApplied) {return p_eventList};
	}
	this.setSpaceLinkedPSDeductions = p_packMethods.setSpaceLinkedPSDeductions;
	if (!this.setSpaceLinkedPSDeductions) {
		this.setSpaceLinkedPSDeductions = function(p_eventList, p_eventBeingApplied) {return p_eventList};
	}
	this.setEdgeClosedPSDeductions = p_packMethods.setEdgeClosedPSDeductions;
	if (!this.setEdgeClosedPSDeductions) {
		this.setEdgeClosedPSDeductions = function(p_eventList, p_eventBeingApplied) {return p_eventList};
	}
	this.setEdgeLinkedPSDeductions = p_packMethods.setEdgeLinkedPSDeductions;
	if (!this.setEdgeLinkedPSDeductions) {
		this.setEdgeLinkedPSDeductions = function(p_eventList, p_eventBeingApplied) {return p_eventList};
	}
	this.otherPSDeductions = p_packMethods.otherPSDeductions;
	if (!this.otherPSDeductions) {
		this.otherPSDeductions = function(p_eventList, p_eventBeingApplied) {return p_eventList};
	}
	
	// setSpaceClosedPSAtomicDos (2) setSpaceLinkedPSAtomicDos (2) setEdgeClosedPSAtomicDos (5) setEdgeLinkedPSAtomicDos (7)
	// setSpaceClosedPSAtomicUndos (2) setSpaceLinkedPSAtomicUndos (2) setEdgeClosedPSAtomicUndos (5) setEdgeLinkedPSAtomicUndos (5)
	// otherPSAtomicDos(1) otherPSAtomicUndos(1)
	// setSpaceClosedPSDeductions (2) setSpaceLinkedPSDeductions (2) setEdgeClosedPSDeductions (2) setEdgeLinkedPSDeductions (2)
	// otherPSDeductions(2)

}

LoopSolver.prototype.construct = function(p_wallArray, p_puzzleSpecificMethodPack) {
	this.xLength = p_wallArray[0].length;
    this.yLength = p_wallArray.length;
	this.generalSolver = new GeneralSolver();
	this.methodSet = new ApplyEventMethodNonAdjacentPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.setPuzzleSpecificMethods(p_puzzleSpecificMethodPack);
	this.methodSet.addAbortAndFilters(abortClosure(this), [separateEndsClosure(this)]);
	
    this.grid = [];
	this.checkNewEnds = {
		array : [],
		list : []
	}
	this.chainCount = 0; // Counts at all times the number of "chains". A chain can be a lone linked space, or an actual chain of links. So it is the difference between linked spaces and links.
	var x,y;
	for (y = 0; y < this.yLength ; y++) {
		this.grid.push([]);
		this.checkNewEnds.array.push([]);
		for (x = 0 ; x < this.xLength ; x++) {
			this.grid[y].push({
				state : LOOP_STATE.UNDECIDED,
				oppositeEnd : {},
				closedEdges : 0,
				linkRight : LOOP_STATE.UNDECIDED,
				linkDown : LOOP_STATE.UNDECIDED,
				chains : []
			});
			this.checkNewEnds.array[y].push(false);
		}
	}
	
	// Purification 
	for (x = 0 ; x < this.xLength ; x++) {
		this.grid[0][x].closedEdges++;
		this.grid[this.yLength-1][x].closedEdges++;
	}
	for (y = 0 ; y < this.yLength ; y++) {
		this.grid[y][0].closedEdges++;
		this.grid[y][this.xLength-1].closedEdges++;
	}
	
	// TODO : missing banned spaces. 
}

// -------------------
// Getters (important)

LoopSolver.prototype.getLinkSpace = function(p_x, p_y){
	return this.grid[p_y][p_x].state;
}

LoopSolver.prototype.getLinkRight = function(p_x, p_y) {
	return this.grid[p_y][p_x].linkRight;
}

LoopSolver.prototype.getLinkLeft = function(p_x, p_y) {
	return this.getLinkRight(p_x-1, p_y);
}

LoopSolver.prototype.getLinkDown = function(p_x, p_y) {
	return this.grid[p_y][p_x].linkDown;
}

LoopSolver.prototype.getLinkUp = function(p_x, p_y) {
	return this.getLinkDown(p_x, p_y-1);
}

LoopSolver.prototype.getLinkedEdges = function(p_x, p_y){
	return this.grid[p_y][p_x].chains.length;
}

LoopSolver.prototype.getClosedEdges = function(p_x, p_y){
	return this.grid[p_y][p_x].closedEdges;
}

LoopSolver.prototype.getOppositeEnd = function(p_x, p_y) {
	return this.grid[p_y][p_x].oppositeEnd;
}

LoopSolver.prototype.getSpace = function(p_space) {
	return this.grid[p_space.y][p_space.x];
}

// -------------------
// Misc. inner methods

copySpace = function(p_space) {
	return {
		x : p_space.x,
		y : p_space.y
	}
}

// -------------------
// Doing and undoing 

// Warning : offensive programmation, no boundary check !
LoopSolver.prototype.setLinkRight = function(p_x, p_y, p_state) {
	const state = this.grid[p_y][p_x].linkRight;
	if (state == p_state) {
		return EVENT_RESULT.HARMLESS;
	} else if (state != LOOP_STATE.UNDECIDED || (state == LOOP_STATE.LINKED && this.getLinkedEdges(p_x, p_y) == 2)) {
		return EVENT_RESULT.FAILURE;
	} else {
		this.grid[p_y][p_x].linkRight = p_state;
		this.tradeLinkedSpaces(p_x, p_y, p_x+1, p_y, p_state, LOOP_DIRECTION.RIGHT, LOOP_DIRECTION.LEFT);
		return EVENT_RESULT.SUCCESS;
	}
}

LoopSolver.prototype.setLinkLeft = function(p_x, p_y, p_state) {
	return this.setLinkRight(p_x-1, p_y, p_state);
}

LoopSolver.prototype.setLinkDown = function(p_x, p_y, p_state) { 
	const state = this.grid[p_y][p_x].linkDown;
	if (state == p_state) {
		return EVENT_RESULT.HARMLESS;
	} else if (state != LOOP_STATE.UNDECIDED || (state == LOOP_STATE.LINKED && this.getLinkedEdges(p_x, p_y) == 2)) {
		return EVENT_RESULT.FAILURE;
	} else {
		this.grid[p_y][p_x].linkDown = p_state;
		this.tradeLinkedSpaces(p_x, p_y, p_x, p_y+1, p_state, LOOP_DIRECTION.DOWN, LOOP_DIRECTION.UP);
		return EVENT_RESULT.SUCCESS;
	}
}

LoopSolver.prototype.setLinkUp = function(p_x, p_y, p_state) {
	return this.setLinkDown(p_x, p_y-1, p_state);
}

LoopSolver.prototype.setLinkSpace = function(p_x, p_y, p_state) {
	const state = this.grid[p_y][p_x].state;
	if (state == p_state) {
		return EVENT_RESULT.HARMLESS;
	} else if (state != LOOP_STATE.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	} else {
		this.grid[p_y][p_x].state = p_state;
		if (p_state == LOOP_STATE.LINKED) {
			this.chainCount++;
			this.setSpaceLinkedPSAtomicDos({x : p_x, y : p_y});
		} else {
			this.setSpaceClosedPSAtomicDos({x : p_x, y : p_y});
		}
		return EVENT_RESULT.SUCCESS;
	}
} 

LoopSolver.prototype.tradeLinkedSpaces = function(p_x, p_y, p_x2, p_y2, p_state, p_direction1to2, p_direction2to1) {
	if (p_state == LOOP_STATE.CLOSED) {
		this.grid[p_y][p_x].closedEdges++;
		this.grid[p_y2][p_x2].closedEdges++;
		this.setEdgeClosedPSAtomicDos({x : p_x, y : p_y, otherX : p_x2, otherY : p_y2, direction : p_direction1to2});
	} else {	
		this.grid[p_y][p_x].chains.push(p_direction1to2); 
		this.grid[p_y2][p_x2].chains.push(p_direction2to1); 
		this.chainCount--;
		const thisChainParts = this.getLinkedEdges(p_x, p_y); //1 or 2
		const otherChainParts = this.getLinkedEdges(p_x2, p_y2);
		if (thisChainParts == 1 && otherChainParts == 1) {
			this.grid[p_y][p_x].oppositeEnd = {x : p_x2, y : p_y2};
			this.grid[p_y2][p_x2].oppositeEnd = {x : p_x, y : p_y};
		} else if (thisChainParts == 1 && otherChainParts == 2) {
			const extendedOpposite = copySpace(this.getOppositeEnd(p_x2, p_y2));
			this.grid[p_y][p_x].oppositeEnd = extendedOpposite;
			this.getSpace(extendedOpposite).oppositeEnd = {x : p_x, y : p_y};
		} else if (thisChainParts == 2 && otherChainParts == 1) {
			const extendedOpposite = copySpace(this.getOppositeEnd(p_x, p_y));
			this.grid[p_y2][p_x2].oppositeEnd = extendedOpposite;
			this.getSpace(extendedOpposite).oppositeEnd = {x : p_x2, y : p_y2};
		} else {
			const thisOpposite = this.getOppositeEnd(p_x, p_y);
			const otherOpposite = this.getOppositeEnd(p_x2, p_y2);
			this.grid[otherOpposite.y][otherOpposite.x].oppositeEnd = copySpace(thisOpposite);
			this.grid[thisOpposite.y][thisOpposite.x].oppositeEnd = copySpace(otherOpposite);
		}
		const end1 = {x : -1, y : -1};
		const end2 = {x : -1, y : -1};
		this.setEdgeLinkedPSAtomicDos({x : p_x, y : p_y, otherX : p_x2, otherY : p_y2, direction : p_direction1to2, end1 : end1, end2 : end2}); // TODO : end1 and end2 ? Not defined yet
	}
}

LoopSolver.prototype.undoLinkRight = function(p_x, p_y) {
	previousState = this.grid[p_y][p_x].linkRight;
	this.grid[p_y][p_x].linkRight = LOOP_STATE.UNDECIDED;
	this.undoTradeLinkedSpaces(p_x, p_y, p_x+1, p_y, previousState);
}

LoopSolver.prototype.undoLinkLeft = function(p_x, p_y) {
	this.undoLinkRight(p_x-1, p_y);
}

LoopSolver.prototype.undoLinkDown = function(p_x, p_y) {
	previousState = this.grid[p_y][p_x].linkDown;
	this.grid[p_y][p_x].linkDown = LOOP_STATE.UNDECIDED;
	this.undoTradeLinkedSpaces(p_x, p_y, p_x, p_y+1, previousState);
}

LoopSolver.prototype.undoLinkUp = function(p_x, p_y) {
	this.undoLinkDown(p_x, p_y-1);
}

// Undo everything between 2 orthogonally adjacent spaces (except for the linkDown, linkRight considerations, which are dependent on the methods.
LoopSolver.prototype.undoTradeLinkedSpaces = function(p_x, p_y, p_x2, p_y2, p_previousState) {
	if (p_previousState == LOOP_STATE.CLOSED) {
		this.grid[p_y][p_x].closedEdges--;
		this.grid[p_y2][p_x2].closedEdges--;
		this.setEdgeClosedPSAtomicUndos({x : p_x, y : p_y, otherX : p_x2, otherY : p_y2});
	} else {
		this.chainCount++;
		this.grid[p_y][p_x].chains.pop();
		this.grid[p_y2][p_x2].chains.pop();
		const actualThisEnd = copySpace(this.grid[p_y][p_x].oppositeEnd); // The actual end of the other chain right now
		const actualOtherEnd = copySpace(this.grid[p_y2][p_x2].oppositeEnd); // The actual end of this chain
		const thisChainParts = this.getLinkedEdges(p_x, p_y);
		const otherChainParts = this.getLinkedEdges(p_x2, p_y2);	
		if ((thisChainParts == 0) && (otherChainParts == 0)) {
			this.grid[p_y][p_x].oppositeEnd = {};
			this.grid[p_y2][p_x2].oppositeEnd = {};
		} else if (thisChainParts == 1 && otherChainParts == 0) { // Either this space or the other space had no links. In the first case, the other space was added last (and is unpiled first)
			const remainingEnd = this.grid[p_y][p_x].oppositeEnd;
			this.getSpace(remainingEnd).oppositeEnd = {x : p_x, y : p_y};
			this.grid[p_y2][p_x2].oppositeEnd = {};
		} else if (thisChainParts == 0 && otherChainParts == 1) {
			const remainingEnd = this.grid[p_y2][p_x2].oppositeEnd;
			this.getSpace(remainingEnd).oppositeEnd = {x : p_x2, y : p_y2};
			this.grid[p_y][p_x].oppositeEnd = {};
		} else { // Both spaces were linked
			const thisOpposite = this.grid[p_y][p_x].oppositeEnd;
			const otherOpposite = this.grid[p_y2][p_x2].oppositeEnd;
			this.getSpace(thisOpposite).oppositeEnd = {x : p_x, y : p_y};
			this.getSpace(otherOpposite).oppositeEnd = {x : p_x2, y : p_y2};
		}
		this.setEdgeLinkedPSAtomicUndos({x : p_x, y : p_y, otherX : p_x2, otherY : p_y2});
	}	
}

LoopSolver.prototype.undoLinkSpace = function(p_x, p_y) {
	if (this.grid[p_y][p_x].state == LOOP_STATE.LINKED){
		this.chainCount--;
		this.setSpaceLinkedPSAtomicUndos(p_x, p_y);
	} else {
		this.setSpaceClosedPSAtomicUndos(p_x, p_y);
	}
	this.grid[p_y][p_x].state = LOOP_STATE.UNDECIDED;
}

applyEventClosure = function(p_solver) {
	return function(p_event) {
		if (p_event.kind == LOOP_EVENT.STATE) {
			return p_solver.setLinkSpace(p_event.x, p_event.y, p_event.state);
		} else if (p_event.kind == LOOP_EVENT.LINK) {
			if (p_event.direction == LOOP_DIRECTION.UP) {
				return p_solver.setLinkUp(p_event.linkX, p_event.linkY, p_event.state);
			} else if (p_event.direction == LOOP_DIRECTION.DOWN) {
				return p_solver.setLinkDown(p_event.linkX, p_event.linkY, p_event.state);
			} else if (p_event.direction == LOOP_DIRECTION.LEFT) {
				return p_solver.setLinkLeft(p_event.linkX, p_event.linkY, p_event.state);
			} else {
				return p_solver.setLinkRight(p_event.linkX, p_event.linkY, p_event.state);
			}
		} else {
			return p_solver.otherPSAtomicDos(p_event);
		}
	}
}

undoEventClosure = function(p_solver) {
	return function(p_event) {
		if (p_event.kind == LOOP_EVENT.STATE) {
			p_solver.undoLinkSpace(p_event.x, p_event.y);
		} else if (p_event.kind == LOOP_EVENT.LINK) {
			if (p_event.direction == LOOP_DIRECTION.UP) {
				p_solver.undoLinkUp(p_event.linkX, p_event.linkY);
			} else if (p_event.direction == LOOP_DIRECTION.DOWN) {
				p_solver.undoLinkDown(p_event.linkX, p_event.linkY);
			} else if (p_event.direction == LOOP_DIRECTION.LEFT) {
				p_solver.undoLinkLeft(p_event.linkX, p_event.linkY);
			} else {
				p_solver.undoLinkRight(p_event.linkX, p_event.linkY);
			}
		} else {
			return p_solver.otherPSAtomicUndos(p_event);
		}
	}
}

LoopSolver.prototype.undoToLastHypothesis = function() {
	this.generalSolver.undoToLastHypothesis(undoEventClosure(this));
}

//--------------------------------
// Central methods

LoopSolver.prototype.tryToPutNewDown = function (p_x, p_y, p_state) {
	this.generalSolver.tryToApplyHypothesis(new LinkEvent(p_x, p_y, LOOP_DIRECTION.DOWN, p_state), this.methodSet);
}

LoopSolver.prototype.tryToPutNewRight = function (p_x, p_y, p_state) {
	this.generalSolver.tryToApplyHypothesis(new LinkEvent(p_x, p_y, LOOP_DIRECTION.RIGHT, p_state), this.methodSet);
}

LoopSolver.prototype.tryToPutNewSpace = function (p_x, p_y, p_state) {
	this.generalSolver.tryToApplyHypothesis(new StateEvent(p_x, p_y, p_state), this.methodSet);
}

//--------------------------------
// otherPSDeductions

// Note : all events always have validate coordinates, because it is the solver + the input's responsibility to check so. 
deductionsClosure = function(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind == LOOP_EVENT.STATE) {
			const state = p_eventBeingApplied.state;
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			if (state == LOOP_STATE.CLOSED) {
				if (x > 0) {
					p_eventList.push(new LinkEvent(x, y, LOOP_DIRECTION.LEFT, LOOP_STATE.CLOSED));
				}
				if (y > 0) {
					p_eventList.push(new LinkEvent(x, y, LOOP_DIRECTION.UP, LOOP_STATE.CLOSED));
				} 
				if (x <= p_solver.xLength-2) {
					p_eventList.push(new LinkEvent(x, y, LOOP_DIRECTION.RIGHT, LOOP_STATE.CLOSED));
				} 
				if (y <= p_solver.yLength-2) {
					p_eventList.push(new LinkEvent(x, y, LOOP_DIRECTION.DOWN, LOOP_STATE.CLOSED));
				}
				p_eventList = p_solver.setSpaceLinkedPSDeductions(p_eventList, p_eventBeingApplied);
			} else {
				p_eventList = p_solver.setSpaceClosedPSDeductions(p_eventList, p_eventBeingApplied);
			}
			p_eventList = p_solver.testSpaceAndSurrounding2v2Open(p_eventList, x, y);
		} else if (p_eventBeingApplied.kind == LOOP_EVENT.LINK) {
			const state = p_eventBeingApplied.state;
			const x = p_eventBeingApplied.linkX;
			const y = p_eventBeingApplied.linkY;
			const dir = p_eventBeingApplied.direction;	
			const neighborCoors = getNeighborCoors(x, y, dir);
			const nx = neighborCoors.x;
			const ny = neighborCoors.y;
			if (state == LOOP_STATE.LINKED) {
				p_eventList.push(new StateEvent(x, y, LOOP_STATE.LINKED));
				p_eventList.push(new StateEvent(nx, ny, LOOP_STATE.LINKED));
				if (! p_solver.checkNewEnds.array[ny][nx]) {
					p_solver.checkNewEnds.array[ny][nx] = true;
					p_solver.checkNewEnds.list.push({x : nx, y : ny});
				}
				if (! p_solver.checkNewEnds.array[y][x]) {
					p_solver.checkNewEnds.array[y][x] = true;
					p_solver.checkNewEnds.list.push({x : x, y : y});
				}
				p_eventList = p_solver.setEdgeLinkedPSDeductions(p_eventList, p_eventBeingApplied);			
			} else {
				p_eventList = p_solver.test3closed(p_eventList, x, y);
				p_eventList = p_solver.test3closed(p_eventList, nx, ny);
				p_eventList = p_solver.setEdgeClosedPSDeductions(p_eventList, p_eventBeingApplied);			
			}
			p_eventList = p_solver.testSpaceAndSurrounding2v2Open(p_eventList, x, y);			
		} else {
			
		}
		return p_eventList;
	}
}

function getNeighborCoors(p_x, p_y, p_direction) {
	switch(p_direction) {
		case LOOP_DIRECTION.LEFT : return {x: p_x-1, y:p_y};
		case LOOP_DIRECTION.UP : return {x: p_x, y:p_y-1};
		case LOOP_DIRECTION.RIGHT : return {x: p_x+1, y:p_y};
		default : return {x: p_x, y:p_y+1};
	}
}

/**
Tests if the space in x, y has 3 edges closed. If yes, close this space (the 4th edge will close).
*/
LoopSolver.prototype.test3closed = function(p_eventList, p_x, p_y) {
	if (this.getClosedEdges(p_x, p_y) == 3) {
		p_eventList.push(new StateEvent(p_x, p_y, LOOP_STATE.CLOSED));
	}
	return p_eventList;
}

LoopSolver.prototype.testSpaceAndSurrounding2v2Open = function(p_eventList, p_x, p_y) {
	p_eventList = this.test2v2OpenSpace(p_eventList, p_x, p_y);
	if (p_x > 0) {
		p_eventList = this.test2v2OpenSpace(p_eventList, p_x-1, p_y);
	}
	if (p_y > 0) {
		p_eventList = this.test2v2OpenSpace(p_eventList, p_x, p_y-1);
	}
	if (p_x <= this.xLength-2) {
		p_eventList = this.test2v2OpenSpace(p_eventList, p_x+1, p_y);
	}
	if (p_y <= this.yLength-2) {
		p_eventList = this.test2v2OpenSpace(p_eventList, p_x, p_y+1);
	}
	return p_eventList;
}

/**
Tests if the space in x, y is linked and has 2 closed spaces. If yes, link the remainder. Also, if it is linked and has 2 linked edges, close the remainder.
*/
LoopSolver.prototype.test2v2OpenSpace = function(p_eventList, p_x, p_y) {
	if (this.getLinkSpace(p_x,p_y) == LOOP_STATE.LINKED) {
		if (this.getClosedEdges(p_x, p_y) == 2 && this.getLinkedEdges(p_x,p_y) < 2) {
			if (p_x > 0 && this.getLinkLeft(p_x, p_y) == LOOP_STATE.UNDECIDED) {
				p_eventList.push(new LinkEvent(p_x, p_y, LOOP_DIRECTION.LEFT, LOOP_STATE.LINKED));
			}
			if (p_y > 0 && this.getLinkUp(p_x, p_y) == LOOP_STATE.UNDECIDED) {
				p_eventList.push(new LinkEvent(p_x, p_y, LOOP_DIRECTION.UP, LOOP_STATE.LINKED));
			}
			if (p_x <= this.xLength-2 && this.getLinkRight(p_x, p_y) == LOOP_STATE.UNDECIDED) {
				p_eventList.push(new LinkEvent(p_x, p_y, LOOP_DIRECTION.RIGHT, LOOP_STATE.LINKED));
			}
			if (p_y <= this.yLength-2 && this.getLinkDown(p_x, p_y) == LOOP_STATE.UNDECIDED) {
				p_eventList.push(new LinkEvent(p_x, p_y, LOOP_DIRECTION.DOWN, LOOP_STATE.LINKED));
			}
		}
		if (this.getLinkedEdges(p_x,p_y) == 2 && this.getClosedEdges(p_x, p_y) < 2) {
			if (p_x > 0 && this.getLinkLeft(p_x, p_y) == LOOP_STATE.UNDECIDED) {
				p_eventList.push(new LinkEvent(p_x, p_y, LOOP_DIRECTION.LEFT, LOOP_STATE.CLOSED));
			}
			if (p_y > 0 && this.getLinkUp(p_x, p_y) == LOOP_STATE.UNDECIDED) {
				p_eventList.push(new LinkEvent(p_x, p_y, LOOP_DIRECTION.UP, LOOP_STATE.CLOSED));
			}
			if (p_x <= this.xLength-2 && this.getLinkRight(p_x, p_y) == LOOP_STATE.UNDECIDED) {
				p_eventList.push(new LinkEvent(p_x, p_y, LOOP_DIRECTION.RIGHT, LOOP_STATE.CLOSED));
			}
			if (p_y <= this.yLength-2 && this.getLinkDown(p_x, p_y) == LOOP_STATE.UNDECIDED) {
				p_eventList.push(new LinkEvent(p_x, p_y, LOOP_DIRECTION.DOWN, LOOP_STATE.CLOSED));
			}
		}
	}
	return p_eventList;
}

// Tests if 2 spaces that are known to be both ends of the same chain are 1) adjacent and 2) not directly linked together
LoopSolver.prototype.testEndsClosingLoop = function (p_eventList, p_endSpace1, p_endSpace2) {
	const direction1 = this.getSpace(p_endSpace1).chains[0];
	const x1 = p_endSpace1.x;
	const y1 = p_endSpace1.y;
	const x2 = p_endSpace2.x;
	const y2 = p_endSpace2.y;
	if (x1 == x2) {
		if (y1 == (y2 + 1) && direction1 != LOOP_DIRECTION.UP) {
			p_eventList.push(new LinkEvent(x1, y1, LOOP_DIRECTION.UP, LOOP_STATE.CLOSED));
		} 
		if (y1 == (y2 - 1) && direction1 != LOOP_DIRECTION.DOWN) {
			p_eventList.push(new LinkEvent(x1, y1, LOOP_DIRECTION.DOWN, LOOP_STATE.CLOSED));
		} 
	}
	if (y1 == y2) {
		if (x1 == (x2 + 1) && direction1 != LOOP_DIRECTION.LEFT) {
			p_eventList.push(new LinkEvent(x1, y1, LOOP_DIRECTION.LEFT, LOOP_STATE.CLOSED));
		} 
		if (x1 == (x2 - 1) && direction1 != LOOP_DIRECTION.RIGHT) {
			p_eventList.push(new LinkEvent(x1, y1, LOOP_DIRECTION.RIGHT, LOOP_STATE.CLOSED));
		} 
	}
	return p_eventList;
}

// --------------------------
// Extra closures

LoopSolver.prototype.cleanNewEnds = function() {
	this.checkNewEnds.list.forEach( space => {
		this.checkNewEnds.array[space.y][space.x] = false;
	});
	this.checkNewEnds.list = [];
}

abortClosure = function(p_solver) {
	return function() {
		p_solver.cleanNewEnds();
	}
}

separateEndsClosure = function(p_solver) {
	return function() {
		var eventList = [];
		if (p_solver.chainCount != 1) {
			var opposite;
			p_solver.checkNewEnds.list.forEach (space => {
				 // Warning : transition states !
				if (p_solver.getLinkedEdges(space.x, space.y) == 1) {
					opposite = p_solver.getOppositeEnd(space.x, space.y);	
					if (p_solver.getLinkedEdges(opposite.x, opposite.y) == 1) {
						eventList = p_solver.testEndsClosingLoop(eventList, space, opposite);						
					}
				}	
			});
		}
		p_solver.cleanNewEnds(); // TODO well, when we have one link and two adjacent ends and we add a chain (ie a link or a linked space) elsewhere, the close between ends is not added.
		return eventList;
	}
}