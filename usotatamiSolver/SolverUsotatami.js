// Constants
const USOTATAMI_VIEW = {NUMBER : 2, WALL : 1, UNDECIDED : 0}
const UNKNOWN_RANGE = -1;
const NO_VALUE = null;

// ------------------------
// Setup
SolverUsotatami.prototype = Object.create(GeneralSolver.prototype);
SolverUsotatami.prototype.constructor = SolverUsotatami;

function SolverUsotatami(p_numberGrid) {
	GeneralSolver.call(this);
	this.construct(p_numberGrid);
}


SolverUsotatami.prototype.construct = function(p_numberGrid) {
	this.generalConstruct();
	this.xLength = p_numberGrid[0].length;
	this.yLength = p_numberGrid.length;
	this.fenceGrid = new FencesGrid(this.xLength, this.yLength);
	//this.constructLightFences(p_numberGrid[0].length, p_numberGrid.length); // If any construct method is forgotten we can have surprises when trying to apply a tiny event
	// this.xLength, this.yLength, this.fenceArray defined above
	// spaces of this.fenceArray initialized as {right : FENCE_STATE.UNDECIDED, down : FENCE_STATE.UNDECIDED}
	
	this.methodSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	//this.methodSetDeductions.addOneAbortAndFilters(abortClosure(this), [filterNumbersSpacesClosure(this)]);
	
	this.indicArray = []; // Spaces without number : ; with a number : {expansions left / up / right / down}
	this.numberSpacesArray = []; // For filters on numbers
	this.numberSpacesToCheckList = []; // For filters on numbers
	for (var y = 0; y < this.yLength; y++) {
		this.indicArray.push([]);
		for (var x = 0 ; x < this.xLength ; x++) {
			if (p_numberGrid[y][x] == null) { // Non-number space : view {left, up, right, down : undecided / no number / number} + (const) firstIndexNumberSeen {left, up, right, down : an index number or NO_VALUE}
				this.indicArray[y].push({wallDirections : 0, number : null});
				this.indicArray[y][x].view = {};
				this.indicArray[y][x].firstIndexNumberSeen = {};
				KnownDirections.forEach(dir => {
					this.indicArray[y][x].view[dir] = USOTATAMI_VIEW.UNDECIDED; 
					this.indicArray[y][x].firstIndexNumberSeen[dir] = NO_VALUE;
				});
			} else { // Number space : range {left, up, right, down : UNKNOWN_RANGE at start, a number >= 0 then} + (const) indexNumber
				this.indicArray[y].push({number : p_numberGrid[y][x]});
				this.indicArray[y][x].range = {};
				this.numberSpacesArray.push({x : x, y : y, checkRanges : false});
				KnownDirections.forEach(dir => {
					this.indicArray[y][x].range[dir] = UNKNOWN_RANGE;
					this.indicArray[y][x].indexNumber = this.numberSpacesArray.length;
				});
			}
		}
	}	
	
	// Initialize "1st number seen" in each direction of non-number spaces (per space)
	var x, y, xx, yy, number;
	for (var indexNumber = 0; indexNumber < this.numberSpacesArray.length ; indexNumber++) {
		x = this.numberSpacesArray[indexNumber].x;
		y = this.numberSpacesArray[indexNumber].y;
		number = this.getNumber(x, y);
		xx = x-1;
		while (xx >= 0 && this.getNumber(xx, y) == null) {
			this.indicArray[y][xx].firstIndexNumberSeen[DIRECTION.RIGHT] = indexNumber;
			xx--;
		}
		xx = x+1;
		while (xx < this.xLength && this.getNumber(xx, y) == null) {
			this.indicArray[y][xx].firstIndexNumberSeen[DIRECTION.LEFT] = indexNumber;
			xx++;
		}
		yy = y-1;
		while (yy >= 0 && this.getNumber(x, yy) == null) {
			this.indicArray[yy][x].firstIndexNumberSeen[DIRECTION.DOWN] = indexNumber;
			yy--;
		}
		yy = y+1;
		while (yy < this.yLength && this.getNumber(x, yy) == null) {
			this.indicArray[yy][x].firstIndexNumberSeen[DIRECTION.UP] = indexNumber;
			yy++;
		}
	}
	
	// Initialize views on non-number spaces
	for (x = 0 ; x < this.xLength ; x++) {
		y = 0;
		while (y < this.yLength && this.getNumber(x, y) == null) {
			this.setView(x, y, DIRECTION.UP, USOTATAMI_VIEW.WALL);
			y++;
		}
		y = this.yLength-1;
		while (y >= 0 && this.getNumber(x, y) == null) {
			this.setView(x, y, DIRECTION.DOWN, USOTATAMI_VIEW.WALL);
			y--;
		}
		if (this.getNumber(x, 0) != null) {
			this.setRange(x, 0, DIRECTION.UP, 0);
		}
		if (this.getNumber(x, this.yLength-1) != null) {
			this.setRange(x, this.yLength-1, DIRECTION.DOWN, 0);
		}
	}
	for (y = 0 ; y < this.yLength ; y++) {
		x = 0;
		while (x < this.xLength && this.getNumber(x, y) == null) {
			this.setView(x, y, DIRECTION.LEFT, USOTATAMI_VIEW.WALL);
			x++;
		}
		x = this.xLength-1;
		while (x >= 0 && this.getNumber(x, y) == null) {
			this.setView(x, y, DIRECTION.RIGHT, USOTATAMI_VIEW.WALL);
			x--;
		}
		if (this.getNumber(0, y) != null) {
			this.setRange(0, y, DIRECTION.LEFT, 0); // Bad copy-paste that made puzzle 58 false
		}
		if (this.getNumber(this.xLength-1, y) != null) {
			this.setRange(this.xLength-1, y, DIRECTION.RIGHT, 0);
		}
	}
	// Separations between adjacent numbers not done here, reserved to quick start !
	
}

// ------------------------
// Getters

SolverUsotatami.prototype.getNumber = function(p_x, p_y) {
	return this.indicArray[p_y][p_x].number;
}

// On non-number spaces only
SolverUsotatami.prototype.getView = function(p_x, p_y, p_dir) {
	return this.indicArray[p_y][p_x].view[p_dir];
}

SolverUsotatami.prototype.getWallDirections = function(p_x, p_y) {
	return this.indicArray[p_y][p_x].wallDirections;
}

SolverUsotatami.prototype.setView = function(p_x, p_y, p_dir, p_state) {
	if (this.indicArray[p_y][p_x].view[p_dir] == USOTATAMI_VIEW.WALL) {
		this.indicArray[p_y][p_x].wallDirections--;
	}
	this.indicArray[p_y][p_x].view[p_dir] = p_state;
	if (p_state == USOTATAMI_VIEW.WALL) {
		this.indicArray[p_y][p_x].wallDirections++;
	}
}

// On number spaces only, please
SolverUsotatami.prototype.getRange = function(p_x, p_y, p_dir) {
	return this.indicArray[p_y][p_x].range[p_dir];
}

SolverUsotatami.prototype.setRange = function(p_x, p_y, p_dir, p_value) {
	this.indicArray[p_y][p_x].range[p_dir] = p_value;
}

// ------------------------
// Misc. inner methods

SolverUsotatami.prototype.neighborExists = function(p_x, p_y, p_dir) {
	switch(p_dir) {
		case DIRECTION.RIGHT : return p_x <= this.xLength-2; break;
		case DIRECTION.DOWN : return p_y <= this.yLength-2; break;
		case DIRECTION.LEFT : return p_x > 0; break;
		case DIRECTION.UP : return p_y > 0; break;
		default : autoLogFail("neighborExists returned an undefined result ! ");
	}
}

/* Many getters about getting and setting fences defined in the parent solver. */

// ------------------------
// Input methods

SolverUsotatami.prototype.emitHypothesisRight = function(p_x, p_y, p_symbol) {
	this.tryToPutNew(p_x, p_y, DIRECTION.RIGHT, p_symbol);
}

SolverUsotatami.prototype.emitHypothesisDown = function(p_x, p_y, p_symbol) {
	this.tryToPutNew(p_x, p_y, DIRECTION.DOWN, p_symbol);
}

SolverUsotatami.prototype.undo = function(){
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverUsotatami.prototype.passRegion = function(p_indexRegion) {
	/*const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.passEvents(generatedEvents, this.methodSet, this.methodTools, p_indexRegion); */
}

SolverUsotatami.prototype.makeMultiPass = function() {	
	//this.multiPass(this.methodSet, this.methodTools, this.methodsMultiPass);
}

// In this puzzle, quickstart is vital for the separation of numbers
SolverUsotatami.prototype.quickStart = function(p_x, p_y) {
	this.initiateQuickStart("Usotatami");
	var list = [];
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			list = [];
			// Separation of numbers
			if (this.getNumber(x, y) != null) {
				[DIRECTION.RIGHT, DIRECTION.DOWN].forEach(dir => {
					if (this.neighborExists(x, y, dir) && (this.getNumber(x+DeltaX[dir], y+DeltaY[dir]) != null)) {
						list.push(new FenceEvent(x, y, dir, FENCE_STATE.CLOSED));
					}
				});
			}
			// Claustrophobia test.
			list = this.testClaustrophobia(list, x, y);
			// Applying 
			list.forEach(_event => {
				this.tryToApplyHypothesis(_event, this.methodSetDeductions); // And not "applyFenceEvent"... 
			});
		}
	}
	this.terminateQuickStart();
}

//--------------------------------

// Central method
SolverUsotatami.prototype.tryToPutNew = function(p_x, p_y, p_direction, p_state) {
	this.tryToApplyHypothesis(new FenceEvent(p_x, p_y, p_direction, p_state), this.methodSetDeductions);
}

//--------------------------------
// Doing and undoing

// Offensive programming : we assume x and y are consistent.

applyEventClosure = function(p_solver) {
	return function(p_event) {
		switch (p_event.kind) {
			case FENCE_EVENT_KIND : return p_solver.applyFenceEvent(p_event.fenceX, p_event.fenceY, p_event.direction, p_event.state);
			case VIEW_EVENT_KIND : return p_solver.applyViewEvent(p_event.x, p_event.y, p_event.direction, p_event.view);
			case RANGE_EVENT_KIND : return p_solver.applyRangeEvent(p_event.x, p_event.y, p_event.direction, p_event.range);
			default : autoLogFail("applyEventClosure : kind of event not found ! ");
		}
	}
}

undoEventClosure = function(p_solver) {
	return function(p_event) {
		switch (p_event.kind) {
			case FENCE_EVENT_KIND : return p_solver.undoFenceEvent(p_event.fenceX, p_event.fenceY, p_event.direction, p_event.state);
			case VIEW_EVENT_KIND : return p_solver.undoViewEvent(p_event.x, p_event.y, p_event.direction, p_event.view);
			case RANGE_EVENT_KIND : return p_solver.undoRangeEvent(p_event.x, p_event.y, p_event.direction, p_event.range);
			default : autoLogFail("applyEventClosure : kind of event not found ! ");
		}
	}
}

SolverUsotatami.prototype.applyFenceEvent = function(p_x, p_y, p_dir, p_state) {
	const state = this.fenceGrid.getFence(p_x, p_y, p_dir); // Could've been slightly optimized by some "getFenceRight/getFenceDown" and "setFenceRight/setFenceDown" but is it that much of a deal ?
	if (p_state == state) {
		return EVENT_RESULT.HARMLESS;
	} else if (state != FENCE_STATE.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.fenceGrid.setFence(p_x, p_y, p_dir, p_state);
	return EVENT_RESULT.SUCCESS;
}

SolverUsotatami.prototype.applyViewEvent = function(p_x, p_y, p_dir, p_view) {
	const view = this.getView(p_x, p_y, p_dir);
	if (p_view == view) {
		return EVENT_RESULT.HARMLESS;
	} else if (view != USOTATAMI_VIEW.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	} 
	this.setView(p_x, p_y, p_dir, p_view);
	return EVENT_RESULT.SUCCESS;	
}

SolverUsotatami.prototype.applyRangeEvent = function(p_x, p_y, p_dir, p_range) {
	const range = this.getRange(p_x, p_y, p_dir);
	if (p_range == range) {
		return EVENT_RESULT.HARMLESS;
	} else if (range != UNKNOWN_RANGE) {
		return EVENT_RESULT.FAILURE;
	} else {
		const range1 = this.getRange(p_x, p_y, TurningRightDirection[p_dir]);
		if (range1 != UNKNOWN_RANGE) {
			const range2 = this.getRange(p_x, p_y, TurningLeftDirection[p_dir]);
			if (range2 != UNKNOWN_RANGE) {
				const range3 = this.getRange(p_x, p_y, OppositeDirection[p_dir]);
				if (range3 != UNKNOWN_RANGE) {
					if (range1 + range2 + range3 + p_range + 1 == this.getNumber(p_x, p_y)) {
						return EVENT_RESULT.FAILURE;
					}
				}
			}
		} 
	}
	this.setRange(p_x, p_y, p_dir, p_range);
	return EVENT_RESULT.SUCCESS;	
}

SolverUsotatami.prototype.undoFenceEvent = function(p_x, p_y, p_dir) {
	this.fenceGrid.setFence(p_x, p_y, p_dir, FENCE_STATE.UNDECIDED);
}

SolverUsotatami.prototype.undoViewEvent = function(p_x, p_y, p_dir) {
	this.setView(p_x, p_y, p_dir, USOTATAMI_VIEW.UNDECIDED);
}

SolverUsotatami.prototype.undoRangeEvent = function(p_x, p_y, p_dir) {
	this.setRange(p_x, p_y, p_dir, UNKNOWN_RANGE);
}

//--------------------------------
// Deductions

deductionsClosure = function(p_solver) {
	return function (p_eventList, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind == FENCE_EVENT_KIND) {
			const x = p_eventBeingApplied.fenceX;
			const y = p_eventBeingApplied.fenceY;
			const dir = p_eventBeingApplied.direction;
			const odir = OppositeDirection[dir];
			const dx = x + DeltaX[dir];
			const dy = y + DeltaY[dir];
			const n1 = p_solver.getNumber(x, y);
			const n2 = p_solver.getNumber(dx, dy);
			if (p_eventBeingApplied.state == FENCE_STATE.OPEN) {
				p_eventList = p_solver.fenceGrid.stripBuild(p_eventList, x, y, dx, dy, dir);

				// Hypothesis : thanks to setup/quickstart, it is impossible for both spaces to have numbers if a fence is open here
				if (n1 != null) {
					p_eventList.push(new ViewEvent(dx, dy, odir, USOTATAMI_VIEW.NUMBER)); // One of the spaces has a number : Share vision
				} else if (n2 != null) {
					p_eventList.push(new ViewEvent(x, y, dir, USOTATAMI_VIEW.NUMBER));
				} else if (p_solver.getView(dx, dy, dir) == USOTATAMI_VIEW.NUMBER) { // Neither has a number but one sees a number away : share vision
					p_eventList.push(new ViewEvent(x, y, dir, USOTATAMI_VIEW.NUMBER));
				} else if (p_solver.getView(x, y, odir) == USOTATAMI_VIEW.NUMBER) {
					p_eventList.push(new ViewEvent(dx, dy, odir, USOTATAMI_VIEW.NUMBER));
				}
			} else {
				p_eventList = p_solver.fenceGrid.avoidCrossBuild(p_eventList, x, y, dx, dy, dir);
				if (n1 != null) {
					p_eventList.push(new RangeEvent(x, y, dir, 0));
				} else {
					p_eventList.push(new ViewEvent(x, y, dir, USOTATAMI_VIEW.WALL));
					p_eventList = p_solver.testDeadEndSeeingNumber(p_eventList, x, y); // If a space is surrounded by 3 walls and sees a number, set a range
				}
				if (n2 != null) {
					p_eventList.push(new RangeEvent(dx, dy, odir, 0));
				} else {
					p_eventList.push(new ViewEvent(dx, dy, odir, USOTATAMI_VIEW.WALL));
					p_eventList = p_solver.testDeadEndSeeingNumber(p_eventList, dx, dy);
				}
			}
		} else if (p_eventBeingApplied.kind == VIEW_EVENT_KIND) { // VIEW_EVENT_KIND (damn, it was .state)
			// Must be applied on a space without a number !
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			const dir = p_eventBeingApplied.direction;
			const odir = OppositeDirection[dir];
			if (p_eventBeingApplied.view == USOTATAMI_VIEW.WALL) {
				// Propagate wall view behind if not blocked by a wall, a number or the edge of the grid 
				if (p_solver.neighborExists(x, y, odir) && p_solver.fenceGrid.getFence(x, y, odir) != FENCE_STATE.CLOSED) {
					const bx = x - DeltaX[dir];
					const by = y - DeltaY[dir];
					if (p_solver.getNumber(bx, by) == null) {
						p_eventList.push(new ViewEvent(bx, by, dir, USOTATAMI_VIEW.WALL));
					}						
				}
				// If both opposite directions of this space see walls : construct walls around !
				
				if (p_solver.getView(x, y, odir) == USOTATAMI_VIEW.WALL) {
					p_eventList.push(new FenceEvent(x, y, dir, FENCE_STATE.CLOSED));
					if (p_solver.neighborExists(x, y, odir)) {
						p_eventList.push(new FenceEvent(x, y, odir, FENCE_STATE.CLOSED));
					}
				}
				// If 3 directions see walls : claustrophobia, create opening events until meeting a number ! (exactly 1 number per strip = at least one)
				p_eventList = p_solver.testClaustrophobia(p_eventList, x, y);
				// If all 4 directions see wall : failure !
				if (p_solver.getWallDirections(x, y) == 4) {
					return [new FailureEvent()];
				}
			} else {
				const dx = x + DeltaX[dir];
				const dy = y + DeltaY[dir];
				// A number is seen, it means unless it's a number (I forgot to code it first) the opposite direction in this space and in the space behind must see walls ! (exactly 1 number per strip = max one.)
				if (p_solver.getNumber(dx, dy) == null) {
					p_eventList.push(new ViewEvent(dx, dy, odir, USOTATAMI_VIEW.WALL));
				}
				// What happens behind ?
				if (p_solver.neighborExists(x, y, odir)) {
					const bx = x - DeltaX[dir];
					const by = y - DeltaY[dir];
					if (p_solver.getNumber(bx, by) != null) { // Space behind is a number : immediately close the space
						p_eventList.push(new FenceEvent(x, y, odir, FENCE_STATE.CLOSED));
					} else if (p_solver.fenceGrid.getFence(bx, by, dir) == FENCE_STATE.OPEN) { // Open space behind : propagate vision.
						p_eventList.push(new ViewEvent(bx, by, dir, USOTATAMI_VIEW.NUMBER));
					} else {
						if (p_solver.getView(bx, by, odir) == FENCE_STATE.OPEN) {
							p_eventList.push(new FenceEvent(bx, by, dir, USOTATAMI_VIEW.WALL)); // Space behind sees a number in the opposite direction (in the opposite direction, eh ?) : close fence ! // It was my primary intention but I didn't put the right event and put it after the if / else instruction set.
						}
					} 
				}
				// If 3 spaces are seen, maybe go for a range event.
				p_eventList = p_solver.testDeadEndSeeingNumber(p_eventList, x, y);
				// By the way, do not close other visions because it should be done when adding fences, open or closed.
			}
		}
		// Ajouter également le "Range event" :
		// Pas de déduction, le seul contrôle est dans l'application du range event : si les 4 ranges sont définies et leur somme est égale au numéro de la case : failure !
		// Après, si 3 directions sont décidées et il n'en reste qu'une 4ème, la passe fera le travail (TM).
		return p_eventList;
	}
}

SolverUsotatami.prototype.testClaustrophobia = function(p_eventList, p_x, p_y) {
	if (this.getWallDirections(p_x, p_y) == 3) {
		KnownDirections.forEach(dir => {
			if (this.getView(p_x, p_y, dir) != USOTATAMI_VIEW.WALL) {
				p_eventList.push(new FenceEvent(p_x, p_y, dir, FENCE_STATE.OPEN));
			}
		}); // Can be optimized by returning early but whatever, it's a quickstart.
	}
	return p_eventList;
}

// Test if a non-number space is a dead end and sees a number. If yes, add a range event.
SolverUsotatami.prototype.testDeadEndSeeingNumber = function(p_eventList, p_x, p_y) {
	var numberWalls = 0;
	var directionSight = DIRECTION.UNDECIDED;
	var dir;
	for (var i = 0; i < KnownDirections.length ; i++) {
		dir = KnownDirections[i];
		if (!this.neighborExists(p_x, p_y, dir) || this.fenceGrid.getFence(p_x, p_y, dir) == USOTATAMI_VIEW.WALL) {
			numberWalls++;
		} else if (this.getView(p_x, p_y, dir) == USOTATAMI_VIEW.NUMBER) {
			directionSight = dir;
		} else {
			break;
		}
	};
	if ((directionSight != DIRECTION.UNDECIDED) && (numberWalls == 3)) {
		// Test is positive. x,y : space of the seen number.
		indexNumber = this.indicArray[p_y][p_x].firstIndexNumberSeen[directionSight];
		const x = this.numberSpacesArray[indexNumber].x;
		const y = this.numberSpacesArray[indexNumber].y;
		var range;
		// Check for filter. (remainder : directionSight = from (p_x, p_y) space)
		switch(directionSight) {
			case DIRECTION.LEFT : range = p_x-x; break;
			case DIRECTION.RIGHT : range = x-p_x; break;
			case DIRECTION.UP : range = p_y-y; break;
			case DIRECTION.DOWN : range = y-p_y; break;
		}
		p_eventList.push(new RangeEvent(x, y, OppositeDirection[directionSight], range));
	}
	return p_eventList;
}

//--------------------------------
// Filters (well, likely slower than a pass for the same result)

/*SolverUsotatami.prototype.addCheckNumberSpace = function(p_indexNumber) {
	if (!this.numberSpacesArray[p_indexNumber].checkRanges) {
		this.numberSpacesArray[p_indexNumber].checkRanges = true;
		this.numberSpacesToCheckList.push(p_indexNumber);
	}
}

SolverUsotatami.prototype.cleanNumberSpaceChecks = function() {
	this.numberSpacesToCheckList.forEach(index => {
		this.numberSpacesArray[index].checkRanges = false;
	});
}

abortClosure = function() {
	return function(p_solver) {
		p_solver.cleanNumberSpaceChecks();
		p_solver.numberSpacesToCheckList = [];
	}
}

filterNumbersSpacesClosure = function(p_solver) {
	SolverUsotatami.prototype.filterNumbersSpaces = function() {
	var x,y;
	var unknownRangeDir;
	var eventList = [];
	this.numberSpacesToCheckList.forEach(index => {
		unknownRangeDir = DIRECTION.UNDECIDED;
		// Make sure the number space has exactly 3 known ranges since it is about the 4th one.
		// Look for the undecided fences before next closed fence/edge of grid in relevant orientations, if any.
		// If there isn't exactly one, no point in trying to put a fence. If there is exactly one, we should try. 
		x = numberSpacesArray[index].x;
		y = numberSpacesArray[index].y;
		// TODO OK superfluous
		
	});
	p_solver.cleanNumberSpaceChecks();
	return eventList;
}*/ 
