(function($) {

	AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget
		.extend({
			start : 0,
		
			beforeRequest : function() {
				$(this.target).html(
						$('<img>').attr('src', 'images/ajax-loader.gif'));
			},
		
			facetLinks : function(facet_field, facet_values, title) {
				var links = [];
				if (facet_values) {
					var fv = facet_values;
					if (facet_values.constructor != Array)
						fv = [ facet_values ];
		
					for (var i = 0, l = fv.length; i < l; i++) {
						if (fv[i] !== undefined) {
		
							links.push($('<a href="#"></a>').text(
									title == null ? fv[i] : title).click(
									this.facetHandler(facet_field, fv[i])));
						} else {
							links
									.push('no items found in current selection');
						}
					}
				}
				return links;
			},
		
			facetHandler : function(facet_field, facet_value) {
				var self = this;
				return function() {
					self.manager.store.remove('fq');
					self.manager.store.addByValue('fq', facet_field + ':' + AjaxSolr.Parameter.escapeValue(facet_value));
					self.doRequest(0);
					return false;
				};
			},
		
			afterRequest : function() {
				$(this.target).empty();
				this.populate(this.manager.response.response.docs, this.manager.response.expanded);
			}
		}) // end of 
	.extend(ItemListWidget.prototype);
})(jQuery);
