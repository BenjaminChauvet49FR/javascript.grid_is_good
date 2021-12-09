function SolverUsoone(p_wallArray, p_numberArray) {
    this.construct(p_wallArray, p_numberArray);
} //TODO : faire les annulations de "truth" plus comprendre ce qui se passe dans le coin supérieur droit du 26

SolverUsoone.prototype = Object.create(GeneralSolver.prototype);
SolverUsoone.prototype.constructor = SolverUsoone;

function DummySolver() {
	return new SolverUsoone(generateWallArray(1, 1), [[null]]);
}

SolverUsoone.prototype.construct = function (p_wallArray, p_numberArray) {
	this.generalConstruct();
    this.xLength = p_numberArray[0].length;
    this.yLength = p_numberArray.length;
    
    var ix, iy;

	this.makeItGeographical(this.xLength, this.yLength, new ApplyEventMethodGeographicalPack(
			applyEventClosure(this), 
			deductionsClosure(this), 
			adjacencyClosure(this), 
			transformClosure(this), 
			undoEventClosure(this)));
	
	this.methodsSetPass = {comparisonMethod : comparison, copyMethod : copying, argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsSetMultiPass = {
		generatePassEventsMethod : generateEventsForNumbersSetsClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
	};
	this.gridWall = WallGrid_data(p_wallArray); 
	const regionArray = this.gridWall.toRegionArray(); // Unlike in most region-divided puzzles, no need to save region array.
	this.numbersSetsNumber = numberOfRegions(regionArray);
	this.numbersSets = [];
	for (var i = 0 ; i < this.numbersSetsNumber ; i++) {
		this.numbersSets.push({
			coors : [],
			notPlacedFalseYet : 1,
			notPlacedTrueYet : -1 // part of setup
		});
	}
	
	// The classic "array that contains either numbers or list of adjacent coordinates with numbers". 
	// Also, sets up the sets of numbers that are in the same region (which is the only utility of regions in Usoone to be fair)
	this.numberManagementArray = [];
	this.numberCoorsList = [];
	this.answerArray = generateValueArray(this.xLength, this.yLength, ADJACENCY.UNDECIDED);
	for (iy = 0 ; iy < this.yLength ; iy++) {
		this.numberManagementArray.push([]);
		for (ix = 0 ; ix < this.xLength ; ix++) {
			if (p_numberArray[iy][ix] == null) {				
				this.numberManagementArray[iy].push({
					value : null,
					valuedNeighborsCoors : []
				});
			} else {
				var ir = regionArray[iy][ix];
				this.numberManagementArray[iy].push({
					value : p_numberArray[iy][ix],
					adjacentUndecideds : 0, // Part of setup
					adjacentCloseds : 0,
					truth : USOONE.UNDECIDED,
					index : ir
				});
				this.numberCoorsList.push({x : ix, y : iy});
				this.answerArray[iy][ix] = ADJACENCY.YES;
				this.numbersSets[ir].coors.push({x : ix, y : iy});
				this.numbersSets[ir].notPlacedTrueYet++;
			}
		}
	}
	
	this.numberCoorsList.forEach(coors => {
		ix = coors.x;
		iy = coors.y;
		this.existingNeighborsCoorsDirections(ix, iy).forEach(coorsAround => {
			x = coorsAround.x;
			y = coorsAround.y;
			if (this.getNumber(x, y) == null) {
				this.numberManagementArray[iy][ix].adjacentUndecideds++
				this.numberManagementArray[y][x].valuedNeighborsCoors.push({x : ix, y : iy});
			} 
		});
	});
	this.declarationsOpenAndClosed();
}

SolverUsoone.prototype.getAnswer = function (p_x, p_y) {
    return this.answerArray[p_y][p_x];
}

SolverUsoone.prototype.getNumber = function (p_x, p_y) {
    return this.numberManagementArray[p_y][p_x].value;
}

// Can be used even on non-numeric spaces
SolverUsoone.prototype.getTruth = function(p_x, p_y) {
	if (this.numberManagementArray[p_y][p_x].value == null) {
		return USOONE.UNDECIDED;
	} else {
		return this.numberManagementArray[p_y][p_x].truth;
	}
}

//--------------------------------

SolverUsoone.prototype.emitHypothesis = function (p_x, p_y, p_symbol) {
    this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_symbol));
}

SolverUsoone.prototype.quickStart = function () {
	this.initiateQuickStart();
	var x, y, numberMgmt;
    this.numbersSets.forEach(numberSet => {
        if (numberSet.coors.length == 1) {
			x = numberSet.coors[0].x; 
			y = numberSet.coors[0].y;
			this.tryToApplyHypothesis(new TruthEvent(x, y, USOONE.LIE));
        } else {
			numberSet.coors.forEach(myCoors => {
				x = myCoors.x; 
				y = myCoors.y;
				if (notEnoughSurroundingUndecidedToMeet(this.numberManagementArray[y][x])) {							
					this.tryToApplyHypothesis(new TruthEvent(x, y, USOONE.LIE));
				}
				if (this.numberManagementArray[y][x].value == 0 && this.numberManagementArray[y][x].adjacentUndecideds == 0 && this.numberManagementArray[y][x].adjacentCloseds == 0) {
					this.tryToApplyHypothesis(new TruthEvent(x, y, USOONE.TRUTH)); // Puzzle 26 : a 0 is fully surrounded by numbered spaces and should then be labelled true for QS.
				}
			});
		}
    });
	this.terminateQuickStart();
}

SolverUsoone.prototype.emitPass = function(p_x, p_y) {
	if (this.getNumber(p_x, p_y) != null) {
		const index = this.numberManagementArray[p_y][p_x].index;
		const generatedEvents = this.generateEventsForNumbersSets(index);
		this.passEvents(generatedEvents, index); 
	}
}

SolverUsoone.prototype.makeMultiPass = function() {	
	this.multiPass(this.methodsSetMultiPass);
}

SolverUsoone.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

//--------------------------------

// Doing, undoing and transforming
SolverUsoone.prototype.putNew = function (p_x, p_y, p_symbol) {
    if (this.answerArray[p_y][p_x] == p_symbol) {
        return EVENT_RESULT.HARMLESS;
    }
    if (this.answerArray[p_y][p_x] != ADJACENCY.UNDECIDED) {
        return EVENT_RESULT.FAILURE;
    }
    this.answerArray[p_y][p_x] = p_symbol;
	if (p_symbol == ADJACENCY.NO) {
		this.numberManagementArray[p_y][p_x].valuedNeighborsCoors.forEach(coors => {
			this.numberManagementArray[coors.y][coors.x].adjacentCloseds++;
			this.numberManagementArray[coors.y][coors.x].adjacentUndecideds--;
		});
	} else {
		this.numberManagementArray[p_y][p_x].valuedNeighborsCoors.forEach(coors => {
			this.numberManagementArray[coors.y][coors.x].adjacentUndecideds--;
		});
	}
    return EVENT_RESULT.SUCCESS;
}

// Offensive programming
SolverUsoone.prototype.putTruth = function(p_x, p_y, p_truth) {
	if (this.numberManagementArray[p_y][p_x].truth == p_truth) {
        return EVENT_RESULT.HARMLESS;
    }
    if (this.numberManagementArray[p_y][p_x].truth != USOONE.UNDECIDED) {
        return EVENT_RESULT.FAILURE;
    }
	var is = this.numberManagementArray[p_y][p_x].index;
	if (p_truth == USOONE.TRUTH) {
		this.numbersSets[is].notPlacedTrueYet--;
	} else {
		this.numbersSets[is].notPlacedFalseYet--;
	}
    this.numberManagementArray[p_y][p_x].truth = p_truth;
	return EVENT_RESULT.SUCCESS; // Note : if forgot, it isn't saved after deductions are done and cannot therefore be undone.
}

applyEventClosure = function(p_solver) {
	return function(eventToApply) {
		if (isSpaceEvent(eventToApply)) {			
			return p_solver.putNew(eventToApply.x(), eventToApply.y(), eventToApply.symbol);
		} else {
			return p_solver.putTruth(eventToApply.x, eventToApply.y, eventToApply.truth);
		}
	}
}

undoEventClosure = function(p_solver) {
	return function (p_eventToApply) {
		if (isSpaceEvent(p_eventToApply)) {
			const x = p_eventToApply.x(); // x() and not x !
			const y = p_eventToApply.y();
			const symbol = p_eventToApply.symbol;
			p_solver.answerArray[y][x] = ADJACENCY.UNDECIDED;
			if (symbol == ADJACENCY.NO) {
				p_solver.numberManagementArray[y][x].valuedNeighborsCoors.forEach(coors => {
					p_solver.numberManagementArray[coors.y][coors.x].adjacentCloseds--;
					p_solver.numberManagementArray[coors.y][coors.x].adjacentUndecideds++;
				});
			} else {
				p_solver.numberManagementArray[y][x].valuedNeighborsCoors.forEach(coors => {
					p_solver.numberManagementArray[coors.y][coors.x].adjacentUndecideds++;
				});
			}
		} else {
			const x = p_eventToApply.x;
			const y = p_eventToApply.y;
			const truth = p_eventToApply.truth;
			p_solver.numberManagementArray[y][x].truth = USOONE.UNDECIDED;
			var is = p_solver.numberManagementArray[y][x].index;
			if (truth == USOONE.TRUTH) {
				p_solver.numbersSets[is].notPlacedTrueYet++;
			} else {
				p_solver.numbersSets[is].notPlacedFalseYet++;
			}
		}
	}
}

//--------------------------------
// Exchanges solver and geographical

adjacencyClosure = function(p_solver) {
    return function (p_x, p_y) {
        return p_solver.answerArray[p_y][p_x];
    }
};

transformClosure = function (p_solver) {
    return function (p_geographicalDeduction) {
		return new SpaceEvent(p_geographicalDeduction.x, p_geographicalDeduction.y, p_geographicalDeduction.opening);
    }
};

//--------------------------------
// Intelligence
deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		var x, y, symbol, xx, yy; // Well, I forgot these once so other values of x and y seemed to be taken
		if (isSpaceEvent(p_eventBeingApplied)) {
			x = p_eventBeingApplied.x();
			y = p_eventBeingApplied.y();
			symbol = p_eventBeingApplied.symbol;
			// Deduction time !
			if (symbol == ADJACENCY.NO) { // Closed space
				var numbMgmtAround;
				p_solver.existingNeighborsCoorsDirections(x, y).forEach(coors => {
					xx = coors.x;
					yy = coors.y;
					numbMgmtAround = p_solver.numberManagementArray[yy][xx];
					if (numbMgmtAround.value == null) {
						p_listEventsToApply.push(new SpaceEvent(xx, yy, ADJACENCY.YES));						
					} else {
						if (tooManySurroundingCloseds(numbMgmtAround)) {							
							p_listEventsToApply.push(new TruthEvent(xx, yy, USOONE.LIE));
						} else {
							p_listEventsToApply = p_solver.deductionsDeclareSpaceTrue(p_listEventsToApply, xx, yy, numbMgmtAround);
							numbMgmtAround = p_solver.numberManagementArray[yy][xx];
							if (numbMgmtAround.truth == USOONE.TRUTH && allClosedSpacesAroundPlaced(numbMgmtAround)) {
								p_listEventsToApply = p_solver.deductionsFillingSurroundingsUsoone(p_listEventsToApply, xx, yy, ADJACENCY.YES);
							} else if (numbMgmtAround.truth == USOONE.LIE && p_solver.numberManagementArray[yy][xx].adjacentUndecideds == 1) {
								p_listEventsToApply = p_solver.deductionsSolveSurroundingsLyingSpace(p_listEventsToApply, xx, yy);
							}
						}
					}
				});
			} else { // Open space
				p_solver.existingNeighborsCoorsDirections(x, y).forEach(coors => {
					xx = coors.x;
					yy = coors.y;
					numbMgmtAround = p_solver.numberManagementArray[yy][xx];
					if (numbMgmtAround.value != null) {
						if (notEnoughSurroundingUndecidedToMeet(numbMgmtAround)) {							
							p_listEventsToApply.push(new TruthEvent(xx, yy, USOONE.LIE));
						} else {							
							p_listEventsToApply = p_solver.deductionsDeclareSpaceTrue(p_listEventsToApply, xx, yy, numbMgmtAround);
							if (numbMgmtAround.truth == USOONE.TRUTH && allOpenSpacesAroundPlaced(numbMgmtAround)) {
								p_listEventsToApply = p_solver.deductionsFillingSurroundingsUsoone(p_listEventsToApply, xx, yy, ADJACENCY.NO);
							} else if (numbMgmtAround.truth == USOONE.LIE && p_solver.numberManagementArray[yy][xx].adjacentUndecideds == 1) {
								p_listEventsToApply = p_solver.deductionsSolveSurroundingsLyingSpace(p_listEventsToApply, xx, yy);
							}
						}
					}
				});
			}
		} else { // Truth event
			x = p_eventBeingApplied.x;
			y = p_eventBeingApplied.y;
			var t = p_eventBeingApplied.truth;
			var numbMgmt = p_solver.numberManagementArray[y][x];
			var numbersSet = p_solver.numbersSets[numbMgmt.index];
			if (t == USOONE.TRUTH) {
				if (numbersSet.notPlacedTrueYet == 0) { // One lying space per region
					p_listEventsToApply = p_solver.deductionsFillingNumbersSet(p_listEventsToApply, numbersSet, USOONE.LIE);
				}
				if (notEnoughSurroundingUndecidedToMeet(numbMgmt) || tooManySurroundingCloseds(numbMgmt)) {
					p_listEventsToApply.push(new FailureEvent()); // Failure !
				}
				// Let's fill with what's missing !
				if (allClosedSpacesAroundPlaced(numbMgmt)) { 
					p_listEventsToApply = p_solver.deductionsFillingSurroundingsUsoone(p_listEventsToApply, x, y, ADJACENCY.YES);
				}
				if (allOpenSpacesAroundPlaced(numbMgmt)) {
					p_listEventsToApply = p_solver.deductionsFillingSurroundingsUsoone(p_listEventsToApply, x, y, ADJACENCY.NO);
				}
			} else if (t == USOONE.LIE) {
				if (numbersSet.notPlacedFalseYet == 0) { // One lying space per region
					p_listEventsToApply = p_solver.deductionsFillingNumbersSet(p_listEventsToApply, numbersSet, USOONE.TRUTH);
				}
				if (numbMgmt.adjacentUndecideds == 0 && allClosedSpacesAroundPlaced(numbMgmt)) { // Failure !
					p_listEventsToApply.push(new FailureEvent()); 
				}
				// Let's solve the fakes !
				if (numbMgmt.adjacentUndecideds == 1) {
					p_listEventsToApply = p_solver.deductionsSolveSurroundingsLyingSpace(p_listEventsToApply, x, y);
				}
			}
		}
		return p_listEventsToApply
	}	
}

SolverUsoone.prototype.deductionsDeclareSpaceTrue = function(p_listEventsToApply, p_x, p_y, p_numberMgmtAround) {
	if ((p_numberMgmtAround.value == p_numberMgmtAround.adjacentCloseds) && p_numberMgmtAround.adjacentUndecideds == 0) {
		p_listEventsToApply.push(new TruthEvent(p_x, p_y, USOONE.TRUTH));
	}
	return p_listEventsToApply;
}

// Closures required instead of "this" since functions are defined here !
function closureSpaceTruth (p_solver) { return function(p_x, p_y) {return p_solver.numberManagementArray[p_y][p_x].truth} };
function closureSpaceSpace (p_solver) { return function(p_x, p_y) {return p_solver.answerArray[p_y][p_x]} };
// These closures that don't use solver are optionnal but comfortable
function closureEventTruth (p_truth) { return function(p_x, p_y) { return new TruthEvent(p_x, p_y, p_truth)}} ;
function closureEventSpace (p_adjacency) { return function(p_x, p_y) { return new SpaceEvent(p_x, p_y, p_adjacency)}} ;

SolverUsoone.prototype.deductionsFillingNumbersSet = function(p_listEventsToApply, p_numbersSet, p_value) {
	return this.fillingSetSpaceDeductions(p_listEventsToApply, p_numbersSet.coors, closureSpaceTruth(this), USOONE.UNDECIDED, closureEventTruth(p_value));
}

SolverUsoone.prototype.deductionsFillingSurroundingsUsoone = function(p_listEventsToApply, p_x, p_y, p_value) {
	return this.deductionsFillingSurroundings(p_listEventsToApply, p_x, p_y, closureSpaceSpace(this), ADJACENCY.UNDECIDED, closureEventSpace(p_value));
}

// Note : space p_x, p_y must contain a lying indication and has one space left to fill. 
SolverUsoone.prototype.deductionsSolveSurroundingsLyingSpace = function(p_listEventsToApply, p_x, p_y) {
	const numb = this.numberManagementArray[p_y][p_x].value;
	const closeds = this.numberManagementArray[p_y][p_x].adjacentCloseds;
	if (numb == closeds + 1) {
		p_listEventsToApply = this.deductionsFillingSurroundings(p_listEventsToApply, p_x, p_y, closureSpaceSpace(this), ADJACENCY.UNDECIDED, closureEventSpace(ADJACENCY.YES));
	} else if (numb == closeds) {
		p_listEventsToApply = this.deductionsFillingSurroundings(p_listEventsToApply, p_x, p_y, closureSpaceSpace(this), ADJACENCY.UNDECIDED, closureEventSpace(ADJACENCY.NO));
	}
	return p_listEventsToApply;
}

// Methods useful for deductions
function tooManySurroundingCloseds(p_numberManagementSpace) {
	return p_numberManagementSpace.adjacentCloseds > p_numberManagementSpace.value;
}

function notEnoughSurroundingUndecidedToMeet(p_numberManagementSpace) {
	return p_numberManagementSpace.value - p_numberManagementSpace.adjacentCloseds > p_numberManagementSpace.adjacentUndecideds
}

function allClosedSpacesAroundPlaced(p_numberManagementSpace) {
	return p_numberManagementSpace.adjacentCloseds == p_numberManagementSpace.value
}

function allOpenSpacesAroundPlaced(p_numberManagementSpace) {
	return p_numberManagementSpace.adjacentUndecideds + p_numberManagementSpace.adjacentCloseds == p_numberManagementSpace.value
}

//--------------------------------
// Pass & multipass

copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	const kind1 = (isSpaceEvent(p_event1) ? 1 : 0);
	const kind2 = (isSpaceEvent(p_event2) ? 1 : 0);
	return commonComparisonMultiKinds([0, 1], 
	[[p_event1.y, p_event1.x, p_event1.truth], [p_event2.y, p_event2.x, p_event2.truth], [p_event1.coorY, p_event1.coorX, p_event1.symbol], [p_event2.coorY, p_event2.coorX, p_event2.symbol]], 
	kind1, kind2);
}

namingCategoryClosure = function(p_solver) {
	return function (p_index) {
		const firstSpaceCoors = p_solver.numbersSets[p_index].coors[0];
		return "Region " + p_index + " (" + firstSpaceCoors.x + "," + firstSpaceCoors.y + ")"; 
	}
}

generateEventsForNumbersSetsClosure = function(p_solver) {
	return function(p_index) {
		return p_solver.generateEventsForNumbersSets(p_index);
	}
}

SolverUsoone.prototype.generateEventsForNumbersSets = function(p_index) {
	var spaceCoorsX = [];
	var spaceCoorsY = [];
	var x, y;
	this.numbersSets[p_index].coors.forEach(myCoors => {
		this.existingNeighborsCoorsDirections(myCoors.x, myCoors.y).forEach(coorsAround => {
			x = coorsAround.x;
			y = coorsAround.y;
			spaceCoorsX.push(coorsAround.x);
			spaceCoorsY.push(coorsAround.y); // Note : greedy algorithm : ALL spaces around are added, even already open ones, and spaces can be added several times !
		});
	});
	var answer = [];
	for (var i = 0 ; i < spaceCoorsX.length ; i++) {		
		answer.push([new SpaceEvent(spaceCoorsX[i], spaceCoorsY[i], ADJACENCY.NO), new SpaceEvent(spaceCoorsX[i], spaceCoorsY[i], ADJACENCY.YES)]);
	}
	return answer;
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		answer = [];
		for (var i = 0 ; i < p_solver.numbersSetsNumber ; i++) {
			answer.push(i);
		}
		return answer;
	}
}