// Choice events and fence events are contained elsewhere
const CLUE_EVENT_KIND = 'cl';

function ClueEvent(p_x, p_y, p_index) {
	this.index = p_index;
	this.x = p_x;
	this.y = p_y;
	this.kind = CLUE_EVENT_KIND;
	this.outOfPass = true; // Redundant with open fences
}

ChoiceEvent.prototype.copy = function() {
	return new ChoiceEvent(this.x, this.y, this.number, this.choice);
}

// ---------
// Interfacing 

ClueEvent.prototype.toLogString = function() {	
	return "[Clue " + this.x + "," + this.y + "]";
}

shouldBeLoggedEvent = function(p_event) {
	return (p_event.kind == FENCE_EVENT_KIND);
}