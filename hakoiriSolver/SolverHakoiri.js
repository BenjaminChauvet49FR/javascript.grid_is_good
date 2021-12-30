function SolverHakoiri(p_wallArray, p_symbolsArray) {
	GeneralSolver.call(this);
	this.construct(p_wallArray, p_symbolsArray);
}

// Credits about heritage : https://developer.mozilla.org/fr/docs/Learn/JavaScript/Objects/Heritage

SolverHakoiri.prototype = Object.create(GeneralSolver.prototype);
SolverHakoiri.prototype.constructor = SolverHakoiri;

function DummySolver() {
	return new SolverHakoiri(generateWallArray(1, 1), [[null]]);
}

SolverHakoiri.prototype.construct = function(p_wallArray, p_symbolsArray) {
	this.generalConstruct();
	this.xLength = p_symbolsArray[0].length;
	this.yLength = p_symbolsArray.length;
	this.makeItGeographical(this.xLength, this.yLength, new ApplyEventMethodGeographicalPack( 
		applyEventClosure(this),
		deductionsClosure(this),
		adjacencyClosure(this),
		transformClosure(this),
		undoEventClosure(this)
	));
	this.methodsSetPass = {comparisonMethod : comparison, copyMethod : copying, argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForRegionPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this)//,
		//skipPassMethod : skipPassClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}

	this.answerArray = [];		
	this.numericSpaceList = []; // For quickstart
	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();
	this.regions = [];
	
	var symbol;
	
	// Definition of answerArray
	for (var y = 0; y < this.yLength ; y++) {
		this.answerArray.push([]);
		for (var x = 0 ; x < this.xLength ; x++) {
			if (this.regionArray[y][x] == WALLGRID.OUT_OF_REGIONS) {
				this.answerArray[y].push({blocked : true, value : null});
			} else {	
				symbol = p_symbolsArray[y][x];
				switch(symbol) {
					case (SYMBOL_ID.ROUND) : this.answerArray[y].push({blocked : true, value : SPACE_HAKOIRI.ROUND});  break;
					case (SYMBOL_ID.SQUARE) : this.answerArray[y].push({blocked : true, value : SPACE_HAKOIRI.SQUARE});  break;
					case (SYMBOL_ID.TRIANGLE) : this.answerArray[y].push({blocked : true, value : SPACE_HAKOIRI.TRIANGLE});  break;
					default : this.answerArray[y].push(new SpaceNumeric(0, 3));  break;
				}	
			}
		}
	}
	
	const spacesByRegion = listSpacesByRegion(this.regionArray);
	this.regionsNumber = spacesByRegion.length;
	
	// Region data
	var ir;
	this.regions = [];
	for(ir=0 ; ir < this.regionsNumber ; ir++) {
		this.regions.push({
			spaces : spacesByRegion[ir],
			size : spacesByRegion[ir].length,
			possibilities : null
		});
	}
	
	// Purification ! For each region, ban all occurences of each appearing symbol in other spaces of the region.
	for(ir = 0 ; ir < this.regionsNumber ; ir++) {
		region = this.regions[ir];
		for (is = 0 ; is < region.spaces.length ; is++) {
			x = region.spaces[is].x;
			y = region.spaces[is].y;
			if (this.answerArray[y][x].blocked && this.answerArray[y][x].value != null) {
				region.spaces.forEach(space => {
					x2 = space.x;
					y2 = space.y;
					if (!this.answerArray[y2][x2].blocked) {
						this.answerArray[y2][x2].ban(this.answerArray[y][x].value);
					} 
				});
			}
		}
	}
	
	// Puzzle-related purification (ban orthogonally/diagonally adj. values)
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			if (this.answerArray[y][x].blocked) {
				fixedShape = this.answerArray[y][x].value;
				if (fixedShape != null) {
					this.existingNeighborsCoorsWithDiagonals(x, y).forEach(coors => {
						if (!this.answerArray[coors.y][coors.x].blocked) {							
							this.answerArray[coors.y][coors.x].banIfNecessary(fixedShape);
						}
					});
				}
			}
		}
	}
	
	// Sets for each region, after purification
	// Filters for each region (after purification) 
	var notPlacedYet;
	var setupNumericSpaces;
	const min = 0;
	const max = 3;
	for(ir = 0 ; ir < this.regionsNumber ; ir++) {
		region = this.regions[ir];
		notPlacedYet = [region.size - 3, 1, 1, 1];
		setupNumericSpaces = [];
		for (is = 0 ; is < region.spaces.length ; is++) {
			x = region.spaces[is].x;
			y = region.spaces[is].y;

			fixedVal = p_symbolsArray[y][x]; // Remember, p_symbolsArray is an argument of the constructor.
			if (fixedVal == SYMBOL_ID.ROUND) {
				notPlacedYet[1]--;
			} else if (fixedVal == SYMBOL_ID.SQUARE) {
				notPlacedYet[2]--;
			} else if (fixedVal == SYMBOL_ID.TRIANGLE) {
				notPlacedYet[3]--;
			} else {
				setupNumericSpaces.push(this.answerArray[y][x]);
			}
		}
		region.possibilities = new SpaceSetNumeric(setupNumericSpaces, notPlacedYet, min, max);
	}
	
	this.declarationsOpenAndClosed();
}

//--------------------------------

// Misc methods (may be used for drawing and intelligence)
// All functions below are coded in offensive programming !
SolverHakoiri.prototype.isBanned = function(p_x, p_y) { 
	return this.regionArray[p_y][p_x] == WALLGRID.OUT_OF_REGIONS;
}

SolverHakoiri.prototype.getFixedShape = function(p_x, p_y) {
	if (this.answerArray[p_y][p_x].blocked) {
		return this.answerArray[p_y][p_x].value;
	} else {
		return null;
	}
}

SolverHakoiri.prototype.getVariableShape = function(p_x, p_y) {
		return this.answerArray[p_y][p_x].getValue();
}

SolverHakoiri.prototype.isOpenNotBannedDraw = function(p_x, p_y) {
	return (this.answerArray[p_y][p_x].blocked || this.answerArray[p_y][p_x].getState(SPACE_HAKOIRI.EMPTY) == SPACE_CHOICE.NO);
}

SolverHakoiri.prototype.isClosedNotBannedDraw = function(p_x, p_y) {
	return (!this.answerArray[p_y][p_x].blocked && this.answerArray[p_y][p_x].getState(SPACE_HAKOIRI.EMPTY) == SPACE_CHOICE.YES);
}

//--------------------------------
// Input methods

SolverHakoiri.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverHakoiri.prototype.makeQuickStart = function() {
	this.quickStart();
}

SolverHakoiri.prototype.emitHypothesisSpace = function(p_x, p_y, p_value, p_ok) {
	if (!this.answerArray[p_y][p_x].blocked) {
		this.tryToApplyHypothesis(new SpaceAllowEvent(p_x, p_y, p_value, p_ok));
	}
}

SolverHakoiri.prototype.emitPassRegion = function(p_x, p_y) {
	const index = this.regionArray[p_y][p_x]; 
	if (index != WALLGRID.OUT_OF_REGIONS) {
		const generatedEvents = this.generateEventsForRegionPass(index);
		this.passEvents(generatedEvents, index); 
	}
}

SolverHakoiri.prototype.makeMultiPass = function() {
	return this.multiPass(this.methodsSetMultipass);
}

//--------------------------------

// Doing and undoing
// Offensiveness : x and y valid, space not banned.
applyEventClosure = function(p_solver) {
	return function(p_eventToApply) {
		return p_solver.putNewInSpace(p_eventToApply.x, p_eventToApply.y, p_eventToApply.symbol, p_eventToApply.choice);
	}
}

// Offensive programming : x and y are within bounds (and that's it, block spaces are checked first. Because beware of intrusions... looking at you, 2x2 square checker.)
SolverHakoiri.prototype.putNewInSpace = function(p_x, p_y, p_symbol, p_choice) {
	if (this.isBanned(p_x, p_y)) {
		if (p_symbol == SPACE_HAKOIRI.EMPTY && p_choice == true) { // This check is mandatory only because banned spaces have a format different from non-banned ones.
			return EVENT_RESULT.HARMLESS;
		} else {
			return EVENT_RESULT.FAILURE;
		}
	}
	if (this.answerArray[p_y][p_x].blocked) {
		if (p_symbol != this.answerArray[p_y][p_x].value) { 
			return p_choice ? EVENT_RESULT.FAILURE : EVENT_RESULT.HARMLESS;
		} else {
			return p_choice ? EVENT_RESULT.HARMLESS : EVENT_RESULT.FAILURE;
		}
	}
	const currentState = (this.answerArray[p_y][p_x].getState(p_symbol));
	if (currentState == SPACE_CHOICE.YES) {
		return p_choice ? EVENT_RESULT.HARMLESS : EVENT_RESULT.FAILURE;
	} else if (currentState == SPACE_CHOICE.NO) {
		return p_choice ? EVENT_RESULT.FAILURE : EVENT_RESULT.HARMLESS;
	} 
	const region = this.regions[this.regionArray[p_y][p_x]];
	if (p_choice) {
		this.answerArray[p_y][p_x].choose(p_symbol);
		region.possibilities.warnPlaced(p_symbol); 
	} else {
		this.answerArray[p_y][p_x].ban(p_symbol);
		region.possibilities.warnBanned(p_symbol);
	}
	return EVENT_RESULT.SUCCESS;
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		//  Set UNDECIDED
		const x = p_eventToUndo.x;
		const y = p_eventToUndo.y;
		const symbol = p_eventToUndo.symbol;
		const region = p_solver.regions[p_solver.regionArray[y][x]];
		if (p_eventToUndo.choice) {
			p_solver.answerArray[y][x].unchoose(symbol);
			region.possibilities.unwarnPlaced(symbol);
		} else {
			p_solver.answerArray[y][x].unban(symbol);
			region.possibilities.unwarnBanned(symbol);
		}
	}
}

//--------------------------------
// Quickstart !

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvts = [{quickStartLabel : "Hakoiri"}];

		for (var y = 0 ; y < p_solver.yLength ; y++) {
			for (var x = 0 ; x < p_solver.xLength ; x++) {
				// One number possible in a space
				if (!p_solver.answerArray[y][x].blocked) {
					justOne = p_solver.answerArray[y][x].getOneLeft();
					if (justOne != null) {
						listQSEvts.push(new SpaceAllowEvent(x, y, justOne, true));
					}
				}
			}
		}
		
		p_solver.regions.forEach(region => {
			Object.keys(SPACE_HAKOIRI).forEach(symbol => {		
				listQSEvts = p_solver.alertOneLeftInRegionDeductions(listQSEvts, region, SPACE_HAKOIRI[symbol]);
			});
		});
		return listQSEvts;
	}
}

//--------------------------------

// Exchanges solver and geographical

/**
Transforms a geographical deduction (see dedicated class GeographicalDeduction) into an appropriate event (SolveEvent in our case)
*/
transformClosure = function (p_solver) {
    return function (p_geographicalDeduction) {
		return new SpaceAllowEvent(p_geographicalDeduction.x, p_geographicalDeduction.y, SPACE_HAKOIRI.EMPTY, p_geographicalDeduction.opening == ADJACENCY.NO);
    } 
};

adjacencyClosure = function (p_solver) {
    return function (p_x, p_y) {
		if (p_solver.regionArray[p_y][p_x] == WALLGRID.OUT_OF_REGIONS) {
			return ADJACENCY.NO;
		}
		if (p_solver.answerArray[p_y][p_x].blocked) { // Warning : assumes that there are no "X" among the blocked spaces.
			return ADJACENCY.YES;
		}
        switch (p_solver.answerArray[p_y][p_x].getState(SPACE_HAKOIRI.EMPTY)) { 
			case SPACE_CHOICE.YES : return ADJACENCY.NO; break;
			case SPACE_CHOICE.NO : return ADJACENCY.YES; break;
			default : return ADJACENCY.UNDECIDED; break;
        }
    }
}

//--------------------------------

// Intelligence

// Deductions closure. Where intelligence begins !
deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {			
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const symbol = p_eventBeingApplied.symbol;
		const region = p_solver.regions[p_solver.regionArray[y][x]];
		if (p_eventBeingApplied.choice) {
			// Ban all other possibilities for this space (if shape)
			Object.keys(SPACE_HAKOIRI).forEach(value => {
				if (SPACE_HAKOIRI[value] != symbol) {					
					p_listEventsToApply.push(new SpaceAllowEvent(x, y, SPACE_HAKOIRI[value], false));
				}
			});
			// Last symbol ? Ban this shape for all other shapes for this region
			var x2, y2;
			if (region.possibilities.getNotPlacedYet(symbol) == 0) {
				region.spaces.forEach(coors => {
					x2 = coors.x;
					y2 = coors.y;
					if ((x2 != x || y2 != y) && (p_solver.answerArray[y2][x2].blocked || p_solver.answerArray[y2][x2].getState(symbol) == SPACE_CHOICE.UNDECIDED)) {
						p_listEventsToApply.push(new SpaceAllowEvent(x2, y2, symbol, false));
					}
				});
			}
			// If shape, ban diagonally
			if (symbol != SPACE_HAKOIRI.EMPTY) {
				p_solver.existingNeighborsCoorsWithDiagonals(x, y).forEach(coors => {
					x2 = coors.x;
					y2 = coors.y;
					if (!p_solver.answerArray[y2][x2].blocked) {
						p_listEventsToApply.push(new SpaceAllowEvent(x2, y2, symbol, false));
					}
				});
			}
		} else {
			// Only one possibility left in this space ?
			const last = p_solver.answerArray[y][x].getOneLeft();
			if (last != null) {
				p_listEventsToApply.push(new SpaceAllowEvent(x, y, last, true));
			}
			// Only one possible place in this region ?
			p_solver.alertOneLeftInRegionDeductions(p_listEventsToApply, region, symbol);
		}
		return p_listEventsToApply;
	}
}

SolverHakoiri.prototype.alertOneLeftInRegionDeductions = function(p_eventList, p_region, p_symbol) {
	if ((p_region.possibilities.getNotBannedYet(p_symbol) == 0) && (p_region.possibilities.getNotPlacedYet(p_symbol) > 0)) {
		var spaceCount = 0;
		p_region.spaces.forEach(coors => {
			x = coors.x;
			y = coors.y;
			if (this.getFixedShape(x, y) == null && this.answerArray[y][x].getState(p_symbol) == SPACE_CHOICE.UNDECIDED) {
				p_eventList.push(new SpaceAllowEvent(x, y, p_symbol, true));
				spaceCount++;
			}
		});
		if (spaceCount != p_region.possibilities.getNotPlacedYet(p_symbol)) {
			p_eventList.push(new FailureEvent());
		}
	}
	return p_eventList;
}


// --------------------
// Passes & multipasses

generateEventsForRegionPassClosure = function(p_solver) {
	return function(p_index) {
		return p_solver.generateEventsForRegionPass(p_index);
	}
}

SolverHakoiri.prototype.generateEventsForRegionPass = function(p_index) {
	var answer = [];
	this.regions[p_index].spaces.forEach(coors => {
		answer.push(
		[new SpaceAllowEvent(coors.x, coors.y, SPACE_HAKOIRI.EMPTY, true), 
		new SpaceAllowEvent(coors.x, coors.y, SPACE_HAKOIRI.ROUND, true),
		new SpaceAllowEvent(coors.x, coors.y, SPACE_HAKOIRI.SQUARE, true),
		new SpaceAllowEvent(coors.x, coors.y, SPACE_HAKOIRI.TRIANGLE, true)]
		);
	});
	return answer;
}

namingCategoryClosure = function(p_solver) {
	return function (p_index) {
		const coors1st = p_solver.regions[p_index].spaces[0];
		return "Region " + p_index + " (" + coors1st.x + "," + coors1st.y + ")"; 
	}
}

copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	return commonComparison( 
		[[p_event1.y, p_event1.x, p_event1.symbol, p_event1.choice], [p_event2.y, p_event2.x, p_event2.symbol, p_event2.choice]]);
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var indexList = [];
		var valueList = []; 
		var indexPass;
		var x, y;
		for (var i = 0; i < p_solver.regions.length ; i++) {
			incertain = 0;
			p_solver.regions[i].spaces.forEach(coors => {
				x = coors.x;
				y = coors.y;
				if (p_solver.answerArray[y][x].blocked || p_solver.answerArray[y][x].getValue() != null) {
					incertain++;
				}
			});
			//if (incertain > 0) {
				indexList.push(i); 
				valueList.push(incertain);
			/*
			} else {
				valueList.push(-1); // There MUST be one of these per region.
			}*/
		}
		indexList.sort(function(p_index1, p_index2) {
			const val1 = valueList[p_index1] - valueList[p_index2];
			if (val1 == 0) {
				return p_index1 - p_index2;
			} else {
				return val1;
			}
		});
		return indexList;
	}
}