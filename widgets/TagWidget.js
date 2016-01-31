(function ($) {

AjaxSolr.TagWidget = AjaxSolr.AbstractFacetWidget.extend({
  afterRequest: function () {
    if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
      $(this.target).html('no items found in current selection');
      return;
    }

    var maxCount = 0;
    var objectedItems = [];
    for (var facet in this.manager.response.facet_counts.facet_fields[this.field]) {
      var count = parseInt(this.manager.response.facet_counts.facet_fields[this.field][facet]);
      if (count > maxCount) {
        maxCount = count;
      }
      objectedItems.push({ facet: facet, count: count });
    }
    objectedItems.sort(function (a, b) {
      return a.facet < b.facet ? -1 : 1;
    });

    $(this.target).empty();
    for (var i = 0, l = objectedItems.length; i < l; i++) {
      var facet = objectedItems[i].facet;
      var view = facet;
      var short = view;
      if (facet.lastIndexOf("http://dx.doi.org/",0)==0) { 
    	 short = facet.replace("http://dx.doi.org/","");
      	 short = view;
      } else {
    	  view = lookup[facet];
    	  if (view === undefined) {
    		  view = facet.replace("NPO_","");
    		  
    	  } else {
    		  view = view.replace(" nanoparticle","");
    	  }
    	  short = view;
    	  if (view.length>26) short=view.substring(0,26);
      }
      $(this.target).append(
        $('<li><a href="#" class="tag" title="'+ view + ' ['+facet +']">'+short + ' <span>'+objectedItems[i].count+'</span></a></li>')
        .addClass('tagcloud_size_1')
        .click(this.clickHandler(facet))
      );
    }
  }
});

})(jQuery);
