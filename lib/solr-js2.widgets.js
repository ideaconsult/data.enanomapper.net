(function(Solr, a$, $) {
  if (Solr.Widgets === undefined) Solr.Widgets = {};
  Solr.Widgets.Pager = function(settings) {
    a$.extend(this, settings);
    this.manager = null;
  };
  Solr.Widgets.Pager.prototype = {
    __expects: [ Solr.Paging ],
    innerWindow: 4,
    outerWindow: 1,
    prevLabel: "&laquo; Previous",
    nextLabel: "Next &raquo;",
    separator: " ",
    init: function(manager) {
      a$.act(this, Solr.Paging.prototype.init, manager);
    },
    gapMarker: function() {
      return '<span class="pager-gap">&hellip;</span>';
    },
    windowedLinks: function() {
      var links = [], prev = null;
      visible = this.visiblePageNumbers();
      for (var i = 0, l = visible.length; i < l; i++) {
        if (prev && visible[i] > prev + 1) links.push(this.gapMarker());
        links.push(this.pageLinkOrSpan(visible[i], [ "pager-current" ]));
        prev = visible[i];
      }
      return links;
    },
    visiblePageNumbers: function() {
      var windowFrom = this.currentPage - this.innerWindow, windowTo = this.currentPage + this.innerWindow, visible = [];
      if (windowTo > this.totalPages) {
        windowFrom = Math.max(0, windowFrom - (windowTo - this.totalPages));
        windowTo = this.totalPages;
      }
      if (windowFrom < 1) {
        windowTo = Math.min(this.totalPages, windowTo + (1 - windowFrom));
        windowFrom = 1;
      }
      visible.push(1);
      for (var i = 2; i <= Math.min(1 + this.outerWindow, windowFrom - 1); i++) {
        visible.push(i);
      }
      if (1 + this.outerWindow == windowFrom - 2) {
        visible.push(windowFrom - 1);
      }
      for (var i = Math.max(2, windowFrom); i <= Math.min(windowTo, this.totalPages - 1); i++) {
        visible.push(i);
      }
      if (this.totalPages - this.outerWindow == windowTo + 2) {
        visible.push(windowTo + 1);
      }
      for (var i = Math.max(this.totalPages - this.outerWindow, windowTo + 1); i < this.totalPages; i++) {
        visible.push(i);
      }
      if (this.totalPages > 1) {
        visible.push(this.totalPages);
      }
      return visible;
    },
    pageLinkOrSpan: function(page, classnames, text) {
      text = text || page;
      if (page && page != this.currentPage) {
        return $('<a href="#"></a>').html(text).attr("rel", this.relValue(page)).addClass(classnames[1]).click(this.clickHandler(page));
      } else {
        return $("<span></span>").html(text).addClass(classnames.join(" "));
      }
    },
    relValue: function(page) {
      switch (page) {
       case this.previousPage():
        return "prev" + (page == 1 ? "start" : "");

       case this.nextPage():
        return "next";

       case 1:
        return "start";

       default:
        return "";
      }
    },
    previousPage: function() {
      return this.currentPage > 1 ? this.currentPage - 1 : null;
    },
    nextPage: function() {
      return this.currentPage < this.totalPages ? this.currentPage + 1 : null;
    },
    renderHeader: function(perPage, offset, total) {},
    renderLinks: function(links) {
      if (this.totalPages) {
        links.unshift(this.pageLinkOrSpan(this.previousPage(), [ "pager-disabled", "pager-prev" ], this.prevLabel));
        links.push(this.pageLinkOrSpan(this.nextPage(), [ "pager-disabled", "pager-next" ], this.nextLabel));
        var $target = $(this.target);
        $target.empty();
        for (var i = 0, l = links.length; i < l; i++) {
          var $li = $("<li></li>");
          if (this.separator && i > 0) {
            $li.append(this.separator);
          }
          $target.append($li.append(links[i]));
        }
      }
    },
    afterRequest: function() {
      a$.act(this, Solr.Paging.prototype.afterRequest);
      $(this.target).empty();
      this.renderLinks(this.windowedLinks());
      this.renderHeader(this.pageSize, (this.currentPage - 1) * this.pageSize, this.totalEntries);
    }
  };
})(Solr, a$, jQuery);