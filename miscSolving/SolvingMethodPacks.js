// Well, only the "initial" method set for deductions so far.

/**
this.applyEventMethod : application of an event. May compute things if EVENT_RESULT.SUCCESS, then must return EVENT_RESULT.SUCCESS, EVENT_RESULT.FAILURE or EVENT_RESULT.HARMLESS .
this.deductionsMethod : transforms a list of events and an event to be solved into another list of events (that must contain events added to the entry list). 
this.undoEventMethod : undoes a list of events.
*/
function ApplyEventMethodPack(p_applyEventMethod, p_deductionsMethod, p_undoEventMethod) {
	this.applyEventMethod = p_applyEventMethod;
	this.deductionsMethod = p_deductionsMethod;
	this.undoEventMethod = p_undoEventMethod;
}

ApplyEventMethodGeographicalPack.prototype = Object.create(ApplyEventMethodPack.prototype);

/**
this.adjacencyMethod : method that turns coordinates (p_x, p_y) into a value ADJACENCY.YES, ADJACENCY.NO or ADJACENCY.UNDECIDED. 
this.retrieveGeographicalDeductionMethod : transforms a list of GeographicalDeductions (see class GeographicalDeduction) into an event.
*/
function ApplyEventMethodGeographicalPack(p_applyEventMethod, p_deductionsMethod, p_adjacencyMethod, p_transformMethod, p_undoEventMethod) {
	ApplyEventMethodPack.call(this, p_applyEventMethod, p_deductionsMethod, p_undoEventMethod);
	this.adjacencyMethod = p_adjacencyMethod;
	this.retrieveGeographicalDeductionMethod = p_transformMethod;
}

ApplyEventMethodGeographicalPack.prototype.constructor = ApplyEventMethodPack;

// Note : singular because most of the time, only one abort method that cancels everything is sollicitated when events go wrong.
// This may be different when the solver involved has a parent.
ApplyEventMethodPack.prototype.setOneAbortAndFilters = function(p_abortMethod, p_filters) {
	this.abortMethods = [p_abortMethod]; 
	this.filters = p_filters;
}

ApplyEventMethodPack.prototype.addMoreFilters = function(p_filters) {
	p_filters.forEach(filter => {
		this.filters.push(filter);
	});
}

ApplyEventMethodPack.prototype.addMoreAborts = function(p_abortMethods) {
	p_abortMethods.forEach(method => {
		this.abortMethods.push(method);
	});
}

ApplyEventMethodPack.prototype.addCompoundEventMethod = function(p_compoundEventMethod) {
	this.compoundEventMethod = p_compoundEventMethod;
}