const NOT_FORCED = -1;
const NOT_RELEVANT = -1;
const SPACE = {
    OPEN: 'O',
    CLOSED: 'C',
    UNDECIDED: '-'
};
const RESULT = {
    SUCCESS: 3,
    FAILURE: 1,
    HARMLESS: 2
}
const EVENTLIST_KIND = {
    HYPOTHESIS: "H",
    PASS: "P"
};
const CURVING_WAY = {
    LEFT_VERTICAL: 'L',
    RIGHT_VERTICAL: 'R',
    HORIZONTAL: 'H',
    VERTICAL: 'V'
}

function SolverCurvingRoad(p_wallArray, p_symbolArray) {
    this.construct(p_wallArray, p_symbolArray);
}

SolverCurvingRoad.prototype.construct = function (p_wallArray, p_symbolArray) {
    this.xLength = p_symbolArray[0].length;
    this.yLength = p_symbolArray.length;
    this.wallGrid = WallGrid_data(p_wallArray);
    this.happenedEvents = [];
    this.answerGrid = [];
    this.curvingLinkArray = [];
    this.curvingLinkList = [];
    this.pearlGrid = [];

    var ix,
    iy;

    // TODO need purification
    for (iy = 0; iy < this.yLength; iy++) {
        this.answerGrid.push([]);
        this.curvingLinkArray.push([]);
        this.pearlGrid.push([]);
        for (ix = 0; ix < this.xLength; ix++) {
            this.curvingLinkArray[iy].push([]);
            if (p_symbolArray[iy][ix] == SYMBOL_ID.WHITE) {
                this.answerGrid[iy].push(SPACE.OPEN);
                this.pearlGrid[iy].push(true);
            } else {
                this.answerGrid[iy].push(SPACE.UNDECIDED);
                this.pearlGrid[iy].push(false);
            }
        }
    }

    for (iy = 0; iy < this.yLength; iy++) {
        for (ix = 0; ix < this.xLength; ix++) {
            if (p_symbolArray[iy][ix] == SYMBOL_ID.WHITE) {
                this.traceRoadsFrom(ix, iy);
            }
        }
    }
    for (iy = 0; iy < this.yLength; iy++) {
        for (ix = 0; ix < this.xLength; ix++) {
            this.determineInvalidRoadsFrom(ix, iy);
        }
    }
    for (iy = 0; iy < this.yLength; iy++) {
        for (ix = 0; ix < this.xLength; ix++) {
            this.purgeRoadsFrom(ix, iy);
        }
    }

    // Below fields are for adjacency "all spaces with ... must form a orthogonally contiguous area"
    this.atLeastOneOpen = false;
    this.adjacencyLimitGrid = createAdjacencyLimitGrid(this.xLength, this.yLength);
    this.adjacencyLimitSpacesList = [];
}

SolverCurvingRoad.prototype.traceRoadsFrom = function (p_x, p_y) {
    var bottomRow = (p_y == this.yLength - 1);
    var rightColumn = (p_x == this.xLength - 1);
    var leftColumn = (p_x == 0);
    var lastX,
    lastY;
    var x,
    y;
    var shouldMoveOn;
    var shouldTrace;
    //TODO je m'en fiche, il y a beaucoup de redondances, mais on ne vérifie pas si un lien est contenu dans un autre !
    //answerGrid should have been updated by now ; anyway, open in answerGrid refers to "white" spaces.
    if (!rightColumn) {
        lastX = p_x; //Right only
        do {
            shouldTrace = (lastX < this.xLength - 1);
            shouldMoveOn = shouldTrace && (this.answerGrid[p_y][lastX + 1] != SPACE.OPEN);
            if (shouldMoveOn) {
                lastX++;
            }
        } while (shouldMoveOn);
        if (shouldTrace) {
            this.traceRoad(p_x + 1, p_y, lastX, p_y, CURVING_WAY.HORIZONTAL);
            lastX--;
        }
        if (!bottomRow) { // Right then down
            for (x = p_x + 1; x <= lastX; x++) {
                lastY = p_y;
                do {
                    shouldTrace = (lastY < this.yLength - 1);
                    shouldMoveOn = (shouldTrace && this.answerGrid[lastY + 1][x] != SPACE.OPEN);
                    if (shouldMoveOn) {
                        lastY++;
                    }
                } while (shouldMoveOn);
                if (shouldTrace) {
                    this.traceRoad(p_x + 1, lastY, x, p_y, CURVING_WAY.RIGHT_VERTICAL);
                }
            }
        }
    }

    //Down only
    if (!bottomRow) {
        lastY = p_y;
        do {
            shouldTrace = (lastY < this.yLength - 1);
            shouldMoveOn = shouldTrace && (this.answerGrid[lastY + 1][p_x] != SPACE.OPEN);
            if (shouldMoveOn) {
                lastY++;
            }
        } while (shouldMoveOn);
        if (shouldTrace) {
            this.traceRoad(p_x, p_y + 1, p_x, lastY, CURVING_WAY.VERTICAL);
            lastY--;
        }
        //Down then right, followed by down then left
        for (y = p_y + 1; y <= lastY; y++) {
            lastX = p_x;
            do {
                shouldTrace = (lastX < this.xLength - 1);
                shouldMoveOn = (shouldTrace && this.answerGrid[y][lastX + 1] != SPACE.OPEN);
                if (shouldMoveOn) {
                    lastX++;
                }
            } while (shouldMoveOn);
            if (shouldTrace) {
                this.traceRoad(lastX, p_y + 1, p_x, y, CURVING_WAY.LEFT_VERTICAL);
            }
            lastX = p_x;
            do {
                shouldTrace = (lastX > 0);
                shouldMoveOn = (shouldTrace && this.answerGrid[y][lastX - 1] != SPACE.OPEN);
                if (shouldMoveOn) {
                    lastX--;
                }
            } while (shouldMoveOn);
            if (shouldTrace) {
                this.traceRoad(lastX, p_y + 1, p_x, y, CURVING_WAY.RIGHT_VERTICAL);
                lastX++;
            }
        }
    }

    // Left then down (like "right only" and "right then down" except we don't trace the left only
    if (!leftColumn) {
        lastX = p_x;
        do {
            shouldTrace = (lastX > 0);
            shouldMoveOn = (shouldTrace && this.answerGrid[p_y][lastX - 1] != SPACE.OPEN);
            if (shouldMoveOn) {
                lastX--;
            }
        } while (shouldMoveOn);
        for (x = p_x - 1; x >= lastX; x--) {
            lastY = p_y;
            do {
                shouldTrace = (lastY < this.yLength - 1);
                shouldMoveOn = (shouldTrace && this.answerGrid[lastY + 1][x] != SPACE.OPEN);
                if (shouldMoveOn) {
                    lastY++;
                }
            } while (shouldMoveOn);
            if (shouldTrace) {
                this.traceRoad(p_x - 1, lastY, x, p_y, CURVING_WAY.LEFT_VERTICAL);
            }
        }
    }
}

// Adds the following links : (xEnd,yJunction <=> xJunction,yJunction) and (xJunction,yJunction <=> xJunction,yEnd)
// Including both end spaces and only once the junction space.
SolverCurvingRoad.prototype.traceRoad = function (p_xEnd, p_yEnd, p_xJunction, p_yJunction, p_way) {
    const index = this.curvingLinkList.length;
    const xMin = Math.min(p_xEnd, p_xJunction);
    const xMax = Math.max(p_xEnd, p_xJunction);
    const yMin = Math.min(p_yEnd, p_yJunction);
    const yMax = Math.max(p_yEnd, p_yJunction);
    this.curvingLinkList.push({
        humanRead: "",
        horizontalAxis: null,
        verticalAxis: null,
        point: null,
        valid: true,
        undecided: xMax - xMin + yMax - yMin + 1,
        closeds: 0
    });
    if (xMin != xMax) {
        this.curvingLinkList[index].horizontalAxis = {
            xMin: xMin,
            xMax: xMax,
            y: p_yJunction
        }
        this.curvingLinkList[index].humanRead += "(" + xMin + "-" + xMax + "," + p_yJunction + ") ";
    }
    if (yMin != yMax) {
        this.curvingLinkList[index].verticalAxis = {
            yMin: yMin,
            yMax: yMax,
            x: p_xJunction
        }
        this.curvingLinkList[index].humanRead += "(" + p_xJunction + "," + yMin + "-" + yMax + ") ";
    } else if (xMin == xMax) {
        this.curvingLinkList[index].point = {
            x: xMin,
            y: yMin
        }
        this.curvingLinkList[index].humanRead = "(" + xMin + "," + yMin + ")";
    }

    for (var x = xMin + 1; x <= xMax - 1; x++) {
        this.curvingLinkArray[p_yJunction][x].push(index);
    }
    for (var y = yMin + 1; y <= yMax - 1; y++) {
        this.curvingLinkArray[y][p_xJunction].push(index);
    }
    this.curvingLinkArray[p_yJunction][p_xJunction].push(index);
    if (p_yEnd != p_yJunction) {
        this.curvingLinkArray[p_yEnd][p_xJunction].push(index);
    }
    if (p_xEnd != p_xJunction) {
        this.curvingLinkArray[p_yJunction][p_xEnd].push(index);
    }
}

// Note : links are built in a way no bended link (with both an horizontal and a vertical link) can be contained.
function contains(p_linkContainer, p_linkContainee) {
    if (p_linkContainee.point != null) {
        const x = p_linkContainee.point.x;
        const y = p_linkContainee.point.y;
        if ((p_linkContainer.point != null) && (p_linkContainer.point.x == x) && (p_linkContainer.point.y == y)) {
            return true;
        } else {
            const hAxis = p_linkContainer.horizontalAxis;
            if (hAxis != null && hAxis.y == y && hAxis.xMin <= x && hAxis.xMax >= x) {
                return true;
            }
            const vAxis = p_linkContainer.verticalAxis;
            if (vAxis != null && vAxis.x == x && vAxis.yMin <= y && vAxis.yMax >= y) {
                return true;
            }
            return false;
        }
    }

    const hAxisIn = p_linkContainee.horizontalAxis;
    const vAxisIn = p_linkContainee.verticalAxis;
    var hContain = false;
    var vContain = false;
    //Horizontal check
    if (hAxisIn == null) {
        hContain = true;
    } else {
        const hAxis = p_linkContainer.horizontalAxis;
        hContain = (hAxis != null && hAxis.y == hAxisIn.y && hAxis.xMin <= hAxisIn.xMin && hAxis.xMax >= hAxisIn.xMax);
    }
    if (!hContain) {
        return false;
    }
    //Then vertical check
    if (vAxisIn == null) {
        vContain = true;
    } else {
        const vAxis = p_linkContainer.verticalAxis;
        vContain = (vAxis != null && vAxis.x == vAxisIn.x && vAxis.yMin <= vAxisIn.yMin && vAxis.yMax >= vAxisIn.yMax);
    }
    return vContain;
}

SolverCurvingRoad.prototype.determineInvalidRoadsFrom = function (p_x, p_y) {
    var array = this.curvingLinkArray[p_y][p_x];
    var i,
    j;
    var aI,
    aJ;
    for (i = 0; i < array.length; i++) {
        aI = array[i];
        if (this.curvingLinkList[aI].valid) {
            for (j = 0; j < i; j++) {
                aJ = array[j];
                if (contains(this.curvingLinkList[aI], this.curvingLinkList[aJ])) {
                    this.curvingLinkList[aI].valid = false;
                } else {
                    if (contains(this.curvingLinkList[aJ], this.curvingLinkList[aI])) {
                        this.curvingLinkList[aJ].valid = false;
                    }
                }
            }
        }
    }
}

// On aurait pu purger les routes d'une case p_x,p_y donnée juste après avoir déterminé si les routes de cette case sont valides ou non...
// Mais c'est pas bon du tout. Une route peut très bien être valide sur une case et devenir invalide lorsqu'on explore la case suivante.
// Pour rappel, une route est invalide lorsqu'elle contient entièrement une autre route. C'est la logique de ce casse-tête.
SolverCurvingRoad.prototype.purgeRoadsFrom = function (p_x, p_y) {
    // array = array.filter(function(index) {return this.curvingLinkList[index].valid;});*/
    // Malheureusement, le this à l'intérieur de cette fonction est un window. Je suis donc obligé de faire un filtrage manuel. (ce que je voulais faire au départ, soi-dit en passant, mais il n'y a pas de méthode delete ???)
    var array = this.curvingLinkArray[p_y][p_x];
    var newArray = [];
    for (i = 0; i < array.length; i++) {
        if (this.curvingLinkList[array[i]].valid == true) {
            newArray.push(array[i]);
        } else {
            this.curvingLinkList[array[i]].humanRead = "";
        }
    }
    //array = newArray;
    // Réaffecter array ne change pas la variable qui était référencée (case de this.curvingLinkArray dans notre cas)
    this.curvingLinkArray[p_y][p_x] = newArray.slice();
}

SolverCurvingRoad.prototype.getAnswer = function (p_x, p_y) {
    return this.answerGrid[p_y][p_x];
}

SolverCurvingRoad.prototype.getPearl = function (p_x, p_y) {
    return this.pearlGrid[p_y][p_x];
}

//--------------------------------
SolverCurvingRoad.prototype.emitHypothesis = function (p_x, p_y, p_symbol) {
    this.tryToPutNew(p_x, p_y, p_symbol);
}

//--------------------------------

SolverCurvingRoad.prototype.putNew = function (p_x, p_y, p_symbol) {
    if ((p_x < 0) || (p_y < 0) || (p_x >= this.xLength) || (p_y >= this.yLength) || (this.answerGrid[p_y][p_x] == p_symbol)) {
        return RESULT.HARMLESS;
    }
    if (this.answerGrid[p_y][p_x] != SPACE.UNDECIDED) {
        return RESULT.FAILURE;
    }
    this.answerGrid[p_y][p_x] = p_symbol;
    this.curvingLinkArray[p_y][p_x].forEach(
        index => {
        this.curvingLinkList[index].undecided--;
        if (p_symbol == SPACE.CLOSED) {
            this.curvingLinkList[index].closeds++;
        }
    });
    return RESULT.SUCCESS;
}

SolverCurvingRoad.prototype.tryToPutNew = function (p_x, p_y, p_symbol) {
    var listEventsToApply = [SpaceEvent(p_x, p_y, p_symbol)];
    var eventBeingApplied;
    var eventsApplied = [];
    var ok = true;
    var result;
    var x,
    y,
    symbol;
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
                // Deduction time !
                if (symbol == SPACE.CLOSED) {
                    listEventsToApply.push(SpaceEvent(x, y - 1, SPACE.OPEN));
                    listEventsToApply.push(SpaceEvent(x, y + 1, SPACE.OPEN));
                    listEventsToApply.push(SpaceEvent(x - 1, y, SPACE.OPEN));
                    listEventsToApply.push(SpaceEvent(x + 1, y, SPACE.OPEN));

                    //Add a closed space. Refer to theorical cluster solver for more details about this part.
                    newClosedSpaces.push({
                        x: x,
                        y: y
                    });

                } else {

                    //The first open space.  Refer to theorical cluster solver for more details about this part.
                    if (!this.atLeastOneOpen) {
                        eventsApplied.push({
                            firstOpen: true
                        });
                        this.atLeastOneOpen = true;
                        firstOpenThisTime = true;
                    }

                    this.curvingLinkArray[y][x].forEach(index => {
                        listEventsToApply = this.testAlertCurvingList(listEventsToApply, index); 
                    });
                }
                eventsApplied.push(eventBeingApplied);
            }
        }

        if (ok) {
            // Geographical verification. Refer to theorical cluster solver for more details about this part.

            if (firstOpenThisTime) {
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
                geoV = this.geographicalVerification(newClosedSpaces);
                listEventsToApply = geoV.listEventsToApply;
                if (geoV.listEventsApplied) {
                    Array.prototype.push.apply(eventsApplied, geoV.listEventsApplied);
                }
                ok = (geoV.result == RESULT.SUCCESS);
            }
        }
    }
    if (!ok) {
        this.undoEventList(eventsApplied);
    } else if (eventsApplied.length > 0) {
        this.happenedEvents.push(eventsApplied); //TODO dire que ça vient d'une hypothèse !
    }
}

//The geograhical modification and its closure. More details at theory cluster solver.
SolverCurvingRoad.prototype.adjacencyClosure = function (p_grid) {
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
};

SolverCurvingRoad.prototype.geographicalVerification = function (p_listNewXs) {
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

SolverCurvingRoad.prototype.testAlertCurvingList = function (p_listEvents, p_index) {
    const curvingLink = this.curvingLinkList[p_index];
    if (curvingLink.undecided == 1 && curvingLink.closeds == 0) {
        var xSpot,
        ySpot;
        xSpot = -1;
        var axis = curvingLink.horizontalAxis;
        if (axis != null) {
            var y = axis.y;
            for (var x = axis.xMin; x <= axis.xMax; x++) {
                if (this.answerGrid[y][x] == SPACE.UNDECIDED) {
                    xSpot = x;
                    ySpot = y;
                    break;
                }
            }
        }
        if (xSpot == -1) {
            axis = curvingLink.verticalAxis;
            var x = axis.x;
            for (var y = axis.yMin; y <= axis.yMax; y++) {
                if (this.answerGrid[y][x] == SPACE.UNDECIDED) {
                    xSpot = x;
                    ySpot = y;
                    break;
                }
            }
        }
        p_listEvents.push(new SpaceEvent(xSpot, ySpot, SPACE.CLOSED));
    }
    return p_listEvents;
}

// Quick start

/**
Used by outside !
 */
SolverCurvingRoad.prototype.quickStart = function () {
    this.curvingLinkList.forEach(curvingLink => {
        if (curvingLink.valid && (curvingLink.point != null)) {
            this.emitHypothesis(curvingLink.point.x, curvingLink.point.y, SPACE.CLOSED);
        }
    });
}

//--------------------
// Undoing
SolverCurvingRoad.prototype.undoEvent = function (p_event) {
    if (p_event.kind == EVENT_KIND.SPACE) {
        const x = p_event.x;
        const y = p_event.y;
        const symbol = p_event.symbol;
        this.answerGrid[y][x] = SPACE.UNDECIDED;
		this.curvingLinkArray[y][x].forEach(
			index => {
			this.curvingLinkList[index].undecided++;
			if (symbol == SPACE.CLOSED) {
				this.curvingLinkList[index].closeds--;
			}
		});
		
		
    } else if (p_event.adjacency) {
        const aals = this.adjacencyLimitSpacesList.pop(); //aals = added adjacency limit space
        this.adjacencyLimitGrid[aals.y][aals.x] = aals.formerValue;
    } else if (p_event.firstOpen) {
        this.atLeastOneOpen = false;
    }

}

SolverCurvingRoad.prototype.undoEventList = function (p_eventsList) {
    p_eventsList.forEach(solveEvent => this.undoEvent(solveEvent));
}

/**
Used by outside !
 */
SolverCurvingRoad.prototype.undoToLastHypothesis = function () {
    if (this.happenedEvents.length > 0) {
        var lastEventsList = this.happenedEvents.pop();
        this.undoEventList(lastEventsList);
    }
}
