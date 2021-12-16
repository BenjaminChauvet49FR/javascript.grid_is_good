const NOT_FORCED = -1;
const AKARI_PASS_CATEGORY = {
	SPACE : 'S',
	SET_NUMERIC : 'N'
}

// Setup

function SolverAkari(p_numberSymbolArray) {
	GeneralSolver.call(this);
	this.construct(p_numberSymbolArray);
}

SolverAkari.prototype = Object.create(GeneralSolver.prototype);
DummySolver = function() {
	return new SolverAkari([[null]]);
}

SolverAkari.prototype.constructor = SolverAkari;

SolverAkari.prototype.construct = function(p_numberSymbolArray) {
	this.generalConstruct();
	this.xLength = p_numberSymbolArray[0].length;
	this.yLength = p_numberSymbolArray.length;
	
	this.methodsSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterClustersClosure(this)]);
	this.methodsSetPass = {comparisonMethod : compareSolveEvents, copyMethod : copying, argumentToLabelMethod : namingSetClosure(this)};
	this.methodsSetMultiPass = {
		generatePassEventsMethod : generateEventsForPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		skipPassMethod : skipPassClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}
	
	this.checkerOneLighterLeft = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	this.checkerSpacesAroundNumeric = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	
	this.answerArray = [];
	this.numericArray = [];
	this.setsAroundNumericSpaces = [];
	var symbolOrNumber, number;
	
	// Initialize answerArray and numericArray
	for(iy = 0 ; iy < this.yLength ; iy++) {
		this.answerArray.push([]);
		this.numericArray.push([]);
		for(ix = 0 ; ix < this.xLength ; ix++) {
			symbolOrNumber = p_numberSymbolArray[iy][ix];
			if (symbolOrNumber != null) {
				this.answerArray[iy].push(FILLING.NO); // Optional but I kinda like this
				if (symbolOrNumber == "X") {
					this.numericArray[iy].push({blocked : true, value : NOT_FORCED});
				} else {
					number = parseInt(symbolOrNumber, 10);
					this.numericArray[iy].push({blocked : true, value : number, notPlacedBulbsYet : number, notPlacedEmptiesYet : 4 - number, indexSetNumeric : -1}); // indexSetNumeric : for pass.
				}
			} else {
				this.answerArray[iy].push(FILLING.UNDECIDED);
				this.numericArray[iy].push({lighters : 0, stillPossibleLighters : -1, xMin : -1, xMax : -1, yMin : -1, yMax : -1, numericNeighbors : []});
			}
		}
	}
	
	var xx, yy;
	// Initialize numericArray
	for(iy = 0 ; iy < this.yLength ; iy++) {
		for(ix = 0 ; ix < this.xLength ; ix++) {
			if (this.numericArray[iy][ix].notPlacedEmptiesYet) { // Assumes that the puzzle is valid and notPlacedEmptiesYet >= 0 and if it is equal to 0 there's nothing to be done
				KnownDirections.forEach(dir => {
					if (!this.neighborExists(ix, iy, dir) || (this.numericArray[iy + DeltaY[dir]][ix + DeltaX[dir]].blocked)) {
						this.numericArray[iy][ix].notPlacedEmptiesYet--;
					} 
				});
			}
			// Trace spaces
			if (this.numericArray[iy][ix].blocked) {
				this.traceEmptySpacesHorizontallyFrom(ix + 1, iy);
				this.traceEmptySpacesVerticallyFrom(ix, iy + 1);
			}
		}	
	}
	// Trace from the left and up walls
	for (iy = 0; iy < this.yLength ; iy++) {
		this.traceEmptySpacesHorizontallyFrom(0, iy);
	}
	for (ix = 0; ix < this.xLength ; ix++) {
		this.traceEmptySpacesVerticallyFrom(ix, 0);
	}
	
	// Set "still possible" and neighboring
	for (iy = 0; iy < this.yLength ; iy++) {
		for (ix = 0; ix < this.xLength ; ix++) {
			if (this.getFixedSpace(ix, iy) == null) {
				this.numericArray[iy][ix].stillPossibleLighters = this.numericArray[iy][ix].xMax - this.numericArray[iy][ix].xMin + this.numericArray[iy][ix].yMax - this.numericArray[iy][ix].yMin + 1;
				this.existingNeighborsCoorsDirections(ix, iy).forEach(coors => {
					if (this.getNumericValue(coors.x, coors.y) != null) {
						this.numericArray[iy][ix].numericNeighbors.push({x : coors.x, y : coors.y});
					}
				});
			}
		}
	}
	
	var listNumericCoorsInSet, newNumericCoors;
	// "set sets around numeric spaces"
	for (iy = 0; iy < this.yLength ; iy++) {
		for (ix = 0; ix < this.xLength ; ix++) {
			val = this.getNumericValue(ix, iy);
			if (val != null && this.numericArray[iy][ix].indexSetNumeric == -1) {
				this.numericArray[iy][ix].indexSetNumeric = this.setsAroundNumericSpaces.length;
				listNumericSpacesCoors = this.getSetNumericSpaces([{x : ix, y : iy}], ix, iy);
				this.setsAroundNumericSpaces.push(this.generateSetsAroundNumeric(listNumericSpacesCoors));
			}
		}
	}
}

// Give informations until meeting a blocked space or an edge, horizontally. parameter = first space at right of blocked space, or 0.
SolverAkari.prototype.traceEmptySpacesHorizontallyFrom = function(p_xMin, p_y) {
	var xx = p_xMin;
	while (xx < this.xLength && !this.numericArray[p_y][xx].blocked) {
		this.numericArray[p_y][xx].xMin = p_xMin;
		xx++;
	}
	xx--;				
	for(var x = p_xMin ; x <= xx; x++) {
		this.numericArray[p_y][x].xMax = xx;
	}
}

SolverAkari.prototype.traceEmptySpacesVerticallyFrom = function(p_x, p_yMin) {
	var yy = p_yMin;
	while (yy < this.yLength && !this.numericArray[yy][p_x].blocked) {
		this.numericArray[yy][p_x].yMin = p_yMin;
		yy++;
	}
	yy--;				
	for(var y = p_yMin ; y <= yy; y++) {
		this.numericArray[y][p_x].yMax = yy;
	}
}

/*function copyList(p_listCoors) {
	
}*/

/**
Recursively generates a set of numeric spaces. All the spaces must be to a Manhattan distance of max 2.
*/
SolverAkari.prototype.getSetNumericSpaces = function(p_listCoors, p_x, p_y) {
	var x, y;
	KnownDirections.forEach(dir => {
		if (this.neighborExists(p_x, p_y, dir)) {
			x = p_x + DeltaX[dir];
			y = p_y + DeltaY[dir];
			p_listCoors = this.tryToAddNewNumericSpaceToSet(p_listCoors, x, y);
			if (this.distantNeighborExists(p_x, p_y, 2, dir)) {
				x = p_x + DeltaX[dir]*2;
				y = p_y + DeltaY[dir]*2;
				p_listCoors = this.tryToAddNewNumericSpaceToSet(p_listCoors, x, y);
			}
			if (this.neighborExists(p_x, p_y, dir) && this.neighborExists(p_x, p_y, TurningRightDirection[dir])) {
				x = p_x + DeltaX[dir] + DeltaX[TurningRightDirection[dir]];
				y = p_y + DeltaY[dir] + DeltaY[TurningRightDirection[dir]];
				p_listCoors = this.tryToAddNewNumericSpaceToSet(p_listCoors, x, y);
			}
		}
	});
	return p_listCoors;
}

SolverAkari.prototype.tryToAddNewNumericSpaceToSet = function(p_listCoors, p_x, p_y) {
	const val = this.getNumericValue(p_x, p_y);
	if ((val != null) && (this.numericArray[p_y][p_x].indexSetNumeric == -1)) {
		this.numericArray[p_y][p_x].indexSetNumeric = this.setsAroundNumericSpaces.length;
		p_listCoors.push({x : p_x, y : p_y});
		p_listCoors = this.getSetNumericSpaces(p_listCoors, p_x, p_y);
	}
	return p_listCoors;
}

/**
Gets from "sets of numeric spaces" "sets of empty spaces around numeric spaces"
*/
SolverAkari.prototype.generateSetsAroundNumeric = function(p_listNumericSpacesCoors) {
	var answer = [];
	p_listNumericSpacesCoors.forEach(coorsNum => {
		this.existingNeighborsCoorsDirections(coorsNum.x, coorsNum.y).forEach(aroundCoorsNum => {
			x = aroundCoorsNum.x;
			y = aroundCoorsNum.y;
			if (!this.numericArray[y][x].isBlocked) {				
				if (this.checkerSpacesAroundNumeric.add(x, y)) {
					answer.push({x : x, y : y});
				}
			}
		});
	});
	this.checkerSpacesAroundNumeric.clean(); // Note : due to the nature of the algorithm, cleaning is actually useless ! (numeric spaces distant 2, then empty spaces around numeric spaces)
	return answer;
}

//--------------------------------

// Misc methods (may be used for drawing and intelligence)
SolverAkari.prototype.getFixedSpace = function(p_x, p_y) { 
	if (!this.numericArray[p_y][p_x].blocked) {
		return null;
	} else {
		return this.numericArray[p_y][p_x].value;
	}
}

SolverAkari.prototype.getNumericValue = function(p_x, p_y) {
	return this.getNumericValueFromSpace(this.numericArray[p_y][p_x]);
}


SolverAkari.prototype.getNumericValueFromSpace = function(p_spaceInfos) {
	if (!p_spaceInfos.blocked) {
		return null;
	} else {
		const val = p_spaceInfos.value;
		return (val == NOT_FORCED ? null : val);
	}
}

SolverAkari.prototype.getAnswer = function(p_x, p_y) {
	return this.answerArray[p_y][p_x];
}

// Offensive : this space is empty
SolverAkari.prototype.isLighted = function(p_x, p_y) {
	return this.numericArray[p_y][p_x].lighters > 0;
}

//--------------
// Input

SolverAkari.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	return this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_symbol));
}

SolverAkari.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverAkari.prototype.makeQuickStart = function() {
	this.quickStart();
}

SolverAkari.prototype.passSpaceOrSetNumericSpaces = function(p_x, p_y) {
	const spaceInfos = this.numericArray[p_y][p_x];
	if (this.getNumericValueFromSpace(spaceInfos) != null) {
		generatedEvents = this.generateAllEventsForSetsAroundNumericSpacesPass(this.numericArray[p_y][p_x].indexSetNumeric);
		this.passEvents(generatedEvents, {passCategory : AKARI_PASS_CATEGORY.SET_NUMERIC, index : this.numericArray[p_y][p_x].indexSetNumeric});
	} else if (!this.numericArray[p_y][p_x].blocked) {
		generatedEvents = [this.generateListEventsForOneSpace(p_x, p_y)];
		this.passEvents(generatedEvents, {passCategory : AKARI_PASS_CATEGORY.SPACE, x : x, y : y});
	}
}

SolverAkari.prototype.makeMultiPass = function() {
	this.multiPass(this.methodsSetMultiPass);
}

//--------------------------------
// Doing and undoing

applyEventClosure = function(p_solver) {
	return function(p_solveEvent) {
		return p_solver.putNew(p_solveEvent.x,p_solveEvent.y, p_solveEvent.symbol);
	}
}

// Offensive : coordinates are valide and space isn't blocked !
SolverAkari.prototype.putNew = function(p_x, p_y, p_symbol) {
	const y = p_y;
	const x = p_x;
	const symbol = p_symbol; // Rewritten parameters to ease copy-pastes with undoing method below
	if (symbol == this.answerArray[y][x]) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[y][x] != FILLING.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerArray[y][x] = symbol;
	const spaceInfos = this.numericArray[y][x];
	if (symbol == FILLING.YES) {
		this.numericArray[y][x].lighters++;
		for (var xx = spaceInfos.xMin ; xx < x ; xx++) {
			this.numericArray[y][xx].lighters++;
		}
		for (var xx = x+1 ; xx <= spaceInfos.xMax ; xx++) {
			this.numericArray[y][xx].lighters++;
		}
		for (var yy = spaceInfos.yMin ; yy < y ; yy++) {
			this.numericArray[yy][x].lighters++;
		}
		for (var yy = y+1 ; yy <= spaceInfos.yMax ; yy++) {
			this.numericArray[yy][x].lighters++;
		}
		this.numericArray[y][x].numericNeighbors.forEach(space => {
			this.numericArray[space.y][space.x].notPlacedBulbsYet--;
		});
	} else {
		this.numericArray[y][x].stillPossibleLighters--;
		this.recenseOneLighterLeft(x, y);
		for (var xx = spaceInfos.xMin ; xx < x ; xx++) {
			this.numericArray[y][xx].stillPossibleLighters--;
			this.recenseOneLighterLeft(xx, y);
		}
		for (var xx = x+1 ; xx <= spaceInfos.xMax ; xx++) {
			this.numericArray[y][xx].stillPossibleLighters--;
			this.recenseOneLighterLeft(xx, y);
		}
		for (var yy = spaceInfos.yMin ; yy < y ; yy++) {
			this.numericArray[yy][x].stillPossibleLighters--;
			this.recenseOneLighterLeft(x, yy);			
		}
		for (var yy = y+1 ; yy <= spaceInfos.yMax ; yy++) {
			this.numericArray[yy][x].stillPossibleLighters--;
			this.recenseOneLighterLeft(x, yy);
		}
		this.numericArray[y][x].numericNeighbors.forEach(space => {
			this.numericArray[space.y][space.x].notPlacedEmptiesYet--;
		});
	}
	return EVENT_RESULT.SUCCESS;
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		p_solver.undoSymbolEvent(p_eventToUndo);
	}
}

SolverAkari.prototype.undoSymbolEvent = function(p_event) {
	const x = p_event.x;
	const y = p_event.y;
	const symbol = this.answerArray[y][x];
	const spaceInfos = this.numericArray[y][x];
	if (symbol == FILLING.YES) {
		this.numericArray[y][x].lighters--;
		for (var xx = spaceInfos.xMin ; xx < x ; xx++) {
			this.numericArray[y][xx].lighters--;
		}
		for (var xx = x+1 ; xx <= spaceInfos.xMax ; xx++) {
			this.numericArray[y][xx].lighters--;
		}
		for (var yy = spaceInfos.yMin ; yy < y ; yy++) {
			this.numericArray[yy][x].lighters--;
		}
		for (var yy = y+1 ; yy <= spaceInfos.yMax ; yy++) {
			this.numericArray[yy][x].lighters--;
		}
		this.numericArray[y][x].numericNeighbors.forEach(space => {
			this.numericArray[space.y][space.x].notPlacedBulbsYet++;
		});
	}
	else {
		this.numericArray[y][x].stillPossibleLighters++;
		for (var xx = spaceInfos.xMin ; xx < x ; xx++) {
			this.numericArray[y][xx].stillPossibleLighters++;
		}
		for (var xx = x+1 ; xx <= spaceInfos.xMax ; xx++) {
			this.numericArray[y][xx].stillPossibleLighters++;
		}
		for (var yy = spaceInfos.yMin ; yy < y ; yy++) {
			this.numericArray[yy][x].stillPossibleLighters++;
		}
		for (var yy = y+1 ; yy <= spaceInfos.yMax ; yy++) {
			this.numericArray[yy][x].stillPossibleLighters++;
		}
		this.numericArray[y][x].numericNeighbors.forEach(space => {
			this.numericArray[space.y][space.x].notPlacedEmptiesYet++;
		});
	}
	this.answerArray[p_event.y][p_event.x] = FILLING.UNDECIDED;
}

//-------------------------------- 
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvts = [{quickStartLabel : "Akari"}];
		var space;
		// TODO : a list of numeric spaces
		var spaceInfos;
		for (var iy = 0 ; iy < p_solver.yLength ; iy++) {
			for (var ix = 0 ; ix < p_solver.xLength ; ix++) {
				spaceInfos = p_solver.numericArray[iy][ix];
				if (p_solver.getNumericValueFromSpace(spaceInfos) != null) {
					if (spaceInfos.notPlacedBulbsYet == 0) {
						listQSEvts = p_solver.surroundNumericSpace(listQSEvts, ix, iy, FILLING.NO);
					}
					if (spaceInfos.notPlacedEmptiesYet == 0) {
						listQSEvts = p_solver.surroundNumericSpace(listQSEvts, ix, iy, FILLING.YES);
					}
				}							
			}
		}
		return listQSEvts;
	}
}

//-------------------------------- 
// Deductions

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		//Put symbol into space
		x = p_eventBeingApplied.x;
		y = p_eventBeingApplied.y;
		symbol = p_eventBeingApplied.symbol;
		spaceInfos = p_solver.numericArray[y][x];
		if (symbol == FILLING.YES) {
			p_listEventsToApply = p_solver.controlAroundNumericNewLightbulb(p_listEventsToApply, x, y);
			for (var xx = spaceInfos.xMin ; xx < x ; xx++) {
				p_listEventsToApply.push(new SpaceEvent(xx, y, FILLING.NO)); 
			}
			for (var xx = x+1 ; xx <= spaceInfos.xMax ; xx++) {
				p_listEventsToApply.push(new SpaceEvent(xx, y, FILLING.NO)); 
			}
			for (var yy = spaceInfos.yMin ; yy < y ; yy++) {
				p_listEventsToApply.push(new SpaceEvent(x, yy, FILLING.NO)); 
			}
			for (var yy = y+1 ; yy <= spaceInfos.yMax ; yy++) {
				p_listEventsToApply.push(new SpaceEvent(x, yy, FILLING.NO)); 
			}
		} else {
			p_listEventsToApply = p_solver.controlAroundNumericNewEmpty(p_listEventsToApply, x, y);
		}
		return p_listEventsToApply;
	}
}

SolverAkari.prototype.recenseOneLighterLeft = function(p_x, p_y) {
	if (this.numericArray[p_y][p_x].stillPossibleLighters == 1) {
		this.checkerOneLighterLeft.add(p_x, p_y);
	}
}

SolverAkari.prototype.controlAroundNumericNewLightbulb = function(p_listEventsToApply, p_x, p_y) {
	this.numericArray[p_y][p_x].numericNeighbors.forEach(coors => {
		if (this.numericArray[coors.y][coors.x].notPlacedBulbsYet == 0) {
			p_listEventsToApply = this.surroundNumericSpace(p_listEventsToApply, coors.x, coors.y, FILLING.NO);
		}
	});
	return p_listEventsToApply;
}

SolverAkari.prototype.controlAroundNumericNewEmpty = function(p_listEventsToApply, p_x, p_y) {
	this.numericArray[p_y][p_x].numericNeighbors.forEach(coors => {
		if (this.numericArray[coors.y][coors.x].notPlacedEmptiesYet == 0) {
			p_listEventsToApply = this.surroundNumericSpace(p_listEventsToApply, coors.x, coors.y, FILLING.YES);
		}
	});
	return p_listEventsToApply;
}

// When a numeric space (coors p_x, p_y) is ready to be surrounded
SolverAkari.prototype.surroundNumericSpace = function(p_listEventsToApply, p_x, p_y, p_symbolToPut) {
	this.existingNeighborsCoorsDirections(p_x, p_y).forEach(coors => {
		if (this.answerArray[coors.y][coors.x] == FILLING.UNDECIDED) {
			p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, p_symbolToPut));	
		}
	});
	return p_listEventsToApply;
}

// Filter spaces that newly have one posible lighter left. (They may have been lit since.)
filterClustersClosure = function(p_solver) {
	return function() {
		var eventsToApply = [];
		var ok = true;
		var x, y, foundBulb, spaceInfos;
		p_solver.checkerOneLighterLeft.list.forEach(coors => {
			x = coors.x;
			y = coors.y;
			spaceInfos = p_solver.numericArray[y][x];
			if (ok && spaceInfos.lighters == 0) {
				if (p_solver.numericArray[y][x].stillPossibleLighters == 0) {
					ok = false; // If deductions have made it impossible to light a space... too bad !
				} else {
					foundBulb = false;
					if (p_solver.answerArray[y][x] == FILLING.UNDECIDED) {
						eventsToApply.push(new SpaceEvent(x, y, FILLING.YES)); 
						foundBulb = true;
					}
					if (!foundBulb) {
						for (var xx = spaceInfos.xMin ; xx < x ; xx++) {
							if (p_solver.answerArray[y][xx] == FILLING.UNDECIDED) {
								eventsToApply.push(new SpaceEvent(xx, y, FILLING.YES)); 
								foundBulb = true;
								break;
							}
						}
					}
					if (!foundBulb) {
						for (var xx = x+1 ; xx <= spaceInfos.xMax ; xx++) {
							if (p_solver.answerArray[y][xx] == FILLING.UNDECIDED) {
								eventsToApply.push(new SpaceEvent(xx, y, FILLING.YES)); 
								foundBulb = true;
								break;
							}
						}
					}
					if (!foundBulb) {
						for (var yy = spaceInfos.yMin ; yy < y ; yy++) {
							if (p_solver.answerArray[yy][x] == FILLING.UNDECIDED) {
								eventsToApply.push(new SpaceEvent(x, yy, FILLING.YES)); 
								foundBulb = true;
								break;
							}
						}
					}
					if (!foundBulb) {
						for (var yy = y+1 ; yy <= spaceInfos.yMax ; yy++) {
							if (p_solver.answerArray[yy][x] == FILLING.UNDECIDED) {
								eventsToApply.push(new SpaceEvent(x, yy, FILLING.YES)); 
								foundBulb = true;
								break;
							}
						}
					}
				}
			}
		});
		if (ok) {
			p_solver.cleanOneLighterLeftSpaces();
			return eventsToApply;
		} else {
			return EVENT_RESULT.FAILURE;
		}
	}
}

abortClosure = function(p_solver) {
	return function() {
		p_solver.cleanOneLighterLeftSpaces();
	}
}

SolverAkari.prototype.cleanOneLighterLeftSpaces = function() {
	this.checkerOneLighterLeft.clean();
}

// ---------------------
// Pass methods

generateEventsForPassClosure = function(p_solver) {
	return function(p_indexPass) {
		if (p_indexPass.passCategory == AKARI_PASS_CATEGORY.NUMERIC_SET) {			
			return p_solver.generateAllEventsForSetsAroundNumericSpacesPass(p_indexPass.index);
		} else {
			return [p_solver.generateListEventsForOneSpace(p_indexPass.x, p_indexPass.y)];
		}
	}
}

SolverAkari.prototype.generateAllEventsForSetsAroundNumericSpacesPass = function(p_indexSpaces) {
	var eventList = [];
	this.setsAroundNumericSpaces[p_indexSpaces].forEach(coors => {
		eventList.push(this.generateListEventsForOneSpace(coors.x, coors.y));
	});
	return eventList;
}

SolverAkari.prototype.generateListEventsForOneSpace = function(p_x, p_y) {
	return [new SpaceEvent(p_x, p_y, FILLING.YES), new SpaceEvent(p_x, p_y, FILLING.NO)];
}

copying = function(p_event) {
	return p_event.copy();
}

function compareSolveEvents(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.symbol], [p_event2.y, p_event2.x, p_event2.symbol]]);
}

namingSetClosure = function(p_solver) {
	return function (p_index) {
		if (p_index.passCategory == AKARI_PASS_CATEGORY.NUMERIC_SET) {			
			const setCoors = p_solver.setsAroundNumericSpaces[p_index.index];
			return "Space set (" + setCoors[0].x + "," + setCoors[0].y + ", size " + setCoors.length + ")"; 
		} else {
			return "Space (" + p_index.x + "," + p_index.y + ")";
		}
	}
}

// ---------------------
// Multipass methods

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		// Note : may be optimized.
		var answer = [];
		for (var i = 0; i < p_solver.setsAroundNumericSpaces.length ; i++) {
			answer.push({passCategory : AKARI_PASS_CATEGORY.NUMERIC_SET, index : i});
		}
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			for (var x = 0 ; x < p_solver.xLength ; x++) {
				if (!p_solver.numericArray[y][x].blocked && p_solver.numericArray[y][x].numericNeighbors.length == 0) {					
					answer.push({passCategory : AKARI_PASS_CATEGORY.SPACE, x : x, y : y});
				}
			}
		}
		return answer;
	}
}

// Skip...
skipPassClosure = function(p_solver) {
	return function(p_argument) {
		return false; // TODO Only skip spaces ?
	}
}