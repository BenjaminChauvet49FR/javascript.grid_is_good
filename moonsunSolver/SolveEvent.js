const ASTRE_KIND = "A" 

const ASTRE = {
	MOON : 1,
	SUN : 2,
	UNDECIDED : 0
}

function AstreEvent(p_indexRegion, p_astre) {
	this.kind = ASTRE_KIND;
	this.index = p_indexRegion;
	this.astre = p_astre;
}

AstreEvent.prototype.copy = function() {
	return new AstreEvent(this.index, this.astre);
}

AstreEvent.prototype.toLogString = function() {
	return "(MS reg. " + this.index + " " + (this.astre == ASTRE.MOON ? "M" : "S") + ")";
}

shouldBeLoggedLoopSolverEvent = function(p_event) {
	return p_event.kind == ASTRE_KIND;
}
