// Setup

function LoopSolver() {
	GeneralSolver.call(this);
}

LoopSolver.prototype = Object.create(GeneralSolver.prototype);
LoopSolver.prototype.constructor = LoopSolver;

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

LoopSolver.prototype.loopSolverConstruct = function(p_array, p_puzzleSpecificMethodPack) {
	this.xLength = p_array[0].length;
    this.yLength = p_array.length;
	this.methodSetDeductions = new ApplyEventMethodNonAdjacentPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.setPuzzleSpecificMethods(p_puzzleSpecificMethodPack);
	this.methodSetDeductions.addAbortAndFilters(abortClosure(this), [testLoopsClosure(this), separateEndsClosure(this)]);
    this.grid = [];
    this.bannedSpacesGrid = [];
	this.checkNewEnds = {
		array : [],
		list : []
	}
	this.endedChainCount = 0; // Counts at all times the number of chains that are not loops + lone linked spaces.
	this.loopMade = 0;
	var x,y;
	for (y = 0; y < this.yLength ; y++) {
		this.grid.push([]);
		this.bannedSpacesGrid.push([]);
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
			this.bannedSpacesGrid[y].push(p_array[y][x].state == WALLGRID.CLOSED);
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
	
	// Ergonomic options
	this.ergonomicOptions = {
		displayOtherEnds : false,
		colorChains : false
	}
}

// -------------------
// During the build (no deductions at all)

LoopSolver.prototype.banSpace = function(p_x, p_y) {
	this.bannedSpacesGrid[p_y][p_x] = true;
	if (this.neighborExists(p_x, p_y, LOOP_DIRECTION.RIGHT)) {
		this.setLinkRight(p_x, p_y, LOOP_STATE.CLOSED);
	}
	if (this.neighborExists(p_x, p_y, LOOP_DIRECTION.UP)) {
		this.setLinkUp(p_x, p_y, LOOP_STATE.CLOSED);
	}
	if (this.neighborExists(p_x, p_y, LOOP_DIRECTION.LEFT)) {
		this.setLinkLeft(p_x, p_y, LOOP_STATE.CLOSED);
	}
	if (this.neighborExists(p_x, p_y, LOOP_DIRECTION.DOWN)) {
		this.setLinkDown(p_x, p_y, LOOP_STATE.CLOSED);
	}
	this.setLinkSpace(p_x, p_y, LOOP_STATE.CLOSED);
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

LoopSolver.prototype.getLink = function(p_x, p_y, p_dir) {
	switch(p_dir) {
		case LOOP_DIRECTION.LEFT : return this.getLinkLeft(p_x, p_y); break;
		case LOOP_DIRECTION.UP : return this.getLinkUp(p_x, p_y); break;
		case LOOP_DIRECTION.RIGHT : return this.getLinkRight(p_x, p_y); break;
		case LOOP_DIRECTION.DOWN : return this.getLinkDown(p_x, p_y); break;
	}
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

LoopSolver.prototype.isBanned = function(p_x, p_y){
	return this.bannedSpacesGrid[p_y][p_x];
}

// Appearance getters
LoopSolver.prototype.areActiveClosedSpaces = function() {
	return this.ergonomicOptions.closedSpacesAreActive;
}

LoopSolver.prototype.areAllOpenSpaces = function() {
	return this.ergonomicOptions.allOpenSpaces;
}

LoopSolver.prototype.getColorChains = function (p_x, p_y) {
	if (this.ergonomicOptions.colorChains == true) {
		return this.colorChainsGrid[p_y][p_x];
	} else {
		return null;
	}
}

// -------------------
// "Protected" methods

LoopSolver.prototype.activateClosedSpaces = function() {
	this.ergonomicOptions.closedSpacesAreActive = true;
}

LoopSolver.prototype.signalAllOpenSpaces = function() {
	this.ergonomicOptions.allOpenSpaces = true;
}

// -------------------
// Misc. inner methods

copySpace = function(p_space) {
	return {
		x : p_space.x,
		y : p_space.y
	}
}

LoopSolver.prototype.cleanErgonomicOptions = function() {
	this.ergonomicOptions.displayOppositeEnds = false;
	this.ergonomicOptions.colorChains = false;
}

/** Colors a chain from a starting point. The starting point must have one single end.
*/
LoopSolver.prototype.colorChain = function (p_x, p_y, p_number) {
	this.colorChainsGrid[p_y][p_x] = p_number;
	var dir = this.grid[p_y][p_x].chains[0];
	var newDir;
	var x = p_x + deltaX[dir];
	var y = p_y + deltaY[dir];
	counter = 0;
	while (this.getLinkedEdges(x, y) == 2 && counter < 500) {
		this.colorChainsGrid[y][x] = p_number;
		newDir = this.grid[y][x].chains[0];
		if (newDir == oppositeDirection[dir]) {
			dir = this.grid[y][x].chains[1];
		} else {
			dir = newDir;
		}
		x += deltaX[dir];
		y += deltaY[dir];
		counter++;
		if (counter == 500) {
			alert("Congratulations, you failed your while loop !");
		}
	}
	this.colorChainsGrid[y][x] = p_number;
}

//--------------------------------
// Utilitary functions

LoopSolver.prototype.neighborExists = function(p_x, p_y, p_dir) {
	switch (p_dir) {
		case LOOP_DIRECTION.LEFT : return (p_x > 0); break;
		case LOOP_DIRECTION.UP : return (p_y > 0); break;
		case LOOP_DIRECTION.RIGHT : return (p_x <= this.xLength-2); break;
		case LOOP_DIRECTION.DOWN : return (p_y <= this.yLength-2); break;
	}
}

// -------------------
// Doing and undoing 

// Warning : offensive programmation, no boundary check !
LoopSolver.prototype.setLinkRight = function(p_x, p_y, p_state) {
	this.cleanErgonomicOptions(); 
	const state = this.grid[p_y][p_x].linkRight;
	if (state == p_state) {
		return EVENT_RESULT.HARMLESS;
	} else if (state != LOOP_STATE.UNDECIDED || (p_state == LOOP_STATE.LINKED && (this.getLinkedEdges(p_x, p_y) == 2 || this.getLinkedEdges(p_x+1, p_y) == 2))) {
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
	this.cleanErgonomicOptions(); 
	const state = this.grid[p_y][p_x].linkDown;
	if (state == p_state) {
		return EVENT_RESULT.HARMLESS;
	} else if (state != LOOP_STATE.UNDECIDED || (p_state == LOOP_STATE.LINKED && (this.getLinkedEdges(p_x, p_y) == 2 || this.getLinkedEdges(p_x, p_y+1) == 2))) {
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
	this.cleanErgonomicOptions(); 
	const state = this.grid[p_y][p_x].state;
	if (state == p_state) {
		return EVENT_RESULT.HARMLESS;
	} else if (state != LOOP_STATE.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	} else {
		this.grid[p_y][p_x].state = p_state;
		if (p_state == LOOP_STATE.LINKED) {
			this.endedChainCount++;
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
		this.endedChainCount--;
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
			if ((thisOpposite.x == p_x2) && (thisOpposite.y == p_y2) && (otherOpposite.x == p_x) && (otherOpposite.y == p_y)) { // If (p_x, p_y) and (p_x2, p_y2) were already opposed prior to be linked, a loop is made. 
				this.loopMade++; // TODO maybe this can be sped up : if we have 2 loops or more, it should be aborted !
			}
			// TODO it is time to detect when more than one loop is made in one go !
			this.grid[otherOpposite.y][otherOpposite.x].oppositeEnd = copySpace(thisOpposite);
			this.grid[thisOpposite.y][thisOpposite.x].oppositeEnd = copySpace(otherOpposite);
		}
		const end1 = {x : -1, y : -1};
		const end2 = {x : -1, y : -1};
		this.setEdgeLinkedPSAtomicDos({x : p_x, y : p_y, otherX : p_x2, otherY : p_y2, direction : p_direction1to2, end1 : end1, end2 : end2}); // TODO : end1 and end2 ? Not defined yet
	}
}

LoopSolver.prototype.undoLinkRight = function(p_x, p_y) {
	this.cleanErgonomicOptions(); 
	previousState = this.grid[p_y][p_x].linkRight;
	this.grid[p_y][p_x].linkRight = LOOP_STATE.UNDECIDED;
	this.undoTradeLinkedSpaces(p_x, p_y, p_x+1, p_y, previousState);
}

LoopSolver.prototype.undoLinkLeft = function(p_x, p_y) {
	this.undoLinkRight(p_x-1, p_y);
}

LoopSolver.prototype.undoLinkDown = function(p_x, p_y) {
	this.cleanErgonomicOptions(); 
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
		this.endedChainCount++;
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
	this.cleanErgonomicOptions(); 
	if (this.grid[p_y][p_x].state == LOOP_STATE.LINKED) {
		this.endedChainCount--;
		this.setSpaceLinkedPSAtomicUndos({x : p_x, y : p_y});
	} else {
		this.setSpaceClosedPSAtomicUndos({x : p_x, y : p_y});
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

//--------------------------------
// Input methods

LoopSolver.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

// Ergonomic input methods. "Action" is directly written since it is provided for inputs.

LoopSolver.prototype.seeOppositeEndsAction = function() {
	this.ergonomicOptions.displayOppositeEnds = true;
}

LoopSolver.prototype.seeColorChainsAction = function() {
	if (!this.ergonomicOptions.colorChains) {
		this.colorChainsGrid = [];
		for (var y = 0 ; y < this.yLength ; y++) {
			this.colorChainsGrid.push([]);
			for (var x = 0 ; x < this.xLength ; x++) {
				this.colorChainsGrid[y].push(null);
			}
		}
		number = 0;
		for (var y = 0 ; y < this.yLength ; y++) {
			for (var x = 0 ; x < this.xLength ; x++) {
				if (this.getLinkedEdges(x,y) == 1 && this.colorChainsGrid[y][x] == null) {
					this.colorChain(x,y, number);
					number++;
				}
			}
		}
	}
	this.ergonomicOptions.colorChains = true;
}



//--------------------------------
// Central methods

LoopSolver.prototype.tryToPutNewDown = function (p_x, p_y, p_state) {
	this.tryToApplyHypothesis(new LinkEvent(p_x, p_y, LOOP_DIRECTION.DOWN, p_state), this.methodSetDeductions);
}

LoopSolver.prototype.tryToPutNewRight = function (p_x, p_y, p_state) {
	this.tryToApplyHypothesis(new LinkEvent(p_x, p_y, LOOP_DIRECTION.RIGHT, p_state), this.methodSetDeductions);
}

LoopSolver.prototype.tryToPutNewSpace = function (p_x, p_y, p_state) {
	this.tryToApplyHypothesis(new StateEvent(p_x, p_y, p_state), this.methodSetDeductions);
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
				p_eventList = p_solver.setSpaceClosedPSDeductions(p_eventList, p_eventBeingApplied);
			} else {
				p_eventList = p_solver.setSpaceLinkedPSDeductions(p_eventList, p_eventBeingApplied);
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
		} else if (p_eventBeingApplied.kind == LOOP_EVENT.COMPOUND_LINK) {
			p_eventList.push(new LinkEvent(p_eventBeingApplied.linkX, p_eventBeingApplied.linkY, p_eventBeingApplied.direction1, p_eventBeingApplied.state));
			p_eventList.push(new LinkEvent(p_eventBeingApplied.linkX, p_eventBeingApplied.linkY, p_eventBeingApplied.direction2, p_eventBeingApplied.state));
			return p_eventList;
		} else {
			p_eventList = p_solver.otherPSDeductions(p_eventList, p_eventBeingApplied);
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
// Filter and abort closures

LoopSolver.prototype.cleanNewEnds = function() {
	this.checkNewEnds.list.forEach( space => {
		this.checkNewEnds.array[space.y][space.x] = false;
	});
	this.checkNewEnds.list = [];
}

abortClosure = function(p_solver) {
	return function() {
		p_solver.cleanNewEnds();
		p_solver.loopMade = 0;
	}
}

// If during this deduction, either more than one loop was made OR one loop was made but there is still an unlooped chain somewhere...
testLoopsClosure = function(p_solver) {
	return function() {
		if ((p_solver.loopMade > 1) || (p_solver.endedChainCount > 0 && p_solver.loopMade == 1)) {
			return EVENT_RESULT.FAILURE;
		} else {
			p_solver.loopMade = 0;
			return [];
		}
	}
}

separateEndsClosure = function(p_solver) { //TODO well, this function is called after all other openings and closings have been performed, which can lead to a closed loop because all linked spaces have exactly 2 linked edges except a few ones that had one linked and had one undecided edge left...
	return function() {
		var eventList = [];
		var ok = true;
		var index = 0;
		var space;
		if (p_solver.endedChainCount != 1) {
			var opposite, opposite2;
			while (ok && index < p_solver.checkNewEnds.list.length) {
				space = p_solver.checkNewEnds.list[index];
				opposite = p_solver.getOppositeEnd(space.x, space.y);	
				if ((opposite.x || opposite.x == 0) && p_solver.getLinkedEdges(opposite.x, opposite.y) == 1) {
					opposite2 = p_solver.getOppositeEnd(opposite.x, opposite.y);	
					if (p_solver.getLinkedEdges(opposite2.x, opposite2.y) == 1) {
						eventList = p_solver.testEndsClosingLoop(eventList, opposite2, opposite);						
					}
				}
				index++;
			}
		}		
		p_solver.cleanNewEnds(); // TODO well, when we have one link and two adjacent ends and we add a chain (ie a link or a linked space) elsewhere, the close between ends is not added.
		if (!ok) {
			return EVENT_RESULT.FAILURE;
		} else {
			return eventList;
		}
	}
}

// --------------------------
// Methods for passing

/**
 Pass absolutely any space. TODO : Really cound be optimized.
*/
LoopSolver.prototype.standardSpacePassEvents = function(p_x, p_y) { // TODO Warning : this one uses argument coorginates instead of an argument item ! Don't get confused.
	var answer = [new StateEvent(p_x, p_y, LOOP_STATE.CLOSED)];
	const okLeft = (p_x >= 1);
	const okUp = (p_y >= 1);
	const okRight = (p_x <= this.xLength-2);
	const okDown = (p_y <= this.yLength-2);
	if (okLeft) {
		if (okUp) {
			answer.push(new CompoundLinkEvent(p_x, p_y, LOOP_DIRECTION.LEFT, LOOP_DIRECTION.UP, LOOP_STATE.LINKED));
		}
		if (okRight) {
			answer.push(new CompoundLinkEvent(p_x, p_y, LOOP_DIRECTION.LEFT, LOOP_DIRECTION.RIGHT, LOOP_STATE.LINKED));
		}
		if (okDown) {
			answer.push(new CompoundLinkEvent(p_x, p_y, LOOP_DIRECTION.LEFT, LOOP_DIRECTION.DOWN, LOOP_STATE.LINKED));
		}
	}
	if (okUp) {
		if (okRight) {
			answer.push(new CompoundLinkEvent(p_x, p_y, LOOP_DIRECTION.RIGHT, LOOP_DIRECTION.UP, LOOP_STATE.LINKED));
		}
		if (okDown) {
			answer.push(new CompoundLinkEvent(p_x, p_y, LOOP_DIRECTION.DOWN, LOOP_DIRECTION.UP, LOOP_STATE.LINKED));
		}
	}
	if (okRight && okDown) {
		answer.push(new CompoundLinkEvent(p_x, p_y, LOOP_DIRECTION.RIGHT, LOOP_DIRECTION.DOWN, LOOP_STATE.LINKED));
	}
	return [answer];
}

// The events passed in comparison must be "converted", e.g. going either down or right.
comparisonLoopEventsMethod = function(p_event1, p_event2) {
	const cEvent1 = convertLoopEvent(p_event1);
	const cEvent2 = convertLoopEvent(p_event2); // TODO yeah, the events must be converted for sure, but they could be converted before the function is called. Anyway, this comparison method is potentially optimizable...
	const k1 = (cEvent1.kind == LOOP_EVENT.LINK ? 0 : 1);
	const k2 = (cEvent2.kind == LOOP_EVENT.LINK ? 0 : 1);
	if (k1 != k2) {
		return (k1 - k2);		
	} else {
		if (k1 == 0) { // J'avais oublié de distinguer "links" et "spaces".
		 // 25 janvier 2021, en milieu-fin de développement du solveur de Masyu et aux débuts du LoopSolver : Je sais grâce au pass sur Chocona fait la veille (ou aujourd'hui ?) que si une seule des 2 "possibilités" lors d'une passe sont exploitées, c'est parce que ça bloque au niveau de la méthode de comparaison.
			if (cEvent2.linkY > cEvent1.linkY) {
				return -1;
			} else if (cEvent2.linkY < cEvent1.linkY) {
				return 1;
			} else if (cEvent2.linkX > cEvent1.linkX) {
				return -1;
			} else if (cEvent2.linkX < cEvent1.linkX) {
				return 1;
			} else {
				const d1 = (cEvent1.direction == LOOP_DIRECTION.RIGHT ? 0 : 1);
				const d2 = (cEvent2.direction == LOOP_DIRECTION.RIGHT ? 0 : 1); // Et non "LOOP_EV.NT.RIGHT" (E remplacé par un point pour ne pas perturber les recherches)"
				if (d1 != d2) {
					return d1-d2;
				} else {
					const c1 = (cEvent1.state == LOOP_STATE.LINKED ? 0 : 1); 
					const c2 = (cEvent2.state == LOOP_STATE.LINKED ? 0 : 1); 
					return c1-c2;
				}
			}
		} else {
			if (cEvent2.y > cEvent1.y) {
				return -1;
			} else if (cEvent2.y < cEvent1.y) {
				return 1;
			} else if (cEvent2.x > cEvent1.x) {
				return -1;
			} else if (cEvent2.x < cEvent1.x) {
				return 1;
			} else {
				const c1 = (cEvent1.state == LOOP_STATE.LINKED ? 0 : 1);
				const c2 = (cEvent2.state == LOOP_STATE.LINKED ? 0 : 1); 
				return c1-c2;
			}
		}
	}
}

// Convert a loop event to make it compatible with the comparison method above 
convertLoopEvent = function(p_event) {
	if (p_event.kind == LOOP_EVENT.LINK && (p_event.direction == LOOP_DIRECTION.LEFT || p_event.direction == LOOP_DIRECTION.UP)) {
		return p_event.dual();
	} else {
		return p_event;
	}
}

copyLoopEventMethod = function(p_event) {
	return p_event.copy();
}

// ----------------
// Multipass

/**
Multipass for all loop solvers that focuses on the spaces. 
All spaces are sorted into categories (arrays) and a pass is executed on each space, in the order of categories, to the most relevant (the first one) to the least relevant (last one).
p_setMultipass contains all these optional parameters : 
numberPSCategories : number of extra categories specific to the puzzle.
PSCategoryMethod : method that determinates the category. Must return a number ; between 0 and (numberPSCategories-1), it is selected. Otherwise, the space will be sorted in a standard category.
generatePassEventsMethod : the list of contradictory events that should be generated relative to this space. May call standardSpacePassEvents to generate a standard list of up to 7 possibilites (closed space + up to 6 combinations of 2 linked edges)
tolerateClosedSpaces : boolean that tells whether the category should be tested or not.
WARNING : standardSpacePassEvents uses (p_x, p_y) as arguments instead of p_space !
*/
// TODO may be optimized considering cases where the undecided links are consecutive in direction order or opposite.
LoopSolver.prototype.multiPass = function(p_methodSetDeductions, p_methodSetPass, p_setMultipass) {
	const numberPSCategories = (p_setMultipass.numberPSCategories ? p_setMultipass.numberPSCategories : 0);
	var categoriesSpaces = [];
	for (var i = 0; i < numberPSCategories ; i++) {
		categoriesSpaces.push([]);
	}
	this.arrayPassStandardOrderIndexes(categoriesSpaces);
	var cat;
	for (var y = 0; y < this.yLength ; y++) {
		for (var x = 0; x < this.xLength ; x++) {
			cat = this.getPassOrderIndex(p_setMultipass, x, y);
			if (cat >= 0 && cat < categoriesSpaces.length) {
				categoriesSpaces[cat].push({x : x, y : y});
			}
		}
	}
	
	var oneMoreLoop = false;
	var space;
	var ok = true;
	const lengthBeforeMultiPass = this.happenedEvents.length;
	do {
		oneMoreLoop = false;
		const happenedEventsBeforePassingAllRegions = this.happenedEvents.length;
		i = 0;
		
		// "break" porte sur les boucles for, while, do..while et la bien connue switch.
		// Crédits : https://developer.mozilla.org/fr/docs/Web/JavaScript/Guide/Boucles_et_it%C3%A9ration#linstruction_break 
		for (var ic = 0; ic < categoriesSpaces.length ; ic++) {
			for (var is = 0 ; is < categoriesSpaces[ic].length ; is++) {
				space = categoriesSpaces[ic][is];
				resultPass = [];
				if (p_setMultipass.generatePassEventsMethod) {
					resultpass = this.passEvents(p_setMultipass.generatePassEventsMethod(space), p_methodSetDeductions ,p_methodSetPass, space);
				}
				if (resultPass.length == 0) {
					resultPass = this.passEvents(this.standardSpacePassEvents(space.x, space.y), p_methodSetDeductions ,p_methodSetPass, space); 
				}
				if (resultPass == PASS_RESULT.SUCCESS) {
					oneMoreLoop = true;
				} else if (resultPass == PASS_RESULT.FAILURE) {
					ok = false;
					break;
				}
			}
			if (!ok) {
				break;
			}
		}
		if (ok && oneMoreLoop) {
			var newCategoriesSpaces = [[],[]];
			this.arrayPassStandardOrderIndexes(newCategoriesSpaces);
			var trash = [];
			for (var ic = 0; ic < categoriesSpaces.length ; ic++) {
				for (var is = 0 ; is < categoriesSpaces[ic].length ; is++) {
					space = categoriesSpaces[ic][is];
					cat = this.getPassOrderIndex(p_setMultipass, space.x, space.y);
					if (cat >= 0 && cat < newCategoriesSpaces.length) {
						newCategoriesSpaces[cat].push({x : space.x, y : space.y});
					}
					if (cat == -1) {
						trash.push({x : space.x, y : space.y});
					}
				}
			}
			categoriesSpaces = newCategoriesSpaces;
		}
	} while (ok && oneMoreLoop);
	if (!ok) {
		while (this.happenedEvents.length > lengthBeforeMultiPass) {
			var lastEventsList = this.happenedEvents.pop();
			this.undoEventList(lastEventsList.list, this.methodSetDeductions.undoEventMethod);
		}
	}
}

// Returns the index of a passing-priority category the space should be pushed into. I guess this can be accelerated.
LoopSolver.prototype.getPassOrderIndex = function(p_setMultipass, p_x, p_y) {
	const existentPSPassOrderIndexMethods = (p_setMultipass.numberPSCategories > 0 && p_setMultipass.PSCategoryMethod);
	if (this.getLinkSpace(p_x, p_y) != LOOP_STATE.CLOSED && this.getLinkedEdges(p_x, p_y) != 2) {
		if (existentPSPassOrderIndexMethods) {
			const cat = p_setMultipass.PSCategoryMethod(p_x, p_y);
			if (cat >= 0 && cat < p_setMultipass.numberPSCategories) {
				return cat;
			} else {
				return this.getPassStandardPriorityIndex(p_x, p_y) + p_setMultipass.numberPSCategories;
			}
		}
	} else if ((p_setMultipass.tolerateClosedSpaces) && this.getLinkSpace(p_x, p_y) == LOOP_STATE.CLOSED) { // If not for this, closed spaces are purely skipped even when they may have valuable information
		if (existentPSPassOrderIndexMethods) {
			const cat = p_setMultipass.PSCategoryMethod(p_x, p_y);
			if (cat >= 0 && cat < p_setMultipass.numberPSCategories) {
				return cat;
			}
		}
	}
	return -1;
}

// WARNING : assumes that the space isn't already determined. (space is closed or has 2 linked edges)
// Returns an "order index" : 0 for a space that should be passed first, 1 for a space that should be passed then, etc...
LoopSolver.prototype.getPassStandardPriorityIndex = function(p_x, p_y) {
	if (this.getClosedEdges(p_x, p_y) == 2) {
		return 0; // Two edges closed.
	} else if (this.getLinkedEdges(p_x, p_y) == 1) {	
		if (this.getClosedEdges(p_x, p_y) == 1) {
			return 1; // One closed, one open
		} else {
			return 2; // One open and that's it
		}
	} else {
		const oneClosed = this.getClosedEdges(p_x, p_y) == 1;
		const isOpen = (this.getLinkSpace(p_x, p_y) == LOOP_STATE.LINKED);
		return 3 + (oneClosed ? 0 : 2) + (isOpen ? 0 : 1);
		// 3 4 5 6 : oneClosed not open ; oneClosed not open ; open only ; totally unknown (or already fully known)
	}
}

/**
Returns an array of empty arrays ; there should be one for each standard order index, since spaces will be deposed into these arrays afterwards
*/
LoopSolver.prototype.arrayPassStandardOrderIndexes = function(p_passCategorySpaces) {
	for (var i = 0; i < 7 ; i++ ) { // This loop size may have to be changed.
		p_passCategorySpaces.push([]);
	}
	return p_passCategorySpaces;
}

// ----------------
// To string, for debug for instance
LoopSolver.prototype.logOppositeEnd = function(p_xStart = 0, p_yStart = 0, p_xEnd, p_yEnd) {
	var answer = "\n";
	var oppositeEndSpace;
	var stringSpace;
	var stringSep;
	if (!p_xEnd) {
		p_xEnd = this.xLength;
	} 
	if (!p_yEnd) {
		p_yEnd = this.yLength;
	}
	for (var iy = p_yStart; iy < p_yEnd ; iy++) {
		for (var ix = p_xStart; ix < p_xEnd ; ix++) {
			oppositeEndSpace = this.grid[iy][ix].oppositeEnd;
			if (oppositeEndSpace.x || oppositeEndSpace.x == 0) {
				if (this.getLinkedEdges(ix, iy) == 1) {
					stringSep="*";
				}	else {
					stringSep=" ";
				}
				stringSpace = oppositeEndSpace.x+stringSep+oppositeEndSpace.y;
			} else {
				stringSpace = "ND";
			}
			while(stringSpace.length < 5) {
				stringSpace+= " ";
			}
			answer+=stringSpace+"|";
		}
		answer+="\n";
	}
	console.log(answer);
}