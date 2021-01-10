function SpaceEvent(p_symbol,p_x,p_y){
	this.symbol = p_symbol;
	this.x = p_x;
	this.y = p_y;
}

SpaceEvent.prototype.toString = function(){	
	return "["+this.x+","+this.y+"] ("+this.symbol+")";
}

SpaceEvent.prototype.copy = function(){
	return new SpaceEvent(this.symbol,this.x,this.y);
	/*return {
		symbol : this.symbol,
		x : this.x,
		y : this.y
	}*/ //I tried something as simple as that but it wasn't a SpaceEvent object, hence a few problems when using toString (and undoing, I think)
}