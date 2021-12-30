function ChoiceEvent(p_x, p_y, p_value, p_choice) {
	this.index = p_value;
	this.choice = p_choice;
	this.x = p_x;
	this.y = p_y;
}

ChoiceEvent.prototype.copy = function() {
	return new ChoiceEvent(this.x, this.y, this.index, this.choice);
}

ChoiceEvent.prototype.coordinateX = function() {
	return this.x;
}

ChoiceEvent.prototype.coordinateY = function() {
	return this.y;
}

ChoiceEvent.prototype.opening = function() {
	if (this.index == NURIKABE_SEA) {
		return (this.choice ? ADJACENCY.YES : ADJACENCY.NO);
	} else {
		return (this.choice ? ADJACENCY.NO : ADJACENCY.UNDECIDED);
	}
}

// ---------------
// Interface

ChoiceEvent.prototype.toLogString = function() {	
	return "["+ (this.index == NURIKABE_SEA ? "S" : this.index) + (this.choice ? "Y" : "N") + " " + this.x + "," + this.y + "]";
}

shouldBeLoggedEvent = function(p_event) {
	return p_event.index == NURIKABE_SEA;
}