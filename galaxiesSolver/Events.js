//Fence events are contained elsewhere

const CHOICE_EVENT_KIND = 'C';

function ChoiceEvent(p_x, p_y, p_index, p_choice) {
	this.x = p_x;
	this.y = p_y;
	this.index = p_index;
	this.choice = p_choice;
	this.kind = CHOICE_EVENT_KIND;
}

ChoiceEvent.prototype.copy = function() {
	return new ChoiceEvent(this.x, this.y, this.index, this.choice);
}

// ---------
// Interfacing 

ChoiceEvent.prototype.toLogString = function() {
	return "["+ (this.choice ? "BO" : "BX") + " " + this.x+","+this.y + " "+ this.index + "]";
}

function shouldBeLoggedEvent(p_event) {
	return (p_event.kind != CHOICE_EVENT_KIND);
}