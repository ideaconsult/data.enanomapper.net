(function() {
  Solr = {};
  Solr.Management = function(obj) {
    a$.extend(true, this, obj);
    this.listeners = {};
    this.response = null;
    this.error = null;
    this.currentRequest = null;
    this.pendingRequest = null;
  };
  Solr.Management.prototype = {
    connector: null,
    solrUrl: "",
    servlet: "select",
    onError: function(message) {
      window.console && console.log && console.log(message);
    },
    onPrepare: function(ajaxSettings) {},
    onSuccess: null,
    ajaxSettings: {
      async: true,
      dataType: "json",
      method: "GET",
      processData: false
    },
    doRequest: function(servlet) {
      var self = this, cancel = null, settings = {};
      if (self.currentRequest != null && self.currentRequest == servlet) {
        self.pendingRequest = servlet || self.servlet;
        return;
      }
      self.inRequest = true;
      a$.each(self.listeners, function(l) {
        if (a$.act(l, l.beforeRequest, self) === false) cancel = l;
      });
      if (cancel !== null) {
        a$.act(cancel, self.onError, "Request cancelled");
        return;
      }
      settings = a$.extend(settings, self.ajaxSettings, self.prepareQuery());
      settings.url = self.solrUrl + (servlet || self.servlet) + (settings.url || "");
      settings.error = self.onError;
      settings.success = function(data) {
        self.response = data;
        a$.each(self.listeners, function(l) {
          a$.act(l, l.afterRequest, self);
        });
        a$.act(self, self.parseResponse, self.response);
        a$.act(self, self.onSuccess);
        self.currentRequest = null;
        if (self.pendingRequest) self.doRequest(self.pendingRequest);
      };
      a$.broadcast(self, "onPrepare", settings);
      a$.act(self, self.onPrepare, settings);
      return self.connector.ajax(settings);
    },
    init: function() {
      var self = this;
      a$.each(this.listeners, function(l) {
        a$.act(l, l.init, self);
      });
    },
    addListeners: function(one) {
      var listener = one;
      if (arguments.length > 1) listener = arguments; else if (!Array.isArray(one)) listener = [ one ]; else listener = one;
      for (var l, i = 0, ll = listener.length; i < ll; ++i) {
        l = listener[i];
        this.listeners[l.id] = l;
      }
      return this;
    },
    removeListener: function(listener) {
      delete this.listeners[listener.id];
      return this;
    },
    removeManyListeners: function(selector) {
      var self = this;
      a$.each(self.listeners(function(l, id) {
        if (selector(l, self)) delete self.listeners[id];
      }));
      return self;
    },
    enumerateListeners: function(callback, context) {
      if (typeof callback !== "function") return;
      a$.each(this.listeners, function(l, id) {
        callback.call(l, l, id, context);
      });
    },
    getListener: function(id) {
      return this.listeners[id];
    }
  };
  Solr.escapeValue = function(value) {
    if (value.match(/[ :\/"]/) && !value.match(/[\[\{]\S+ TO \S+[\]\}]/) && !value.match(/^["\(].*["\)]$/)) {
      return '"' + value.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
    }
    return value;
  };
  Solr.parseParameter = function(str) {
    var param = {}, parse = str.match(/^([^=]+)=(?:\{!([^\}]*)\})?(.*)$/);
    if (parse) {
      if (parse[2] != null) {
        var matches;
        while (matches = /([^\s=]+)=?(\S*)?/g.exec(parse[2])) {
          if (param.locals === undefined) param.locals = {};
          if (matches[2] == null) param.locals["type"] = matches[1]; else param.locals[matches[1]] = matches[2];
          parse[2] = parse[2].replace(matches[0], "");
        }
      }
      param.name = parse[1];
      var arr = parse[3].split(",");
      param.value = arr.length > 1 ? arr : parse[3];
    }
    return param;
  };
  Solr.Configuring = function(obj) {
    a$.extend(true, this, obj);
    var self = this;
    this.parameterStore = {};
    a$.each(this.parameters, function(p, name) {
      if (typeof p === "string") self.addParameter(Solr.parseParameter(name + "=" + p)); else self.addParameter(name, p);
    });
    delete obj.parameters;
    delete this.parameters;
  };
  var paramIsMultiple = function(name) {
    return name.match(/^(?:bf|bq|facet\.date|facet\.date\.other|facet\.date\.include|facet\.field|facet\.pivot|facet\.range|facet\.range\.other|facet\.range\.include|facet\.query|fq|group\.field|group\.func|group\.query|pf|qf|stats\.field)$/);
  };
  Solr.Configuring.prototype = {
    addParameter: function(param, value, locals) {
      var name;
      if (typeof param !== "object") {
        name = param;
        param = {
          name: param,
          value: value,
          locals: locals
        };
      } else name = param.name;
      if (paramIsMultiple(name)) {
        if (this.parameterStore[name] === undefined) this.parameterStore[name] = [ param ]; else {
          var found = false;
          a$.each(this.parameterStore[name], function(p) {
            found = found || a$.equal(true, param, p);
          });
          if (!found) this.parameterStore[name].push(param); else return false;
        }
      } else this.parameterStore[name] = param;
      return param;
    },
    findParameters: function(name, needle) {
      var indices = [], filter;
      if (this.parameterStore[name] !== undefined) {
        if (typeof needle === "function") {
          filter = function(p, i) {
            if (needle(p, i)) indices.push(i);
          };
        } else if (needle == null) {
          filter = function(p, i) {
            indices.push(i);
          };
        } else {
          if (typeof needle !== "object" || needle instanceof RegExp || Array.isArray(needle)) needle = {
            value: needle
          };
          filter = function(p, i) {
            if (a$.similar(p, needle)) indices.push(i);
          };
        }
        a$.each(paramIsMultiple(name) ? this.parameterStore[name] : [ this.parameterStore[name] ], filter);
      }
      return indices;
    },
    removeParameters: function(name, indices) {
      if (this.parameterStore[name] !== undefined) {
        if (typeof indices === "number") indices = [ indices ]; else if (!Array.isArray(indices)) indices = this.findParameters(name, indices);
        if (!paramIsMultiple(name) || indices.length == this.parameterStore[name].length) delete this.parameterStore[name]; else {
          indices.sort(function(a, b) {
            return a < b ? -1 : a > b ? 1 : 0;
          });
          for (var i = indices.length - 1; i >= 0; --i) this.parameterStore[name].splice(indices[i], 1);
        }
        return indices.length;
      } else return false;
    },
    getParameter: function(name, index) {
      if (this.parameterStore[name] === undefined) {
        var param = {
          name: name
        };
        this.parameterStore[name] = paramIsMultiple(name) ? [ param ] : param;
      }
      return index == null || !paramIsMultiple(name) ? this.parameterStore[name] : this.parameterStore[name][index];
    },
    getAllValues: function(name) {
      var val = null;
      if (this.parameterStore[name] !== undefined) val = !paramIsMultiple(name) ? this.parameterStore[name].value : this.parameterStore[name].map(function(p) {
        return p.value;
      });
      return val;
    }
  };
  Solr.QueryingURL = function(obj) {
    a$.extend(true, this, obj);
  };
  var paramValue = function(value) {
    if (Array.isArray(value)) return value.join(","); else if (typeof value !== "object") return value.toString(); else {
      var str = [];
      a$.each(value, function(v, k) {
        str.push(k + ":" + Solr.escapeValue(v));
      });
      return str.join(" ");
    }
  };
  Solr.QueryingURL.prototype = {
    __expects: [ Solr.Configuring ],
    prepareQuery: function() {
      var self = this, query = [];
      a$.each(self.parameterStore, function(plist, name) {
        if (!Array.isArray(plist)) plist = [ plist ];
        a$.each(plist, function(param) {
          var prefix = [];
          a$.each(param.locals, function(l, k) {
            prefix.push((k !== "type" ? k + "=" : "") + l);
          });
          prefix = prefix.length > 0 ? "{!" + prefix.join(" ") + "}" : "";
          if (param.value || prefix) query.push(name + "=" + encodeURIComponent(prefix + paramValue(param.value || name == "q" && "*:*")));
        });
      });
      return {
        url: "?" + query.join("&")
      };
    },
    parseQuery: function(response) {},
    parseValue: function(value) {}
  };
  Solr.QueryingJson = function(obj) {
    a$.extend(true, this, obj);
  };
  Solr.QueryingJson.prototype = {
    __expects: [ Solr.Configuring ],
    prepareQuery: function() {
      return {
        data: {}
      };
    },
    parseQuery: function(response) {},
    parseValue: function(value) {}
  };
  Solr.QueryingFlexible = function(obj) {
    a$.extend(true, this, obj);
  };
  Solr.QueryingFlexible.prototype = {
    __expects: [ Solr.Configuring, Solr.QueryingURL, Solr.QueryingJson ],
    jsonParameters: [ "q" ],
    prepareQuery: function() {
      return {
        url: "",
        data: ""
      };
    },
    parseQuery: function(response) {}
  };
  Solr.Persistency = function(obj) {
    a$.extend(true, this, obj);
    this.storage = {};
  };
  Solr.Persistency.prototype = {
    __expects: [ Solr.Configuring ],
    persistentParams: [],
    addParameter: function(param, value, locals) {
      a$.act(this, Solf.Configuring.prototype.addParameter, param, value, locals);
      return param;
    },
    removeParameters: function(indices) {
      a$.act(this, Solf.Configuring.prototype.removeParameters, indices);
    },
    onPrepare: function(settings) {}
  };
  Solr.Paging = function(obj) {
    a$.extend(true, this, obj);
    this.manager = null;
    this.currentPage = this.totalPages = this.totalEntries = null;
  };
  Solr.Paging.prototype = {
    pageSize: 20,
    multivalue: false,
    exclusion: false,
    locals: null,
    init: function(manager) {
      this.manager = manager;
      this.manager.addParameter("rows", this.pageSize);
    },
    setPage: function(page) {
      if (this.totalPages == null) return false;
      if (page === "next" || page === ">") page = this.currentPage + 1; else if (page === "prev" || page === "previous" || page === "<") page = this.currentPage - 1; else if (page === "first" || page === "start") page = 1; else if (page === "last" || page === "end") page = this.totalPages; else if (typeof page !== "number") page = parseInt(page);
      if (page > this.totalPages || page < 1 || page === this.currentPage) return false;
      this.currentPage = page;
      return this.manager.addParameter("start", (page - 1) * this.pageSize, this.locals);
    },
    page: function(p) {
      if (p !== undefined) this.setPage(p);
      return this.currentPage;
    },
    previousPage: function() {
      return this.currentPage > 1 ? this.currentPage - 1 : null;
    },
    nextPage: function() {
      return this.currentPage < this.totalPages ? this.currentPage + 1 : null;
    },
    afterRequest: function() {
      var offset = parseInt(this.manager.response.responseHeader && this.manager.response.responseHeader.params && this.manager.response.responseHeader.params.start || this.manager.getParameter("start").value || 0);
      this.pageSize = parseInt(this.manager.response.responseHeader && this.manager.response.responseHeader.params && this.manager.response.responseHeader.params.rows || this.manager.getParameter("rows").value || this.pageSize);
      this.totalEntries = parseInt(this.manager.response.response.numFound);
      this.currentPage = Math.floor(offset / this.pageSize) + 1;
      this.totalPages = Math.ceil(this.totalEntries / this.pageSize);
    },
    clickHandler: function(page) {
      var self = this;
      return function() {
        if (self.setPage(page)) self.manager.doRequest();
        return false;
      };
    }
  };
  Solr.Texting = function(obj) {
    a$.extend(true, this, obj);
    this.manager = null;
    this.delayTimer = null;
  };
  Solr.Texting.prototype = {
    delayed: false,
    locals: null,
    init: function(manager) {
      this.manager = manager;
    },
    doRequest: function() {
      if (this.delayed == null) return this.manager.doRequest(); else if (this.delayTimer != null) clearTimeout(this.delayTimer);
      var self = this;
      this.delayTimer = setTimeout(function() {
        self.manager.addParameter("start", 0);
        self.manager.doRequest();
        self.delayTimer = null;
      }, this.delayed);
    },
    set: function(q) {
      var before = this.manager.getParameter("q"), res = this.manager.addParameter("q", q, this.locals);
      after = this.manager.getParameter("q");
      return res && !a$.equal(before, after);
    },
    clear: function() {
      return this.manager.removeParameters("q");
    },
    unclickHandler: function() {
      var self = this;
      return function() {
        if (self.clear()) self.doRequest();
        return false;
      };
    },
    clickHandler: function(q) {
      var self = this;
      return function() {
        if (self.set(q)) self.doRequest();
        return false;
      };
    }
  };
  var FacetParameters = {
    prefix: null,
    sort: null,
    limit: null,
    offset: null,
    mincount: null,
    missing: null,
    method: null,
    "enum.cache.minDf": null
  }, facetValue = function(value) {
    if (!Array.isArray(value)) return Solr.escapeValue(value); else if (value.length == 1) return Solr.escapeValue(value[0]); else return "(" + value.map(function(v) {
      return Solr.escapeValue(v);
    }).join(" ") + ")";
  }, leadBracket = /\s*\(\s*?/, rearBracket = /\s*\)\s*$/;
  Solr.parseFacet = function(value) {
    var m = value.match(/^(-)?([^\s:]+):(.+)$/);
    if (!m) return null;
    var res = {
      field: m[2],
      exclude: !!m[1]
    }, sarr = m[3].replace(leadBracket, "").replace(rearBracket, "").replace(/\\"/g, "%0022").match(/[^\s"]+|"[^"]+"/g);
    for (var i = 0, sl = sarr.length; i < sl; ++i) sarr[i] = sarr[i].replace(/^"/, "").replace(/"$/, "").replace("%0022", '"');
    res.value = sl > 1 ? sarr : sarr[0];
    return res;
  };
  Solr.Faceting = function(obj) {
    a$.extend(true, this, obj);
    this.manager = null;
    if (!this.multivalue) this.aggregate = false;
    this.fieldRegExp = new RegExp("^-?" + this.field + ":");
  };
  Solr.Faceting.prototype = {
    multivalue: false,
    aggregate: false,
    exclusion: false,
    locals: null,
    facet: {},
    init: function(manager) {
      this.manager = manager;
      var fpars = a$.extend({}, FacetParameters), locals = null, self = this;
      if (this.exclusion) {
        this.locals = a$.extend(this.locals, {
          tag: this.id + "_tag"
        });
        locals = {
          ex: this.id + "_tag"
        };
      }
      this.manager.addParameter("facet", true);
      if (this.facet.date !== undefined) {
        this.manager.addParameter("facet.date", this.field, locals);
        a$.extend(fpars, {
          "date.start": null,
          "date.end": null,
          "date.gap": null,
          "date.hardend": null,
          "date.other": null,
          "date.include": null
        });
      } else if (this.facet.range !== undefined) {
        this.manager.addParameter("facet.range", this.field, locals);
        a$.extend(fpars, {
          "range.start": null,
          "range.end": null,
          "range.gap": null,
          "range.hardend": null,
          "range.other": null,
          "range.include": null
        });
      } else {
        this.facet.field = true;
        this.manager.addParameter("facet.field", this.field, locals);
      }
      fpars = a$.common(this.facet, fpars);
      a$.each(fpars, function(p, k) {
        self.manager.addParameter("f." + self.field + ".facet." + k, p);
      });
    },
    addValue: function(value, exclude) {
      if (!this.multivalue) this.clearValues();
      var index;
      if (!this.aggregate || !(index = this.manager.findParameters("fq", this.fieldRegExp)).length) return this.manager.addParameter("fq", this.fq(value, exclude), this.locals);
      var param = this.manager.getParameter("fq", index[0]), parsed = Solr.parseFacet(param.value), added = false;
      if (!Array.isArray(value)) value = [ value ];
      for (var v, i = 0, vl = value.length; i < vl; ++i) {
        v = value[i];
        if (parsed.value == v) continue; else if (Array.isArray(parsed.value) && parsed.value.indexOf(v) >= 0) continue;
        if (typeof parsed.value === "string") parsed.value = [ parsed.value ];
        parsed.value.push(v);
        added = true;
      }
      if (!added) return false;
      param.value = this.fq(parsed.value, exclude);
      return true;
    },
    removeValue: function(value) {
      if (!this.multivalue) return this.clearValues(); else {
        var self = this;
        return this.manager.removeParameters("fq", function(p) {
          var parse;
          if (!p.value.match(self.fieldRegExp)) return false; else if (!self.aggregate) return p.value.indexOf(facetValue(value)) >= 0;
          parse = Solr.parseFacet(p.value);
          if (!Array.isArray(value)) value = [ value ];
          if (!Array.isArray(parse.value)) return value.indexOf(parse.value) >= 0;
          parse.value = parse.value.filter(function(v) {
            return value.indexOf(v) == -1;
          });
          if (!parse.value.length) return true; else if (parse.value.length == 1) parse.value = parse.value[0];
          p.value = self.fq(parse.value);
          return false;
        });
      }
    },
    clearValues: function() {
      return this.manager.removeParameters("fq", this.fieldRegExp);
    },
    getFacetCounts: function() {
      var property;
      if (this.facet.field !== undefined) property = "facet_fields"; else if (this.facet.date !== undefined) property = "facet_dates"; else if (this.facet.range !== undefined) property = "facet_ranges";
      if (property !== undefined) {
        switch (this.manager.getParameter("json.nl").value) {
         case "map":
          return this.getFacetCountsMap(property);

         case "arrarr":
          return this.getFacetCountsArrarr(property);

         default:
          return this.getFacetCountsFlat(property);
        }
      }
      throw 'Cannot get facet counts unless one of the following properties is set to "true" on widget "' + this.id + '": "facet.field", "facet.date", or "facet.range".';
    },
    getFacetCountsMap: function(property) {
      var counts = [];
      for (var facet in this.manager.response.facet_counts[property][this.field]) {
        counts.push({
          facet: facet,
          count: parseInt(this.manager.response.facet_counts[property][this.field][facet])
        });
      }
      return counts;
    },
    getFacetCountsArrarr: function(property) {
      var counts = [];
      for (var i = 0, l = this.manager.response.facet_counts[property][this.field].length; i < l; i++) {
        counts.push({
          facet: this.manager.response.facet_counts[property][this.field][i][0],
          count: parseInt(this.manager.response.facet_counts[property][this.field][i][1])
        });
      }
      return counts;
    },
    getFacetCountsFlat: function(property) {
      var counts = [];
      for (var i = 0, l = this.manager.response.facet_counts[property][this.field].length; i < l; i += 2) {
        counts.push({
          facet: this.manager.response.facet_counts[property][this.field][i],
          count: parseInt(this.manager.response.facet_counts[property][this.field][i + 1])
        });
      }
      return counts;
    },
    doRequest: function() {
      this.manager.addParameter("start", 0);
      this.manager.doRequest();
    },
    clickHandler: function(value) {
      var self = this;
      return function(e) {
        if (self.addValue(value)) self.doRequest();
        return false;
      };
    },
    unclickHandler: function(value) {
      var self = this;
      return function(e) {
        if (self.removeValue(value)) self.doRequest();
        return false;
      };
    },
    fq: function(value, exclude) {
      return (exclude ? "-" : "") + this.field + ":" + facetValue(value);
    }
  };
  if (typeof module === "object" && module && typeof module.exports === "object") module.exports = Solr; else {
    this.Solr = Solr;
    if (typeof define === "function" && define.amd) define(Solr);
  }
})();