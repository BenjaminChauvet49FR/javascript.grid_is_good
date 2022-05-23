const FIRUMATTO_MAX_LENGTH = 4;

// ------------------------
// Setup
SolverFirumatto.prototype = Object.create(GeneralSolver.prototype);
SolverFirumatto.prototype.constructor = SolverFirumatto;

function DummySolver() {	
	return new SolverFirumatto([[null]]);
}

function SolverFirumatto(p_numberSymbolsArray) {
	GeneralSolver.call(this);
	this.construct(p_numberSymbolsArray);
}


SolverFirumatto.prototype.construct = function(p_numberSymbolsArray) {
	this.generalConstruct();
	this.xLength = p_numberSymbolsArray[0].length;
	this.yLength = p_numberSymbolsArray.length;
	this.answerFencesGrid = new FencesGrid(this.xLength, this.yLength);
	
	this.methodsSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterClosedFencesClosure(this), filterOpenFencesClosure(this), filterChoiceSpacesClosure(this)]);
	this.methodsSetPass = {
		comparisonMethod : comparison, 
		copyMethod : copying, 
		argumentToLabelMethod : namingCategoryPassClosure(this)
	};
	
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForSpacePassClosure(this), 
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this), 
		passTodoMethod : multipassDefineTodoClosure(this)
	};
	
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this),
		searchSolutionMethod : searchClosure(this),
		isSolvedMethod : isSolvedClosure(this)
	}
	this.numericArray = []; // Note : this is NOT an answer array ! Answer support is in fences !
	this.fixedArray = [];
	this.numericCoordinatesList = [];
	this.questionCoordinatesList = [];
	this.oneClueArray = [];
	var clueCount = 0;
	var symbolOrNumber;
	// Definition of numericArray
	for (var y = 0; y < this.yLength ; y++) {
		this.numericArray.push([]);
		this.fixedArray.push([]);
		this.oneClueArray.push([]);
		for (var x = 0 ; x < this.xLength ; x++) {
			this.numericArray[y].push(new SpaceNumeric(1, FIRUMATTO_MAX_LENGTH)); 
			symbolOrNumber = p_numberSymbolsArray[y][x];
			if (symbolOrNumber == "?") { // Never used "fake clue" spaces, but since there is only one clue in a region...
				this.fixedArray[y].push("?"); 
				this.questionCoordinatesList.push({x : x, y : y}); 
				this.oneClueArray[y].push(clueCount++);
			} else if (symbolOrNumber != null) { // Numeric spaces
				this.fixedArray[y].push(parseInt(symbolOrNumber, 10));
				this.numericCoordinatesList.push({x : x, y : y});
				this.oneClueArray[y].push(clueCount++);
			} // Note : for future solvers : it cannot really be copied as it contains too many specific things.
			else {
				this.fixedArray[y].push(null);
				this.oneClueArray[y].push(null);
			}
		}
	}
	
	this.checkerClosedFences = new CheckCollectionDoubleEntryFences(this.xLength, this.yLength);
	this.checkerOpenFences = new CheckCollectionDoubleEntryFences(this.xLength, this.yLength); // It's quite interesting not to merge them
	this.checkerChosenSpaces = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
} 

// ------------------------
// Getters

/* Many getters about getting and setting fences defined in the fence grid manager */

SolverFirumatto.prototype.getFixedNumber = function(p_x, p_y) {
	return this.fixedArray[p_y][p_x];
}

SolverFirumatto.prototype.getRemainingPossibilities = function(p_x, p_y) {
	return this.numericArray[p_y][p_x].remainingSeveralPossibilitiesToString(false);
}

// ------------------------
// Input methods

SolverFirumatto.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	this.tryToApplyHypothesisSafe(new FenceEvent(p_x, p_y, DIRECTION.RIGHT, p_state));
}

SolverFirumatto.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	this.tryToApplyHypothesisSafe(new FenceEvent(p_x, p_y, DIRECTION.DOWN, p_state));
}

SolverFirumatto.prototype.undo = function(){
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverFirumatto.prototype.emitPassSpace = function(p_x, p_y) {
	const listPassNow = this.generateEventsPassSpace(p_x, p_y);
	this.passEventsSafe(listPassNow, {x : p_x, y : p_y}); 
}

SolverFirumatto.prototype.makeMultiPass = function() {	
	this.multiPassSafe(this.methodsSetMultipass);
}

// In this puzzle, quickstart is vital for the separation of numbers
SolverFirumatto.prototype.makeQuickStart = function(p_x, p_y) {
	this.quickStart();
}

SolverFirumatto.prototype.makeResolution = function() { 
	this.resolve();
}

//--------------------------------

// Central method
SolverFirumatto.prototype.tryToPutNew = function(p_x, p_y, p_direction, p_state) {
}

//--------------------------------
// Doing and undoing

// Offensive programming : we assume x and y are consistent.

applyEventClosure = function(p_solver) {
	return function(p_eventToApply) {
		switch (p_eventToApply.kind) {
			case FENCE_EVENT_KIND : return p_solver.applyFenceEvent(p_eventToApply.fenceX, p_eventToApply.fenceY, p_eventToApply.direction, p_eventToApply.state); break;
			case CHOICE_EVENT_KIND : return p_solver.applyChoiceEvent(p_eventToApply); break;
			case CLUE_EVENT_KIND : return p_solver.applyClueEvent(p_eventToApply); break;
		}
	}
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		switch (p_eventToUndo.kind) {
			case FENCE_EVENT_KIND : p_solver.answerFencesGrid.setFence(p_eventToUndo.fenceX, p_eventToUndo.fenceY, p_eventToUndo.direction, FENCE_STATE.UNDECIDED); break;
			case CHOICE_EVENT_KIND : 
				const x = p_eventToUndo.x;
				const y = p_eventToUndo.y;
				const number = p_eventToUndo.number;
				if (p_eventToUndo.choice) {
					p_solver.numericArray[y][x].unchoose(number);
				} else {
					p_solver.numericArray[y][x].unban(number); 
				} break;
			case CLUE_EVENT_KIND : 
				p_solver.oneClueArray[p_eventToUndo.y][p_eventToUndo.x] = null; break;
		}
	}
}

SolverFirumatto.prototype.applyFenceEvent = function(p_x, p_y, p_dir, p_state) {
	const state = this.answerFencesGrid.getFence(p_x, p_y, p_dir); // Could've been slightly optimized by some "getFenceRight/getFenceDown" and "setFenceRight/setFenceDown" but is it that much of a deal ?
	if (p_state == state) {
		return EVENT_RESULT.HARMLESS;
	} else if (state != FENCE_STATE.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerFencesGrid.setFence(p_x, p_y, p_dir, p_state);
	if (p_state == FENCE_STATE.CLOSED) {
		this.checkerClosedFences.add(p_x, p_y, p_dir);
	} else {
		this.checkerOpenFences.add(p_x, p_y, p_dir);
	}
	return EVENT_RESULT.SUCCESS;
}

SolverFirumatto.prototype.applyChoiceEvent = function(p_eventToApply) {
	const choice = p_eventToApply.choice;
	const x = p_eventToApply.x;
	const y = p_eventToApply.y;
	const number = p_eventToApply.number;
	const resultDo = testNumericSpaceChoice(this.numericArray, x, y, number, choice);
	if (resultDo != EVENT_RESULT.SUCCESS) {
		return resultDo;
	}
	if (choice) {
		this.checkerChosenSpaces.add(x, y);
		this.numericArray[y][x].choose(number); 
	} else {
		this.numericArray[y][x].ban(number);
	}
	return EVENT_RESULT.SUCCESS;
}

SolverFirumatto.prototype.applyClueEvent = function(p_eventToApply) {
	const x = p_eventToApply.x;
	const y = p_eventToApply.y;
	const index = p_eventToApply.index;
	const former = this.oneClueArray[y][x];
	if (former != null) {
		if (index != former) {
			return EVENT_RESULT.FAILURE;
		} else {
			return EVENT_RESULT.HARMLESS;
		}
	}
	this.oneClueArray[y][x] = index;
	return EVENT_RESULT.SUCCESS;
}

//-------------------------------- 
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function() {
		var x, y;
		var listQSEvents = [{quickStartLabel : "Firumatto"}];
		p_solver.numericCoordinatesList.forEach(coors => {
			x = coors.x;
			y = coors.y;
			number = p_solver.getFixedNumber(x, y);
			// Add numbers
			listQSEvents.push(new ChoiceEvent(x, y, number, true));
			// One clue
			p_solver.deductionsAssumeClueUnicity(listQSEvents, x, y, p_solver.oneClueArray[y][x]);
		});
		p_solver.questionCoordinatesList.forEach(coors => {
			x = coors.x;
			y = coors.y;
			p_solver.deductionsAssumeClueUnicity(listQSEvents, x, y, p_solver.oneClueArray[y][x]);
		});
		return listQSEvents;
	}
}

//--------------------------------
// Deductions

deductionsClosure = function(p_solver) {
	return function (p_listEventsToApply, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind == FENCE_EVENT_KIND) {
			const x = p_eventBeingApplied.fenceX;
			const y = p_eventBeingApplied.fenceY;
			const dir = p_eventBeingApplied.direction;
			const odir = OppositeDirection[dir];
			const dx = x + DeltaX[dir];
			const dy = y + DeltaY[dir];
			const value = p_solver.numericArray[y][x].getValue(); // IMPORTANT ! If "getOneLeft" is used rather than getValue, we can arrive to an unstable situation where the space has a value '1' chosen, the fences are being set now, but getOneLeft is still null since 'choice no' events aren't applied yet !
			const valueD = p_solver.numericArray[dy][dx].getValue();
			if (p_eventBeingApplied.state == FENCE_STATE.OPEN) {
				// Open fence
				p_solver.answerFencesGrid.deductionsStripBuild(p_listEventsToApply, x, y, dx, dy, dir);
				// symetrically transfer all informations
				var choiceAway, choiceHere;
				for (var i = 1 ; i <= FIRUMATTO_MAX_LENGTH ; i++) {
					choiceHere = p_solver.numericArray[y][x].getState(i);
					if (choiceHere != SPACE_CHOICE.UNDECIDED) {						
						p_listEventsToApply.push(new ChoiceEvent(dx, dy, i, choiceHere));
					}
					choiceAway = p_solver.numericArray[dy][dx].getState(i);
					if (choiceAway != SPACE_CHOICE.UNDECIDED) {						
						p_listEventsToApply.push(new ChoiceEvent(x, y, i, choiceAway));
					}
				}
				// Is a strip ready ?
				if (value != null && p_solver.answerFencesGrid.isFenceRatherClosed(x, y, odir)) {
					p_solver.deductionsReadyStrip(p_listEventsToApply, x, y, dir, value);
				}
				if (valueD != null && p_solver.answerFencesGrid.isFenceRatherClosed(dx, dy, dir)) {
					p_solver.deductionsReadyStrip(p_listEventsToApply, dx, dy, odir, valueD);
				}
				// Clue distribution
				const clue1 = p_solver.oneClueArray[y][x];
				const clue2 = p_solver.oneClueArray[dy][dx];
				if (clue1 != null) {
					p_listEventsToApply.push(new ClueEvent(dx, dy, clue1));
				}
				if (clue2 != null) {
					p_listEventsToApply.push(new ClueEvent(x, y, clue2));					
				}
			} else {
				// Closed fence
				p_solver.answerFencesGrid.deductionsAvoidCrossBuild(p_listEventsToApply, x, y, dx, dy, dir);
				// Symetrically prevent propagation of a number
				if (value != null) {
					p_listEventsToApply.push(new ChoiceEvent(dx, dy, value, false));
					if (p_solver.answerFencesGrid.isFenceSurelyOpen(x, y, odir)) {						
						p_solver.deductionsReadyStrip(p_listEventsToApply, x, y, odir, value);
					}
				}
				if (valueD != null) {
					p_listEventsToApply.push(new ChoiceEvent(x, y, valueD, false));
					if (p_solver.answerFencesGrid.isFenceSurelyOpen(dx, dy, dir)) {						
						p_solver.deductionsReadyStrip(p_listEventsToApply, dx, dy, dir, valueD);
					}
				}
				// A space can find itself fully enclosed : deduce it now.
				p_solver.deductionsEnclosedSpace(p_listEventsToApply, x, y);
				p_solver.deductionsEnclosedSpace(p_listEventsToApply, dx, dy);
			}
			// Claustrophobia test in filter
		} else if (p_eventBeingApplied.kind == CHOICE_EVENT_KIND) { 
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			const number = p_eventBeingApplied.number;
			if (p_eventBeingApplied.choice) {
				// Choice event yes
				// Ban events for all other values in this space
				deductionsExcludeOthersNumeric(p_listEventsToApply, p_solver.numericArray, x, y, number);
				// Ban number in diagonally adjacent spaces (smartness : because of the "not 4 closed fences in a point" rule) :
				p_solver.existingDiagonalNeighborsCoors(x, y).forEach(coors => {
					p_listEventsToApply.push(new ChoiceEvent(coors.x, coors.y, number, false));
				});
				// Open/close fences around 
				// And set choices for already open and closed fences
				var choice, fenceState;
				p_solver.existingNeighborsCoorsDirections(x, y).forEach(coorsDir => {
					choice = p_solver.numericArray[coorsDir.y][coorsDir.x].getState(number);
					if (choice == SPACE_CHOICE.YES) {
						p_listEventsToApply.push(new FenceEvent(x, y, coorsDir.direction, FENCE_STATE.OPEN));
					}
					if (choice == SPACE_CHOICE.NO) {
						p_listEventsToApply.push(new FenceEvent(x, y, coorsDir.direction, FENCE_STATE.CLOSED));						
					}
					fenceState = p_solver.answerFencesGrid.getFence(x, y, coorsDir.direction);
					if (fenceState == FENCE_STATE.OPEN) {
						p_listEventsToApply.push(new ChoiceEvent(coorsDir.x, coorsDir.y, number, true));
						// Is a strip ready ? 
						if (p_solver.answerFencesGrid.isFenceRatherClosed(coorsDir.x, coorsDir.y, OppositeDirection[coorsDir.direction]) ) {
							p_solver.deductionsReadyStrip(p_listEventsToApply, coorsDir.x, coorsDir.y, OppositeDirection[coorsDir.direction], number);
						}
					}
					if (fenceState == FENCE_STATE.CLOSED) {
						p_listEventsToApply.push(new ChoiceEvent(coorsDir.x, coorsDir.y, number, false));
					}
				});
				// Choice 1 : enclose it.
				if (number == 1) {
					p_solver.existingNeighborsDirections(x, y).forEach(dir => {
						p_listEventsToApply.push(new FenceEvent(x, y, dir, FENCE_STATE.CLOSED));
					});
				}
			} else {
				// Choice event no
				// One choice left in that space ?
				deductionsTestOneLeft(p_listEventsToApply, p_solver.numericArray, x, y);

				// Close fences around, and set choices for opened fences
				p_solver.existingNeighborsCoorsDirections(x, y).forEach(coorsDir => {
					if (p_solver.numericArray[coorsDir.y][coorsDir.x].getState(number) == SPACE_CHOICE.YES) {
						p_listEventsToApply.push(new FenceEvent(x, y, coorsDir.direction, FENCE_STATE.CLOSED));
					}
					if (p_solver.answerFencesGrid.getFence(x, y, coorsDir.direction) == FENCE_STATE.OPEN) {
						p_listEventsToApply.push(new ChoiceEvent(x, y, number, false));
					}
				});
				p_solver.deductionsTestClaustrophobia(p_listEventsToApply, x, y); // Note : if filter done on 'no choice', put it here
			}
		} else {
			// Clue unicity in a strip
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			const index = p_eventBeingApplied.index;
			p_solver.deductionsAssumeClueUnicity(p_listEventsToApply, x, y, index);
		}
	}
}

// Checks if a strip is closed by its four sides.
SolverFirumatto.prototype.deductionsEnclosedSpace = function(p_listEventsToApply, p_x, p_y) {
	var opening = false;
	for (dir = 0 ; dir <= 3 ; dir++) { // High convention : Directions 0123 assumption
		if (this.neighborExists(p_x, p_y, dir) && this.answerFencesGrid.getFence(p_x, p_y, dir) != FENCE_STATE.CLOSED) {
			return;
		}
	};
	p_listEventsToApply.push(new ChoiceEvent(p_x, p_y, 1, true));
}

// Create a strip of open fences of length equal to p_number, closed at the end.
// Precondition : in (p_x, p_y) the fence in direction p_opendir exists, while the fence in the opposite direction either doesn't exist or is closed.
// Also, p_number is a length of strip of desired length
SolverFirumatto.prototype.deductionsReadyStrip = function(p_listEventsToApply, p_x, p_y, p_openDir, p_number) {
	if (!this.distantNeighborExists(p_x, p_y, p_number-1, p_openDir)) {
		p_listEventsToApply.push(new FailureEvent());
		return;
	}
	var x = p_x;
	var y = p_y;
	for (var i = 1 ; i < p_number ; i++) {
		p_listEventsToApply.push(new FenceEvent(x, y, p_openDir, FENCE_STATE.OPEN));
		x += DeltaX[p_openDir];
		y += DeltaY[p_openDir];
	}
	if (this.neighborExists(x, y, p_openDir)) {
		p_listEventsToApply.push(new FenceEvent(x, y, p_openDir, FENCE_STATE.CLOSED));
	}
}

// Tests if a space has 3 "rather closed" fences AND its 1 state is equal to no. If so, open the 4th fence.
SolverFirumatto.prototype.deductionsTestClaustrophobia = function(p_listEventsToApply, p_x, p_y) {
	// High convention : directions 0, 1, 2, 3
	var foundNClosedDir = null;
	if (this.numericArray[p_y][p_x].getState(1) != SPACE_CHOICE.NO) {
		return;
	}
	for (var dir = 0 ; dir <= 3 ; dir++) {
		if (!this.answerFencesGrid.isFenceRatherClosed(p_x, p_y, dir)) {
			if (foundNClosedDir != null) {
				return;
			} else {
				foundNClosedDir = dir;
			}
		};
	}
	if (foundNClosedDir == null) {
		p_listEventsToApply.push(new FailureEvent());
	} else {
		p_listEventsToApply.push(new FenceEvent(p_x, p_y, foundNClosedDir, FENCE_STATE.OPEN));
	}
}

SolverFirumatto.prototype.deductionsAssumeClueUnicity = function(p_listEventsToApply, p_x, p_y, p_index) {
	var number2;
	// Suboptimal : could be done in filter
	this.existingNeighborsCoorsDirections(p_x, p_y).forEach(coorsDir => {
		if (this.answerFencesGrid.getFence(p_x, p_y, coorsDir.direction) == FENCE_STATE.OPEN) {
			p_listEventsToApply.push(new ClueEvent(coorsDir.x, coorsDir.y, p_index));
		}
		number2 = this.oneClueArray[coorsDir.y][coorsDir.x];
		// It's open fences that make clues equal, not the other way around. So no open spaces !
		if (number2 != null && number2 != p_index) {
			p_listEventsToApply.push(new FenceEvent(p_x, p_y, coorsDir.direction, FENCE_STATE.CLOSED));
		}
	});
} 

// Filters
function abortClosure(p_solver) {
	return function() {
		p_solver.checkerClosedFences.clean();
		p_solver.checkerOpenFences.clean();
		p_solver.checkerChosenSpaces.clean();
	}
}

// Note : here : 
// all choice states must be consistent with closed and open fences
// All enclosed spaces must have a choice of 1 and all 1-spaces must be enclosed.

function filterClosedFencesClosure(p_solver) {
	return function() {
		var data;
		var listEventsToApply = [];
		p_solver.checkerClosedFences.listRD.forEach(coorsDir => {
			if (coorsDir.direction == DIRECTION.DOWN) {	
				p_solver.deductionsTestClaustrophobia(listEventsToApply, coorsDir.x, coorsDir.y);
				p_solver.deductionsTestClaustrophobia(listEventsToApply, coorsDir.x, coorsDir.y+1);
				p_solver.deductionsChoiceClosedStrip(listEventsToApply, coorsDir.x, coorsDir.y, DIRECTION.UP);
				p_solver.deductionsChoiceClosedStrip(listEventsToApply, coorsDir.x, coorsDir.y+1, DIRECTION.DOWN);
			} else {
				p_solver.deductionsTestClaustrophobia(listEventsToApply, coorsDir.x, coorsDir.y);
				p_solver.deductionsTestClaustrophobia(listEventsToApply, coorsDir.x+1, coorsDir.y);
				p_solver.deductionsChoiceClosedStrip(listEventsToApply, coorsDir.x, coorsDir.y, DIRECTION.LEFT);
				p_solver.deductionsChoiceClosedStrip(listEventsToApply, coorsDir.x+1, coorsDir.y, DIRECTION.RIGHT);
			}
		});
		p_solver.checkerClosedFences.clean();
		return listEventsToApply;
	}
}

// Checks if a strip that has at least a closed fence belongs to a fully enclosed strip in given direction (and not of size one !) and if so, gives the choice of the grid
SolverFirumatto.prototype.deductionsChoiceClosedStrip = function(p_listEventsToApply, p_xStart, p_yStart, p_direction) {
	const data = this.dataStripPart(p_xStart, p_yStart, p_direction);
	if (data.blocked && data.partLength != 1) {
		p_listEventsToApply.push(new ChoiceEvent(p_xStart, p_yStart, data.partLength, true));
	}
}

// Checks if a strip is closed by its 2 sides. But not for 1-long stripes already checked in deductions.
SolverFirumatto.prototype.deductionsClosedStripFromClosedFence = function(p_listEventsToApply, p_xStart, p_yStart, p_direction) {
	const data = this.dataStripPart(p_xStart, p_yStart, p_direction);
	if ((data.partLength != 1) && (data.blocked)) {
		p_listEventsToApply.push(new ChoiceEvent(p_xStart, p_yStart, data.partLength, true)); //Then, it shall propagate
	}
}

function filterOpenFencesClosure(p_solver) { 
	return function() {
		 var listEventsToApply = [];
		// Same high convention !
		// Check the minimal length of the strip
		// Is strip closed ? Then add a choice
		// Is strip closed at one part and a length is known ? Interesting...
		var x1, y1, x2, y2, data1, data2, oneLeft, dir1, dir2, openLength, choice, i, coorsDir;
		for (i = 0 ; i < p_solver.checkerOpenFences.listRD.length ; i++) {
			coorsDir = p_solver.checkerOpenFences.listRD[i];
			// Bands are checked several times, but that's life ! 
			x1 = coorsDir.x;
			y1 = coorsDir.y;
			if (coorsDir.direction == DIRECTION.DOWN) {	
				dir1 = DIRECTION.UP;
				dir2 = DIRECTION.DOWN;
				x2 = coorsDir.x;
				y2 = coorsDir.y+1;

			} else {
				dir1 = DIRECTION.LEFT;
				dir2 = DIRECTION.RIGHT;
				x2 = coorsDir.x+1;
				y2 = coorsDir.y;
			}
			data1 = p_solver.dataStripPart(x1, y1, dir1);
			data2 = p_solver.dataStripPart(x2, y2, dir2);
			openLength = data1.partLength + data2.partLength; 
			choice = p_solver.numericArray[y1][x1].getValue();
			if (openLength > FIRUMATTO_MAX_LENGTH || (choice != null && openLength > choice)) {					
				listEventsToApply.push(new FailureEvent());	
				return listEventsToApply;
			}
			// Note : choices will propagate. Validate choice if strip blocked, ban too small sizes otherwise.
			if (data1.blocked && data2.blocked) {					
				listEventsToApply.push(new ChoiceEvent(x1, y1, openLength, true));
			} else {
				for (var io = 1 ; io < openLength ; io++) {
					listEventsToApply.push(new ChoiceEvent(x1, y1, io, false));
				}
				// Also, if desired length has been reached thanks to opening a fence, close the strip (deduction will do the rest)
				if (openLength == choice) { // Only check on the 1st space (leftmost/upmost) of the strip
					while (p_solver.answerFencesGrid.isFenceSurelyOpen(x1, y1, dir1)) {
						x1 += DeltaX[dir1];
						y1 += DeltaY[dir1];
					} 
					if (p_solver.neighborExists(x1, y1, dir1)) {
						listEventsToApply.push(new FenceEvent(x1, y1, dir1, FENCE_STATE.CLOSED))
					} else if (p_solver.distantNeighborExists(x1, y1, openLength, dir2)) {
						listEventsToApply.push(new FenceEvent(x1 + openLength * DeltaX[dir2], y1 + openLength * DeltaY[dir2], dir1, FENCE_STATE.CLOSED)); // It's truly dir1 and not dir2. If openLength = 2, we jump 2 spaces to close a strip of length 2
					}
				}
			}
		}; 
		p_solver.checkerOpenFences.clean();
		return listEventsToApply;
	}
}

// Going from (p_xStart, p_yStart, runs until meeting a non-open space. 
// Returns : the number of run spaces, and whether the extremity is closed or not.
SolverFirumatto.prototype.dataStripPart = function(p_xStart, p_yStart, p_direction) {
	var countStripLength = 1;
	var x = p_xStart;
	var y = p_yStart;
	while (this.answerFencesGrid.isFenceSurelyOpen(x, y, p_direction)) {
		x+=DeltaX[p_direction];
		y+=DeltaY[p_direction];
		countStripLength++;
	}
	return {
		blocked : (!this.neighborExists(x, y, p_direction) || this.answerFencesGrid.getFence(x, y, p_direction) == FENCE_STATE.CLOSED),
		partLength : countStripLength
	};
}

const deltaX1 = [-1, 0, +1, 0];
const deltaY1 = [0, -1, 0, +1];
function filterChoiceSpacesClosure(p_solver) {
	return function() {
		var listEventsToApply = [];
		var x, y, number, dir, stripLength, dataStripPart1, dataStripPart2;
		var i, coors;
		for (i = 0 ; i < p_solver.checkerChosenSpaces.list.length ; i++) {
			coors = p_solver.checkerChosenSpaces.list[i];
			// Note : spaces are checked several times but that's not a big deal... or is it ? 
			x = coors.x;
			y = coors.y;
			dataStripPart1 = null;
			number = p_solver.numericArray[y][x].getValue();
			dir = 0; // High convention : Directions 0123 assumption
			while(dir != 4 && dataStripPart1 == null) {
				if (p_solver.answerFencesGrid.isFenceSurelyOpen(x, y, dir)) {				
					dataStripPart1 = p_solver.dataStripPart(x + deltaX1[dir], y + deltaY1[dir], dir);
					dataStripPart2 = p_solver.dataStripPart(x, y, OppositeDirection[dir]);
				} else {
					dir++;
				}
			}
			if (dataStripPart1 != null) {				
				stripLength = dataStripPart1.partLength + dataStripPart2.partLength;
				if (stripLength == number) {
					if (OrientationDirection[dir] == ORIENTATION.HORIZONTAL) {
						while(p_solver.answerFencesGrid.isFenceSurelyOpen(x, y, DIRECTION.LEFT)) {
							x--;
						}
						if (x > 0) {
							listEventsToApply.push(new FenceEvent(x, y, DIRECTION.LEFT, FENCE_STATE.CLOSED));
						} 
						if (x + stripLength < p_solver.xLength) { // x,y = 1st position of the strip. (x+stripLength, y) = space immediately at the right of the strip.
							listEventsToApply.push(new FenceEvent(x + stripLength, y, DIRECTION.LEFT, FENCE_STATE.CLOSED));
						}
					} else {
						while(p_solver.answerFencesGrid.isFenceSurelyOpen(x, y, DIRECTION.UP)) {
							y--;
						}
						if (y > 0) {
							listEventsToApply.push(new FenceEvent(x, y, DIRECTION.UP, FENCE_STATE.CLOSED));
						} 
						if (y + stripLength < p_solver.yLength) { 
							listEventsToApply.push(new FenceEvent(x, y + stripLength, DIRECTION.UP, FENCE_STATE.CLOSED));
						}						
					}
				} else if (stripLength > number) {
					return FILTER_FAILURE;
				}
			}
			// Possible bonus : enclose the extremity if relevant choice, although pass will do the work, right ?
		};
		p_solver.checkerChosenSpaces.clean();
		return listEventsToApply;
	}
}


// -----------------------
// Passing

function comparison(p_event1, p_event2) {
	const kind1 = (p_event1.kind == FENCE_EVENT_KIND ? 0 : 1);
	const kind2 = (p_event2.kind == FENCE_EVENT_KIND ? 0 : 1);
	if (kind1 == 0 && kind2 == 0) { 
		return standardFenceComparison(p_event1, p_event2);
	} else { 
		return commonComparisonMultiKinds([0, 1], 
		[[], [], 
		[p_event1.y, p_event1.x, p_event1.number, p_event1.choice], [p_event2.y, p_event2.x, p_event2.number, p_event2.choice]], 
		kind1, 
		kind2);
	}
}

function copying(p_event) {
	if (p_event.kind == FENCE_EVENT_KIND) { 
		return p_event.standardFenceCopy();
	} else {
		return p_event.copy();
	}
}

SolverFirumatto.prototype.generateEventsPassSpace = function(p_x, p_y) {
	var listPass = [];
	this.existingNeighborsDirections(p_x, p_y).forEach(dir => {
		if (this.answerFencesGrid.getFence(p_x, p_y, dir) == FENCE_STATE.UNDECIDED) {			
			listPass.push([new FenceEvent(p_x, p_y, dir, FENCE_STATE.OPEN), new FenceEvent(p_x, p_y, dir, FENCE_STATE.CLOSED)]);
		}
	});
	return listPass;
}

namingCategoryPassClosure = function(p_solver) {
	return function(p_coors) {
		return (p_coors.x + "," + p_coors.y);
	}
}

generateEventsForSpacePassClosure = function(p_solver) {
	return function(p_coors) {
		return p_solver.generateEventsPassSpace(p_coors.x, p_coors.y);
	}
}

multipassDefineTodoClosure = function(p_solver) {
	return function(p_coors) {
		var resultToDo = false;
		p_solver.existingNeighborsDirections(p_coors.x, p_coors.y).forEach(dir => {
			resultToDo = resultToDo || p_solver.answerFencesGrid.getFence(p_coors.x, p_coors.y, dir) == FENCE_STATE.UNDECIDED;
		});
		return resultToDo;
	}
}

function orderedListPassArgumentsClosure(p_solver) {
	return function() {
		var listIndexesPass = [];
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			for (var x = 0 ; x < p_solver.xLength ; x++) {
				listIndexesPass.push({x : x, y : y});
			}	
		}
		return listIndexesPass;
	}
}
	
// Note : pass has a huge responsibility in deductions for clue unicity !


// --------------------
// Resolution

SolverFirumatto.prototype.isSolved = function() {
	return this.answerFencesGrid.isComplete(); // Note : could be optimized since 2 properties are verified per space, while it's possible to check for value... or not.
}

function isSolvedClosure(p_solver) {
	return function() {
		return p_solver.isSolved();
	}
}

function searchClosure(p_solver) {  
	return function() {
		var mp = p_solver.multiPass(p_solver.methodsSetMultipass);
		if (mp == MULTIPASS_RESULT.FAILURE) {
			return RESOLUTION_RESULT.FAILURE;
		}			
		if (p_solver.isSolved()) {		
			return RESOLUTION_RESULT.SUCCESS;
		}		

		return searchBestFenceForSolutionSearch(p_solver, p_solver.answerFencesGrid);
	}
}

