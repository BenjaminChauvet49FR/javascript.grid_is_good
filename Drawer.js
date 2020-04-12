function Drawer(){
	this.pix = {
		sideSpace : 30,
		borderSpace : 2, //Inner border
		pathThickness : 4, //Divided by 2 at a point
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
		selectedSpace:'#bbffcc',
		rainbowSpaces:["#6666ff","#ff6666","#66ff66",
		"#66ffff","#ffff66","#ff66ff",
		"#cc66ff","#ffcc66","#66ffcc",
		"#ff00cc","#00ccff","#ccff00"],
		antiCloseWrite:'#00ffff',
		standardWrite:'#000000',
		path:'#006600'
	}
} 

/**
Sets up the margin grid. Should only be set up at the beginning of the string. 
*/
Drawer.prototype.setMarginGrid = function(p_left,p_up,p_right,p_down){ //TODO et si c'était amené à changer... ?
	this.pix.marginGrid.left = p_left;
	this.pix.marginGrid.up = p_up;
	this.pix.marginGrid.right = p_right;
	this.pix.marginGrid.down = p_down;
}

//---------------------
// All drawing functions

/**
Draw the grid on-screen on p_context, with p_editorCore informations, with this.pix and p_colors information for pixels and colors
*/

Drawer.prototype.drawGrid = function(p_context,p_editorCore){
	this.drawWallGrid(p_context,p_editorCore.wallGrid,p_editorCore.getXLength(),p_editorCore.getYLength());
	//TODO improve me this, lol !
	for(var iy = 0;iy < p_editorCore.getYLength(); iy++){
		for(var ix = 0;ix < p_editorCore.getXLength();ix++){
			if(p_editorCore.getSelection(ix,iy) == SELECTED.YES){
				p_context.fillStyle= this.colors.selectedSpace;
				p_context.fillRect(this.getPixInnerXLeft(ix),this.getPixInnerYUp(iy),this.getPixInnerSide(),this.getPixInnerSide());
			}
		}
	}
	//Numbers
	if (p_editorCore.hasNumberGrid()){
		this.drawNumbersLittle(p_context,p_editorCore.numberGrid,p_editorCore.getXLength(),p_editorCore.getYLength());
	}
	//Paths
	if (p_editorCore.hasPathGrid()){
		this.drawPathGrid(p_context,p_editorCore.pathGrid,p_editorCore.getXLength(),p_editorCore.getYLength());
	}
	
}

Drawer.prototype.drawWallGrid = function(p_context,p_wallGrid, p_xLength, p_yLength){
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
	for(iy = 0;iy < p_yLength; iy++){
		for(ix = 0;ix < p_xLength;ix++){
			//Draw down wall
			if (iy <= p_yLength-2){ 
				p_context.fillStyle= this.wallToColor(p_wallGrid.getWallD(ix,iy));
				p_context.fillRect(pixDrawXHoriz,pixDrawYHoriz,pixLength,pixThickness);
			}	
			//Draw right wall
			if (ix <= p_xLength-2){
				p_context.fillStyle= this.wallToColor(p_wallGrid.getWallR(ix,iy));
				p_context.fillRect(pixDrawXVert,pixDrawYVert,pixThickness,pixLength);
			}
			//Draw pillar
			if((ix <= p_xLength-2) && (iy <= p_yLength-2)){
				if (p_wallGrid.getWallR(ix,iy) == CLOSED || p_wallGrid.getWallD(ix,iy) == CLOSED ||
					p_wallGrid.getWallR(ix,iy+1) == CLOSED || p_wallGrid.getWallD(ix+1,iy) == CLOSED)
				{
					p_context.fillStyle= this.wallToColor(CLOSED);
				} 
				else{
					p_context.fillStyle= this.wallToColor(OPEN);
				}
				p_context.fillRect(pixDrawXVert,pixDrawYHoriz,pixThickness,pixThickness);
			}
			//Draw inside space
			if (p_wallGrid.getState(ix,iy) == CLOSED){
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
	const pixTotalWidth = p_xLength*this.pix.sideSpace;
	const pixTotalHeight = p_yLength*this.pix.sideSpace;
	p_context.fillStyle= this.colors.edge_walls;
	p_context.fillRect(this.pix.marginGrid.left,this.pix.marginGrid.up,		this.pix.borderSpace,pixTotalHeight);
	p_context.fillRect(this.pix.marginGrid.left,this.pix.marginGrid.up,		pixTotalWidth,this.pix.borderSpace);
	p_context.fillRect(this.pix.marginGrid.left+pixTotalWidth-this.pix.borderSpace,this.pix.marginGrid.up,
	this.pix.borderSpace,pixTotalHeight);
	p_context.fillRect(this.pix.marginGrid.left,this.pix.marginGrid.up+pixTotalHeight-this.pix.borderSpace,
	pixTotalWidth,this.pix.borderSpace);
}

Drawer.prototype.drawNumbersLittle = function(p_context,p_numberGrid, p_xLength, p_yLength){
	this.drawNumbersGrid(p_context, null, p_numberGrid, p_xLength, p_yLength)
}

//"Grid" qu'on combine avec la wallGrid... TODO nom à changer
Drawer.prototype.drawNumbersGrid = function(p_context,p_wallGrid,p_numberGrid, p_xLength, p_yLength){
	p_context.textAlign = 'left'; 
	p_context.textBaseline = 'top';
	p_context.font = this.getPixInnerSide()/2+"px Arial";
	p_context.fillStyle = this.colors.standardWrite;
	var ix,iy,number;
	for(iy=0;iy<p_yLength;iy++){
		for(ix=0;ix<p_xLength;ix++){
			number = p_numberGrid.getNumber(ix,iy);
			if (number != null){
				pixLeft = this.getPixInnerXLeft(ix)+2;
				pixDown = this.getPixInnerYUp(iy)+2;
				if (p_wallGrid && p_wallGrid.getState(ix,iy) == CLOSED){
					p_context.fillStyle = this.colors.antiCloseWrite;
				} else{
					p_context.fillStyle = this.colors.standardWrite;
				}
				p_context.fillText(number,pixLeft,pixDown);
			}
		}
	}
}

Drawer.prototype.drawPathGrid = function(p_context,p_pathGrid, p_xLength, p_yLength){
	p_context.textAlign = 'left'; 
	p_context.textBaseline = 'top';
	p_context.fillStyle = this.colors.path;
	const shorter = this.pix.pathThickness;
	const longer = shorter+this.pix.sideSpace;
	const pixLeftStart = this.getPixCenterX(0)-shorter/2;
	var pixLeft = pixLeftStart;
	var pixUp = this.getPixCenterY(0)-shorter/2;
	for(var iy=0;iy<p_yLength;iy++){
		for(var ix=0;ix<p_xLength;ix++){
			if (p_pathGrid.getPathD(ix,iy) == PATH.YES){
				p_context.fillRect(pixLeft,pixUp,shorter,longer);				
			}
			if (p_pathGrid.getPathR(ix,iy) == PATH.YES){
				p_context.fillRect(pixLeft,pixUp,longer,shorter);	
			}
			pixLeft += this.pix.sideSpace;
		}
		pixLeft = pixLeftStart;
		pixUp += this.pix.sideSpace;
	}
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

//---------------------
// Gets the leftmost/upmost/rightmost/downmost pixels of the inner of a desired space ;
// May also get out of the bounds of the grid for, who knows, margin
Drawer.prototype.getPixInnerXLeft = function(p_xIndex){
	return this.pix.marginGrid.left+p_xIndex*this.pix.sideSpace+this.pix.borderSpace;
}
Drawer.prototype.getPixInnerYUp = function(p_yIndex){
	return this.pix.marginGrid.up+p_yIndex*this.pix.sideSpace+this.pix.borderSpace;
}
Drawer.prototype.getPixInnerXRight = function(p_xIndex){
	return this.pix.marginGrid.left+(p_xIndex+1)*this.pix.sideSpace-this.pix.borderSpace;
}
Drawer.prototype.getPixInnerYDown = function(p_yIndex){
	return this.pix.marginGrid.up+(p_yIndex+1)*this.pix.sideSpace-this.pix.borderSpace;
}
Drawer.prototype.getPixCenterX = function(p_xIndex){
	return this.pix.marginGrid.up+(p_xIndex+0.5)*this.pix.sideSpace;
}
Drawer.prototype.getPixCenterY = function(p_yIndex){
	return this.pix.marginGrid.up+(p_yIndex+0.5)*this.pix.sideSpace;
}
Drawer.prototype.getPixInnerSide = function(){
	return this.pix.sideSpace-2*this.pix.borderSpace;
}

//---------------------
// All input functions

//Return coordinates of an element with the form {x: ... , y: ...} (space, wall ; upper-left = 0,0)

/**
If a click is done on a space, otherwise return null
*/
Drawer.prototype.getClickSpace = function(event,p_canvas,p_xLength,p_yLength){
    var indexX = Math.floor(this.getPixXWithinGrid(event,p_canvas)/this.pix.sideSpace); 
    var indexY = Math.floor(this.getPixYWithinGrid(event,p_canvas)/this.pix.sideSpace);
	if (indexX < 0 || indexX >= p_xLength || indexY < 0 || indexY >= p_yLength){
		return null;		
	}
	return {x:indexX,y:indexY}
}

/**
If a click is done when mouse is a right wall, returns the index of the corresponding space, otherwise return null
*/
Drawer.prototype.getClickWallR = function(event,p_canvas,p_editorCore){
	var pixX = this.getPixXWithinGrid(event,p_canvas); 
    var pixY = this.getPixYWithinGrid(event,p_canvas); 
	var pixXModulo = (pixX+this.pix.borderClickDetection)%this.pix.sideSpace;
	if (pixXModulo < 2*this.pix.borderClickDetection){
		var answer = {
			x:Math.floor((pixX+this.pix.borderClickDetection)/this.pix.sideSpace)-1,
			y:Math.floor(pixY/this.pix.sideSpace)
		};
		if ((answer.x < (p_editorCore.getXLength()-1)) && (answer.x >= 0) && (answer.y < p_editorCore.getYLength()) && (answer.y >= 0)){
			return answer;
		}
	}  
	return null;
}

/**
Same as above with down walls
*/
Drawer.prototype.getClickWallD = function(event,p_canvas,p_editorCore){
	var pixX = this.getPixXWithinGrid(event,p_canvas); 
    var pixY = this.getPixYWithinGrid(event,p_canvas); 
	var pixYModulo = (pixY+this.pix.borderClickDetection)%this.pix.sideSpace;
	if (pixYModulo < 2*this.pix.borderClickDetection){
		var answer = {
			x:Math.floor(pixX/this.pix.sideSpace),
			y:Math.floor((pixY+this.pix.borderClickDetection)/this.pix.sideSpace)-1
		};
		if ((answer.y < (p_editorCore.getYLength()-1)) && (answer.y >= 0) && (answer.x < p_editorCore.getXLength()) && (answer.x >= 0)){
			return answer;
		}
	}  
	return null;
}

Drawer.prototype.getClickAroundWallR = function(event,p_canvas,p_editorCore){
	const pixX = this.getPixXWithinGrid(event,p_canvas); 
    const pixY = this.getPixYWithinGrid(event,p_canvas); 
	const sideSpace = this.pix.sideSpace;
	var distanceX = pixX%sideSpace;
	distanceX = Math.min(distanceX,sideSpace-distanceX);
	var distanceY = pixY%sideSpace;
	distanceY = Math.min(distanceY,sideSpace-distanceY);
	if (distanceX < distanceY){
		return {
			x:Math.floor((pixX-sideSpace/2)/sideSpace),
			y:Math.floor(pixY/sideSpace)
		}
	}
	return null;
}

Drawer.prototype.getClickAroundWallD = function(event,p_canvas,p_editorCore){
	const pixX = this.getPixXWithinGrid(event,p_canvas); 
    const pixY = this.getPixYWithinGrid(event,p_canvas); 
	const sideSpace = this.pix.sideSpace;
	var distanceX = pixX%sideSpace;
	distanceX = Math.min(distanceX,sideSpace-distanceX);
	var distanceY = pixY%sideSpace;
	distanceY = Math.min(distanceY,sideSpace-distanceY);
	if (distanceX > distanceY){
		return {
			x:Math.floor(pixX/sideSpace),
			y:Math.floor((pixY-sideSpace/2)/sideSpace)
		}
	}
	return null;
}

//--------------------
// Setting up functions



/**
Changes the width and height of a canvas according to some parameters ; mandatory ones are the X and Y length of spaces. 
*/
Drawer.prototype.adaptCanvasDimensions = function(p_canvas,p_parameters){
	if (p_parameters.margin){
		if (p_parameters.margin.common){
			this.pix.marginGrid.left = p_parameters.margin.common;
			this.pix.marginGrid.up = p_parameters.margin.common;
			this.pix.marginGrid.right = p_parameters.margin.common;
			this.pix.marginGrid.down = p_parameters.margin.common;
		}
		if (p_parameters.margin.left){
			this.pix.marginGrid.left = p_parameters.margin.left;
		}		
		if (p_parameters.margin.up){
			this.pix.marginGrid.left = p_parameters.margin.up;
		}		
		if (p_parameters.margin.right){
			this.pix.marginGrid.left = p_parameters.margin.right;
		}		
		if (p_parameters.margin.down){
			this.pix.marginGrid.left = p_parameters.margin.down;
		}
	}
	
	const pixMaxSpace = 32; //TODO peut changer
	const pixXCanvasSize = 800; //TODO peut changer
	const pixYCanvasSize = 512; //TODO peut changer
	const pixHorizontalMargins = this.pix.marginGrid.left+this.pix.marginGrid.right
	const pixVerticalMargins = this.pix.marginGrid.up+this.pix.marginGrid.down
	const pixXArraySize = pixXCanvasSize-pixHorizontalMargins;
	const pixYArraySize = pixYCanvasSize-pixVerticalMargins;
	this.pix.sideSpace = Math.min(pixMaxSpace,Math.min(Math.floor(pixXArraySize/p_parameters.xLength),Math.floor(pixYArraySize/p_parameters.yLength)));
	this.pix.borderSpace = Math.max(1,Math.floor(this.pix.sideSpace/10));
	this.width = p_parameters.xLength*this.pix.sideSpace+pixHorizontalMargins;
	this.height = p_parameters.yLength*this.pix.sideSpace+pixVerticalMargins;
}

//--------------------
// Private functions
Drawer.prototype.getPixXWithinGrid = function(event,p_canvas){
	return (event.clientX - p_canvas.getBoundingClientRect().left - this.pix.marginGrid.left);
}

Drawer.prototype.getPixYWithinGrid = function(event,p_canvas){
	return (event.clientY - p_canvas.getBoundingClientRect().top - this.pix.marginGrid.up);
}