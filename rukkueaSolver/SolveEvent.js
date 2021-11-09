const SPACE_KIND = 1;
const SIZE_KIND = 2;
const VIEW_KIND = 3;

function SpaceEvent(p_x, p_y, p_symbol) {
	this.kind = SPACE_KIND;
	this.symbol = p_symbol;
	this.x = p_x;
	this.y = p_y;
}

SpaceEvent.prototype.toLogString = function() {	
	return "["+this.symbol+" "+this.x+","+this.y+"]";
}

SpaceEvent.prototype.copy = function() {
	return new SpaceEvent(this.x, this.y, this.symbol);
}

function SizeEvent(p_x, p_y, p_size) {
	this.kind = SIZE_KIND;
	this.size = p_size;
	this.x = p_x;
	this.y = p_y;
	this.outOfPass = true;
}

SizeEvent.prototype.toLogString = function() {	
	return "[Size "+this.x+","+this.y+ " : " +this.size+"]"; 
}

function ViewEvent(p_x, p_y, p_direction, p_size) {
	this.kind = VIEW_KIND;
	this.size = p_size;
	this.x = p_x;
	this.y = p_y;
	this.direction = p_direction;
	this.outOfPass = true;
}

ViewEvent.prototype.toLogString = function() {	
	return "[View "+this.x+","+this.y+" "+LabelDirection[this.direction]+this.size+"]"; 
}

shouldBeLoggedEvent = function(p_event) {
	return p_event.kind == SPACE_KIND;
}

