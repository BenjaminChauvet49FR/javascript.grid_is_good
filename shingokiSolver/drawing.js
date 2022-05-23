function draw(p_context, p_drawer, p_coloursSet, p_solver) {
	p_drawer.inhibitAutoClean();
	p_drawer.clearDrawing(p_context);
	
	setupFont(p_context, p_drawer.getPixSide()/2, FONTS.ARIAL);
	alignFontCenter(p_context);

	p_drawer.drawDotsGrid(p_context, p_solver.xLength, p_solver.yLength, 
		function(p_x, p_y) {return linkToColour(p_solver.getLinkRight(p_x, p_y), p_coloursSet)},
		function(p_x, p_y) {return linkToColour(p_solver.getLinkDown(p_x, p_y), p_coloursSet)},
		function(p_xN, p_yN) {
			switch (p_solver.getLinkSpace(p_xN, p_yN)) {
				case LOOP_STATE.CLOSED : return p_coloursSet.closedLink; break;
				case LOOP_STATE.LINKED : return p_coloursSet.linkedNode; break;
				default : return p_coloursSet.undecidedLink; break;
			}
		}, 
		function() {return DOTS_SIZE.MEDIUM},
		
		
		function(p_x, p_y) {
			if (p_solver.hasPearl(p_x, p_y)) {
				p_drawer.drawShingokiPearl(p_context, p_coloursSet, p_x, p_y,  
				p_solver.getColourPearl(p_x, p_y), p_solver.getNumber(p_x, p_y)
				);
				return true;
			} else {
				return false;
			} 
		}
		
	)
}

function linkToColour(p_link, p_coloursSet) {
	switch (p_link) {
		case LOOP_STATE.LINKED : return p_coloursSet.linkedLink; break;
		case LOOP_STATE.CLOSED : return p_coloursSet.closedLink; break;
		default : return p_coloursSet.undecidedLink; break;
	}
}

Drawer.prototype.drawShingokiPearl = function(p_context, p_coloursSet, p_x, p_y, p_colourPearl, p_number) {
	var colourIn, colourWrite;
	switch(p_colourPearl) {
		case SHINGOKI_PEARL.BLACK : colourIn = p_coloursSet.darkPearlBG; colourWrite = p_coloursSet.darkPearlWrite; break;
		case SHINGOKI_PEARL.WHITE : colourIn = p_coloursSet.lightPearlBG; colourWrite = p_coloursSet.lightPearlWrite; break;
	}
	const pixXCenter = this.getPixXLeft(p_x);
	const pixYCenter = this.getPixYUp(p_y);
	const pixRadius = this.getPixSide()/3;
	p_context.beginPath();
	p_context.fillStyle = colourIn; 
	p_context.strokeStyle = colourIn; 
	p_context.ellipse(pixXCenter, pixYCenter, pixRadius, pixRadius, 0, 0, 2 * Math.PI);
	p_context.fill();
	p_context.fillStyle = colourWrite; 
	p_context.strokeStyle = colourWrite; 
	p_context.fillText(p_number, pixXCenter, pixYCenter);
}