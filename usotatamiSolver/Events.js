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

ViewEvent.prototype.toString = function(){	
	return "["+"V"+this.state+" "+this.fenceX+","+this.fenceY+" "+this.direction+"]";
}

function RangeEvent(p_x, p_y, p_direction, p_range) {
	this.kind = RANGE_EVENT_KIND;
	this.range = p_range;
	this.direction = p_direction;
	this.x = p_x;
	this.y = p_y;
}

RangeEvent.prototype.toString = function(){	
	return "["+"R"+this.state+" "+this.fenceX+","+this.fenceY+" "+this.direction+"]";
}