// Constants and items
const OTHER_RESULTS = {
	DEFAULT : 4,
	QUICKSTART : 6,
	CANCEL : 5
}

const EVENT_RESULT = { 
    SUCCESS : 3,
    FAILURE : 1,
    HARMLESS : 2
}

const GEOGRAPHICAL_DEDUCTION = {
	SUCCESS : 3,
    FAILURE : 1,
    HARMLESS : 2
}

const DEDUCTIONS_RESULT = {
	SUCCESS : 11,
	FAILURE : 12
}

const PASS_RESULT = {
	SUCCESS : 23,
	FAILURE : 21,
	HARMLESS : 22
}

const MULTIPASS_RESULT = {
	SUCCESS : 33,
	FAILURE : 31,
	HARMLESS : 32
}

const GLOBAL_DEDUCTIONS_RESULT = {
	SUCCESS : 43,
	FAILURE : 41,
	HARMLESS : 42
}

const SERIE_KIND = {
	HYPOTHESIS : 1,
	PASS : 2,
	QUICKSTART : 3,
	GLOBAL_DEDUCTION : 4
}

function FailureEvent() {
	this.failure = true;
}


// ----------------
// Initialisation

function GeneralSolver() { }

// This method should be called by the inheriting "construct".
GeneralSolver.prototype.generalConstruct = function() {
	this.separatelyStackDeductions = true; // When true, stacks a new list for a deduction ; when false, adds the events to the last array of happenedEventsSeries. 
	this.happenedEventsSeries = []; // List of (non-empty list of events). All events beyond the first must be logical deductions (logic of any kind, including geographic) of the first one.	
	this.setStateHappening(OTHER_RESULTS.DEFAULT); // this.counterSameState = 0 an this.lastHappeningState = OTHER_RESULTS.DEFAULT
	
	// In the setup, defining methods in method packs (for deductions, pass, multipass) is actually the right thing to do.
}

// ----------------
// Deductions, geographical verification, undoing

/** TODO : REWRITE THIS LOG ! (Historical...)
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
GeneralSolver.prototype.tryToApplyHypothesis = function (p_startingEvent) {
	var listEventsToApply = [p_startingEvent]; //List of the "events" type used by the solver. 
	// Events can be of any kind but, if the puzzle is geographical, must have the following methods :
	// A "x" method (int), a "y" method (int), a "opening" method (ADJACENCY.YES | ADJACENCY.NO | SPACE.UNDEFINED), in which case no geographical check is performed)
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
	geographicalDeductionsPseudoFilter = [];
	
    while (ok && listEventsToApply.length > 0) {
		// Overall (classical + geographical) verification
        newClosedSpaces = [];
        firstOpenThisTime = false;
        while (ok && listEventsToApply.length > 0) {
            // Classical verification
            eventBeingApplied = listEventsToApply.pop();
			if (eventBeingApplied.isCompoundEvent) { // Compound event
				listEventsToApply = this.methodsSetDeductions.compoundEventMethod(listEventsToApply, eventBeingApplied);
				result = EVENT_RESULT.HARMLESS;
			} else {				
				result = (eventBeingApplied.failure ? EVENT_RESULT.FAILURE : this.methodsSetDeductions.applyEventMethod(eventBeingApplied));
			}
			if (result == EVENT_RESULT.FAILURE) {
				ok = false;
			}
			if (result == EVENT_RESULT.SUCCESS) {
				listEventsToApply = this.methodsSetDeductions.deductionsMethod(listEventsToApply, eventBeingApplied);
				listEventsApplied.push(eventBeingApplied);
			}
        }
		
		// listEventsToApply is empty at this point.
		// When logical deductions are performed individually (e.g. each space is watched as itself), apply other methods that may lead to deductions
		if (this.methodsSetDeductions.filters) {
			var i = 0; // i = filter index
			while (ok && listEventsToApply.length == 0 && i < this.methodsSetDeductions.filters.length) {
				filter = this.methodsSetDeductions.filters[i];
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
		// TODO : The last "geographical treatment". Any other trace of geographical solver has been successfully removed. (I think)
		if (ok && listEventsToApply.length == 0 && this.methodsSetDeductions.adjacencyMethod) {			
			listEventsToApply = this.geographicalDeductionsPseudoFilter(listEventsApplied, this.methodsSetDeductions);
			ok = (listEventsToApply != EVENT_RESULT.FAILURE);
		}
    }
    if (!ok) {
		if (this.methodsSetDeductions.abortMethods) {
			this.methodsSetDeductions.abortMethods.forEach( abortMethod => {
				abortMethod();
			});
		}
        this.undoEventList(listEventsApplied, this.methodsSetDeductions.undoEventMethod);
		autoLogGeneralFail();
		this.setStateHappening(DEDUCTIONS_RESULT.FAILURE);
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
			this.setStateHappening(DEDUCTIONS_RESULT.SUCCESS);
			return DEDUCTIONS_RESULT.SUCCESS;
		} else {
			this.setStateHappening(DEDUCTIONS_RESULT.HARMLESS);
			return DEDUCTIONS_RESULT.HARMLESS;
		}
    }
}

// Undoing
GeneralSolver.prototype.undoEventList = function (p_eventsList) {
	while (p_eventsList.length > 0) {
		eventToUndo = p_eventsList.pop();
		this.methodsSetDeductions.undoEventMethod(eventToUndo);
	}
}

GeneralSolver.prototype.undoToLastHypothesis = function () {
    if (this.happenedEventsSeries.length > 0) {
		var stillCancel; 
		const cancelQS = isQuickStart(this.happenedEventsSeries[this.happenedEventsSeries.length - 1]); // As soon as we hit the 1st quickstart, don't cancel it ! But if we cancel one QS, cancel them all !
		do {
			var lastEventsSerie = this.happenedEventsSeries[this.happenedEventsSeries.length - 1];
			stillCancel = cancelQS || isPassSerie(lastEventsSerie) || isGlobalDeduction(lastEventsSerie);
			if (cancelQS || !isQuickStart(lastEventsSerie)) {				
				this.undoEventList(lastEventsSerie.list, this.methodsSetDeductions.undoEventMethod);
				this.happenedEventsSeries.pop();
			}
		} while(stillCancel && this.happenedEventsSeries.length > 0);
    }
	this.setStateHappening(OTHER_RESULTS.CANCEL);
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

/** TODO : REWRITE THIS LOG ! (Historical...)
Passes a list of covering events (for instance, if a region contains spaces "1 2 3 4" and we want to apply a pass on it, it should have the following events :
 [[(open space 1),(close space 1)], [(open space 2),(close space 2)], [(open space 3),(close space 3)], [(open space 4),(close space 4)]]) 
 // p_methodSet : must contain applyEventMethod, deductionMethod, adjacencyClosureMethod, transformMethod, extras (or not)
 // p_eventsTools : must contain comparisonMethod, copyMethod, optionally argumentToLabelMethod

*/
GeneralSolver.prototype.passEvents = function (p_listListCoveringEvent, p_passArgument) {
	var listExtractedEvents = this.passEventsAnnex(p_listListCoveringEvent, 0);
	var answer;
	if (listExtractedEvents != DEDUCTIONS_RESULT.FAILURE) {
		
		if (listExtractedEvents.length > 0) {
			this.separatelyStackDeductions = false;
			this.happenedEventsSeries.push({kind : SERIE_KIND.PASS , label : this.methodsSetPass.argumentToLabelMethod ? this.methodsSetPass.argumentToLabelMethod(p_passArgument) : p_passArgument, list : []}); 
			listExtractedEvents.forEach( deductedEvent => {
				this.tryToApplyHypothesis(deductedEvent);	
			});
			this.separatelyStackDeductions = true;
			answer = PASS_RESULT.SUCCESS;
		} else {
			answer = PASS_RESULT.HARMLESS;
		}
	} else {
		answer = PASS_RESULT.FAILURE;
	}
	this.setStateHappening(answer);
	return answer;
}


GeneralSolver.prototype.passEventsAnnex = function (p_listListCoveringEvent, p_indexInList) {
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
			answer = this.tryToApplyHypothesis(possibleEvent);
			if (answer != DEDUCTIONS_RESULT.FAILURE) {
				const afterEvents = this.passEventsAnnex(p_listListCoveringEvent, p_indexInList + 1);
				if (afterEvents != DEDUCTIONS_RESULT.FAILURE) {
					eventsToIntersect = afterEvents;
					if (this.happenedEventsSeries.length > happenedEventsBeforeDeduction) {
						this.happenedEventsSeries[this.happenedEventsSeries.length-1].list.forEach( recentEvent => {
							eventsToIntersect.push(recentEvent);
						});
					}	// Get events that have been deducted by tryToApplyHypothesis
					deductedEvents = intersect(deductedEvents, eventsToIntersect, this.methodsSetPass);
					emptyResult = ((deductedEvents != DEDUCTIONS_RESULT.FAILURE) && (deductedEvents.length == 0));
				}
				if (this.happenedEventsSeries.length > happenedEventsBeforeDeduction) {
					this.undoToLastHypothesis(this.methodsSetDeductions.undoEventMethod);
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
			return filterUnsortableEvents(p_eventsListNew).sort(p_eventsTools.comparisonMethod); // VERY IMPORTANT : apply "filter" first and "sort" then, otherwise elements supposed to be discarded by filter could be "sorted" and make the intersection bogus
		}
	} else {
		const eventsList1 = p_eventsListOld; //Already sorted ;)
		var eventsList2 = filterUnsortableEvents(p_eventsListNew);
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

// Exclude methods that shouldn't be applied for sort and intersection. (such as events for the solver)
// These events don't need to be compared or copied.
// Let's not forget that the purpose of a pass is to deduct a serie of events that are common among the possible combinations of events and then to apply these events. The "unapplicable for pass" events will be applied anyway. 
function filterUnsortableEvents(p_list) {
	var answer = [];
	p_list.forEach(event_ => {
		if (!event_.outOfPass) {
			answer.push(event_);
		}
	});
	return answer;
}

/** Public function that can be used to compare events for the pass. (see above)
Use : 
p_differentKinds : array that states the different possible event kind.
p_array : array of arrays. Containes array should be implicitely paired : array in position 0 p_array is matched with position 1, arrays in position 2 and 3 matched, 4 and 5 matched...
Length of p_array must be equal to 2 * (length of p_differentKinds ). Each array in a pair must reflect the property.
Typical example in StarBattleSolve and Shimaguni solver. 
p_kind1 : kind of first event (to be ignored if only 1 event)
p_kind2 : kind of 2nd event
Precondition about p_differentKinds, p_kind1 and p_kind2 : if these two kinds are equal THEN they must belong to the array.
*/
// Performance tests have been done on Star Battle n° 148 to test which version is the best in a multipass.
function commonComparisonMultiKinds(p_differentKinds, p_array, p_kind1, p_kind2) {
	if (p_kind1 > p_kind2) {return 1;}
	if (p_kind1 < p_kind2) {return -1;}
	var found = (p_differentKinds.length == 0); // while loop has to be skipped if array is empty ;)
	var kindIndex = found ? 0 : -1;
	while(!found) { // Please no non-existent kind ;)
		kindIndex++;
		found = (p_kind1 == p_differentKinds[kindIndex]);
	}
	const k1 = 2 * kindIndex;
	const k2 = k1 + 1;
	var indexComp = 0;
	while (indexComp < p_array[k1].length) {
		if (p_array[k1][indexComp] > p_array[k2][indexComp]) {return 1;}
		if (p_array[k1][indexComp] < p_array[k2][indexComp]) {return -1;}
		indexComp++;
	}
	return 0;
}

function commonComparison(p_twoArrays, p_arraysTwo) {
	if (p_arraysTwo) {
		return commonComparisonMultiKinds([], [p_twoArrays, p_arraysTwo]);
	} else {		
		return commonComparisonMultiKinds([], p_twoArrays);
	}
}

/** TODO : REWRITE THIS LOG ! (Historical...)
Performs a multipass
p_passTools must contain the following methods :
- generatePassEventsMethod : method that turns a pass argument into a list of "list of covering events" usable by the passing method)
- orderPassArgumentsMethod : method that reorders the argument list, taking no argument and returning a list of pass arguments, each of which should be passed to p_generatePassEventsMethod)
May be used only once at start or several times, depending on passTodoMethod
- skipPassMethod (optional) : method that takes a pass argument and that determinates whether the set of possibilites designated by the pass argument is too big to be passed or not. The set of possibilities will have to be tested anyways if no other set has been tested so far in this cycle of multipasses.)
- passTodoMethod (optional) : if defined, the orderedListPassArguments will be used only once by orderPassArgumentsMethod, and then reskipped. Useful when there are lots of items to pass and there is no point to sort them or recreate a list. Typically when passing all spaces or all fences in relevant solvers.
p_methodSet, p_eventsTools : same arguments as in the pass method.
*/
GeneralSolver.prototype.multiPass = function(p_passTools) {  
	var oneMoreLoop;
	var orderedListPassArguments = p_passTools.orderPassArgumentsMethod(); 
	var ok = true;
	var resultPass;
	var i;
	var argPass;
	var answer;
	const lengthBeforeMultiPass = this.happenedEventsSeries.length;
	do {
		oneMoreLoop = false;
		
		i = 0;
		while (ok && i < orderedListPassArguments.length) {
			argPass = orderedListPassArguments[i];
			if (!oneMoreLoop || !p_passTools.skipPassMethod || !p_passTools.skipPassMethod(argPass)) {
				p_listListCoveringEvent = p_passTools.generatePassEventsMethod(argPass);
				// Where the pass is performed !
				resultPass = this.passEvents(p_listListCoveringEvent, argPass); 
				if (resultPass == PASS_RESULT.SUCCESS) {
					oneMoreLoop = true;
					//console.log("Successful pass !"+argPass);
				} else if (resultPass == PASS_RESULT.FAILURE) {
					ok = false;
					//console.log("Failed pass !"+argPass);
				}
			} else {
				autoLogMultipass("C'est trop pour nous, on passe la région "+argPass);
			}
			i++;
		}
		
		if (ok && oneMoreLoop) {
			if (p_passTools.preOrganisationMethod) {
				const result = p_passTools.preOrganisationMethod();
				ok = (result != EVENT_RESULT.FAILURE);
			}
			if (ok) {				
				if (!p_passTools.passTodoMethod) {
					orderedListPassArguments = p_passTools.orderPassArgumentsMethod(); 
				} else {
					var newOrderedListPassArguments = [];
					orderedListPassArguments.forEach(argPass => {
						if (p_passTools.passTodoMethod(argPass)) {
							newOrderedListPassArguments.push(argPass);
						}
					});
					orderedListPassArguments = newOrderedListPassArguments;
				}
			}
		}
	} while (ok && oneMoreLoop);
	if (!ok) {
		while (this.happenedEventsSeries.length > lengthBeforeMultiPass) {
			var lastEventsList = this.happenedEventsSeries.pop();
			this.undoEventList(lastEventsList.list, this.methodsSetDeductions.undoEventMethod);
		}
		answer = MULTIPASS_RESULT.FAILURE;
	} else if (this.happenedEventsSeries.length > lengthBeforeMultiPass) {
		answer = MULTIPASS_RESULT.SUCCESS;
	} else {
		answer = MULTIPASS_RESULT.HARMLESS;
	}
	this.setStateHappening(answer);
	return answer;
}

function isPassSerie (p_eventsSerie) {
	return p_eventsSerie.kind == SERIE_KIND.PASS;
}

function isQuickStart(p_eventsSerie) {
	return p_eventsSerie.kind == SERIE_KIND.QUICKSTART;
}

function isGlobalDeduction(p_eventsSerie) {
	return p_eventsSerie.kind == SERIE_KIND.GLOBAL_DEDUCTION;
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
	this.setStateHappening(OTHER_RESULTS.QUICKSTART);
}


// "do stuff method" must return GLOBAL_DEDUCTIONS_RESULT.FAILURE, GLOBAL_DEDUCTIONS_RESULT.HARMLESS or GLOBAL_DEDUCTIONS_RESULT.SUCCESS
// Method set must contain an undoing method
GeneralSolver.prototype.applyGlobalDeduction = function(p_doStuffMethod, p_methodSet, p_label) {
	var ok = true;
	var found = true;
	var state;
	this.separatelyStackDeductions = false;
	const label = p_label ? p_label : "";
	this.happenedEventsSeries.push({kind : SERIE_KIND.GLOBAL_DEDUCTION, label : label, list : [] }); 
	while (found && ok) {
		state = p_doStuffMethod();
		ok &= (state != GLOBAL_DEDUCTIONS_RESULT.FAILURE);
		found = (state == GLOBAL_DEDUCTIONS_RESULT.SUCCESS);
	}
	this.separatelyStackDeductions = true;
	
	if (!ok) {
		var lastEventsList = this.happenedEventsSeries.pop();
		this.undoEventList(lastEventsList.list, p_methodSet.undoEventMethod);
		this.setStateHappening(GLOBAL_DEDUCTIONS_RESULT.FAILURE);
		return GLOBAL_DEDUCTIONS_RESULT.FAILURE;
	}
	const extraEvents = this.happenedEventsSeries[this.happenedEventsSeries.length - 1].list.length > 0;
	if (extraEvents) {
		answer = GLOBAL_DEDUCTIONS_RESULT.SUCCESS;
	} else {
		this.happenedEventsSeries.pop();
		answer = GLOBAL_DEDUCTIONS_RESULT.HARMLESS;
	}
	this.setStateHappening(answer);
	return answer;
}

// --------------------------------
// For input (see GeneralSolverInterface)

// Always call this method when changing the 'state' that is to be displayed by the viewer !
GeneralSolver.prototype.setStateHappening = function(p_value) {
	this.lastHappeningState = p_value;
	this.stateChangedSinceLastRefresh = true;
}

// --------------------------------
// Manual logs

GeneralSolver.prototype.happenedEventsLogQuick = function() {
	return this.happenedEventsLog({quick : true});
}

GeneralSolver.prototype.happenedEventsLogComplete = function() {
	return this.happenedEventsLog({complete : true});
}

GeneralSolver.prototype.happenedEventsLog = function(p_options) {
	answer = "";
	const displayQuick = (p_options && p_options.quick);
	const displayComplete = (p_options && p_options.complete);
	this.happenedEventsSeries.forEach(eventSerie => {
		if (eventSerie.kind == SERIE_KIND.PASS) {
			answer += "Pass - " + eventSerie.label + " ";
		} else if (eventSerie.kind == SERIE_KIND.GLOBAL_DEDUCTION) {
			answer += "Global deduction - " + eventSerie.label + " ";
		} else if (eventSerie.kind == SERIE_KIND.QUICKSTART) {
			answer += "Quickstart - " + (
			(eventSerie.label && eventSerie.label != null && eventSerie.label != "") ? (eventSerie.label + " ") : "" );
		} else {
			answer += "Hypothesis - " + (displayQuick ? eventSerie.list[0] : "");
		} 
		if (!displayQuick) {
			for (var i = 0 ; i < eventSerie.list.length ; i++) {
				event_ = eventSerie.list[i];
				if (displayComplete || (eventSerie.kind == SERIE_KIND.HYPOTHESIS && i == 0) || shouldBeLoggedEvent(event_)) { // Note : shouldBeLoggedEvent is a reserved name now !						
					answer += event_.toLogString(this) + " ";
				}
			}
		}
		if (answer.charAt(answer.length - 2) == '-' && answer.charAt(answer.length - 1) == ' ') { // Scrap superfluous characters
			answer = answer.substring(0, answer.length-2);
		}
		answer += "\n";
	});
	console.log(answer); // If 'answer' is simply returned, hitting solver.happenedEventsLog() or its quick variation will keep the literal \n.
}

shouldBeLoggedEvent = function(p_event) {
	return true;
}