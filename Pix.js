function Pix(){
	this.sideSpace = 30;
	this.borderSpace = 2; //Inner border
	this.borderClickDetection = 5; //How many pixels from the side of a space can you click to trigger the border ?
	this.canvasWidth = 800;
	this.canvasHeight= 800;
	this.marginGrid = {
		left:0,
		up:0,
		right:0,
		down:0
	}
} 

Pix.prototype.setMarginGrid = function(p_left,p_up,p_right,p_down){
	this.marginGrid.left = p_left;
	this.marginGrid.up = p_up;
	this.marginGrid.right = p_right;
	this.marginGrid.down = p_down;
}