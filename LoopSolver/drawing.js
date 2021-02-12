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
				} else {
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
						p_context.fillStyle = rainbowRoads[p_solver.getColorChains(ix, iy) % rainbowRoads.length];
					} else {
						p_context.fillStyle = p_colorSet.presentLink;
					}
					p_context.fillRect(pixLeft, pixUp, shorter, longer);
				} else if (p_solver.getLinkDown(ix, iy) == LOOP_STATE.CLOSED && (p_solver.getLinkSpace(ix,iy) != LOOP_STATE.CLOSED) && (p_solver.getLinkSpace(ix,iy+1) != LOOP_STATE.CLOSED)) {
					if (p_wallGrid && p_wallGrid.getWallD(ix, iy)) {
						p_context.fillStyle = p_colorSet.noLinkWall ? p_colorSet.noLinkWall : p_colorSet.noLink;
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
						p_context.fillStyle = rainbowRoads[p_solver.getColorChains(ix, iy) % rainbowRoads.length];
					} else {
						p_context.fillStyle = p_colorSet.presentLink;
					}
					p_context.fillRect(pixLeft, pixUp, longer, shorter);
				} else if (p_solver.getLinkRight(ix, iy) == LOOP_STATE.CLOSED && (p_solver.getLinkSpace(ix,iy) != LOOP_STATE.CLOSED) && (p_solver.getLinkSpace(ix+1,iy) != LOOP_STATE.CLOSED)) {
					p_context.fillStyle = p_colorSet.noLink;
					if (p_wallGrid && p_wallGrid.getWallR(ix, iy)) {
						p_context.fillStyle = p_colorSet.noLinkWall ? p_colorSet.noLinkWall : p_colorSet.noLink;
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
		const fontSize = drawer.pix.sideSpace/3;
		p_context.font = fontSize+"px Arial";
		p_context.fillStyle = p_colorSet.oppositeSpaceWrite;
		if (!p_colorSet.oppositeSpaceWrite) {
			p_context.fillStyle = "#000000";
		}
		var pixLeft,pixUp;
		var textToWrite;
		for (var iy = 0; iy <  p_solver.yLength; iy++) {
			for (var ix = 0; ix < p_solver.xLength; ix++) {
				if (p_solver.getLinkedEdges(ix, iy) == 1) {
					pixLeft = this.getPixInnerXLeft(ix);
					pixDown = this.getPixInnerYUp(iy)+fontSize;
					textToWrite = p_solver.getOppositeEnd(ix, iy).x+" "+p_solver.getOppositeEnd(ix, iy).y;
					p_context.fillText(textToWrite,pixLeft,pixDown);
				}
			}
		}
	}
}

rainbowRoads = [
"#ff0000",
"#00ff00",
"#0000ff",
"#ffff00",
"#ff00ff",
"#00ffff",
"#ff0080",
"#80ff00",
"#0080ff",
"#ff8000",
"#00ff80",
"#8000ff"
]