(function ($) {

AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
  start: 0,
  skipClear: false,
  rangeFilter: {},

  afterRequest: function () {
    var self = this, el, f, fk, fv,
        links = [],
        q = this.manager.store.get('q').val(),
        fq = this.manager.store.get('fq');
        
    if (self.skipClear) {
      self.skipClear = false;
      return;
    }
    
    $("#sliders").empty();
    self.rangeFilter = {};
    
    // add the free text search as a tag
    if (q != '*:*') {
        links.push(self.renderTag(q, "x", function () {
          self.manager.store.get('q').val('*:*');
          self.doRequest();
          return false;
        }));
    }

    // now add the facets
    for (var i = 0, l = fq.length; i < l; i++) {
	    f = fq[i];
	    
	    // First try it as range parameter
	    fv = self.manager.getRangeFromParam(f);
	    if (!!fv) {
  	    $.extend(true, self.rangeFilter, fv);
  	    continue;
	    }
	    
	    // then try it as normal set filter
	    fv = self.manager.tweakParamValues(f);
	    if (!!fv) {
        fk = fv.field;
        
        for (var j = 0, fvl = fv.length, pv; j < fvl; ++j) {
          pv = (fk == PivotWidget.endpointField);
      		links.push(el = self.renderTag(fv[j], "i", fvl > 1 ? self.reduceFacet(i, fv[j]) : self.removeFacet(i)).addClass('tag_selected' + (pv ? "" : " tag_fixed")));

      		if (fvl > 1)
      		  el.addClass("tag_combined");
      		  
      		if (pv)
      		  $("span", el[0]).on("click", self.rangeToggle(i, fk, fv[j]));
      		  
      		el.addClass(self.colorMap[fk]);
        }
        
        if (fvl > 1)
  		    el.addClass("tag_last");
      }
    }
    
    if (links.length) {
      links.push(self.renderTag("Clear", "", function () {
        self.manager.store.get('q').val('*:*');
        self.manager.store.removeByValue('fq', self.manager.facetFieldRegExp);
        self.manager.store.removeByValue('fq', self.manager.rangeFieldRegExp);
        self.doRequest();
        return false;
      }).addClass('tag_selected tag_clear tag_fixed'));
      
      this.target.empty().addClass('tags').append(links);
    }
    else
      this.target.removeClass('tags').html('<li>No filters selected!</li>');
  },

  rangeToggle: function (index, field, value) {
    var self = this;
    return function () {
      var pivots = PivotWidget.locatePivots(field, value, "unit"),
          sliders = $("#sliders"), width, el;
          updateRange = function(range) {  return function (values) { range.range = values.split(","); } };

      $("li", self.target[0]).removeClass("active");
      $(this).closest("li").addClass("active");

      el = jT.getFillTemplate("#slider-update").appendTo(sliders.empty()).on("click", function (e) {
        // TODO: Prepare
        self.manager.tweakAddRangeParam(self.rangeFilter);
        self.skipClear = true;
        self.doRequest();
      });
      
      width = sliders.width() - el.width() - 20;
      
      // TODO: Preprocess the filter
      
      for (var i = 0, lp = pivots.length, pe, args;i < lp; ++i) {
        pe = pivots[i];
        
        var range = pe.stats.stats_fields.loValue, 
            prec = Math.pow(10, parseInt(Math.min(1, Math.floor(Math.log10(range.max - range.min + 1) - 3)))),
            scale;

        // jRange will treat 0.1 range, as 0.01, so we better set it this way
        if (prec < 1 && prec > .01) prec = .01;
          
        range.low = range.min != null ? getRoundedNumber(range.min, prec) : "-";
        range.high = range.max != null ? getRoundedNumber(range.max, prec) : "-";

        for(var pp = pe ; pp.field != PivotWidget.categoryField ; pp = pp.parent);
        scale = [range.min, getTitleFromFacet(pp.value), range.max];
          
        sliders.append(el = jT.getFillTemplate("#slider-one", range));
          
        el.jRange({
        	from: range.min,
        	to: range.max,
        	step: prec,
        	scale: scale,
        	showScale: true,
        	showLabels: range.min < range.max,
        	disable: range.min >= range.max,
        	isRange: true,
        	width: width / (Math.min(lp, 2) + 0.1),
        	format: "%s " + (pe.field == "unit" ? jT.ui.formatUnits(pe.value) : ""),
        	ondragend: updateRange(pe.field, pe.value)
      	});
      }
      
      return false;
    };
  },

  removeFacet: function (index) {
    var self = this;
    return function () {
      self.manager.store.remove('fq', index);
      self.doRequest();
      return false;
    };
  },
  
  reduceFacet: function (index, value) {
    var self = this;
    return function () {
      var par = self.manager.store.get('fq')[index],
          res = self.manager.tweakParamValues(par, value, true);

      if (!!res)
        self.doRequest();
        
      return false;
    };
  }
  
});

})(jQuery);
