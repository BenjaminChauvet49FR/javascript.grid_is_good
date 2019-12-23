//Loop variables
var ix,iy;

/**
p_wallGrid : the wall grid to be drawn
p_regionGrid : the region grid to be drawn
p_width : the width of both grids
p_height : the height of both grids
*/
//function drawGridUltimate(p_wallGrid, p_regionGrid, p_xLength, p_yLength){
function drawGridUltimate(p_context,p_global){
	
	//Upper-left pixel of the horizontal walls (Horiz) and vertical walls (Vert) ; pillars aren't part of walls (meeting of 4 walls)
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
	p_context.clearRect(0, 0, PIX.CANVAS_WIDTH, PIX.CANVAS_HEIGHT);
	for(iy = 0;iy < p_global.yLength; iy++){
		for(ix = 0;ix < p_global.xLength;ix++){
			//Draw down wall
			if (iy <= p_global.yLength-2){ 
				p_context.fillStyle= wallToColor(p_global.borderGrid[iy][ix].wallD);
				p_context.fillRect(pixDrawXHoriz,pixDrawYHoriz,pixLength,pixThickness);
			}	
			//Draw right wall
			if (ix <= p_global.xLength-2){
				p_context.fillStyle= wallToColor(p_global.borderGrid[iy][ix].wallR);
				p_context.fillRect(pixDrawXVert,pixDrawYVert,pixThickness,pixLength);
			}
			//Draw pillar
			if((ix <= p_global.xLength-2) && (iy <= p_global.yLength-2)){
				if(p_global.borderGrid[iy][ix].wallR == WALL_CLOSED || p_global.borderGrid[iy][ix].wallD == WALL_CLOSED
				|| p_global.borderGrid[iy+1][ix].wallR == WALL_CLOSED || p_global.borderGrid[iy][ix+1].wallD == WALL_CLOSED)
				{
					p_context.fillStyle= wallToColor(WALL_CLOSED);
				} 
				else{
					p_context.fillStyle= wallToColor(WALL_OPEN);
				}
				p_context.fillRect(pixDrawXVert,pixDrawYHoriz,pixThickness,pixThickness);
			}
			//Draw inner space
			if(p_global.regionGrid){
				p_context.fillStyle= indexRainbow(p_global.regionGrid[iy][ix]);
				p_context.fillRect(pixDrawXHoriz,pixDrawYVert,pixLength,pixLength);
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
	const pixTotalWidth = p_global.xLength*PIX.SIDE_SPACE;
	const pixTotalHeight = p_global.yLength*PIX.SIDE_SPACE;
	p_context.fillStyle= colors.edge_walls;
	p_context.fillRect(0,0,PIX.BORDER_SPACE,pixTotalHeight);
	p_context.fillRect(0,0,pixTotalWidth,PIX.BORDER_SPACE);
	p_context.fillRect(pixTotalWidth-PIX.BORDER_SPACE,0,PIX.BORDER_SPACE,pixTotalHeight);
	p_context.fillRect(0,pixTotalHeight-PIX.BORDER_SPACE,pixTotalWidth,PIX.BORDER_SPACE);
}

/**
Gives the correct wall color from a wall type (a #RRGGBB string) 
@p_wallType : a type of wall between 2 spaces
*/

function wallToColor( p_wallType){
	switch(p_wallType){
		case (WALL_OPEN):
			return (colors.open_wall);break;
		case (WALL_CLOSED):
			return (colors.closed_wall);break;
	}
	return "#ffffff";
}

//TODO some sort of rainbow color
function indexRainbow(p_index){
	if (p_index < 0){
		return "#000000";
	}
	switch(p_index % 12){
		case 0:return "#6666ff";break;
		case 1:return "#ff6666";break;
		case 2:return "#66ff66";break;
		case 3:return "#66ffff";break;
		case 4:return "#ffff66";break;
		case 5:return "#ff66ff";break;
		case 6:return "#cc66ff";break;
		case 7:return "#ffcc66";break;
		case 8:return "#66ffcc";break;
		case 9:return "#ff00cc";break;
		case 10:return "#00ccff";break;
		case 11:return "#ccff00";break;
	}
}

//------------------

/**
Adapts canvas to actual scene
*/
function adaptCanvas(p_canvas, p_global){
	p_canvas.width = p_global.xLength*PIX.SIDE_SPACE+20;
	p_canvas.height = p_global.yLength*PIX.SIDE_SPACE+20;
	p_global.regionGrid = null;
}