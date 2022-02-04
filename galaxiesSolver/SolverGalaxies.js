GALAXIES_PASS_CATEGORY = {
	UNIQUE : 0,
	TOTAL : 1
}

// ------------------------
// Setup
SolverGalaxies.prototype = Object.create(GeneralSolver.prototype);
SolverGalaxies.prototype.constructor = SolverGalaxies;

function SolverGalaxies(p_symbolArray) {
	GeneralSolver.call(this);
	this.construct(p_symbolArray);
}

function DummySolver() {
	return new SolverGalaxies([[GALAXIES_POSITION.CENTER]]);
}

SolverGalaxies.prototype.construct = function(p_symbolArray) {
	this.generalConstruct();
	this.xLength = p_symbolArray[0].length;
	this.yLength = p_symbolArray.length;
	this.answerFenceGrid = new FencesGrid(this.xLength, this.yLength); // The answer fence grid
	this.centersGrid = Grid_data(p_symbolArray); // For drawing
	this.buildingPossibilitiesArray = generateFunctionValueArray(this.xLength, this.yLength, function() {return []}); // Indexes of potential regions that can belong to this space
	this.centersInArray = generateValueArray(this.xLength, this.yLength, null); // Tells if a space is reserved (there is a 'center in' it) and what is the center index.
	this.centersData = []; // Data about galaxy centers... and not "data centers ;) "
	this.choiceGalaxyArray = []; // Choice array : which galaxy does this space belong to ?
	this.commonIndexes = generateFunctionValueArray(this.xLength, this.yLength, function() {return {withRight : [], withDown : []}}); // Accessible indexes common between two adjacent spaces
	// Checker for filters
	this.centerAccessToBeChecked = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	this.centerAccessCheckedThisFilter = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	this.currentClusterCenterAccess = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	
	this.methodsSetDeductions = new ApplyEventMethodPack(
			applyEventClosure(this), 
			deductionsClosure(this),  
			undoEventClosure(this));
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterClustersClosure(this)]); // Needed to guarantee the entierety of the galaxies.
	
	this.methodsSetPass = {
		comparisonMethod : comparison, 
		copyMethod : copying, 
		argumentToLabelMethod : namingCategoryClosure(this)
	};
	
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this)
		//skipPassMethod : skipPassClosure(this)
	};	
	
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}
	
	// Offensive : all (galaxy) centers are well-positioned ! 
	var iCent = 0;
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			if (p_symbolArray[y][x] != null) {
				delta = getCoorsDifference(p_symbolArray[y][x]);
				this.centersData.push({x : x, y : y, realX : x + delta.x, realY : y + delta.y, possibleUncenteredSpaces : []}); // Note : possibleUncenteredSpaces added at the same time as filters
				switch (p_symbolArray[y][x]) {
					case GALAXIES_POSITION.CENTER : 
						this.addToBlockedSpaces(x, y, iCent);
					break;
					case GALAXIES_POSITION.RIGHT : 
						this.addToBlockedSpaces(x, y, iCent);
						this.addToBlockedSpaces(x+1, y, iCent);
					break;
					case GALAXIES_POSITION.DOWN : 
						this.addToBlockedSpaces(x, y+1, iCent);
						this.addToBlockedSpaces(x, y, iCent);
					break;
					case GALAXIES_POSITION.RIGHT_DOWN : 
						this.addToBlockedSpaces(x, y, iCent);
						this.addToBlockedSpaces(x+1, y, iCent);
						this.addToBlockedSpaces(x, y+1, iCent);
						this.addToBlockedSpaces(x+1, y+1, iCent);
					break;
				}
				iCent++;
			}
		}
	}

	// For each center, check the possible expansion
	var center;
	var coorsNextStep = [];
	var coorsCurrentStep;
	var x, y, xx, yy, dir;
	for (var i = 0 ; i < this.centersData.length ; i++) {
		center = this.centersData[i];
		x = center.x;
		y = center.y;
		// Determine the first 'next step'
		switch (p_symbolArray[y][x]) {
			case GALAXIES_POSITION.CENTER :			
				if (y > 0 && y <= this.yLength - 2) {						
					coorsNextStep.push({x : x, y : y-1}); 
				}
				if (x > 0 && x <= this.xLength - 2) {					
					coorsNextStep.push({x : x-1, y : y});
				}
			break;
			case GALAXIES_POSITION.RIGHT : 
				if (y > 0 && y <= this.yLength - 2) {						
					coorsNextStep.push({x : x, y : y-1}); 
					coorsNextStep.push({x : x+1, y : y-1}); 
				}
				if (x > 0 && x <= this.xLength - 3) {					
					coorsNextStep.push({x : x-1, y : y});
				}
			break;
			case GALAXIES_POSITION.DOWN : 
				if (y > 0 && y <= this.yLength - 3) {					
					coorsNextStep.push({x : x, y : y-1}); 
				}
				if (x > 0 && x <= this.xLength - 2) {					
					coorsNextStep.push({x : x-1, y : y});
					coorsNextStep.push({x : x-1, y : y+1});
				}
			break;
			case GALAXIES_POSITION.RIGHT_DOWN : 
				if (y > 0 && y <= this.yLength - 3) {					
					coorsNextStep.push({x : x, y : y-1}); 
					coorsNextStep.push({x : x+1, y : y-1}); 
				}
				if (x > 0 && x <= this.xLength - 3) {					
					coorsNextStep.push({x : x-1, y : y});
					coorsNextStep.push({x : x-1, y : y+1});
				}
			break;
		}
		// 'coors next step' is transferred into 'current step'
		while (coorsNextStep.length > 0) {
			coorsCurrentStep = [];
			// Transfer "next step" to "current step" & adding possibilities, if neither is a space blocked by another center (centersInArray)
			coorsNextStep.forEach(coors => {
				if (!this.containsIndexWhileInConstruction(coors.x, coors.y, i)) {					
					coorsSym = this.getSymetricalCoordinates(coors.x, coors.y, i);
					if (this.centersInArray[coors.y][coors.x] == null && this.centersInArray[coorsSym.y][coorsSym.x] == null) {						
						coorsCurrentStep.push(coors);
						this.buildingPossibilitiesArray[coors.y][coors.x].push(i);
						this.buildingPossibilitiesArray[coorsSym.y][coorsSym.x].push(i);
						this.centersData[i].possibleUncenteredSpaces.push(coors);
						this.centersData[i].possibleUncenteredSpaces.push(coorsSym);
					}
				}
			});
			coorsNextStep = [];
			coorsCurrentStep.forEach(coors => {
				// Explore all existing spaces around this space. If the space around has existing coordinates (so if true since this is guaranteed) AND is symetrically opposed to a space with existing coordinates (this is not guaranteed)
				this.existingNeighborsCoorsDirections(coors.x, coors.y).forEach(coorsDir => {
					xx = coorsDir.x;
					yy = coorsDir.y;
					if (!this.containsIndexWhileInConstruction(xx, yy, i)) {
						coorsOpposite = this.getSymetricalCoordinates(xx, yy, i);
						xxx = coorsOpposite.x;
						yyy = coorsOpposite.y;
						if (this.areCoordinatesInPuzzle(xxx, yyy)) {
							coorsNextStep.push({x : xx, y : yy});
						}
					}
				});
			});
		}
	}
	
	// Generate the choice array that will be used a lot.
	this.choiceGalaxyArray = generateFunctionValueArray(this.xLength, this.yLength, closurePossibilities(this.buildingPossibilitiesArray));	
	
	// Initialize this.commonIndexes
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x <= this.xLength-2 ; x++) {
			this.commonIndexes[y][x].withRight = this.commonPossibilities(x, y, x+1, y);
		}
	}
	for (var y = 0 ; y <= this.yLength-2 ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			this.commonIndexes[y][x].withDown = this.commonPossibilities(x, y, x, y+1);
		}
	}
	
}

function closurePossibilities(p_possibilitiesArray) {
	return function(p_x, p_y) {
		return new SpaceNumericSelect(p_possibilitiesArray[p_y][p_x])
	}
}

// ------------------------
// Getters



// ------------------------
// Misc. inner methods

function getCoorsDifference(p_position) {
	switch (p_position) {
		case GALAXIES_POSITION.CENTER : return {x : 0, y : 0}; break;
		case GALAXIES_POSITION.RIGHT : return {x : 0.5, y : 0}; break;
		case GALAXIES_POSITION.DOWN : return {x : 0, y : 0.5}; break;
		case GALAXIES_POSITION.RIGHT_DOWN : return {x : 0.5, y : 0.5}; break;
	}
}

SolverGalaxies.prototype.addToBlockedSpaces = function(p_x, p_y, p_ic) {
	this.centersInArray[p_y][p_x] = p_ic;
	this.buildingPossibilitiesArray[p_y][p_x].push(p_ic);
}

// Method usable only during construction
SolverGalaxies.prototype.containsIndexWhileInConstruction = function(p_x, p_y, p_ic) {
	const possArray = this.buildingPossibilitiesArray[p_y][p_x];
	return (possArray.length > 0) && (possArray[possArray.length-1] == p_ic);
}

// Returns coordinates of the space symmetric to the center referenced by the index p_ic
SolverGalaxies.prototype.getSymetricalCoordinates = function(p_x, p_y, p_ic) {
	var cent = this.centersData[p_ic];
	return {x : cent.realX * 2 - p_x, y : cent.realY * 2 - p_y}
}

SolverGalaxies.prototype.commonPossibilities = function(p_x, p_y, p_dx, p_dy) {
	const indexes1 = this.buildingPossibilitiesArray[p_y][p_x];
	const indexes2 = this.buildingPossibilitiesArray[p_dy][p_dx];
	return intersectAscendingValues(this.buildingPossibilitiesArray[p_y][p_x], this.buildingPossibilitiesArray[p_dy][p_dx]);
}

/* Many getters about getting and setting fences defined in the parent solver. */

// ------------------------
// Input methods

SolverGalaxies.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	this.tryToApplyHypothesis(new FenceEvent(p_x, p_y, DIRECTION.RIGHT, p_state));
}

SolverGalaxies.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	this.tryToApplyHypothesis(new FenceEvent(p_x, p_y, DIRECTION.DOWN, p_state));
}

SolverGalaxies.prototype.emitPassRight = function(p_x, p_y) {
	const generatedEvents = [this.generatePassEventsOneFence(p_x, p_y, DIRECTION.RIGHT)];
	return this.passEvents(generatedEvents, {x : p_x, y : p_y, direction : DIRECTION.RIGHT, categoryPass : GALAXIES_PASS_CATEGORY.UNIQUE}); 
}

SolverGalaxies.prototype.emitPassCenterForSpace = function(p_x, p_y) {
	const index = this.centersInArray[p_y][p_x];
	if (index != null) {
		const generatedEvents = this.generatePassEventsCenterExpansion(index);
		this.passEvents(generatedEvents, {categoryPass : GALAXIES_PASS_CATEGORY.AROUND_CENTER, index : index});
	}
}

SolverGalaxies.prototype.emitPassDown = function(p_x, p_y) {
	const generatedEvents = [this.generatePassEventsOneFence(p_x, p_y, DIRECTION.DOWN)];
	return this.passEvents(generatedEvents, {x : p_x, y : p_y, direction : DIRECTION.DOWN, categoryPass : GALAXIES_PASS_CATEGORY.UNIQUE}); 
}

SolverGalaxies.prototype.undo = function(){
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverGalaxies.prototype.makeMultiPass = function() {	
	this.multiPass(this.methodsSetMultipass);
}

// In this puzzle, quickstart is vital for the separation of centers
SolverGalaxies.prototype.makeQuickStart = function(p_x, p_y) {
	this.quickStart();
}

//--------------------------------
// Doing and undoing

// Offensive programming : we assume x and y are consistent.

applyEventClosure = function(p_solver) {
	return function(p_event) {
		switch (p_event.kind) {
			case FENCE_EVENT_KIND : return p_solver.applyFenceEvent(p_event.fenceX, p_event.fenceY, p_event.direction, p_event.state); break;
			case CHOICE_EVENT_KIND : return p_solver.applyChoiceEvent(p_event.x, p_event.y, p_event.index, p_event.choice); break;
		}
	}
}

undoEventClosure = function(p_solver) {
	return function(p_event) {
		switch (p_event.kind) {
			case FENCE_EVENT_KIND : return p_solver.undoFenceEvent(p_event.fenceX, p_event.fenceY, p_event.direction, p_event.state); break;
			case CHOICE_EVENT_KIND : return p_solver.undoChoiceEvent(p_event.x, p_event.y, p_event.index, p_event.choice); break;
		}
	}
}

SolverGalaxies.prototype.applyFenceEvent = function(p_x, p_y, p_dir, p_state) {
const state = this.answerFenceGrid.getFence(p_x, p_y, p_dir); 
	if (p_state == state) {
		return EVENT_RESULT.HARMLESS;
	} else if (state != FENCE_STATE.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerFenceGrid.setFence(p_x, p_y, p_dir, p_state);
	this.centerAccessToBeChecked.add(p_x, p_y);
	this.centerAccessToBeChecked.add(p_x + DeltaX[p_dir], p_y  + DeltaY[p_dir]);
	return EVENT_RESULT.SUCCESS;
}

SolverGalaxies.prototype.applyChoiceEvent = function(p_x, p_y, p_index, p_choice) {
	if (!this.choiceGalaxyArray[p_y][p_x].contains(p_index)) {
		return p_choice ? EVENT_RESULT.FAILURE : EVENT_RESULT.HARMLESS;
	}
	const currentState = (this.choiceGalaxyArray[p_y][p_x].getState(p_index));
	if (currentState == SPACE_CHOICE.YES) {
		return p_choice ? EVENT_RESULT.HARMLESS : EVENT_RESULT.FAILURE;
	} else if (currentState == SPACE_CHOICE.NO) {
		return p_choice ? EVENT_RESULT.FAILURE : EVENT_RESULT.HARMLESS;
	} 
	if (p_choice) {
		this.choiceGalaxyArray[p_y][p_x].choose(p_index);
	} else {
		this.choiceGalaxyArray[p_y][p_x].ban(p_index);
	}
	this.centerAccessToBeChecked.add(p_x, p_y);
	return EVENT_RESULT.SUCCESS;
}


SolverGalaxies.prototype.undoFenceEvent = function(p_x, p_y, p_dir) {
	this.answerFenceGrid.setFence(p_x, p_y, p_dir, FENCE_STATE.UNDECIDED);
}

SolverGalaxies.prototype.undoChoiceEvent = function(p_x, p_y, p_index, p_choice) {
	if (p_choice) {		
		this.choiceGalaxyArray[p_y][p_x].unchoose(p_index);
	} else {		
		this.choiceGalaxyArray[p_y][p_x].unban(p_index);
	}
}

//-------------------------------- 
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvts = [{quickStartLabel : "Galaxies"}];
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			for (var x = 0 ; x < p_solver.xLength ; x++) {
				// A space has only one possible index ? Define that space.
				singleIndex = p_solver.choiceGalaxyArray[y][x].getSingleValue(); 
				if (singleIndex != null) {
					listQSEvts.push(new ChoiceEvent(x, y, singleIndex ,true));
				}
				// Two indexes are incompatible ? 
				if (y <= p_solver.yLength - 2) {
					listQSEvts = p_solver.noCompatibleIndexDeductions(listQSEvts, x, y, x, y+1, DIRECTION.DOWN);
				}
				if (x <= p_solver.xLength - 2) {
					listQSEvts = p_solver.noCompatibleIndexDeductions(listQSEvts, x, y, x+1, y, DIRECTION.RIGHT);				
				}
			}
		}
		return listQSEvts;
	}
}

//--------------------------------
// Deductions

deductionsClosure = function(p_solver) {
	return function (p_eventList, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind == FENCE_EVENT_KIND) {
			// ----- Fence event
			const x = p_eventBeingApplied.fenceX;
			const y = p_eventBeingApplied.fenceY;
			const dir = p_eventBeingApplied.direction;
			const odir = OppositeDirection[dir];
			const dx = x + DeltaX[dir];
			const dy = y + DeltaY[dir];
			// For each index, push a fence event for the opposite space. Do this for both spaces (don't miss one)
			var ok = true;
			var ind = p_solver.choiceGalaxyArray[y][x].getValue();
			if (ind != null) {
				p_eventList = p_solver.presenceSymetricOppositeFenceDeductions(p_eventList, x, y, odir, ind, p_eventBeingApplied.state); // Do the same symetrically
				ok = !(p_eventList[p_eventList.length-1].failure);
			}
			ind = p_solver.choiceGalaxyArray[dy][dx].getValue();
			if (ind != null) {
				p_eventList = p_solver.presenceSymetricOppositeFenceDeductions(p_eventList, dx, dy, dir, ind, p_eventBeingApplied.state); // Do the same symetrically
				ok &= !(p_eventList[p_eventList.length-1].failure);
			}
			if (!ok) {
				return p_eventList;
			}
			if (p_eventBeingApplied.state == FENCE_STATE.OPEN) {
				// If fence open
				p_solver.choiceGalaxyArray[y][x].values().forEach(index => {
					p_eventList = p_solver.transferIndexChoicesToOtherSpaceDeductions(p_eventList, x, y, dx, dy, index);
				});
				p_solver.choiceGalaxyArray[dy][dx].values().forEach(index => {					
					p_eventList = p_solver.transferIndexChoicesToOtherSpaceDeductions(p_eventList, dx, dy, x, y, index);
				}); // Opposite will be done on the symetric
			} else {
				// If fence closed
				p_solver.choiceGalaxyArray[y][x].values().forEach(index => {					
					p_eventList = p_solver.barrChosenOppositeDeductions(p_eventList, x, y, dx, dy, index);
				});
				p_solver.choiceGalaxyArray[dy][dx].values().forEach(index => {					
					p_eventList = p_solver.barrChosenOppositeDeductions(p_eventList, dx, dy, x, y, index);
				}); // Opposite will be done on the symetric
			}
		} else { 
			// ----- Choice event
			const index = p_eventBeingApplied.index;
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			// Create symetrical choice
			p_eventList = p_solver.presenceSymetricOppositeSpaceDeductions(p_eventList, x, y, index, p_eventBeingApplied.choice);
			if (p_eventList[p_eventList.length-1].failure) {
				return p_eventList;
			}
			if (p_eventBeingApplied.choice) {
				// For each direction, check if neighbor if direction exists and if so, do many things (see below).
				KnownDirections.forEach(dir => {
					if (!p_solver.neighborExists(x, y, dir)) {
						// Neighbor in a direction doesn't exist ? Add a symetrical closed fence ! Of course it must exist.
						p_eventList = p_solver.presenceSymetricOppositeFenceDeductions(p_eventList, x, y, OppositeDirection[dir], index, FENCE_STATE.CLOSED);
					} else {
						// Neighbor if a direction exists ? 
						// Depending on indexes adjacent spaces, open/close fences.
						dx = x + DeltaX[dir];
						dy = y + DeltaY[dir];
						const adjacentSpaceState = p_solver.choiceGalaxyArray[dy][dx].getState(index);
						if (adjacentSpaceState == SPACE_CHOICE.YES) { 
							p_eventList.push(new FenceEvent(x, y, dir, FENCE_STATE.OPEN));
						} else if (adjacentSpaceState == SPACE_CHOICE.NO) {
							p_eventList.push(new FenceEvent(x, y, dir, FENCE_STATE.CLOSED));
						}
						// Depending on adjacent fences, choose/ban indexes in adjacent spaces.
						const adjacentFenceState = p_solver.answerFenceGrid.getFence(x, y, dir);
						if (adjacentFenceState == FENCE_STATE.OPEN) {
							p_eventList.push(new ChoiceEvent(dx, dy, index, true));
						} else if (adjacentFenceState == FENCE_STATE.CLOSED) {
							p_eventList.push(new ChoiceEvent(dx, dy, index, false));
						}
						// Manage the state of fences at opposite space
						if (adjacentFenceState != FENCE_STATE.UNDECIDED) {
							const coorsSym = p_solver.getSymetricalCoordinates(x, y, index);
							sx = coorsSym.x;
							sy = coorsSym.y;
							if (p_solver.areCoordinatesInPuzzle(sx, sy) && p_solver.neighborExists(sx, sy, OppositeDirection[dir])) {
								p_eventList.push(new FenceEvent(sx, sy, OppositeDirection[dir], adjacentFenceState));
							}
						}
					}
					
				});
				// Aaand... and everything else in this space.
				p_solver.choiceGalaxyArray[y][x].values().forEach(index2 => {
					if (index2 != index) {
						p_eventList.push(new ChoiceEvent(x, y, index2, false));
					}
				});
			} else {
				// Ban. Apply the following for the adjacent existing spaces.
				p_solver.existingNeighborsCoorsDirections(x, y).forEach(coorsDir => {
					dir = coorsDir.direction;
					dx = coorsDir.x;
					dy = coorsDir.y;
					// Test adjacent space and define adjacent fences
					const adjacentSpaceState = p_solver.choiceGalaxyArray[dy][dx].getState(index);
					if (adjacentSpaceState == SPACE_CHOICE.YES) { 
						p_eventList.push(new FenceEvent(x, y, dir, FENCE_STATE.CLOSED));
					}
					// Test adjacent fence and define adjacent spaces
					const adjacentFenceState = p_solver.answerFenceGrid.getFence(x, y, dir);
					if (adjacentFenceState == FENCE_STATE.OPEN) {
						p_eventList.push(new ChoiceEvent(x, y, index, false));
					}
					// Test if both spaces have no common 'possible index' with each other. If so : close fence.
					p_eventList = p_solver.noCompatibleIndexDeductions(p_eventList, x, y, coorsDir.x, coorsDir.y, dir);
				});
				// Aaand... check if there's only 1 index left.
				const justOne = p_solver.choiceGalaxyArray[y][x].getOneLeft();
				if (justOne != null) {
					p_eventList.push(new ChoiceEvent(x, y, justOne, true));
				}
			}
		}
		return p_eventList;
	}
}

// Tells if the fence of the state opposite to (p_x, p_y) and in direction o_dir exists AND if this is the case adds it to the list of events. Causes a failure if positions/directions are invalid and an opening was planned.
SolverGalaxies.prototype.presenceSymetricOppositeFenceDeductions = function(p_eventList, p_x, p_y, p_odir, p_index, p_stateFence) {
	const symetric = this.getSymetricalCoordinates(p_x, p_y, p_index);
	const sx = symetric.x;
	const sy = symetric.y;
	if (this.areCoordinatesInPuzzle(sx, sy) && this.neighborExists(sx, sy, p_odir)) {
		p_eventList.push(new FenceEvent(sx, sy, p_odir, p_stateFence));
	} else if (p_stateFence == FENCE_STATE.OPEN) {
		p_eventList.push(new FailureEvent());
	}
	return p_eventList;
}

// Both spaces have an open fence between : transfer a choice number from (p_x, p_y) to (p_dx, p_dy)  (it shall eventually be done for all numbers in both directions)
SolverGalaxies.prototype.transferIndexChoicesToOtherSpaceDeductions = function(p_eventList, p_x, p_y, p_dx, p_dy, p_index) {
	const state = this.choiceGalaxyArray[p_y][p_x].getState(p_index);
	if (state == SPACE_CHOICE.YES) {
		p_eventList.push(new ChoiceEvent(p_dx, p_dy, p_index, true));		
	} else if (state == SPACE_CHOICE.NO) {
		p_eventList.push(new ChoiceEvent(p_dx, p_dy, p_index, false));		
	}
	return p_eventList;
}

// If space (p_x, p_y) is 'chosen', ban the space (p_dx, p_dy)
SolverGalaxies.prototype.barrChosenOppositeDeductions = function(p_eventList, p_x, p_y, p_dx, p_dy, p_index) {
	if (this.choiceGalaxyArray[p_y][p_x].getState(p_index) == SPACE_CHOICE.YES) {
		p_eventList.push(new ChoiceEvent(p_dx, p_dy, p_index, false));		
	}
	return p_eventList;
}

// Check if the symetric space exists, if so adds an event. Causes a failure if it doesn't exist and a "true" choice was planned.
SolverGalaxies.prototype.presenceSymetricOppositeSpaceDeductions = function(p_eventList, p_x, p_y, p_index, p_choice) {
	const symetric = this.getSymetricalCoordinates(p_x, p_y, p_index);
	const sx = symetric.x;
	const sy = symetric.y;
	if (this.areCoordinatesInPuzzle(sx, sy)) {
		p_eventList.push(new ChoiceEvent(sx, sy, p_index, p_choice));
	} else if (p_choice) {
		p_eventList.push(new FailureEvent());
	}
	return p_eventList;
}

// If there are no compatible directions between this and the neighbor directions, adds a fence.
SolverGalaxies.prototype.noCompatibleIndexDeductions = function(p_eventList, p_x, p_y, p_dx, p_dy, p_dir) {
	if (p_dir == DIRECTION.LEFT || p_dir == DIRECTION.UP) {
		return this.noCompatibleIndexDeductions(p_eventList, p_dx, p_dy, p_x, p_y, OppositeDirection[p_dir]);
	}
	var closeIt = true;
	var state1;
	var state2;
	if (p_dir == DIRECTION.RIGHT) {
		this.commonIndexes[p_y][p_x].withRight.forEach(index => {
			state1 = this.choiceGalaxyArray[p_y][p_x].getState(index);
			state2 = this.choiceGalaxyArray[p_dy][p_dx].getState(index);
			if (state1 != SPACE_CHOICE.NO || state2 != SPACE_CHOICE.NO) {
				closeIt = false;
			}
		});
	} else {
		this.commonIndexes[p_y][p_x].withDown.forEach(index => {
			state1 = this.choiceGalaxyArray[p_y][p_x].getState(index);
			state2 = this.choiceGalaxyArray[p_dy][p_dx].getState(index);
			if (state1 != SPACE_CHOICE.NO || state2 != SPACE_CHOICE.NO) {
				closeIt = false;
			}
		});
	}
	if (closeIt) {
		p_eventList.push(new FenceEvent(p_x, p_y, p_dir, FENCE_STATE.CLOSED));
	}
	return p_eventList;
}

// -------------------
// Filters and abortions

// For each 'space to check', check which 'spaces with centers' it can access by crossing non-closed fences. 
// TODO : when a galaxy is determined that contains ONLY spaces with the center... the other possibilities should be closed immediately ! Right now it is pass work ! 
function filterClustersClosure(p_solver) {
	return function() {
		var answer = [];
		var newSpacesForCluster, x, y, newCoors, xx, yy, xxx, yyy, accessedCenterIndexNow;
		var accessedCenterIndex = null;
		var doubleCIAccess = false; // Double center index
		p_solver.centerAccessCheckedThisFilter.clean(); // Must be cleaned at start of filter.
		p_solver.centerAccessToBeChecked.list.forEach(coors => {
			if (answer == EVENT_RESULT.FAILURE) {
				return;
			}
			// New space for a new cluster (set of spaces that aren't blocked by closed fences)
			p_solver.currentClusterCenterAccess.clean();
			y = coors.y;
			x = coors.x;
			onlyCheckAccessibleCenter = false;
			// We NEED to verify even for spaces that already are linked to a center, otherwise we can have such spaces that belong to a galaxy but are isolated from it.
			// However, we shouldn't try to fabricate clusters in this case. It could lead to unexpected results !
			if (p_solver.centerAccessCheckedThisFilter.array[y][x] || p_solver.centersInArray[y][x] != null) { 
				dejaVu = true;
			} else if (p_solver.choiceGalaxyArray[y][x].getValue() != null) {
				newSpacesForCluster = [coors];
				onlyCheckAccessibleCenter = true;
				okAccess = false;
			} else {
				newSpacesForCluster = [coors];
				accessedCenterIndex = null;
				doubleCIAccess = false;
				dejaVu = false;
			}
			// Check cluster starting in (x, y)
			if (onlyCheckAccessibleCenter) {
				while (!okAccess && newSpacesForCluster.length > 0) {
					newCoors = newSpacesForCluster.pop();
					xx = newCoors.x;
					yy = newCoors.y;
					okAccess = (p_solver.centersInArray[yy][xx] == p_solver.choiceGalaxyArray[y][x].getValue()); 
					p_solver.centerAccessCheckedThisFilter.add(xx, yy);
					p_solver.currentClusterCenterAccess.add(xx, yy);
					p_solver.existingNeighborsCoorsDirections(xx, yy).forEach(coorsDir => {
						xxx = coorsDir.x;
						yyy = coorsDir.y;
						dir = coorsDir.direction;
						if (p_solver.answerFenceGrid.getFence(xx, yy, dir) != FENCE_STATE.CLOSED && !p_solver.currentClusterCenterAccess.array[yyy][xxx]) {
							// A new space to explore !
							newSpacesForCluster.push({x : xxx, y : yyy});
						}
					});
				}
				if (!okAccess) {
					answer = EVENT_RESULT.FAILURE;
				}
			} else {
				while (!dejaVu && !doubleCIAccess && newSpacesForCluster.length > 0) {
					newCoors = newSpacesForCluster.pop();
					xx = newCoors.x;
					yy = newCoors.y;
					p_solver.centerAccessCheckedThisFilter.add(xx, yy); // Add to the 'center access checked', so it's ok for this filter.
					p_solver.currentClusterCenterAccess.add(xx, yy);
					p_solver.existingNeighborsCoorsDirections(xx, yy).forEach(coorsDir => {
						xxx = coorsDir.x;
						yyy = coorsDir.y;
						dir = coorsDir.direction;
						if (p_solver.answerFenceGrid.getFence(xx, yy, dir) != FENCE_STATE.CLOSED) {
							if (!p_solver.centerAccessCheckedThisFilter.array[yyy][xxx]) {
								// A new space to explore !
								accessedCenterIndexNow = p_solver.centersInArray[yyy][xxx]; // This space is linked to a center ? It may be the only one linked to a given center but... whatever, pass will do the work !
								if (accessedCenterIndexNow != null) {
									if (accessedCenterIndex != null && accessedCenterIndexNow != accessedCenterIndex) {
										doubleCIAccess = true;
									} else {
										accessedCenterIndex = accessedCenterIndexNow;
									}
								} else {
									// New spaces not linked to a center AND ADJACENT not through a closed fence : add it ! 
									newSpacesForCluster.push({x : xxx, y : yyy});
								} 
							} else {
								// If we have p_solver.centerAccessCheckedThisFilter.array[yyy][xxx] to true despite we didn't check this space in current cluster, 
								// it is because we already checked this in previous cluster and it was a cluster with double center index access (doubleCIAccess)
								// it is because we already checked this in previous cluster ; maybe it was a cluster with double center index access (doubleCIAccess), maybe a full cluster. Anyway, do not check it again.
								if (!p_solver.currentClusterCenterAccess.array[yyy][xxx]) {								
									dejaVu = true;
								}
							}
						}
					});
				}
				if (!doubleCIAccess && !dejaVu) {
					if (accessedCenterIndex == null) {
						answer = EVENT_RESULT.FAILURE;
					} else {
						// Found a cluster part ! 
						var symCoors;
						p_solver.currentClusterCenterAccess.list.forEach(coors2 => {
							// But wait, what is the guarantee that all spaces admit an existing symetric part ? (crashing pass in puzzle 100 raised the concern)
							symCoors = p_solver.getSymetricalCoordinates(coors2.x, coors2.y, accessedCenterIndex);
							if (!p_solver.areCoordinatesInPuzzle(symCoors.x, symCoors.y)) {
								answer = EVENT_RESULT.FAILURE;
							} else {								
								p_solver.currentClusterCenterAccess.add(symCoors.x, symCoors.y);
							}
						});
					}
					if (answer != EVENT_RESULT.FAILURE) {
						// Prepare a list of events depending on p_solver.currentClusterCenterAccess. 
						var listNoClusters = [];
						p_solver.centersData[accessedCenterIndex].possibleUncenteredSpaces.forEach(coors2 => {
							answer.push(new ChoiceEvent(coors2.x, coors2.y, accessedCenterIndex, p_solver.currentClusterCenterAccess.array[coors2.y][coors2.x]));
						});
					}
				}
			}
		});
		p_solver.cleanSuspiciousForCentersAccessSpaces();
		return answer;
	}
}

function abortClosure(p_solver) {
	return function() {
		p_solver.cleanSuspiciousForCentersAccessSpaces();
	}
}

SolverGalaxies.prototype.cleanSuspiciousForCentersAccessSpaces = function() {
	this.centerAccessToBeChecked.clean();
}

// -------------------
// Pass

function copying(p_event) {
	if (p_event.kind == FENCE_EVENT_KIND) { 
		return p_event.standardFenceCopy();
	} else {
		return p_event.copy();
	}
}

function comparison(p_event1, p_event2) {
	const k1 = (p_event1.kind == FENCE_EVENT_KIND ? 0 : 1);
	const k2 = (p_event2.kind == FENCE_EVENT_KIND ? 0 : 1);
	if (k1 != k2) {
		return k2 - k1;
	}
	if (k1 == 0) {
		return standardFenceComparison(p_event1, p_event2);
	} else {
		return commonComparison([[p_event1.index, p_event1.y, p_event1.x, p_event1.choice], [p_event2.index, p_event2.y, p_event2.x, p_event2.choice]]);
	}
}

SolverGalaxies.prototype.generatePassEventsOneFence = function(p_x, p_y, p_dir) {
	return [new FenceEvent(p_x, p_y, p_dir, FENCE_STATE.OPEN), new FenceEvent(p_x, p_y, p_dir, FENCE_STATE.CLOSED)];
}

SolverGalaxies.prototype.generatePassEventsCenterExpansion = function(p_index) {
	// Important note : Only every other space is taken since events will be symetrical.
	var i = 0;
	var answer = [];
	this.centersData[p_index].possibleUncenteredSpaces.forEach(coors => {
		//if (i == 0) {			// If we only take half of the spaces, there's something weird with passes that are incorrect when performed manually for puzzle 100.
			answer.push([new ChoiceEvent(coors.x, coors.y, p_index, true), new ChoiceEvent(coors.x, coors.y, p_index, false)]); 
		//}
		i = 1-i;
	});
	return answer;
}

function namingCategoryClosure(p_solver) {
	return function(p_index) {
		if (p_index.categoryPass == GALAXIES_PASS_CATEGORY.AROUND_CENTER) {
			const center = p_solver.centersData[p_index.index];
			return "Galaxy " + p_index.index + " (" + center.realX + " " + center.realY + ")";
		} else {
			return stringDirection(p_index.direction) + " " + p_index.x + " " + p_index.y;
		}
	}
}

function generateEventsForPassClosure(p_solver) {
	return function(p_index) {
		if (p_index.categoryPass == GALAXIES_PASS_CATEGORY.AROUND_CENTER) {
			return p_solver.generatePassEventsCenterExpansion(p_index.index);
		} else {			
			return [p_solver.generatePassEventsOneFence(p_index.x, p_index.y, p_index.direction)];
		}
	}
}

function orderedListPassArgumentsClosure(p_solver) {
	return function() {
		var answer = [];
		for (i = 0 ; i < p_solver.centersData.length ; i++) {
			answer.push({categoryPass : GALAXIES_PASS_CATEGORY.AROUND_CENTER, index : i});
		}
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			for (var x = 0 ; x < p_solver.xLength ; x++) {
				if (x <= p_solver.xLength-2) {
					answer.push({x : x, y : y, direction : DIRECTION.RIGHT, categoryPass : GALAXIES_PASS_CATEGORY.UNIQUE});
				}
				if (y <= p_solver.yLength-2) {
					answer.push({x : x, y : y, direction : DIRECTION.DOWN, categoryPass : GALAXIES_PASS_CATEGORY.UNIQUE});
				}
			}
		}
		return answer;
	}
}

