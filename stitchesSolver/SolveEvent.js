// No "kind" this time so far.

// ----------------------------------------
// Constants also used elsewhere.
const SPACE_STATE = {BUTTON : 2, EMPTY : 1, UNDECIDED : 0};
const LINK_STATE = {LINKED : 2, CLOSED : 1, UNDECIDED : 0};
const EVENT_KIND = {SPACE : 1, LINK : 0}
const LABEL_SPACE_STATE = ["-", "E", "B"];
const LABEL_LINK_STATE = ["-", "C", "L"];

function SpaceEvent(p_x, p_y, p_symbol) {
	this.kind = EVENT_KIND.SPACE;
	this.symbol = p_symbol;
	this.x = p_x;
	this.y = p_y;
}

SpaceEvent.prototype.toString = function(){	
	return "["+LABEL_SPACE_STATE[this.symbol]+" "+this.x+","+this.y+"]";
}

SpaceEvent.prototype.copy = function() {
	return new SpaceEvent(this.x, this.y, this.symbol);
}

// -----------
function LinkEvent(p_x, p_y, p_direction, p_state) { // LinkEvent and not BindEvent, let's conform ourselves...
	this.kind = EVENT_KIND.LINK;
	this.state = p_state;
	this.direction = p_direction;
	this.linkX = p_x;
	this.linkY = p_y;
}

LinkEvent.prototype.copy = function() {
	return new LinkEvent(this.linkX, this.linkY, this.direction, this.state);
}

LinkEvent.prototype.toString = function() {	
	return "["+"L"+LABEL_LINK_STATE[this.state]+" "+this.linkX+","+this.linkY+" "+LabelDirection[this.direction]+"]";
}

function isSpaceEvent(p_event) {
	return p_event.kind == EVENT_KIND.SPACE;
}

function isLinkEvent(p_event) {
	return p_event.kind == EVENT_KIND.LINK;
}