(function ($) {

AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
  start: 0,
  fieldRegExp: /^([\w\.]+):/,

  afterRequest: function () {
    var self = this, el, f, fk,
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
    	if (f.indexOf("!collapse field=s_uuid") < 0) {
        fk = f.match(self.fieldRegExp)[1];
    		links.push(el = self.tagRenderer(f.replace(self.fieldRegExp, ""), "x", self.rangeToggle(f)).addClass('tag_selected'));
    		$("span", el[0]).on("click", self.removeFacet(f));
    		el.addClass(self.colorMap[fk]);
      }
    }
    
    if (links.length) {
      links.push(self.tagRenderer("Clear", "x", function () {
        self.manager.store.get('q').val('*:*');
        self.manager.store.removeByValue('fq', self.fieldRegExp);
        self.doRequest();
        return false;
      }).addClass('tag_selected tag_clear'));
      
      $(this.target).empty().addClass('tags').append(links);
    }
    else
      $(this.target).removeClass('tags').html('<li>No filters selected!</li>');
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
  }
});

})(jQuery);
