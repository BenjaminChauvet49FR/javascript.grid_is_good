function ApplyEventMethodNonAdjacentPack(p_applyEventMethod, p_deductionsMethod, p_undoEventMethod) {
	this.applyEventMethod = p_applyEventMethod;
	this.deductionsMethod = p_deductionsMethod;
	this.undoEventMethod = p_undoEventMethod;
}

function ApplyEventMethodPack(p_applyEventMethod, p_deductionsMethod, p_adjacencyMethod, p_transformMethod, p_undoEventMethod) {
	this.applyEventMethod = p_applyEventMethod;
	this.deductionsMethod = p_deductionsMethod;
	this.adjacencyMethod = p_adjacencyMethod;
	this.retrieveGeographicalDeductionMethod = p_transformMethod;
	this.undoEventMethod = p_undoEventMethod;
}

ApplyEventMethodPack.prototype.addAbortAndFilters = function(p_abortMethod, p_filters) {
	this.abortMethod = p_abortMethod
	this.filters = p_filters;
}

ApplyEventMethodNonAdjacentPack.prototype.addAbortAndFilters = function(p_abortMethod, p_filters) {
	this.abortMethod = p_abortMethod
	this.filters = p_filters;
}