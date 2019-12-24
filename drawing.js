//Loop variables
var ix,iy;

/**
Draw the grid on-screen on p_context, with p_global informations, with p_pix and p_colors information for pixels and colors
*/
function drawGridUltimate(p_context,p_pix,p_colors,p_global){
	
	//Upper-left pixel of the horizontal walls (Horiz) and vertical walls (Vert) ; pillars aren't part of walls (meeting of 4 walls)
	const pixStartXVert = p_pix.marginGrid.left+p_pix.sideSpace-p_pix.borderSpace;  
	const pixStartXHoriz = p_pix.marginGrid.left+p_pix.borderSpace;  
	var pixDrawXHoriz = pixStartXHoriz;	
	var pixDrawYHoriz = p_pix.marginGrid.up+p_pix.sideSpace-p_pix.borderSpace;
	var pixDrawXVert = pixStartXVert;
	var pixDrawYVert = p_pix.marginGrid.up+p_pix.borderSpace;
	
	//Rectangle dimensions
	const pixLength = p_pix.sideSpace-2*p_pix.borderSpace;
	const pixThickness = 2*p_pix.borderSpace;
	
	//Go !
	p_context.clearRect(0, 0, p_pix.canvasWidth, p_pix.canvasHeight);
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
				if(p_global.borderGrid[iy][ix].wallR == CLOSED || p_global.borderGrid[iy][ix].wallD == CLOSED
				|| p_global.borderGrid[iy+1][ix].wallR == CLOSED || p_global.borderGrid[iy][ix+1].wallD == CLOSED)
				{
					p_context.fillStyle= wallToColor(CLOSED);
				} 
				else{
					p_context.fillStyle= wallToColor(OPEN);
				}
				p_context.fillRect(pixDrawXVert,pixDrawYHoriz,pixThickness,pixThickness);
			}
			//Draw inner space

			if((p_global.mode.colorRegionIfPossible == true) && p_global.regionGrid){
				p_context.fillStyle= indexRainbow((p_global.regionGrid[iy][ix])%12,p_colors.rainbowSpaces,p_colors.bannedSpace);
				p_context.fillRect(pixDrawXHoriz,pixDrawYVert,pixLength,pixLength);
			} else if (p_global.borderGrid[iy][ix].state == CLOSED){
				p_context.fillStyle= indexRainbow(-2,null,p_colors.bannedSpace);
				p_context.fillRect(pixDrawXHoriz,pixDrawYVert,pixLength,pixLength);
			}
			pixDrawXHoriz += p_pix.sideSpace;
			pixDrawXVert += p_pix.sideSpace;
		}
		pixDrawYHoriz += p_pix.sideSpace;
		pixDrawYVert += p_pix.sideSpace;		
		pixDrawXHoriz = pixStartXHoriz;
		pixDrawXVert = pixStartXVert;
	}
	
	//Draws the borders
	const pixTotalWidth = p_global.xLength*p_pix.sideSpace;
	const pixTotalHeight = p_global.yLength*p_pix.sideSpace;
	p_context.fillStyle= colors.edge_walls;
	p_context.fillRect(p_pix.marginGrid.left,p_pix.marginGrid.up,		p_pix.borderSpace,pixTotalHeight);
	p_context.fillRect(p_pix.marginGrid.left,p_pix.marginGrid.up,		pixTotalWidth,p_pix.borderSpace);
	p_context.fillRect(p_pix.marginGrid.left+pixTotalWidth-p_pix.borderSpace,p_pix.marginGrid.up,
	p_pix.borderSpace,pixTotalHeight);
	p_context.fillRect(p_pix.marginGrid.left,p_pix.marginGrid.up+pixTotalHeight-p_pix.borderSpace,
	pixTotalWidth,p_pix.borderSpace);
}

/**
Gives the correct wall color from a wall type (a #RRGGBB string) 
@p_wallType : a type of wall between 2 spaces
*/

function wallToColor( p_wallType){
	switch(p_wallType){
		case (OPEN):
			return (colors.open_wall);break;
		case (CLOSED):
			return (colors.closed_wall);break;
	}
	return "#ffffff";
}

//TODO some sort of rainbow color
function indexRainbow(p_index,p_rainbow,p_negative){
	if (p_index < 0){
		if (p_negative){
			return p_negative;
		}
		return "";
	}
	if (p_rainbow.length > p_index)
		return p_rainbow[p_index];
	return "";

}

//--------------

/**
Adapts canvas to actual scene
*/
function adaptCanvas(p_canvas, p_pix,p_global){
	p_canvas.width = p_global.xLength*p_pix.sideSpace+20+p_pix.marginGrid.left+p_pix.marginGrid.right;
	p_canvas.height = p_global.yLength*p_pix.sideSpace+20+p_pix.marginGrid.up+p_pix.marginGrid.down;
	p_global.regionGrid = null;
}