(function ($) {

AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
  start: 0,
  fieldRegExp: /^([\w\.]+):/,

  afterRequest: function () {
    var self = this, el, f, fhref = "",
        links = [],
        q = this.manager.store.get('q').val(),
        fq = this.manager.store.values('fq');
        
    if (q != '*:*') {
        links.push(self.tagRenderer(q, "x", function () {
          self.manager.store.get('q').val('*:*');
          self.doRequest();
          return false;
        }));
    }

    for (var i = 0, l = fq.length; i < l; i++) {
    	if (fq[i].indexOf("!collapse field=s_uuid") < 0) {
        fhref += fq[i] + ";";
        f = fq[i].match(self.fieldRegExp)[1];
    		links.push(el = self.tagRenderer(fq[i].replace(self.fieldRegExp, ""), "x", self.removeFacet(fq[i])).addClass('tag_selected'));
    		el.addClass(self.colorMap[f]);
      }
    }
    
    if (!!href) 
    	updateQueryURL("facet", fhref);
    
    if (links.length)
      $(this.target).empty().addClass('tags').append(links);
    else
      $(this.target).removeClass('tags').html('<li>No filters selected!</li>');
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
