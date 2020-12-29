/**
Draws the around indications (TODO : factorisable ?)
*/
function drawAroundIndications(p_context,p_drawer,p_colorDigits,p_solver){
	var pixFont = p_drawer.pix.sideSpace-p_drawer.pix.borderSpace;
	savedTextAlign = p_context.textAlign;
	savedTextBaseline = p_context.textBaseline;
	p_context.textAlign = 'center';
	p_context.textBaseline = 'middle';
	var pixXUpAndDown = p_drawer.getPixCenterX(0);
	var pixXLeft = p_drawer.getPixCenterX(-1);	
	var pixXRight = p_drawer.getPixCenterX(p_solver.xLength);
	var pixYLeftAndRight = p_drawer.getPixCenterY(0); 
	var pixYUp = p_drawer.getPixCenterY(-1);
	var pixYDown = p_drawer.getPixCenterY(p_solver.yLength);
	p_context.font = pixFont+"px Arial";
	for(var i=0;i<p_solver.xyLength;i++){
		p_context.fillStyle = p_colorDigits.starIndication; //TODO perform color management
		p_context.fillText(p_solver.getOsRemainColumn(i),pixXUpAndDown,pixYUp);
		p_context.fillText(p_solver.getOsRemainRow(i),pixXLeft,pixYLeftAndRight);
		p_context.fillStyle = p_colorDigits.crossIndication;
		p_context.fillText(p_solver.getXsRemainRow(i),pixXRight,pixYLeftAndRight);
		p_context.fillText(p_solver.getXsRemainColumn(i),pixXUpAndDown,pixYDown);
		pixXUpAndDown += p_drawer.pix.sideSpace;
		pixYLeftAndRight += p_drawer.pix.sideSpace;
	}
	p_context.textAlign = savedTextAlign;
	p_context.textBaseline = savedTextBaseline;
}

/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context,p_drawer,p_color,p_solver){
	var items = [DrawableColor(p_color.openSquare), 
				DrawableColor(p_color.closedSquare), 
				DrawableColor(p_color.LSquare), 
				DrawableColor(p_color.ISquare), 
				DrawableColor(p_color.TSquare), 
				DrawableColor(p_color.SSquare)];
				
	function selectionShape(x,y){
		if(p_solver.getAnswer(x,y) == SPACE.OPEN){
			switch (p_solver.getShape(x, y)) {
				case LITS.L : return 2; break;
				case LITS.I : return 3; break;
				case LITS.T : return 4; break;
				case LITS.S : return 5; break;
				default : return 0;
			}
		} else if(p_solver.getAnswer(x,y) == SPACE.CLOSED){
			return 1;
		}
		return -1;
	}
	function selectionOpening(x,y) {
		if (p_solver.getAnswer(x,y) == SPACE.OPEN) {
			return 0;
		} else if(p_solver.getAnswer(x,y) == SPACE.CLOSED){
			return 1;
		}
		return -1;
	}
	
	p_drawer.drawSpaceContents(p_context,items,selectionShape,p_solver.xLength,p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context,document.getElementById("img_map"),16,selectionOpening,0,p_solver.xLength,p_solver.yLength);
}

