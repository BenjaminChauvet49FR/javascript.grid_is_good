// Note : right now this is a set of methods but later this may become a standing class.

// makeItGeographical must be placed AFTER declaring methodsSetDeductions.
GeneralSolver.prototype.makeItGeographical = function(p_xLength, p_yLength, p_methodPack) {
	this.xLength = p_xLength;
	this.yLength = p_yLength;
	this.atLeastOneOpenTreated = false;
	this.atLeastOneOpenAtSetup = false;
    this.adjacencyLimitGrid = createAdjacencyLimitGrid(this.xLength, this.yLength);
    this.adjacencyLimitSpacesList = [];
	this.bannedSpacesList = [];
	this.methodsSetDeductions = p_methodPack;
	this.methodsSetDeductions.undoEventMethod = geographicalEnhancedUndoClosure(this, this.methodsSetDeductions.undoEventMethod);
	shouldBeLoggedEvent = shouldBeLoggedEventEnhancedClosure(shouldBeLoggedEvent);
	setupAdjacencyCheck(p_xLength, p_yLength, p_methodPack.adjacencyMethod);
}

function geographicalEnhancedUndoClosure(p_solver, p_originalUndoMethod) {
	return function(p_eventToUndo) {
		if (p_eventToUndo.firstOpen) { 
			p_solver.atLeastOneOpenTreated = false;
		} else if (p_eventToUndo.adjacency) {
			const aals = p_solver.adjacencyLimitSpacesList.pop(); 
			p_solver.adjacencyLimitGrid[aals.y][aals.x] = aals.formerValue;
		} else {
			p_originalUndoMethod(p_eventToUndo);
		}
	}
}

function shouldBeLoggedEventEnhancedClosure(p_originalLogMethod) {
	return function(p_event, p_solver) {
		if ((p_event.firstOpen) || (p_event.adjacency)) {
			return false;
		}
		return p_originalLogMethod(p_event, p_solver); 
	}
}

// Declare spaces open and closed for setup !!! Do not forget them, otherwise this can make the puzzle go nuts.
GeneralSolver.prototype.declarationsOpenAndClosed = function() {
	var atLeastOneOpen = false;
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			switch(this.methodsSetDeductions.adjacencyMethod(x, y)) {
				case ADJACENCY.YES : atLeastOneOpen = true; break;
				case ADJACENCY.NO : this.bannedSpacesList.push({x : x, y : y}); break;
			}
		}
	}
	if (atLeastOneOpen) {
		this.atLeastOneOpenAtSetup = true;
	}
	
}

// Behaves like a filter, except it adds immediatly applied events
GeneralSolver.prototype.pseudoFilterGeographicalDeductions = function(p_appliedEventsList, p_methodPack) {
	var retrieveBackedClosedSpaces = false;
	
	if (this.atLeastOneOpenAtSetup) {
		if (!this.atLeastOneOpenTreated) {
			p_appliedEventsList.push(new FirstOpenEvent());
			this.atLeastOneOpenTreated = true;
			retrieveBackedClosedSpaces = true;
		}		
	}
	
	var listEventsToApply = [];
	var alreadyGeographicallyCheckedEventsCount = 0 ;
	var eventBeingChecked;
	var isOpenEvent;
	var newClosedSpaces = [];
	while(alreadyGeographicallyCheckedEventsCount < p_appliedEventsList.length) {
		eventBeingChecked = p_appliedEventsList[alreadyGeographicallyCheckedEventsCount];
		alreadyGeographicallyCheckedEventsCount++;
		if (eventBeingChecked.opening) { // Note : unlike the previous systems (where geographical addings were made directly in the application) we check "opening" everytime. A slight waste of time... 					
			isOpenEvent = eventBeingChecked.opening();
			if (isOpenEvent == ADJACENCY.NO) {
				newClosedSpaces.push({
					x: eventBeingChecked.coordinateX(),
					y: eventBeingChecked.coordinateY()
				});
			} else if (isOpenEvent == ADJACENCY.YES) {
				//If we are putting the first open space, add a corresponding event into the list of applied events (it isn't "to apply" anymore)
				if (!this.atLeastOneOpenTreated) {
					p_appliedEventsList.push(new FirstOpenEvent());
					this.atLeastOneOpenTreated = true;
					retrieveBackedClosedSpaces = true;
				}
			}
		}
	}
	if (retrieveBackedClosedSpaces) {
		// The first open space has been added this time OR during the setup (ie this succession of events before a check verification) : add all spaces that were listed as banned + all spaces that were previously closed to the list.
		this.bannedSpacesList.forEach(space => {
			newClosedSpaces.push({
				x: space.x,
				y: space.y
			});
		});
		this.happenedEventsSeries.forEach(eventSerie => {
			eventSerie.list.forEach(solveEvent => {
				if (solveEvent.opening && solveEvent.opening() == ADJACENCY.NO) {
					newClosedSpaces.push({
						x: solveEvent.coordinateX(),
						y: solveEvent.coordinateY()
					});
				}
			});
		});
	}
	if (this.atLeastOneOpenTreated) {
		//Geographical verification.
		geoV = this.geographicalVerification(newClosedSpaces, []);
		ok = (geoV.result != GEOGRAPHICAL_DEDUCTION.FAILURE);
		if (ok) {
			geoV.listGeographicalDeductionsToApply.forEach(geographicalDeduction =>
				listEventsToApply.push(p_methodPack.retrieveGeographicalDeductionMethod(geographicalDeduction))
			);
			geoV.listGeographicalDeductionsApplied.forEach(geographicalDeduction =>
				p_appliedEventsList.push(geographicalDeduction)
			);
			if (geoV.listGeographicalDeductionsToApply.length == 0 && this.checkFormerLimits) { // If not for 'deductions applied' we would miss some deductions in a step with new limits and without new open spaces (Shugaku 59 manual solving)...
				listEventsToApply = this.pseudoFilterFormerLimitsCheck(p_appliedEventsList, p_methodPack);
			}
		} else {
			listEventsToApply.push(new FailureEvent());
		}		
	}
	return listEventsToApply;
}

// Note : will eventually become a filter
GeneralSolver.prototype.pseudoFilterFormerLimitsCheck = function(p_appliedEventsList, p_methodPack) {
	var listEventsToApply = [];
	if (this.atLeastOneOpenTreated) { // Note : likely useless but I am paranoid
		//Geographical verification.
		var geoV = this.geographicalVerification([], this.adjacencyLimitSpacesList);
		var ok = (geoV.result != GEOGRAPHICAL_DEDUCTION.FAILURE);
		if (ok) {
			geoV.listGeographicalDeductionsToApply.forEach(geographicalDeduction =>
				listEventsToApply.push(p_methodPack.retrieveGeographicalDeductionMethod(geographicalDeduction))
			);
			geoV.listGeographicalDeductionsApplied.forEach(geographicalDeduction =>
				p_appliedEventsList.push(geographicalDeduction)
			);
		} else {
			listEventsToApply.push(new FailureEvent());
		}
	}
	return listEventsToApply;
}




/**
In entry : 
p_listNewXs : a list of {x,y} items with the position of all "closed" spaces, 
p_formerLimits : limits to check
In exit :
listGeographicalDeductionsToApply : a list of GeographicalDeduction(x,y, OPEN|CLOSED) items
listGeographicalDeductionsApplied : a list of {adjacency : true} items. Whenever it should be undone, the first element of adjacencyLimitSpacesList should be undone.
*/
GeneralSolver.prototype.geographicalVerification = function (p_listNewXs, p_formerLimits, p_manual) {
    //autoLogGeographical("Perform geographicalVerification");
    const checking = adjacencyCheck(p_listNewXs, this.adjacencyLimitGrid, p_formerLimits); 
	if (checking.success) {
        var newListEvents = [];
        var newListEventsApplied = [];
        checking.newADJACENCY.forEach(space => {
            newListEvents.push(new GeographicalDeduction(space.x, space.y, ADJACENCY.YES));
        });
        checking.newBARRIER.forEach(space => {
            newListEvents.push(new GeographicalDeduction(space.x, space.y, ADJACENCY.NO));
        });
		if (!p_manual) { // Limits not updated in case of manual check, since this is the only case where this is not in a deduction. Quite rare, however.
			checking.newLimits.forEach(spaceLimit => {
				//Store the ancient limit into the solved event (in case of undoing), then overwrites the limit at once and pushes it into
				newListEventsApplied.push(new AdjacencyShiftEvent());
				this.adjacencyLimitSpacesList.push({
					x: spaceLimit.x,
					y: spaceLimit.y,
					formerValue: this.adjacencyLimitGrid[spaceLimit.y][spaceLimit.x].copy()
				});
				this.adjacencyLimitGrid[spaceLimit.y][spaceLimit.x] = spaceLimit.limit;
			});
		}
		if (newListEvents.length || newListEventsApplied.length) {			
			return {
				result : GEOGRAPHICAL_DEDUCTION.SUCCESS,
				listGeographicalDeductionsToApply : newListEvents,
				listGeographicalDeductionsApplied : newListEventsApplied
			} 
		} else {
			return {
				result : GEOGRAPHICAL_DEDUCTION.HARMLESS,
				listGeographicalDeductionsToApply : [],
				listGeographicalDeductionsApplied : []
			}
		}
    } else {
        return {
            result: GEOGRAPHICAL_DEDUCTION.FAILURE
        };
    }
}

// Note : ideally, this.checkFormerLimits is true
function exploreFormerLimitsClosure(p_solver) { 
	return function() {				
		const geoV = p_solver.geographicalVerification([], p_solver.adjacencyLimitSpacesList, true); 
		var ok = (geoV.result != GEOGRAPHICAL_DEDUCTION.FAILURE); // Should be true...
		var listEventsToApply = [];
		if (ok) {
			geoV.listGeographicalDeductionsToApply.forEach(geographicalDeduction =>
				listEventsToApply.push(p_solver.methodsSetDeductions.retrieveGeographicalDeductionMethod(geographicalDeduction))
			);
			/*geoV.listGeographicalDeductionsApplied.forEach(geographicalDeduction => 
				// Note : according to logs, it may happen
				p_appliedEventsList.push(geographicalDeduction);
			); */
		}
		var state;
		var found = false;
		for (var j = 0 ; j < listEventsToApply.length ; j++) {
			event_ = listEventsToApply[j];
			state = p_solver.tryToApplyHypothesis(event_);
			ok &= (state != DEDUCTIONS_RESULT.FAILURE);
			if (!ok) {
				return GLOBAL_DEDUCTIONS_RESULT.FAILURE;
			}
			found |= (state == DEDUCTIONS_RESULT.SUCCESS);
		}
		return found ? GLOBAL_DEDUCTIONS_RESULT.SUCCESS : GLOBAL_DEDUCTIONS_RESULT.HARMLESS;
	}
}

GeneralSolver.prototype.setCheckFormerLimits = function(p_bool) {
	this.checkFormerLimits = p_bool;
}

// -----------------------
// Common input

GeneralSolver.prototype.makeFormerLimitsExploration = function() {
	this.checkFormerLimits = true;
	this.applyGlobalDeduction(exploreFormerLimitsClosure(this), this.methodsSetDeductions, "Former limits check");
	this.checkFormerLimits = false;
}

// -----------------------
// Events

function FirstOpenEvent() {
	this.firstOpen = true;
	this.outOfPass = true;
}

FirstOpenEvent.prototype.toLogString = function() {
	return "<first opening declared>"
}

function AdjacencyShiftEvent() {
	this.adjacency = true;
	this.outOfPass = true;
}

AdjacencyShiftEvent.prototype.toLogString = function() {
	return "<adjacency>"
}

// -----------------------
// Some deduction methods

GeneralSolver.prototype.deductionsAlert2x2Areas = function(p_listEventsToApply, p_methodSet, p_x, p_y) {
	isOccupiedMethod = isOccupiedClosure(p_methodSet.adjacencyMethod);
	retrieveGDMethod = p_methodSet.retrieveGeographicalDeductionMethod;
	if (p_x > 0) {
		if (isOccupiedMethod(p_x-1, p_y)) { // Left space occupied ? Check spaces above / below
			if (p_y > 0) {
				deductionsDuelOccupation(p_listEventsToApply, isOccupiedMethod, retrieveGDMethod, p_x-1, p_y-1, p_x, p_y-1);
			}
			if (p_y <= this.yLength-2) {
				deductionsDuelOccupation(p_listEventsToApply, isOccupiedMethod, retrieveGDMethod, p_x-1, p_y+1, p_x, p_y+1);
			}
		} else { // Left space unoccupied : check if spaces above/below are occupied.
			if (((p_y > 0) && (isOccupiedMethod(p_x-1, p_y-1)) && isOccupiedMethod(p_x, p_y-1)) ||
				((p_y <= this.yLength-2) && (isOccupiedMethod(p_x-1, p_y+1)) && isOccupiedMethod(p_x, p_y+1))) {
				p_listEventsToApply.push(retrieveGDMethod({x : p_x-1, y : p_y, opening : ADJACENCY.NO}));
			} 
		}
	}
	if (p_x <= this.xLength-2) {
		if (isOccupiedMethod(p_x+1, p_y)) { // Right space occupied ? Check spaces above / below
			if (p_y > 0) {
				deductionsDuelOccupation(p_listEventsToApply, isOccupiedMethod, retrieveGDMethod, p_x+1, p_y-1, p_x, p_y-1);
			}
			if (p_y <= this.yLength-2) {
				deductionsDuelOccupation(p_listEventsToApply, isOccupiedMethod, retrieveGDMethod, p_x+1, p_y+1, p_x, p_y+1);
			}
		} else { // Right space unoccupied : check if spaces above/below are occupied.
			if (((p_y > 0) && (isOccupiedMethod(p_x+1, p_y-1)) && isOccupiedMethod(p_x, p_y-1)) ||
				((p_y <= this.yLength-2) && (isOccupiedMethod(p_x+1, p_y+1)) && isOccupiedMethod(p_x, p_y+1))) {
				p_listEventsToApply.push(retrieveGDMethod({x : p_x+1, y : p_y, opening : ADJACENCY.NO}));
			} 
		}
	}
}

deductionsDuelOccupation = function(p_listEventsToApply, p_isOccupiedMethod, p_retrieveGDMethod, p_x1, p_y1, p_x2, p_y2) {
	if (p_isOccupiedMethod(p_x1, p_y1)) {
		p_listEventsToApply.push(p_retrieveGDMethod({x : p_x2, y : p_y2, opening : ADJACENCY.NO}));
	} 
	if (p_isOccupiedMethod(p_x2, p_y2)) {
		p_listEventsToApply.push(p_retrieveGDMethod({x : p_x1, y : p_y1, opening : ADJACENCY.NO}));
	} 
}

isOccupiedClosure = function(p_methodOpening) {
	return function(p_x, p_y) {
		return (p_methodOpening(p_x, p_y) == ADJACENCY.YES);
	}
}

// ---------------
// GeographicalDeduction - the object utilised by the adjacency checker.

function GeographicalDeduction(p_x, p_y, p_opening) { 
	this.opening = p_opening;
	this.x = p_x;
	this.y = p_y;
}

GeographicalDeduction.prototype.toLogString = function() {	
	return "[GD "+this.x+","+this.y+"] ("+this.opening+")";
}

