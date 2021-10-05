function ChoiceEvent(p_x, p_y, p_value, p_choice) {
	this.index = p_value;
	this.choice = p_choice;
	this.coorX = p_x;
	this.coorY = p_y;
}

ChoiceEvent.prototype.copy = function() {
	return new ChoiceEvent(this.coorX, this.coorY, this.index, this.choice);
}

ChoiceEvent.prototype.x = function() {
	return this.coorX;
}

ChoiceEvent.prototype.y = function() {
	return this.coorY;
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
	return "["+ (this.index == NURIKABE_SEA ? "S" : this.index) + (this.choice ? "Y" : "N") + " " + this.coorX + "," + this.coorY + "]";
}

shouldBeLoggedEvent = function(p_event) {
	return p_event.index == NURIKABE_SEA;
}