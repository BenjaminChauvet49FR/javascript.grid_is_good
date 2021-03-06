function ApplyEventMethodPack(p_applyEventMethod, p_deductionsMethod, p_undoEventMethod) {
	this.applyEventMethod = p_applyEventMethod;
	this.deductionsMethod = p_deductionsMethod;
	this.undoEventMethod = p_undoEventMethod;
}

ApplyEventMethodGeographicalPack.prototype = Object.create(ApplyEventMethodPack.prototype);

function ApplyEventMethodGeographicalPack(p_applyEventMethod, p_deductionsMethod, p_adjacencyMethod, p_transformMethod, p_undoEventMethod) {
	ApplyEventMethodPack.call(this, p_applyEventMethod, p_deductionsMethod, p_undoEventMethod);
	this.adjacencyMethod = p_adjacencyMethod;
	this.retrieveGeographicalDeductionMethod = p_transformMethod;
}

ApplyEventMethodGeographicalPack.prototype.constructor = ApplyEventMethodPack;

ApplyEventMethodPack.prototype.addOneAbortAndFilters = function(p_abortMethod, p_filters) {
	this.abortMethods = [p_abortMethod]; // TODO préciser que c'est au singulier ou faire quelque chose.
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