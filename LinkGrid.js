// Note : 
// Tricks ! Linkgrid is actually wallgrid, but the sole purpose of this file is to mask it...


const LINKGRID = { // Trick for reusing walls for links
	NOT_LINKED : WALLGRID.OPEN, 
	LINKED : WALLGRID.CLOSED 
} 

function generateLinkArray(p_widthGrid, p_heightGrid) {
    return generateWallArray(p_widthGrid, p_heightGrid);
}

function getLinkRFromArray(p_arraySpace, p_x, p_y) {
	return p_arraySpace[p_y][p_x].wallR;
}

function getLinkDFromArray(p_arraySpace, p_x, p_y) {
	return p_arraySpace[p_y][p_x].wallD;
}