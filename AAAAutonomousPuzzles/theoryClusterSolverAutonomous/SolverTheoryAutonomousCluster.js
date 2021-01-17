/* This acts as a backup, if the "new" Solver theory cluster isn't fine*/

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

function SolverTheoryAutonomousCluster() {
    this.construct(generateWallArray(1,1),generateSymbolArray(1,1));
}

SolverTheoryAutonomousCluster.prototype.construct = function (p_wallArray, p_numberGrid) {
    this.xLength = p_wallArray[0].length;
    this.yLength = p_wallArray.length;
    this.wallGrid = WallGrid_data(p_wallArray);
    this.answerGrid = [];
    this.happenedEvents = [];
    this.atLeastOneOpen = false;
    this.adjacencyLimitGrid = createAdjacencyLimitGrid(this.xLength, this.yLength);
    this.adjacencyLimitSpacesList = [];
    var ix,
    iy;

    // Initialize the required grids (notably answerGrid) and the number of regions
    for (iy = 0; iy < this.yLength; iy++) {
        this.answerGrid.push([]);
        for (ix = 0; ix < this.xLength; ix++) {
            this.answerGrid[iy].push(SPACE.UNDECIDED);
        }
    }

    //IMPORTANT : Purification not performed yet !
}

SolverTheoryAutonomousCluster.prototype.getSpaceCoordinates = function (p_indexRegion, p_indexSpace) {
    return this.regions[p_indexRegion].spaces[p_indexSpace];
}

SolverTheoryAutonomousCluster.prototype.getAnswer = function (p_x, p_y) {
    return this.answerGrid[p_y][p_x];
}

//--------------------------------
SolverTheoryAutonomousCluster.prototype.emitHypothesis = function (p_x, p_y, p_symbol) {
    this.tryToPutNew(p_x, p_y, p_symbol);
}

//--------------------------------

SolverTheoryAutonomousCluster.prototype.putNew = function (p_x, p_y, p_symbol) {
    if ((p_x < 0) || (p_y < 0) || (p_x >= this.xLength) || (p_y >= this.yLength) || (this.answerGrid[p_y][p_x] == p_symbol)) {
        return RESULT.HARMLESS;
    }
    if (this.answerGrid[p_y][p_x] != SPACE.UNDECIDED) {
        return RESULT.ERROR;
    }
    this.answerGrid[p_y][p_x] = p_symbol;
    return RESULT.SUCCESS;
}

SolverTheoryAutonomousCluster.prototype.tryToPutNew = function (p_x, p_y, p_symbol) {
    var listEventsToApply = [SpaceEvent(p_x, p_y, p_symbol)];
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
            x = eventBeingApplied.x;
            y = eventBeingApplied.y;
            symbol = eventBeingApplied.symbol;
            result = this.putNew(x, y, symbol);
            if (result == RESULT.FAILURE) {
                ok = false;
            }
            if (result == RESULT.SUCCESS) {
                listEventsToApply = this.deductions(listEventsToApply, x, y, symbol);
                if (symbol == SPACE.CLOSED) {
                    newClosedSpaces.push({
                        x: x,
                        y: y
                    });
                } else {
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

        if (ok) {
            if (firstOpenThisTime) {
                // The first open space has been added this time (ie this succession of events before a check verification) : add all previously closed to the list.
                this.happenedEvents.forEach(eventList => {
                    eventList.forEach(solveEvent => {
                        if (solveEvent.symbol && (solveEvent.symbol == SPACE.CLOSED)) {
                            newClosedSpaces.push({
                                x: solveEvent.x,
                                y: solveEvent.y
                            });
                        }
                    });
                });
            }
            if (this.atLeastOneOpen) {
                //Geographical verification.
                geoV = this.geographicalVerification(newClosedSpaces);
                listEventsToApply = geoV.listEventsToApply;
                if (geoV.listEventsApplied) {
                    Array.prototype.push.apply(listEventsApplied, geoV.listEventsApplied);
                }
                ok = (geoV.result == RESULT.SUCCESS);
            }
        }
    }
    if (!ok) {
        this.undoEventList(listEventsApplied);
    } else if (listEventsApplied.length > 0) {
        this.happenedEvents.push(listEventsApplied);
        //TODO : remember : this is an hypothesis !
    }
}

SolverTheoryAutonomousCluster.prototype.deductions = function (p_listEventsToApply, p_x, p_y, p_symbol) {
    if (p_symbol == SPACE.OPEN) {
        console.log("Perform deductions for 'open' space at " + p_x + " " + p_y);
    } else if (p_symbol == SPACE.CLOSED) {
        console.log("Perform deductions for 'closed' space at " + p_x + " " + p_y);
    }
    return p_listEventsToApply;
}

SolverTheoryAutonomousCluster.prototype.adjacencyClosure = function (p_grid) {
    return function (p_x, p_y) {
        switch (p_grid[p_y][p_x]) {
        case SPACE.OPEN:
            return ADJACENCY.YES;
            break;
        case SPACE.CLOSED:
            return ADJACENCY.NO;
            break;
        default:
            return ADJACENCY.UNDEFINED;
            break;
        }
    }
    //If not for a closure, adjacencyCheck wouldn't be able to access the grid because "this.answerGrid" is undefined for the Window object.
};

SolverTheoryAutonomousCluster.prototype.geographicalVerification = function (p_listNewXs) {
    console.log("Perform geographicalVerification");
    const checking = adjacencyCheck(p_listNewXs, this.adjacencyLimitGrid, this.adjacencyLimitSpacesList, this.adjacencyClosure(this.answerGrid), this.xLength, this.yLength);
    if (checking.success) {
        var newListEvents = [];
        var newListEventsApplied = [];
        checking.newADJACENCY.forEach(space => {
            newListEvents.push(SpaceEvent(space.x, space.y, SPACE.OPEN));
        });
        checking.newBARRIER.forEach(space => {
            newListEvents.push(SpaceEvent(space.x, space.y, SPACE.CLOSED));
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
            listEventsToApply: newListEvents,
            listEventsApplied: newListEventsApplied
        };
    } else {
        return {
            result: RESULT.FAILURE,
            listEventsToApply: []
        };
    }

}

//--------------------
// Undoing

SolverTheoryAutonomousCluster.prototype.undoEvent = function (p_event) {
    if (p_event.kind == EVENT_KIND.SPACE) { // Note : I tried to put "if (p_event.y)" but it resulted into top line (y = 0) to be not taken into account.
        this.answerGrid[p_event.y][p_event.x] = SPACE.UNDECIDED;
    } else if (p_event.adjacency) {
        const aals = this.adjacencyLimitSpacesList.pop(); //aals = added adjacency limit space
        this.adjacencyLimitGrid[aals.y][aals.x] = aals.formerValue;
    } else if (p_event.firstOpen) {
        this.atLeastOneOpen = false;
    }
}

SolverTheoryAutonomousCluster.prototype.undoEventList = function (p_eventsList) {
    p_eventsList.forEach(solveEvent => this.undoEvent(solveEvent));
}

/**
Used by outside !
 */
SolverTheoryAutonomousCluster.prototype.undoToLastHypothesis = function () {
    if (this.happenedEvents.length > 0) {
        var lastEventsList = this.happenedEvents.pop();
        this.undoEventList(lastEventsList);
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