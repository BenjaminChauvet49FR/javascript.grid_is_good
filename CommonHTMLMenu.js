//ATTENTION DANGER !
//Ce fichier contient des valeurs en dur sur :
// -les noms de dossier contenant les solveurs/éditeurs
// -les noms de fichier HTML
// -un identifiant d'élément HTML présent dans les pages de chaque solveur/éditeur (pour ne pas avoir à régenerer le HTML à chaque actualisation de page)

function createReferenceElement(p_path, p_displayedText) {
	const aNode = document.createElement("a");
    aNode.setAttribute("href", p_path);
    aNode.innerText = p_displayedText;
	return aNode;
}

function addMenuPart(p_divElement, p_menuPart) {
	addText(p_divElement, p_menuPart.displayName+" : ");
	p_menuPart.typeList.forEach( type => {
		p_divElement.appendChild(createReferenceElement(getHTMLpath(p_menuPart.documentPage, type.name), type.displayName));	
		addText(p_divElement, " ");		
	});
}

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
	displayName : "Solveurs binaires quelconques",
	documentPage : "Solver",
	typeList : [
		{name : "starBattle", displayName : "Star battle"},
		{name : "norinori", displayName : "Norinori"},
		{name : "shimaguni", displayName : "Shimaguni"},
		{name : "chocona", displayName : "Chocona"},
	]
}

const menu3 = {
	displayName : "Solveurs binaires avec adjacence",
	documentPage : "Solver",
	typeList : [
		{name : "heyawake", displayName : "Heyawake"},
		{name : "LITS", displayName : "LITS"},
		{name : "curvingRoad", displayName : "Curving road"}
	]
}

const menu4 = {
	displayName : "Solveurs à boucle",
	documentPage : "Solver",
	typeList : [
		{name : "entryExit", displayName : "EntryExit"},
		{name : "koburin", displayName : "Koburin"},
		{name : "masyu", displayName : "Masyu"}
	]
}

const menu5 = {
	displayName : "Solveur théorique",
	documentPage : "Solver",
	typeList : [
		{name : "theoryCluster", displayName : "Clusters d'adjacence"},
		{name : "theoryLoop", displayName : "Boucles"},
		{name : "theoryLoopRegion", displayName : "Boucles à régions"}
	]
}

const divElement = document.getElementById("div_common_menu");
addMenuPart(divElement, menu1);
divElement.appendChild(document.createElement("br"));
addMenuPart(divElement, menu2);
divElement.appendChild(document.createElement("br"));
addMenuPart(divElement, menu3);
divElement.appendChild(document.createElement("br"));
addMenuPart(divElement, menu4);
divElement.appendChild(document.createElement("br"));
addMenuPart(divElement, menu5);
divElement.appendChild(document.createElement("br"));
