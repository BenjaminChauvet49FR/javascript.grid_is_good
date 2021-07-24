const ASTRE_KIND = "A" 

const ASTRE = {
	MOON : 1,
	SUN : 2,
	UNDECIDED : 0
}

function AstreEvent(p_indexRegion, p_astre) {
	this.kind = ASTRE_KIND;
	this.index = p_indexRegion;
	this.astre = p_astre;
}