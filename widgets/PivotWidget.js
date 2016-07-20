(function($) {

	AjaxSolr.PivotWidget = AjaxSolr.AbstractFacetWidget.extend({
		afterRequest : function() {
			var f = this.field;

			var topcategory = this.id;
			f = "topcategory,endpointcategory,effectendpoint,unit";
			if (this.manager.response.facet_counts.facet_pivot[f] === undefined) {
				$(this.target).html(
						'no items found in current selection');
				return;
			}

			// console.log(
			// this.manager.response.facet_counts.facet_pivot);
			var objectedItems = [],
			    facet = null;
			    
			for ( var facet in this.manager.response.facet_counts.facet_pivot[f]) {

				var topcategory = this.manager.response.facet_counts.facet_pivot[f][facet];
				if (((topcategory.value + "_endpointcategory") == this.id)
						|| ((topcategory.value + "_effectendpoint") == this.id)) {

					var count = parseInt(topcategory.count);

					$("#" + topcategory.value + "_header").text(
							topcategory.value + " (" + count + ")");
					for ( var endpointcategory in topcategory.pivot) try {
						if ((topcategory.value + "_endpointcategory") == this.id) {
							objectedItems.push(this.tagRenderer(
							  facet = topcategory.pivot[endpointcategory].value,
							  topcategory.pivot[endpointcategory].count,
							  this.clickHandler(facet)
              ));
						}
						if ((topcategory.value + "_effectendpoint") == this.id)
							for ( var endpoint in topcategory.pivot[endpointcategory].pivot) {

								var msg = " ";
								if (topcategory.pivot[endpointcategory].pivot[endpoint].pivot == undefined) {
									var stats = topcategory.pivot[endpointcategory].pivot[endpoint].stats.stats_fields;
									var u = topcategory.pivot[endpointcategory].pivot[endpoint];
									u = u == undefined ? "" : u.value;
									msg += "(" + stats.loValue.min
											+ " , " + stats.loValue.max
											+ ") " + u + " ";
								} else
									for ( var unit in topcategory.pivot[endpointcategory].pivot[endpoint].pivot) {
										var stats = topcategory.pivot[endpointcategory].pivot[endpoint].pivot[unit].stats.stats_fields;
										var u = topcategory.pivot[endpointcategory].pivot[endpoint].pivot[unit];
										u = u == undefined ? ""
												: u.value;
										msg += "(" + stats.loValue.min
												+ " , "
												+ stats.loValue.max
												+ ") " + u + " ";
									}
									
  							objectedItems.push(this.tagRenderer(
  							  facet = topcategory.pivot[endpointcategory].pivot[endpoint].value,
  							  topcategory.pivot[endpointcategory].pivot[endpoint].count,
  							  " " + msg,
  							  this.clickHandler(facet)
                ));
							}
					} catch (err) {
						console.log(err);
					}
				}
			}

			$(this.target).empty().append(objectedItems);
		}
	});
	
})(jQuery);
