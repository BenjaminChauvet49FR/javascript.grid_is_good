//Fence events are contained elsewhere

const NUMBER_EVENT_KIND = 'N';

function NumberEvent(p_x, p_y, p_number) {
	this.kind = NUMBER_EVENT_KIND;
	this.number = p_number;
	this.x = p_x;
	this.y = p_y;
}

NumberEvent.prototype.copy = function() {
	return new NumberEvent(this.x, this.y, this.number);
}

NumberEvent.prototype.toLogString = function() {
	return "["+"N"+this.number+" "+this.x+","+this.y+"]";
}

shouldBeLoggedEvent = function(p_event) {
	return p_event.kind == NUMBER_EVENT_KIND;
}