const NOT_FORCED = -1;
const NOT_RELEVANT = -1;
const SPACE = {OPEN :'O',CLOSED:'C', UNDECIDED :'-'};
const RESULT = {
SUCCESS : 3,
FAILURE : 1,
HARMLESS : 2
}
const EVENTLIST_KIND = {HYPOTHESIS:"H",PASS:"P"};
const CURVING_WAY = {LEFT_VERTICAL : 'L', RIGHT_VERTICAL : 'R', HORIZONTAL : 'H', VERTICAL : 'V'}



function SolverCurvingRoad(p_wallArray,p_symbolArray) {
	this.construct(p_wallArray,p_symbolArray);
}

SolverCurvingRoad.prototype.construct = function(p_wallArray,p_symbolArray) {
	this.xLength = p_symbolArray[0].length;
	this.yLength = p_symbolArray.length;
	this.wallGrid = WallGrid_data(p_wallArray); 
	this.happenedEvents = [];
	var ix,iy;
	
	// TODO need purification
	this.answerGrid = [];
	this.curvingLinkArray = [];
	this.curvingLinkList = [];
	for(iy = 0; iy < this.yLength ; iy++) {
		this.answerGrid.push([]);		
		this.curvingLinkArray.push([]);
		for (ix = 0; ix < this.xLength ; ix++) {
			this.curvingLinkArray[iy].push([]);
			if (p_symbolArray[iy][ix] == SYMBOL_ID.WHITE) {
				this.answerGrid[iy].push(SPACE.OPEN);
			} else {
				this.answerGrid[iy].push(SPACE.UNDECIDED);
			}
		}
	}
	
	for(iy = 0; iy < this.yLength ; iy++) {
		for (ix = 0; ix < this.xLength ; ix++) {
			if (p_symbolArray[iy][ix] == SYMBOL_ID.WHITE) {
				this.traceRoadsFrom(ix, iy);
			}
		}
	}
	for(iy = 0; iy < this.yLength ; iy++) {
		for (ix = 0; ix < this.xLength ; ix++) {
			this.purgeRoadsFrom(ix, iy);
		}
	}
		
	// Below fields are for adjacency "all spaces with ... must form a orthogonally contiguous area"
	this.atLeastOneOpen = false;
	this.adjacencyLimitGrid = createAdjacencyLimitGrid(this.xLength, this.yLength);
    this.adjacencyLimitSpacesList = [];
}

SolverCurvingRoad.prototype.traceRoadsFrom = function(p_x, p_y) {
	var bottomRow = (p_y == this.yLength-1);
	var rightColumn = (p_x == this.xLength-1);
	var leftColumn = (p_x == 0); 
	var lastX, lastY;
	var x,y;
	var shouldMoveOn;
	var shouldTrace;
	//TODO je m'en fiche, il y a beaucoup de redondances, mais on ne vérifie pas si un lien est contenu dans un autre !
	//answerGrid should have been updated by now ; anyway, open in answerGrid refers to "white" spaces.
	if (!rightColumn) {
		lastX = p_x; //Right only
		do { 
			shouldTrace = (lastX < this.xLength-1);
			shouldMoveOn = shouldTrace && (this.answerGrid[p_y][lastX+1] != SPACE.OPEN);  
			if (shouldMoveOn) {
				lastX++;
			}
		} while (shouldMoveOn);
		if (shouldTrace) {
			this.traceRoad(p_x+1, p_y, lastX, p_y, CURVING_WAY.HORIZONTAL);    
			lastX--;
		} 
		if (!bottomRow) { // Right then down 
			for (x = p_x+1; x <= lastX ; x++) {
				lastY = p_y;
				do {
					shouldTrace = (lastY < this.yLength-1);
					shouldMoveOn = (shouldTrace && this.answerGrid[lastY+1][x] != SPACE.OPEN);
					if (shouldMoveOn) {
						lastY++;
					}
				} while (shouldMoveOn);
				if (shouldTrace) {
					this.traceRoad(p_x+1, lastY, x, p_y, CURVING_WAY.RIGHT_VERTICAL);
				}
			}
		}
	} 
	
	//Down only
	if (!bottomRow) {
		lastY = p_y;
		do {
			shouldTrace = (lastY < this.yLength-1);
			shouldMoveOn = shouldTrace && (this.answerGrid[lastY+1][p_x] != SPACE.OPEN);  
			if (shouldMoveOn) {
				lastY++;
			}
		} while (shouldMoveOn);
		if (shouldTrace) {
			this.traceRoad(p_x, p_y+1, p_x, lastY, CURVING_WAY.VERTICAL);  
			lastY--;
		}
		//Down then right, followed by down then left
		for(y = p_y+1; y <= lastY ; y++) {
			lastX = p_x;
			do {
				shouldTrace = (lastX < this.xLength-1);
				shouldMoveOn = (shouldTrace && this.answerGrid[y][lastX+1] != SPACE.OPEN);
				if (shouldMoveOn) {
					lastX++;
				}
			} while (shouldMoveOn);
			if (shouldTrace) {			
				this.traceRoad(lastX,p_y+1,p_x, y, CURVING_WAY.LEFT_VERTICAL);
			}
			lastX = p_x;
			do {
				shouldTrace = (lastX > 0);
				shouldMoveOn = (shouldTrace && this.answerGrid[y][lastX-1] != SPACE.OPEN);
				if (shouldMoveOn) {
					lastX--;
				}
			} while (shouldMoveOn);
			if (shouldTrace) {			
				this.traceRoad(lastX, p_y+1, p_x, y, CURVING_WAY.RIGHT_VERTICAL);
				lastX++;
			}
		}
	}

	// Left then down (like "right only" and "right then down" except we don't trace the left only
	if (!leftColumn) { 
		lastX = p_x; 
		do { 
			shouldTrace = (lastX > 0);
			shouldMoveOn = (shouldTrace && this.answerGrid[p_y][lastX-1] != SPACE.OPEN);  
			if (shouldMoveOn) {
				lastX--;
			}
		} while (shouldMoveOn);
		for (x = p_x-1; x >= lastX ; x--) { 
			lastY = p_y;
			do {
				shouldTrace = (lastY < this.yLength-1);
				shouldMoveOn = (shouldTrace && this.answerGrid[lastY+1][x] != SPACE.OPEN);
				if (shouldMoveOn) {
					lastY++;
				}
			} while (shouldMoveOn);
			if (shouldTrace) {
				this.traceRoad(p_x-1, lastY, x, p_y, CURVING_WAY.LEFT_VERTICAL);
			}
		}
	}
}

// Adds the following links : (xEnd,yJunction <=> xJunction,yJunction) and (xJunction,yJunction <=> xJunction,yEnd) 
// Including both end spaces and only once the junction space.
SolverCurvingRoad.prototype.traceRoad = function(p_xEnd, p_yEnd, p_xJunction, p_yJunction, p_way) {
	const index = this.curvingLinkList.length;
	const xMin = Math.min(p_xEnd, p_xJunction);
	const xMax = Math.max(p_xEnd, p_xJunction);
	const yMin = Math.min(p_yEnd, p_yJunction);
	const yMax = Math.max(p_yEnd, p_yJunction);
	this.curvingLinkList.push({
		humanRead : "",
	    horizontalAxis : null,
	    verticalAxis : null,
		point : null,
		valid : true,
	    undecided: xMax - xMin + yMax - yMin + 1,
	    closeds: 0
	});
	if (xMin != xMax) {
		this.curvingLinkList[index].horizontalAxis = {
	        xMin: xMin,
	        xMax: xMax,
	        y: p_yJunction
	    }
		this.curvingLinkList[index].humanRead += "("+xMin+"-"+xMax+","+p_yJunction+") ";
	}
	if (yMin != yMax) {
		this.curvingLinkList[index].verticalAxis = {
	        yMin: yMin,
	        yMax: yMax,
	        x: p_xJunction
	    }
		this.curvingLinkList[index].humanRead += "("+p_xJunction+","+yMin+"-"+yMax+") ";
	} else if (xMin == xMax) {
		this.curvingLinkList[index].point = {
			x : xMin,
			y : yMin
		}
		this.curvingLinkList[index].humanRead = "("+xMin+","+yMin+")";
	}
	
	for(var x = xMin+1; x <= xMax-1; x++) {
		this.curvingLinkArray[p_yJunction][x].push(index);
	}
	for(var y = yMin+1; y <= yMax-1; y++) {
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
		hContain =  (hAxis != null && hAxis.y == hAxisIn.y && hAxis.xMin <= hAxisIn.xMin && hAxis.xMax >= hAxisIn.xMax);
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

SolverCurvingRoad.prototype.purgeRoadsFrom = function(p_x, p_y) {
	var array = this.curvingLinkArray[p_y][p_x];
	var i,j;
	var aI, aJ;
	for (i = 0 ; i < array.length ; i++) {
		aI = array[i];
		if (this.curvingLinkList[aI].valid) {
			for (j = 0; j < i ; j++) {
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
	
	// Remove all links to invalid indexes
	
	/*array = array.filter(
		function(index) {
			return this.curvingLinkList[index].valid;
		}
	);*/ // Malheureusement, le this à l'intérieur de cette fonction est un window. Je suis donc obligé de faire un filtrage manuel. (ce que je voulais faire au départ, soi-dit en passant, mais il n'y a pas de méthode delete ???)
	var newArray = [];
	for (i = 0 ; i < array.length ; i++) {
		if (this.curvingLinkList[array[i]].valid) {
			newArray.push(array[i]);
		} else {
			this.curvingLinkList[array[i]].humanRead = ""; 
		}
	}
	//array = newArray; // Réaffecter array ne change pas la variable qui était référencée (case de this.curvingLinkArray dans notre cas)
	this.curvingLinkArray[p_y][p_x] = newArray;
}

SolverCurvingRoad.prototype.getAnswer = function(p_x,p_y){
	return this.answerGrid[p_y][p_x];
}

//--------------------------------
SolverCurvingRoad.prototype.emitHypothesis = function(p_x,p_y,p_symbol){
	this.tryToPutNew(p_x,p_y,p_symbol);
}

//--------------------------------

SolverCurvingRoad.prototype.putNew = function(p_x,p_y,p_symbol){
	if ((p_x < 0) || (p_y < 0) || (p_x >= this.xLength) || (p_y >= this.yLength) || (this.answerGrid[p_y][p_x] == p_symbol)){
		return RESULT.HARMLESS;
	}
	if (this.answerGrid[p_y][p_x] != SPACE.UNDECIDED){
		return RESULT.FAILURE;
	}
	this.answerGrid[p_y][p_x] = p_symbol;
	/*var ir = this.regionGrid[p_y][p_x];
	var region = this.regions[ir];
	if (region.notPlacedYet != null){
		if (p_symbol == SPACE.OPEN){
			region.notPlacedYet.OPENs--;
		} else if (p_symbol == SPACE.CLOSED){
			region.notPlacedYet.CLOSEDs--;
		}
	}*/
	return RESULT.SUCCESS;
}


SolverCurvingRoad.prototype.tryToPutNew = function(p_x,p_y,p_symbol){
	/*var listEventsToApply = [SpaceEvent(p_x,p_y,p_symbol)];
	var eventBeingApplied;
	var eventsApplied = [];
	var ok = true;
	var result;
	var x,y,symbol;
	var ir,region;
	var i,alertSpace,xa,ya;
	while (ok && listEventsToApply.length > 0){
		// Overall (classical + geographical) verification
		newClosedSpaces = [];
        firstOpenThisTime = false;
		while (ok && listEventsToApply.length > 0){
			// Classical verification
			eventBeingApplied = listEventsToApply.pop();
			x = eventBeingApplied.x;
			y = eventBeingApplied.y;
			symbol = eventBeingApplied.symbol;
			result = this.putNew(x, y, symbol);
			
			if (result == RESULT.FAILURE){
				ok = false;
			}
			if (result == RESULT.SUCCESS){
				// Deduction time !
				
				ir = this.regionGrid[y][x];
				region = this.regions[ir];
				if (symbol == SPACE.CLOSED){				
					listEventsToApply.push(SpaceEvent(x,y-1,SPACE.OPEN));
					listEventsToApply.push(SpaceEvent(x,y+1,SPACE.OPEN));
					listEventsToApply.push(SpaceEvent(x-1,y,SPACE.OPEN));
					listEventsToApply.push(SpaceEvent(x+1,y,SPACE.OPEN));	
					//Alert on region
					if (region.notPlacedYet != null && region.notPlacedYet.CLOSEDs == 0){
						listEventsToApply = this.alertRegion(listEventsToApply,ir,SPACE.OPEN,region.notPlacedYet.OPENs);			
					}
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
					
					stripSpace = this.stripGrid[y][x];
					listEventsToApply = this.testAlertHorizontalStrip(listEventsToApply,stripSpace.leftMost);
					listEventsToApply = this.testAlertHorizontalStrip(listEventsToApply,stripSpace.horizIn);
					listEventsToApply = this.testAlertHorizontalStrip(listEventsToApply,stripSpace.rightMost);
					listEventsToApply = this.testAlertVerticalStrip(listEventsToApply,stripSpace.topMost);
					listEventsToApply = this.testAlertVerticalStrip(listEventsToApply,stripSpace.vertIn);
					listEventsToApply = this.testAlertVerticalStrip(listEventsToApply,stripSpace.bottomMost);
					//Alert on region
					if (region.notPlacedYet != null && region.notPlacedYet.OPENs == 0){
						listEventsToApply = this.alertRegion(listEventsToApply,ir,SPACE.CLOSED,region.notPlacedYet.CLOSEDs);			
					}
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
	if (!ok){
		this.undoEventList(eventsApplied);
	} else if (eventsApplied.length > 0) {
		this.happenedEvents.push(eventsApplied); //TODO dire que ça vient d'une hypothèse !
	}*/
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

// Classic logical verifications 
SolverCurvingRoad.prototype.testAlertHorizontalStrip = function(p_eventsList,p_index){
	if (p_index != NOT_RELEVANT && this.horizontalStripes[p_index].CLOSEDs == 0 && this.horizontalStripes[p_index].UNDEFs == 1){
		const y = this.horizontalStripes[p_index].row;
		var ix = this.horizontalStripes[p_index].xStart;
		while(this.answerGrid[y][ix] == SPACE.OPEN){
			ix++;
		}
		p_eventsList.push(SpaceEvent(ix,y,SPACE.CLOSED));
	}
	return p_eventsList;
}

SolverCurvingRoad.prototype.testAlertVerticalStrip = function(p_eventsList,p_index){
	if (p_index != NOT_RELEVANT && this.verticalStripes[p_index].CLOSEDs == 0 && this.verticalStripes[p_index].UNDEFs == 1){
		const x = this.verticalStripes[p_index].column;
		var iy = this.verticalStripes[p_index].yStart;
		while(this.answerGrid[iy][x] == SPACE.OPEN){
			iy++;
		}
		p_eventsList.push(SpaceEvent(x,iy,SPACE.CLOSED));
	}
	return p_eventsList;
}

SolverCurvingRoad.prototype.alertRegion = function(p_listEvents,p_regionIndex,p_missingSymbol,p_missingNumber){
	const region = this.regions[p_regionIndex];
	var xa,ya,alertSpace;
	var remaining = p_missingNumber
	for(var i = 0;i<region.size;i++){
		alertSpace = region.spaces[i];
		xa = alertSpace.x;
		ya = alertSpace.y;
		if (this.answerGrid[ya][xa] == SPACE.UNDECIDED){
			p_listEvents.push(SpaceEvent(xa,ya,p_missingSymbol));
			remaining--;
			if (remaining == 0){
				break;
			}
		}
	}
	return p_listEvents;
}

//--------------------
// Quick start 

/**
Used by outside !
*/
SolverCurvingRoad.prototype.quickStart = function(){
	this.regions.forEach(region => {
		if (region.size == 1 && region.notPlacedYet != null && region.notPlacedYet.CLOSEDs == 1){
			this.tryToPutNew(region.spaces[0].x,region.spaces[0].y,SPACE.CLOSED);
		};
		if (region.notPlacedYet != null && region.notPlacedYet.CLOSEDs == 0){
			region.spaces.forEach(space => {
				this.tryToPutNew(space.x,space.y,SPACE.OPEN);
			});
		}
	});
}

//--------------------
// Undoing

SolverCurvingRoad.prototype.undoEvent = function(p_event){
	if (p_event.kind == EVENT_KIND.SPACE) {
		const x = p_event.x;
		const y = p_event.y;
		const symbol = p_event.symbol;
		this.answerGrid[y][x] = SPACE.UNDECIDED;
			var ir = this.regionGrid[y][x];
		var region = this.regions[ir];
		if (region.notPlacedYet != null){
			if (symbol == SPACE.OPEN){
				region.notPlacedYet.OPENs++;
			} else if (symbol == SPACE.CLOSED){
				region.notPlacedYet.CLOSEDs++;
			}
		}
		const stripSpace = this.stripGrid[y][x];
		this.raiseHorizontalStrip(stripSpace.leftMost,symbol);
		this.raiseHorizontalStrip(stripSpace.horizIn,symbol);
		this.raiseHorizontalStrip(stripSpace.rightMost,symbol);	
		this.raiseVerticalStrip(stripSpace.topMost,symbol);
		this.raiseVerticalStrip(stripSpace.vertIn,symbol);
		this.raiseVerticalStrip(stripSpace.bottomMost,symbol);
	} else if (p_event.adjacency) {
        const aals = this.adjacencyLimitSpacesList.pop(); //aals = added adjacency limit space
        this.adjacencyLimitGrid[aals.y][aals.x] = aals.formerValue;
    } else if (p_event.firstOpen) {
        this.atLeastOneOpen = false;
    }
	
}

SolverCurvingRoad.prototype.undoEventList = function(p_eventsList){
	p_eventsList.forEach(solveEvent => this.undoEvent(solveEvent));
}

/**
Used by outside !
*/
SolverCurvingRoad.prototype.undoToLastHypothesis = function(){
	if (this.happenedEvents.length > 0){
		var lastEventsList = this.happenedEvents.pop();
		this.undoEventList(lastEventsList);
	}
}