/**
Draws the region indications within a space in each. (TODO : factorisable ?)
*/
function drawInsideIndications(p_context,p_drawer,p_colorDigits,p_solver){
	const fontSize = p_drawer.pix.sideSpace/3;
	p_context.font = fontSize+"px Arial";
	var indexXFirstRegionSpace,indexYFirstRegionSpace;
	var pixLeft,pixUp;
	var textToWrite;
	var firstRegionSpace;
	for(var i=0;i<p_solver.getRegionsNumber();i++){
		firstRegionSpace = p_solver.getFirstSpaceRegion(i);
		if (p_solver.getAnswer(firstRegionSpace.x,firstRegionSpace.y) == FILLING.YES){
			p_context.fillStyle = p_colorDigits.insideIndicationsOnFilled;
		}
		else{
			p_context.fillStyle = p_colorDigits.insideIndicationsOnWhite;			
		}
		pixLeft = p_drawer.getPixInnerXLeft(firstRegionSpace.x);
		pixDown = p_drawer.getPixInnerYUp(firstRegionSpace.y)+fontSize;
		textToWrite = p_solver.getOsRemainRegion(i)+" "+p_solver.getXsRemainRegion(i);
		p_context.fillText(textToWrite,pixLeft,pixDown);
	}
	
}

/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context,p_drawer,p_color,p_solver){
	var items = [DrawableColor(p_color.filledSquare),DrawableX(p_color.emptySquare)];
	function selectionItem(x,y){
		if  (p_solver.getRegion(x,y) != BANNED){ // Should this condition be missed... (see star battle)
			if(p_solver.getAnswer(x,y) == FILLING.YES){
				return 0;
			}
			if(p_solver.getAnswer(x,y) == FILLING.NO){
				return 1;
			}
		}
		return -1;
	}
	drawer.drawSpaceContents(p_context,items,selectionItem,p_solver.xLength,p_solver.yLength);
	
}

