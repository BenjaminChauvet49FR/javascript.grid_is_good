/**
Draws what's inside spaces
*/
function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver, p_extraIndications) {

	function getEmptySpaceElement(p_x, p_y) { // Cross , block, bulb
		if (p_solver.getNumber(p_x, p_y) != null) {
			return -1;
		}
		const answerElt = p_solver.getAnswer(p_x, p_y); 
		if (answerElt == RAITONANBA.X) {
			return 0;
		} 
		if (answerElt == RAITONANBA.BLOCK) {
			return 1;
		}
		if (answerElt == RAITONANBA.LIGHT) {
			return 2;
		}
		return -1;
	}
	
	function getAbordingColours(p_x, p_y) {
		const lightH = p_solver.getLightsHorizontal(p_x, p_y);
		const lightV = p_solver.getLightsVertical(p_x, p_y);
		var colourH = null;
		var colourV = null;
		if (lightH == LIGHT.YES) {
			colourH = p_coloursSet.lightExpected;
		} else if (lightH == LIGHT.NO) {
			colourH = p_coloursSet.noLightExpected;
		}
		if (lightV == LIGHT.YES) {
			colourV = p_coloursSet.lightExpected;
		} else if (lightV == LIGHT.NO) {
			colourV = p_coloursSet.noLightExpected;
		}
		return [colourH, colourV, colourH, colourV];
	}
	
	
	const shapesFG = [DrawableX(p_coloursSet.x), DrawableSquare(p_coloursSet.line, p_coloursSet.block), DrawableCircle(p_coloursSet.line, p_coloursSet.lightbulb)]; 
	var lightSpan;
	for (var y = 0 ; y < p_solver.xLength ; y++) {
		lightSpan = p_solver.getHorizontalLightSpan(y);
		if (lightSpan != null) {
			p_drawer.drawRectangleStripHorizontal(p_context, p_coloursSet.litSpace, lightSpan.xMin, lightSpan.xMax, y);
		}
	}
	for (var x = 0 ; x < p_solver.yLength ; x++) {
		lightSpan = p_solver.getVerticalLightSpan(x);
		if (lightSpan != null) {
			p_drawer.drawRectangleStripVertical(p_context, p_coloursSet.litSpace, x, lightSpan.yMin, lightSpan.yMax);
		}
	}
	p_drawer.drawSpaceContents2Dimensions(p_context, shapesFG, getEmptySpaceElement, p_solver.xyLength, p_solver.xyLength);
	if (p_extraIndications.checkBoxLights.checked) {
		p_drawer.drawTrapezesInsideCoorsList(p_context, getAbordingColours, p_solver.numericSpacesList);
	}
	p_drawer.drawNumbersInsideStandardCoorsList(p_context, drawNumberClosure(p_solver, p_coloursSet), p_solver.numericSpacesList, FONTS.ARIAL);
}

drawNumberClosure = function(p_solver, p_coloursSet) {
	return function(p_x, p_y) {
		supposedNumber = p_solver.getNumber(p_x, p_y);
		if (supposedNumber != null) {
			return new DrawSpaceValue(supposedNumber, p_coloursSet.numberWrite);
		}
		return null;
	}
}