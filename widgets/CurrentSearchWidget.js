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
        links.push(self.renderTag(q, "x", function () {
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
        
        for (var j = 0, fvl = fv.length; j < fvl; ++j) {
      		links.push(el = self.renderTag(fv[j], "i", fvl > 1 ? self.reduceFacet(i, fv[j]) : self.removeFacet(i)).addClass('tag_selected'));

      		if (fvl > 1)
      		  el.addClass("combined");
      		  
      		$("span", el[0]).on("click", self.rangeToggle(f));
      		el.addClass(self.colorMap[fk]);
        }
        
        if (fvl > 1)
  		    el.addClass("last");
      }
    }
    
    if (links.length) {
      links.push(self.renderTag("Clear", "", function () {
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
