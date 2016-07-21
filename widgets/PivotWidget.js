(function($) {
	var pivot_fields = "topcategory,endpointcategory,effectendpoint,unit",
	    bottom_field = "effectendpoint", top_field = "topcategory",
			buildValueRange = function (facet, suffix) {
				var stats = facet.stats.stats_fields;
				return 	" = " + (stats.loValue.min == null ? "-&#x221E;" :  stats.loValue.min) +
								"&#x2026;" + (stats.loValue.max == null ? "&#x221E;" : stats.loValue.max) +
								" " + (suffix == null ? facet.value : suffix);
			},
			
			buildFacetDom = function (facet, color, renderer) {
        var elements = [], root;
				
				if (facet.pivot == null || !facet.pivot.length) // no separate pivots - nothing to declare
					;
				else {
					for (var i = 0, fl = facet.pivot.length, f;i < fl; ++i) {
						f = facet.pivot[i];
						elements.push(f.field == bottom_field ? renderer(f) : buildFacetDom(f, color, renderer)[0]);
					}
		
					if (elements.length > 0 && facet.field != top_field) {
						root = jT.getFillTemplate($("#tag-facet"), facet);
						
						// we need to add outselves as main tag
						if (facet.field != bottom_field)
  				    root.append(renderer(facet).addClass("category title").addClass(color));
						
						root.append(elements);
						elements = [root];
					}
				}
				
				return elements;
			};
	
	AjaxSolr.PivotWidget = AjaxSolr.AbstractFacetWidget.extend({
    clickHandler: function (field, value) {
      var self = this, 
          arg = field + ':' + AjaxSolr.Parameter.escapeValue(value);
      return function () {
        if (self.changeSelection(function () {
          return self.manager.store.addByValue('fq', arg);
        })) {
          self.doRequest();
        }
        return false;
      }
    },
  	
		afterRequest : function() {
			var self = this,
					root = this.manager.response.facet_counts.facet_pivot[pivot_fields],
					hdr = getHeaderText(this.header),
					dad = this.target.closest(".widget-content"),
					refresh = this.header.data("refreshPanel"),
					cnt = 0;
					
			if (root === undefined) {
				this.target.html('No items found in current selection');
				return;
			}

			$("ul", dad[0]).remove();

			for (var i = 0, fl = root.length; i < fl; ++i) {
				var facet = root[i], dad;
				if (facet.value != this.id) continue;
				
				cnt = parseInt(facet.count);
				dad.append(buildFacetDom(facet, self.color, function (f) {
					var msg = "";
					
					if (f.pivot == undefined) 
						msg = buildValueRange(f, "");
					else for ( var j = 0, ul = f.pivot.length; j < ul; ++j ) { 
						if (j > 0)
							msg += ", ";
							
						msg += buildValueRange(f.pivot[j]);
					}
					
					return self.tagRenderer( f.value, f.count, msg, self.clickHandler(f.field, f.value) );
				}));
			}
			
			hdr.textContent = jT.ui.updateCounter(hdr.textContent, cnt);
			if (!!refresh)
				refresh.call();
		}
	});
	
})(jQuery);
