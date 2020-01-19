function Drawer(){
	this.pix = {
		sideSpace : 30,
		borderSpace : 2, //Inner border
		borderClickDetection : 5, //How many pixels from the side of a space can you click to trigger the border ?
		canvasWidth : 800,
		canvasHeight: 800,
		marginGrid : {
			left:0,
			up:0,
			right:0,
			down:0
		}		
	}

	
	//All the colors used in the scenery
	this.colors={
		closed_wall:'#222222',
		open_wall:'#dddddd',
		edge_walls:'#000000',
		bannedSpace:'#666666',
		rainbowSpaces:["#6666ff","#ff6666","#66ff66",
		"#66ffff","#ffff66","#ff66ff",
		"#cc66ff","#ffcc66","#66ffcc",
		"#ff00cc","#00ccff","#ccff00"]
	}
} 

Drawer.prototype.setMarginGrid = function(p_left,p_up,p_right,p_down){
	this.pix.marginGrid.left = p_left;
	this.pix.marginGrid.up = p_up;
	this.pix.marginGrid.right = p_right;
	this.pix.marginGrid.down = p_down;
}

//---------------------
// All drawing functions

/**
Draw the grid on-screen on p_context, with p_global informations, with this.pix and p_colors information for pixels and colors
*/

Drawer.prototype.drawGrid = function(p_context,p_global){
	
	var ix, iy, indexRegion;
	
	//Upper-left pixel of the horizontal walls (Horiz) and vertical walls (Vert) ; pillars aren't part of walls (meeting of 4 walls)
	const pixStartXVert = this.pix.marginGrid.left+this.pix.sideSpace-this.pix.borderSpace;  
	const pixStartXHoriz = this.pix.marginGrid.left+this.pix.borderSpace;  
	var pixDrawXHoriz = pixStartXHoriz;	
	var pixDrawYHoriz = this.pix.marginGrid.up+this.pix.sideSpace-this.pix.borderSpace;
	var pixDrawXVert = pixStartXVert;
	var pixDrawYVert = this.pix.marginGrid.up+this.pix.borderSpace;
	var innerSpaceNotColored;
	
	//Rectangle dimensions
	const pixLength = this.pix.sideSpace-2*this.pix.borderSpace;
	const pixThickness = 2*this.pix.borderSpace;
	
	//Go !
	p_context.clearRect(0, 0, this.pix.canvasWidth, this.pix.canvasHeight);
	for(iy = 0;iy < p_global.yLength; iy++){
		for(ix = 0;ix < p_global.xLength;ix++){
			//Draw down wall
			if (iy <= p_global.yLength-2){ 
				p_context.fillStyle= this.wallToColor(p_global.getWallD(ix,iy));
				p_context.fillRect(pixDrawXHoriz,pixDrawYHoriz,pixLength,pixThickness);
			}	
			//Draw right wall
			if (ix <= p_global.xLength-2){
				p_context.fillStyle= this.wallToColor(p_global.getWallR(ix,iy));
				p_context.fillRect(pixDrawXVert,pixDrawYVert,pixThickness,pixLength);
			}
			//Draw pillar
			if((ix <= p_global.xLength-2) && (iy <= p_global.yLength-2)){
				if (p_global.getWallR(ix,iy) == CLOSED || p_global.getWallD(ix,iy) == CLOSED ||
					p_global.getWallR(ix,iy+1) == CLOSED || p_global.getWallD(ix+1,iy) == CLOSED)
				{
					p_context.fillStyle= this.wallToColor(CLOSED);
				} 
				else{
					p_context.fillStyle= this.wallToColor(OPEN);
				}
				p_context.fillRect(pixDrawXVert,pixDrawYHoriz,pixThickness,pixThickness);
			}
			//Draw inner space
			innerSpaceNotColored = true;
			if(p_global.mode.colorRegionIfValid && p_global.isRegionGridValid){
				indexRegion = p_global.getRegion(ix,iy);
				if (indexRegion >= 0){
					p_context.fillStyle = this.colors.rainbowSpaces[indexRegion % 12];
					p_context.fillRect(pixDrawXHoriz,pixDrawYVert,pixLength,pixLength);
					innerSpaceNotColored = false;
				}
			}
			if (innerSpaceNotColored && p_global.getState(ix,iy) == CLOSED){
				p_context.fillStyle= this.colors.bannedSpace;
				p_context.fillRect(pixDrawXHoriz,pixDrawYVert,pixLength,pixLength);
			}
			pixDrawXHoriz += this.pix.sideSpace;
			pixDrawXVert += this.pix.sideSpace;
		}
		pixDrawYHoriz += this.pix.sideSpace;
		pixDrawYVert += this.pix.sideSpace;		
		pixDrawXHoriz = pixStartXHoriz;
		pixDrawXVert = pixStartXVert;
	}
	
	//Draws the borders
	const pixTotalWidth = p_global.xLength*this.pix.sideSpace;
	const pixTotalHeight = p_global.yLength*this.pix.sideSpace;
	p_context.fillStyle= this.colors.edge_walls;
	p_context.fillRect(this.pix.marginGrid.left,this.pix.marginGrid.up,		this.pix.borderSpace,pixTotalHeight);
	p_context.fillRect(this.pix.marginGrid.left,this.pix.marginGrid.up,		pixTotalWidth,this.pix.borderSpace);
	p_context.fillRect(this.pix.marginGrid.left+pixTotalWidth-this.pix.borderSpace,this.pix.marginGrid.up,
	this.pix.borderSpace,pixTotalHeight);
	p_context.fillRect(this.pix.marginGrid.left,this.pix.marginGrid.up+pixTotalHeight-this.pix.borderSpace,
	pixTotalWidth,this.pix.borderSpace);
}

/**
(private string)
Gives the correct wall color from a wall type (a #RRGGBB string) 
@p_wallType : a type of wall between 2 spaces
*/
Drawer.prototype.wallToColor = function( p_wallType){
	switch(p_wallType){
		case (OPEN):
			return (this.colors.open_wall);break;
		case (CLOSED):
			return (this.colors.closed_wall);break;
	}
	return "#ffffff";
}

/**
Returns something from an array or for a negative value. 
p_index : the index of the thing to return
p_array : the array of possible things
p_negative : the thing to return in case p_index is negative
*/
/*function indexRainbow(p_index,p_array,p_negative){
	if (p_index < 0){
		if (p_negative){
			return p_negative;
		}
		return null;
	}
	if (p_array.length > p_index)
		return p_array[p_index];
	return null;

}*/


//---------------------
// All input functions

//TODO improve me this !

/**
If a click is done on a space, otherwise return null
*/
Drawer.prototype.getClickSpace = function(event,p_canvas,p_global){
	var rect = p_canvas.getBoundingClientRect();
    var indexX = Math.floor((event.clientX - rect.left - this.pix.marginGrid.left)/this.pix.sideSpace); 
    var indexY = Math.floor((event.clientY - rect.top - this.pix.marginGrid.up)/this.pix.sideSpace);
	if (indexX < 0 || indexX >= p_global.xLength || indexY < 0 || indexY >= p_global.yLength){
		return null;		
	}
	return {x:indexX,y:indexY}
}

/**
If a click is done when mouse is a right wall, returns the index of the corresponding space, otherwise return null
*/
Drawer.prototype.getClickWallR = function(event,p_canvas,p_global){
	var rect = p_canvas.getBoundingClientRect();
	var pixX = (event.clientX - rect.left - this.pix.marginGrid.left); 
    var pixY = (event.clientY - rect.top - this.pix.marginGrid.up);
	var pixXModulo = (pixX+this.pix.borderClickDetection)%this.pix.sideSpace;
	if (pixXModulo < 2*this.pix.borderClickDetection){
		var answer = {
			x:Math.floor((pixX+this.pix.borderClickDetection)/this.pix.sideSpace)-1,
			y:Math.floor(pixY/this.pix.sideSpace)
		};
		if ((answer.x < (p_global.xLength-1)) && (answer.x >= 0) && (answer.y < p_global.yLength) && (answer.y >= 0)){
			return answer;
		}
	}  
	return null;
}

/**
Same as above with down walls
*/
Drawer.prototype.getClickWallD = function(event,p_canvas,p_global){
	var rect = p_canvas.getBoundingClientRect();
	var pixX = (event.clientX - rect.left - this.pix.marginGrid.left); 
    var pixY = (event.clientY - rect.top - this.pix.marginGrid.up);
	var pixYModulo = (pixY+this.pix.borderClickDetection)%this.pix.sideSpace;
	if (pixYModulo < 2*this.pix.borderClickDetection){
		var answer = {
			x:Math.floor(pixX/this.pix.sideSpace),
			y:Math.floor((pixY+this.pix.borderClickDetection)/this.pix.sideSpace)-1
		};
		if ((answer.y < (p_global.yLength-1)) && (answer.y >= 0) && (answer.x < p_global.xLength) && (answer.x >= 0)){
			return answer;
		}
	}  
	return null;
}
