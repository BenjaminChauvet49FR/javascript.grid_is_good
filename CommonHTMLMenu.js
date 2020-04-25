//ATTENTION DANGER !
//Ce fichier contient des valeurs en dur sur : 
// -les noms de dossier
// -les noms de fichier
// -un identifiant d'élément HTML

function addToElement(p_divElement,p_htmlDoc,p_displayedText){
	var aNode = document.createElement("a");
	aNode.setAttribute("href",p_htmlDoc);
	aNode.innerText = p_displayedText;
	p_divElement.appendChild(aNode);
	addText(p_divElement," ");
}

function namingHTMLDoc(p_isEditor,p_folder){
	return "../"+p_folder+(p_isEditor ? "Editor" : "Solver")+"/"+(p_isEditor ? "Editor" : "Solver")+".html";
}

function addText(p_divElement,p_text){
	p_divElement.appendChild(document.createTextNode(p_text));
}


const divElement = document.getElementById("div_common_menu");
addText(divElement,"Editeurs : ");
addToElement(divElement,namingHTMLDoc(true,"starBattle"),"Star battle");
addToElement(divElement,namingHTMLDoc(true,"shared"),"Partagé");
divElement.appendChild(document.createElement("br"));
addText(divElement,"Solveurs : ");
addToElement(divElement,namingHTMLDoc(false,"starBattle"),"Star battle");
addToElement(divElement,namingHTMLDoc(false,"norinori"),"Norinori");
addToElement(divElement,namingHTMLDoc(false,"shimaguni"),"Shimagni");
addToElement(divElement,namingHTMLDoc(false,"heyawake"),"Heyawake");
addText(divElement,"Solveurs théoriques : ");
addToElement(divElement,namingHTMLDoc(false,"theoryCluster"),"Theorical cluster");
