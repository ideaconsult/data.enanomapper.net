(function ($) {

AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
  start: 0,

  afterRequest: function () {
    var self = this,
        links = [];

    var q = this.manager.store.get('q').val();
    if (q != '*:*') {
        links.push($('<a href="#"></a>').text(q).click(function () {
          self.manager.store.get('q').val('*:*');
          self.doRequest();
          return false;
        }));
    }

    var fq = this.manager.store.values('fq'),
        clearIdx = null;
    for (var i = 0, l = fq.length; i < l; i++) {
    	var style = 'class="tag_selected"';
    	    
    	if (fq[i].indexOf("!collapse field=s_uuid") >= 0)
    	  clearIdx = i;
      else
    		links.push(self.tagRenderer(fq[i], null, self.removeFacet(fq[i])).addClass('tag_selected'));
    }
    
    //have to ensure the collapsed query is not removed! 
    if (links.length > 1 && clearIdx !== null) {
      links.unshift(self.tagRenderer("Clear filters", null, function () {
        self.manager.store.get('q').val('*:*');
        self.manager.store.remove('fq');
        self.doRequest();
        return false;
      }));
    }

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
