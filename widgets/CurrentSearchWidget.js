(function ($) {

AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
  start: 0,
  fieldRegExp: /^(\{[^\}]+\})?\-?([\w\.]+):/,

  afterRequest: function () {
    var self = this, el, f, fk, fv,
        links = [],
        q = this.manager.store.get('q').val(),
        fq = this.manager.store.get('fq');
        
    // add the free text search as a tag
    if (q != '*:*') {
        links.push(self.tagRenderer(q, "x", function () {
          self.manager.store.get('q').val('*:*');
          self.doRequest();
          return false;
        }));
    }

    // now add the facets
    for (var i = 0, l = fq.length; i < l; i++) {
	    f = fq[i].val();
	    fk = f.match(self.fieldRegExp);
    	if (!!fk) {
        fk = fk[2];
        fv = AjaxSolr.BaseFacetWidget.parseValues(f.replace(self.fieldRegExp, ""));
        
        for (var j = 0, fvl = fv.length, pv; j < fvl; ++j) {
          pv = PivotWidget.isPivotField(fk);
      		links.push(el = self.tagRenderer(fv[j], pv ? "i" : "x", fvl > 1 ? self.reduceFacet(i, fv[j]) : self.removeFacet(i)).addClass('tag_selected'));

      		if (fvl > 1)
      		  el.addClass("combined");
      		  
      		if (pv)
      		  $("span", el[0]).on("click", self.rangeToggle(fk, fv[j]));
      		  
      		el.addClass(self.colorMap[fk]);
        }
        
        if (fvl > 1)
  		    el.addClass("last");
      }
    }
    
    if (links.length) {
      links.push(self.tagRenderer("Clear", "", function () {
        self.manager.store.get('q').val('*:*');
        self.manager.store.removeByValue('fq', self.fieldRegExp);
        self.doRequest();
        return false;
      }).addClass('tag_selected tag_clear'));
      
      this.target.empty().addClass('tags').append(links);
    }
    else
      this.target.removeClass('tags').html('<li>No filters selected!</li>');
  },

  rangeToggle: function (field, value) {
    var self = this;
    return function () {
      var pivots = PivotWidget.locatePivot(field, value), 
          sliders = $("#sliders"), el;

      for (var lp = pivots.length, i = lp - 1, pe, args;i >= 0; --i) {
        pe = pivots[i];
        
        if (!!pe.pivot) 
          pivots.splice.apply(pivots, [i, 1].concat(pe.pivot.map(function (e) { e.parent = pe; return e; })));
      }
      
      for (i = 0, lp = pivots.length;i < lp; ++i) {
        pe = pivots[i];
        
        var range = pe.stats.stats_fields.loValue, 
            units = pe.value,
            scale;

        range.min = getRoundedNumber(range.min, 0.01);
        range.max = getRoundedNumber(range.max, 0.01);

        scale = [range.min.toString(), range.max.toString()];
        
        if (lp > 1) {
          for(;pe.field != PivotWidget.categoryField;pe = pe.parent);
          scale.splice(1, 0, getTitleFromFacet(pe.value));
        }
          
        sliders.append(el = jT.getFillTemplate("#slider-one", range));
          
        el.jRange({
        	from: range.min,
        	to: range.max,
        	step: 0.01,
        	scale: scale,
        	showScale: true,
        	showLabels: range.min < range.max,
        	disable: range.min >= range.max,
        	isRange: true,
        	width: sliders.width() / (lp + 0.25),
        	format: "%s " + jT.ui.formatUnits(units),
        	ondragend: function (values) {
          	values = values.split(",");
          	console.log("Vals: " + values);
        	}
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
          pval = par.val(),
          field = pval.match(self.fieldRegExp),
          newVal = AjaxSolr.BaseFacetWidget.matchRemoveValue(pval.replace(self.fieldRegExp, ""), value);
      
      par.val(!newVal ? pval : field[0] + newVal);
      self.doRequest();
      return false;
    };
  }
  
});

})(jQuery);
