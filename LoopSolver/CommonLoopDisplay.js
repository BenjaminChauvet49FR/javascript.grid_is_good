var itemInputSubmit = function(p_id, p_value) {
	const input = document.createElement("input");
	input.setAttribute("type", "submit");
	input.setAttribute("id", p_id);
	input.setAttribute("value", p_value);
	return input;
}

function initializeItemsLoopInfos(p_itemId, p_solver) {
	const divCommonLoopDisplayElement = document.getElementById(p_itemId);
	const inputColour = itemInputSubmit("submit_color_chains", "Colorier les chaînes");
	const inputDisplayEnds = itemInputSubmit("submit_see_opposite_ends", "Afficher les bouts opposés");
	const inputDisplayOut = itemInputSubmit("submit_mask_information_chains", "Masquer informations");
	divCommonLoopDisplayElement.innerText = "Affichage :";
	divCommonLoopDisplayElement.appendChild(inputColour);
	divCommonLoopDisplayElement.appendChild(inputDisplayEnds);
	divCommonLoopDisplayElement.appendChild(inputDisplayOut);
	putActionElementClick("submit_color_chains",function(event){p_solver.seeColorChainsAction()}); 
	putActionElementClick("submit_see_opposite_ends",function(event){p_solver.seeOppositeEndsAction()});
	putActionElementClick("submit_mask_information_chains",function(event){p_solver.maskChainsInformation()});
}