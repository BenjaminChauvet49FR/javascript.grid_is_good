function ChoiceEvent(p_x, p_y, p_number, p_valid) {
	this.number = p_number;
	this.choice = p_valid;
	this.x = p_x;
	this.y = p_y;
}

// Adjacency conditions
ChoiceEvent.prototype.opening = function() {
	if (this.number == SUKORO_CLOSED_SPACE) {
		return (this.choice ? ADJACENCY.NO : ADJACENCY.YES);
	} else {
		return (this.choice ? ADJACENCY.YES : ADJACENCY.UNDECIDED);
	}
}

ChoiceEvent.prototype.coordinateX = function() {
	return this.x;
}

ChoiceEvent.prototype.coordinateY = function() {
	return this.y;
}


// ---------
// Interfacing 

ChoiceEvent.prototype.toLogString = function() {	
	return "[" + this.x + "," + this.y + " " + this.number + (this.choice ? "" : "X")+ "]";
}

ChoiceEvent.prototype.copy = function() {
	return new ChoiceEvent(this.x, this.y, this.number, this.choice);
}

shouldBeLoggedEvent = function(p_event) {
	return (p_event.choice);
}