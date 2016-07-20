(function($) {
	var pivot_fields = "topcategory,endpointcategory,effectendpoint,unit";
	var buildValueRange = function (facet) {
		var stats = facet.stats.stats_fields;
		return	" (" + stats.loValue.min +
						"&#x2026;" + stats.loValue.max +
						") " + facet.value;
	};
	
	var buildFacetDom = function (facet, leafId, renderer) {
		var elements = [], root, childs = [];
		
		if (facet.pivot == null || !facet.pivot.length) // no separate pivots - nothing to declare
			;
		else if (facet.pivot[0].field == leafId) { // reached the bottom level
			for (var i = 0, fl = facet.pivot.length;i < fl; ++i)
				childs.push(renderer(facet.pivot[i]));

			if (childs.length > 0) {
				root = jT.getFillTemplate($("#tag-facet"), facet);
				root.append(childs);
				elements = [root];
			}
		}

		else if (facet.pivot.length == 1) { // single pivot entry - jump over it - provide the next level.
			elements = buildFacetDom(facet.pivot[0], leafId, renderer);
		}

		else { // i.e. more than one pivot - we must group
			for (var i = 0, fl = facet.pivot.length, f;i < fl; ++i) {
				f = facet.pivot[i];
				childs = buildFacetDom(f, leafId, renderer);
				
				if (childs.length > 0) {
					elements.push(root = jT.getFillTemplate($("#tag-group"), f));
					root.append(childs);
				}
			}
		}
		
		return elements;
	};
	
	AjaxSolr.PivotWidget = AjaxSolr.AbstractFacetWidget.extend({
		afterRequest : function() {
			var self = this,
					root = this.manager.response.facet_counts.facet_pivot[pivot_fields],
					hdr = getHeaderText(this.header),
					dad = this.target.closest(".widget-content"),
					cnt = 0;
					
			if (root === undefined) {
				this.target.html('no items found in current selection');
				return;
			}

			$("div,ul", dad[0]).remove();

			for (var i = 0, fl = root.length; i < fl; ++i) {
				var facet = root[i], dad;
				if (facet.value != this.id) continue;
				
				cnt = parseInt(facet.count);
				dad.append(buildFacetDom(facet, "effectendpoint", function (f) {
					var msg = "";
					
					if (f.pivot == undefined) 
						msg = buildValueRange(f);
					else for ( var j = 0, ul = f.pivot.length; j < ul; ++j ) 
						msg += buildValueRange(f.pivot[j]);
					
					return self.tagRenderer( f.value, f.count, msg, self.clickHandler(f.value) );
				}));
			}
			
			hdr.textContent = jT.ui.updateCounter(hdr.textContent, cnt);
		}
	});
	
})(jQuery);
