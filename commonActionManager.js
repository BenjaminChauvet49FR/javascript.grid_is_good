const MODES = {
	SPACE:'1',
	WALL_R:'2',
	WALL_D:'3'
}

const MODE_NORMAL = {id:1,html:"Etat case",value:"Changer case grille"};
const MODE_SELECTION = {id:2,html:"Sélection",value:"Sélectionner cases"};
const MODE_ERASE = {id:3,html:"Effaçage",value:"Effacer murs autour case"};

/**
Adds the event listener of an action submit by linking it to an action for the canvas (warning : changes a text element)
*/
function addEventListenerAndCaptionActionSubmit(p_editorCore,p_modesManager,p_textElement,p_idSubmitElement,p_entry,p_mode){
	var submitElement = document.getElementById(p_idSubmitElement);
	submitElement.value = p_mode.value;
	submitElement.addEventListener('click',function(event){
		actionUnselectAll(p_editorCore); 
		setMode(p_textElement,p_modesManager,p_entry,p_mode);
	});
}

/**
Changes the mode, both visually (innerHTML) and in model 
*/
function setMode(p_textElement,p_modesManager,p_entry,p_mode){
	p_textElement.innerHTML = p_mode.html;
	switch(p_entry){
		case (MODES.SPACE):p_modesManager.clickSpace = p_mode;break; 
		case (MODES.WALL_R):p_modesManager.clickWallD = p_mode;break; 
		case (MODES.WALL_D):p_modesManager.clickWallR = p_mode;break; 
	}
}