/** Limitation : only one "global cluster" at a time may be managed. */

const SPACE = {
    OPEN: 'O',
    CLOSED: 'C',
    UNDECIDED: '-'
};
const EVENT_RESULT = { // WARNING : don't confuse EVENT_RESULT and RESULT, ; harmonization needed
    SUCCESS : 3,
    FAILURE : 1,
    HARMLESS : 2
}

function ClusterInvolvedSolver(p_xLength, p_yLength) {
	this.xLength = p_xLength;
	this.yLength = p_yLength;
	this.happenedEvents = [];
    this.atLeastOneOpen = false;
    this.adjacencyLimitGrid = createAdjacencyLimitGrid(p_xLength, p_yLength);
    this.adjacencyLimitSpacesList = [];
}

/**
	Generic method for any solver that includes a global adjacency check
	p_startingEvent : PRE (puzzle-related event, described below ; it must have a set of methods) that can lead to consequences
	p_applyEvent : method that states how to apply the PRE (e.g. fill a space in a grid and modify numbers in the cluster). 
	If the PRE has several potential forms, this method must give the behaviour for each forms. Must return EVENT_RESULT.FAILURE, EVENT_RESULT.SUCCESS or EVENT_RESULT.HARMLESS
	p_deductions : method that updates the list of events to apply as deductions to the one being applied. Must return the list of PREs potentially updated with new PRE's.
	p_adjacencyClosure : method that takes (x,y) and must return whether the space (x,y) must be considered open. The limitation of one global cluster makes sense here.
	p_transform : transforms the GeographicalDeduction (see corresponding class) into a PRE.
	p_undoEvent : method to undo a PRE.
	p_extras : may contain stuff that wasn't planned in the first place when this generic solver was written :
		abort : method so the puzzle solver is authorized to do vital stuff such as cleaning environment when a mistake is made. (If no aborting, this method isn't automatically called)
		filters : list of methods that must each take no argument and return either a PRE list (that may be empty) or EVENT_RESULT.FAILURE if something went wrong. 
		These methods should allow to add new events that cannot/ should not be deducted by the application of a single PRE.
		Order of filters matter for optimisation since as soon as the application of a filter returns a non-empty list, the chain breaks and returns to individual event applications (or aborts)
		Warning : methods should be provided, not expressions of methods ! Also, don't forget the keyword "return" in both the closure and the method.
*/
ClusterInvolvedSolver.prototype.tryToApply = function (p_startingEvent, p_applyEvent, p_deductions, p_adjacencyClosure, p_transform, p_undoEvent, p_extras) {
    this.undoEventMethod = p_undoEvent; // TODO experimental !
	var listEventsToApply = [p_startingEvent]; //List of the "events" type used by the solver. 
	// Events can be of any kind but must have the following method :
	// A "x" method (int), a "y" method (int), a "opening" method (OPEN | CLOSED | UNDEFINED), in which case no geographical check is performed)
    var eventBeingApplied;
    var listEventsApplied = [];
    var ok = true;
    var result;
    var x,
    y,
    symbol;
    var ir;
    var newClosedSpaces;
    var firstOpenThisTime;
    while (ok && listEventsToApply.length > 0) {
		// Overall (classical + geographical) verification
        newClosedSpaces = [];
        firstOpenThisTime = false;
        while (ok && listEventsToApply.length > 0) {
            // Classical verification
            eventBeingApplied = listEventsToApply.pop();
			result = p_applyEvent(eventBeingApplied);
            if (result == EVENT_RESULT.FAILURE) {
                ok = false;
            }
            if (result == EVENT_RESULT.SUCCESS) {
				listEventsToApply = p_deductions(listEventsToApply, eventBeingApplied);
                if (eventBeingApplied.opening() == SPACE.CLOSED) {
                    newClosedSpaces.push({
                        x: eventBeingApplied.x(),
                        y: eventBeingApplied.y()
                    });
                } else if (eventBeingApplied.opening() == SPACE.OPEN) {
					//If we are putting the first open space, add a corresponding event into the list of applied events (it isn't "to apply" anymore)
                    if (!this.atLeastOneOpen) {
                        listEventsApplied.push({
                            firstOpen: true
                        });
                        this.atLeastOneOpen = true;
                        firstOpenThisTime = true;
                    }
                }
                listEventsApplied.push(eventBeingApplied);
            }
        }
		
		// listEventsToApply is empty at this point.
		// When logical deductions are performed individually (e.g. each space is watched as itself), apply other methods that may lead to deductions
		if (p_extras && p_extras.filters) {
			var i = 0; // i = filter index
			while (ok && listEventsToApply.length == 0 && i < p_extras.filters.length) {
				filter = p_extras.filters[i];
				var result = filter();
				ok = (result != EVENT_RESULT.FAILURE);
				if (ok) {
					if (result.length > 0) {
						listEventsToApply = result;
					} else {
						i++;
					}
				}
			}
		}

		// listEventsToApply is empty at this point. Perform geographical deductions.
        if (ok) {
            if (firstOpenThisTime) {
                // The first open space has been added this time (ie this succession of events before a check verification) : add all previously closed to the list.
                this.happenedEvents.forEach(eventList => {
                    eventList.forEach(solveEvent => {
                        if (solveEvent.opening() == SPACE.CLOSED) {
                            newClosedSpaces.push({
                                x: solveEvent.x(),
                                y: solveEvent.y()
                            });
                        }
                    });
                });
            }
            if (this.atLeastOneOpen) {
                //Geographical verification.
                geoV = this.geographicalVerification(newClosedSpaces, p_adjacencyClosure);
				ok = (geoV.result == EVENT_RESULT.SUCCESS);
				if (ok) {
					geoV.listGeographicalDeductionsToApply.forEach(geographicalDeduction =>
						listEventsToApply.push(p_transform(geographicalDeduction))
					);
					geoV.listGeographicalDeductionsApplied.forEach(geographicalDeduction =>
						listEventsApplied.push(geographicalDeduction)
					);
				}
            }
        }
    }
    if (!ok) {
		if (p_extras && p_extras.abort) {
			p_extras.abort();
		}
        this.undoEventList(listEventsApplied, p_undoEvent);
    } else if (listEventsApplied.length > 0) {
        this.happenedEvents.push(listEventsApplied);
    }
}

/**
In entry : 
p_listNewXs : a list of {x,y} items with the position of all "closed" spaces, 
p_adjacencyClosure : a method that determines through (x,y) grid if a ... must be opened or not.
In exit :
listGeographicalDeductionsToApply : a list of GeographicalDeduction(x,y, OPEN|CLOSED) items
listGeographicalDeductionsApplied : a list of {adjacency : true} items. Whenever it should be undone, the first element of adjacencyLimitSpacesList should be undone.
*/
ClusterInvolvedSolver.prototype.geographicalVerification = function (p_listNewXs, p_adjacencyClosure) {
    console.log("Perform geographicalVerification");
    const checking = adjacencyCheck(p_listNewXs, this.adjacencyLimitGrid, this.adjacencyLimitSpacesList, p_adjacencyClosure, this.xLength, this.yLength);
	if (checking.success) {
        var newListEvents = [];
        var newListEventsApplied = [];
        checking.newADJACENCY.forEach(space => {
            newListEvents.push(new GeographicalDeduction(space.x, space.y, SPACE.OPEN));
        });
        checking.newBARRIER.forEach(space => {
            newListEvents.push(new GeographicalDeduction(space.x, space.y, SPACE.CLOSED));
        });
        checking.newLimits.forEach(spaceLimit => {
            //Store the ancient limit into the solved event (in case of undoing), then overwrites the limit at once and pushes it into
            newListEventsApplied.push({
                adjacency: true
            });
            this.adjacencyLimitSpacesList.push({
                x: spaceLimit.x,
                y: spaceLimit.y,
                formerValue: this.adjacencyLimitGrid[spaceLimit.y][spaceLimit.x].copy()
            });
            this.adjacencyLimitGrid[spaceLimit.y][spaceLimit.x] = spaceLimit.limit;
        });
        return {
            result: EVENT_RESULT.SUCCESS,
            listGeographicalDeductionsToApply: newListEvents,
            listGeographicalDeductionsApplied: newListEventsApplied
        };
    } else {
        return {
            result: EVENT_RESULT.FAILURE
        };
    }

}

//--------------------
// Undoing

ClusterInvolvedSolver.prototype.undoEventList = function (p_eventsList, p_undoEventMethod) {
	p_eventsList.forEach(eventToUndo => {
		if (eventToUndo.firstOpen) {
			this.atLeastOneOpen = false;
		} else if (eventToUndo.adjacency) {
			const aals = this.adjacencyLimitSpacesList.pop(); //aals = added adjacency limit space
			this.adjacencyLimitGrid[aals.y][aals.x] = aals.formerValue;
		} else {
			p_undoEventMethod(eventToUndo);
		}
	});
}

/**
Used by outside !
 */
ClusterInvolvedSolver.prototype.undoToLastHypothesis = function (p_undoEventMethod) {
    if (this.happenedEvents.length > 0) {
        var lastEventsList = this.happenedEvents.pop();
        this.undoEventList(lastEventsList, p_undoEventMethod); // TODO Impossible d'échapper à l'utilisation de p_undoEventMethod
    }
}