function SpaceEvent(p_x,p_y,p_symbol) {
	this.symbol = p_symbol;
	this.myX = p_x;
	this.myY = p_y;
}

SpaceEvent.prototype.toString = function() {	
	return "["+this.symbol+" "+this.myX+","+this.myY+"]";
}

SpaceEvent.prototype.copy = function() {
	return new SpaceEvent(this.symbol,this.myX,this.myY);
}

SpaceEvent.prototype.opening = function() {
	return this.symbol;
}

SpaceEvent.prototype.x = function() {
	return this.myX;
}

SpaceEvent.prototype.y = function() {
	return this.myY;
}
// Maintenant que je veux que des méthodes s'appellent x et y, les propriétés ne doivent plus avoir ces noms, j'ai donc renommé les coordonnées "x" et "y" en "myX" et "myY"