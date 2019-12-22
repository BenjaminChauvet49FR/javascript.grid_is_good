//Stuff
var heightGrid = 5; 
var widthGrid = 5;

//Loop variables
var ix,iy;

// ON START
// Generate a clear border grid 
var borderGrid = [];
for(iy=0;iy<heightGrid;iy++){
	borderGrid.push([]);
	for(ix=0;ix<widthGrid;ix++){
		borderGrid[iy].push({wallD:WALL_OPEN,wallR:WALL_OPEN});
	}
}

//--------
// Draws the spaces
function drawGrid(){
	var canevas = document.getElementById("canevas");
	var context = canevas.getContext("2d");
	
	//Where it should be drawn
	const pixStartXVert = PIX.SIDE_SPACE-PIX.BORDER_SPACE;  
	const pixStartXHoriz = PIX.BORDER_SPACE;  
	var pixDrawXHoriz = pixStartXHoriz;	
	var pixDrawYHoriz = PIX.SIDE_SPACE-PIX.BORDER_SPACE;
	var pixDrawXVert = pixStartXVert;
	var pixDrawYVert = PIX.BORDER_SPACE;
	
	//Rectangle dimensions
	const pixLength = PIX.SIDE_SPACE-2*PIX.BORDER_SPACE;
	const pixThickness = 2*PIX.BORDER_SPACE;
	
	//Go !
	context.clearRect(0, 0, PIX.CANVAS_WIDTH, PIX.CANVAS_HEIGHT);
	for(iy = 0;iy < heightGrid; iy++){
		for(ix = 0;ix < widthGrid;ix++){
			//Draw down wall
			if (iy <= heightGrid-2){ 
				context.fillStyle= wallToColor(borderGrid[iy][ix].wallD);
				context.fillRect(pixDrawXHoriz,pixDrawYHoriz,pixLength,pixThickness);
			}	
			//Draw right wall
			if (ix <= widthGrid-2){
				context.fillStyle= wallToColor(borderGrid[iy][ix].wallR);
				context.fillRect(pixDrawXVert,pixDrawYVert,pixThickness,pixLength);
			}
			//Draw pillar
			if((ix <= widthGrid-2) && (iy <= heightGrid-2)){
				if(borderGrid[iy][ix].wallR == WALL_CLOSED || borderGrid[iy][ix].wallD == WALL_CLOSED
				|| borderGrid[iy+1][ix].wallR == WALL_CLOSED || borderGrid[iy][ix+1].wallD == WALL_CLOSED)
				{
					context.fillStyle= wallToColor(WALL_CLOSED);
				} 
				else{
					context.fillStyle= wallToColor(WALL_OPEN);
				}
				context.fillRect(pixDrawXVert,pixDrawYHoriz,pixThickness,pixThickness);
			}
			pixDrawXHoriz += PIX.SIDE_SPACE;
			pixDrawXVert += PIX.SIDE_SPACE;
		}
		pixDrawYHoriz += PIX.SIDE_SPACE;
		pixDrawYVert += PIX.SIDE_SPACE;		
		pixDrawXHoriz = pixStartXHoriz;
		pixDrawXVert = pixStartXVert;
	}
	
	//Draws the borders
	const pixTotalWidth = widthGrid*PIX.SIDE_SPACE;
	const pixTotalHeight = heightGrid*PIX.SIDE_SPACE;
	context.fillStyle= colors.edge_walls;
	context.fillRect(0,0,PIX.BORDER_SPACE,pixTotalHeight);
	context.fillRect(0,0,pixTotalWidth,PIX.BORDER_SPACE);
	context.fillRect(pixTotalWidth,0,PIX.BORDER_SPACE,pixTotalHeight);
	context.fillRect(0,pixTotalHeight,pixTotalWidth,PIX.BORDER_SPACE);
}





/**Switches the state of the right wall of a space*/
function switchR(p_space){
	if(p_space.wallR == WALL_CLOSED){
		p_space.wallR = WALL_OPEN;
		return;
	}
	p_space.wallR = WALL_CLOSED;
}

/**Switches the state of the down wall of a space*/
function switchD(p_space){
	if(p_space.wallD == WALL_CLOSED){
		p_space.wallD = WALL_OPEN;
		return;
	}
	p_space.wallD = WALL_CLOSED;
}

//The main function (at start)
function drawCanvas(){
	drawGrid();
}