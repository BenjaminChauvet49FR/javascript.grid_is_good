// Constants
const UNDECIDED_NUMBER = null;
const PASS_CATEGORY = {
	DIAMOND : 1, // Note : no pass on a single fence since it's not really interesting and it hadn't even been implemented.
	CUSTOM : 2
}

// ------------------------
// Setup
SolverFillomino.prototype = Object.create(GeneralSolver.prototype);
SolverFillomino.prototype.constructor = SolverFillomino;

function DummySolver() {	
	return new SolverFillomino([[null]]);
}

function SolverFillomino(p_numberGrid) {
	GeneralSolver.call(this);
	this.construct(p_numberGrid);
}


SolverFillomino.prototype.construct = function(p_numberArray) {
	this.generalConstruct();
	this.xLength = p_numberArray[0].length;
	this.yLength = p_numberArray.length;
	this.answerFencesGrid = new FencesGrid(this.xLength, this.yLength);
	this.clusterFencesManager = new ClusterFencesManager(this.answerFencesGrid); 
	this.answerNumbersArray = [];
	
	this.methodsSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterCompletedClustersClosure(this)]);
	this.methodsSetPass = {
		comparisonMethod : comparison, 
		copyMethod : copying, 
		argumentToLabelMethod : namingCategoryPassClosure(this)
	};
	
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this)
		//skipPassMethod : skipPassClosure(this)
	}; 
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this),
		searchSolutionMethod : searchClosure(this)
	}
	
	this.fixedNumbersArray = [];
	var x, y;
	for (y = 0 ; y < this.yLength ; y++) {
		this.answerNumbersArray.push([]);
		this.fixedNumbersArray.push([]);
		for (x = 0 ; x < this.xLength ; x++) {
			value = p_numberArray[y][x];
			if (value == null) {
				this.answerNumbersArray[y].push(UNDECIDED_NUMBER);
				this.fixedNumbersArray[y].push(false);
			} else {
				this.answerNumbersArray[y].push(value);
				this.clusterFencesManager.createClusterMonospace(x, y); // Will be useful in filter : a space with a number must be clustered no matter what
				this.fixedNumbersArray[y].push(true);
			}
		}
	}
	// Separations between adjacent numbers done in Quickstart. Allows to get rid of correct data assumptions.
	
	this.checkerNewlyAffectedSpacesByFences = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	this.volcanicChecker = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	this.emptyClusterNearNumberChecker = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
}

// ------------------------
// Getters

SolverFillomino.prototype.getNumber = function(p_x, p_y) {
	return this.answerNumbersArray[p_y][p_x];
}

SolverFillomino.prototype.isFixed = function(p_x, p_y) {
	return this.fixedNumbersArray[p_y][p_x];
}

/* Many getters about getting and setting fences defined in the fence grid manager. */

// ------------------------
// Input methods

SolverFillomino.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	this.tryToApplyHypothesisSafe(new FenceEvent(p_x, p_y, DIRECTION.RIGHT, p_state));
}

SolverFillomino.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	this.tryToApplyHypothesisSafe(new FenceEvent(p_x, p_y, DIRECTION.DOWN, p_state));
}

SolverFillomino.prototype.emitHypothesisNumber = function(p_x, p_y, p_number) {
	this.tryToApplyHypothesisSafe(new NumberEvent(p_x, p_y, p_number));	
}

SolverFillomino.prototype.undo = function(){
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverFillomino.prototype.emitPassSpace = function(p_x, p_y, p_number) {
	const listPassNow = this.generateEventsPassDiamondSpace(p_x, p_y, p_number);
	this.passEventsSafe(listPassNow, {category : PASS_CATEGORY.DIAMOND, x : p_x, y : p_y, strength : p_number}); 
}

SolverFillomino.prototype.makeMultiPass = function() {	
	this.multiPassSafe(this.methodsSetMultipass);
}

// In this puzzle, quickstart is vital for the separation of numbers
SolverFillomino.prototype.makeQuickStart = function(p_x, p_y) {
	this.quickStart();
}

SolverFillomino.prototype.makeResolution = function() { 
	this.resolve();
}

SolverFillomino.prototype.emitPassSelection = function(p_selectionSet) {
	const listPassNow = this.answerFencesGrid.getFencePassEventsForSpacesList(p_selectionSet.getSelectedSpacesList(), p_selectionSet.array);
	return this.passEventsSafe(listPassNow, {category : PASS_CATEGORY.CUSTOM, numberSpaces : listPassNow.length});
}

//--------------------------------
// Doing and undoing

// Offensive programming assumption : we assume x and y are consistent.

applyEventClosure = function(p_solver) { 
	return function(p_eventToApply) {
		if (p_eventToApply.kind == FENCE_EVENT_KIND) {
			return p_solver.applyFenceEvent(p_eventToApply.fenceX, p_eventToApply.fenceY, p_eventToApply.direction, p_eventToApply.state);
		} else {
			return p_solver.applyNumberEvent(p_eventToApply.x, p_eventToApply.y, p_eventToApply.number, p_eventToApply.view);
		}
	}
}

undoEventClosure = function(p_solver) { 
	return function(p_eventToUndo) {
		if (p_eventToUndo.kind == FENCE_EVENT_KIND) {
			return p_solver.undoFenceEvent(p_eventToUndo.fenceX, p_eventToUndo.fenceY, p_eventToUndo.direction, p_eventToUndo.state);
		} else {
			return p_solver.undoNumberEvent(p_eventToUndo.x, p_eventToUndo.y, p_eventToUndo.number);
		}
	}
}

SolverFillomino.prototype.applyFenceEvent = function(p_x, p_y, p_dir, p_state) {
	const state = this.answerFencesGrid.getFence(p_x, p_y, p_dir); // Could've been slightly optimized (See Usotatami)
	if (p_state == state) {
		return EVENT_RESULT.HARMLESS;
	} else if (state != FENCE_STATE.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerFencesGrid.setFence(p_x, p_y, p_dir, p_state);
	this.clusterFencesManager.declareFence(p_x, p_y, p_dir, p_state == FENCE_STATE.OPEN);
	this.checkerNewlyAffectedSpacesByFences.add(p_x, p_y);
	this.checkerNewlyAffectedSpacesByFences.add(p_x + DeltaX[p_dir], p_y + DeltaY[p_dir]);
	return EVENT_RESULT.SUCCESS;
}

SolverFillomino.prototype.applyNumberEvent = function(p_x, p_y, p_number) {
	const number = this.answerNumbersArray[p_y][p_x];
	if (p_number == number) {
		return EVENT_RESULT.HARMLESS;
	} else if (number != UNDECIDED_NUMBER) {
		return EVENT_RESULT.FAILURE;
	} 
	this.answerNumbersArray[p_y][p_x] = p_number;
	return EVENT_RESULT.SUCCESS;	
}

SolverFillomino.prototype.undoFenceEvent = function(p_x, p_y, p_dir, p_state) {
	this.clusterFencesManager.declareUndoFence(p_x, p_y, p_dir, p_state == FENCE_STATE.OPEN);
	this.answerFencesGrid.setFence(p_x, p_y, p_dir, FENCE_STATE.UNDECIDED);
}

SolverFillomino.prototype.undoNumberEvent = function(p_x, p_y, p_number) {
	this.answerNumbersArray[p_y][p_x] = UNDECIDED_NUMBER;
}

//-------------------------------- 
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvents = [{quickStartLabel : "Fillomino"}];
		var x, y, number;
		for (y = 0 ; y < p_solver.yLength ; y++) {
			for (x = 0 ; x < p_solver.xLength ; x++) {
				number = p_solver.answerNumbersArray[y][x];
				if (number != UNDECIDED_NUMBER) {
					if (x > 0 && p_solver.answerNumbersArray[y][x-1] != UNDECIDED_NUMBER) {
						listQSEvents.push(new FenceEvent(x, y, DIRECTION.LEFT, number == p_solver.answerNumbersArray[y][x-1] ? FENCE_STATE.OPEN : FENCE_STATE.CLOSED));
					}
					if (y > 0  && p_solver.answerNumbersArray[y-1][x] != UNDECIDED_NUMBER) {
						listQSEvents.push(new FenceEvent(x, y, DIRECTION.UP, number == p_solver.answerNumbersArray[y-1][x] ? FENCE_STATE.OPEN : FENCE_STATE.CLOSED));
					}
					if (number == 1) {
						p_solver.existingNeighborsDirections(x, y).forEach(dir => {
							listQSEvents.push(new FenceEvent(x, y, dir, FENCE_STATE.CLOSED));
						});
					}
				}
			}
		}
		return listQSEvents;
	}
}

//--------------------------------
// Deductions

deductionsClosure = function(p_solver) {
	return function (p_listEventsToApply, p_eventBeingApplied) { 
		var x, y;
		if (p_eventBeingApplied.kind == FENCE_EVENT_KIND) {
			x = p_eventBeingApplied.fenceX;
			y = p_eventBeingApplied.fenceY;
			const dir = p_eventBeingApplied.direction;
			// Forced regionalism
			p_solver.answerFencesGrid.deductionsForceRegionalism(p_listEventsToApply, x, y, dir);
			// Propagation
			if (p_eventBeingApplied.state == FENCE_STATE.OPEN) {
				const dx = x + DeltaX[dir];
				const dy = y + DeltaY[dir];
				if (p_solver.answerNumbersArray[y][x] != UNDECIDED_NUMBER) {					
					p_listEventsToApply.push(new NumberEvent(dx, dy, p_solver.answerNumbersArray[y][x]));
				}
				if (p_solver.answerNumbersArray[dy][dx] != UNDECIDED_NUMBER) {					
					p_listEventsToApply.push(new NumberEvent(x, y, p_solver.answerNumbersArray[dy][dx]));
				}
			} 
		} else {
			x = p_eventBeingApplied.x;
			y = p_eventBeingApplied.y;
			number = p_eventBeingApplied.number;
			var number2;
			// Neighborhood test & propagation
			p_solver.existingNeighborsCoorsDirections(x, y).forEach(coorsDir => {
				number2 = p_solver.answerNumbersArray[coorsDir.y][coorsDir.x];
				if (number2 != UNDECIDED_NUMBER && number2 != number) {
					p_listEventsToApply.push(new FenceEvent(x, y, coorsDir.direction, FENCE_STATE.CLOSED));
				}
				if (number2 == number) {
					p_listEventsToApply.push(new FenceEvent(x, y, coorsDir.direction, FENCE_STATE.OPEN));
				}
				if (p_solver.answerFencesGrid.getFence(x, y, coorsDir.direction) == FENCE_STATE.OPEN) {
					p_listEventsToApply.push(new NumberEvent(coorsDir.x, coorsDir.y, number));
				}
			});
			// Value 1
			if (number == 1) {
				p_solver.existingNeighborsDirections(x, y).forEach(dir => {
					p_listEventsToApply.push(new FenceEvent(x, y, dir, FENCE_STATE.CLOSED));
				});
			}
		}
	}
}

// A special note about filter and QS : this filter WILL be applied during QS : should 2 or more adjacent numbers be together at start, events will be between them. Also, spaces with 1 are handled as well.
// This filter : only checks remaining undecided in regions
// Applied when all fences states are consistent with the numbers inside.
filterCompletedClustersClosure = function(p_solver) {
	return function() {
		var listEventsToApply = [];
		// (re)initialize cluster
		p_solver.clusterFencesManager.reinitializeClusterCheckers();
		var x, y, space, number, unknownFences;
		var emptyClustersNearNumberedClustersSpaces = []; // List of "unknown clusters near numbered clusters"
		for (var i = 0 ; i < p_solver.checkerNewlyAffectedSpacesByFences.list.length ; i++) {
			// If cluster associated to the space hasn't already been checked AND it is fully closed :
			x = p_solver.checkerNewlyAffectedSpacesByFences.list[i].x;
			y = p_solver.checkerNewlyAffectedSpacesByFences.list[i].y;
			if (p_solver.clusterFencesManager.needsToBeCheckedClusterBySpace(x, y)) {
				unknownFences = p_solver.clusterFencesManager.unknownFencesClusterBySpace(x, y);
				// Clusters fully closed
				size = p_solver.clusterFencesManager.sizeClusterBySpace(x, y);
				number = p_solver.answerNumbersArray[y][x];
				if (unknownFences.length == 0) {
					if (number == UNDECIDED_NUMBER) {
						listEventsToApply.push(new NumberEvent(x, y, size));
					} else if (number != size) {
						return FILTER_FAILURE;
					}
				} else { // Anything below is intelligence... but required intelligence if we want somewhat functional passes
					// Cluster with a number
					if (number != UNDECIDED_NUMBER) {
						if (number < size) {
							return FILTER_FAILURE;
						} else if (number == size) {
							unknownFences.forEach(dirCoors => {
								listEventsToApply.push(new FenceEvent(dirCoors.x, dirCoors.y, dirCoors.direction, FENCE_STATE.CLOSED));
							});
						} else {							
							var xMonoExit, yMonoExit;
							var dirMono = null;
							// Force closing of fences that would join two same-numbered clusters and the result would be too big OR that would join the region to a too big region
							unknownFences.forEach(dirCoors => {
								xx = dirCoors.x + DeltaX[dirCoors.direction];
								yy = dirCoors.y + DeltaY[dirCoors.direction];
								/* // CRUCIAL ASSUMPTION : fences in unknownFences are directed towards outside the cluster (x, y is inside)
								if (size + p_solver.clusterFencesManager.sizeClusterBySpaceDefensive(xx, yy) > number) {
									listEventsToApply.push(new FenceEvent(dirCoors.x, dirCoors.y, dirCoors.direction, FENCE_STATE.CLOSED));
								}*/
								// Should also do the "would join two same-numbered clusters" thing.
								emptyClustersNearNumberedClustersSpaces.push({x : xx, y : yy}); // Cluster near the numbered space mustn't be numbered, otherwise space wouldn't be opened
								// Look for mono exit
								if (dirMono != null) {
									if (xMonoExit != xx || yMonoExit != yy) {
										dirMono = -1;
									}
								} else {
									xMonoExit = xx;
									yMonoExit = yy;
									dirMono = dirCoors.direction;
								}
							});
							if (dirMono != null && dirMono != -1) {
								listEventsToApply.push(new FenceEvent(xMonoExit, yMonoExit, OppositeDirection[dirMono], FENCE_STATE.OPEN));		
							}
						}
					} else { // this.answerNumbersArray[y][x] is unknown
						emptyClustersNearNumberedClustersSpaces.push({x : x, y : y});
					}
				}
			}
		}
		
		// For all "empty clusters near a numbered affected cluster" or "affected empty clusters" : 
		// If numbering the clusters would result into a too big cluster, close all fences with relevant numbers (e.g. two clusters of size 2 with 5, and an unnumbered cluster of size 2 : it cannot be numbered to 5 otherwise the cluster would be too big !
		p_solver.emptyClusterNearNumberChecker.clean();
		var nearNumbersBanned;
		var adjacentNumberedSpacesData, xCo, yCo, size;
		var data;
		emptyClustersNearNumberedClustersSpaces.forEach(coorsEmptySpace => {
			xCo = coorsEmptySpace.x;
			yCo = coorsEmptySpace.y;
			nearNumbersBanned = []; // Any number separated from the unnumbered cluster must have fences.
			if (p_solver.emptyClusterNearNumberChecker.add(xCo, yCo)) {
				size = p_solver.clusterFencesManager.sizeClusterBySpaceDefensive(xCo, yCo);
				p_solver.clusterFencesManager.spacesClusterBySpace(xCo, yCo).forEach(coors2 => {
					p_solver.emptyClusterNearNumberChecker.add(coors2.x, coors2.y);
					p_solver.existingNeighborsCoorsDirections(coors2.x, coors2.y).forEach(coors3 => {
						if (p_solver.answerNumbersArray[coors3.y][coors3.x] != UNDECIDED_NUMBER && p_solver.answerFencesGrid.getFence(coors2.x, coors2.y, coors3.direction) == FENCE_STATE.CLOSED) {
							nearNumbersBanned.push(p_solver.answerNumbersArray[coors3.y][coors3.x]);
						}
					});
				});	
				sortUnicityList(nearNumbersBanned, function(a, b) {return a == b}, function(a, b) {return a-b});
				unknownFences = p_solver.clusterFencesManager.unknownFencesClusterBySpaceDefensive(xCo, yCo);
				adjacentNumberedSpacesData = [];
				unknownFences.forEach(coorsDir => {
					x = coorsDir.x;
					y = coorsDir.y;
					dir = coorsDir.direction;
					dx = x + DeltaX[dir];
					dy = y + DeltaY[dir];
					number = p_solver.answerNumbersArray[dy][dx];
					if (number != UNDECIDED_NUMBER) {
						if (nearNumbersBanned.indexOf(number) != -1) {
							listEventsToApply.push(new FenceEvent(x, y, dir, FENCE_STATE.CLOSED)); // another identical number is adjacent to this one
						} else {							
							adjacentNumberedSpacesData.push({
								number : number, 
								realIndex : p_solver.clusterFencesManager.indexClusterBySpace(dx, dy), 
								size : p_solver.clusterFencesManager.sizeClusterBySpace(dx, dy),
								x : x, y : y, direction : dir,
								}); // Here, indexClusterBySpace is defined (thx to the createClusterMonoSpace at the beginning)
						}
					}
				});
				adjacentNumberedSpacesData.sort(function(data1, data2) {
					return commonComparison([data1.number, data1.realIndex, data2.size], [data2.number, data2.realIndex, data1.size]); // Doesn't serve only for solvers ! 
				});
				
				sizeCluster = 0;
				currentNumber = 0;
				firstInfoThisNumber = -1;
				realIndexesThisNumber = []; // realIndex ascending but... this list is supposed to be short 
				// Now, let's close those fences ! Or not.
				var j = 0;
				while (j < adjacentNumberedSpacesData.length) {
					// New "number" among the data
					data = adjacentNumberedSpacesData[j];
					if (data.number != currentNumber) {
						sizeCluster = size + data.size;
						realIndexesThisNumber = [data.realIndex];
						firstInfoThisNumber = j;
						currentNumber = data.number;
					} else {
						if (realIndexesThisNumber.indexOf(data.realIndex) == -1) {							
							sizeCluster += data.size;
							realIndexesThisNumber.push(data.realIndex);
						}
					}
					if (sizeCluster > currentNumber) {
						do {
							j++;
						} while (j < adjacentNumberedSpacesData.length && adjacentNumberedSpacesData[j].number == currentNumber);
						// j-1 = last index with "currentNumber"
						for (k = firstInfoThisNumber ; k < j ; k++) {
							data = adjacentNumberedSpacesData[k];
							listEventsToApply.push(new FenceEvent(data.x, data.y, data.direction, FENCE_STATE.CLOSED));
						}
					} else {						
						j++;
					} 
				}
			}
		});
		p_solver.cleanCheckerFences();
		return listEventsToApply;
	}
}



abortClosure = function(p_solver) {
	return function() {
		p_solver.cleanCheckerFences();
	}
}

SolverFillomino.prototype.cleanCheckerFences = function() {
	this.checkerNewlyAffectedSpacesByFences.clean();
}

// -----------------------
// Passing

function comparison(p_event1, p_event2) {
	const kind1 = (p_event1.kind == FENCE_EVENT_KIND ? 0 : 1);
	const kind2 = (p_event2.kind == FENCE_EVENT_KIND ? 0 : 1);
	if (kind1 == 0 && kind2 == 0) { 
		return standardFenceComparison(p_event1, p_event2);
	} else { 
		return commonComparisonMultiKinds([1], 
		[[p_event1.y, p_event1.x, p_event1.number], [p_event2.y, p_event2.x, p_event2.number]], 
		kind1, kind2);
	}
}

function copying(p_event) {
	if (p_event.kind == FENCE_EVENT_KIND) { 
		return p_event.standardFenceCopy();
	} else {
		return p_event.copy();
	}
}

// 
SolverFillomino.prototype.generateEventsPassDiamondSpace = function(p_x, p_y, p_strength) {
	this.spacesAccessiblesInRangeFromSetSpaces([{x : p_x, y : p_y}], p_strength-1, this.volcanicChecker, function() {return true});
	var peripheralSpaces = [];
	var trd, coi, x, y;
	for (var i = 0 ; i < p_strength ; i++) {
		coi = p_strength - i; // co-i or complement of i
		KnownDirections.forEach(dir => {
			trd = TurningRightDirection[dir];
			x = p_x + i * DeltaX[dir] + coi * DeltaX[trd];
			y = p_y + coi * DeltaY[trd] + i * DeltaY[dir];
			if (this.areCoordinatesInPuzzle(x, y)) {
				peripheralSpaces.push({x : x, y : y}); // Note : this extra layer is NOT added to volcanic checker as it will need to be added below
			}
		});
	}
	// Note : assumption on spacesAccessiblesInRangeFromSetSpaces method above : it must only attack the diamond around
	this.answerFencesGrid.addAccessibleSpacesToSetSpaces(this.volcanicChecker, peripheralSpaces, true);
	
	
	this.volcanicChecker.purifyListForUnicity();
	const unknownFences = this.answerFencesGrid.getUnknownFencesChecker(this.volcanicChecker);
	var listEventsChoice = [];
	unknownFences.forEach(fenceData => {
		listEventsChoice.push([new FenceEvent(fenceData.x, fenceData.y, fenceData.direction, FENCE_STATE.OPEN), new FenceEvent(fenceData.x, fenceData.y, fenceData.direction, FENCE_STATE.CLOSED)])
	});
	return listEventsChoice; 
}

SolverFillomino.prototype.generateEventsPassFence = function(p_x, p_y, p_direction) {
	return [[new FenceEvent(p_x, p_y, p_direction, FENCE_STATE.OPEN), 
			new FenceEvent(p_x, p_y, p_direction, FENCE_STATE.CLOSED)]]
}

namingCategoryPassClosure = function(p_solver) {
	return function(p_indexPass) {
		switch (p_indexPass.category) {
			case PASS_CATEGORY.DIAMOND :
				return "Diamond pass strength (" + p_indexPass.strength + ") " + p_indexPass.x + "," + p_indexPass.y;
			break;
			case PASS_CATEGORY.CUSTOM :
				return "Selection " + p_indexPass.numberSpaces + " space" + (p_indexPass.numberSpaces > 1 ? "s" : "");
			break;
		}
	}
}

function generateEventsForPassClosure(p_solver) {
	return function(p_indexPass) { // Note : remember, it's only relevant for orderedListPassArgumentsClosure.
		switch (p_indexPass.category) {
			case PASS_CATEGORY.DIAMOND :
				return p_solver.generateEventsPassDiamondSpace(p_indexPass.x, p_indexPass.y, p_indexPass.strength);
			break;
		}
	}
}

function orderedListPassArgumentsClosure(p_solver) {
	return function() {		
		var listIndexesPass = [];
		var x, y;
		for (y = 0 ; y < p_solver.yLength; y++) {
			for (x = 0 ; x < p_solver.xLength; x++) {
				listIndexesPass.push({category : PASS_CATEGORY.DIAMOND, x : x, y : y, strength : 1});
			}
		}
		return listIndexesPass;
	}
}

// --------------------
// Resolution

SolverFillomino.prototype.isSolved = function() {
	return this.answerFencesGrid.isComplete(); // Note : could be optimized (see Firumatto)
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
		// Note : puzzle 234 trick
		return searchBestFenceForSolutionSearch(p_solver, p_solver.answerFencesGrid);
	}
}

