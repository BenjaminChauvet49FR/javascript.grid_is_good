// Constants and items

const SPACE = {
    OPEN: 'O',
    CLOSED: 'C',
    UNDECIDED: '-',
    NOT_APPLICABLE: 'n',
};

const EVENT_RESULT = { 
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
	PASS : 'P',
	QUICKSTART : 'QS'
}

function FailureEvent() {
	this.failure = true;
}


// ----------------
// Initialisation

function GeneralSolver() { }

// This method should be called by the inheriting "construct".
GeneralSolver.prototype.generalConstruct = function() {
	this.myLog = 0;
	this.separatelyStackDeductions = true; // When true, stacks a new list for a deduction ; when false, adds the events to the last array of happenedEventsSeries. 
	this.happenedEventsSeries = []; // List of (non-empty list of events). All events beyond the first must be logical deductions (logic of any kind, including geographic) of the first one.	
}

GeneralSolver.prototype.makeItGeographical = function(p_xLength, p_yLength) {
	this.xLength = p_xLength;
	this.yLength = p_yLength;
	this.atLeastOneOpen = false;
    this.adjacencyLimitGrid = createAdjacencyLimitGrid(this.xLength, this.yLength);
    this.adjacencyLimitSpacesList = [];
}

// ----------------
// Deductions, geographical verification, undoing

/**
	Generic method for any solver that includes a global adjacency check
	
	p_startingEvent : PRE (puzzle-related event, described below ; it must have a set of methods) that can lead to consequences
	
	p_methodPack : object that must contain the following methods (may be closures) :
	applyEventMethod : method that states how to apply the PRE (e.g. fill a space in a grid and modify numbers in the cluster). 
	If the PRE has several potential forms, this method must give the behaviour for each form. Must return EVENT_RESULT.FAILURE, EVENT_RESULT.SUCCESS or EVENT_RESULT.HARMLESS
	deductionsMethod : method that updates the list of events to apply as deductions to the one being applied. Must return the list of PREs potentially updated with new PRE's.
	undoEventMethod : method to undo a PRE.
	
	If the puzzle is geographical (one unique cluster), the following methods must be added : 
	adjacencyMethod : method that takes (x,y) and must return whether the space (x,y) must be considered open. The limitation of one global cluster makes sense here.
	retrieveGeographicalDeductionMethod : transforms the GeographicalDeduction (see corresponding class) into a PRE.

	Also, a few optionnal methods :
	abortMethod : method so the puzzle solver is authorized to do vital stuff such as cleaning environment when a mistake is made. (If no aborting, this method isn't automatically called)
	filters : list of methods that must each take no argument and return either a PRE list (that may be empty) or EVENT_RESULT.FAILURE if something went wrong. 
	These methods should allow to add new events that cannot/ should not be deducted by the application of a single PRE.
	Order of filters matter for optimisation since as soon as the application of a filter returns a non-empty list, the chain breaks and returns to individual event applications (or aborts)
	Warning : methods should be provided, not expressions of methods ! Also, don't forget the keyword "return" in both the closure and the method.
*/
GeneralSolver.prototype.tryToApplyHypothesis = function (p_startingEvent, p_methodPack) {
	var listEventsToApply = [p_startingEvent]; //List of the "events" type used by the solver. 
	// Events can be of any kind but, if the puzzle is geographical, must have the following methods :
	// A "x" method (int), a "y" method (int), a "opening" method (SPACE.OPEN | SPACE.CLOSED | SPACE.UNDEFINED), in which case no geographical check is performed)
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
			result = (eventBeingApplied.failure ? EVENT_RESULT.FAILURE :
				(eventBeingApplied.isCompoundEvent ? EVENT_RESULT.SUCCESS :
					p_methodPack.applyEventMethod(eventBeingApplied)));
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
				if (!eventBeingApplied.isCompoundEvent && !eventBeingApplied.nothingHappened) {
					listEventsApplied.push(eventBeingApplied);
				}
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
                this.happenedEventsSeries.forEach(eventSerie => {
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
				autoLogDebug("My log : "+(this.myLog++));
				if (this.myLog == 227 || this.myLog == 662) {
					autoLogDebug("Fatal !");
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
		if (p_methodPack.abortMethods) {
			p_methodPack.abortMethods.forEach( abortMethod => {
				abortMethod();
			});
		}
        this.undoEventList(listEventsApplied, p_methodPack.undoEventMethod);
		return DEDUCTIONS_RESULT.FAILURE;
    } else {
		if (listEventsApplied.length > 0) {
			if (this.separatelyStackDeductions) {
				this.happenedEventsSeries.push({kind : SERIE_KIND.HYPOTHESIS, list : listEventsApplied});
			} else {
				listEventsApplied.forEach(happenedEvent => {
					this.happenedEventsSeries[this.happenedEventsSeries.length-1].list.push(happenedEvent);
				});
			}
		}
		return DEDUCTIONS_RESULT.SUCCESS;
    }
}

/**
In entry : 
p_listNewXs : a list of {x,y} items with the position of all "closed" spaces, 
p_adjacencyMethod : a method that determines through (x,y) grid if a ... must be opened or not.
In exit :
listGeographicalDeductionsToApply : a list of GeographicalDeduction(x,y, OPEN|CLOSED) items
listGeographicalDeductionsApplied : a list of {adjacency : true} items. Whenever it should be undone, the first element of adjacencyLimitSpacesList should be undone.
*/
GeneralSolver.prototype.geographicalVerification = function (p_listNewXs, p_adjacencyMethod) {
    //autoLogGeographical("Perform geographicalVerification");
    const checking = adjacencyCheck(p_listNewXs, this.adjacencyLimitGrid, this.adjacencyLimitSpacesList, p_adjacencyMethod, this.xLength, this.yLength);
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
	while (p_eventsList.length > 0) {
		eventToUndo = p_eventsList.pop();
		if (eventToUndo.firstOpen) {
			this.atLeastOneOpen = false;
		} else if (eventToUndo.adjacency) {
			const aals = this.adjacencyLimitSpacesList.pop(); //aals = added adjacency limit space
			this.adjacencyLimitGrid[aals.y][aals.x] = aals.formerValue;
		} else {
			p_undoEventMethod(eventToUndo);
		}
	}
}

GeneralSolver.prototype.undoToLastHypothesis = function (p_undoEventMethod) {
    if (this.happenedEventsSeries.length > 0) {
		var wasPass;
		do {
			var lastEventsSerie = this.happenedEventsSeries.pop();
			wasPass = this.isPassSerie(lastEventsSerie);
			this.undoEventList(lastEventsSerie.list, p_undoEventMethod);
		} while(wasPass && this.happenedEventsSeries.length > 0);
    }
}

/** 
Marks an event as "compound" if its only purpose is to pile up other events to the pile of events to be applied. 
Compound events are not saved into happenedEventsSeries.
The piled events must be returned by the deduction method of the solver.
*/
markCompoundEvent = function(p_event) {
	p_event.isCompoundEvent = true;
}

// ----------------
// Pass and multipass

/**
Passes a list of covering events (for instance, if a region contains spaces "1 2 3 4" and we want to apply a pass on it, it should have the following events :
 [[(open space 1),(close space 1)], [(open space 2),(close space 2)], [(open space 3),(close space 3)], [(open space 4),(close space 4)]]) 
 // p_methodSet : must contain applyEventMethod, deductionMethod, adjacencyClosureMethod, transformMethod, extras (or not)
 // p_eventsTools : must contain comparisonMethod, copyMethod, optionally argumentToLabelMethod

*/
GeneralSolver.prototype.passEvents = function (p_listListCoveringEvent, p_methodSet ,p_eventsTools, p_passArgument) {
	var listExtractedEvents = this.passEventsAnnex(p_listListCoveringEvent, p_methodSet ,p_eventsTools, 0);
	if (listExtractedEvents != DEDUCTIONS_RESULT.FAILURE) {
		
		if (listExtractedEvents.length > 0) {
			this.separatelyStackDeductions = false;
			this.happenedEventsSeries.push({kind : SERIE_KIND.PASS , label : p_eventsTools.argumentToLabelMethod ? p_eventsTools.argumentToLabelMethod(p_passArgument) : p_passArgument, list : []}); 
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
			const happenedEventsBeforeDeduction = this.happenedEventsSeries.length;
			answer = this.tryToApplyHypothesis(possibleEvent, p_methodSet);
			if (answer == DEDUCTIONS_RESULT.SUCCESS) {
				const afterEvents = this.passEventsAnnex(p_listListCoveringEvent, p_methodSet ,p_eventsTools, p_indexInList + 1);
				if (afterEvents != DEDUCTIONS_RESULT.FAILURE) {
					eventsToIntersect = afterEvents;
					if (this.happenedEventsSeries.length > happenedEventsBeforeDeduction) {
						this.happenedEventsSeries[this.happenedEventsSeries.length-1].list.forEach( recentEvent => {
							eventsToIntersect.push(recentEvent);
						});
					}	// Get events that have been deducted by tryToApplyHypothesis)
					deductedEvents = intersect(deductedEvents, eventsToIntersect, p_eventsTools);
					emptyResult = ((deductedEvents != DEDUCTIONS_RESULT.FAILURE) && (deductedEvents.length == 0));
				}
				if (this.happenedEventsSeries.length > happenedEventsBeforeDeduction) {
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
		const eventsList1 = p_eventsListOld; //Already sorted ;)
		var eventsList2 = filterExternalMethods(p_eventsListNew);
		eventsList2 = eventsList2.sort(p_eventsTools.comparisonMethod);
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
p_passTools must contain the following methods :
- generatePassEventsMethod : method that turns a pass argument into a list of "list of covering events" usable by the passing method)
- orderPassArgumentsMethod : method that reorders the argument list, taking no argument and returning a list of pass arguments, each of which should be passed to p_generatePassEventsMethod)
- skipPassMethod (optional) : method that takes a pass argument and that determinates whether the set of possibilites designated by the pass argument is too big to be passed or not. The set of possibilities will have to be tested anyways if no other set has been tested so far in this cycle of multipasses.)
p_methodSet, p_eventsTools : same arguments as in the pass method.
*/
GeneralSolver.prototype.multiPass = function(p_methodSet ,p_eventsTools, p_passTools) {  
	var oneMoreLoop;
	var orderedListPassArguments;
	var ok = true;
	var resultPass;
	var i;
	var argPass;
	const lengthBeforeMultiPass = this.happenedEventsSeries.length;
	do {
		oneMoreLoop = false;
		orderedListPassArguments = p_passTools.orderPassArgumentsMethod();
		const happenedEventsBeforePassingAllRegions = this.happenedEventsSeries.length;
		i = 0;
		while (ok && i < orderedListPassArguments.length) {
			argPass = orderedListPassArguments[i];
			if (!oneMoreLoop || !p_passTools.skipPassMethod || !p_passTools.skipPassMethod(argPass)) {
				p_listListCoveringEvent = p_passTools.generatePassEventsMethod(argPass);
				// Where the pass is performed !
				resultPass = this.passEvents(p_listListCoveringEvent, p_methodSet ,p_eventsTools, argPass); 
				if (resultPass == PASS_RESULT.SUCCESS) {
					oneMoreLoop = true;
				} else if (resultPass == PASS_RESULT.FAILURE) {
					ok = false;
				}
			} else {
				autoLogMultipass("C'est trop pour nous, on passe la région "+argPass);
			}
			i++;
		}
	} while (ok && oneMoreLoop);
	if (!ok) {
		while (this.happenedEventsSeries.length > lengthBeforeMultiPass) {
			var lastEventsList = this.happenedEventsSeries.pop();
			this.undoEventList(lastEventsList.list, p_methodSet.undoEventMethod);
		}
	}
}

GeneralSolver.prototype.isPassSerie = function (p_eventsSerie) {
	if (p_eventsSerie.kind == SERIE_KIND.PASS) {
		return true;
	} 
	return false;
}

// --------------------------------
// Quickstart

/**
As-is, quickstart events are totaly managed by solvers that call deductions methods.
initiateQuickStart and terminateQuickStart should be called respectively when entering and leaving a quickstart method so all the applied events are concatenated into a single serie that will be logged as "Quick start".
*/

GeneralSolver.prototype.initiateQuickStart = function(p_label) {
	if (!p_label) {
		p_label = "";
	}
	this.happenedEventsSeries.push({kind : SERIE_KIND.QUICKSTART , label : p_label, list : [] }); 
	this.separatelyStackDeductions = false;
}

GeneralSolver.prototype.terminateQuickStart = function() {
	if (this.happenedEventsSeries[this.happenedEventsSeries.length-1].list.length == 0) {
		this.happenedEventsSeries.pop();
	}
	this.separatelyStackDeductions = true;
}

// --------------------------------
// Manual logs

GeneralSolver.prototype.happenedEventsLogQuick = function() {
	return this.happenedEventsLog({quick : true});
}

GeneralSolver.prototype.happenedEventsLog = function(p_options) {
	answer = "";
	var displayGeographical = (p_options && p_options.displayGeographical);
	var displayQuick = (p_options && p_options.quick);
	this.happenedEventsSeries.forEach(eventSerie => {
		if (eventSerie.kind == SERIE_KIND.PASS) {
			answer += "Pass - " + eventSerie.label + " ";
		} else if (eventSerie.kind == SERIE_KIND.QUICKSTART) {
			answer += "Quickstart - " + eventSerie.label + " ";
		} else {
			answer += "Hypothesis - " + (displayQuick ? eventSerie.list[0] : "");
		} 
		if (!displayQuick) {
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
		}
		answer += "\n";
	});
	return answer;
}