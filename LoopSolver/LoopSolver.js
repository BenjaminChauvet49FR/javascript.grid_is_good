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
		this.setEdgeClosedPSAtomicUndos = function(p_5args) {} ; // x, y, otherX, otherY, direction
	}
	this.setEdgeLinkedPSAtomicUndos = p_packMethods.setEdgeLinkedPSAtomicUndos;
	if (!this.setEdgeLinkedPSAtomicUndos) {
		this.setEdgeLinkedPSAtomicUndos = function(p_5args) {} ; // x, y, otherX, otherY, direction
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
	
	// QS & filters :
	this.quickStartEventsPS = p_packMethods.quickStartEventsPS;
	if (!this.quickStartEventsPS) {
		this.quickStartEventsPS = function(p_events) {return p_events}
	}

	this.PSFilters = p_packMethods.PSFilters;
	if (!this.PSFilters) {
		this.PSFilters = [];
	}
	this.PSAbortMethods = p_packMethods.PSAbortMethods;
	if (!this.PSAbortMethods) {
		this.PSAbortMethods = [];
	}
	
	// Pass and multipass related 
	this.comparisonPS = p_packMethods.comparisonPS;
	if (!this.comparisonPS) { this.comparisonPS = function() {}} // Should not be sollicited
	this.copyingPS = p_packMethods.copyingPS;         
	if (!this.copyingPS) { this.copyingPS = function(p_event) {return p_event.copy();}} // Will likely be sollicited
	this.namingCategoryPS = p_packMethods.namingCategoryPS;
	if (!this.namingCategoryPS) { this.namingCategoryPS = function(p_event) {return ""}}
	this.generateEventsForPassPS = p_packMethods.generateEventsForPassPS;
	if (!this.generateEventsForPassPS) { this.generateEventsForPassPS = function(p_indexPass) {return []} }
	this.orderedListPassArgumentsPS = p_packMethods.orderedListPassArgumentsPS;
	if (!this.orderedListPassArgumentsPS) { this.orderedListPassArgumentsPS = function() {return []} }
	if (p_packMethods.multipassPessimismPS != true && p_packMethods.multipassPessimismPS != false) {
		if (!this.orderedListPassArgumentsPS) {
			this.multipassPessimismPS = true;
		} else {
			this.multipassPessimismPS = false;
		}
	} else {
		this.multipassPessimismPS = p_packMethods.multipassPessimismPS;
	}
	
	this.passDefineTodoPSMethod = p_packMethods.passDefineTodoPSMethod;
	if (!this.passDefineTodoPSMethod) { this.passDefineTodoPSMethod = function() {return true;} } // For pass categories different from LOOP_PASS_CATEGORY.SPACE_STANDARD but that still makes reference to spaces. Masyu solver uses similar pass categories for standard pass spaces. Koburin and Linesweeper use (x, y) but not for standard pass at all
}

/* High conventions : 
-properties this.xLength and this.yLength must be defined in the solver before loopSolverConstruct is called no matter what
-banned spaces and opened spaces at start (even from puzzle regions) must be handled by the solver (or by regional solver ?) ; using banSpace may help
*/
LoopSolver.prototype.loopSolverConstruct = function(p_puzzleSpecificMethodPack) {
	this.generalConstruct();
	
	this.setPuzzleSpecificMethods(p_puzzleSpecificMethodPack);
	
	this.methodsSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [testLoopsClosure(this), separateEndsClosure(this)]);
	this.methodsSetDeductions.addMoreFilters(this.PSFilters);
	this.methodsSetDeductions.addMoreAborts(this.PSAbortMethods);
	this.methodsSetDeductions.addCompoundEventMethod(compoundEventClosure(this)); // TODO Note : someday I'll want to make compound events in a sub problem (although this is whole "compound event" thing is more something for passes). I'll make the behaviour specific for sub solvers then.
	this.methodsSetPass = {comparisonMethod : comparisonLoopSolverEventsClosure(this.comparisonPS), copyMethod : this.copyingPS, argumentToLabelMethod : namingCategoryLoopClosure(this.namingCategoryPS)};
	this.methodSetMultiPass = {
		generatePassEventsMethod : generateEventsForPassLoopClosure(this, this.generateEventsForPassPS),
		orderPassArgumentsMethod : orderedListpassArgumentsClosure(this, this.orderedListPassArgumentsPS, this.multipassPessimismPS),
		passTodoMethod : passDefineTodoClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsLoopClosure(this), // Note : should you name it "quickStartEventsClosure" and name a closure in a lower-level solver the "quickStartEventsClosure" the same, the definition of the solver will be taken over this one, this
		isSolvedMethod : isSolvedClosure(this)
	}
	
	
	
    this.linksArray = [];
    this.bannedSpacesGrid = [];
	this.checkNewEnds = {
		array : [],
		list : []
	}
	this.endedChainCount = 0; // Counts at all times the number of chains that are not loops + lone linked spaces.
	this.loopMade = 0;
	var x,y;
	for (y = 0; y < this.yLength ; y++) {
		this.linksArray.push([]);
		this.bannedSpacesGrid.push([]);
		this.checkNewEnds.array.push([]);
		for (x = 0 ; x < this.xLength ; x++) {
			this.linksArray[y].push({
				state : LOOP_STATE.UNDECIDED,
				oppositeEnd : {},
				closedEdges : 0,
				linkRight : LOOP_STATE.UNDECIDED,
				linkDown : LOOP_STATE.UNDECIDED,
				linkedDirections : []
			});
			this.bannedSpacesGrid[y].push(false);
			this.checkNewEnds.array[y].push(false);
		}
	}
	
	// Purification 
	for (x = 0 ; x < this.xLength ; x++) {
		this.linksArray[0][x].closedEdges++;
		this.linksArray[this.yLength-1][x].closedEdges++;
	}
	for (y = 0 ; y < this.yLength ; y++) {
		this.linksArray[y][0].closedEdges++;
		this.linksArray[y][this.xLength-1].closedEdges++;
	}	
	
	// Ergonomic options
	this.ergonomicOptions = {
		displayOtherEnds : false,
		colorChains : false,
		drawXsMyself : false
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

LoopSolver.prototype.getLinkSpace = function(p_x, p_y) {
	return this.linksArray[p_y][p_x].state;
}

LoopSolver.prototype.getLinkRight = function(p_x, p_y) {
	return this.linksArray[p_y][p_x].linkRight;
}

LoopSolver.prototype.getLinkLeft = function(p_x, p_y) {
	return this.getLinkRight(p_x-1, p_y);
}

LoopSolver.prototype.getLinkDown = function(p_x, p_y) {
	return this.linksArray[p_y][p_x].linkDown;
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

LoopSolver.prototype.getLinkedEdges = function(p_x, p_y) {
	return this.linksArray[p_y][p_x].linkedDirections.length;
}

LoopSolver.prototype.getClosedEdges = function(p_x, p_y) {
	return this.linksArray[p_y][p_x].closedEdges;
}

LoopSolver.prototype.getOppositeEnd = function(p_x, p_y) {
	return this.linksArray[p_y][p_x].oppositeEnd;
}

LoopSolver.prototype.getSpace = function(p_space) {
	return this.linksArray[p_space.y][p_space.x];
}

LoopSolver.prototype.isBanned = function(p_x, p_y) {
	return this.bannedSpacesGrid[p_y][p_x];
}

LoopSolver.prototype.isLinkLeftAccessible = function(p_x, p_y) {
	return (p_x > 0 && this.getLinkLeft(p_x, p_y) != LOOP_STATE.CLOSED);
}

LoopSolver.prototype.isLinkUpAccessible = function(p_x, p_y) {
	return (p_y > 0 && this.getLinkUp(p_x, p_y) != LOOP_STATE.CLOSED);	
}

LoopSolver.prototype.isLinkRightAccessible = function(p_x, p_y) {
	return (p_x < this.xLength-1 && this.getLinkRight(p_x, p_y) != LOOP_STATE.CLOSED);
}

LoopSolver.prototype.isLinkDownAccessible = function(p_x, p_y) {
	return (p_y < this.yLength-1 && this.getLinkDown(p_x, p_y) != LOOP_STATE.CLOSED);
}

// Appearance getters
LoopSolver.prototype.areActiveClosedSpaces = function() {
	return this.ergonomicOptions.closedSpacesAreActive;
}

LoopSolver.prototype.areAllOpenSpaces = function() {
	return this.ergonomicOptions.allOpenSpaces;
}

LoopSolver.prototype.areXsAutomaticallyDrawed = function() {
	return !this.ergonomicOptions.drawXsMyself;
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

// Desactivate common drawing of closed space
LoopSolver.prototype.desactivateXsDrawing = function() {
	this.ergonomicOptions.drawXsMyself = true;
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
	var dir = this.linksArray[p_y][p_x].linkedDirections[0];
	var newDir;
	var x = p_x + DeltaX[dir];
	var y = p_y + DeltaY[dir];
	counter = 0;
	while (this.getLinkedEdges(x, y) == 2 && counter < 500) {
		this.colorChainsGrid[y][x] = p_number;
		newDir = this.linksArray[y][x].linkedDirections[0];
		if (newDir == OppositeDirection[dir]) {
			dir = this.linksArray[y][x].linkedDirections[1];
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
	const state = this.linksArray[p_y][p_x].linkRight;
	if (state == p_state) {
		return EVENT_RESULT.HARMLESS;
	} else if (state != LOOP_STATE.UNDECIDED || (p_state == LOOP_STATE.LINKED && (this.getLinkedEdges(p_x, p_y) == 2 || this.getLinkedEdges(p_x+1, p_y) == 2))) {
		return EVENT_RESULT.FAILURE;
	} else {
		this.linksArray[p_y][p_x].linkRight = p_state;
		this.tradeLinkedSpaces(p_x, p_y, p_x+1, p_y, p_state, DIRECTION.RIGHT, DIRECTION.LEFT);
		return EVENT_RESULT.SUCCESS;
	}
}

LoopSolver.prototype.setLinkLeft = function(p_x, p_y, p_state) {
	return this.setLinkRight(p_x-1, p_y, p_state);
}

LoopSolver.prototype.setLinkDown = function(p_x, p_y, p_state) { 
	this.cleanErgonomicOptions(); 
	const state = this.linksArray[p_y][p_x].linkDown;
	if (state == p_state) {
		return EVENT_RESULT.HARMLESS;
	} else if (state != LOOP_STATE.UNDECIDED || (p_state == LOOP_STATE.LINKED && (this.getLinkedEdges(p_x, p_y) == 2 || this.getLinkedEdges(p_x, p_y+1) == 2))) {
		return EVENT_RESULT.FAILURE;
	} else {
		this.linksArray[p_y][p_x].linkDown = p_state;
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
	const state = this.linksArray[p_y][p_x].state;
	if (state == p_state) {
		return EVENT_RESULT.HARMLESS;
	} else if (state != LOOP_STATE.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	} else {
		this.linksArray[p_y][p_x].state = p_state;
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
		this.linksArray[p_y][p_x].closedEdges++;
		this.linksArray[p_y2][p_x2].closedEdges++;
		this.setEdgeClosedPSAtomicDos({x : p_x, y : p_y, otherX : p_x2, otherY : p_y2, direction : p_direction1to2});
	} else {	
		this.linksArray[p_y][p_x].linkedDirections.push(p_direction1to2); 
		this.linksArray[p_y2][p_x2].linkedDirections.push(p_direction2to1); 
		this.endedChainCount--;
		const thisChainParts = this.getLinkedEdges(p_x, p_y); //1 or 2
		const otherChainParts = this.getLinkedEdges(p_x2, p_y2);
		if (thisChainParts == 1 && otherChainParts == 1) {
			this.linksArray[p_y][p_x].oppositeEnd = {x : p_x2, y : p_y2};
			this.linksArray[p_y2][p_x2].oppositeEnd = {x : p_x, y : p_y};
		} else if (thisChainParts == 1 && otherChainParts == 2) {
			const extendedOpposite = copySpace(this.getOppositeEnd(p_x2, p_y2));
			this.linksArray[p_y][p_x].oppositeEnd = extendedOpposite;
			this.getSpace(extendedOpposite).oppositeEnd = {x : p_x, y : p_y};
		} else if (thisChainParts == 2 && otherChainParts == 1) {
			const extendedOpposite = copySpace(this.getOppositeEnd(p_x, p_y));
			this.linksArray[p_y2][p_x2].oppositeEnd = extendedOpposite;
			this.getSpace(extendedOpposite).oppositeEnd = {x : p_x2, y : p_y2};
		} else {
			const thisOpposite = this.getOppositeEnd(p_x, p_y);
			const otherOpposite = this.getOppositeEnd(p_x2, p_y2);
			if ((thisOpposite.x == p_x2) && (thisOpposite.y == p_y2) && (otherOpposite.x == p_x) && (otherOpposite.y == p_y)) { // If (p_x, p_y) and (p_x2, p_y2) were already opposed prior to be linked, a loop is made. 
				this.loopMade++; // TODO maybe this can be sped up : if we have 2 loops or more, it should be aborted !
			}
			// TODO it is time to detect when more than one loop is made in one go !
			this.linksArray[otherOpposite.y][otherOpposite.x].oppositeEnd = copySpace(thisOpposite);
			this.linksArray[thisOpposite.y][thisOpposite.x].oppositeEnd = copySpace(otherOpposite);
		}
		const end1 = {x : -1, y : -1};
		const end2 = {x : -1, y : -1};
		this.setEdgeLinkedPSAtomicDos({x : p_x, y : p_y, otherX : p_x2, otherY : p_y2, direction : p_direction1to2, end1 : end1, end2 : end2}); // TODO : end1 and end2 ? Not defined yet
	}
}

LoopSolver.prototype.undoLinkRight = function(p_x, p_y) {
	this.cleanErgonomicOptions(); 
	previousState = this.linksArray[p_y][p_x].linkRight;
	this.linksArray[p_y][p_x].linkRight = LOOP_STATE.UNDECIDED;
	this.undoTradeLinkedSpaces(p_x, p_y, p_x+1, p_y, DIRECTION.RIGHT, previousState);
}

LoopSolver.prototype.undoLinkLeft = function(p_x, p_y) {
	this.undoLinkRight(p_x-1, p_y);
}

LoopSolver.prototype.undoLinkDown = function(p_x, p_y) {
	this.cleanErgonomicOptions(); 
	previousState = this.linksArray[p_y][p_x].linkDown;
	this.linksArray[p_y][p_x].linkDown = LOOP_STATE.UNDECIDED;
	this.undoTradeLinkedSpaces(p_x, p_y, p_x, p_y+1, DIRECTION.DOWN, previousState);
}

LoopSolver.prototype.undoLinkUp = function(p_x, p_y) {
	this.undoLinkDown(p_x, p_y-1);
}

// Undo everything between 2 orthogonally adjacent spaces (except for the linkDown, linkRight considerations, which are dependent on the methods.
LoopSolver.prototype.undoTradeLinkedSpaces = function(p_x, p_y, p_x2, p_y2, p_direction, p_previousState) {
	if (p_previousState == LOOP_STATE.CLOSED) {
		this.linksArray[p_y][p_x].closedEdges--;
		this.linksArray[p_y2][p_x2].closedEdges--;
		this.setEdgeClosedPSAtomicUndos({x : p_x, y : p_y, otherX : p_x2, otherY : p_y2, direction : p_direction});
	} else {
		this.endedChainCount++;
		this.linksArray[p_y][p_x].linkedDirections.pop();
		this.linksArray[p_y2][p_x2].linkedDirections.pop();
		const actualThisEnd = copySpace(this.linksArray[p_y][p_x].oppositeEnd); // The actual end of the other chain right now
		const actualOtherEnd = copySpace(this.linksArray[p_y2][p_x2].oppositeEnd); // The actual end of this chain
		const thisChainParts = this.getLinkedEdges(p_x, p_y);
		const otherChainParts = this.getLinkedEdges(p_x2, p_y2);	
		if ((thisChainParts == 0) && (otherChainParts == 0)) {
			this.linksArray[p_y][p_x].oppositeEnd = {};
			this.linksArray[p_y2][p_x2].oppositeEnd = {};
		} else if (thisChainParts == 1 && otherChainParts == 0) { // Either this space or the other space had no links. In the first case, the other space was added last (and is unpiled first)
			const remainingEnd = this.linksArray[p_y][p_x].oppositeEnd;
			this.getSpace(remainingEnd).oppositeEnd = {x : p_x, y : p_y};
			this.linksArray[p_y2][p_x2].oppositeEnd = {};
		} else if (thisChainParts == 0 && otherChainParts == 1) {
			const remainingEnd = this.linksArray[p_y2][p_x2].oppositeEnd;
			this.getSpace(remainingEnd).oppositeEnd = {x : p_x2, y : p_y2};
			this.linksArray[p_y][p_x].oppositeEnd = {};
		} else { // Both spaces were linked
			const thisOpposite = this.linksArray[p_y][p_x].oppositeEnd;
			const otherOpposite = this.linksArray[p_y2][p_x2].oppositeEnd;
			this.getSpace(thisOpposite).oppositeEnd = {x : p_x, y : p_y};
			this.getSpace(otherOpposite).oppositeEnd = {x : p_x2, y : p_y2};
		}
		this.setEdgeLinkedPSAtomicUndos({x : p_x, y : p_y, otherX : p_x2, otherY : p_y2, direction : p_direction});
	}	
}

LoopSolver.prototype.undoLinkSpace = function(p_x, p_y) {
	this.cleanErgonomicOptions(); 
	if (this.linksArray[p_y][p_x].state == LOOP_STATE.LINKED) {
		this.endedChainCount--;
		this.setSpaceLinkedPSAtomicUndos({x : p_x, y : p_y});
	} else {
		this.setSpaceClosedPSAtomicUndos({x : p_x, y : p_y});
	}
	this.linksArray[p_y][p_x].state = LOOP_STATE.UNDECIDED;
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
	this.tryToApplyHypothesisSafe(new LinkEvent(p_x, p_y, DIRECTION.DOWN, p_state));
}

LoopSolver.prototype.tryToPutNewRight = function (p_x, p_y, p_state) {
	this.tryToApplyHypothesisSafe(new LinkEvent(p_x, p_y, DIRECTION.RIGHT, p_state));
}

LoopSolver.prototype.tryToPutNewSpace = function (p_x, p_y, p_state) {
	this.tryToApplyHypothesisSafe(new SpaceEvent(p_x, p_y, p_state));
}

//--------------------------------
// otherPSDeductions

compoundEventClosure = function(p_solver) {
	return function(p_eventList, p_compoundEventBeingApplied) {
		//if (p_eventBeingApplied.kind == LOOP_EVENT.COMPOUND_LINK) { Note : may be subject to change
			p_eventList.push(new LinkEvent(p_compoundEventBeingApplied.linkX, p_compoundEventBeingApplied.linkY, p_compoundEventBeingApplied.direction1, p_compoundEventBeingApplied.state));
			p_eventList.push(new LinkEvent(p_compoundEventBeingApplied.linkX, p_compoundEventBeingApplied.linkY, p_compoundEventBeingApplied.direction2, p_compoundEventBeingApplied.state));
		// } 	
		return p_eventList;
	}
}

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
// Additionally, this is not the only chain. 
LoopSolver.prototype.testEndsClosingLoopNotOneChain = function (p_eventList, p_endSpace1, p_endSpace2) {
	const direction1 = this.getSpace(p_endSpace1).linkedDirections[0];
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
	var closedEdgesBetween, spaceStateBetween, xMid, yMid, dirToLink;
	if (((xMax - xMin) == 2) && (yMax == yMin)) {
		xMid = xMin+1;
		yMid = yMin;
		closedEdgesBetween = this.getClosedEdges(xMid, yMid);
		spaceStateBetween = this.getLinkSpace(xMid, yMid);
		//if (closedEdgesBetween == 2 && spaceStateBetween == LOOP_STATE.UNDECIDED) { 	// OK, wrong line. 
		// Puzzle 209 Countryroad : There were indeed two closed links in 7,7 (vertical way even if we are in the horizontal way) and the space was unknown, 7,6 and 7,8 were opposite, the deductions were applied... but both closed directions were UP and RIGHT, and not LEFT and RIGHT as intended !
		if (closedEdgesBetween == 2 && spaceStateBetween == LOOP_STATE.UNDECIDED && !this.isLinkDownAccessible(xMid, yMid) && !this.isLinkUpAccessible(xMid, yMid)) { 	
			p_eventList.push(new SpaceEvent(xMid, yMid, LOOP_STATE.CLOSED));
		}
		if (closedEdgesBetween == 1 && spaceStateBetween == LOOP_STATE.LINKED) {
			dirToLink = (this.isLinkDownAccessible(xMid, yMid) ? DIRECTION.DOWN : DIRECTION.UP);
			p_eventList.push(new LinkEvent(xMid, yMid, dirToLink, LOOP_STATE.LINKED));
		}
	}
	if (((yMax - yMin) == 2) && (xMax == xMin)) {
		xMid = xMin;
		yMid = yMin+1;
		closedEdgesBetween = this.getClosedEdges(xMid, yMid);
		spaceStateBetween = this.getLinkSpace(xMid, yMid);
		if (closedEdgesBetween == 2 && spaceStateBetween == LOOP_STATE.UNDECIDED && !this.isLinkLeftAccessible(xMid, yMid) && !this.isLinkRightAccessible(xMid, yMid)) {
			p_eventList.push(new SpaceEvent(xMid, yMid, LOOP_STATE.CLOSED));
		}
		if (closedEdgesBetween == 1 && spaceStateBetween == LOOP_STATE.LINKED) {
			dirToLink = (this.isLinkRightAccessible(xMid, yMid) ? DIRECTION.RIGHT : DIRECTION.LEFT);
			p_eventList.push(new LinkEvent(xMid, yMid, dirToLink, LOOP_STATE.LINKED));
		}
	} 
	
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

// If during the deductions, either more than one loop was made OR one loop was made but there is still an unlooped chain somewhere...
// If there is one loop, close the spaces that don't belong to it.
testLoopsClosure = function(p_solver) {
	return function() {
		if ((p_solver.loopMade > 1) || (p_solver.endedChainCount > 0 && p_solver.loopMade == 1)) {
			return EVENT_RESULT.FAILURE;
		} else {
			var answer = [];
			if (p_solver.loopMade == 1) {
				var x, y;
				for (y = 0 ; y < p_solver.yLength ; y++) {
					for (x = 0 ; x < p_solver.xLength ; x++) {
						if (p_solver.linksArray[y][x].state == LOOP_STATE.UNDECIDED) {
							answer.push(new SpaceEvent(x, y, LOOP_STATE.CLOSED));
						}
					}
				}
			}
			p_solver.loopMade = 0;
			return answer;
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
						eventList = p_solver.testEndsClosingLoopNotOneChain(eventList, opposite2, opposite);						
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

LoopSolver.prototype.makeQuickStart = function() {
	this.quickStart(); 
}

function quickStartEventsLoopClosure(p_solver) {
	return function () {
		var answer = [{quickStartLabel : "Standard loop"}];
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			for (var x = 0 ; x < p_solver.xLength ; x++) {
				if (p_solver.getLinkSpace(x, y) == LOOP_STATE.LINKED && p_solver.getClosedEdges(x, y) == 2) {
					p_solver.existingNeighborsDirections(x, y).forEach(dir => {
						if (p_solver.getLink(x, y, dir) != LOOP_STATE.CLOSED) {
							answer.push(new LinkEvent(x, y, dir, LOOP_STATE.LINKED));
						} 
						// No more fail in quick start tolerated ! (and directions must exist)
					});
				}
				if (p_solver.getClosedEdges(x, y) > 2) {
					answer.push(new SpaceEvent(x, y, LOOP_STATE.CLOSED));
				}
			}
		} 
		answer = p_solver.quickStartEventsPS(answer);
		return answer;
	}		
}

// --------------------------
// Methods for passing

// Unitary pass. Uses methodSetMultiPass.generatePassEventsMethod because... it's commode ! 
LoopSolver.prototype.passLoop = function(p_argumentPass) {	
	this.passEventsSafe(this.methodSetMultiPass.generatePassEventsMethod(p_argumentPass), p_argumentPass); 
}

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

comparisonLoopSolverEventsClosure = function(p_PSComparisonMethod) {
	return function(p_event1, p_event2) {
		return comparisonLoopSolverEventsMethod(p_event1, p_event2, p_PSComparisonMethod);
	}
}

comparisonLoopSolverEventsMethod = function(p_event1, p_event2, p_PSComparisonMethod) {
	const managedKinds = [LOOP_EVENT.LINK, LOOP_EVENT.STATE];
	const cEvent1 = convertLoopEvent(p_event1);
	const cEvent2 = convertLoopEvent(p_event2);
	if ((cEvent1.kind != cEvent2.kind) || managedKinds.includes(cEvent1.kind)) {
		// The events passed in comparison must be "converted", e.g. going either down or right.
		return commonComparisonMultiKinds(managedKinds, 
			[[cEvent1.linkY, cEvent1.linkX, cEvent1.direction, cEvent1.state], [cEvent2.linkY, cEvent2.linkX, cEvent2.direction, cEvent2.state], 
			[cEvent1.y, cEvent1.x, cEvent1.state], [cEvent2.y, cEvent2.x, cEvent2.state]],
			cEvent1.kind, cEvent2.kind);
	}
	return p_PSComparisonMethod(cEvent1, cEvent2);
}

// Convert a loop event to make it compatible with the comparison method above 
convertLoopEvent = function(p_event) {
	if (p_event.kind == LOOP_EVENT.LINK && (p_event.direction == DIRECTION.LEFT || p_event.direction == DIRECTION.UP)) {
		return p_event.dual();
	} else {
		return p_event;
	}
}

// ----------------
// Multipass

LoopSolver.prototype.multipassLoop = function() {	
	return this.multiPassSafe(this.methodSetMultiPass);
}

// Quick start politics : now, all inputable methods (apply event, pass, multipass) in loops need to have quick start done first, as per the "safe" in multiPassSafe and so on.
// Previously, was only in solvers of : Castle wall, Geradeweg, Grand Tour, Shingoki

function orderedListpassArgumentsClosure(p_solver, p_orderedListPassArgumentsPSMethod, p_pessimistic) {
	return function() {
		var passIndex;
		var answer = p_orderedListPassArgumentsPSMethod();
		if (p_pessimistic) {			
			for (var y = 0 ; y < p_solver.yLength ; y++) {
				for (var x = 0 ; x < p_solver.xLength ; x++) {
					//if (p_solver.linksArray[y][x].state != CLOSED && p_solver.linksArray[y][x].linkedDirections.length != 2) { 
					passIndex = {x : x, y : y, passCategory : LOOP_PASS_CATEGORY.SPACE_STANDARD}
					answer.push(passIndex);
					// }
				}	
			}
		}
		return answer;
	}
}

function generateEventsForPassLoopClosure(p_solver) {
	return function(p_passIndex) {		
		return p_solver.generateEventsForPassLoop(p_passIndex);
	}
}

LoopSolver.prototype.generateEventsForPassLoop = function(p_passIndex) {
	switch(p_passIndex.passCategory) {
		case LOOP_PASS_CATEGORY.SPACE_STANDARD : 
			return this.standardSpacePassEvents(p_passIndex.x, p_passIndex.y);
		break;
		default : 
			return this.generateEventsForPassPS(p_passIndex);
		break;
	}
}

function namingCategoryLoopClosure(p_namingCategoryPSMethod) {
	return function(p_passIndex) {
		switch(p_passIndex.passCategory) {
			case LOOP_PASS_CATEGORY.SPACE_STANDARD : 
				return "Space " + p_passIndex.x + "," + p_passIndex.y;
			break;
			default : 
				return p_namingCategoryPSMethod(p_passIndex);
			break;
		}
	}
}

function passDefineTodoClosure(p_solver) {
	return function(p_passIndex) {		
		return p_solver.passDefineTodoLoop(p_passIndex);
	}
}

LoopSolver.prototype.passDefineTodoLoop = function(p_passIndex) {
	if (p_passIndex.passCategory == LOOP_PASS_CATEGORY.SPACE_STANDARD) {
		const x = p_passIndex.x;
		const y = p_passIndex.y;
		return (this.linksArray[y][x].state != LOOP_STATE.CLOSED && this.linksArray[y][x].linkedDirections.length != 2);
	} else {
		return this.passDefineTodoPSMethod(p_passIndex); 
	}
}

LoopSolver.prototype.lazyStandardSpacepassArgumentsClosure = function() {
	var answer = [];
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			answer.push({x : x, y : y});
		}
	} 
	return answer;
}

// ----------------
// Resolution

LoopSolver.prototype.isSolvedStandard = function() {
	for (var iy = 0 ; iy <= this.yLength-2 ; iy++) {
		for (var ix = 0 ; ix <= this.xLength-2 ; ix++) {
			if (this.getLinkRight(ix, iy) == LOOP_STATE.UNDECIDED) {
				return false;
			}
			if (this.getLinkDown(ix, iy) == LOOP_STATE.UNDECIDED) {
				return false;
			}
		}
		if (this.getLinkDown(this.xLength-1, iy) == LOOP_STATE.UNDECIDED) {
			return false;
		}
	}
	for (var ix = 0 ; ix <= this.xLength-2 ; ix++) {
		if (this.getLinkRight(ix, this.yLength-1) == LOOP_STATE.UNDECIDED) {
			return false;
		}
	}	
	return true;
}

function isSolvedClosure(p_solver) {
	return function() {
		return p_solver.isSolvedStandard();
	}
}

loopNaiveSearchClosure = function(p_solver) {
	return function() {
		var mp = p_solver.multipassLoop();
		if (mp == MULTIPASS_RESULT.FAILURE) {
			return RESOLUTION_RESULT.FAILURE;
		}			
		if (p_solver.isSolvedStandard()) {		
			return RESOLUTION_RESULT.SUCCESS;
		}		
		var evt;
		// Find event with the most solutions
		var indexesForSolution = [];
		var bestIndex = {nbDeductions : 0};
		var nbDeductions;
		for (var solveY = 0 ; solveY < p_solver.yLength ; solveY++) {
			for (var solveX = 0 ; solveX < p_solver.xLength ; solveX++) {			
				if (solveX <= p_solver.xLength-2 && p_solver.getLinkRight(solveX, solveY) == LOOP_STATE.UNDECIDED) {
					evt = new LinkEvent(solveX, solveY, DIRECTION.RIGHT, LOOP_STATE.LINKED);
					p_solver.tryToApplyHypothesis(evt); 
					nbDeductions = p_solver.numberOfRelevantDeductionsSinceLastHypothesis();
					if (nbDeductions > bestIndex.nbDeductions) {						
						bestIndex = {evt : evt.copy(), nbDeductions : nbDeductions};
					}
					p_solver.undoToLastHypothesis();				
				}
				if (solveY <= p_solver.yLength-2 && p_solver.getLinkDown(solveX, solveY) == LOOP_STATE.UNDECIDED) {
					evt = new LinkEvent(solveX, solveY, DIRECTION.DOWN, LOOP_STATE.LINKED);
					p_solver.tryToApplyHypothesis(evt); 
					nbDeductions = p_solver.numberOfRelevantDeductionsSinceLastHypothesis();
					if (nbDeductions > bestIndex.nbDeductions) {						
						bestIndex = {evt : evt.copy(), nbDeductions : nbDeductions};
					}
					p_solver.undoToLastHypothesis();				
				}
			}
		}
		
		// Let's go !
		return p_solver.tryAllPossibilities([bestIndex.evt, 
			new LinkEvent(bestIndex.evt.linkX, bestIndex.evt.linkY, bestIndex.evt.direction, OppositeLoopState[bestIndex.evt.state]) ]);
	}
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
			oppositeEndSpace = this.linksArray[iy][ix].oppositeEnd;
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