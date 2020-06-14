function DrawableItem(){}

const KIND_DRAWABLE_ITEM = {
	IMAGE:1,
	COLOR:2,
	CIRCLE:3
}

/*
The x1,x2,y1,y2 are the coordinaes of the rectangle to take from the original picture (this.picture) .
*/
function DrawableImage(p_name,p_x1,p_y1,p_x2,p_y2){
	var item = new DrawableItem();
	item.setupImage(p_name,p_x1,p_y1,p_x2,p_y2);
	return item;
}

function DrawableColor(p_colorString){
	var item = new DrawableItem();
	item.setupColor(p_colorString);
	return item;
}

function DrawableCircle(p_colorBorder, p_colorInner, p_thickness) { 
	var item = new DrawableItem();
	item.kind = KIND_DRAWABLE_ITEM.CIRCLE;
	item.colorBorder = p_colorBorder;
	item.colorInner = p_colorInner;
	item.colorThickness = p_thickness;
	return item;
}

DrawableItem.prototype.setupImage = function(p_idElement,p_x1,p_y1,p_x2,p_y2){
	this.kind = KIND_DRAWABLE_ITEM.IMAGE;
	this.picture = document.getElementById(p_idElement);
	this.x1 = p_x1;
	this.x2 = p_x2;
	this.y1 = p_y1;
	this.y2 = p_y2;
}

DrawableItem.prototype.setupColor = function(p_colorString){
	this.kind = KIND_DRAWABLE_ITEM.COLOR;
	this.color = p_colorString;
}

DrawableItem.prototype.getImage = function(){
	return this.picture;
}

DrawableItem.prototype.getColorString = function(){
	return this.color;
}