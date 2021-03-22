/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_colourSet, p_solver){
	var supposedNumber;
	const fontSize = p_drawer.getPixInnerSide();
	p_context.font = fontSize+"px Arial";
	p_context.textAlign = 'center'; 
	p_context.textBaseline = 'middle';
	for(var iy=0; iy<p_solver.yLength; iy++) {
		for(var ix=0; ix<p_solver.xLength; ix++) {
			supposedNumber = p_solver.getFixedNumber(ix, iy)
			if (supposedNumber != null) {
				p_context.fillStyle = p_colourSet.numberWriteFixed;
				p_context.fillText(supposedNumber, p_drawer.getPixCenterX(ix), p_drawer.getPixCenterY(iy));
			} else {
				supposedNumber = p_solver.getNotFixedNumber(ix, iy);
				if (supposedNumber != null) {
					p_context.fillStyle = p_colourSet.numberWriteNotFixed;
					p_context.fillText(supposedNumber, p_drawer.getPixCenterX(ix), p_drawer.getPixCenterY(iy));
				}
			}
		}
	}
}

