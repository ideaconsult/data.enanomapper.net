(function ($) {

AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
  start: 0,
  fieldRegExp: /^(\{[^\}]+\})?\-?([\w\.]+):/,

  afterRequest: function () {
    var self = this, el, f, fk, fv,
        links = [],
        q = this.manager.store.get('q').val(),
        fq = this.manager.store.values('fq');
        
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
	    f = fq[i];
	    fk = f.match(self.fieldRegExp);
    	if (!!fk) {
        fk = fk[2];
        fv = AjaxSolr.BaseFacetWidget.parseValues(f.replace(self.fieldRegExp, ""));
        
        for (var j = 0, fvl = fv.length; j < fvl; ++j) {
      		links.push(el = self.tagRenderer(fv[j], "x", self.rangeToggle(f)).addClass('tag_selected'));

      		if (fvl > 1)
      		  el.addClass(j < fvl - 1 ? "combined" : "combined last");
      		  
      		$("span", el[0]).on("click", fvl > 1 ? self.reduceFacet(f, fv[j]) : self.removeFacet(f));
      		el.addClass(self.colorMap[fk]);
        }
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

  rangeToggle: function (facet) {
    var self = this;
    return function () {
	    alert("Select ranges for: " + facet);
      return false;
    };
  },

  removeFacet: function (facet) {
    var self = this;
    return function () {
      if (self.manager.store.removeByValue('fq', facet)) {
        self.doRequest();
      }
      return false;
    };
  },
  
  reduceFacet: function (facet, value) {
    var self = this;
    return function () {
      var newFacet = AjaxSolr.BaseFacetWidget.matchRemoveValue(facet, value),
          a = self.manager.store.removeByValue('fq', facet),
          b = self.manager.store.addByValue('fq', newFacet);
      if (a || b)
        self.doRequest();

      return false;
    };
  }
  
});

})(jQuery);
