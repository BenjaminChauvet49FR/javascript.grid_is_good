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
	this.methodsSetPass = {comparisonMethod : comparison, copyMethod : copying, argumentToLabelMethod : namingCategoryPassClosure(this)};
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
	this.numericSpacesList = []; // For quickstart
	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray();
	this.regions = [];
	this.fixedSpacesArray = [];
	
	var symbol;
	
	// Definition of answerArray
	for (var y = 0; y < this.yLength ; y++) {
		this.answerArray.push([]);
		this.fixedSpacesArray.push([]);
		for (var x = 0 ; x < this.xLength ; x++) {
			if (this.regionArray[y][x] == WALLGRID.OUT_OF_REGIONS) {
				this.answerArray[y].push({blocked : true, value : null});
				this.fixedSpacesArray[y].push(null);
			} else {	
				this.answerArray[y].push(new SpaceNumeric(0, 3));
				symbol = p_symbolsArray[y][x];
				switch(symbol) {
					case (SYMBOL_ID.ROUND) : this.fixedSpacesArray[y].push(SPACE_HAKOIRI.ROUND);  break;
					case (SYMBOL_ID.SQUARE) : this.fixedSpacesArray[y].push(SPACE_HAKOIRI.SQUARE);  break;
					case (SYMBOL_ID.TRIANGLE) : this.fixedSpacesArray[y].push(SPACE_HAKOIRI.TRIANGLE); break;
					default : this.fixedSpacesArray[y].push(null); break;
				}
				if (symbol != null) {
					this.numericSpacesList.push({x : x, y : y});
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
	
	// Sets for each region, after purification
	// Filters for each region (after purification) 
	var notPlacedYet;
	var setupNumericSpaces;
	for(ir = 0 ; ir < this.regionsNumber ; ir++) {
		region = this.regions[ir];
		notPlacedYet = [region.size - 3, 1, 1, 1];
		region.possibilities = new NumericSpacesSetAccountant(notPlacedYet, 0, 3, region.size); // 0, 3 = Min,max
	}	
}

//--------------------------------

// Misc methods (may be used for drawing and intelligence)
// All functions below are coded in offensive programming !
SolverHakoiri.prototype.isBanned = function(p_x, p_y) { 
	return this.regionArray[p_y][p_x] == WALLGRID.OUT_OF_REGIONS;
}

SolverHakoiri.prototype.getFixedShape = function(p_x, p_y) {
	return this.fixedSpacesArray[p_y][p_x];
}

SolverHakoiri.prototype.getVariableShape = function(p_x, p_y) {
	return this.answerArray[p_y][p_x].getValue();
}

SolverHakoiri.prototype.isOpenNotBannedDraw = function(p_x, p_y) {
	return (!this.isBanned(p_x, p_y) && this.answerArray[p_y][p_x].getState(SPACE_HAKOIRI.EMPTY) == SPACE_CHOICE.NO);
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
	if (!this.isBanned(p_x, p_y)) {
		this.tryToApplyHypothesisSafe(new ChoiceEvent(p_x, p_y, p_value, p_ok));
	}
}

SolverHakoiri.prototype.emitPassRegion = function(p_x, p_y) {
	const index = this.regionArray[p_y][p_x]; 
	if (index != WALLGRID.OUT_OF_REGIONS) {
		const listPassNow = this.generateEventsForRegionPass(index);
		this.passEvents(listPassNow, index); 
	}
}

SolverHakoiri.prototype.makeMultiPass = function() {
	return this.multiPassSafe(this.methodsSetMultipass);
}

//--------------------------------

// Doing and undoing
// Offensiveness : x and y valid, space not banned.
applyEventClosure = function(p_solver) {
	return function(p_eventToApply) {
		return p_solver.putNewInSpace(p_eventToApply.x, p_eventToApply.y, p_eventToApply.getSymbol(), p_eventToApply.choice);
	}
}

// Offensive programming : x and y are within bounds (and that's it, block spaces are checked first. Because beware of intrusions... looking at you, 2x2 square checker.)
SolverHakoiri.prototype.putNewInSpace = function(p_x, p_y, p_symbol, p_choice) {
	const resultDo = testNumericSpaceChoice(this.answerArray, p_x, p_y, p_symbol, p_choice);
	if (resultDo != EVENT_RESULT.SUCCESS) {
		return resultDo;
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
		const x = p_eventToUndo.x;
		const y = p_eventToUndo.y;
		const symbol = p_eventToUndo.getSymbol();
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
		var listQSEvents = [{quickStartLabel : "Hakoiri"}];
		var x, y;
		p_solver.numericSpacesList.forEach(coors => {
			x = coors.x;
			y = coors.y;
			if (p_solver.fixedSpacesArray[y][x] != null) { 
				listQSEvents.push(new ChoiceEvent(x, y, p_solver.fixedSpacesArray[y][x], true));
			}
		});
		p_solver.regions.forEach(region => {
			if (region.size == 3) {
				region.spaces.forEach(coors => {
					listQSEvents.push(new ChoiceEvent(coors.x, coors.y, SPACE_HAKOIRI.EMPTY, false));
				});
			}
		});
		return listQSEvents;
	}
}

//--------------------------------

// Exchanges solver and geographical

/**
Transforms a geographical deduction (see dedicated class GeographicalDeduction) into an appropriate event (SolveEvent in our case)
*/
transformClosure = function (p_solver) {
    return function (p_geographicalDeduction) {
		return new ChoiceEvent(p_geographicalDeduction.x, p_geographicalDeduction.y, SPACE_HAKOIRI.EMPTY, p_geographicalDeduction.opening == ADJACENCY.NO);
    } 
};

adjacencyClosure = function (p_solver) {
    return function (p_x, p_y) {
		if (p_solver.regionArray[p_y][p_x] == WALLGRID.OUT_OF_REGIONS) {
			return ADJACENCY.NO;
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
		const symbol = p_eventBeingApplied.getSymbol();
		const region = p_solver.regions[p_solver.regionArray[y][x]];
		if (p_eventBeingApplied.choice) {
			deductionsExcludeOthersNumeric(p_listEventsToApply, p_solver.answerArray, x, y, symbol);
			// Last symbol ? Ban this shape for all other shapes for this region
			deductionsAlertNoneLeftInSpaceSet(p_listEventsToApply, region.possibilities, symbol, region.spaces, p_solver.answerArray);
			// If shape, ban diagonally
			if (symbol != SPACE_HAKOIRI.EMPTY) {
				p_solver.existingNeighborsCoorsWithDiagonals(x, y).forEach(coors => {
					x2 = coors.x;
					y2 = coors.y;
					if (!p_solver.isBanned(x2, y2)) {
						p_listEventsToApply.push(new ChoiceEvent(x2, y2, symbol, false));
					}
				});
			} 
		} else {
			// Only one possibility left in this space ?
			deductionsTestOneLeft(p_listEventsToApply, p_solver.answerArray, x, y);
			// Only one possible place in this region ?
			deductionsAlertRemainingPossibilitiesInSpaceSet(p_listEventsToApply, region.possibilities, symbol, region.spaces, p_solver.answerArray);
			if (symbol == SPACE_HAKOIRI.EMPTY) {
				// Good ol' 2x2 check, although circumstancial (if diagonal contact of 2 identical shapes was allowed or there were a 4th form, it wouldn't apply)
				p_solver.deductionsAlert2x2Areas(p_listEventsToApply, p_solver.methodsSetDeductions, x, y); 
			}
		}
	}
}

// --------------------
// Passes & multipasses

generateEventsForRegionPassClosure = function(p_solver) {
	return function(p_indexPass) {
		return p_solver.generateEventsForRegionPass(p_indexPass);
	}
}

SolverHakoiri.prototype.generateEventsForRegionPass = function(p_indexPass) {
	var listPass = [];
	this.regions[p_indexPass].spaces.forEach(coors => {
		listPass.push(
		[new ChoiceEvent(coors.x, coors.y, SPACE_HAKOIRI.EMPTY, true), 
		new ChoiceEvent(coors.x, coors.y, SPACE_HAKOIRI.ROUND, true),
		new ChoiceEvent(coors.x, coors.y, SPACE_HAKOIRI.SQUARE, true),
		new ChoiceEvent(coors.x, coors.y, SPACE_HAKOIRI.TRIANGLE, true)]
		);
	});
	return listPass;
}

namingCategoryPassClosure = function(p_solver) {
	return function (p_indexPass) {
		const coors1st = p_solver.regions[p_indexPass].spaces[0];
		return "Region " + p_indexPass + " (" + coors1st.x + "," + coors1st.y + ")"; 
	}
}

copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	return commonComparison( 
		[[p_event1.y, p_event1.x, p_event1.getSymbol(), p_event1.choice], [p_event2.y, p_event2.x, p_event2.getSymbol(), p_event2.choice]]);
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var listIndexesPass = [];
		var valueList = []; 
		var indexPass;
		var x, y;
		for (var i = 0; i < p_solver.regions.length ; i++) {
			uncertain = 0;
			p_solver.regions[i].spaces.forEach(coors => {
				x = coors.x;
				y = coors.y;
				if (p_solver.answerArray[y][x].getValue() != null) {
					uncertain++;
				}
			});
			//if (uncertain > 0) {
				listIndexesPass.push(i); 
				valueList.push(uncertain);
			/*
			} else {
				valueList.push(-1); // There MUST be one of these per region.
			}*/
		}
		listIndexesPass.sort(function(p_index1, p_index2) {
			const val1 = valueList[p_index1] - valueList[p_index2];
			if (val1 == 0) {
				return p_index1 - p_index2;
			} else {
				return val1;
			}
		});
		return listIndexesPass;
	}
}