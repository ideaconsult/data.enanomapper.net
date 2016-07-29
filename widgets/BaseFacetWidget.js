(function ($) {

var leadBracked = /^\(?/, readBracked = /\)$/;

AjaxSolr.BaseFacetWidget = AjaxSolr.AbstractFacetWidget.extend({
  fieldRegExp: function (field) {
    return new RegExp('^-?' + (field || this.field) + ':');
  },
  
  init: function () {
    AjaxSolr.BaseFacetWidget.__super__.init.call(this);
    if (this.multivalue) {
      this.manager.store.addByValue('facet.field', this.field, { ex: this.id });
    }
  },
  
  add: function (value) {
    return this.changeSelection(function () {
      var re = this.fieldRegExp(),
          index = this.manager.store.find('fq', re);
            
      if (!index)
        this.manager.store.addByValue('fq', this.field + ':(' + AjaxSolr.Parameter.escapeValue(value) + ')', this.multivalue ? { tag: this.id } : null)
      else {
        var pars = this.manager.store.params['fq'],
            val = pars[index].val().replace(re, "").replace(leadBracked, "").replace(readBracked, "");
            
        if (AjaxSolr.BaseFacetWidget.matchRemoveValue(val, value))
          return false;
          
        pars[index] = new AjaxSolr.Parameter({
          name: 'fq', 
          value: this.field + ':(' + val + " " + AjaxSolr.Parameter.escapeValue(value) + ')', 
          locals: this.multivalue ? { tag: this.id } : null
        });
      }

      return true;
    });
  },
  
  set: function (value, exclude) {
    return this.changeSelection(function () {
      var a = this.manager.store.removeByValue('fq', this.fieldRegExp()),
          b = this.manager.store.addByValue('fq', this.fq(value, exclude));
      return a || b;
    });
  },
  
  values: function (field) {
    var re = this.fieldRegExp(field),
        indices = this.manager.store.find(re);
  },
  
  clickHandler: function (value, field) {
    var self = this,
        meth = this.multivalue ? 'add' : 'set';
        
    return function (e) {
      if (field != null)
        self.field = field;
        
      // shift / Ctrl actually _negate_ the selection
      if (e.shiftKey || e.ctrlKey)
        self.set(value, true);
      else
        self[meth].call(self, value);
        
      return false;
    }
  },
  
  afterChangeSelection: function () {
    this.doRequest();
  },
  
  fieldFilter: function (field) {
    var re = this.fieldRegExp(field || this.field),
        index = this.manager.store.find('fq', re),
        pars;
        
    return !index ? null : this.manager.store.get('fq')[index].val().replace(re, "");
  }
});

AjaxSolr.BaseFacetWidget.matchRemoveValue = function (filter, value) {
  var re = new RegExp("(^\\(|\\s)" + AjaxSolr.Parameter.escapeValue(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\s|\\)$)"),
      m = filter.replace(re, "$1$2")

  return m == filter ? null : m.replace(/\(\s+/, "(").replace(/\s+\)/, ")").replace("/\s+/", " ");
}

AjaxSolr.BaseFacetWidget.parseValues = function (str) {
  var m = str.replace(leadBracked, "").replace(readBracked, ""), sarr;
  
  sarr = m.split(m.match(/[^\\]"/) ? /[^\\]"\s+"/ : /\s+/);
  
  for (var i = 0, sl = sarr.length; i < sl; ++i)
    sarr[i] = sarr[i].replace(/^"/, "").replace(/"$/, "");

  return sarr;
}

})(jQuery);
