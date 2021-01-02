/** Limitation : only one "global cluster" at a time may be managed. */

const SPACE = {
    OPEN: 'O',
    CLOSED: 'C',
    UNDECIDED: '-',
    NOT_APPLICABLE: 'n',
};

const EVENT_RESULT = { // WARNING : don't confuse EVENT_RESULT and RESULT, ; harmonization needed
    SUCCESS : 3,
    FAILURE : 1,
    HARMLESS : 2
}

const DEDUCTIONS_RESULT = {
	SUCCESS : 11,
	FAILURE : 12
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
// TODO while the things defined below are accurate, the names aren't !
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
ClusterInvolvedSolver.prototype.tryToApply = function (p_startingEvent, p_methodPack) {
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
			result = p_methodPack.applyEventMethod(eventBeingApplied);
            if (result == EVENT_RESULT.FAILURE) {
                ok = false;
            }
            if (result == EVENT_RESULT.SUCCESS) {
				listEventsToApply = p_methodPack.deductionsMethod(listEventsToApply, eventBeingApplied);
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
		if (p_methodPack.filters) {
			var i = 0; // i = filter index
			while (ok && listEventsToApply.length == 0 && i < p_methodPack.filters.length) {
				filter = p_methodPack.filters[i];
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
                geoV = this.geographicalVerification(newClosedSpaces, p_methodPack.adjacencyMethod);
				ok = (geoV.result == EVENT_RESULT.SUCCESS);
				if (ok) {
					geoV.listGeographicalDeductionsToApply.forEach(geographicalDeduction =>
						listEventsToApply.push(p_methodPack.retrieveGeographicalDeductionMethod(geographicalDeduction))
					);
					geoV.listGeographicalDeductionsApplied.forEach(geographicalDeduction =>
						listEventsApplied.push(geographicalDeduction)
					);
				}
            }
        }
    }
    if (!ok) {
		if (p_methodPack.abort) {
			p_methodPack.abort();
		}
        this.undoEventList(listEventsApplied, p_methodPack.undoEventMethod);
		return DEDUCTIONS_RESULT.FAILURE;
    } else {
		if (listEventsApplied.length > 0) {
			this.happenedEvents.push(listEventsApplied);
		}
		return DEDUCTIONS_RESULT.SUCCESS;
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
Passes a list of covering events (for instance, if a region contains spaces "1 2 3 4" and we want to apply a pass on it, it should have the following events :
 [[(open space 1),(close space 1)], [(open space 2),(close space 2)], [(open space 3),(close space 3)], [(open space 4),(close space 4)]]) 
 // p_methodSet : must contain applyEventMethod, deductionMethod, adjacencyClosureMethod, transformMethod, extras (or not)
 // p_eventsTools : must contain comparisonMethod, copyMethod

*/
ClusterInvolvedSolver.prototype.passEvents = function (p_listListCoveringEvent, p_methodSet ,p_eventsTools) {
	var listExtractedEvents = this.passEventsAnnex(p_listListCoveringEvent, p_methodSet ,p_eventsTools, 0);
	if (listExtractedEvents != DEDUCTIONS_RESULT.FAILURE) {
		listExtractedEvents.forEach( deductedEvent => {
			this.tryToApply(deductedEvent, p_methodSet);	// TODO changer cette méthode "try to apply" dans son nom mais aussi dans ses arguments...
		});
	}
}

ClusterInvolvedSolver.prototype.passEventsAnnex = function (p_listListCoveringEvent, p_methodSet ,p_eventsTools, p_indexInList) {
	if (p_indexInList == p_listListCoveringEvent.length) {
		return [];
	} else {
		var listCoveringEvent = p_listListCoveringEvent[p_indexInList];
		var deductedEvents = DEDUCTIONS_RESULT.FAILURE;
		var eventsToIntersect;
		var answer;
		var emptyResult = false;
		var i = 0;
		while (i < listCoveringEvent.length && !emptyResult) {
			possibleEvent = listCoveringEvent[i];
			//console.log("Event is gonna be tried (lv. "+p_indexInList+") : "+possibleEvent.toString());
			const happenedEventsBeforeDeduction = this.happenedEvents.length;
			answer = this.tryToApply(possibleEvent, p_methodSet);
			if (answer == DEDUCTIONS_RESULT.SUCCESS) {
				//console.log("It works ! Next level. ("+ (p_indexInList+1) +")");
				const afterEvents = this.passEventsAnnex(p_listListCoveringEvent, p_methodSet ,p_eventsTools, p_indexInList + 1);
				if (afterEvents != DEDUCTIONS_RESULT.FAILURE) {
					eventsToIntersect = afterEvents;
					if (this.happenedEvents.length > happenedEventsBeforeDeduction) {
						this.happenedEvents[this.happenedEvents.length-1].forEach( recentEvent => {
							eventsToIntersect.push(recentEvent);
						});
					}					// Get events that have been deducted by tryToApply)
					//console.log("Conclusion : "+possibleEvent.toString()+" ; Level : ("+p_indexInList+")");
					//console.log("Deducted events before "+p_indexInList+" index "+i+" : "+deductedEvents);
					//console.log("Events to intersect : "+eventsToIntersect);
					deductedEvents = intersect(deductedEvents, eventsToIntersect, p_eventsTools);
					//console.log("Deducted events after trying and intersecting "+p_indexInList+" index "+i+" : "+deductedEvents);
					emptyResult = ((deductedEvents != DEDUCTIONS_RESULT.FAILURE) && (deductedEvents.length == 0));
				}
				if (this.happenedEvents.length > happenedEventsBeforeDeduction) {
					//console.log("Event is gonna have its consequences undone : "+possibleEvent.toString()+ " (cancel "+this.happenedEvents[this.happenedEvents.length-1]+" event(s))");
					this.undoToLastHypothesis(p_methodSet.undoEventMethod);
				}
			} 
			i++;
		}
		//console.log("Return from level " + p_indexInList + " : " + deductedEvents);
		return deductedEvents;
	}
}

/*ClusterInvolvedSolver.prototype.passEventsAnnex = function (p_listListCoveringEvent, p_methodSet ,p_eventsTools, p_indexInList) {
	if (p_indexInList == p_listListCoveringEvent.length) {
		return [];
	} else {
		var listCoveringEvent = p_listListCoveringEvent[p_indexInList];
		var deductedEvents = DEDUCTIONS_RESULT.FAILURE;
		var eventsToIntersect;
		var answer;
		var emptyResult = false;
		//var i = 0;

			possibleEvent = listCoveringEvent[0];
			console.log("Event is gonna be tried (lv. "+p_indexInList+") : "+possibleEvent.toString());
			const happenedEventsBeforeDeductionOPEN = this.happenedEvents.length;
			answer = this.tryToApply(possibleEvent, p_methodSet);
			if (answer == DEDUCTIONS_RESULT.SUCCESS) {
				const afterEventsOPEN = this.passEventsAnnex(p_listListCoveringEvent, p_methodSet ,p_eventsTools, p_indexInList + 1);
				if (afterEventsOPEN != DEDUCTIONS_RESULT.FAILURE) {
					eventsToIntersect = afterEventsOPEN;
					if (this.happenedEvents.length > happenedEventsBeforeDeductionOPEN) {
						this.happenedEvents[this.happenedEvents.length-1].forEach( recentEvent => {
							eventsToIntersect.push(recentEvent);
						});
					}					
					deductedEvents = filterExternalMethods(eventsToIntersect.sort(p_eventsTools.comparisonMethod));
					// emptyResult = ((deductedEvents != DEDUCTIONS_RESULT.FAILURE) && (deductedEvents.length == 0));
				}
				if (this.happenedEvents.length > happenedEventsBeforeDeductionOPEN) {
					this.undoToLastHypothesis(p_methodSet.undoEventMethod);
				}
			} 
			
			possibleEvent = listCoveringEvent[1];
			console.log("Event is gonna be tried (lv. "+p_indexInList+") : "+possibleEvent.toString());
			const happenedEventsBeforeDeductionCLOSE = this.happenedEvents.length;
			answer = this.tryToApply(possibleEvent, p_methodSet);
			if (answer == DEDUCTIONS_RESULT.SUCCESS) {
				const afterEventsCLOSE = this.passEventsAnnex(p_listListCoveringEvent, p_methodSet ,p_eventsTools, p_indexInList + 1);
				if (afterEventsCLOSE != DEDUCTIONS_RESULT.FAILURE) {
					eventsToIntersect = afterEventsCLOSE;
					if (this.happenedEvents.length > happenedEventsBeforeDeductionCLOSE) {
						this.happenedEvents[this.happenedEvents.length-1].forEach( recentEvent => {
							eventsToIntersect.push(recentEvent);
						});
					}					
					deductedEvents = intersect(deductedEvents, eventsToIntersect, p_eventsTools);
					// emptyResult = ((deductedEvents != DEDUCTIONS_RESULT.FAILURE) && (deductedEvents.length == 0));
				}
				if (this.happenedEvents.length > happenedEventsBeforeDeductionCLOSE) {
					this.undoToLastHypothesis(p_methodSet.undoEventMethod);
				}
			} 
			
		
		console.log("Return from level " + p_indexInList + " : " + deductedEvents);
		return deductedEvents;
	}
}*/

function intersect(p_eventsListOld, p_eventsListNew, p_eventsTools) {
	console.log("Intersecting (already sorted+filtered) "+p_eventsListOld);
	console.log("and "+p_eventsListNew);
	if (p_eventsListOld == DEDUCTIONS_RESULT.FAILURE) {
		if (p_eventsListNew == DEDUCTIONS_RESULT.FAILURE) {
			console.log("Producing failure");
			return DEDUCTIONS_RESULT.FAILURE;
		} else {
			console.log("Producing (2nd zone) " +filterExternalMethods(p_eventsListNew).sort(p_eventsTools.comparisonMethod)); //551551 Je comprends pourquoi un "answer", en somme...
			return filterExternalMethods(p_eventsListNew).sort(p_eventsTools.comparisonMethod); // VERY IMPORTANT : apply "filter" first and "sort" then, otherwise elements supposed to be discarded by filter could be "sorted" and make the intersection bogus
		}
	} else {
		eventsList1 = p_eventsListOld; //Already sorted ;)
		eventsList2 = filterExternalMethods(p_eventsListNew).sort(p_eventsTools.comparisonMethod);
		console.log("Lane 1 : "+eventsList1);
		console.log("Lane 2 : "+eventsList2);
		var i1 = 0;
		var i2 = 0;
		var answer = [];
		var comparison;
		while (i1 < eventsList1.length && i2 < eventsList2.length) {
			comparison = p_eventsTools.comparisonMethod(eventsList1[i1], eventsList2[i2], p_eventsTools.comparisonMethod);
			if (comparison < 0) {
				i1++;
			} else if (comparison > 0) {
				i2++;
			} else {
				answer.push(p_eventsTools.copyMethod(eventsList1[i1]));
				i1++;
				i2++;
			}
		}
		console.log("Producing "+answer);
		return answer;
	}
}

// Filter methods that are not reserved to the solver
function filterExternalMethods(p_list) {
	var answer = [];
	p_list.forEach(event_ => {
		if (!event_.adjacency && !event_.firstOpen) {
			answer.push(event_);
		}
	});
	return answer;
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