const RAITONANBA = {
	LIGHT : 2,
	BLOCK : 1,
	X : 0
}

const LIGHT = {
	UNDECIDED : 0,
	YES : 2,
	NO : 1
}

const LabelRaitonanba = ['X', 'B', 'L'];
const LabelLight = [null, 'X', 'O'];

const ORIENTATION_KIND = "Ork";

ChoiceEvent.prototype.getSymbol = function() {
	return this.number;
}

ChoiceEvent.prototype.toLogString = function() {	
	return "["+ LabelRaitonanba[this.number] + (this.choice ? "Y" : "N") + " " + this.x + "," + this.y + "]";
}

LightOrientationEvent = function(p_x, p_y, p_orientation, p_light) {
	this.x = p_x;
	this.y = p_y;
	this.orientation = p_orientation;
	this.light = p_light;
	this.outOfPass = true;
}

LightOrientationEvent.prototype.toLogString = function() {
	return "[Lt " + LabelLight[this.light] + " " + this.x + "," + this.y + " " + stringOrientation(this.orientation) + "]"; 
}

shouldBeLoggedEvent = function(p_event) {
	return (p_event.choice);
}