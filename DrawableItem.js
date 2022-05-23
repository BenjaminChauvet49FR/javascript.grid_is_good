function DrawableItem(){}

const KIND_DRAWABLE_ITEM = {
	IMAGE : 1,
	COLOUR : 2,
	CIRCLE : 3,
	LITTLE_X : 4,
	X : 4,
	SQUARE : 5,
	TRIANGLE : 6,
	HORIZONTAL_DOTS : 7,
	VERTICAL_DOTS : 8,
	
	CIRCLE_UPPER_RIGHT : 101,
	PLUS_UPPER_RIGHT : 102,
	SQUARE_UPPER_RIGHT : 103,
	TEXT : 200
}

/*
The x1,x2,y1,y2 are the coordinaes of the rectangle to take from the original picture (this.picture) .
*/
function DrawableImage(p_name,p_x1,p_y1,p_x2,p_y2){
	var item = new DrawableItem();
	item.setupImage(p_name,p_x1,p_y1,p_x2,p_y2);
	return item;
}

function DrawableColour(p_colourString){
	var item = new DrawableItem();
	item.setupColour(p_colourString);
	return item;
}

function DrawableCircle(p_colourBorder, p_colourInner, p_thickness) { 
	var item = new DrawableItem();
	item.kind = KIND_DRAWABLE_ITEM.CIRCLE;
	item.colourBorder = p_colourBorder;
	item.colourInner = p_colourInner;
	item.thickness = p_thickness;
	return item;
}

function DrawableSquare(p_colourBorder, p_colourInner, p_thickness) { 
	var item = new DrawableItem();
	item.kind = KIND_DRAWABLE_ITEM.SQUARE;
	item.colourBorder = p_colourBorder;
	item.colourInner = p_colourInner;
	item.thickness = p_thickness;
	return item;
}

function DrawableTriangle(p_colourBorder, p_colourInner, p_thickness) { 
	var item = new DrawableItem();
	item.kind = KIND_DRAWABLE_ITEM.TRIANGLE;
	item.colourBorder = p_colourBorder;
	item.colourInner = p_colourInner;
	item.thickness = p_thickness;
	return item;
}

function DrawableX(p_colour) { 
	var item = new DrawableItem();
	item.kind = KIND_DRAWABLE_ITEM.X;
	item.colour = p_colour;
	return item;
}

function DrawableText(p_colour, p_text, p_font) { // To use them with drawSpaceContentsCoorsList
	var item = new DrawableItem();
	item.kind = KIND_DRAWABLE_ITEM.TEXT;
	item.colour = p_colour;
	item.value = p_text;  
	item.font = p_font; 
	return item;
}

function DrawableLittleX(p_colour) { 
	var item = new DrawableItem();
	item.kind = KIND_DRAWABLE_ITEM.LITTLE_X;
	item.colour = p_colour;
	return item;
}

function DrawableLittleCircleUpperRight(p_colour) { 
	var item = new DrawableItem();
	item.kind = KIND_DRAWABLE_ITEM.CIRCLE_UPPER_RIGHT;
	item.colour = p_colour;
	return item;
}

function DrawableLittlePlusUpperRight(p_colour) { 
	var item = new DrawableItem();
	item.kind = KIND_DRAWABLE_ITEM.PLUS_UPPER_RIGHT;
	item.colour = p_colour;
	return item;
}

function DrawableLittleSquareUpperRight(p_colour) { 
	var item = new DrawableItem();
	item.kind = KIND_DRAWABLE_ITEM.SQUARE_UPPER_RIGHT;
	item.colour = p_colour;
	return item;
}

function DrawableHorizDots(p_colour, p_number) {
	var item = new DrawableItem();
	item.kind = KIND_DRAWABLE_ITEM.HORIZONTAL_DOTS;
	item.colour = p_colour; 
	item.number = p_number;
	return item;
}

function DrawableVertDots(p_colour, p_number) {
	var item = new DrawableItem();
	item.kind = KIND_DRAWABLE_ITEM.VERTICAL_DOTS;
	item.colour = p_colour;
	item.number = p_number;
	return item;
}

// ---------

DrawableItem.prototype.setupImage = function(p_idElement,p_x1,p_y1,p_x2,p_y2){
	this.kind = KIND_DRAWABLE_ITEM.IMAGE;
	this.picture = document.getElementById(p_idElement);
	this.x1 = p_x1;
	this.x2 = p_x2;
	this.y1 = p_y1;
	this.y2 = p_y2;
}

DrawableItem.prototype.setupColour = function(p_colourString) {
	this.kind = KIND_DRAWABLE_ITEM.COLOUR;
	this.colour = p_colourString;
}

DrawableItem.prototype.getColour = function() {
	return this.colour;
}