/*!
 * css-vars-ponyfill
 * v2.4.9
 * https://jhildenbiddle.github.io/css-vars-ponyfill/
 * (c) 2018-2024 John Hildenbiddle <http://hildenbiddle.com>
 * MIT license
 */
function e(){return e=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e},e.apply(this,arguments)}
/*!
 * get-css-data
 * v2.1.0
 * https://github.com/jhildenbiddle/get-css-data
 * (c) 2018-2022 John Hildenbiddle <http://hildenbiddle.com>
 * MIT license
 */function t(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r={mimeType:t.mimeType||null,onBeforeSend:t.onBeforeSend||Function.prototype,onSuccess:t.onSuccess||Function.prototype,onError:t.onError||Function.prototype,onComplete:t.onComplete||Function.prototype},n=Array.isArray(e)?e:[e],o=Array.apply(null,Array(n.length)).map(function(e){return null});function s(e){var t="string"==typeof e,r=t&&"<"===e.trim().charAt(0);return t&&!r}function a(e,t){r.onError(e,n[t],t)}function c(e,t){var s=r.onSuccess(e,n[t],t);e=!1===s?"":s||e,o[t]=e,-1===o.indexOf(null)&&r.onComplete(o)}var i=document.createElement("a");n.forEach(function(e,t){if(i.setAttribute("href",e),i.href=String(i.href),Boolean(document.all&&!window.atob)&&i.host.split(":")[0]!==location.host.split(":")[0]){if(i.protocol===location.protocol){var n=new XDomainRequest;n.open("GET",e),n.timeout=0,n.onprogress=Function.prototype,n.ontimeout=Function.prototype,n.onload=function(){var e=n.responseText;s(e)?c(e,t):a(n,t)},n.onerror=function(e){a(n,t)},setTimeout(function(){n.send()},0)}else a(null,t)}else{var o=new XMLHttpRequest;o.open("GET",e),r.mimeType&&o.overrideMimeType&&o.overrideMimeType(r.mimeType),r.onBeforeSend(o,e,t),o.onreadystatechange=function(){if(4===o.readyState){var e=o.responseText;o.status<400&&s(e)||0===o.status&&s(e)?c(e,t):a(o,t)}},o.send()}})}
/**
 * Gets CSS data from <style> and <link> nodes (including @imports), then
 * returns data in order processed by DOM. Allows specifying nodes to
 * include/exclude and filtering CSS data using RegEx.
 *
 * @preserve
 * @param {object}   [options] The options object
 * @param {object}   [options.rootElement=document] Root element to traverse for
 *                   <link> and <style> nodes.
 * @param {string}   [options.include] CSS selector matching <link> and <style>
 *                   nodes to include
 * @param {string}   [options.exclude] CSS selector matching <link> and <style>
 *                   nodes to exclude
 * @param {object}   [options.filter] Regular expression used to filter node CSS
 *                   data. Each block of CSS data is tested against the filter,
 *                   and only matching data is included.
 * @param {boolean}  [options.skipDisabled=true] Determines if disabled
 *                   stylesheets will be skipped while collecting CSS data.
 * @param {boolean}  [options.useCSSOM=false] Determines if CSS data will be
 *                   collected from a stylesheet's runtime values instead of its
 *                   text content. This is required to get accurate CSS data
 *                   when a stylesheet has been modified using the deleteRule()
 *                   or insertRule() methods because these modifications will
 *                   not be reflected in the stylesheet's text content.
 * @param {function} [options.onBeforeSend] Callback before XHR is sent. Passes
 *                   1) the XHR object, 2) source node reference, and 3) the
 *                   source URL as arguments.
 * @param {function} [options.onSuccess] Callback on each CSS node read. Passes
 *                   1) CSS text, 2) source node reference, and 3) the source
 *                   URL as arguments.
 * @param {function} [options.onError] Callback on each error. Passes 1) the XHR
 *                   object for inspection, 2) soure node reference, and 3) the
 *                   source URL that failed (either a <link> href or an @import)
 *                   as arguments
 * @param {function} [options.onComplete] Callback after all nodes have been
 *                   processed. Passes 1) concatenated CSS text, 2) an array of
 *                   CSS text in DOM order, and 3) an array of nodes in DOM
 *                   order as arguments.
 *
 * @example
 *
 *   getCssData({
 *     rootElement : document,
 *     include     : 'style,link[rel="stylesheet"]',
 *     exclude     : '[href="skip.css"]',
 *     filter      : /red/,
 *     skipDisabled: true,
 *     useCSSOM    : false,
 *     onBeforeSend(xhr, node, url) {
 *       // ...
 *     }
 *     onSuccess(cssText, node, url) {
 *       // ...
 *     }
 *     onError(xhr, node, url) {
 *       // ...
 *     },
 *     onComplete(cssText, cssArray, nodeArray) {
 *       // ...
 *     }
 *   });
 */function r(e){var r=/\/\*[\s\S]+?\*\//g,o=/(?:@import\s*)(?:url\(\s*)?(?:['"])([^'"]*)(?:['"])(?:\s*\))?(?:[^;]*;)/g,s={rootElement:e.rootElement||document,include:e.include||'style,link[rel="stylesheet"]',exclude:e.exclude||null,filter:e.filter||null,skipDisabled:!1!==e.skipDisabled,useCSSOM:e.useCSSOM||!1,onBeforeSend:e.onBeforeSend||Function.prototype,onSuccess:e.onSuccess||Function.prototype,onError:e.onError||Function.prototype,onComplete:e.onComplete||Function.prototype},a=Array.apply(null,s.rootElement.querySelectorAll(s.include)).filter(function(e){return t=e,r=s.exclude,!(t.matches||t.matchesSelector||t.webkitMatchesSelector||t.mozMatchesSelector||t.msMatchesSelector||t.oMatchesSelector).call(t,r);var t,r}),c=Array.apply(null,Array(a.length)).map(function(e){return null});function i(){if(-1===c.indexOf(null)){c.reduce(function(e,t,r){return""===t&&e.push(r),e},[]).reverse().forEach(function(e){return[a,c].forEach(function(t){return t.splice(e,1)})});var e=c.join("");s.onComplete(e,c,a)}}function u(e,t,r,n){var o=s.onSuccess(e,r,n);f(e=void 0!==o&&!1===Boolean(o)?"":o||e,r,n,function(e,n){null===c[t]&&(n.forEach(function(e){return s.onError(e.xhr,r,e.url)}),!s.filter||s.filter.test(e)?c[t]=e:c[t]="",i())})}function l(e,t){var s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[],a={};return a.rules=(e.replace(r,"").match(o)||[]).filter(function(e){return-1===s.indexOf(e)}),a.urls=a.rules.map(function(e){return e.replace(o,"$1")}),a.absoluteUrls=a.urls.map(function(e){return n(e,t)}),a.absoluteRules=a.rules.map(function(e,r){var o=a.urls[r],s=n(a.absoluteUrls[r],t);return e.replace(o,s)}),a}function f(e,r,n,o){var a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:[],c=arguments.length>5&&void 0!==arguments[5]?arguments[5]:[],i=l(e,n,c);i.rules.length?t(i.absoluteUrls,{onBeforeSend:function(e,t,n){s.onBeforeSend(e,r,t)},onSuccess:function(e,t,n){var o=s.onSuccess(e,r,t),a=l(e=!1===o?"":o||e,t,c);return a.rules.forEach(function(t,r){e=e.replace(t,a.absoluteRules[r])}),e},onError:function(t,s,u){a.push({xhr:t,url:s}),c.push(i.rules[u]),f(e,r,n,o,a,c)},onComplete:function(t){t.forEach(function(t,r){e=e.replace(i.rules[r],t)}),f(e,r,n,o,a,c)}}):o(e,a)}a.length?a.forEach(function(e,r){var o=e.getAttribute("href"),a=e.getAttribute("rel"),l="link"===e.nodeName.toLowerCase()&&o&&a&&-1!==a.toLowerCase().indexOf("stylesheet"),f=!1!==s.skipDisabled&&e.disabled,d="style"===e.nodeName.toLowerCase();if(l&&!f)if(-1!==o.indexOf("data:text/css")){var p=decodeURIComponent(o.substring(o.indexOf(",")+1));s.useCSSOM&&(p=Array.apply(null,e.sheet.cssRules).map(function(e){return e.cssText}).join("")),u(p,r,e,location.href)}else t(o,{mimeType:"text/css",onBeforeSend:function(t,r,n){s.onBeforeSend(t,e,r)},onSuccess:function(t,s,a){var c=n(o);u(t,r,e,c)},onError:function(t,n,o){c[r]="",s.onError(t,e,n),i()}});else if(d&&!f){var m=e.textContent;s.useCSSOM&&(m=Array.apply(null,e.sheet.cssRules).map(function(e){return e.cssText}).join("")),u(m,r,e,location.href)}else c[r]="",i()}):s.onComplete("",[])}function n(e,t){var r=document.implementation.createHTMLDocument(""),n=r.createElement("base"),o=r.createElement("a");return r.head.appendChild(n),r.body.appendChild(o),n.href=t||document.baseURI||(document.querySelector("base")||{}).href||location.href,o.href=e,o.href}var o=s;function s(e,t,r){e instanceof RegExp&&(e=a(e,r)),t instanceof RegExp&&(t=a(t,r));var n=c(e,t,r);return n&&{start:n[0],end:n[1],pre:r.slice(0,n[0]),body:r.slice(n[0]+e.length,n[1]),post:r.slice(n[1]+t.length)}}function a(e,t){var r=t.match(e);return r?r[0]:null}function c(e,t,r){var n,o,s,a,c,i=r.indexOf(e),u=r.indexOf(t,i+1),l=i;if(i>=0&&u>0){if(e===t)return[i,u];for(n=[],s=r.length;l>=0&&!c;)l==i?(n.push(l),i=r.indexOf(e,l+1)):1==n.length?c=[n.pop(),u]:((o=n.pop())<s&&(s=o,a=u),u=r.indexOf(t,l+1)),l=i<u&&i>=0?i:u;n.length&&(c=[s,a])}return c}function i(t){var r=e({},{preserveStatic:!0,removeComments:!1},arguments.length>1&&void 0!==arguments[1]?arguments[1]:{});function n(e){throw new Error("CSS parse error: ".concat(e))}function s(e){var r=e.exec(t);if(r)return t=t.slice(r[0].length),r}function a(){return s(/^{\s*/)}function c(){return s(/^}/)}function i(){s(/^\s*/)}function u(){if(i(),"/"===t[0]&&"*"===t[1]){for(var e=2;t[e]&&("*"!==t[e]||"/"!==t[e+1]);)e++;if(!t[e])return n("end of comment is missing");var r=t.slice(2,e);return t=t.slice(e+2),{type:"comment",comment:r}}}function l(){for(var e,t=[];e=u();)t.push(e);return r.removeComments?[]:t}function f(){for(i();"}"===t[0];)n("extra closing bracket");var e=s(/^(("(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^{])+)/);if(e){var r,o=e[0].trim();/\/\*/.test(o)&&(o=o.replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g,""));var a=/["']\w*,\w*["']/.test(o);return a&&(o=o.replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g,function(e){return e.replace(/,/g,"‌")})),r=/,/.test(o)?o.split(/\s*(?![^(]*\)),\s*/):[o],a&&(r=r.map(function(e){return e.replace(/\u200C/g,",")})),r}}function d(){if("@"===t[0])return v();s(/^([;\s]*)+/);var e=/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g,r=s(/^(\*?[-#/*\\\w.]+(\[[0-9a-z_-]+\])?)\s*/);if(r){if(r=r[0].trim(),!s(/^:\s*/))return n("property missing ':'");var o=s(/^((?:\/\*.*?\*\/|'(?:\\'|.)*?'|"(?:\\"|.)*?"|\((\s*'(?:\\'|.)*?'|"(?:\\"|.)*?"|[^)]*?)\s*\)|[^};])+)/),a={type:"declaration",property:r.replace(e,""),value:o?o[0].replace(e,"").trim():""};return s(/^[;\s]*/),a}}function p(){if(!a())return n("missing '{'");for(var e,t=l();e=d();)t.push(e),t=t.concat(l());return c()?t:n("missing '}'")}function m(){i();for(var e,t=[];e=s(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/);)t.push(e[1]),s(/^,\s*/);if(t.length)return{type:"keyframe",values:t,declarations:p()}}function v(){if(i(),"@"===t[0]){var e=function(){var e=s(/^@(import|charset|namespace)\s*([^;]+);/);if(e)return{type:e[1],name:e[2].trim()}}()||function(){if(s(/^@font-face\s*/))return{type:"font-face",declarations:p()}}()||function(){var e=s(/^@media([^{]+)*/);if(e)return{type:"media",media:(e[1]||"").trim(),rules:g()}}()||function(){var e=s(/^@([-\w]+)?keyframes\s*/);if(e){var t=e[1];if(!(e=s(/^([-\w]+)\s*/)))return n("@keyframes missing name");var r,o=e[1];if(!a())return n("@keyframes missing '{'");for(var i=l();r=m();)i.push(r),i=i.concat(l());return c()?{type:"keyframes",name:o,vendor:t,keyframes:i}:n("@keyframes missing '}'")}}()||function(){var e=s(/^@supports *([^{]+)/);if(e)return{type:"supports",supports:e[1].trim(),rules:g()}}()||function(){var e=s(/^@([-\w]+)?document *([^{]+)/);if(e)return{type:"document",document:e[2].trim(),vendor:e[1]?e[1].trim():null,rules:g()}}()||function(){var e=s(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/);if(e)return{type:"custom-media",name:e[1].trim(),media:e[2].trim()}}()||function(){if(s(/^@host\s*/))return{type:"host",rules:g()}}()||function(){if(s(/^@page */))return{type:"page",selectors:f()||[],declarations:p()}}()||function(){var e=s(/@(top|bottom|left|right)-(left|center|right|top|middle|bottom)-?(corner)?\s*/);if(e)return{type:"page-margin-box",name:"".concat(e[1],"-").concat(e[2])+(e[3]?"-".concat(e[3]):""),declarations:p()}}();if(e&&!r.preserveStatic){var o=!1;if(e.declarations)o=e.declarations.some(function(e){return/var\(/.test(e.value)});else o=(e.keyframes||e.rules||[]).some(function(e){return(e.declarations||[]).some(function(e){return/var\(/.test(e.value)})});return o?e:{}}return e}}function h(){if(!r.preserveStatic){var e=o("{","}",t);if(e){var s=/:(?:root|host)(?![.:#(])/.test(e.pre)&&/--\S*\s*:/.test(e.body),a=/var\(/.test(e.body);if(!s&&!a)return t=t.slice(e.end+1),{}}}var c=f()||[],i=r.preserveStatic?p():p().filter(function(e){var t=c.some(function(e){return/:(?:root|host)(?![.:#(])/.test(e)})&&/^--\S/.test(e.property),r=/var\(/.test(e.value);return t||r});return c.length||n("selector missing"),{type:"rule",selectors:c,declarations:i}}function g(e){if(!e&&!a())return n("missing '{'");for(var r,o=l();t.length&&(e||"}"!==t[0])&&(r=v()||h());)r.type&&o.push(r),o=o.concat(l());return e||c()?o:n("missing '}'")}return{type:"stylesheet",stylesheet:{rules:g(!0),errors:[]}}}function u(t){var r=e({},{parseHost:!1,store:{},onWarning:function(){}},arguments.length>1&&void 0!==arguments[1]?arguments[1]:{}),n=new RegExp(":".concat(r.parseHost?"host":"root","$"));return"string"==typeof t&&(t=i(t,r)),t.stylesheet.rules.forEach(function(e){"rule"===e.type&&e.selectors.some(function(e){return n.test(e)})&&e.declarations.forEach(function(e,t){var n=e.property,o=e.value;n&&0===n.indexOf("--")&&(r.store[n]=o)})}),r.store}function l(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",r=arguments.length>2?arguments[2]:void 0,n={charset:function(e){return"@charset "+e.name+";"},comment:function(e){return 0===e.comment.indexOf("__CSSVARSPONYFILL")?"/*"+e.comment+"*/":""},"custom-media":function(e){return"@custom-media "+e.name+" "+e.media+";"},declaration:function(e){return e.property+":"+e.value+";"},document:function(e){return"@"+(e.vendor||"")+"document "+e.document+"{"+o(e.rules)+"}"},"font-face":function(e){return"@font-face{"+o(e.declarations)+"}"},host:function(e){return"@host{"+o(e.rules)+"}"},import:function(e){return"@import "+e.name+";"},keyframe:function(e){return e.values.join(",")+"{"+o(e.declarations)+"}"},keyframes:function(e){return"@"+(e.vendor||"")+"keyframes "+e.name+"{"+o(e.keyframes)+"}"},media:function(e){return"@media "+e.media+"{"+o(e.rules)+"}"},namespace:function(e){return"@namespace "+e.name+";"},page:function(e){return"@page "+(e.selectors.length?e.selectors.join(", "):"")+"{"+o(e.declarations)+"}"},"page-margin-box":function(e){return"@"+e.name+"{"+o(e.declarations)+"}"},rule:function(e){var t=e.declarations;if(t.length)return e.selectors.join(",")+"{"+o(t)+"}"},supports:function(e){return"@supports "+e.supports+"{"+o(e.rules)+"}"}};function o(e){for(var o="",s=0;s<e.length;s++){var a=e[s];r&&r(a);var c=n[a.type](a);c&&(o+=c,c.length&&a.selectors&&(o+=t))}return o}return o(e.stylesheet.rules)}function f(e,t){e.rules.forEach(function(r){r.rules?f(r,t):r.keyframes?r.keyframes.forEach(function(e){"keyframe"===e.type&&t(e.declarations,r)}):r.declarations&&t(r.declarations,e)})}s.range=c;function d(t){var r=e({},{preserveStatic:!0,preserveVars:!1,variables:{},onWarning:function(){}},arguments.length>1&&void 0!==arguments[1]?arguments[1]:{});return"string"==typeof t&&(t=i(t,r)),f(t.stylesheet,function(e,t){for(var n=0;n<e.length;n++){var o=e[n],s=o.type,a=o.property,c=o.value;if("declaration"===s)if(r.preserveVars||!a||0!==a.indexOf("--")){if(-1!==c.indexOf("var(")){var i=m(c,r);i!==o.value&&(i=p(i),r.preserveVars?(e.splice(n,0,{type:s,property:a,value:i}),n++):o.value=i)}}else e.splice(n,1),n--}}),l(t)}function p(e){return(e.match(/calc\(([^)]+)\)/g)||[]).forEach(function(t){var r="calc".concat(t.split("calc").join(""));e=e.replace(t,r)}),e}function m(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=arguments.length>2?arguments[2]:void 0;if(-1===e.indexOf("var("))return e;var n,s,a,c,i,u,l=o("(",")",e);return l?"var"===l.pre.slice(-3)?0===l.body.trim().length?(t.onWarning("var() must contain a non-whitespace string"),e):l.pre.slice(0,-3)+(n=l.body,s=n.split(",")[0].replace(/[\s\n\t]/g,""),a=(n.match(/(?:\s*,\s*){1}(.*)?/)||[])[1],c=Object.prototype.hasOwnProperty.call(t.variables,s)?String(t.variables[s]):void 0,i=c||(a?String(a):void 0),u=r||n,c||t.onWarning('variable "'.concat(s,'" is undefined')),i&&"undefined"!==i&&i.length>0?m(i,t,u):"var(".concat(u,")"))+m(l.post,t):l.pre+"(".concat(m(l.body,t),")")+m(l.post,t):(-1!==e.indexOf("var(")&&t.onWarning('missing closing ")" in the value "'.concat(e,'"')),e)}var v="undefined"!=typeof window,h=v&&window.CSS&&window.CSS.supports&&window.CSS.supports("(--a: 0)"),g={group:0,job:0},y={rootElement:v?document:null,shadowDOM:!1,include:"style,link[rel=stylesheet]",exclude:"",variables:{},onlyLegacy:!0,preserveStatic:!0,preserveVars:!1,silent:!1,updateDOM:!0,updateURLs:!0,watch:null,onBeforeSend:function(){},onError:function(){},onWarning:function(){},onSuccess:function(){},onComplete:function(){},onFinally:function(){}},b={cssComments:/\/\*[\s\S]+?\*\//g,cssKeyframes:/@(?:-\w*-)?keyframes/,cssMediaQueries:/@media[^{]+\{([\s\S]+?})\s*}/g,cssUrls:/url\((?!['"]?(?:data|http|\/\/):)['"]?([^'")]*)['"]?\)/g,cssVarDeclRules:/(?::(?:root|host)(?![.:#(])[\s,]*[^{]*{\s*[^}]*})/g,cssVarDecls:/(?:[\s;]*)(-{2}\w[\w-]*)(?:\s*:\s*)([^;]*);/g,cssVarFunc:/var\(\s*--[\w-]/,cssVars:/(?:(?::(?:root|host)(?![.:#(])[\s,]*[^{]*{\s*[^;]*;*\s*)|(?:var\(\s*))(--[^:)]+)(?:\s*[:)])/},S={dom:{},job:{},user:{}},E=!1,w=null,C=0,x=null,O=!1;
/**
 * Fetches, parses, and transforms CSS custom properties from specified
 * <style> and <link> elements into static values, then appends a new <style>
 * element with static values to the DOM to provide CSS custom property
 * compatibility for legacy browsers. Also provides a single interface for
 * live updates of runtime values in both modern and legacy browsers.
 *
 * @preserve
 * @param {object}   [options] Options object
 * @param {object}   [options.rootElement=document] Root element to traverse for
 *                   <link> and <style> nodes
 * @param {boolean}  [options.shadowDOM=false] Determines if shadow DOM <link>
 *                   and <style> nodes will be processed.
 * @param {string}   [options.include="style,link[rel=stylesheet]"] CSS selector
 *                   matching <link re="stylesheet"> and <style> nodes to
 *                   process
 * @param {string}   [options.exclude] CSS selector matching <link
 *                   rel="stylehseet"> and <style> nodes to exclude from those
 *                   matches by options.include
 * @param {object}   [options.variables] A map of custom property name/value
 *                   pairs. Property names can omit or include the leading
 *                   double-hyphen (—), and values specified will override
 *                   previous values
 * @param {boolean}  [options.onlyLegacy=true] Determines if the ponyfill will
 *                   only generate legacy-compatible CSS in browsers that lack
 *                   native support (i.e., legacy browsers)
 * @param {boolean}  [options.preserveStatic=true] Determines if CSS
 *                   declarations that do not reference a custom property will
 *                   be preserved in the transformed CSS
 * @param {boolean}  [options.preserveVars=false] Determines if CSS custom
 *                   property declarations will be preserved in the transformed
 *                   CSS
 * @param {boolean}  [options.silent=false] Determines if warning and error
 *                   messages will be displayed on the console
 * @param {boolean}  [options.updateDOM=true] Determines if the ponyfill will
 *                   update the DOM after processing CSS custom properties
 * @param {boolean}  [options.updateURLs=true] Determines if relative url()
 *                   paths will be converted to absolute urls in external CSS
 * @param {boolean}  [options.watch=false] Determines if a MutationObserver will
 *                   be created that will execute the ponyfill when a <link> or
 *                   <style> DOM mutation is observed
 * @param {function} [options.onBeforeSend] Callback before XHR is sent. Passes
 *                   1) the XHR object, 2) source node reference, and 3) the
 *                   source URL as arguments
 * @param {function} [options.onError] Callback after a CSS parsing error has
 *                   occurred or an XHR request has failed. Passes 1) an error
 *                   message, and 2) source node reference, 3) xhr, and 4 url as
 *                   arguments.
 * @param {function} [options.onWarning] Callback after each CSS parsing warning
 *                   has occurred. Passes 1) a warning message as an argument.
 * @param {function} [options.onSuccess] Callback after CSS data has been
 *                   collected from each node and before CSS custom properties
 *                   have been transformed. Allows modifying the CSS data before
 *                   it is transformed by returning any string value (or false
 *                   to skip). Passes 1) CSS text, 2) source node reference, and
 *                   3) the source URL as arguments.
 * @param {function} [options.onComplete] Callback after all CSS has been
 *                   processed, legacy-compatible CSS has been generated, and
 *                   (optionally) the DOM has been updated. Passes 1) a CSS
 *                   string with CSS variable values resolved, 2) an array of
 *                   output <style> node references that have been appended to
 *                   the DOM, 3) an object containing all custom properies names
 *                   and values, and 4) the ponyfill execution time in
 *                   milliseconds.
 * @param {function} [options.onFinally] Callback in modern and legacy browsers
 *                   after the ponyfill has finished all tasks. Passes 1) a
 *                   boolean indicating if the last ponyfill call resulted in a
 *                   style change, 2) a boolean indicating if the current
 *                   browser provides native support for CSS custom properties,
 *                   and 3) the ponyfill execution time in milliseconds.
 * @example
 *
 *   cssVars({
 *     rootElement   : document,
 *     shadowDOM     : false,
 *     include       : 'style,link[rel="stylesheet"]',
 *     exclude       : '',
 *     variables     : {},
 *     onlyLegacy    : true,
 *     preserveStatic: true,
 *     preserveVars  : false,
 *     silent        : false,
 *     updateDOM     : true,
 *     updateURLs    : true,
 *     watch         : false,
 *     onBeforeSend(xhr, node, url) {},
 *     onError(message, node, xhr, url) {},
 *     onWarning(message) {},
 *     onSuccess(cssText, node, url) {},
 *     onComplete(cssText, styleNode, cssVariables, benchmark) {},
 *     onFinally(hasChanged, hasNativeSupport, benchmark)
 *   });
 */
function A(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},n=e({},y,t);function o(e,t,r,o){!n.silent&&window.console,n.onError(e,t,r,o)}function s(e){!n.silent&&window.console,n.onWarning(e)}function a(e){n.onFinally(Boolean(e),h,_()-n.__benchmark)}if(v){if(n.watch)return n.watch=y.watch,function(e){function t(e){var t=r(e)&&e.hasAttribute("disabled"),n=(e.sheet||{}).disabled;return t||n}function r(e){return"link"===e.nodeName.toLowerCase()&&-1!==(e.getAttribute("rel")||"").indexOf("stylesheet")}function n(e){return"style"===e.nodeName.toLowerCase()}function o(n){var o=!1;if("attributes"===n.type&&r(n.target)&&!t(n.target)){var s="disabled"===n.attributeName,a="href"===n.attributeName,c="skip"===n.target.getAttribute("data-cssvars"),i="src"===n.target.getAttribute("data-cssvars");s?o=!c&&!i:a&&(c?n.target.setAttribute("data-cssvars",""):i&&j(e.rootElement,!0),o=!0)}return o}function s(e){var t=!1;if("childList"===e.type){var r=n(e.target),o="out"===e.target.getAttribute("data-cssvars");t=r&&!o}return t}function a(e){var o=!1;return"childList"===e.type&&(o=[].slice.call(e.addedNodes).some(function(e){var o=1===e.nodeType&&e.hasAttribute("data-cssvars"),s=n(e)&&b.cssVars.test(e.textContent);return!o&&(r(e)||s)&&!t(e)})),o}function c(t){var r=!1;return"childList"===t.type&&(r=[].slice.call(t.removedNodes).some(function(t){var r=1===t.nodeType,n=r&&"out"===t.getAttribute("data-cssvars"),o=r&&"src"===t.getAttribute("data-cssvars"),s=o;if(o||n){var a=t.getAttribute("data-cssvars-group"),c=e.rootElement.querySelector('[data-cssvars-group="'.concat(a,'"]'));o&&j(e.rootElement,!0),c&&c.parentNode.removeChild(c)}return s})),r}if(!window.MutationObserver)return;w&&(w.disconnect(),w=null);w=new MutationObserver(function(t){t.some(function(e){return o(e)||s(e)||a(e)||c(e)})&&A(e)}),w.observe(document.documentElement,{attributes:!0,attributeFilter:["disabled","href"],childList:!0,subtree:!0})}(n),void A(n);if(!1===n.watch&&w&&(w.disconnect(),w=null),!n.__benchmark){if(E===n.rootElement)return void function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:100;clearTimeout(x),x=setTimeout(function(){e.__benchmark=null,A(e)},t)}(t);var c=[].slice.call(n.rootElement.querySelectorAll('[data-cssvars]:not([data-cssvars="out"])'));if(n.__benchmark=_(),n.exclude=[w?'[data-cssvars]:not([data-cssvars=""])':'[data-cssvars="out"]',"link[disabled]:not([data-cssvars])",n.exclude].filter(function(e){return e}).join(","),n.variables=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=/^-{2}/;return Object.keys(e).reduce(function(r,n){return r[t.test(n)?n:"--".concat(n.replace(/^-+/,""))]=e[n],r},{})}(n.variables),c.forEach(function(e){var t="style"===e.nodeName.toLowerCase()&&e.__cssVars.text,r=t&&e.textContent!==e.__cssVars.text;t&&r&&(e.sheet&&(e.sheet.disabled=!1),e.setAttribute("data-cssvars",""))}),!w)[].slice.call(n.rootElement.querySelectorAll('[data-cssvars="out"]')).forEach(function(e){var t=e.getAttribute("data-cssvars-group");(t?n.rootElement.querySelector('[data-cssvars="src"][data-cssvars-group="'.concat(t,'"]')):null)||e.parentNode.removeChild(e)}),C&&c.length<C&&(C=c.length,S.dom={})}if("loading"!==document.readyState)if(h&&n.onlyLegacy){var f=!1;if(n.updateDOM){var p=n.rootElement.host||(n.rootElement===document?document.documentElement:n.rootElement);Object.keys(n.variables).forEach(function(e){var t=n.variables[e];f=f||t!==getComputedStyle(p).getPropertyValue(e),p.style.setProperty(e,t)})}a(f)}else!O&&(n.shadowDOM||n.rootElement.shadowRoot||n.rootElement.host)?r({rootElement:y.rootElement,include:y.include,exclude:n.exclude,skipDisabled:!1,onSuccess:function(e,t,r){return!((t.sheet||{}).disabled&&!t.__cssVars)&&((e=((e=e.replace(b.cssComments,"").replace(b.cssMediaQueries,"")).match(b.cssVarDeclRules)||[]).join(""))||!1)},onComplete:function(e,t,r){u(e,{store:S.dom,onWarning:s}),O=!0,A(n)}}):(E=n.rootElement,r({rootElement:n.rootElement,include:n.include,exclude:n.exclude,skipDisabled:!1,onBeforeSend:n.onBeforeSend,onError:function(e,t,r){var n=e.responseURL||k(r,location.href),s=e.statusText?"(".concat(e.statusText,")"):"Unspecified Error"+(0===e.status?" (possibly CORS related)":"");o("CSS XHR Error: ".concat(n," ").concat(e.status," ").concat(s),t,e,n)},onSuccess:function(e,t,r){if((t.sheet||{}).disabled&&!t.__cssVars)return!1;var o="link"===t.nodeName.toLowerCase(),s="style"===t.nodeName.toLowerCase()&&e!==t.textContent,a=n.onSuccess(e,t,r);return e=void 0!==a&&!1===Boolean(a)?"":a||e,n.updateURLs&&(o||s)&&(e=function(e,t){var r=e.replace(b.cssComments,"").match(b.cssUrls)||[];return r.forEach(function(r){var n=r.replace(b.cssUrls,"$1"),o=k(n,t);e=e.replace(r,r.replace(n,o))}),e}(e,r)),e},onComplete:function(t,r){var c=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[],f=e({},S.dom,S.user);if(S.job={},c.forEach(function(e,t){var a=r[t];if(e.__cssVars=e.__cssVars||{},e.__cssVars.text=a,b.cssVars.test(a))try{var c=i(a,{preserveStatic:n.preserveStatic,removeComments:!0});u(c,{parseHost:Boolean(n.rootElement.host),store:S.dom,onWarning:s}),e.__cssVars.tree=c}catch(l){o(l.message,e)}}),e(S.job,S.dom),n.updateDOM?(e(S.user,n.variables),e(S.job,S.user)):(e(S.job,S.user,n.variables),e(f,n.variables)),g.job>0&&Boolean(Object.keys(S.job).length>Object.keys(f).length||Boolean(Object.keys(f).length&&Object.keys(S.job).some(function(e){return S.job[e]!==f[e]}))))j(n.rootElement),A(n);else{var p=[],m=[],v=!1;if(n.updateDOM&&g.job++,c.forEach(function(t,a){var c=!t.__cssVars.tree;if(t.__cssVars.tree)try{d(t.__cssVars.tree,e({},n,{variables:S.job,onWarning:s}));var i=l(t.__cssVars.tree);if(n.updateDOM){var u=r[a],f=b.cssVarFunc.test(u);if(t.getAttribute("data-cssvars")||t.setAttribute("data-cssvars","src"),i.length&&f){var h=t.getAttribute("data-cssvars-group")||++g.group,y=i.replace(/\s/g,""),E=n.rootElement.querySelector('[data-cssvars="out"][data-cssvars-group="'.concat(h,'"]'))||document.createElement("style");v=v||b.cssKeyframes.test(i),n.preserveStatic&&t.sheet&&(t.sheet.disabled=!0),E.hasAttribute("data-cssvars")||E.setAttribute("data-cssvars","out"),y===t.textContent.replace(/\s/g,"")?(c=!0,E&&E.parentNode&&(t.removeAttribute("data-cssvars-group"),E.parentNode.removeChild(E))):y!==E.textContent.replace(/\s/g,"")&&([t,E].forEach(function(e){e.setAttribute("data-cssvars-job",g.job),e.setAttribute("data-cssvars-group",h)}),E.textContent=i,p.push(i),m.push(E),E.parentNode||t.parentNode.insertBefore(E,t.nextSibling))}}else t.textContent.replace(/\s/g,"")!==i&&p.push(i)}catch(w){o(w.message,t)}c&&t.setAttribute("data-cssvars","skip"),t.hasAttribute("data-cssvars-job")||t.setAttribute("data-cssvars-job",g.job)}),C=n.rootElement.querySelectorAll('[data-cssvars]:not([data-cssvars="out"])').length,n.shadowDOM)for(var h,y=[].concat(n.rootElement).concat([].slice.call(n.rootElement.querySelectorAll("*"))),w=0;h=y[w];++w){if(h.shadowRoot&&h.shadowRoot.querySelector("style"))A(e({},n,{rootElement:h.shadowRoot}))}n.updateDOM&&v&&function(e){var t=["animation-name","-moz-animation-name","-webkit-animation-name"].filter(function(e){return getComputedStyle(document.body)[e]})[0];if(t){for(var r=[].slice.call(e.querySelectorAll("*")),n=[],o="__CSSVARSPONYFILL-KEYFRAMES__",s=0,a=r.length;s<a;s++){var c=r[s];"none"!==getComputedStyle(c)[t]&&(c.style[t]+=o,n.push(c))}document.body.offsetHeight;for(var i=0,u=n.length;i<u;i++){var l=n[i].style;l[t]=l[t].replace(o,"")}}}(n.rootElement),E=!1,n.onComplete(p.join(""),m,JSON.parse(JSON.stringify(S.job)),_()-n.__benchmark),a(m.length)}}}));else document.addEventListener("DOMContentLoaded",function e(r){A(t),document.removeEventListener("DOMContentLoaded",e)})}}function k(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:location.href,r=document.implementation.createHTMLDocument(""),n=r.createElement("base"),o=r.createElement("a");return r.head.appendChild(n),r.body.appendChild(o),n.href=t,o.href=e,o.href}function _(){return v&&(window.performance||{}).now?window.performance.now():(new Date).getTime()}function j(e){var t=arguments.length>1&&void 0!==arguments[1]&&arguments[1];[].slice.call(e.querySelectorAll('[data-cssvars="skip"],[data-cssvars="src"]')).forEach(function(e){return e.setAttribute("data-cssvars","")}),t&&(S.dom={})}A.reset=function(){for(var e in g.job=0,g.group=0,E=!1,w&&(w.disconnect(),w=null),C=0,x=null,O=!1,S)S[e]={}};export{A as default};
