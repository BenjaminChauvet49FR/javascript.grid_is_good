// Drawer expansion (not a big deal, as the drawer could've been a parameter as well. Referring to Drawer regularly could be good.)
// Warning : new argument p_wallGrid added. Also, no non-nullity tested.
Drawer.prototype.drawSolverLinkInsideSpaces = function (p_context, p_colorSet, p_solver, p_wallGrid) {
    const pixThicknessClosedLink = Math.max(Math.floor(this.getPixInnerSide()) / 8,1);
    const shorter = Math.max(Math.floor(this.getPixInnerSide() / 12)*2, 2);
    const longer = shorter + this.pix.sideSpace;
    const pixLeftStart = this.getPixCenterX(0) - shorter / 2;
    var pixLeft = pixLeftStart;
    var pixUp = this.getPixCenterY(0) - shorter / 2;
	for (var iy = 0; iy <  p_solver.yLength; iy++) {
        for (var ix = 0; ix < p_solver.xLength; ix++) {
			pixInnerLeft = this.getPixInnerXLeft(ix);
			pixInnerUp = this.getPixInnerYUp(iy);
			// Draw space contents
			if (p_solver.getLinkSpace(ix, iy) == LOOP_STATE.CLOSED && !p_solver.isBanned(ix,iy)) {
				if (p_solver.areActiveClosedSpaces()) {
					p_context.fillStyle = p_colorSet.noLinkState;
					p_context.fillRect(pixInnerLeft, pixInnerUp, this.getPixInnerSide(), this.getPixInnerSide());
				} else if (p_solver.areXsAutomaticallyDrawed()) {
					this.drawCrossX(p_context, ix, iy, {color : p_colorSet.noLinkState});
				}
            } else if (!p_solver.areAllOpenSpaces() && p_solver.getLinkSpace(ix, iy) == LOOP_STATE.LINKED) {
                p_context.fillStyle = p_colorSet.presentLinkState;
                p_context.fillRect(pixInnerLeft, pixInnerUp, this.getPixInnerSide(), this.getPixInnerSide());
            }
		}
	}
    for (var iy = 0; iy <  p_solver.yLength; iy++) {
        for (var ix = 0; ix < p_solver.xLength; ix++) {
			pixInnerLeft = this.getPixInnerXLeft(ix);
			pixInnerUp = this.getPixInnerYUp(iy);
			// Draw onto space down border
            if (iy < ( p_solver.yLength-1)) {
				if (p_solver.getLinkDown(ix, iy) == LOOP_STATE.LINKED) {
					if (p_solver.getColorChains(ix, iy) != null) {
						p_context.fillStyle = COLOURS.LOOP_RAINBOW_ROADS[p_solver.getColorChains(ix, iy) % COLOURS.LOOP_RAINBOW_ROADS.length];
					} else {
						p_context.fillStyle = p_colorSet.presentLink;
					}
					p_context.fillRect(pixLeft, pixUp, shorter, longer);
				} else if (p_solver.getLinkDown(ix, iy) == LOOP_STATE.CLOSED && (p_solver.getLinkSpace(ix,iy) != LOOP_STATE.CLOSED) && (p_solver.getLinkSpace(ix,iy+1) != LOOP_STATE.CLOSED)) {
					if (p_wallGrid && p_wallGrid.getWallD(ix, iy)) {
						p_context.fillStyle = p_colorSet.noLinkWall ? p_colorSet.noLinkWall : p_colorSet.noLink; // For region loop solvers
					} else {
						p_context.fillStyle = p_colorSet.noLink;
					}
					p_context.fillRect(pixInnerLeft, this.getPixYDown(iy), this.getPixInnerSide(), 2); 
				}
            }
			// Drawn onto space right border
            if (ix < (p_solver.xLength-1)) {
				if (p_solver.getLinkRight(ix, iy) == LOOP_STATE.LINKED) {
					if (p_solver.getColorChains(ix, iy) != null) {
						p_context.fillStyle = COLOURS.LOOP_RAINBOW_ROADS[p_solver.getColorChains(ix, iy) % COLOURS.LOOP_RAINBOW_ROADS.length];
					} else {
						p_context.fillStyle = p_colorSet.presentLink;
					}
					p_context.fillRect(pixLeft, pixUp, longer, shorter);
				} else if (p_solver.getLinkRight(ix, iy) == LOOP_STATE.CLOSED && (p_solver.getLinkSpace(ix,iy) != LOOP_STATE.CLOSED) && (p_solver.getLinkSpace(ix+1,iy) != LOOP_STATE.CLOSED)) {
					p_context.fillStyle = p_colorSet.noLink;
					if (p_wallGrid && p_wallGrid.getWallR(ix, iy)) {
						p_context.fillStyle = p_colorSet.noLinkWall ? p_colorSet.noLinkWall : p_colorSet.noLink; // For region loop solvers
					} else {
						p_context.fillStyle = p_colorSet.noLink;
					}
					p_context.fillRect(this.getPixXRight(ix), pixInnerUp, 2, this.getPixInnerSide()); 
				}
            }
			pixLeft += this.pix.sideSpace;
        }
        pixLeft = pixLeftStart;
        pixUp += this.pix.sideSpace;
    }
	if (p_solver.ergonomicOptions.displayOppositeEnds) {
		const fontSize = this.pix.sideSpace / 3;
		setupFont(p_context, fontSize, FONTS.ARIAL);
		alignFontCenter(p_context);
		p_context.fillStyle = p_colorSet.oppositeSpaceWrite;
		if (!p_colorSet.oppositeSpaceWrite) {
			p_context.fillStyle = COLOURS.LOOP_ERGONOMIC_OPPOSITE_END;
		}
		var pixLeft,pixUp;
		var textToWrite;
		for (var iy = 0; iy <  p_solver.yLength; iy++) {
			for (var ix = 0; ix < p_solver.xLength; ix++) {
				if (p_solver.getLinkedEdges(ix, iy) == 1) {
					pixLeft = this.getPixCenterX(ix);
					pixDown = this.getPixInnerYUp(iy) + fontSize;
					textToWrite = p_solver.getOppositeEnd(ix, iy).x+" "+p_solver.getOppositeEnd(ix, iy).y;
					p_context.fillText(textToWrite,pixLeft,pixDown);
				}
			}
		}
	}
}