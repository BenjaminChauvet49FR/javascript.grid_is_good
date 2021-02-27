const FENCE_STATE = {OPEN : 2, CLOSED : 1, UNDECIDED : 0}
const FENCE_EVENT_KIND = 'Fence'

function FenceEvent(p_x, p_y, p_direction, p_state) {
	this.kind = FENCE_EVENT_KIND;
	this.state = p_state;
	this.fenceX = p_x;
	this.fenceY = p_y;
	this.direction = p_direction;
}

FenceEvent.prototype.toString = function(){	
	return "["+"F"+this.state+" "+this.fenceX+","+this.fenceY+" "+this.direction+"]";
}

