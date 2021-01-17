const EVENT_KIND = {
	SPACE : 1,
	OTHER : 100
}

function SolveEvent(){ }

function SpaceEvent(p_x,p_y,p_symbol){
	solveEvent = new SolveEvent();
	solveEvent.kind = EVENT_KIND.SPACE;
	solveEvent.symbol = p_symbol;
	solveEvent.x = p_x;
	solveEvent.y = p_y;
	return solveEvent;
}

SpaceEvent.prototype.toString = function(){	
	return "["+this.x+","+this.y+"] ("+this.symbol+")";
}

SpaceEvent.prototype.copy = function(){
	return new SpaceEvent(this.symbol,this.x,this.y);
}