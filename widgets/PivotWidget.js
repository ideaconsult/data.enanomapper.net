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
			var maxCount = 0;
			var objectedItems = [];
			for ( var facet in this.manager.response.facet_counts.facet_pivot[f]) {

				var topcategory = this.manager.response.facet_counts.facet_pivot[f][facet];
				if (((topcategory.value + "_endpointcategory") == this.id)
						|| ((topcategory.value + "_effectendpoint") == this.id)) {

					var count = parseInt(topcategory.count);
					if (count > maxCount) {
						maxCount = count;
					}
					$("#" + topcategory.value + "_header").text(
							topcategory.value + " (" + count + ")");
					for ( var endpointcategory in topcategory.pivot) try {
						if ((topcategory.value + "_endpointcategory") == this.id) {
							objectedItems
									.push({
										id : "#" + this.id,
										facet : topcategory.pivot[endpointcategory].value,
										count : topcategory.pivot[endpointcategory].count,
										hint : " "
									});
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
								objectedItems
										.push({
											id : "#" + this.id,
											facet : topcategory.pivot[endpointcategory].pivot[endpoint].value,
											count : topcategory.pivot[endpointcategory].pivot[endpoint].count,
											hint : " " + msg
										});

							}
					} catch (err) {
						console.log(err);
					}
				}
			}
			/*
			 * objectedItems.sort(function(a, b) { return a.facet <
			 * b.facet ? -1 : 1; });
			 */

			$(this.target).empty();
			for (var i = 0, l = objectedItems.length; i < l; i++) {
				var facet = objectedItems[i].facet,
				    view = lookup[facet] || facet;

				$(this.target).append(
					$('<li><a href="#" class="tag" title="'
							+ facet + objectedItems[i].hint
							+ '">' + view + ' <span>'
							+ objectedItems[i].count
							+ '</span></a></li>')
            .addClass('tagcloud_size_1')
            .click(this.clickHandler(facet))
        );
			}
		}
	});
	
})(jQuery);
