(function($) {
	var pivot_fields = "topcategory,endpointcategory,effectendpoint,unit",
	    bottom_field = "effectendpoint", top_field = "topcategory",
			buildValueRange = function (facet, suffix) {
				var stats = facet.stats.stats_fields;
				return 	" = " + (stats.loValue.min == null ? "-&#x221E;" :  stats.loValue.min) +
								"&#x2026;" + (stats.loValue.max == null ? "&#x221E;" : stats.loValue.max) +
								" " + (suffix == null ? facet.value : suffix);
			};
			
	AjaxSolr.PivotWidget = AjaxSolr.AbstractFacetWidget.extend({
    clickHandler: function (path) {
      var self = this;

      return function (e) {
        if (self.changeSelection(function () {
          var go = false;
          for(var i = 0, pl = path.length; i < pl; ++i)
            go |= !!self.manager.store.addByValue('fq', path[i].field + ':' + AjaxSolr.Parameter.escapeValue(path[i].value));

          return go;
        })) {
          self.doRequest();
        }
        return false;
      }
    },
    
    buildFacetDom: function (facet, renderer) {
      var elements = [], root;
			
			if (facet.pivot == null || !facet.pivot.length) // no separate pivots - nothing to declare
				;
			else {
				for (var i = 0, fl = facet.pivot.length, f;i < fl; ++i) {
					f = facet.pivot[i];
					f.parent = facet;
					elements.push(f.field == bottom_field ? renderer(f).addClass(this.colorMap[f.field]) : this.buildFacetDom(f, renderer)[0]);
					
					if (f.field == bottom_field) {
					  if (this.pivotMap[f.value] === undefined)
					    this.pivotMap[f.value] = [f];
            else
              this.pivotMap[f.value].push(f);
					}
				}
	
				if (elements.length > 0 && facet.field != top_field) {
					root = jT.getFillTemplate($("#tag-facet"), facet);
					
					// we need to add outselves as main tag
					if (facet.field != bottom_field)
				    root.append(renderer(facet).addClass("category title").addClass(this.colorMap[facet.field]));
					
					root.append(elements);
					elements = [root];
				}
			}
			
			return elements;
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
				
				target.append(self.buildFacetDom(facet, function (facet) {
					var msg = "",
					    path = [],
					    f;
					
					if (facet.pivot == undefined) 
						msg = buildValueRange(facet, "");
					else for ( var j = 0, ul = facet.pivot.length; j < ul; ++j ) { 
						if (j > 0)
							msg += ", ";
							
						msg += buildValueRange(facet.pivot[j]);
					}
					
					for (f = facet; f.field != top_field ;f = f.parent)
					  path.push({ field: f.field, value: f.value});
					  
					return self.tagRenderer( facet.value, facet.count, msg, self.clickHandler(path));
				}));
			}
			
			if (!!refresh)
				refresh.call();
		}
	});
	
	AjaxSolr.PivotWidget.topField = top_field;
	AjaxSolr.PivotWidget.bottomField = bottom_field;
	AjaxSolr.PivotWidget.fieldList = pivot_fields.split(",");
	
})(jQuery);
