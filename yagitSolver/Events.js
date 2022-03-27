//Fence events are contained elsewhere

const SHAPE_EVENT_KIND = 'S';
const YAGIT_FENCE_EVENT_KIND = 'F';
const DEAD_END_KIND = 'D';

function YagitFenceEvent(p_orientation, p_index, p_state) {
	this.orientation = p_orientation;
	this.index = p_index;
	this.state = p_state;
	this.kind = YAGIT_FENCE_EVENT_KIND;
}

YagitFenceEvent.prototype.copy = function() {
	return new YagitFenceEvent(this.orientation, this.index, this.state);
}

function ShapeEvent(p_x, p_y, p_shape) {
	this.x = p_x;
	this.y = p_y;
	this.shape = p_shape;
	this.kind = SHAPE_EVENT_KIND;
	this.outOfPass = true;
}

function DeadEndEvent(p_x, p_y) {
	this.x = p_x;
	this.y = p_y;
	this.outOfPass = true;
}

// ---------
// Interfacing 

YagitFenceEvent.prototype.toLogString = function(p_solver) {
	const fence = p_solver.fencesList[this.orientation][this.index];
	if (this.orientation == OH) {
		return "[FenceH<" + fence.xLeft+"-"+fence.xRight+","+fence.y+">" + LabelFenceState[this.state] + "]" ;
	} else {
		return "[FenceV<" + fence.x+","+fence.yUp+"-"+fence.yDown+">" + LabelFenceState[this.state] + "]" ;		
	}
}

ShapeEvent.prototype.toLogString = function() {
	return "[Sh." + this.shape + " " + this.x + "," + this.y + "]";
}

DeadEndEvent.prototype.toLogString = function() {
	return "[DE " + this.x + "," + this.y + "]";
}

function shouldBeLoggedEvent(p_event) {
	return (p_event.kind == YAGIT_FENCE_EVENT_KIND);
}