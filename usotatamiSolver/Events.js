//Fence events are contained elsewhere

const VIEW_EVENT_KIND = 'V';
const RANGE_EVENT_KIND = 'R';

function ViewEvent(p_x, p_y, p_direction, p_view) {
	this.kind = VIEW_EVENT_KIND;
	this.view = p_view;
	this.direction = p_direction;
	this.x = p_x;
	this.y = p_y;
}

ViewEvent.prototype.copy = function() {
	return new ViewEvent(this.x, this.y, this.direction, this.view);
}

ViewEvent.prototype.shouldBeLogged = function() {
	return false;
}

function RangeEvent(p_x, p_y, p_direction, p_range) {
	this.kind = RANGE_EVENT_KIND;
	this.range = p_range;
	this.direction = p_direction;
	this.x = p_x;
	this.y = p_y;
}



RangeEvent.prototype.copy = function() {
	return new RangeEvent(this.x, this.y, this.direction, this.range);
}

shouldBeLoggedEvent = function(p_event) {
	return p_event.kind == FENCE_EVENT_KIND;
}

ViewEvent.prototype.toString = function() {
	return "["+"V"+this.view+" "+this.x+","+this.y+" "+LabelDirection[this.direction]+"]";
}

RangeEvent.prototype.toString = function() {	
	return "[R "+this.x+","+this.y+" "+LabelDirection[this.direction] + " " + this.range+"]";
}