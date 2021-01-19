/** Limitation : only one "global cluster" at a time may be managed. */

const SPACE = {
    OPEN: 'O',
    CLOSED: 'C',
    UNDECIDED: '-',
    NOT_APPLICABLE: 'n',
};

const EVENT_RESULT = { // WARNING : don't confuse EVENT_RESULT and RESULT, ; harmonization needed
    SUCCESS : 1,
    FAILURE : 2,
    HARMLESS : 3
}

const DEDUCTIONS_RESULT = {
	SUCCESS : 11,
	FAILURE : 12
}

const PASS_RESULT = {
	SUCCESS : 21,
	FAILURE : 22,
	HARMLESS : 23
}

const SERIE_KIND = {
	HYPOTHESIS : 'H',
	PASS : 'P'
}

function GeneralSolver() {
	this.myLog = 0;
	this.separatelyStackDeductions = true; // When true, stacks a new list for a deduction ; when false, adds the events to the last array of happenedEvents. 
	this.happenedEvents = []; // List of (non-empty list of events). All events beyond the first must be logical deductions (logic of any kind, including geographic) of the first one.
}

GeneralSolver.prototype.makeItGeographical = function(p_xLength, p_yLength) {
	this.xLength = p_xLength;
	this.yLength = p_yLength;
	this.atLeastOneOpen = false;
    this.adjacencyLimitGrid = createAdjacencyLimitGrid(this.xLength, this.yLength);
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
GeneralSolver.prototype.tryToApplyHypothesis = function (p_startingEvent, p_methodPack) {
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
				if (p_methodPack.adjacencyMethod) {
					if (eventBeingApplied.opening() == SPACE.CLOSED) {
					newClosedSpaces.push({
						x: eventBeingApplied.x(),
						y: eventBeingApplied.y()
					});
					} else if (eventBeingApplied.opening() == SPACE.OPEN) {
						//If we are putting the first open space, add a corresponding event into the list of applied events (it isn't "to apply" anymore)
						if (!this.atLeastOneOpen) {
							listEventsApplied.push({firstOpen : true});
							this.atLeastOneOpen = true;
							firstOpenThisTime = true;
						}
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
        if (ok && p_methodPack.adjacencyMethod) {
            if (firstOpenThisTime) {
                // The first open space has been added this time (ie this succession of events before a check verification) : add all previously closed to the list.
                this.happenedEvents.forEach(eventSerie => {
                    eventSerie.list.forEach(solveEvent => {
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
				console.log("My log : "+(this.myLog++));
				if (this.myLog == 227 || this.myLog == 662) {
					console.log("Fatal !");
				}
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
			if (this.separatelyStackDeductions) {
				this.happenedEvents.push({kind : SERIE_KIND.HYPOTHESIS, list : listEventsApplied});
			} else {
				listEventsApplied.forEach(happenedEvent => {
					this.happenedEvents[this.happenedEvents.length-1].list.push(happenedEvent);
				});
			}
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
GeneralSolver.prototype.geographicalVerification = function (p_listNewXs, p_adjacencyClosure) {
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
            newListEventsApplied.push({adjacency : true});
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
GeneralSolver.prototype.undoEventList = function (p_eventsList, p_undoEventMethod) {
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
GeneralSolver.prototype.passEvents = function (p_listListCoveringEvent, p_methodSet ,p_eventsTools, p_passArgument) {
	var listExtractedEvents = this.passEventsAnnex(p_listListCoveringEvent, p_methodSet ,p_eventsTools, 0);
	if (listExtractedEvents != DEDUCTIONS_RESULT.FAILURE) {
		
		if (listExtractedEvents.length > 0) {
			this.separatelyStackDeductions = false;
			this.happenedEvents.push({kind : SERIE_KIND.PASS , label : p_passArgument, list : []}); 
			listExtractedEvents.forEach( deductedEvent => {
				this.tryToApplyHypothesis(deductedEvent, p_methodSet);	
			});
			this.separatelyStackDeductions = true;
			return PASS_RESULT.SUCCESS;
		} else {
			return PASS_RESULT.HARMLESS;
		}
	} else {
		//alert("Failed pass !"); TODO mark this !
		return PASS_RESULT.FAILURE;
	}
}


GeneralSolver.prototype.passEventsAnnex = function (p_listListCoveringEvent, p_methodSet ,p_eventsTools, p_indexInList) {
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
			const happenedEventsBeforeDeduction = this.happenedEvents.length;
			answer = this.tryToApplyHypothesis(possibleEvent, p_methodSet);
			if (answer == DEDUCTIONS_RESULT.SUCCESS) {
				const afterEvents = this.passEventsAnnex(p_listListCoveringEvent, p_methodSet ,p_eventsTools, p_indexInList + 1);
				if (afterEvents != DEDUCTIONS_RESULT.FAILURE) {
					eventsToIntersect = afterEvents;
					if (this.happenedEvents.length > happenedEventsBeforeDeduction) {
						this.happenedEvents[this.happenedEvents.length-1].list.forEach( recentEvent => {
							eventsToIntersect.push(recentEvent);
						});
					}	// Get events that have been deducted by tryToApplyHypothesis)
					deductedEvents = intersect(deductedEvents, eventsToIntersect, p_eventsTools);
					emptyResult = ((deductedEvents != DEDUCTIONS_RESULT.FAILURE) && (deductedEvents.length == 0));
				}
				if (this.happenedEvents.length > happenedEventsBeforeDeduction) {
					this.undoToLastHypothesis(p_methodSet.undoEventMethod);
				}
			} 
			i++;
		}
		return deductedEvents;
	}
}

function intersect(p_eventsListOld, p_eventsListNew, p_eventsTools) {
	if (p_eventsListOld == DEDUCTIONS_RESULT.FAILURE) {
		if (p_eventsListNew == DEDUCTIONS_RESULT.FAILURE) {
			return DEDUCTIONS_RESULT.FAILURE;
		} else {
			return filterExternalMethods(p_eventsListNew).sort(p_eventsTools.comparisonMethod); // VERY IMPORTANT : apply "filter" first and "sort" then, otherwise elements supposed to be discarded by filter could be "sorted" and make the intersection bogus
		}
	} else {
		eventsList1 = p_eventsListOld; //Already sorted ;)
		eventsList2 = filterExternalMethods(p_eventsListNew).sort(p_eventsTools.comparisonMethod);
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
Performs a multipass
p_generatePassEventsMethod : method that turns an argument (of any nature) into a list of "list of covering events" usable by the passing method
p_orderPassArgumentsMethod : method that reorders the argument list. Must take no arguments and return a list of arguments, each of which should be passed to p_generatePassEventsMethod. 
p_methodSet, p_eventsTools : same arguments as in the pass method.
*/
GeneralSolver.prototype.multiPass = function(p_generatePassEventsMethod, p_orderPassArgumentsMethod, p_methodSet ,p_eventsTools) {
	var oneMoreLoop;
	var orderedListPassArguments;
	var ok = true;
	var resultPass;
	var i;
	const lengthBeforeMultiPass = this.happenedEvents.length;
	do {
		oneMoreLoop = false;
		orderedListPassArguments = p_orderPassArgumentsMethod();
		const happenedEventsBeforePassingAllRegions = this.happenedEvents.length;
		i = 0;
		while (ok && i < orderedListPassArguments.length) {
			p_listListCoveringEvent = p_generatePassEventsMethod(orderedListPassArguments[i]);
			resultPass = this.passEvents(p_listListCoveringEvent, p_methodSet ,p_eventsTools, orderedListPassArguments[i]); //TODO must be improved !
			if (resultPass == PASS_RESULT.SUCCESS) {
				oneMoreLoop = true;
			} else if (resultPass == PASS_RESULT.FAILURE) {
				ok = false;
			}
			i++;
		}
	} while (ok && oneMoreLoop);
	if (!ok) {
		while (this.happenedEvents.length > lengthBeforeMultiPass) {
			var lastEventsList = this.happenedEvents.pop();
			this.undoEventList(lastEventsList.list, p_methodSet.undoEventMethod);
		}
	}
}

GeneralSolver.prototype.isPassEventList = function (p_eventsSerie) {
	if (p_eventsSerie.kind == SERIE_KIND.PASS) {
		return true;
	} 
	return false;
}

GeneralSolver.prototype.happenedEventsLog = function(p_options) {
	answer = "";
	var displayGeographical = (p_options && p_options.displayGeographical);
	this.happenedEvents.forEach(eventSerie => {
		if (eventSerie.kind == SERIE_KIND.PASS) {
			answer += "Pass - " + eventSerie.label+ " ";
		} else {
			answer += "Hypothesis - ";
		} 
		eventSerie.list.forEach(event_ => {
			if (event_.firstOpen) {
				if (displayGeographical) {
					answer += "<1st open>";
				}
			} else if (event_.adjacency) {
				if (displayGeographical) {
					answer += "<Adjacency>";
				}
			} 
			else {
				answer += event_.toString() + " ";
			}
		});
		answer += "\n";
	});
	return answer;
}

/**
Used by outside !
 */
GeneralSolver.prototype.undoToLastHypothesis = function (p_undoEventMethod) {
    if (this.happenedEvents.length > 0) {
		var wasAnHypothesis;
		do {
			var lastEventsSerie = this.happenedEvents.pop();
			wasAnHypothesis = this.isPassEventList(lastEventsSerie);
			this.undoEventList(lastEventsSerie.list, p_undoEventMethod);
		} while(wasAnHypothesis && this.happenedEvents.length > 0);
    }
}