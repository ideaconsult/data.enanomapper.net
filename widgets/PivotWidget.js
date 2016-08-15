(function($) {
	var pivot_fields = ["topcategory", "endpointcategory", "effectendpoint", "unit"],
	    bottom_field = pivot_fields[2], top_field = pivot_fields[0], category_field = pivot_fields[1],
	    
			buildValueRange = function (facet, suffix) {
				var stats = facet.stats.stats_fields;
				return 	" = " + (stats.loValue.min == null ? "-&#x221E;" :  stats.loValue.min) +
								"&#x2026;" + (stats.loValue.max == null ? "&#x221E;" : stats.loValue.max) +
								" " + (suffix == null ? facet.value : suffix);
			},
			
			buildFacetDom = function (facet, colorMap, renderer) {
        var elements = [], root;
				
				if (facet.pivot == null || !facet.pivot.length) // no separate pivots - nothing to declare
					;
				else {
					for (var i = 0, fl = facet.pivot.length, f;i < fl; ++i) {
						f = facet.pivot[i];
						f.parent = facet;
						elements.push(f.field == bottom_field ? renderer(f).addClass(colorMap[f.field]) : buildFacetDom(f, colorMap, renderer)[0]);
					}
		
					if (elements.length > 0 && facet.field != top_field) {
						root = jT.getFillTemplate($("#tag-facet"), facet);
						
						// we need to add outselves as main tag
						if (facet.field != bottom_field)
  				    root.append(renderer(facet).addClass("category title").addClass(colorMap[facet.field]));
						
						root.append(elements);
						elements = [root];
					}
				}
				
				return elements;
			};
	
	AjaxSolr.PivotWidget = AjaxSolr.BaseFacetWidget.extend({
    init: function () {
      AjaxSolr.BaseFacetWidget.__super__.init.call(this);
      if (this.multivalue) {
        this.manager.store.addByValue('facet.field', bottom_field, { ex: this.id });
        this.manager.store.addByValue('facet.field', category_field, { ex: this.id });
      }
    },
    
    afterChangeSelection: function () {
      this.doRequest()
    },
    
		afterRequest : function() {
			var self = this,
					root = this.manager.response.facet_counts.facet_pivot[pivot_fields],
					refresh = this.target.data("refreshPanel");
					
			if (root === undefined) {
				this.target.html('No items found in current selection');
				return;
			}

      // some cleanup...
      $(".dynamic-tab", self.target.parent()[0]).each(function () {
  			var hdr = getHeaderText($(this).closest(".widget-root").prev());
  			
        hdr.textContent = jT.ui.updateCounter(hdr.textContent, 0);
        $("ul", this).remove();
      });
      
			for (var i = 0, fl = root.length; i < fl; ++i) {
				var facet = root[i], target;
				
				// we need to check if we have that accordion element created.
				if (facet.field == top_field) {
  				target = $("#" + facet.value);
  				
  				if (target.length > 0) {
    				var hdr = getHeaderText(target.closest(".widget-root").prev());
            hdr.textContent = jT.ui.updateCounter(hdr.textContent, facet.count);
    		  }
  				else {
    				self.target.before(target = jT.getFillTemplate($("#tab-topcategory"), facet));
    				target = $(target.last()).addClass("dynamic-tab");
    				self.tabsRefresher();
  				}
				}
				
				target.append(buildFacetDom(facet, self.colorMap, function (facet) {
					var msg = "";
					
					if (facet.pivot == undefined) 
						msg = buildValueRange(facet, "");
					else for ( var j = 0, ul = facet.pivot.length; j < ul; ++j ) { 
						if (j > 0)
							msg += ", ";
							
						msg += buildValueRange(facet.pivot[j]);
					}
					
					return self.tagRenderer( facet.value, facet.count, msg, self.clickHandler(facet.value, facet.field));
				}));
			}
			
			if (!!refresh)
				refresh.call();
		}
	});
	
	AjaxSolr.PivotWidget.pivotFields = pivot_fields;
	
})(jQuery);
