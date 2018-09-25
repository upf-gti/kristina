Animator.prototype.addLayer = function (o) {
	var id = this.ly_id++;

	var defaults = Object.assign({
		name: "layer" + id,
		weight: 1,
		default: null
	}, o);

	this.ly_name[id] = defaults.name;
	this.ly_weight[id] = defaults.weight;
	this.ly_default[id] = defaults.default;

	return id;
}

Animator.prototype.setDefaultState = function (layerID, stateID) {
	this.ly_default[layerID] = stateID;
}
