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

shouldBeLoggedEvent = function(p_event) {
	return (p_event.choice);
}