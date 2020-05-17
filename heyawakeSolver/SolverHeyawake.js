const NOT_FORCED = -1;
const NOT_RELEVANT = -1;
const SPACE = {OPEN :'O',CLOSED:'C', UNDECIDED :'-'};
const RESULT = {
SUCCESS : 3,
FAILURE : 1,
HARMLESS : 2
}
const EVENTLIST_KIND = {HYPOTHESIS:"H",PASS:"P"};

function SolverHeyawake(p_wallArray,p_numberGrid){
	this.construct(p_wallArray,p_numberGrid);
}

SolverHeyawake.prototype.construct = function(p_wallArray,p_numberGrid){
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.wallGrid = new WallGrid(p_wallArray,this.xLength,this.yLength); 
	this.regionGrid = this.wallGrid.toRegionGrid();
	this.answerGrid = [];
	this.stripGrid = [];
	this.horizontalStripes = [];
	this.verticalStripes = [];
	this.happenedEvents = [];
	var ix,iy;
	var lastRegionNumber = 0;
	// Below fields are for adjacency "all spaces with ... must form a orthogonally contiguous area"
	this.atLeastOneOpen = false;
	this.adjacencyLimitGrid = createAdjacencyLimitGrid(this.xLength, this.yLength);
    this.adjacencyLimitSpacesList = [];
	
	// Initialize the required grids (notably answerGrid) and the number of regions
	for(iy = 0;iy < this.yLength;iy++){
		this.answerGrid.push([]);
		this.stripGrid.push([]);
		for(ix = 0;ix < this.xLength;ix++){
			lastRegionNumber = Math.max(this.regionGrid[iy][ix],lastRegionNumber);
			this.answerGrid[iy].push(SPACE.UNDECIDED);
			this.stripGrid[iy].push({leftMost:NOT_RELEVANT,horizIn:NOT_RELEVANT,rightMost:NOT_RELEVANT,topMost:NOT_RELEVANT,vertIn:NOT_RELEVANT,bottomMost:NOT_RELEVANT});
		}
	}
	this.regionsNumber = lastRegionNumber+1;
	
	// Blantly initialize data of regions
	var ir;
	this.regions = [];
	for(ir=0;ir<this.regionsNumber;ir++){
		this.regions.push({
			spaces : [],
			expectedNumberOfOsInRegion : NOT_FORCED,
			notPlacedYet : null,
			size : 0,
			horizontalInnerStripesIndexes : [],
			verticalInnerStripesIndexes : [] 
		});
	}
	
	// Now that region data are created : 
	// Initialize spaces by region + for those with a value, numbers of Os to place in notPlaced yet
	var number, region;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			ir = this.regionGrid[iy][ix];
			number = p_numberGrid[iy][ix];
			region = this.regions[ir];
			region.spaces.push({x:ix,y:iy});
			if (number != null){
				region.expectedNumberOfOsInRegion = number;
				region.notPlacedYet = {CLOSEDs : number};
			}
		}
	}
	
	// Initialize numbers of Xs to place (now that all region spaces are known)
	// Also initialize regions sizes for shortcut
	for(ir = 0;ir<this.regionsNumber;ir++){
		region = this.regions[ir];
		region.size = region.spaces.length;
		if (region.notPlacedYet != null){
			region.notPlacedYet.OPENs = region.size-region.notPlacedYet.CLOSEDs;
		}
	}
	
	//And now, the stripes for Heyawake ! (ie the smallest series of contiguous aligned spaces that cross 2 borders)
	var endStrip;
	var indexStrip;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			//If it has a right boundary, draw an horizontal band to the right boundary if it exists.
			if (this.wallGrid.getWallR(ix,iy) == WALLGRID.CLOSED){
				endStrip = ix+1;
				while (endStrip < this.xLength-1 && this.wallGrid.getState(endStrip+1,iy) != WALLGRID.CLOSED && this.wallGrid.getWallR(endStrip,iy) != WALLGRID.CLOSED){
					endStrip++;
				}
				endStrip++; 
				//Right now, endStrip corresponds to "the right of a boundary" or "a banned/out-of-bounds space"
				if (endStrip < this.xLength && this.wallGrid.getState(endStrip,iy) != WALLGRID.CLOSED){
					//We met a true region boundary ? Fine, to work now !
					irInner = this.regionGrid[iy][ix+1]; //Region of the inner grid
					indexStrip = this.horizontalStripes.length;
					this.regions[irInner].horizontalInnerStripesIndexes.push(indexStrip);
					this.stripGrid[iy][ix].leftMost = indexStrip;
					this.stripGrid[iy][endStrip].rightMost = indexStrip;
					for(var ix2 = ix+1; ix2 < endStrip ; ix2++){
						this.stripGrid[iy][ix2].horizIn = indexStrip;
					}
					this.horizontalStripes.push({row:iy,xStart:ix,xEnd:endStrip, UNDEFs: endStrip-ix+1, CLOSEDs:0});
				}
			}
			//Same down.
			if (this.wallGrid.getWallD(ix,iy) == WALLGRID.CLOSED){
				endStrip = iy+1;
				while (endStrip < this.yLength-1 && this.wallGrid.getState(ix,endStrip+1) != WALLGRID.CLOSED && this.wallGrid.getWallD(ix,endStrip) != WALLGRID.CLOSED){
					endStrip++;
				}
				endStrip++; 
				// ... "the bottom of a boundary" ... "a banned/out-of-bounds space"
				if (endStrip < this.yLength && this.wallGrid.getState(ix,endStrip) != WALLGRID.CLOSED){
					irInner = this.regionGrid[iy+1][ix]; 
					indexStrip = this.verticalStripes.length;
					this.regions[irInner].verticalInnerStripesIndexes.push(indexStrip);
					this.stripGrid[iy][ix].topMost = indexStrip;
					this.stripGrid[endStrip][ix].bottomMost = indexStrip;
					for(var iy2 = iy+1; iy2 < endStrip ; iy2++){
						this.stripGrid[iy2][ix].vertIn = indexStrip;
					}
					this.verticalStripes.push({column:ix,yStart:iy,yEnd:endStrip, UNDEFs: endStrip-iy+1, CLOSEDs:0});
				}
			}
		}
	}
	
	//Note : grid not purified.
}

SolverHeyawake.prototype.expectedNumberInRegion = function(ir){
	return this.regions[ir].expectedNumberOfOsInRegion;
}

SolverHeyawake.prototype.getSpaceCoordinates = function(p_indexRegion,p_indexSpace){
	return this.regions[p_indexRegion].spaces[p_indexSpace];
}

SolverHeyawake.prototype.getAnswer = function(p_x,p_y){
	return this.answerGrid[p_y][p_x];
}

//--------------------------------
SolverHeyawake.prototype.emitHypothesis = function(p_x,p_y,p_symbol){
	this.tryToPutNew(p_x,p_y,p_symbol);
}

//--------------------------------

SolverHeyawake.prototype.putNew = function(p_x,p_y,p_symbol){
	if ((p_x < 0) || (p_y < 0) || (p_x >= this.xLength) || (p_y >= this.yLength) || (this.answerGrid[p_y][p_x] == p_symbol)){
		return RESULT.HARMLESS;
	}
	if (this.answerGrid[p_y][p_x] != SPACE.UNDECIDED){
		return RESULT.FAILURE;
	}
	this.answerGrid[p_y][p_x] = p_symbol;
	var ir = this.regionGrid[p_y][p_x];
	var region = this.regions[ir];
	if (region.notPlacedYet != null){
		if (p_symbol == SPACE.OPEN){
			region.notPlacedYet.OPENs--;
		} else if (p_symbol == SPACE.CLOSED){
			region.notPlacedYet.CLOSEDs--;
		}
	}
	const stripSpace = this.stripGrid[p_y][p_x];
	this.lowerHorizontalStrip(stripSpace.leftMost,p_symbol);
	this.lowerHorizontalStrip(stripSpace.horizIn,p_symbol);
	this.lowerHorizontalStrip(stripSpace.rightMost,p_symbol);	
	this.lowerVerticalStrip(stripSpace.topMost,p_symbol);
	this.lowerVerticalStrip(stripSpace.vertIn,p_symbol);
	this.lowerVerticalStrip(stripSpace.bottomMost,p_symbol);
	return RESULT.SUCCESS;
}

SolverHeyawake.prototype.lowerHorizontalStrip = function(p_index,p_symbol){
	this.modifyHorizontalStrip(p_index,p_symbol,-1);
}

SolverHeyawake.prototype.lowerVerticalStrip = function(p_index,p_symbol){
	this.modifyVerticalStrip(p_index,p_symbol,-1);
}

SolverHeyawake.prototype.raiseHorizontalStrip = function(p_index,p_symbol){
	this.modifyHorizontalStrip(p_index,p_symbol,1);
}

SolverHeyawake.prototype.raiseVerticalStrip = function(p_index,p_symbol){
	this.modifyVerticalStrip(p_index,p_symbol,1);
}

SolverHeyawake.prototype.modifyHorizontalStrip = function(p_index,p_symbol,p_modify){
	if (p_index != NOT_RELEVANT){
		this.horizontalStripes[p_index].UNDEFs += p_modify;
		if (p_symbol == SPACE.CLOSED){
			this.horizontalStripes[p_index].CLOSEDs += p_modify;
		}
	}
}

SolverHeyawake.prototype.modifyVerticalStrip = function(p_index,p_symbol,p_modify){
	if (p_index != NOT_RELEVANT){
		this.verticalStripes[p_index].UNDEFs  += p_modify;
		if (p_symbol == SPACE.CLOSED){
			this.verticalStripes[p_index].CLOSEDs += p_modify;
		}
	}
}

SolverHeyawake.prototype.tryToPutNew = function(p_x,p_y,p_symbol){
	var listEventsToApply = [SpaceEvent(p_x,p_y,p_symbol)];
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
	}
}

//The geograhical modification and its closure. More details at theory cluster solver.
SolverHeyawake.prototype.adjacencyClosure = function (p_grid) {
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

SolverHeyawake.prototype.geographicalVerification = function (p_listNewXs) {
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
SolverHeyawake.prototype.testAlertHorizontalStrip = function(p_eventsList,p_index){
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

SolverHeyawake.prototype.testAlertVerticalStrip = function(p_eventsList,p_index){
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

SolverHeyawake.prototype.alertRegion = function(p_listEvents,p_regionIndex,p_missingSymbol,p_missingNumber){
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
SolverHeyawake.prototype.quickStart = function(){
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

SolverHeyawake.prototype.undoEvent = function(p_event){
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

SolverHeyawake.prototype.undoEventList = function(p_eventsList){
	p_eventsList.forEach(solveEvent => this.undoEvent(solveEvent));
}

/**
Used by outside !
*/
SolverHeyawake.prototype.undoToLastHypothesis = function(){
	if (this.happenedEvents.length > 0){
		var lastEventsList = this.happenedEvents.pop();
		this.undoEventList(lastEventsList);
	}
}