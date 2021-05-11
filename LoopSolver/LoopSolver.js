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
	
	this.PSQuickStart = p_packMethods.PSQuickStart;
	if (!this.PSQuickStart) {
		this.PSQuickStart = function() {}
	}
	
	this.PSFilters = p_packMethods.PSFilters;
	if (!this.PSFilters) {
		this.PSFilters = [];
	}
	this.PSAbortMethods = p_packMethods.PSAbortMethods;
	if (!this.PSAbortMethods) {
		this.PSAbortMethods = [];
	}
}

LoopSolver.prototype.loopSolverConstruct = function(p_array, p_puzzleSpecificMethodPack) {
	this.generalConstruct();
	this.xLength = p_array[0].length;
    this.yLength = p_array.length;
	this.methodSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.setPuzzleSpecificMethods(p_puzzleSpecificMethodPack);
	this.methodSetDeductions.setOneAbortAndFilters(abortClosure(this), [testLoopsClosure(this), separateEndsClosure(this)]);
	this.methodSetDeductions.addMoreFilters(this.PSFilters);
	this.methodSetDeductions.addMoreAborts(this.PSAbortMethods);
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
			this.bannedSpacesGrid[y].push(false);
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
	if (!p_puzzleSpecificMethodPack.setEdgeClosedPSAtomicDos) { // This setup is performed before puzzle specific setup, but if puzzle has events for closed links or closed spaces, it should perform its own ban.
		for (y = 0 ; y < this.yLength ; y++) {
			for (x = 0 ; x < this.xLength ; x++) {
				if (p_array[y][x].state == WALLGRID.CLOSED) {
					this.banSpace(x, y);
				}
			}
		}	
	}
	// Warning : if this puzzle has regular banned spaces, it is better to let the puzzle perform its own ban of spaces.
	
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
	this.existingNeighborsDirections(p_x, p_y).forEach(direction => {
		this.setLink(p_x, p_y, direction, LOOP_STATE.CLOSED);
	});
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
		case DIRECTION.LEFT : return this.getLinkLeft(p_x, p_y); break;
		case DIRECTION.UP : return this.getLinkUp(p_x, p_y); break;
		case DIRECTION.RIGHT : return this.getLinkRight(p_x, p_y); break;
		case DIRECTION.DOWN : return this.getLinkDown(p_x, p_y); break;
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

// If used, consider that closed spaces play an acting role in the puzzle (for instance : "two closed spaces cannot be orthogonally adjacent")
LoopSolver.prototype.declareClosedSpacesActing = function() {
	this.ergonomicOptions.closedSpacesAreActive = true;
}

// If used, all non-banned spaces must be open for this puzzle (ex. : EntryExit) (TODO : does it manage banned spaces yet ?)
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
	var x = p_x + DeltaX[dir];
	var y = p_y + DeltaY[dir];
	counter = 0;
	while (this.getLinkedEdges(x, y) == 2 && counter < 500) {
		this.colorChainsGrid[y][x] = p_number;
		newDir = this.grid[y][x].chains[0];
		if (newDir == OppositeDirection[dir]) {
			dir = this.grid[y][x].chains[1];
		} else {
			dir = newDir;
		}
		x += DeltaX[dir];
		y += DeltaY[dir];
		counter++;
		if (counter == 500) {
			alert("Congratulations, you failed your while loop !");
		}
	}
	this.colorChainsGrid[y][x] = p_number;
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
		this.tradeLinkedSpaces(p_x, p_y, p_x+1, p_y, p_state, DIRECTION.RIGHT, DIRECTION.LEFT);
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
		this.tradeLinkedSpaces(p_x, p_y, p_x, p_y+1, p_state, DIRECTION.DOWN, DIRECTION.UP);
		return EVENT_RESULT.SUCCESS;
	}
}

LoopSolver.prototype.setLinkUp = function(p_x, p_y, p_state) {
	return this.setLinkDown(p_x, p_y-1, p_state);
}

LoopSolver.prototype.setLink = function(p_x, p_y, p_direction, p_state) {
	switch(p_direction) {
		case DIRECTION.LEFT : return this.setLinkLeft(p_x, p_y, p_state); break;
		case DIRECTION.UP : return this.setLinkUp(p_x, p_y, p_state); break;
		case DIRECTION.RIGHT : return this.setLinkRight(p_x, p_y, p_state); break;
		default : return this.setLinkDown(p_x, p_y, p_state); break;
	}
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
			if (p_event.direction == DIRECTION.UP) {
				return p_solver.setLinkUp(p_event.linkX, p_event.linkY, p_event.state);
			} else if (p_event.direction == DIRECTION.DOWN) {
				return p_solver.setLinkDown(p_event.linkX, p_event.linkY, p_event.state);
			} else if (p_event.direction == DIRECTION.LEFT) {
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
			if (p_event.direction == DIRECTION.UP) {
				p_solver.undoLinkUp(p_event.linkX, p_event.linkY);
			} else if (p_event.direction == DIRECTION.DOWN) {
				p_solver.undoLinkDown(p_event.linkX, p_event.linkY);
			} else if (p_event.direction == DIRECTION.LEFT) {
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

LoopSolver.prototype.maskChainsInformation = function() {
	this.ergonomicOptions.displayOppositeEnds = false;
	this.ergonomicOptions.colorChains = false;
}

//--------------------------------
// Central methods

LoopSolver.prototype.tryToPutNewDown = function (p_x, p_y, p_state) {
	this.tryToApplyHypothesis(new LinkEvent(p_x, p_y, DIRECTION.DOWN, p_state), this.methodSetDeductions);
}

LoopSolver.prototype.tryToPutNewRight = function (p_x, p_y, p_state) {
	this.tryToApplyHypothesis(new LinkEvent(p_x, p_y, DIRECTION.RIGHT, p_state), this.methodSetDeductions);
}

LoopSolver.prototype.tryToPutNewLink = function (p_x, p_y, p_dir, p_state) {
	this.tryToApplyHypothesis(new LinkEvent(p_x, p_y, p_dir, p_state), this.methodSetDeductions);
}

LoopSolver.prototype.tryToPutNewSpace = function (p_x, p_y, p_state) {
	this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_state), this.methodSetDeductions);
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
				p_solver.existingNeighborsDirections(x, y).forEach(dir => {
					p_eventList.push(new LinkEvent(x, y, dir, LOOP_STATE.CLOSED));
				});
				p_eventList = p_solver.setSpaceClosedPSDeductions(p_eventList, p_eventBeingApplied);
			} else {
				p_eventList = p_solver.setSpaceLinkedPSDeductions(p_eventList, p_eventBeingApplied);
			}
			p_eventList = p_solver.deductionsSpaceAndSurrounding2v2Open(p_eventList, x, y);
		} else if (p_eventBeingApplied.kind == LOOP_EVENT.LINK) {
			const state = p_eventBeingApplied.state;
			const x = p_eventBeingApplied.linkX;
			const y = p_eventBeingApplied.linkY;
			const dir = p_eventBeingApplied.direction;	
			const neighborCoors = getNeighborCoors(x, y, dir);
			const nx = neighborCoors.x;
			const ny = neighborCoors.y;
			if (state == LOOP_STATE.LINKED) {
				p_eventList.push(new SpaceEvent(x, y, LOOP_STATE.LINKED));
				p_eventList.push(new SpaceEvent(nx, ny, LOOP_STATE.LINKED));
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
			p_eventList = p_solver.deductionsSpaceAndSurrounding2v2Open(p_eventList, x, y);			
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
		case DIRECTION.LEFT : return {x: p_x-1, y:p_y};
		case DIRECTION.UP : return {x: p_x, y:p_y-1};
		case DIRECTION.RIGHT : return {x: p_x+1, y:p_y};
		default : return {x: p_x, y:p_y+1};
	}
}

/**
Tests if the space in x, y has 3 edges closed. If yes, close this space (the 4th edge will close).
*/
LoopSolver.prototype.test3closed = function(p_eventList, p_x, p_y) {
	if (this.getClosedEdges(p_x, p_y) == 3) {
		p_eventList.push(new SpaceEvent(p_x, p_y, LOOP_STATE.CLOSED));
	}
	return p_eventList;
}

LoopSolver.prototype.deductionsSpaceAndSurrounding2v2Open = function(p_eventList, p_x, p_y) {
	p_eventList = this.deductions2v2OpenSpace(p_eventList, p_x, p_y);
	this.existingNeighborsCoorsDirections(p_x, p_y).forEach(coors => {
		p_eventList = this.deductions2v2OpenSpace(p_eventList, coors.x, coors.y);
	});
	return p_eventList;
}

/**
Tests if the space in x, y is linked and has 2 closed spaces. If yes, link the remainder. Also, if it is linked and has 2 linked edges, close the remainder.
*/
LoopSolver.prototype.deductions2v2OpenSpace = function(p_eventList, p_x, p_y) {
	if (this.getLinkSpace(p_x,p_y) == LOOP_STATE.LINKED) {
		if (this.getClosedEdges(p_x, p_y) == 2 && this.getLinkedEdges(p_x, p_y) < 2) {
			this.existingNeighborsDirections(p_x, p_y).forEach(dir => {
				if (this.getLink(p_x, p_y, dir) == LOOP_STATE.UNDECIDED) {					
					p_eventList.push(new LinkEvent(p_x, p_y, dir, LOOP_STATE.LINKED));
				}
			});
		}
		if (this.getLinkedEdges(p_x,p_y) == 2 && this.getClosedEdges(p_x, p_y) < 2) {
			this.existingNeighborsDirections(p_x, p_y).forEach(dir => {
				if (this.getLink(p_x, p_y, dir) == LOOP_STATE.UNDECIDED) {					
					p_eventList.push(new LinkEvent(p_x, p_y, dir, LOOP_STATE.CLOSED));
				}
			});
		}
	}
	return p_eventList;
}

// Tests if 2 spaces that are known to be both ends of the same chain are 1) adjacent and not directly linked together 2) separated by one space. 
LoopSolver.prototype.testEndsClosingLoop = function (p_eventList, p_endSpace1, p_endSpace2) {
	const direction1 = this.getSpace(p_endSpace1).chains[0];
	const x1 = p_endSpace1.x;
	const y1 = p_endSpace1.y;
	const x2 = p_endSpace2.x;
	const y2 = p_endSpace2.y;
	// Adjacent and not directly linked ?
	if (x1 == x2) {
		if (y1 == (y2 + 1) && direction1 != DIRECTION.UP) {
			p_eventList.push(new LinkEvent(x1, y1, DIRECTION.UP, LOOP_STATE.CLOSED));
		} 
		if (y1 == (y2 - 1) && direction1 != DIRECTION.DOWN) {
			p_eventList.push(new LinkEvent(x1, y1, DIRECTION.DOWN, LOOP_STATE.CLOSED));
		} 
	}
	if (y1 == y2) {
		if (x1 == (x2 + 1) && direction1 != DIRECTION.LEFT) {
			p_eventList.push(new LinkEvent(x1, y1, DIRECTION.LEFT, LOOP_STATE.CLOSED));
		} 
		if (x1 == (x2 - 1) && direction1 != DIRECTION.RIGHT) {
			p_eventList.push(new LinkEvent(x1, y1, DIRECTION.RIGHT, LOOP_STATE.CLOSED));
		} 
	}	
	// Opposites are separated by one spaces that has 2 closed edges
	const xMin = Math.min(x1, x2);
	const xMax = Math.max(x1, x2);
	const yMin = Math.min(y1, y2);
	const yMax = Math.max(y1, y2);
	/*if (((xMax - xMin) == 2) && (yMax == yMin) && (this.getClosedEdges(xMin+1, yMin) == 2)) {
		p_eventList.push(new SpaceEvent(xMin+1, yMin, LOOP_STATE.CLOSED));
	}
	if (((yMax - yMin) == 2) && (xMax == xMin) && (this.getClosedEdges(xMin, yMin+1) == 2)) {
		p_eventList.push(new SpaceEvent(xMin, yMin+1, LOOP_STATE.CLOSED));
	}*/ // TODO bug to correct (cf. Yajilin puzzles 378, 430, 460) + add case where the state in between is opened and has one closed wall... but it requires the number of chains to be >2 !
	if (((xMax - xMin) == 1) && ((yMax - yMin) == 1)) {
		const isDiagLUtoRD = (xMax == x1) ? (yMax == y1) : (yMax == y2); // Boolean to check whether both linked spaces are in a diagonal left-up to right-down
		if (isDiagLUtoRD) {
			if (this.getClosedEdges(xMin, yMax) == 2) {
				if ((this.getLinkRight(xMin, yMax) == LOOP_STATE.UNDECIDED) && (this.getLinkUp(xMin, yMax) == LOOP_STATE.UNDECIDED)) {
					p_eventList.push(new SpaceEvent(xMin, yMax, LOOP_STATE.CLOSED));
				}
			} 
			if (this.getClosedEdges(xMax, yMin) == 2) {
				if ((this.getLinkDown(xMax, yMin) == LOOP_STATE.UNDECIDED) && (this.getLinkLeft(xMax, yMin) == LOOP_STATE.UNDECIDED)) {
					p_eventList.push(new SpaceEvent(xMax, yMin, LOOP_STATE.CLOSED));
				}
			} 
		} else {
			if (this.getClosedEdges(xMax, yMax) == 2) {
				if ((this.getLinkLeft(xMax, yMax) == LOOP_STATE.UNDECIDED) && (this.getLinkUp(xMax, yMax) == LOOP_STATE.UNDECIDED)) {
					p_eventList.push(new SpaceEvent(xMax, yMax, LOOP_STATE.CLOSED));
				}
			} 
			if (this.getClosedEdges(xMin, yMin) == 2) {
				if ((this.getLinkDown(xMin, yMin) == LOOP_STATE.UNDECIDED) && (this.getLinkRight(xMin, yMin) == LOOP_STATE.UNDECIDED)) {
					p_eventList.push(new SpaceEvent(xMin, yMin, LOOP_STATE.CLOSED));
				}
			}
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
		if (p_solver.endedChainCount != 1) {
			var index = 0;
			var space;		
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
// Quick start

LoopSolver.prototype.quickStart = function() {
	this.initiateQuickStart("Standard loop");
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			if (this.getLinkSpace(x, y) == LOOP_STATE.LINKED && this.getClosedEdges(x, y) == 2) {
				KnownDirections.forEach(dir => {
					if (this.neighborExists(x, y, dir) && this.getLinkSpace(x, y) == LOOP_STATE.LINKED) {
						this.tryToPutNewLink(x, y, dir, LOOP_STATE.LINKED);
					}
				});
			}
			if (this.getClosedEdges(x, y) > 2) {
				this.tryToPutNewSpace(x, y, LOOP_STATE.CLOSED);
			}
		}
	}
	this.terminateQuickStart();
	this.PSQuickStart();
}

// --------------------------
// Methods for passing

/**
 Pass absolutely any space. TODO : Really cound be optimized.
*/
LoopSolver.prototype.standardSpacePassEvents = function(p_x, p_y) { // TODO Warning : this one uses argument coorginates instead of an argument item ! Don't get confused.
	var answer = [new SpaceEvent(p_x, p_y, LOOP_STATE.CLOSED)];
	const okLeft = (p_x >= 1);
	const okUp = (p_y >= 1);
	const okRight = (p_x <= this.xLength-2);
	const okDown = (p_y <= this.yLength-2);
	if (okLeft) {
		if (okUp) {
			answer.push(new CompoundLinkEvent(p_x, p_y, DIRECTION.LEFT, DIRECTION.UP, LOOP_STATE.LINKED));
		}
		if (okRight) {
			answer.push(new CompoundLinkEvent(p_x, p_y, DIRECTION.LEFT, DIRECTION.RIGHT, LOOP_STATE.LINKED));
		}
		if (okDown) {
			answer.push(new CompoundLinkEvent(p_x, p_y, DIRECTION.LEFT, DIRECTION.DOWN, LOOP_STATE.LINKED));
		}
	}
	if (okUp) {
		if (okRight) {
			answer.push(new CompoundLinkEvent(p_x, p_y, DIRECTION.RIGHT, DIRECTION.UP, LOOP_STATE.LINKED));
		}
		if (okDown) {
			answer.push(new CompoundLinkEvent(p_x, p_y, DIRECTION.DOWN, DIRECTION.UP, LOOP_STATE.LINKED));
		}
	}
	if (okRight && okDown) {
		answer.push(new CompoundLinkEvent(p_x, p_y, DIRECTION.RIGHT, DIRECTION.DOWN, LOOP_STATE.LINKED));
	}
	return [answer];
}

// The events passed in comparison must be "converted", e.g. going either down or right.
comparisonLoopEventsMethod = function(p_event1, p_event2) {
	const cEvent1 = convertLoopEvent(p_event1);
	const cEvent2 = convertLoopEvent(p_event2); // TODO yeah, the events must be converted for sure, but they could be converted before the function is called. Anyway, this comparison method is potentially optimizable...
	return commonComparison([LOOP_EVENT.LINK, LOOP_EVENT.STATE], 
	[[cEvent1.linkY, cEvent1.linkX, cEvent1.direction, cEvent1.state], [cEvent2.linkY, cEvent2.linkX, cEvent2.direction, cEvent2.state], 
	[cEvent1.y, cEvent1.x, cEvent1.state], [cEvent2.y, cEvent2.x, cEvent2.state]], 
	cEvent1.kind, cEvent2.kind);
}

// Convert a loop event to make it compatible with the comparison method above 
convertLoopEvent = function(p_event) {
	if (p_event.kind == LOOP_EVENT.LINK && (p_event.direction == DIRECTION.LEFT || p_event.direction == DIRECTION.UP)) {
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
			var trash = [];
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
			} else {
				trash.push({x : x, y : y});
			}
		}
	}
	
	var oneMoreLoop = false;
	var space;
	var ok = true;
	const lengthBeforeMultiPass = this.happenedEventsSeries.length;
	do {
		oneMoreLoop = false;
		const happenedEventsBeforePassingAllRegions = this.happenedEventsSeries.length;
		i = 0;
		var trash = [];
		
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
			var newCategoriesSpaces = [];
			for (var i = 0; i < numberPSCategories ; i++) {
				newCategoriesSpaces.push([]);
			}
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
		while (this.happenedEventsSeries.length > lengthBeforeMultiPass) {
			var lastEventsList = this.happenedEventsSeries.pop();
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