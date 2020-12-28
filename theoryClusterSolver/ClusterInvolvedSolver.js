const NOT_FORCED = -1;
const NOT_RELEVANT = -1;
const SPACE = {
    OPEN: 'O',
    CLOSED: 'C',
    UNDECIDED: '-'
};
const RESULT = {
    SUCCESS: 3,
    ERROR: 1,
    HARMLESS: 2
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
*/
ClusterInvolvedSolver.prototype.tryToApply = function (p_startingEvent, p_applyEvent, p_deductions, p_adjacencyClosure, p_transform, p_undoEvent) {
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
            /*x = eventBeingApplied.x;
            y = eventBeingApplied.y;
            symbol = eventBeingApplied.symbol;
            result = this.putNew(x, y, symbol);*/
            if (result == RESULT.ERROR) {
                ok = false;
            }
            if (result == RESULT.SUCCESS) {
                //listEventsToApply = this.deductions(listEventsToApply, x, y, symbol);
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
				ok = (geoV.result == RESULT.SUCCESS);
				if (ok) {
					geoV.listGeographicalDeductionsToApply.forEach(geographicalDeduction =>
						listEventsToApply.push(p_transform(geographicalDeduction))
					);
					//if (geoV.listGeographicalDeductionsApplied && geoV.listGeographicalDeductionsApplied.length > 0) {
						geoV.listGeographicalDeductionsApplied.forEach(geographicalDeduction =>
							listEventsApplied.push(geographicalDeduction)
						);
					//}
				}
            }
        }
    }
    if (!ok) {
        this.undoEventList(listEventsApplied, p_undoEvent);
    } else if (listEventsApplied.length > 0) {
        this.happenedEvents.push(listEventsApplied);
        //TODO : remember : this is an hypothesis !
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
    //const checking = adjacencyCheck(p_listNewXs, this.adjacencyLimitGrid, this.adjacencyLimitSpacesList, this.adjacencyClosure(this.answerGrid), this.xLength, this.yLength);
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
            result: RESULT.SUCCESS,
            listGeographicalDeductionsToApply: newListEvents,
            listGeographicalDeductionsApplied: newListEventsApplied
        };
    } else {
        return {
            result: RESULT.FAILURE
        };
    }

}

//--------------------
// Undoing

/*SolverTheoryCluster.prototype.undoEvent = function (p_event) {
    if (p_event.kind == EVENT_KIND.SPACE) { // Note : I tried to put "if (p_event.y)" but it resulted into top line (y = 0) to be not taken into account.
        this.answerGrid[p_event.y][p_event.x] = SPACE.UNDECIDED;
    } else if (p_event.adjacency) {
        const aals = this.adjacencyLimitSpacesList.pop(); //aals = added adjacency limit space
        this.adjacencyLimitGrid[aals.y][aals.x] = aals.formerValue;
    } else if (p_event.firstOpen) {
        this.atLeastOneOpen = false;
    }
}

SolverTheoryCluster.prototype.undoEventList = function (p_eventsList) {
    p_eventsList.forEach(solveEvent => this.undoEvent(solveEvent));
}*/

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
	/*for(var i = 0 ; i < p_eventsList.length; i++) {
		eventToUndo = p_eventsList[i];
		
	}*/
	
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




/**
What not to forget when copying the adjacency constraint into a solver that doesn't have it yet : 
-geographicalVerification
-firstOpenThisTime && listNewClosedEvents initialized in the right part of the loop
-events concatenation
-this.gridArray, this.gridList (limits), this.atLeastOneOpen
-undoing events
*/