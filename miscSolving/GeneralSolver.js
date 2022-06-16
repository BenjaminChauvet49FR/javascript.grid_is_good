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
	SUCCESS : 13,
	FAILURE : 11,
	HARMLESS : 12
}

const QUICKSTART_RESULT = { // Don't give it the same values as DEDUCTIONS_RESULT. Some tried, they had trouble. 
	SUCCESS : 16,
    FAILURE : 17,
    ALREADY_DONE : 18,
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

const RESOLUTION_RESULT = { 
	MULTIPLE : 54,
	NOT_FOUND : 55,
	SUCCESS : 53,
	FAILURE : 51,
	SEARCHING : 52
}

// ----------------
// When things go wrong

function FailureEvent() {
	this.failure = true;
}

function isFailed(p_listEventsToApply) {
	return p_listEventsToApply.length && p_listEventsToApply[p_listEventsToApply.length-1].failure;
}

const FILTER_FAILURE = DEDUCTIONS_RESULT.FAILURE;

// ----------------
// Initialisation

function GeneralSolver() { }

// This method should be called by the inheriting "construct".
GeneralSolver.prototype.generalConstruct = function() {
	this.separatelyStackDeductions = true; // When true, stacks a new list for a deduction ; when false, adds the events to the last array of happenedEventsSeries. 
	this.happenedEventsSeries = []; // List of (non-empty list of events). All events beyond the first must be logical deductions (logic of any kind, including geographic) of the first one.	
	this.setStateHappening(OTHER_RESULTS.DEFAULT); // this.counterSameState = 0 an this.lastHappeningState = OTHER_RESULTS.DEFAULT
	
	// Note : this field is public in READING but not in WRITING !
	this.quickStartDone = false; // Depending on the puzzle, it may be required to start with the quickstart before imputting anything on the canvas.
	
	// In the setup, defining methods in method packs (for deductions, pass, multipass) is actually the right thing to do.
	
	// Manual part ! Needs to be overwritten by solver.
	this.automaticMode = true;
	this.manualEventsList = [];

	// Note : a puzzle should also contain the following method sets :
	// -methodsSetDeductions, which is described in the tryToApplyHypothesis.
}

// ----------------
// Deductions, geographical verification, undoing

/** 

	Generic method for any solver that applies an event if possible and logically deduces other event. Events are cancelled if an impossible event happens.
	p_startingEvent : PRE (puzzle-related event, described below ; it must have a set of methods) that can lead to consequences

	this.methodsSetDeductions must be defined and contain some of the following methods :
	-always necessary :
	- applyEventMethod : a method that states how to apply the PRE (e.g. fill a space in a grid and modify numbers in the cluster). 
	- deductionsMethod : method that updates the list of events to apply as deductions to the one being applied. Must return the list of PREs potentially updated with new PRE's.
	- undoEventMethod : method to undo a PRE.
	
	-necessary if the puzzle is geographical :
	- adjacencyMethod : method that takes (x,y) and must return whether the space (x,y) must be considered open. The limitation of one global cluster makes sense here.
	- retrieveGeographicalDeductionMethod : transforms the GeographicalDeduction (see corresponding class) into a PRE.

	-optionnal :
	- abortMethod : method so the puzzle solver is authorized to do vital stuff such as cleaning environment when a mistake is made. (If no aborting, this method isn't automatically called)
	- filters : list of methods that must each take no argument and return either a PRE list (that may be empty) or FILTER_FAILURE if something went wrong. 
	These methods should allow to add new events that cannot/ should not be deducted by the application of a single PRE.
	Order of filters matter for optimisation since as soon as the application of a filter returns a non-empty list, the chain breaks and returns to individual event applications (or aborts)
	- compoundEventMethod : rarer ; only used for dealing with compound events. Not all puzzles use this. It should return a list of events (compound or not) 
	Warning : methods should be provided (for this.applyEventMethod), not calls of methods ! Closures will likely be necessary since the solver will have to be called and (this.applyEventMethod cannot simply be "this.putIntoSpace", rather a closure applied with the solver itself) . Also, don't forget the keyword "return" in both the closure and the method.
*/
GeneralSolver.prototype.tryToApplyHypothesis = function (p_startingEvent) { 
	var listEventsToApply = [p_startingEvent]; //List of the "events" type used by the solver. 
	// Events can be of any kind but, if the puzzle is geographical, must have the following methods :
	// A "x" method (int), a "y" method (int), a "opening" method (ADJACENCY.YES | ADJACENCY.NO | SPACE.UNDEFINED), in which case no geographical check is performed)
    var eventBeingApplied;
    var listEventsApplied = [];
    var ok = true;
    var resultDo;
    var x, y, symbol;
    var ir;
    var newClosedSpaces;
    var firstOpenThisTime;
	pseudoFilterGeographicalDeductions = [];
	
    while (ok && listEventsToApply.length > 0) {
		// Overall (classical + geographical) verification
        newClosedSpaces = [];
        firstOpenThisTime = false;
        while (ok && listEventsToApply.length > 0) {
            // Classical verification
            eventBeingApplied = listEventsToApply.pop();
			if (eventBeingApplied.isCompoundEvent) { // Compound event
				this.methodsSetDeductions.compoundEventMethod(listEventsToApply, eventBeingApplied);
				resultDo = EVENT_RESULT.HARMLESS;
			} else {				
				resultDo = (eventBeingApplied.failure ? EVENT_RESULT.FAILURE : this.methodsSetDeductions.applyEventMethod(eventBeingApplied));
			}
			if (resultDo == EVENT_RESULT.FAILURE) {
				ok = false;
			}
			if (resultDo == EVENT_RESULT.SUCCESS) {
				this.methodsSetDeductions.deductionsMethod(listEventsToApply, eventBeingApplied);
				listEventsApplied.push(eventBeingApplied);
			}
        }
		
		// listEventsToApply is empty at this point.
		// When logical deductions are performed individually (e.g. each space is watched as itself), apply other methods that may lead to deductions
		if (this.methodsSetDeductions.filters) {
			var iFil = 0; 
			while (ok && listEventsToApply.length == 0 && iFil < this.methodsSetDeductions.filters.length) {
				filter = this.methodsSetDeductions.filters[iFil];
				var listEventsToApplyFiltered = filter(); // Warning : to be worked with "listEventsToApply"
				ok = (listEventsToApplyFiltered != FILTER_FAILURE);
				if (ok) {
					if (listEventsToApplyFiltered.length > 0) {
						listEventsToApply = listEventsToApplyFiltered;
					} else {
						iFil++;
					}
				}
			}
		}
		// TODO : The last "geographical treatment". Any other trace of geographical solver has been successfully removed. (I think)
		if (ok && listEventsToApply.length == 0 && this.methodsSetDeductions.adjacencyMethod) {			
			listEventsToApply = this.pseudoFilterGeographicalDeductions(listEventsApplied, this.methodsSetDeductions); 
			ok = (listEventsToApply != FILTER_FAILURE);
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
GeneralSolver.prototype.undoEventList = function (p_listEventsToUndo) {
	while (p_listEventsToUndo.length > 0) {
		const eventToUndo = p_listEventsToUndo.pop();
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
	if (this.happenedEventsSeries.length == 0) {
		this.quickStartDone = false;
	}
}

GeneralSolver.prototype.tryToApplyHypothesisSafe = function(p_eventBeingApplied) {
	if (this.quickStartDone) {	
		return this.tryToApplyHypothesis(p_eventBeingApplied);
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

/**Passes a list of covering events (for instance, if a region contains spaces "1 2 3 4" and we want to apply a pass on it, it should have the following events :
 [[(open space 1),(close space 1)], [(open space 2),(close space 2)], [(open space 3),(close space 3)], [(open space 4),(close space 4)]]) 
 // p_methodSet : must contain applyEventMethod, deductionMethod, adjacencyClosureMethod, transformMethod, extras (or not)
 // p_eventsTools : must contain comparisonMethod, copyMethod, optionally argumentToLabelMethod
 An event is 'in pass' if it is destined to be in the resulting list. By default, an event is in pass, to make it not in pass just add a property "outOfPass = true".
 Events in the "list list" don't have to be in pass themselves. 
 
 this.methodsSetPass must be defined and contain some of the following methods :
 - p_eventsTools.comparisonMethod : compares in pass events (needs to compare any pair of in pass event)
 - p_eventsTools.copyMethod : copies in pass events (needs to copy any in pass event)
  
 -Optionnal :
 - argumentToLabelMethod : method that transforms a pass argument to a label
 
*/
GeneralSolver.prototype.passEvents = function (p_listListCoveringEvent, p_passArgument) {
	var listEventsExtracted = this.passEventsAnnex(p_listListCoveringEvent, 0);
	var resultDo;
	if (listEventsExtracted != DEDUCTIONS_RESULT.FAILURE) {
		
		if (listEventsExtracted.length > 0) {
			this.separatelyStackDeductions = false;
			this.happenedEventsSeries.push({kind : SERIE_KIND.PASS , label : this.methodsSetPass.argumentToLabelMethod ? this.methodsSetPass.argumentToLabelMethod(p_passArgument) : p_passArgument, list : []}); 
			listEventsExtracted.forEach( deductedEvent => {
				this.tryToApplyHypothesis(deductedEvent);	
			});
			this.separatelyStackDeductions = true;
			resultDo = PASS_RESULT.SUCCESS;
		} else {
			resultDo = PASS_RESULT.HARMLESS;
		}
	} else {
		resultDo = PASS_RESULT.FAILURE;
	}
	this.setStateHappening(resultDo);
	return resultDo;
}

GeneralSolver.prototype.passEventsAnnex = function (p_listListCoveringEvent, p_indexInList) {
	if (p_indexInList == p_listListCoveringEvent.length) {
		return [];
	} else {
		var listCoveringEvent = p_listListCoveringEvent[p_indexInList];
		var deductedEvents = DEDUCTIONS_RESULT.FAILURE;
		var eventsToIntersect;
		var emptyResult = false;
		var i = 0;
		while (i < listCoveringEvent.length && !emptyResult) {
			possibleEvent = listCoveringEvent[i];
			const happenedEventsBeforeDeduction = this.happenedEventsSeries.length;
			resultDeds = this.tryToApplyHypothesis(possibleEvent);
			if (resultDeds != DEDUCTIONS_RESULT.FAILURE) {
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
		const listEvents1 = p_eventsListOld; //Already sorted ;)
		var listEvents2 = filterUnsortableEvents(p_eventsListNew);
		listEvents2 = listEvents2.sort(p_eventsTools.comparisonMethod);
		var i1 = 0;
		var i2 = 0;
		var listEventsIntersect = [];
		var comparison;
		while (i1 < listEvents1.length && i2 < listEvents2.length) {
			comparison = p_eventsTools.comparisonMethod(listEvents1[i1], listEvents2[i2], p_eventsTools.comparisonMethod);
			if (comparison < 0) {
				i1++;
			} else if (comparison > 0) {
				i2++;
			} else {
				listEventsIntersect.push(p_eventsTools.copyMethod(listEvents1[i1]));
				i1++;
				i2++;
			}
		}
		return listEventsIntersect;
	}
}

// Exclude methods that shouldn't be applied for sort and intersection. (such as events for geographical solver, or min and max in ranged puzzles)
// These events don't need to be compared or copied.
// Let's not forget that the purpose of a pass is to deduct a serie of events that are common among the possible combinations of events and then to apply these events. The "unapplicable for pass" events will be applied anyway. 
function filterUnsortableEvents(p_list) {
	var listEventsFiltered = [];
	p_list.forEach(event_ => {
		if (!event_.outOfPass) {
			listEventsFiltered.push(event_);
		}
	});
	return listEventsFiltered;
}

GeneralSolver.prototype.passEventsSafe = function (p_listListCoveringEvent, p_passArgument) {
	if (this.quickStartDone) {
		return this.passEvents(p_listListCoveringEvent, p_passArgument);
	}
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
p_passTools must contain the following methods (unlike deduction and mono-passing, it isn't bound to the puzzle) :
- generatePassEventsMethod : method that turns a pass argument into a list of "list of covering events" usable by the passing method)
- orderPassArgumentsMethod : method that reorders the argument list, taking no argument and returning a list of pass arguments, each of which should be passed to p_generatePassEventsMethod)
May be used only once at start or several times, depending on passTodoMethod
- skipPassMethod (optional) : method that takes a pass argument and that determinates whether the set of possibilites designated by the pass argument is too big to be passed or not. The set of possibilities will have to be tested anyways if no other set has been tested so far in this cycle of multipasses.)
- passTodoMethod (optional) : if defined, the listPassArguments will be used only once by orderPassArgumentsMethod, and then reskipped. Useful when there are lots of items to pass and there is no point to sort them or recreate a list. Typically when passing all spaces or all fences in relevant solvers.
*/
GeneralSolver.prototype.multiPass = function(p_passTools) {  
	var oneMoreLoop;
	var listPassArguments = p_passTools.orderPassArgumentsMethod(); 
	var ok = true;
	var resultPass;
	var i;
	var argPass;
	const lengthBeforeMultiPass = this.happenedEventsSeries.length;
	do {
		oneMoreLoop = false;
		
		i = 0;
		while (ok && i < listPassArguments.length) { 
			argPass = listPassArguments[i];
			if (!oneMoreLoop || !p_passTools.skipPassMethod || !p_passTools.skipPassMethod(argPass)) {
				p_listListCoveringEvent = p_passTools.generatePassEventsMethod(argPass);
				// Where the pass is performed !
				resultPass = this.passEvents(p_listListCoveringEvent, argPass); 
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
		
		if (ok && oneMoreLoop) {			
			if (!p_passTools.passTodoMethod) {
				listPassArguments = p_passTools.orderPassArgumentsMethod(); 
			} else {
				var newListPassArguments = [];
				listPassArguments.forEach(argPass => {
					if (p_passTools.passTodoMethod(argPass)) {
						newListPassArguments.push(argPass);
					}
				});
				listPassArguments = newListPassArguments; 
			}
		}
	} while (ok && oneMoreLoop);
	if (!ok) {
		while (this.happenedEventsSeries.length > lengthBeforeMultiPass) {
			var lastEventsList = this.happenedEventsSeries.pop();
			this.undoEventList(lastEventsList.list, this.methodsSetDeductions.undoEventMethod);
		}
		resultMP = MULTIPASS_RESULT.FAILURE;
	} else if (this.happenedEventsSeries.length > lengthBeforeMultiPass) {
		resultMP = MULTIPASS_RESULT.SUCCESS;
	} else {
		resultMP = MULTIPASS_RESULT.HARMLESS;
	}
	this.setStateHappening(resultMP);
	return resultMP;
}

GeneralSolver.prototype.multiPassSafe = function(p_passTools) {  
	if (this.quickStartDone) {
		return this.multiPass(p_passTools);
	}
}

// --------------------------------
// Quickstart

/**
As-is, quickstart events are totaly managed by solvers that call deductions methods.
this.quickstart is enough, just provide an event list method so all the applied events are concatenated into a single serie that will be logged as "Quick start".
*/

GeneralSolver.prototype.quickStart = function() {
	if (this.quickStartDone) {
		this.setStateHappening(QUICKSTART_RESULT.ALREADY_DONE);
		return QUICKSTART_RESULT.ALREADY_DONE;
	}
	var ok = true;
	this.separatelyStackDeductions = false;	
	var happening;
	const eventList = this.setResolution.quickStartEventsMethod();
	this.happenedEventsSeries.push({kind : SERIE_KIND.QUICKSTART, label : null, list : [] });
	// Event list is one single list that may contain either events or QS labels.
	for (var i = 0 ; i < eventList.length ; i++) {
		if (eventList[i].quickStartLabel) {
			// If the previous QS deduction didn't bring anything new, expel it...
			if (this.happenedEventsSeries[this.happenedEventsSeries.length-1].list.length == 0) {
				this.happenedEventsSeries.pop();
			}			
			// Add a new potentially filled serie
			this.happenedEventsSeries.push({kind : SERIE_KIND.QUICKSTART , label : eventList[i].quickStartLabel, list : [] });	
		} else {			
			// Add an event to the last serie
			happening = this.tryToApplyHypothesis(eventList[i]);
			if (happening == DEDUCTIONS_RESULT.FAILURE) {
				ok = false;
				break;
			}				
		}
	}
	// Quick start not parasital if list in happenedEventsSeries is empty.
	/*if (this.happenedEventsSeries[this.happenedEventsSeries.length-1].list.length == 0) {
		this.happenedEventsSeries.pop();
	}*/ // NOPE, deleted since we decided inputs must be backed by Quickstart.
	this.separatelyStackDeductions = true;
	if (ok) {
		this.quickStartDone = true;
		this.setStateHappening(QUICKSTART_RESULT.SUCCESS);
		return QUICKSTART_RESULT.SUCCESS;
	} else {
		var noooList;
		while (this.happenedEventsSeries.length > 0) {
			noooList = this.happenedEventsSeries.pop();
			// this.undoEventList(noooList.list, this.methodsSetDeductions.undoEventMethod); Actually, seeing where something went wrong is a good idea. Don't undo stuff !
		}
		this.setStateHappening(QUICKSTART_RESULT.FAILURE);
		return QUICKSTART_RESULT.FAILURE;
	}
}


// "do stuff method" must return GLOBAL_DEDUCTIONS_RESULT.FAILURE, GLOBAL_DEDUCTIONS_RESULT.HARMLESS or GLOBAL_DEDUCTIONS_RESULT.SUCCESS
// Method set must contain an undoing method
GeneralSolver.prototype.applyGlobalDeduction = function(p_doStuffMethod, p_methodSet, p_label) {
	var resultDeds;
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
		resultDeds = GLOBAL_DEDUCTIONS_RESULT.SUCCESS;
	} else {
		this.happenedEventsSeries.pop();
		resultDeds = GLOBAL_DEDUCTIONS_RESULT.HARMLESS;
	}
	this.setStateHappening(resultDeds);
	return resultDeds;
}

// --------------------------------
// Hypothesis and series handling (for resolution among others)

// Count all the last events down to the most recent hypothese
// Note : the serie must contain at least one hypothesis, which means it cannot be tested on harmless deductions (that don't add an hypothesis serie)
GeneralSolver.prototype.numberOfRelevantDeductionsSinceLastHypothesis = function(p_relevancyMethod) { 
	var sum = 0;
	var index = this.happenedEventsSeries.length;
	do {
		index--;
		if (!p_relevancyMethod) {		
			sum += this.happenedEventsSeries[index].list.length;
		} else {
			this.happenedEventsSeries[index].list.forEach(event_ => {
				if (p_relevancyMethod(event_)) {
					sum++;
				}
			});
		}
	} while (this.happenedEventsSeries[index].kind != SERIE_KIND.HYPOTHESIS);
	return sum;
}

GeneralSolver.prototype.isHypothese = function(p_serie) {
	return (p_serie.kind == SERIE_KIND.HYPOTHESIS);
}

GeneralSolver.prototype.getHypothese = function(p_serie) {
	return (p_serie.list[0]);
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
// Resolution

const EXAMPLE_SPECIAL_OPTIONS_RESOLVE = {retainOneSolution : false}

// Fun note : "isSolved" method is not standard, but rather fully managed by each solver.
// Methods needed : quickStartMethod to perform quickStart(s), and searchSolutionMethod
// Note : this method works with tryAllPossibilities in order to find two solutions at most. It doesn't look for more. 
GeneralSolver.prototype.resolve = function(p_specialOptions) {
	this.depthResearch = 0; // Recursion depth - number of calls to the try-again recursive method 
	this.depthOneSolution = 0; // Value of depthResearch once the first solution has been found
	if (p_specialOptions && p_specialOptions.retainOneSolution == false) {
		this.retainOneSolution = false;
	} else {
		this.retainOneSolution = true;
	}
	if (!this.quickStartDone) {
		const qsState = this.quickStart();
		if (qsState == QUICKSTART_RESULT.FAILURE) {
			return RESOLUTION_RESULT.FAILURE;
		}
	}
	this.indexFirstUndecidedHypothesis = -1;
	this.hypothesesToSolution = [];
	var solutionRes = this.setResolution.searchSolutionMethod();
	if (this.hypothesesToSolution.length != 0 && !this.setResolution.isSolvedMethod()) {
		while (this.happenedEventsSeries.length > 0) {				
			this.undoToLastHypothesis();
		}
		this.quickStart(); // Yes, you need to redo quick start since you ... well, cleaned everything ! (IDK why I removed this line)
		for (var k = 0 ; k < this.hypothesesToSolution.length ; k++) {
			this.tryToApplyHypothesis(this.hypothesesToSolution[k]);
		}
		this.setResolution.searchSolutionMethod();
	}
	this.setStateHappening(solutionRes);
	return solutionRes;
}

// Kinda like pass. Except we are doing ever more stuff because we are looking for one solution of the puzzle.
// We are also noting all the possibilites that have not been tried at the first divergence point of the solution. 
GeneralSolver.prototype.tryAllPossibilities = function(p_eventChoice)  {	
	this.depthResearch++;
	const lengthBeforeHypothesis = this.happenedEventsSeries.length; 
	var ok = true;
	var solutionsFoundCount = 0;
	for (var i = 0 ; i < p_eventChoice.length ; i++) {
		ok = (this.tryToApplyHypothesis(p_eventChoice[i]) != DEDUCTIONS_RESULT.FAILURE);
		if (ok) {
			const attemptResolution = this.setResolution.searchSolutionMethod(); // Only recursive call !
			if (attemptResolution == RESOLUTION_RESULT.SUCCESS) {
				solutionsFoundCount++;
				if (solutionsFoundCount == 1) {
					if (this.depthOneSolution == 0) {						
						this.depthOneSolution = this.depthResearch; 
					}
					if (this.retainOneSolution) {						
						this.copyFirstSolution();
					}
				}
				if (solutionsFoundCount == 2) {
					this.depthResearch--;
					return RESOLUTION_RESULT.MULTIPLE;
				}
				
			} else if (attemptResolution == RESOLUTION_RESULT.MULTIPLE) {
				this.depthResearch--;
				return RESOLUTION_RESULT.MULTIPLE;
			}
			while (this.happenedEventsSeries.length > lengthBeforeHypothesis) {				
				this.undoToLastHypothesis();
			}
		}
	} // To for loop
	
	this.depthResearch--; // No more recursive calls : decrease the level.
	if (solutionsFoundCount == 1) {
		return RESOLUTION_RESULT.SUCCESS;
	}
	if (solutionsFoundCount == 2) {
		return RESOLUTION_RESULT.MULTIPLE;
	}
	return RESOLUTION_RESULT.FAILURE;
}

GeneralSolver.prototype.copyFirstSolution = function() {
	for (var k = 0 ; k < this.happenedEventsSeries.length ; k++) {
		if (this.isHypothese(this.happenedEventsSeries[k])) {
			this.hypothesesToSolution.push(
				this.methodsSetPass.copyMethod(this.getHypothese(this.happenedEventsSeries[k]))); 
		}
	}
}

// --------------------------------
// Ergonomic

// Always call this method when changing the 'state' that is to be displayed by the viewer !
GeneralSolver.prototype.setStateHappening = function(p_value) {
	this.lastHappeningState = p_value;
	this.stateChangedSinceLastRefresh = true;
}

// --------------------------------
// Manual part
// (much simpler than automatic)

GeneralSolver.prototype.setAutomaticMode = function(p_isAuto) {
	this.automaticMode = p_isAuto;
}

GeneralSolver.prototype.isAutomaticMode = function() {
	return this.automaticMode;
}

GeneralSolver.prototype.tryToApplyHypothesisManual = function(p_eventBeingApplied) {
	const appliedResult = this.methodsSetDeductionsManual.applyEventMethod(p_eventBeingApplied); 
	if (appliedResult == EVENT_RESULT.SUCCESS) {
		this.manualEventsList.push(p_eventBeingApplied); 
		if ((this.manualEventsList.length >= 2) && this.methodsSetDeductionsManual.areOppositeEventsMethod(p_eventBeingApplied, this.manualEventsList[this.manualEventsList.length - 2])) {
			this.manualEventsList.pop();
			this.manualEventsList.pop(); // Remove from the list two consecutive events that cancel each other
		}
	}
}

GeneralSolver.prototype.undoManual = function() {
	const eventToUndo = this.manualEventsList.pop();
	this.methodsSetDeductionsManual.undoEventMethod(eventToUndo);
}