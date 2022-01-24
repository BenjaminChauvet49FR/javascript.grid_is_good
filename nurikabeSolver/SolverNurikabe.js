const NURIKABE_UNINCLUDED = -1;
const NURIKABE_SEA = -2;
const NURIKABE_LAND = -3;
const NURIKABE_UNDECIDED = -4;

// Initialization

function SolverNurikabe(p_numericXArray) {
	GeneralSolver.call(this);
	this.construct(p_numericXArray);
}

SolverNurikabe.prototype = Object.create(GeneralSolver.prototype);
SolverNurikabe.prototype.constructor = SolverNurikabe;

function DummySolver() {
	return new SolverNurikabe(generateSymbolArray(1, 1));
}

SolverNurikabe.prototype.construct = function(p_numericXArray) {
	this.generalConstruct();
	this.xLength = p_numericXArray[0].length;
	this.yLength = p_numericXArray.length;
	this.makeItGeographical(this.xLength, this.yLength, new ApplyEventMethodGeographicalPack( 
		applyEventClosure(this),
		deductionsClosure(this),
		adjacencyClosure(this),
		transformClosure(this),
		undoEventClosure(this)
	));
	this.methodsSetPass = {comparisonMethod : comparison, copyMethod : copying, argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsSetMultipass = {generatePassEventsMethod : generateEventsForIslandPassClosure(this), orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
	skipPassMethod : skipPassClosure(this) };
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this),
		searchSolutionMethod : searchClosure(this),
		isSolvedMethod : isSolvedClosure(this)
	}

	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterBorderingNewlyExpandedIslandClosure(this), filterAffectedIslandSpacesClosure(this)]);
	
	//this.answerArray = [];
	this.islandGrid = Grid_data(p_numericXArray);
	this.clusterManager = new ClusterManager(this.xLength, this.yLength);
	this.islandList = [];
	this.numericSpacesList = []; // public for drawing.
	//this.inclusionArray = generateValueArray(this.xLength, this.yLength, NURIKABE_UNINCLUDED);
	this.accessibleIslandsArray = generateFunctionValueArray(this.xLength, this.yLength, function(p_x, p_y) {return [NURIKABE_SEA];});
	
	var ix,iy;
	// Initialize answerArray purified
	for(iy = 0 ; iy < this.yLength ; iy++) {
		for(ix = 0 ; ix < this.xLength ; ix++) {
			if (this.islandGrid.get(ix, iy) != null) {
				//this.answerArray[iy].push(ADJACENCY.NO);
				this.clusterManager.add(ix, iy);
				const number = this.islandGrid.get(ix, iy);
				const previousLength = this.islandList.length;
				this.islandList.push({
					index : previousLength,
					number : number,
					capitalX : ix,
					capitalY : iy,
					notIncludedYet : number, 
					notExcludedYet : 0,
					accessibleSpaces : [],
					spacesIncluded : []
				}); 
				this.numericSpacesList.push({x : ix, y : iy});
			} else {
				// Nothing now
			}
		}
	}
	this.checkerNewlyExpandedIslands = new CheckCollection(this.islandList.length);
	this.checkerPotentiallyNewlyAffectedIslandAndSwimmingSpaces = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	this.actualClosedIndexes = new CheckCollection(this.xLength * this.yLength / 2 + 1); // number of most pessimistic estimation of the potential clusters
	
	this.volcanicChecker = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	this.guardedSpacesArray = generateFunctionValueArray(this.xLength, this.yLength, function(){return []});
	this.islandList.forEach(island => {
		this.existingNeighborsCoors(island.capitalX, island.capitalY).forEach(coors => {
			this.guardedSpacesArray[coors.y][coors.x].push(island.index);
		});
	});
	this.islandList.forEach(island => {
		island.accessibleSpaces = this.spacesAccessiblesInRangeFromSetSpaces([{x : island.capitalX, y : island.capitalY}], 
			island.number-1, this.volcanicChecker, notBordedByIndexClosure(this, island.index));
		island.accessibleSpaces.forEach(coors => {
			this.accessibleIslandsArray[coors.y][coors.x].push(island.index);
		});
		island.notExcludedYet = island.accessibleSpaces.length - island.notIncludedYet;
	});
	
	this.islandListSortedIndexes = numericSequenceArray(0, this.islandList.length-1);
	this.islandListSortedIndexes.sort(leastAccessibleSpacesFirstClosure(this));
	
	// Generate the choice array that will be used a lot. 
	this.answerChoiceArray = generateFunctionValueArray(this.xLength, this.yLength, closurePossibilities(this.accessibleIslandsArray));	
	this.islandList.forEach(island => {
		ix = island.capitalX;
		iy = island.capitalY;
		this.answerChoiceArray[iy][ix].ban(NURIKABE_SEA);
		this.answerChoiceArray[iy][ix].choose(island.index);
		island.spacesIncluded.push({x : ix, y : iy});
		island.notIncludedYet--; // Note : not optimized with spacesIncluded but it was added later !
	});

	this.arbitrarySkipPassThreshold = Math.sqrt(this.xLength * this.yLength) / 2;

	// Note : add strategies for troll puzzles such as 1030
	
	this.declarationsOpenAndClosed();
}

function notBordedByIndexClosure(p_solver, p_index) {
	return function(p_x, p_y) {
		guardedSpaces = p_solver.guardedSpacesArray[p_y][p_x];
		return (guardedSpaces.length == 0 || (guardedSpaces.length == 1 && (guardedSpaces[0] == p_index)));
	}
}

// Note : if not efficient enough, don't forget the possibility of passing all 'possible spaces'
// One week later, it appears not to be efficient enough ;)

function closurePossibilities(p_possibilitiesArray) {
	return function(p_x, p_y) {
		return new SpaceNumericSelect(p_possibilitiesArray[p_y][p_x])
	}
}

function leastAccessibleSpacesFirstClosure(p_solver) {
	return function(ia, ib) {
		const diff = p_solver.islandList[ia].accessibleSpaces.length - p_solver.islandList[ib].accessibleSpaces.length;
		return (diff != 0 ? diff : (ia-ib));
	}
}

//--------------------------------
// Getters (drawer and intelligence)

SolverNurikabe.prototype.getAnswer = function(p_x, p_y) {
	if (this.getNumber(p_x, p_y) != null) {
		return NURIKABE_LAND;
	}
	switch (this.answerChoiceArray[p_y][p_x].getState(NURIKABE_SEA)) {
		case SPACE_CHOICE.YES : return NURIKABE_SEA; break;
		case SPACE_CHOICE.NO : return NURIKABE_LAND; break;
		default : return NURIKABE_UNDECIDED; break;
	}
}

SolverNurikabe.prototype.getNumber = function(p_x, p_y) {
	return this.islandGrid.get(p_x, p_y);
}

function canGoThereClosure(p_solver, p_islandIndex) {
	return function(p_x, p_y) {
		return p_solver.answerChoiceArray[p_y][p_x].getState(p_islandIndex) != SPACE_CHOICE.NO;
	}
}

//--------------------------------

// Input methods
SolverNurikabe.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	if (!this.islandGrid.get(p_x, p_y)) {
		this.tryToApplyHypothesis(new ChoiceEvent(p_x, p_y, NURIKABE_SEA, p_symbol));
	}
}

SolverNurikabe.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverNurikabe.prototype.makeQuickStart = function() {
	this.quickStart();
}

SolverNurikabe.prototype.emitPassSpace = function(p_x, p_y) {
	if (this.islandGrid.get(p_x, p_y) != null) {		
		const ixi = this.answerChoiceArray[p_y][p_x].getOneLeft();
		const generatedEvents = this.generateEventsIslandPass(ixi); 
		this.passEvents(generatedEvents, ixi); 
	}
}

SolverNurikabe.prototype.makeMultiPass = function() {
	this.multiPass(this.methodsSetMultipass);
}

SolverNurikabe.prototype.makePurge = function() {
	this.applyGlobalDeduction(banInaccessibleIslandsClosure(this), this.methodsSetDeductions, "Purge distant spaces");
}

SolverNurikabe.prototype.makeResolution = function() { 
	this.resolve();
}

//--------------------------------
// Doing, undoing and transforming

// Offensive programming : the coordinates are assumed to be in limits
applyEventClosure = function(p_solver) {
	return function(p_eventToApply) {
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		const index = p_eventToApply.index;
		const choice = p_eventToApply.choice;
		
		const currentIndex = p_solver.answerChoiceArray[y][x].getValue(); 
		if (choice && (currentIndex != null) && (index != currentIndex)) {
			return EVENT_RESULT.FAILURE;
		}
		const currentState = (p_solver.answerChoiceArray[y][x].getState(index));
		if (currentState == SPACE_CHOICE.YES) {
			return choice ? EVENT_RESULT.HARMLESS : EVENT_RESULT.FAILURE;
		} else if (currentState == SPACE_CHOICE.NO) {
			return choice ? EVENT_RESULT.FAILURE : EVENT_RESULT.HARMLESS;
		} 
		if (index == NURIKABE_SEA) {
			if (choice) {
				p_solver.answerChoiceArray[y][x].choose(NURIKABE_SEA);
				p_solver.clusterManager.ban(x, y);	
				p_solver.existingNeighborsCoors(x, y).forEach(coors => {	
					p_solver.checkerPotentiallyNewlyAffectedIslandAndSwimmingSpaces.add(coors.x, coors.y);
				});				
			} else {
				p_solver.answerChoiceArray[y][x].ban(NURIKABE_SEA);
				p_solver.clusterManager.add(x, y);	
				p_solver.checkerPotentiallyNewlyAffectedIslandAndSwimmingSpaces.add(x, y);
			}
		} else {
			// WARNING : possibilities of return below !
			var island = p_solver.islandList[index];
			if (choice) {
				if (island.notIncludedYet == 0) {
					return EVENT_RESULT.FAILURE;
				}
				p_solver.answerChoiceArray[y][x].choose(index);
				island.notIncludedYet--;	
				island.spacesIncluded.push({x : x, y : y});
				p_solver.checkerNewlyExpandedIslands.add(index);
			} else {
				if (island.notExcludedYet == 0) {
					return EVENT_RESULT.FAILURE;
				}
				p_solver.answerChoiceArray[y][x].ban(index);
				island.notExcludedYet--;
			}
		}
		return EVENT_RESULT.SUCCESS;
	}
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		const x = p_eventToUndo.x;
		const y = p_eventToUndo.y;
		const index = p_eventToUndo.index;
		
		if (index == NURIKABE_SEA) {
			p_solver.clusterManager.undo(x, y);	
			if (p_eventToUndo.choice) {
				p_solver.answerChoiceArray[y][x].unchoose(NURIKABE_SEA);
			} else {
				p_solver.answerChoiceArray[y][x].unban(NURIKABE_SEA);
			}
		} else {
			if (p_eventToUndo.choice) {
				p_solver.answerChoiceArray[y][x].unchoose(index);
				p_solver.islandList[index].notIncludedYet++;	
				p_solver.islandList[index].spacesIncluded.pop();
			} else {
				p_solver.answerChoiceArray[y][x].unban(index);
				p_solver.islandList[index].notExcludedYet++;
			}
		}
	}
}

//--------------------------------
// Exchanges solver and geographical

/**
Transforms a geographical deduction (see dedicated class GeographicalDeduction) into an appropriate event (SpaceEvent in our case)
*/
transformClosure = function (p_solver) {
    return function (p_geographicalDeduction) {
		return new ChoiceEvent(p_geographicalDeduction.x, p_geographicalDeduction.y, NURIKABE_SEA, p_geographicalDeduction.opening == ADJACENCY.YES);
    }
};

adjacencyClosure = function (p_solver) {
    return function (p_x, p_y) {
		switch (p_solver.answerChoiceArray[p_y][p_x].getState(NURIKABE_SEA)) {
			case SPACE_CHOICE.YES : return ADJACENCY.YES; break;
			case SPACE_CHOICE.NO : return ADJACENCY.NO; break;
			default : return ADJACENCY.UNDECIDED; break;
        }
    }
}

//-------------------------------- 
// Quickstart !

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvts = [{quickStartLabel : "Nurikabe"}];
		
		// Necessity (spaces adjacent to 2 or more islands OR to a 1-sized island that wouldn't have expanded)
		// It declares all islands are non-sea spaces
		// It surrounders by sea islands of size 1
		// Smartness : if the number of accessible spaces equals the capacity of the island, declare them islands
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			for (var x = 0 ; x < p_solver.xLength ; x++) {
				singleIndex = p_solver.answerChoiceArray[y][x].getSingleValue(); 
				if (singleIndex != null) {
					listQSEvts.push(new ChoiceEvent(x, y, singleIndex ,true));
				}
			}
		}
		p_solver.islandList.forEach(island => {
			if (island.number == island.accessibleSpaces.length) {
				island.accessibleSpaces.forEach(coors => {
					listQSEvts.push(new ChoiceEvent(coors.x, coors.y, NURIKABE_SEA, false));
				});
			}
		});
		return listQSEvts;
	}
}

//--------------------------------
// Deductions, filters and global

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const index = p_eventBeingApplied.index;
		const choice = p_eventBeingApplied.choice;
		if (index == NURIKABE_SEA) {
			if (choice) {
				p_listEventsToApply = p_solver.alert2x2Areas(p_listEventsToApply, p_solver.methodsSetDeductions, x, y); 
			} else {
				var index2;
				p_solver.existingNeighborsCoors(x, y).forEach(coors => {
					index2 = p_solver.answerChoiceArray[coors.y][coors.x].getOneLeft(); 
					if (isAggregatedLandIndex(index2)) {
						p_listEventsToApply.push(new ChoiceEvent(x, y, index2, true));
					}
				});
				index2 = p_solver.answerChoiceArray[y][x].getOneLeft();
				if (isAggregatedLandIndex(index2)) {
					p_listEventsToApply.push(new ChoiceEvent(x, y, index2, true));
				}
			}
		} else {
			const island = p_solver.islandList[index];
			if (choice) {
				p_solver.existingNeighborsCoors(x, y).forEach(coors => {
					if (p_solver.answerChoiceArray[coors.y][coors.x].getState(NURIKABE_SEA) == SPACE_CHOICE.NO) {
						p_listEventsToApply.push(new ChoiceEvent(coors.x, coors.y, index, true));
					}
					// Ban possibilities of other island indexes in adjacent spaces
					p_solver.answerChoiceArray[coors.y][coors.x].values().forEach(value => {
						if (value != index && value != NURIKABE_SEA) { // Note : not optimized to the structure of space numeric
							p_listEventsToApply.push(new ChoiceEvent(coors.x, coors.y, value, false));
						}
					});
				});
				
				if (island.notIncludedYet == 0 && island.notExcludedYet != 0) {
					island.accessibleSpaces.forEach(coors => {
						if (p_solver.answerChoiceArray[coors.y][coors.x].getState(index) == SPACE_CHOICE.UNDECIDED) {
							p_listEventsToApply.push(new ChoiceEvent(coors.x, coors.y, index, false));
						} 
					});
				}
			} else {
				const index2 = p_solver.answerChoiceArray[y][x].getOneLeft();
				if (isAggregatedLandIndex(index2)) {
					p_listEventsToApply.push(new ChoiceEvent(x, y, index2, true));
				}
				if (island.notExcludedYet == 0 && island.notIncludedYet != 0) {
					island.accessibleSpaces.forEach(coors => {
						if (p_solver.answerChoiceArray[coors.y][coors.x].getState(index) == SPACE_CHOICE.UNDECIDED) {
							p_listEventsToApply.push(new ChoiceEvent(coors.x, coors.y, index, true));
						} 
					});
				}
			}
		}
		// Aaaand... if it's all about choices, let's go
		if (choice) {
			p_solver.answerChoiceArray[y][x].values().forEach(index2 => {
				if (index2 != index) {
					p_listEventsToApply.push(new ChoiceEvent(x, y, index2, false));
				}
			});
		} else {
			const oneLeft = p_solver.answerChoiceArray[y][x].getOneLeft();
			if (oneLeft != null) {
				p_listEventsToApply.push(new ChoiceEvent(x, y, oneLeft, true));				
			}
		}
		return p_listEventsToApply;
	}
}

function isAggregatedLandIndex(p_index) {
	return p_index != null && p_index != NURIKABE_SEA;
}

// By doing the filter now, we allow that all islands and inclusions are in a stable state, so no events are to be applied right now
filterBorderingNewlyExpandedIslandClosure = function(p_solver) {
	return function() {
		var listEvents = [];
		var island, ic, aroundSpaces, x, y;
		p_solver.checkerNewlyExpandedIslands.list.forEach(index => {
			// If the island has reached its target capacity : 
				// Make sure the island cluster has a size equal to the target, otherwise failure
				// If not fail, sea-open the unknown around spaces
				
			// Otherwise : look at the unknown spaces around the island. 
			// If there are none, failure.
			// For each unknown space, if it is adjacent to another closed space :
				// If that closed is included in another island OR if it is not included in an island but the resulting island would be too big, sea-open space between them
			if (listEvents != EVENT_RESULT.FAILURE) {
				island = p_solver.islandList[index];
				if (island.notIncludedYet == 0) {
					ic = p_solver.clusterManager.index(island.capitalX, island.capitalY);
					if (p_solver.clusterManager.sizeCluster(ic) != island.number) {						
						listEvents = EVENT_RESULT.FAILURE;
					} else {
						aroundSpaces = p_solver.clusterManager.unknownAroundSpacesCluster(ic);
						aroundSpaces.forEach(coors => {
							listEvents.push(new ChoiceEvent(coors.x, coors.y, NURIKABE_SEA, true));
						});
					}
				} else {
					ic = p_solver.clusterManager.index(island.capitalX, island.capitalY);
					aroundSpaces = p_solver.clusterManager.unknownAroundSpacesCluster(ic);
					if (aroundSpaces.length == 0) {
						listEvents = EVENT_RESULT.FAILURE;
					} else {
						aroundSpaces.forEach(coors => {
							p_solver.existingNeighborsCoors(coors.x, coors.y).forEach(coors2 => {
								inclusion = p_solver.answerChoiceArray[coors2.y][coors2.x].getOneLeft();
								if (isAggregatedLandIndex(inclusion) && inclusion != island.index) {
									listEvents.push(new ChoiceEvent(coors.x, coors.y, NURIKABE_SEA, true));
								}
								if (inclusion == null && p_solver.answerChoiceArray[coors2.y][coors2.x].getState(NURIKABE_SEA) == SPACE_CHOICE.NO
								&& p_solver.clusterManager.sizeClusterSpace(coors2.x, coors2.y) + 1 + p_solver.clusterManager.sizeCluster(ic) > island.number) {
									listEvents.push(new ChoiceEvent(coors.x, coors.y, NURIKABE_SEA, true));
								}
							});
						});
					}
				}
			}				
		});
		p_solver.cleanNewlyExpandedIslands();
		return listEvents;
	}
}

// Any island spaces that have veen added OR that are adjacent to a newly added sea space (so the island may find itself closed)
// Also, any unknown space ('swimming spaces') adjacent to a newly added sea spaces.
filterAffectedIslandSpacesClosure = function(p_solver) {
	return function() {
		var listEvents = [];
		var x, y, ic, x3, y3, island, inclusion;
		p_solver.actualClosedIndexes.clean();
		p_solver.checkerPotentiallyNewlyAffectedIslandAndSwimmingSpaces.list.forEach(coors => {
			if (listEvents != EVENT_RESULT.FAILURE) {
				// Island spaces :
				// Look at the (actual) cluster it belongs to. 
				// If it has already been treated during this filter, do nothing. Otherwise : 
					// Look at the unknown spaces around. 
						// If it has none : if it is included AND the island has reached target capacity, it's fine. Otherwise, failure. 
						// If it has only one : island-close that space. (deductions should include it) (note that the closed space must belong to an island that hasn't reached its capacity yet because of filter order)
						// If the cluster is not included : see among the around spaces which ones could be linked to an included island that would be too big, and sea-open them
				x = coors.x;
				y = coors.y;
				if (p_solver.answerChoiceArray[y][x].getState(NURIKABE_SEA) == SPACE_CHOICE.NO) {
					ic = p_solver.clusterManager.index(x, y);
					if (p_solver.actualClosedIndexes.add(ic)) {
						aroundSpaces = p_solver.clusterManager.unknownAroundSpacesCluster(ic);
						if (aroundSpaces.length == 0 && 
								!(isAggregatedLandIndex(p_solver.answerChoiceArray[y][x].getOneLeft()) && p_solver.islandList[p_solver.answerChoiceArray[y][x].getOneLeft()].notIncludedYet == 0 )) {
							listEvents = EVENT_RESULT.FAILURE; // Too bad, we use only one space of it. Could be optimized, or... ?
						} else { // Note : special case exception ! Spaces labelled 1 are never "newly included" ! Thus they aren't concerned by the filter.
							if (aroundSpaces.length == 1 && p_solver.islandGrid.get(x, y) != 1) {
								listEvents.push(new ChoiceEvent(aroundSpaces[0].x, aroundSpaces[0].y, NURIKABE_SEA, false));
							}
							if (p_solver.answerChoiceArray[y][x].getOneLeft() == null) {								
								aroundSpaces.forEach(coors2 => {
									p_solver.existingNeighborsCoors(coors2.x, coors2.y).forEach(coors3 => {
										x3 = coors3.x;
										y3 = coors3.y;
										inclusion = p_solver.answerChoiceArray[y3][x3].getOneLeft();
										if (isAggregatedLandIndex(inclusion)) {											
											island = p_solver.islandList[inclusion];
											if (p_solver.clusterManager.sizeClusterSpace(x3, y3) + 1 + p_solver.clusterManager.sizeCluster(ic) > island.number) {
												listEvents.push(new ChoiceEvent(coors2.x, coors2.y, NURIKABE_SEA, true));
											}
										}
									});
								});
							}
						}
					}
				}
				// Bonus (intelligent) : if a space is undecided and fully surrounded by sea : sea-open it.
				else if (p_solver.answerChoiceArray[y][x].getState(NURIKABE_SEA) == SPACE_CHOICE.UNDECIDED) {
					var onlySea = true;
					p_solver.existingNeighborsCoors(x, y).forEach(coors2 => {
						onlySea &= (p_solver.answerChoiceArray[coors2.y][coors2.x].getState(NURIKABE_SEA) == SPACE_CHOICE.YES);
					});
					if (onlySea) {
						listEvents.push(new ChoiceEvent(x, y, NURIKABE_SEA, true));
					}
				}
			}
		});
		p_solver.cleanNewlyIslandSpaces();
		return listEvents;
	}
}

SolverNurikabe.prototype.cleanNewlyExpandedIslands = function() {
	this.checkerNewlyExpandedIslands.clean();
}

SolverNurikabe.prototype.cleanNewlyIslandSpaces = function() {
	this.checkerPotentiallyNewlyAffectedIslandAndSwimmingSpaces.clean();
}

abortClosure = function(p_solver) {
	return function() {		
		p_solver.cleanNewlyExpandedIslands();
		p_solver.cleanNewlyIslandSpaces();
	}
}


function banInaccessibleIslandsClosure(p_solver) {
	return function() {		
		var ok = true;
		var found = false;
		var island;
		//p_solver.islandList.forEach(island => {
		for (i = 0 ; i < p_solver.islandListSortedIndexes.length ; i++) {
			island = p_solver.islandList[p_solver.islandListSortedIndexes[i]];
			p_solver.spacesAccessiblesInRangeFromSetSpaces(island.spacesIncluded, island.notIncludedYet, p_solver.volcanicChecker, canGoThereClosure(p_solver, island.index));
			var spacesToDiscard = [];
			if (!found || (island.notExcludedYet + island.notIncludedYet < 15)) {
				island.accessibleSpaces.forEach(coors => {
					if (!p_solver.volcanicChecker.array[coors.y][coors.x] && 
						p_solver.answerChoiceArray[coors.y][coors.x].getState(island.index) != SPACE_CHOICE.YES) { // the checker does not pass spaces of the island at true... ?
						spacesToDiscard.push({x : coors.x, y : coors.y});
					}
				});
				for (var j = 0 ; j < spacesToDiscard.length ; j++) {
					coors = spacesToDiscard[j];
					state = p_solver.tryToApplyHypothesis(new ChoiceEvent(coors.x, coors.y, island.index, false));
					ok &= (state != DEDUCTIONS_RESULT.FAILURE);
					if (!ok) {
						return GLOBAL_DEDUCTIONS_RESULT.FAILURE;
					}
					found |= (state == DEDUCTIONS_RESULT.SUCCESS);
				}
			}
		// });
		}
		return (found ? GLOBAL_DEDUCTIONS_RESULT.SUCCESS : GLOBAL_DEDUCTIONS_RESULT.HARMLESS);
	}
}

// --------------------
// Passing and multipassing

generateEventsForIslandPassClosure = function(p_solver) {
	return function(p_indexIsland) {
		return p_solver.generateEventsIslandPass(p_indexIsland);
	}
}

SolverNurikabe.prototype.generateEventsIslandPass = function(p_indexIsland) {
	var answer = [];
	const island = this.islandList[p_indexIsland];
	var spacesClosestFirst = this.spacesAccessiblesInRangeFromSetSpacesClosestFirst(island.spacesIncluded, island.notIncludedYet, this.volcanicChecker, canGoThereClosure(this, p_indexIsland));
	var spacesToDiscard = [];
	// Mono-events for unreachable spaces
	island.accessibleSpaces.forEach(coors => {
		if (!this.volcanicChecker.array[coors.y][coors.x] && 
			this.answerChoiceArray[coors.y][coors.x].getState(p_indexIsland) != SPACE_CHOICE.YES) { 
			answer.push([new ChoiceEvent(coors.x, coors.y, p_indexIsland, false)]);
		}
	});
	// Number of "not excluded yet" minus number of unreachable spaces too big in comparison to island-related unknown spaces ? Only test the latter ones !
	const aroundSpaces = this.clusterManager.unknownAroundSpacesClusterSpace(island.capitalX, island.capitalY);
	if (aroundSpaces.length < island.notExcludedYet - answer.length) {
		aroundSpaces.forEach(coors => {
			if (this.answerChoiceArray[coors.y][coors.x].getState(p_indexIsland) == SPACE_CHOICE.UNDECIDED) {			
				answer.push(eventsForOneSpacePass(coors.x, coors.y, p_indexIsland));
			}
		});
	}
	else {		
		spacesClosestFirst.forEach(coors => {
			if (this.answerChoiceArray[coors.y][coors.x].getState(p_indexIsland) == SPACE_CHOICE.UNDECIDED) {			
				answer.push(eventsForOneSpacePass(coors.x, coors.y, p_indexIsland));
			}
		});
	}
	
	return answer;
}

SolverNurikabe.prototype.generateEventsSinglePass = function(p_x, p_y) {
	return [eventsForOneSpacePass(p_x, p_y)];
}

function eventsForOneSpacePass(p_x, p_y, p_indexIsland) {
	//return [new SpaceEvent(p_x, p_y, ADJACENCY.YES), new SpaceEvent(p_x, p_y, ADJACENCY.NO)];
	return [new ChoiceEvent(p_x, p_y, p_indexIsland, true), new ChoiceEvent(p_x, p_y, p_indexIsland, false)];
}

copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.index, p_event1.choice], [p_event2.y, p_event2.x, p_event2.index, p_event2.choice]]);
}

namingCategoryClosure = function(p_solver) {
	return function(p_indexPass) {
		const island = p_solver.islandList[p_indexPass];
		return "Pass around " + island.capitalX + "," + island.capitalY + " (" + island.number + ")"; 
	}
}

SolverNurikabe.prototype.purgeBeforeEx = function(p_solver) {
	
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var answer = [];
		var incertainities = []; // One per index !
		p_solver.islandList.forEach(island => {
			if (island.notIncludedYet > 0) {
				answer.push(island.index);
				incertainities.push(p_solver.incertainity(island)); // TODO : improve ! 
			} else {
				incertainities.push(0);
			}
		});
		answer.sort(function(p_ixi1, p_ixi2) {
			const val = incertainities[p_ixi1] - incertainities[p_ixi2];
			if (val == 0) {
				return p_ixi1 - p_ixi2;
			} else {
				return val;
			}
		});
		return answer;
	}
}

SolverNurikabe.prototype.incertainity = function(p_island) {
	return p_island.notIncludedYet * p_island.notExcludedYet * this.clusterManager.unknownAroundSpacesClusterSpace(p_island.capitalX, p_island.capitalY).length	
}

skipPassClosure = function(p_solver) {
	return function (p_index) {
		return p_solver.incertainity(p_solver.islandList[p_index]) > p_solver.arbitrarySkipPassThreshold; // Arbitrary... or not ?
	}
}

// --------------------
// Resolution

SolverNurikabe.prototype.isSolved = function() {
	for (var i = 0 ; i < this.islandList.length ; i++) { // High convention : Big possible change that someday there are 'X's instead of numbers in Nurikabe... but I didn't meet a single one in a Nurikabe puzzle yet.
		if (this.islandList[i].notIncludedYet != 0) {
			return false;
		}
	};
	return true; 
}

function isSolvedClosure(p_solver) {
	return function() {
		return p_solver.isSolved();
	}
}

function searchClosure(p_solver) {
	return function() {
		var gd = p_solver.applyGlobalDeduction(banInaccessibleIslandsClosure(p_solver), p_solver.methodsSetDeductions, "Purge distant spaces");
		if (gd == GLOBAL_DEDUCTIONS_RESULT.FAILURE) {
			return RESOLUTION_RESULT.FAILURE;
		}	
		var mp = p_solver.multiPass(p_solver.methodsSetMultipass);
		if (mp == MULTIPASS_RESULT.FAILURE) {
			return RESOLUTION_RESULT.FAILURE;
		}			
		if (p_solver.isSolved()) {		
			return RESOLUTION_RESULT.SUCCESS;
		}		
		
		// Find index with the most solutions
		var bestIndex = {nbD : -1};
		var nbDeductions;
		var event_;
		var solveResultEvt;
		for (solveX = 0 ; solveX < p_solver.xLength ; solveX++) { // x and y are somehow modified by tryToApplyHypothesis...
			for (solveY = 0 ; solveY < p_solver.yLength ; solveY++) {
				if (p_solver.answerChoiceArray[solveY][solveX].getState(NURIKABE_SEA) == SPACE_CHOICE.UNDECIDED) {
					[true, false].forEach(value => {
						event_ = new ChoiceEvent(solveX, solveY, NURIKABE_SEA, value);
						solveResultEvt = p_solver.tryToApplyHypothesis(event_); 
						if (solveResultEvt == DEDUCTIONS_RESULT.SUCCESS) {
							nbDeductions = p_solver.numberOfRelevantDeductionsSinceLastHypothesis();
							if (bestIndex.nbD < nbDeductions) {
								bestIndex = {nbD : nbDeductions , evt : event_.copy()}
							}
							p_solver.undoToLastHypothesis();
						}
					});	
				}
			}
		}
		
		// Naive recursion !
		return p_solver.tryAllPossibilities([bestIndex.evt, new ChoiceEvent(bestIndex.evt.x, bestIndex.evt.y, NURIKABE_SEA, !bestIndex.evt.choice)]);
	}
}

