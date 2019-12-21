//Stuff
var height_grid = 20; 
var width_grid = 25;

//Loop variables
var ix,iy;

// ON START
// Generate a clear border grid 
var borderGrid = [];
for(iy=0;iy<height_grid;iy++){
	borderGrid.push([]);
	for(ix=0;ix<width_grid;ix++){
		borderGrid[iy].push({wallD:WALL_OPEN,wallR:WALL_OPEN});
	}
}

//--------
// Draws the spaces
function drawTheMaze(){
	var canevas = document.getElementById("canevas");
	var context = canevas.getContext("2d");
	context.clearRect(0, 0, PIX_CANVAS_WIDTH, PIX_CANVAS_HEIGHT);
	var drawX = PIX_SIDE_CASE;
	var drawY = PIX_SIDE_CASE;
	for(iy = 0;iy < height_grid; iy++){
		for(ix = 0;ix < width_grid;ix++){
			if (iy <= height_grid-2){
				context.fillStyle= wallToColor(borderGrid[iy][ix].wallD);
				context.fillRect(drawX-PIX_SIDE_CASE,drawY,PIX_SIDE_CASE,2);
			}
			
			if (ix <= width_grid-2){
				context.fillStyle= wallToColor(borderGrid[iy][ix].wallR);
				context.fillRect(drawX,drawY-PIX_SIDE_CASE,2,PIX_SIDE_CASE);
			}
			
			drawX += PIX_SIDE_CASE;
		}
		drawY += PIX_SIDE_CASE;
		drawX = PIX_SIDE_CASE;
	}
	
	//Draws the borders
	var pix_total_width = width_grid*PIX_SIDE_CASE;
	var pix_total_height = height_grid*PIX_SIDE_CASE;
	context.fillStyle= colors.edge_walls;
	context.fillRect(0,0,1,pix_total_height);
	context.fillRect(0,0,pix_total_width,1);
	context.fillRect(pix_total_width,0,1,pix_total_height);
	context.fillRect(0,pix_total_height,pix_total_width+1,1);
}



//--------
// Capturing the mouse
// https://stackoverflow.com/questions/43172115/get-the-mouse-coordinates-when-clicking-on-canvas
canevas.addEventListener('click', function(event) {
    var rect = canevas.getBoundingClientRect();
    var pix_mouseX = event.clientX - rect.left;
    var pix_mouseY = event.clientY - rect.top;
	var spaceIndexX = Math.floor(pix_mouseX/PIX_SIDE_CASE); //index of the space, calculated from the (x,y) position
	var spaceIndexY = Math.floor(pix_mouseY/PIX_SIDE_CASE); //same
    if ((pix_mouseX % PIX_SIDE_CASE) >= (PIX_SIDE_CASE-4)){
		switchR(borderGrid[spaceIndexY][spaceIndexX]);
	}
	if ((pix_mouseX % PIX_SIDE_CASE <= 3) && spaceIndexX > 0){
		switchR(borderGrid[spaceIndexY][spaceIndexX-1]);
	}
	if ((pix_mouseY % PIX_SIDE_CASE) >= (PIX_SIDE_CASE-4)){
		switchD(borderGrid[spaceIndexY][spaceIndexX]);
	}
	if ((pix_mouseY % PIX_SIDE_CASE <= 3) && spaceIndexY > 0){
		switchD(borderGrid[spaceIndexY-1][spaceIndexX]);
	}
}, false);

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
	drawTheMaze();
}
setInterval(drawCanvas,30);