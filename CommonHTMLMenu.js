//ATTENTION DANGER !
//Ce fichier contient des valeurs en dur sur :
// -les noms de dossier
// -les noms de fichier
// -un identifiant d'élément HTML

function createReferenceElement(p_path, p_displayedText) {
	const aNode = document.createElement("a");
    aNode.setAttribute("href", p_path);
    aNode.innerText = p_displayedText;
	return aNode;
}

function addElement(p_divElement, p_path, p_displayedText) {
    p_divElement.appendChild(addReferenceElement(p_path, p_displayedText));
    addText(p_divElement, " ");
}

function addMenu(p_divElement, p_menu) {
	addText(p_divElement, p_menu.displayName+" : ");
	p_menu.typeList.forEach( type => {
		p_divElement.appendChild(createReferenceElement(getHTMLpath(p_menu.documentPage, type.name), type.displayName));	
		addText(p_divElement, " ");		
	});
}


//function namingHTMLDoc(p_type, p_family) {
function getHTMLpath(p_type, p_family) {
    return "../" + p_family + p_type + "/" + p_type + ".html";
}

function addText(p_divElement, p_text) {
    p_divElement.appendChild(document.createTextNode(p_text));
}

const menu1 = {
	displayName : "Editeur",
	documentPage : "Editor",
	typeList : [
		{name : "shared", displayName : "Editeur partagé"}
	]
}

const menu2 = {
	displayName : "Solveurs",
	documentPage : "Solver",
	typeList : [
		{name : "starBattle", displayName : "Star battle"},
		{name : "norinori", displayName : "Norinori"},
		{name : "shimaguni", displayName : "Shimaguni"},
		{name : "heyawake", displayName : "Heyawake"},
		{name : "LITS", displayName : "LITS"},
		{name : "curvingRoad", displayName : "Curving road"}
	]
}

const menu3 = {
	displayName : "Solveur théorique",
	documentPage : "Solver",
	typeList : [
		{name : "theoryCluster", displayName : "Clusters d'adjacence"},
		{name : "theoryLoop", displayName : "Boucles"}
	]
}

const divElement = document.getElementById("div_common_menu");
addMenu(divElement, menu1);
divElement.appendChild(document.createElement("br"));
addMenu(divElement, menu2);
divElement.appendChild(document.createElement("br"));
addMenu(divElement, menu3);
divElement.appendChild(document.createElement("br"));
